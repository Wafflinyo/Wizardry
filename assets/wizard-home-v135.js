/* Wizardry home, local wizard saves, grimoire editor and link-based host lobbies. */
(function(){'use strict';
const api=window.WIZARDRY_ARENA_TEST,B=window.WizardryBuilds,cards=api.cards,portal=document.getElementById('portal'),KEY='wizardry.wizards.v135';

let saved=[],active=null,draft=null,step=0,view='home',previewFrame=0,joinCode=new URLSearchParams(location.search).get('lobby');
function withLegalDeck(profile){
 const current=Array.isArray(profile.deck)?profile.deck:[];
 const migrated=current.map(id=>id==='perfectdefense'?'sentinelfissure':id==='golem'?'rogginbowler':id);
 const mp=B.migrateRogue(cards,{...profile,deck:migrated});return B.normalize({...mp,deck:B.fillOwned(cards,mp)},cards,true);
}
try{
 const profiles=JSON.parse(localStorage.getItem(KEY)||'[]');
 for(const profile of profiles){try{saved.push(withLegalDeck(profile));}catch{}}
}catch{}

const ACCOUNT_KEY='wizardry.account.v1',CACHE_KEY='wizardry.cloud.v1.',ACCOUNT_ENDPOINT='https://vocaddalptoghysgdkvh.supabase.co/functions/v1/wizardry-account';
let account=null,flight=null,conflict=null,expired=false,busyAccount=false,cloudMessage='';
function stored(key,fallback){try{return JSON.parse(localStorage.getItem(key)||'null')??fallback;}catch{return fallback;}}
function legalCollection(rows){if(!Array.isArray(rows))throw Error('Invalid wizard collection.');return rows.map(withLegalDeck);}
function guestCollection(){return stored(KEY,[]).flatMap(p=>{try{return [withLegalDeck(p)];}catch{return [];}});}
function cloudStatus(message){cloudMessage=message;const n=el('cloudStatus');if(n)n.textContent=message;}
function cacheAccount(a=account,rows=saved){localStorage.setItem(CACHE_KEY+a.username,JSON.stringify({revision:a.revision,dirty:a.dirty,wizards:rows}));}
async function cloudRequest(action,body={}){
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),15000);
 try{const r=await fetch(ACCOUNT_ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,...body}),signal:controller.signal});const d=await r.json();if(!r.ok){const e=Error(d.error||'Account request failed.');e.status=r.status;e.data=d;throw e;}return d;}finally{clearTimeout(timer);}
}
function adoptCloud(d,token){
 const remote=legalCollection(d.wizards),cache=stored(CACHE_KEY+d.username,null);
 const next={username:d.username,token,revision:d.revision,dirty:false};let rows=remote;conflict=null;expired=false;
 if(cache?.dirty){rows=legalCollection(cache.wizards);next.dirty=true;next.revision=cache.revision;if(cache.revision!==d.revision)conflict={revision:d.revision,wizards:remote};}
 cacheAccount(next,rows);localStorage.setItem(ACCOUNT_KEY,JSON.stringify({username:next.username,token}));
 account=next;saved=rows;active=null;draft=null;onlineProfile=null;
 cloudStatus(conflict?'Cloud conflict · resolve in Account':next.dirty?'Changes pending sync':'Cloud saves up to date');
}
function saveCollection(next){
 if(!account){localStorage.setItem(KEY,JSON.stringify(next));saved=next;return;}
 if(next.length>100)throw Error('An account can hold up to 100 wizards.');
 const previous=account.dirty;account.dirty=true;try{cacheAccount(account,next);}catch(e){account.dirty=previous;throw e;}
 saved=next;cloudStatus(conflict?'Cloud conflict · changes saved on this device':'Saving to cloud…');void flushCloud();
}
function flushCloud(){
 if(flight)return flight;
 if(!account||!account.dirty)return Promise.resolve(true);
 if(conflict||expired)return Promise.resolve(false);
 const owner=account;
 flight=(async()=>{try{
  while(owner===account&&owner.dirty){
   const snapshot=JSON.stringify(saved),d=await cloudRequest('save',{token:owner.token,revision:owner.revision,wizards:JSON.parse(snapshot)});
   if(owner!==account)return false;
   owner.revision=d.revision;owner.dirty=JSON.stringify(saved)!==snapshot;
   try{cacheAccount(owner);}catch(e){owner.dirty=true;throw e;}
  }
  cloudStatus('Cloud saves up to date');return true;
 }catch(e){if(owner!==account)return false;
  if(e.status===409){conflict={revision:e.data.revision,wizards:legalCollection(e.data.wizards)};cloudStatus('Cloud conflict · resolve in Account');}
  else if(e.status===401){expired=true;cloudStatus('Session expired · sign in again');}
  else cloudStatus('Cloud unavailable · changes saved on this device');
  if(view==='account')render();return false;
 }finally{flight=null;}})();return flight;
}
async function accountLogin(mode,username,password){
 if(busyAccount)return;busyAccount=true;
 try{if(account&&username.trim().toLowerCase()!==account.username)throw Error('Sign back into the same account to recover pending changes.');
 if(flight)await flight;const d=await cloudRequest(mode,{username,password});adoptCloud(d,d.token);screen('account');void flushCloud();}
 finally{busyAccount=false;}
}
async function restoreAccount(){
 const session=stored(ACCOUNT_KEY,null);if(!session?.username||!session?.token)return;
 screen('accountLoading');
 try{const d=await cloudRequest('get',{token:session.token});adoptCloud(d,session.token);screen('home');void flushCloud();}
 catch(e){const cache=stored(CACHE_KEY+session.username,null);
  if(cache&&Array.isArray(cache.wizards)){account={username:session.username,token:session.token,revision:cache.revision,dirty:!!cache.dirty};saved=legalCollection(cache.wizards);expired=e.status===401;cloudStatus(expired?'Session expired · sign in again':'Offline · using account saves on this device');screen('home');}
  else{localStorage.removeItem(ACCOUNT_KEY);screen('home');error('Could not load your account. Sign in again. Guest saves are separate.');}}
}
async function signOutAccount(){
 if(!account||busyAccount)return;busyAccount=true;
 try{if(account.dirty&&!await flushCloud())throw Error('Your changes are still on this device. Resolve the sync issue before signing out.');
 try{await socialRequest('offline');}catch{}
 try{await cloudRequest('logout',{token:account.token});}catch(e){if(e.status!==401)throw Error('Unable to sign out safely. Try again when connected.');}
 localStorage.removeItem(ACCOUNT_KEY);localStorage.removeItem(CACHE_KEY+account.username);account=null;resetSocial();conflict=null;expired=false;cloudMessage='';saved=guestCollection();active=null;draft=null;onlineProfile=null;screen('home');}finally{busyAccount=false;}
}
function importGuest(){
 const additions=guestCollection().filter(p=>!saved.some(q=>q.id===p.id));if(!additions.length)throw Error('No new browser wizards to import.');saveCollection([...saved,...additions]);render();
}
function resolveCloud(keepDevice){
 if(!account||!conflict)return;
 if(!window.confirm(keepDevice?'Replace cloud saves with this device’s collection? Other-device progress may be overwritten.':'Use cloud saves instead? This device’s unsynced progress will be backed up locally.'))return;
 const other=conflict;localStorage.setItem(CACHE_KEY+account.username+'.conflictBackup',JSON.stringify({device:saved,cloud:other.wizards,date:Date.now()}));
 const next=keepDevice?saved:other.wizards,updated={...account,revision:other.revision,dirty:keepDevice};cacheAccount(updated,next);
 account=updated;saved=next;active=null;draft=null;onlineProfile=null;conflict=null;cloudStatus(keepDevice?'Changes pending sync':'Cloud saves up to date');render();void flushCloud();
}
function renderAccount(){
 const additions=guestCollection().filter(p=>!saved.some(q=>q.id===p.id)).length;
 shell('<section class="portal-hero"><h1>Wizardry Account</h1><p>Signed in as <strong>'+escape(account.username)+'</strong> · '+saved.length+' saved wizard(s)</p>'+(conflict?'<div class="network-notice"><p>Another device updated your collection. Choose which copy to keep. Both copies will be backed up locally.</p><div class="portal-actions">'+btn('Use cloud saves','cloudUseRemote')+btn('Keep this device’s saves','cloudUseLocal')+'</div></div>':'')+(additions?'<p>'+additions+' browser wizard(s) available to import. Original guest saves stay on this device.</p>':'')+'<div class="menu-stack">'+(additions?btn('Import browser wizards','cloudImport','primary'):'')+btn(expired?'Sign in again':'Retry cloud sync',expired?'cloudLogin':'cloudRetry')+btn('Sign Out','cloudLogout')+btn('Back to Main Menu','home','subtle')+'</div></section>');
}
function renderAccountLogin(signup){
 shell('<section class="portal-hero"><h1>'+(signup?'Create Account':'Log In')+'</h1><p>Save your wizards across devices.</p><form id="cloudForm" class="menu-stack"><label class="field"><span>Username</span><input name="username" autocomplete="username" autocapitalize="none" spellcheck="false" pattern="[A-Za-z0-9_]{3,24}" minlength="3" maxlength="24" required value="'+escape(account?.username||'')+'" '+(account?'readonly':'')+'></label><label class="field"><span>Password</span><input name="password" type="password" autocomplete="'+(signup?'new-password':'current-password')+'" minlength="10" maxlength="72" required></label>'+(signup?'<label class="field"><span>Confirm password</span><input name="confirm" type="password" autocomplete="new-password" required></label><p class="portal-note">Username: 3–24 letters, numbers or underscores. Password: at least 10 characters. No password recovery is available yet.</p>':'')+'<button type="submit" class="portal-btn primary">'+(signup?'Create Account':'Log In')+'</button></form><div class="portal-actions">'+(!account?btn(signup?'Already have an account? Log in':'Create Account',signup?'cloudLogin':'cloudSignup','subtle'):'')+btn('Back',account?'cloudAccount':'home','subtle')+'</div></section>');
}


const SOCIAL_ENDPOINT='https://vocaddalptoghysgdkvh.supabase.co/functions/v1/wizardry-social';
let socialOwner=null,socialData={friends:[],invites:[]},socialFlight=null,socialAt=0,socialSignature='',socialBusy=false,pendingSocialInvite=null;
const socialDialog=()=>el('friendsDialog');
const socialError=message=>{const n=el('friendsStatus');if(n)n.textContent=message;};
async function socialRequest(action,payload={}){
 if(!account||expired)throw Error('Sign in to use friends.');
 const owner=account.token,controller=new AbortController(),timer=setTimeout(()=>controller.abort(),12000);
 try{
  const r=await fetch(SOCIAL_ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,token:owner,payload}),signal:controller.signal});
  const d=await r.json();if(account?.token!==owner)throw Error('Account changed.');
  if(!r.ok)throw Error(d.error||'Friends request failed.');return d;
 }finally{clearTimeout(timer);}
}
function updateFriendBadge(){
 const count=socialData.invites.length+socialData.friends.filter(f=>f.state==='incoming').length;
 const b=el('friendsMenuButton');if(b)b.textContent='Friends'+(count?' ('+count+')':'');
}
function resetSocial(){
 socialOwner=account?.token||null;socialData={friends:[],invites:[]};socialAt=0;socialSignature='';pendingSocialInvite=null;
 updateFriendBadge();if(!account&&socialDialog()?.open)socialDialog().close();
}
function renderSocial(force=false){
 updateFriendBadge();
 if(!socialDialog()?.open)return;
 const canInvite=!!(session.isHost&&session.roomId&&session.lobby?.phase==='lobby'&&session.lobby.kind!=='match'&&(session.lobby.kind!=='party'||(session.lobby.matchmaking?.status||'idle')==='idle'));
 const signature=JSON.stringify([socialData,canInvite]);if(!force&&socialSignature===signature)return;socialSignature=signature;
 const action=(label,kind,user,id)=>'<button type="button" class="portal-btn small" data-social-action="'+kind+'" '+(user?'data-social-user="'+escape(user)+'" ':'')+(id?'data-social-id="'+escape(id)+'"':'')+'>'+label+'</button>';
 const row=(name,status,buttons)=>'<div class="social-row"><div><strong>'+escape(name)+'</strong><small>'+escape(status)+'</small></div><div class="social-actions">'+buttons+'</div></div>';
 const groups=[['Friends',socialData.friends.filter(f=>f.state==='friend').sort((a,b)=>Number(b.online)-Number(a.online)||a.username.localeCompare(b.username)),f=>row(f.username,f.online?'● Online':'○ Offline',(canInvite?action('Invite','invite',f.username):'')+action('Remove','remove',f.username))],['Friend requests',socialData.friends.filter(f=>f.state==='incoming'),f=>row(f.username,'Wants to be your friend',action('Accept','accept',f.username)+action('Decline','remove',f.username))],['Sent requests',socialData.friends.filter(f=>f.state==='outgoing'),f=>row(f.username,'Pending',action('Cancel','remove',f.username))]];
 el('friendsList').innerHTML=(canInvite?'<p class="portal-note">Invite friends into your current '+(towerLobby?'Tower':'Online Battles')+' lobby.</p>':'<p class="portal-note">Host a Tower or Online Battles lobby to invite friends.</p>')+groups.map(([name,rows,html])=>'<section><h3>'+name+' · '+rows.length+'</h3>'+(rows.map(html).join('')||'<p class="portal-note">None yet.</p>')+'</section>').join('');
 el('friendsInvites').innerHTML='<h3>Game invitations · '+socialData.invites.length+'</h3>'+(socialData.invites.map(i=>row(i.username,i.tower?'Caglimot Tower':'Online Battles',action('Join','inviteAccept',null,i.id)+action('Decline','inviteDecline',null,i.id))).join('')||'<p class="portal-note">No pending invites.</p>');
}
function fillSocialWizards(){
 const select=el('friendsWizard'),old=select.value;
 select.innerHTML=saved.map(p=>'<option value="'+escape(p.id)+'">'+escape(p.name)+' · Lv '+p.level+'</option>').join('');
 if(saved.some(p=>p.id===old))select.value=old;else if(active&&saved.some(p=>p.id===active.id))select.value=active.id;
 if(!saved.length)select.innerHTML='<option value="">Create a wizard first</option>';
}
async function pollSocial(force=false){
 if(socialOwner!==account?.token)resetSocial();
 if(!account||expired||document.hidden||(!force&&Date.now()-socialAt<10000))return;
 if(socialFlight)return socialFlight;
 const owner=account.token;socialAt=Date.now();
 socialFlight=(async()=>{try{const d=await socialRequest('list');if(account?.token!==owner)return;
 socialData={friends:Array.isArray(d.friends)?d.friends:[],invites:Array.isArray(d.invites)?d.invites:[]};renderSocial();
 }catch(e){if(account?.token===owner&&socialDialog()?.open)socialError(e.message);}finally{socialFlight=null;}})();
 return socialFlight;
}
async function openFriends(){
 if(!account||expired){error('Sign in to use friends.');return;}
 if(socialOwner!==account.token)resetSocial();
 const dialog=socialDialog();if(!dialog)return;
 if(!dialog.open)dialog.showModal();fillSocialWizards();socialError('');renderSocial(true);await pollSocial(true);
}
async function finishSocialJoin(invite){
 if(account?.token!==invite.owner)throw Error('Account changed.');
 try{const latest=await socialRequest('inviteAccept',{id:invite.id});if(latest.roomId!==invite.roomId||latest.tower!==invite.tower)throw Error('Invitation changed. Open Friends again.');
  if(await join(latest.roomId,latest.tower)){try{await socialRequest('inviteDecline',{id:invite.id});}catch{}void pollSocial(true);}
 }catch(e){error(e.message);}
}
async function acceptSocialInvite(id){
 if(document.body.dataset.screen==='battle'||session.active)throw Error('Finish your current battle before joining another.');
 const wizard=saved.find(p=>p.id===el('friendsWizard').value);if(!wizard)throw Error('Select a saved wizard first.');
 const d=await socialRequest('inviteAccept',{id});if(d.tower&&wizard.rogue?.pending)throw Error('Claim this wizard’s pending Tower spells before joining.');
 if(session.roomId&&!window.confirm('Leave your current lobby and join this friend?'))return;
 if(['create','towerDeck','spellDraft','wizardTester'].includes(view)&&!window.confirm('Leave the current editor and join this friend? Unsaved edits will be lost.'))return;
 if(session.roomId)closeSession();active=wizard;onlineProfile=null;towerMessage='';api.configureProfile(active);
 socialDialog().close();const invite={id,owner:account.token,roomId:d.roomId,tower:d.tower};
 if(!d.tower&&!ownBuildReady()){pendingSocialInvite=invite;buildOnline();return;}
 if(!d.tower)onlineProfile=active;await finishSocialJoin(invite);
}
async function onSocialAction(button){
 if(socialBusy)return;socialBusy=true;button.disabled=true;
 try{
  const action=button.dataset.socialAction,username=button.dataset.socialUser,id=button.dataset.socialId;
  if(action==='inviteAccept'){await acceptSocialInvite(id);return;}
  if(action==='remove'&&socialData.friends.some(f=>f.username===username&&f.state==='friend')&&!window.confirm('Remove '+username+' from your friends?'))return;
  if(action==='invite'&&(!session.isHost||session.lobby?.phase!=='lobby'))throw Error('Host an open lobby first.');
  await socialRequest(action,action==='invite'?{username,roomId:session.roomId,lobbyToken:session.token}:id?{id}:{username});
  socialError(action==='invite'?'Invitation sent.':action==='accept'?'Friend added.':'Updated.');await pollSocial(true);
 }catch(e){socialError(e.message);}finally{socialBusy=false;button.disabled=false;}
}

let onlineDraft=false,onlineProfile=null,towerLobby=false,towerMessage='';
let libraryTestProfile=null;
let binderElement='',deckDraft=null,deckReturn='progression',draftReturn='tower',offerChoices={};
let lastResult=null,startingFloor=false,submittingReady=false;
const incomingTower=new URLSearchParams(location.search).get('tower')==='1';
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const el=id=>document.getElementById(id),title=e=>B.names[e],btn=(text,action,cls='')=>`<button class="portal-btn ${cls}" data-action="${action}">${text}</button>`;
function error(message){let n=el('portalError');if(!n){n=document.createElement('div');n.id='portalError';n.className='portal-error';n.setAttribute('role','alert');portal.prepend(n);}n.textContent=String(message);}
function shell(content){portal.innerHTML=`<div class="portal-shell"><header class="portal-top"><div class="wordmark studio-credit"><span aria-hidden="true">✦</span> Wafflinyo Studio Presents</div><button type="button" class="portal-btn small menu-music" data-menu-music aria-label="Menu music" aria-pressed="true">Music On</button><button type="button" class="portal-btn small" data-audio-settings>Audio</button>${account?'<button type="button" id="friendsMenuButton" class="portal-btn small" data-friends-open>Friends</button>':''}</header>${account?`<p id="cloudStatus" class="portal-note" role="status">${escape(cloudMessage)}</p>`:''}${content}</div>`;window.WizardryMenuMusic?.sync();if(account){updateFriendBadge();void pollSocial();}}
function screen(next){deleteId=null;view=next;document.body.dataset.portalView=next;document.body.dataset.screen='home';cancelAnimationFrame(previewFrame);render();}
function summary(p){const s=B.stats(p);return `<div class="stats-strip"><span><b>${s.hp.toLocaleString()}</b>HP</span><span><b>${s.mana}</b>Mana</span><span><b>${p.level}</b>Level</span></div>`;}
function render(){
 if(view==='home')shell(`<section class="portal-hero game-menu"><h1>Wizardry : <span>The Fall of Lupen’s Kingdom</span></h1><nav class="menu-stack" aria-label="Main menu">${account?btn('Account · '+escape(account.username),'cloudAccount'):btn('Log In','cloudLogin','primary')+btn('Create Account','cloudSignup')}${btn('New Wizard','create',account?'primary':'')}${btn('Load Wizard','load')}${saved.some(p=>p.towerCleared)?btn('Weilei’s Library of Spells','librarySelect'):''}${btn('Test Mode','tests')}</nav>${!account?'<p class="portal-note">Guest mode · progress stays in this browser until imported into an account.</p>':''}${joinCode?'<p class="network-notice">Load or create a wizard to use your lobby invite.</p>':''}</section>`);
 if(view==='accountLoading')shell('<section class="portal-hero"><h1>Loading account…</h1></section>');
 if(view==='account'&&account)renderAccount();
 if(view==='login'||view==='signup')renderAccountLogin(view==='signup');
 if(view==='tests')shell(`<section class="portal-hero game-menu"><h1>Test Mode</h1><nav class="menu-stack" aria-label="Test Mode">${btn('New Card Tester','cardTester','primary')}${btn('Wizard Creation Tester','wizardTester')}${btn('Library Tester','libraryTester')}${btn('Back to Main Menu','home','subtle')}</nav></section>`);
 if(view==='load'){shell(`<div class="portal-heading"><div><p class="portal-eyebrow">YOUR WIZARDS</p><h1>Load a wizard</h1></div>${btn('Back','home','subtle')}</div><div class="saved-list">${saved.length?saved.map(p=>`<article class="portal-panel saved-card"><p class="portal-eyebrow">${p.masteries.map(title).join(' + ')} MASTER</p><h2>${escape(p.name)}</h2>${summary(p)}<p class="portal-note">${p.deck.length} cards · ${p.level-B.stats(p).remaining} skill points allocated</p><div class="portal-actions"><button class="portal-btn primary" data-load="${escape(p.id)}">Load</button><button class="portal-btn subtle" data-edit="${escape(p.id)}">Edit build</button><button class="portal-btn subtle" data-delete-wizard="${escape(p.id)}">Delete</button></div>${deleteId===p.id?`<div class="network-notice"><p>Delete ${escape(p.name)} ${account?'from your account on all devices':'from this browser'}?</p><div class="portal-actions"><button class="portal-btn" data-confirm-wizard="${escape(p.id)}">Delete wizard</button><button class="portal-btn subtle" data-cancel-delete>Cancel</button></div></div>`:''}</article>`).join(''):'<p>No saved wizards yet. Create your first wizard to begin.</p>'}</div>`);}
 if(view==='create'||view==='wizardTester')renderCreator();
 if(view==='hub'&&active){
   shell(`<div class="portal-heading"><h1>${escape(active.name)}</h1></div><div class="create-grid"><aside class="portal-panel wizard-display"><canvas id="wizardPreview" width="360" height="340"></canvas>${summary(active)}${btn('Edit Wizard & Grimoire','edit','subtle')}</aside><nav class="portal-panel menu-stack" aria-label="Wizard menu">${btn('CPU Battles','cpu','primary')}${btn('Caglimot Tower','tower')}${active.towerCleared?btn('Weilei’s Library of Spells','library'):''}${btn('Online Battles','online')}${joinCode?btn('Join Invited Lobby','invited'):''}${btn('Back to Main Menu','home','subtle')}</nav></div>`);
   animatePreview(active);
 }
 if(view==='cpu')shell(`<section class="portal-hero"><h1>CPU Battles</h1><div class="practice-sizes">${[1,2,3,4].map(n=>`<button class="portal-btn" data-practice="${n}">${n}v${n}</button>`).join('')}</div>${btn('Back','hub','subtle')}</section>`);
 if(view==='tower'&&active)renderTower();
 if(view==='progression'&&active)renderProgression();
 if(view==='towerDeck'&&deckDraft)renderTowerDeck();
 if(view==='spellDraft'&&active)renderSpellDraft();
 if(view==='librarySelect')renderLibrarySelect();
 if(view==='library'&&active)renderLibrary();
 if(view==='libraryTester'&&libraryTestProfile)renderLibrary(libraryTestProfile,true);
 if(view==='online'&&active)renderOnline();
 if(view==='custom'&&active)renderCustom();
 if(view==='lobby')renderLobby();
}
const nameLists=[
 "Alden Althea Amara Ansel Arden Aster Audra Bastian Briar Calla Caspian Cedric Celia Cleo Dahlia Dorian Edric Elara Elian Elowen Emrys Esme Estel Evander Faye Felix Flora Galen Gideon Hazel Idris Iona Isolde Jasper Juniper Kellan Kestrel Liora Lucan Lyra Maelis Maren Milo Mira Nadia Nessa Nolan Nyra Orin Orla Perrin Petra Quill Rafe Rhea Rowan Sable Selene Silas Sorrel Sylvie Talia Tamsin Thane Torin Una Vesper Violet Wren Yara Zev Acacia Ada Aella Alaric Alina Anika Arlen Astor Aurelia Avra Blythe Brann Brisa Calder Carys Cato Cerys Corin Cosima Cyra Dalia Dara Darian Delia Eira Elise Ember Enid Eren Etta Fenna Finn Freya Griffin Harlan Haven Iden Ilara Imani Iris Iriska Jaina Jorah Jules Keira Kit Kora Laszlo Leona Lyle Malin Maris Merrin Minna Neri Niall Nova Odessa Oona Orion Oren Pasha Pippa Quinn Remy Riven Romy Saffron Seren Soren Tabin Tessa Thalia Tova Ursa Vanya Viola Wystan Xara Ysolde Zora",
 "Amber Ash Birch Bloom Bramble Bright Brook Cinder Coral Dawn Dew Dusk Elm Ember Fern Flint Fog Frost Gale Glimmer Glow Gold Grove Hail Hearth Holly Ivory Jade Lark Leaf Lumen Mist Moon Moss Night Oak Onyx Pearl Pine Rain Reed River Rune Sage Shade Silver Sky Snow Spark Star Stone Storm Sun Thorn Tide Vale Wave Wind Winter Acorn Alder Alpine Aspen Azure Badger Bay Beacon Berry Bronze Burrow Candle Cedar Chalk Cliff Cloud Clover Coal Copper Cove Crow Crystal Cypress Finch Fir Fox Fable Glade Granite Grey Hawthorn Heron Honey Ice Iris Lake Linden Lotus Maple Marsh Meadow Mirth Mulberry Oriel Orchid Otter Owl Pebble Quartz Raven Rook Rose Rowan Sable Sand Shell Slate Sleet Smoke Sorrel Spruce Squirrel Swan Swift Timber Umber Velvet Violet Wasp Wheat Willow Wolf Yarrow Yew",
 "bark beam bell bend blaze bloom brook chime crest dancer drift fall feather field fin flare flight forge frost glen glow grove guard harbor haven helm hill hollow keeper lace leaf light lock mantle mark mere mill path peak petal quill reach ridge rise root runner shade shard shine song spire spring step thorn thread tide trail vale veil walker ward watch weaver well whisper wing wood woven arch ash awn badge bank bloomlet bolt bone branch braid bridge brim brush bud burn cairn coast crown dale dapple dash dawn dells dome down draw dream fen flick flow flute foam gleam gold grace grain gull gust hearth horn isle lamp latch loom marsh mast mound nest nook oath plume pool rain reed rill roost rush scent scroll shell shore skein sky sleet smoke spirelet spray stone strand surf sweep talon tarn torch tuft valelet vane vault vine wake wane warp wisp wold wreathe"
].map(list=>list.split(' '));
const sortedNameLists=nameLists.map(list=>[...list].sort());
const nameLabels=['First name','Surname beginning','Surname ending'];
let nameParts=['','',''],originalDraftName='',deleteId=null;
function nameFields(){
 return `<div class="portal-actions">${btn('Randomize name','randomName','small subtle')}</div><div class="field-grid">${sortedNameLists.map((list,i)=>`<div class="field"><label for="namePart${i}">${nameLabels[i]}</label><div class="name-part-row"><select id="namePart${i}" data-name-part="${i}"><option value="">Choose ${nameLabels[i].toLowerCase()}</option>${list.map(name=>`<option value="${name}" ${name===nameParts[i]?'selected':''}>${name}</option>`).join('')}</select><button type="button" class="portal-btn name-refresh" data-random-name-part="${i}" aria-label="Randomize ${nameLabels[i].toLowerCase()}" title="Randomize ${nameLabels[i].toLowerCase()}"><svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 11a8 8 0 1 0-2 6M20 4v7h-7"/></svg></button></div></div>`).join('')}</div>`;
}
function loadNameParts(name){
 const [given,surname]=name.split(' ');
 const prefix=nameLists[1].find(part=>surname?.startsWith(part)&&nameLists[2].includes(surname.slice(part.length)));
 return prefix&&nameLists[0].includes(given)&&name===given+' '+surname?[given,prefix,surname.slice(prefix.length)]:['','',''];
}
function syncNamePreview(){
 draft.name=nameParts.every(Boolean)?nameParts[0]+' '+nameParts[1]+nameParts[2]:originalDraftName;
 const preview=el('previewName');if(preview)preview.textContent=nameParts.some(Boolean)&&!nameParts.every(Boolean)?'Your wizard':draft.name||'Your wizard';
}
function randomizeNamePart(i){
 if(!Number.isInteger(i)||i<0||i>=nameLists.length)return;
 const choices=nameLists[i].filter(part=>part!==nameParts[i]);if(!choices.length)return;
 nameParts[i]=choices[Math.floor(Math.random()*choices.length)];
 const select=el('namePart'+i);if(select)select.value=nameParts[i];
 syncNamePreview();
}
function requireName(){
 if(!draft.name||(nameParts.some(Boolean)&&!nameParts.every(Boolean)))throw Error('Choose all three name parts.');
}
function create(test=false){onlineDraft=false;binderElement='';nameParts=['','',''];originalDraftName=test?'Test Wizard':'';draft={id:crypto.randomUUID(),name:'',level:test?20:1,masteries:['water','wind'],skills:{hp:0,mana:0,...Object.fromEntries(B.elements.map(e=>[e,0]))},...(!test?B.rogueStarter(cards,['water','wind']):{deck:B.progressionDeck(cards,['water','wind'],20)}),robeColor:B.colors[0],hatColor:B.colors[0],skinColor:B.skins[0]};step=0;if(test){draft.name='Test Wizard';const params=new URLSearchParams(location.search),hair=params.get('hair');if(['hood','top'].includes(params.get('hat')))draft.hat=params.get('hat');if(B.skins.includes(params.get('skin')))draft.skinColor=params.get('skin');if(Object.hasOwn(B.gear.bootColor.options,params.get('boots')))draft.bootColor=params.get('boots');if(['curlyMedium','curlyLong'].includes(hair))draft.headHair=hair;}screen(test?'wizardTester':'create');}
function selectOptions(values,value){return values.map(v=>`<option value="${v}" ${value===v?'selected':''}>${escape((window.WizardryPalettes?.robeColors?.[v]||window.WizardryPalettes?.skinColors?.[v]||v))}</option>`).join('');}
function gearField(key){const field=B.gear[key];return `<div class="field"><label for="gear-${key}">${field.label.toUpperCase()}</label><select id="gear-${key}" data-gear="${key}">${Object.entries(field.options).map(([value,label])=>`<option value="${value}" ${(draft[key]||"original")===value?"selected":""}>${label}</option>`).join("")}</select></div>`;}
function renderCreator(){
 const testing=view==='wizardTester';
 const stats=B.stats(draft),steps=['Appearance','Masteries','Skill points','Grimoire'];
 let content='';
 if(step===0)content=`<h2>Give your wizard an identity</h2><p>This name appears in online lobbies and battles.</p>${nameFields()}<div class="field-grid"><div class="field"><label for="createRobe">ROBE COLOR</label><select id="createRobe">${Object.entries(B.clothingOptions).map(([value,name])=>`<option value="${value}" ${value===draft.robeColor?'selected':''}>${escape(name)}</option>`).join('')}</select></div>${gearField("robeTrim")}<div class="field"><label for="createHat">HAT COLOR</label><select id="createHat">${Object.entries(B.clothingOptions).map(([value,name])=>`<option value="${value}" ${value===draft.hatColor?'selected':''}>${escape(name)}</option>`).join('')}</select></div>${gearField("hatTrim")}<div class="field"><label for="createHeadHair">HEAD HAIR STYLE</label><select id="createHeadHair">${Object.entries({none:'No hair',medium:'Medium hair',long:'Long hair',curlyMedium:'Curly medium',curlyLong:'Curly long'}).map(([value,label])=>`<option value="${value}" ${value===(draft.headHair||'none')?'selected':''}>${label}</option>`).join('')}</select></div>${gearField("hairColor")}<div class="field"><label for="createFacialHair">FACIAL HAIR</label><select id="createFacialHair"><option value="original">Original</option><option value="none" ${draft.facialHair==='none'?'selected':''}>Clean-shaven</option></select></div>${gearField("beardColor")}<div class="field"><label for="createSkin">SKIN COLOR</label><select id="createSkin">${selectOptions(B.skins,draft.skinColor)}</select></div>${gearField("bootColor")}${gearField("staffSculpt")}${gearField("staffWood")}${gearField("crystalColor")}</div>`;
 if(step===1)content=`<h2>Choose your elemental masteries</h2><p>Choose one or two elements. Your grimoire can contain only those elements. Changing masteries resets your grimoire and refunds points from a removed element.</p><div class="mastery-grid">${B.elements.map(e=>`<button class="mastery-tile ${draft.masteries.includes(e)?'selected':''}" data-mastery="${e}" aria-pressed="${draft.masteries.includes(e)}"><i>${window.WIZARDRY_ELEMENT_TRACE_V45.svgFor(e)}</i>${title(e)}<small>${cards.filter(c=>c.school===e).length} spells</small></button>`).join('')}</div>`;
 if(step===2)content=`<h2>Shape your build</h2><p>${onlineDraft?'Allocate all 20 skill points before saving.':'Allocate up to '+draft.level+' skill points at level '+draft.level+'.'} Mastery boosts apply to that element’s damage and healing.</p><div class="points-left">${stats.remaining} / ${draft.level} points remaining</div>${['hp','mana',...draft.masteries].map(k=>`<div class="skill-row"><div><strong>${k==='hp'?'HP':k==='mana'?'Mana':title(k)+' mastery'}</strong><small>${k==='hp'?'+150 HP per point':k==='mana'?'+2 mana per point':'+'+B.masteryPercentPerPoint+'% '+title(k)+' damage and healing per point'}</small></div><div class="skill-controls"><button data-skill="${k}" data-delta="-1" aria-label="Remove ${k} point" ${!draft.skills[k]?'disabled':''}>−</button><b>${draft.skills[k]||0}</b><button data-skill="${k}" data-delta="1" aria-label="Add ${k} point" ${!stats.remaining?'disabled':''}>+</button></div></div>`).join('')}<div class="portal-actions">${btn('Reset points','resetPoints','small subtle')}</div>`;
 if(step===3)content=renderBinder(draft);
 shell(`<div class="portal-heading"><div><p class="portal-eyebrow">${testing?'UNSAVED TEST BUILD':onlineDraft?'ONLINE BUILD · LEVEL 20':'WIZARD BUILD · LEVEL '+draft.level}</p><h1>${testing?'Wizard Creation Tester':onlineDraft?'Prepare for Online Battles':'Build Your Wizard'}</h1></div>${btn('Cancel','cancelBuild','subtle')}</div><div class="create-grid"><aside class="portal-panel wizard-display" data-creation-step="${step}">${testing||step===0?`<div class="preview-choices"><fieldset class="hair-choices"><legend>Hat style</legend>${Object.entries({hood:'Hood',top:'Top hat',pointed:'Pointed'}).map(([value,label])=>`<button type="button" class="portal-btn small" data-hat-style="${value}" aria-pressed="${value===(draft.hat||'pointed')}">${label}</button>`).join('')}</fieldset></div>`:''}<canvas id="wizardPreview" width="360" height="340"></canvas>${testing?'<label class="field">Preview animation<select id="previewPose"><option value="idle">Idle</option><option value="cast">Cast</option><option value="defeat">Defeat</option></select></label>':''}<h2 id="previewName">${escape(draft.name||'Your wizard')}</h2><p class="portal-note">${draft.masteries.map(title).join(' + ')||'Choose your mastery'}</p>${summary(draft)}<p class="portal-note">${draft.masteries.map(e=>`${title(e)} damage +${B.masteryBonusPercent(draft,e)}%`).join(' · ')}</p></aside><section class="portal-panel"><nav class="step-nav" aria-label="Wizard creation steps">${steps.map((s,i)=>`<button data-step="${i}" ${onlineDraft&&i===0?'disabled':''} class="${step===i?'active':''}">${i+1}. ${s}</button>`).join('')}</nav><div class="build-step">${content}</div><div class="create-bottom">${btn(step>(onlineDraft?1:0)?'Previous':'Cancel',step>(onlineDraft?1:0)?'previous':'cancelBuild','subtle')}${btn(step===3?(testing?'Finish test':'Save wizard'):'Continue',step===3?(testing?'home':'save'):'next','primary')}</div></section></div>`);animatePreview(draft);
 if(step===3)requestAnimationFrame(()=>api.drawCardArts());
}
function binderFace(card,profile,expanded=false){
 const info=api.cardInfo(card);
 const target=card.target==='team'||card.target==='all_enemies'?'Multi-target':'Single target';
 const range=card.heal||!info.base?null:B.range(card,profile);
 const amount=card.heal?`${B.healing(card,profile).toLocaleString()} healing`:range?`${range.low.toLocaleString()}–${range.high.toLocaleString()} damage`:'';
 const effect=info.effect===info.target?'':info.effect;
 const name=expanded?`<h2 id="binderCardTitle">${escape(card.name)}</h2>`:`<strong>${escape(card.name)}</strong>`;
 return `<span class="binder-card-top"><span class="binder-rune" aria-hidden="true">${window.WIZARDRY_ELEMENT_TRACE_V45.svgFor(card.school)}</span><span>${card.cost} mana</span></span><span class="binder-art" data-binder-art data-card="${card.id}"><canvas class="spell-art-canvas" width="240" height="196" aria-hidden="true"></canvas></span>${name}<span class="binder-meta">${escape(info.accuracy)}</span><span class="binder-effect"><b>${amount?amount+' · ':''}${target}</b>${effect?`<span>${escape(effect)}</span>`:''}</span>`;
}
function renderBinder(profile){
 if(!B.elements.includes(binderElement))binderElement=profile.masteries[0]||B.elements[0];
 const mastered=profile.masteries.includes(binderElement);
 const tabs=B.elements.map(e=>`<button class="portal-btn small" type="button" data-binder-element="${e}" aria-pressed="${e===binderElement}">${title(e)}</button>`).join('');
 const ordered=B.orderedSpells(cards,binderElement).filter(c=>!profile.rogue||profile.rogue.owned[c.id]>0);
 const required=profile.rogue?24:B.deckSize(B.unlockedSpells(cards,profile.masteries,profile.level));
 const unlocks=new Map(B.unlockOrder(cards,binderElement).map((card,index)=>[card.id,B.unlockLevel(index,profile.masteries.length)]));
 // Stable sort keeps the existing mana order within each unlock group.
 ordered.sort((a,b)=>Number(unlocks.get(a.id)>profile.level)-Number(unlocks.get(b.id)>profile.level));
 const page=ordered.map(card=>{
   const unlock=unlocks.get(card.id),locked=!profile.rogue&&profile.level<unlock;
   const count=profile.deck.filter(id=>id===card.id).length;
   return `<article class="binder-slot"><button type="button" class="binder-card school-${card.school}" data-binder-card="${card.id}" aria-label="View ${escape(card.name)}">${binderFace(card,profile)}${locked?`<span class="binder-unlock">Unlocks at level ${unlock}</span>`:''}</button><div class="deck-counter"><button type="button" data-deck="${card.id}" data-delta="-1" aria-label="Remove ${escape(card.name)}" ${!count?'disabled':''}>−</button><b aria-label="${count} copies">${count}${profile.rogue?"/"+B.copyLimit(profile,card.id):""}</b><button type="button" data-deck="${card.id}" data-delta="1" aria-label="Add ${escape(card.name)}" ${!mastered||locked||count>=B.copyLimit(profile,card.id)||profile.deck.length>=required?'disabled':''}>+</button></div></article>`;
 }).join('');
 return `<div class="binder-head"><h2>Grimoire binder</h2><p aria-live="polite">${profile.deck.length} / ${required} cards · ${profile.rogue?"Owned copies only":B.MAX_COPIES+" copies maximum"}</p></div><nav class="binder-tabs" aria-label="Grimoire elements">${tabs}</nav><div class="binder-tools">${btn('Fill deck','allCards','small subtle')}${btn('Clear deck','clearDeck','small subtle')}</div>${mastered?'':'<p class="portal-note">Choose this element as a mastery to add its cards.</p>'}<div class="binder-grid">${page}</div>`;
}
const cardDialog=el('binderCardDetail');
function inspectBinderCard(id){
 const card=cards.find(c=>c.id===id);
 if(!card)return;
 const profile=view==='libraryTester'?libraryTestProfile:['progression','library','spellDraft'].includes(view)?active:view==='towerDeck'?deckDraft:draft;
 cardDialog.innerHTML=`<button type="button" class="portal-btn small" data-close-binder autofocus>Close</button><div class="binder-card school-${card.school}">${binderFace(card,profile,true)}</div>`;
 if(!cardDialog.open)cardDialog.showModal();
 requestAnimationFrame(()=>api.drawCardArts());
}
cardDialog.addEventListener('click',e=>{if(e.target===cardDialog||e.target.closest('[data-close-binder]'))cardDialog.close();});
function renderTowerDeck(){
 shell(`<section class="portal-panel tower-deck"><h1>Edit Deck</h1>${renderBinder(deckDraft)}<div class="portal-actions">${btn('Save deck','saveTowerDeck','primary')}${btn('Cancel','cancelTowerDeck','subtle')}</div></section>`);
 requestAnimationFrame(()=>api.drawCardArts());
}
function editTowerDeck(destination='progression'){
 if(submittingReady||session.lobby?.players.some(p=>p.peerId===session.peerId&&p.ready&&session.lobby.phase==='lobby'))return;
 deckReturn=destination;deckDraft=structuredClone(active);binderElement=active.masteries[0];screen('towerDeck');
}
function saveTowerDeck(){
 const profile=B.normalize({... (deckReturn==='libraryTester'?libraryTestProfile:active),deck:deckDraft.deck},cards,true);
 if(deckReturn==='libraryTester')libraryTestProfile=profile;else{persistProfile(profile);onlineProfile=null;}deckDraft=null;screen(deckReturn);
}
function openSpellDraft(destination){draftReturn=destination;offerChoices={};screen('spellDraft');}
function renderSpellDraft(){
 const pending=active.rogue?.pending;if(!pending){screen(draftReturn);return;}
 const groups=pending.groups;
 shell(`<section class="portal-panel tower-draft"><p class="portal-eyebrow">LEVEL ${pending.level} · SPELL REWARD</p><h1>Choose your new spells</h1><p>Choose one spell from each offered element. Each grants three copies. Your deck stays at 24 cards.</p>${groups.map(g=>`<h2>${title(g.school)}</h2><div class="binder-grid draft-options">${g.ids.map(id=>{const card=cards.find(c=>c.id===id);return `<button type="button" class="binder-card school-${card.school} ${offerChoices[g.school]===id?'draft-picked':''}" data-draft-card="${id}" aria-pressed="${offerChoices[g.school]===id}">${binderFace(card,active)}<span class="draft-pick-label">${offerChoices[g.school]===id?'Selected':'Choose spell'}</span></button>`;}).join('')}</div>`).join('')}<div class="portal-actions"><button class="portal-btn primary" data-action="claimDraft" ${groups.every(g=>g.ids.includes(offerChoices[g.school]))?'':'disabled'}>Claim spells & edit deck</button></div></section>`);requestAnimationFrame(()=>api.drawCardArts());
}
function renderLibrarySelect(){
 const eligible=saved.filter(p=>p.towerCleared);
 shell(`<section class="portal-panel"><h1>Weilei’s Library of Spells</h1><p>Choose a wizard who has defeated Grelus.</p><div class="menu-stack">${eligible.map(p=>`<button class="portal-btn" data-library-wizard="${escape(p.id)}">${escape(p.name)} · ${p.rogue.gold} gold</button>`).join('')}${btn('Back','home','subtle')}</div></section>`);
}
function startLibraryTester(masteries=['water','wind']){
 let profile={id:'library-test-only',name:'Library Tester',level:1,masteries,skills:{},...B.rogueStarter(cards,masteries)};
 for(let floor=1;floor<=21;floor++){
  profile=B.awardFloor(cards,profile,floor,'library-test-floor-'+floor,()=>.5);
  if(profile.rogue.pending)profile=B.chooseOffer(cards,profile,Object.fromEntries(profile.rogue.pending.groups.map(g=>[g.school,g.ids[0]])));
 }
 libraryTestProfile=B.normalize(profile,cards,true);binderElement=masteries[0];screen('libraryTester');
}
function renderLibrary(profile=active,testing=false){
 if(!profile?.towerCleared){screen('hub');return;}
 if(!B.elements.includes(binderElement))binderElement=profile.masteries[0];
 const missing=B.orderedSpells(cards,binderElement).filter(c=>profile.masteries.includes(c.school)&&!profile.rogue.owned[c.id]);
 const tabs=B.elements.map(e=>`<button class="portal-btn small" data-binder-element="${e}" aria-pressed="${e===binderElement}">${title(e)}</button>`).join('');
 shell(`<section class="portal-panel library">${testing?`<div class="network-notice"><strong>Library Tester · temporary collection</strong><p>Test purchases and deck editing without changing your saved wizards.</p><div class="portal-actions">${btn("Reset test library","resetLibraryTester","small subtle")}</div><div class="binder-tabs" aria-label="Test masteries">${B.elements.map(e=>`<button class="portal-btn small" data-test-mastery="${e}" aria-pressed="${profile.masteries.includes(e)}">${title(e)}</button>`).join("")}</div><p class="portal-note">Select one or two masteries to simulate a cleared Tower run.</p></div>`:""}<div class="library-heading"><div class="library-portrait"><img src="./assets/weilei-library-portrait.webp?v=0.335.0" alt="Weilei wearing his spell-bound eyepatch"></div><div><p class="portal-eyebrow">CAGLIMOT TOWER · SPELL ARCHIVE</p><h1>Weilei’s Library of Spells</h1><strong class="library-gold">${profile.rogue.gold.toLocaleString()} gold</strong></div></div><nav class="binder-tabs" aria-label="Library elements">${tabs}</nav><p class="portal-note">Only unowned spells from your mastered elements are sold. Each purchase grants three copies.</p><div class="binder-grid">${missing.map(card=>`<article class="binder-slot"><button type="button" class="binder-card school-${card.school}" data-binder-card="${card.id}">${binderFace(card,profile)}</button><button class="portal-btn small" data-buy-spell="${card.id}" ${profile.rogue.gold<B.libraryPrice(card)?'disabled':''}>Buy ×3 · ${B.libraryPrice(card)} gold</button></article>`).join('')||'<p>No unowned spells in this element.</p>'}</div><div class="portal-actions">${btn('Edit deck','libraryDeck','primary')}${testing?btn('Back to Test Mode','tests','subtle'):btn('Back to Main Menu','home','subtle')}</div></section>`);requestAnimationFrame(()=>api.drawCardArts());
}
function animatePreview(p){cancelAnimationFrame(previewFrame);let last=0;function frame(now){const canvas=el('wizardPreview');if(!canvas)return;if(now-last>50){api.drawWizardPreview(canvas,p,el('previewPose')?.value);last=now;}previewFrame=requestAnimationFrame(frame);}previewFrame=requestAnimationFrame(frame);}
function readDraft(){if(el('createRobe')){draft.robeColor=el('createRobe').value;draft.hatColor=el('createHat').value;draft.headHair=el('createHeadHair').value;draft.facialHair=el('createFacialHair').value;draft.skinColor=el('createSkin').value;}}
function persistProfile(profile){
 const next=saved.some(p=>p.id===profile.id)?saved.map(p=>p.id===profile.id?profile:p):[...saved,profile];
 saveCollection(next);active=profile;
}
function save(){
 readDraft();requireName();
 if(onlineDraft&&B.stats(draft).remaining)throw Error('Allocate all 20 skill points for your online build.');
 const profile=B.normalize(draft,cards,true);
 if(onlineDraft){onlineProfile=profile;onlineDraft=false;screen('online');if(pendingSocialInvite){const invite=pendingSocialInvite;pendingSocialInvite=null;void finishSocialJoin(invite);}return;}
 persistProfile(profile);onlineProfile=null;api.configureProfile(profile);screen('hub');
}
function editProfile(profile){
 onlineDraft=false;binderElement='';draft=structuredClone(profile);originalDraftName=draft.name;nameParts=loadNameParts(draft.name);
 step=0;screen('create');
}
function ownBuildReady(){return active?.level===20&&B.stats(active).remaining===0;}
function openOnline(){
 if(!active)return;
 towerLobby=false;
 if(!onlineProfile&&!ownBuildReady()){buildOnline();return;}
 onlineProfile??=active;
 screen('online');
}
function buildOnline(){
 onlineDraft=true;binderElement='';draft=structuredClone(active);draft.level=20;delete draft.rogue;draft.deck=B.progressionDeck(cards,draft.masteries,20,draft.deck);
 for(const key in draft.skills)draft.skills[key]=0;
 originalDraftName=draft.name;nameParts=loadNameParts(draft.name);step=1;screen('create');
}
function renderOnline(){
 shell(`<section class="portal-hero"><h1>Online Battles</h1><p>Level 20 · ${escape(onlineProfile?.name||active.name)}</p><div class="menu-stack">${btn('Casual Matchmaking','casual','primary')}${btn('Custom Battles','custom')}${btn('Build Online Wizard','buildOnline')}${ownBuildReady()?btn('Use Saved Wizard','useOwn'):''}${btn('Back','hub','subtle')}</div>${joinCode&&!incomingTower?btn('Join Invited Lobby','join'):''}</section>`);
}
function renderCustom(){
 shell(`<section class="portal-hero"><h1>Custom Battles</h1><p>Invite up to eight players and choose your teams. Level 20 · ${escape(onlineProfile?.name||active.name)}</p><div class="portal-actions">${btn('Build Online Wizard','buildOnline')}${ownBuildReady()?btn('Use Saved Wizard','useOwn'):''}${btn('Create Custom Lobby','host','primary')}${joinCode&&!incomingTower?btn('Join Invited Lobby','join'):''}</div><label class="field"><span>Lobby link or code</span><input id="joinInput" autocomplete="off"></label>${btn('Join Lobby','joinInput')}${btn('Back','onlineMenu','subtle')}</section>`);
}
const wizardFloor=B.rogueFloor;
const partyFloor=players=>Math.min(21,...players.filter(p=>!p.isCpu).map(p=>wizardFloor(p.profile)));
function renderTower(){
 if(active.rogue?.pending){openSpellDraft('tower');return;}
 shell(`<section class="portal-hero"><h1>Caglimot Tower</h1><p>Floor ${wizardFloor(active)} of 21${active.towerCleared?' · Tower cleared · Replay':''}</p><p class="library-gold">${active.rogue.gold.toLocaleString()} gold</p><p>Four corrupted guardians stand between you and Grelus, master of Death and Lightning.</p>${towerMessage?`<p class="network-notice">${escape(towerMessage)}</p>`:''}<div class="menu-stack">${btn('Fight Floor '+wizardFloor(active),'soloTower','primary')}${btn('Host Co-op Tower','hostTower')}${joinCode&&incomingTower?btn('Join Tower Invite','joinTowerInvite'):''}${btn('Back','hub','subtle')}</div><label class="field"><span>Tower lobby link or code</span><input id="towerJoin" autocomplete="off"></label>${btn('Join Co-op Tower','joinTowerInput')}</section>`);
}
function recordTowerResult(state){
 const tower=state.tower;
 if(!tower||!active||state.phase!=='finished'||state.winner!==0||active.lastTowerWin===tower.id)return;
 if(tower.online&&!state.units.some(u=>u.peerId===session.peerId&&u.team===0))return;

 const wasCleared=active.towerCleared;
 try{persistProfile(B.normalize(B.awardFloor(cards,active,tower.floor,tower.id),cards,true));onlineProfile=null;
 towerMessage='Floor '+tower.floor+' cleared · +'+B.goldReward(tower.floor)+' gold'+(!wasCleared&&active.towerCleared?' · Weilei’s Library is now open.':active.rogue.pending?' · Choose your new spells.':'');
 }catch(err){error(err.message);}
}

const resultsDialog=el('matchResults');
function showMatchResults(combat){
 if(combat.phase!=='finished'||lastResult)return;
 el('battleLogPanel')?.close?.();
 lastResult=combat;
 if(combat.tower)recordTowerResult(combat);
 const columns=[['damage','Damage'],['healing','Healing'],['tanked','Damage Tanked'],['casts','Spells Cast'],['failed','Spells Failed'],['mana','Mana Used']];
 resultsDialog.innerHTML=`<h1 id="matchResultsTitle">${combat.winner==='draw'?'Draw':combat.winner===0?'Allies win':'Enemies win'}</h1><div class="match-table-scroll"><table><thead><tr><th scope="col">Wizard</th>${columns.map(([,label])=>`<th scope="col">${label}</th>`).join('')}</tr></thead><tbody>${combat.units.map(u=>`<tr><th scope="row">${escape(u.name)}<small>${u.team?'Enemy':'Ally'}</small></th>${columns.map(([key])=>`<td>${(u.matchStats?.[key]||0).toLocaleString()}</td>`).join('')}</tr>`).join('')}</tbody></table></div><p class="portal-note">Damage Tanked includes HP lost and damage stopped by the wizard’s defenses. Spells Cast counts successful spells only. Spells Failed counts fizzles and unavailable targets; skipped turns are not casts.</p><button class="portal-btn primary" autofocus>Continue</button>`;
 if(!resultsDialog.open)resultsDialog.showModal();
}
window.WizardryMatchResults={show:showMatchResults};
function leaveMatch(){
 resultsDialog.close();
 if(returnPartyId&&session.lobby?.kind==='match'&&lastResult?.phase==='finished'){void returnToParty();return;}
 if(session.roomId)closeSession();
 screen(lastResult?.tower?'tower':lastResult?.mode==='tester'?'tests':active?'hub':'home');
}
resultsDialog.addEventListener('cancel',e=>e.preventDefault());
resultsDialog.addEventListener('click',e=>{
 if(!e.target.closest('button'))return;
 resultsDialog.close();
 if(lastResult?.tower){
  if(active?.rogue?.pending){openSpellDraft('progression');}
  else if(lastResult.winner===0&&lastResult.tower.floor===21&&active.towerCleared){if(session.roomId)closeSession();screen('home');}
  else screen('progression');
 }else leaveMatch();
});
function renderProgression(){
 const {tower,winner}=lastResult;
 const coOp=tower.online;
 const party=coOp?session.lobby?.players||[]:[];
 const ready=party.find(p=>p.peerId===session.peerId)?.ready;
 const waiting=coOp&&session.lobby?.phase!=='lobby';
 const cleared=winner===0&&tower.floor===21;
 const floor=coOp?(party.length?partyFloor(party):tower.floor):wizardFloor(active);
 const newCards=[],rewards='';
 const stats=B.stats(active),completed=winner===0&&tower.floor===21?21:wizardFloor(active)-1;
 const entries=[['hp','HP',stats.hp],['mana','Mana',stats.mana],...active.masteries.map(e=>[e,title(e),B.masteryBonusPercent(active,e)+'%'])];
 const canEdit=!ready&&!submittingReady;
 const status=winner===0?towerMessage:winner==='draw'?'Floor ended in a draw.':'Floor attempt ended in defeat.';
 shell(`<section class="portal-panel tower-progress">${rewards}<h1>Tower progression</h1><p>${escape(active.name)} · Level ${active.level}</p><label for="towerProgress">${completed} / 21 floors cleared</label><progress id="towerProgress" max="21" value="${completed}"></progress>${status?`<p class="network-notice">${escape(status)}</p>`:''}<h2>Stats & Masteries</h2><p>${stats.remaining} skill point${stats.remaining===1?'':'s'} available</p>${entries.map(([key,label,value])=>`<div class="skill-row"><span>${label} · ${value} · ${active.skills[key]||0}/20 SP</span><div class="skill-controls">${canEdit&&(active.skills[key]||0)>0?`<button class="portal-btn small" data-progress-skill="${key}" data-delta="-1" aria-label="Remove skill point from ${label}">−</button>`:''}${stats.remaining&&canEdit&&(active.skills[key]||0)<20?`<button class="portal-btn small" data-progress-skill="${key}" data-delta="1" aria-label="Add skill point to ${label}">+</button>`:''}</div></div>`).join('')}${canEdit&&entries.some(([key])=>active.skills[key]>0)?btn('Reset skill points','resetProgressPoints','small subtle'):''}${coOp?`<h2>Party readiness</h2>${party.map(p=>`<div class="skill-row"><span>${escape(p.profile.name)}</span><span>${!waiting&&p.ready?'Ready':'Waiting'}</span></div>`).join('')}`:''}<div class="portal-actions"><button class="portal-btn primary" data-action="nextFloor" ${waiting||ready||submittingReady||active.rogue?.pending?'disabled':''}>${cleared?'Finish':ready?'Waiting for party':'Next'}</button>${btn('Leave Tower','leaveProgress','subtle')}</div>${!ready&&!submittingReady?btn('Edit Deck','editTowerDeck','subtle'):''}${cleared?'':`<p class="portal-note">${winner===0?'Next encounter':'Retry'} · Floor ${floor}</p>`}</section>`);
 if(newCards.length)requestAnimationFrame(()=>api.drawCardArts());
}
function changeProgressPoints(key,delta){
 if(view!=='progression'||!active||submittingReady)return;
 if(lastResult?.tower.online&&session.lobby?.players.some(p=>p.peerId===session.peerId&&p.ready)&&session.lobby.phase==='lobby')return;
 const skills={...active.skills};
 if(key===null){for(const stat in skills)skills[stat]=0;}
 else {
   if(!['hp','mana',...active.masteries].includes(key)||![1,-1].includes(delta))return;
   const value=(skills[key]||0)+delta;
   if(value<0||value>20||(delta>0&&!B.stats(active).remaining))return;
   skills[key]=value;
 }
 persistProfile(B.normalize({...active,skills},cards,true));onlineProfile=null;render();
}
async function nextFloor(){
 if(!lastResult?.tower.online){
   if(active.rogue?.pending){openSpellDraft('progression');}else if(lastResult?.winner===0&&lastResult.tower.floor===21){screen('home');}else startSoloTower();
   return;
 }
 if(submittingReady||session.lobby?.phase!=='lobby')return;
 if(active.rogue?.pending){openSpellDraft(lastResult?.tower?'progression':'tower');return;}if(lastResult?.winner===0&&lastResult.tower.floor===21){closeSession();screen('home');return;}
 submittingReady=true;render();
 try{await command('ready',{ready:true,towerSkills:active.skills,towerDeck:active.deck,towerRogue:active.rogue});}
 finally{submittingReady=false;if(view==='progression')render();}
}
function startSoloTower(){
 if(active.rogue?.pending){openSpellDraft(lastResult?.tower?'progression':'tower');return;}
 towerLobby=false;towerMessage='';
 api.startTower([{profile:active}],wizardFloor(active));showBattle();
}
function showBattle(){
 lastResult=null;view='battle';resultsDialog.close();
 document.body.dataset.screen='battle';
 el('battleHome').textContent=api.getState().tower?'Return to Tower':'Home';
 cancelAnimationFrame(previewFrame);requestAnimationFrame(()=>api.drawCardArts());
}
function startBattle(size){towerLobby=false;api.configureProfile(active);api.startPractice(size);showBattle();}
function startCardTester(size=1){towerLobby=false;api.startCardTester(size);showBattle();}
// Shared lobby transport. Only the host can publish combat state.
const ENDPOINT='https://vocaddalptoghysgdkvh.supabase.co/functions/v1/wizardry-lobby';
const session=window.WizardrySession={active:false,isHost:false,peerId:null,lobby:null,roomId:null,token:null,version:-1,
 plan(p){const u=api.getState().units.find(u=>u.peerId===this.peerId);if(!u||api.getState().phase!=='planning'||this.pendingPlan)return false;if(!p.cancel&&u.discardedRound===p.round)p={...p,discardId:u.discardedCard};p={...p,requestId:p.round+':'+(++planSerial)};if(this.isHost){const ok=api.submitRemotePlan(this.peerId,p);void syncRoom();return ok;}this.pendingPlan=p;api.previewPendingPlan(p);const g=generation;command('plan',{plan:p,version:this.version}).catch(e=>{if(g===generation&&this.pendingPlan?.requestId===p.requestId){this.pendingPlan=null;api.rejectPendingPlan(p);error(e.message);}});return true;}};
let broadcastTimer=null,battleTimer=null,busy=false,lastState='',lastLobby='',acks=[],generation=0,failures=0,planSerial=0,lastClock=performance.now();
let returnPartyId=null,matchSwitching=false,startingMatch=false,matchmakingBusy=false,lastMatchCheck=0;
const randomToken=()=>Array.from(crypto.getRandomValues(new Uint8Array(32)),x=>x.toString(16).padStart(2,'0')).join('');
async function request(action,payload={},serializedState=''){const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),12000);try{let body=JSON.stringify({action,roomId:session.roomId,token:session.token,payload});if(serializedState)body=body.slice(0,-2)+',"state":'+serializedState+'}}';const r=await fetch(ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json'},body,signal:controller.signal});const data=await r.json();if(!r.ok)throw Error(data.error||'Lobby request failed.');return data;}finally{clearTimeout(timer);}}
function closeSession(){const old={roomId:session.roomId,token:session.token};returnPartyId=null;matchSwitching=false;startingMatch=false;lastMatchCheck=0;generation++;clearInterval(broadcastTimer);clearInterval(battleTimer);session.active=false;session.lobby=null;session.peerId=null;session.isHost=false;session.roomId=null;session.token=null;session.version=-1;session.pendingPlan=null;busy=false;lastState='';lastLobby='';acks=[];
 if(old.roomId&&old.token)fetch(ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'leave',...old,payload:{}}),keepalive:true}).catch(()=>{});
}
function acceptRoom(data){if(session.roomId&&data.roomId!==session.roomId)return;if(data.roomId===session.roomId&&data.version<session.version)return;session.roomId=data.roomId;session.peerId=data.peerId;session.isHost=data.isHost;session.version=data.version;
 const signature=JSON.stringify(data.lobby);session.lobby=data.lobby;towerLobby=data.lobby.tower===true;
 if(data.lobby.kind==='party'&&data.lobby.matchmaking?.status==='matched'&&data.lobby.matchmaking.matchRoom){void enterMatchedRoom(data.lobby.matchmaking.matchRoom);return;}

 if(data.lobby.phase==='closed'){if(returnPartyId&&session.lobby?.kind==='match'){void returnToParty();return;}closeSession();screen(towerLobby?'tower':'online');error('The host closed this lobby.');return;}
 if(!session.isHost&&data.lobby.phase==='battle'&&data.state){
   session.active=true;api.receiveSnapshot(data.state);
   if(data.state.phase==='finished'){showMatchResults(data.state);}
   else if(document.body.dataset.screen!=='battle'||lastResult)showBattle();
 }
 if(towerLobby&&session.active&&data.lobby.phase==='lobby'&&data.state?.phase==='finished')showMatchResults(data.state);
 if(session.isHost&&session.active){const ids=new Set(data.lobby.players.map(p=>p.peerId));for(const u of api.getState().units)if(u.isHuman&&!ids.has(u.peerId)){u.isHuman=false;u.peerId=null;}const pending=Object.entries(data.pending||{}).sort((a,b)=>Number(!!b[1].cancel)-Number(!!a[1].cancel));for(const [peerId,plan] of pending){api.submitRemotePlan(peerId,plan,true);acks.push({peerId,round:plan.round,requestId:plan.requestId});}api.autoFill(0);api.autoFill(1);api.runResolution();if(pending.length)api.refreshUI();}
 if(session.active&&data.lobby.phase==='lobby'){
   if(towerLobby){
     const profile=data.lobby.players.find(p=>p.peerId===session.peerId)?.profile;
     if(profile?.lastTowerWin&&active?.lastTowerWin!==profile.lastTowerWin){
       try{if(data.state?.tower&&data.state.phase==='finished')recordTowerResult(data.state);else if(profile.rogue)persistProfile(B.normalize({...active,...profile},cards,true));onlineProfile=null;}catch(err){error(err.message);}
     }
   }
   session.active=false;if(!towerLobby||!lastResult)screen('lobby');
 }
 if(signature!==lastLobby&&!session.active){
   lastLobby=signature;if(view==='lobby'||view==='progression')render();
 }
 if(view==='progression'&&lastResult?.tower.online&&data.lobby.phase==='lobby'&&session.isHost&&
   data.lobby.players.every(p=>p.ready)&&!(lastResult?.tower.floor===21&&lastResult.winner===0))void startTowerLobby();
 if(data.lobby.kind==='match'&&data.lobby.phase==='lobby'&&session.isHost&&!startingMatch&&!session.active){void startOnline();}
}
async function command(action,payload={}){const g=generation,data=await request(action,payload);if(g===generation)acceptRoom(data);return data;}
async function syncRoom(){if(busy||matchSwitching||startingMatch||!session.token||!session.roomId)return;busy=true;const g=generation;try{let action='poll',payload={version:session.version},sendState='';if(session.isHost){action='sync';const serialized=session.active?JSON.stringify(api.onlineSnapshot()):'';if(serialized&&serialized!==lastState){sendState=serialized;lastState=serialized;}payload.ack=acks.splice(0);}if(session.lobby?.kind==='party'&&['queued','found'].includes(session.lobby.matchmaking?.status)&&Date.now()-lastMatchCheck>=1000){payload.matchmaking='status';lastMatchCheck=Date.now();}
 const data=await request(action,payload,sendState);if(g===generation){failures=0;acceptRoom(data);
 if(session.isHost&&session.active&&api.getState().tower?.online&&api.getState().phase==='finished'){
   const result=await request('towerNext');if(g===generation)acceptRoom(result);
 }}}catch(e){if(g===generation){lastState='';if(++failures===3)error('Connection interrupted. Reconnecting to the lobby…');if(/closed|expired|not a member|host disconnected/i.test(e.message)){if(returnPartyId&&session.lobby?.kind==='match'){void returnToParty();return;}closeSession();screen(towerLobby?'tower':'online');error(e.message);}}}finally{if(g===generation)busy=false;}}
function startPolling(){clearInterval(broadcastTimer);clearInterval(battleTimer);lastClock=performance.now();session.clockAt=lastClock;broadcastTimer=setInterval(syncRoom,400);battleTimer=setInterval(()=>{const now=performance.now();if(session.active&&session.isHost)api.advanceBackground(now-lastClock);lastClock=now;session.clockAt=now;},40);}
async function host(tower=false,casual=false){if(tower&&active?.rogue?.pending){openSpellDraft('tower');return;}const profile=tower?active:onlineProfile;if(!profile)return;towerLobby=tower;closeSession();session.token=randomToken();screen('lobby');error('Opening your lobby…');try{const data=await request('create',{profile,tower,casual});acceptRoom(data);render();startPolling();}catch(e){closeSession();screen(towerLobby?'tower':'online');error(e.message);}}
async function join(code,tower=false){if(tower&&active?.rogue?.pending){openSpellDraft('tower');return;}const profile=tower?active:onlineProfile;if(!profile)return;towerLobby=tower;let id=String(code||'').trim();try{if(id.includes('://'))id=new URL(id).searchParams.get('lobby')||'';}catch{}if(!/^[a-f0-9-]{36}$/i.test(id)){error('Paste a valid lobby invitation link or code.');return;}closeSession();session.token=randomToken();session.roomId=id;screen('lobby');error('Joining lobby…');try{const data=await request('join',{profile,tower});acceptRoom(data);render();startPolling();return true;}catch(e){closeSession();screen(towerLobby?'tower':'online');error(e.message);return false;}}
function hostSeat(peerId,team,slot){command('seat',{team,slot}).catch(e=>error(e.message));}
function renderLobby(){if(towerLobby&&session.lobby){renderTowerLobby();return;}if(session.lobby?.kind==='party'){renderParty();return;}if(session.lobby?.kind==='match'){renderMatchedLobby();return;}const l=session.lobby;if(!l){shell(`<h1>Connecting to the colosseum…</h1>${btn('Back','hub')}`);return;}const mine=l.players.find(p=>p.peerId===session.peerId),link=new URL('arena.html',location.href);link.searchParams.set('lobby',l.hostId);link.searchParams.set('v','0.135.0');const ready=l.players.every(p=>p.isCpu||p.ready)&&[0,1].every(t=>l.players.some(p=>p.team===t));
 shell(`<div class="portal-heading"><div><p class="portal-eyebrow">CUSTOM BATTLE · ${l.players.filter(p=>!p.isCpu).length} PLAYERS · ${l.players.filter(p=>p.isCpu).length} CPUs</p><h1>Custom Battles</h1></div>${btn('Leave lobby','leave','subtle')}</div><div class="network-notice">Choose your team and seat, then ready up. The host can add randomized CPUs to any open seat. Both teams need at least one wizard. Empty seats stay empty. The host must keep the match open.</div><div class="share-link"><input id="lobbyLink" readonly value="${escape(link.href)}" aria-label="Lobby invitation link">${btn('Copy invite link','copy')}</div>${session.isHost?`<label class="field"><span>SEATS PER TEAM</span><select id="lobbySize">${[1,2,3,4].map(n=>`<option value="${n}" ${n===l.size?'selected':''}>${n} per team</option>`).join('')}</select></label>`:`<p>Up to ${l.size} per team</p>`}<div class="lobby-grid">${[0,1].map(team=>`<div class="portal-panel lobby-team"><h2>Team ${team?'Moon':'Sun'}</h2>${Array.from({length:l.size},(_,slot)=>{const p=l.players.find(p=>p.team===team&&p.slot===slot);return `<div class="lobby-seat ${p?.ready?'ready':''}"><div><strong>${p?escape(p.profile.name):'Open seat '+(slot+1)}</strong><small>${p?p.profile.masteries.map(title).join(' + ')+' · '+(p.isCpu?'CPU':p.ready?'Ready':'Not ready'):'Empty'}</small></div><div class="seat-actions">${p?.peerId===session.peerId?'<span>You</span>':p?.isCpu?(session.isHost?`<button class="portal-btn small" data-remove-cpu="${team},${slot}">Remove CPU</button>`:''):!p?`<button class="portal-btn small" data-seat="${team},${slot}">Sit here</button>${session.isHost?`<button class="portal-btn small" data-add-cpu="${team},${slot}">Add CPU</button>`:''}`:''}</div></div>`;}).join('')}</div>`).join('')}</div><div class="portal-actions">${btn(mine?.ready?'Not ready':'Ready','ready',mine?.ready?'':'primary')}${session.isHost?`<button class="portal-btn primary" data-action="startOnline" ${!ready?'disabled':''}>Start match</button>`:''}</div>`);}
function renderParty(){
 const l=session.lobby,m=l.matchmaking||{status:'idle'},mine=l.players.find(p=>p.peerId===session.peerId),idle=m.status==='idle',full=l.players.length===l.size&&l.players.every(p=>p.ready&&!p.isCpu);
 const link=new URL('arena.html',location.href);link.searchParams.set('lobby',l.hostId);
 const status=m.status==='queued'?'Searching for another complete '+l.size+'-player party…':m.status==='found'?'Match found! '+m.accepted+' / '+m.total+' accepted. Everyone has 30 seconds to accept.':m.status==='matched'?'Entering the arena…':'Invite friends, select your format and ready up.';
 const controls=m.status==='found'?`<div class="portal-actions">${m.myAccepted?'<span>Accepted · waiting for others</span>':btn('Accept Match','matchAccept','primary')}${btn('Decline','matchDecline')}</div>`:m.status==='queued'?(session.isHost?btn('Cancel Search','matchCancel'):'<p>Waiting for the party leader or an opponent…</p>'):idle?`<div class="portal-actions">${btn(mine?.ready?'Not Ready':'Ready','ready',mine?.ready?'':'primary')}${session.isHost?`<button class="portal-btn primary" data-action="matchQueue" ${full?'':'disabled'}>Find Match</button>`:''}</div>`:'';
 shell(`<div class="portal-heading"><div><p class="portal-eyebrow">CASUAL MATCHMAKING · ${l.size}v${l.size}</p><h1>Your Party · ${l.players.length}/${l.size}</h1></div>${btn('Leave Party','leave','subtle')}</div><div class="network-notice" role="status">${status}</div>${session.isHost&&idle?`<label class="field"><span>Battle Format</span><select id="lobbySize">${[1,2,3,4].map(n=>`<option value="${n}" ${n===l.size?'selected':''}>${n}v${n}</option>`).join('')}</select></label>`:''}${idle&&session.isHost?`<div class="share-link"><input id="lobbyLink" readonly value="${escape(link.href)}" aria-label="Party invitation link">${btn('Copy invite link','copy')}</div>${account?'<button class="portal-btn" data-friends-open>Invite Friends</button>':''}`:''}<div class="portal-panel lobby-team">${Array.from({length:l.size},(_,slot)=>{const p=l.players.find(p=>p.slot===slot);return `<div class="lobby-seat ${p?.ready?'ready':''}"><div><strong>${p?escape(p.profile.name):'Open seat '+(slot+1)}</strong><small>${p?(p.peerId===l.players[0]?.peerId?'Leader · ':'')+(p.ready?'Ready':'Not ready'):'Invite a friend'}</small></div><span>${p?.peerId===session.peerId?'You':''}</span></div>`}).join('')}</div>${controls}`);
}
function renderMatchedLobby(){const l=session.lobby;shell(`<section class="portal-hero"><h1>Match found · ${l.size}v${l.size}</h1><p>Both parties accepted. Preparing the arena…</p>${btn('Leave Match','leave','subtle')}<div class="lobby-grid">${[0,1].map(team=>`<div class="portal-panel"><h2>Team ${team?'Moon':'Sun'}</h2>${l.players.filter(p=>p.team===team).map(p=>`<p>${escape(p.profile.name)}</p>`).join('')}</div>`).join('')}</div></section>`);}
async function matchAction(action){
 if(matchmakingBusy||matchSwitching||session.lobby?.kind!=='party')return;
 matchmakingBusy=true;try{await command('poll',{version:session.version,matchmaking:action,proposalId:session.lobby.matchmaking?.proposalId});}finally{matchmakingBusy=false;}
}
async function enterMatchedRoom(id){
 if(matchSwitching||session.lobby?.kind!=='party'||!id)return;
 matchSwitching=true;const original=session.roomId;returnPartyId=original;
 generation++;busy=false;session.active=false;session.roomId=id;session.version=-1;session.pendingPlan=null;lastState='';lastLobby='';acks=[];
 const g=generation;
 try{const data=await request('poll',{version:-1});if(g!==generation)return;acceptRoom(data);if(!session.active)screen('lobby');}
 catch(e){if(g===generation){session.roomId=original;session.version=-1;returnPartyId=null;error(e.message);}}
 finally{if(g===generation)matchSwitching=false;}
}
async function returnToParty(){
 if(matchSwitching||!returnPartyId)return;
 matchSwitching=true;const matchId=session.roomId,original=returnPartyId,g=++generation;
 // Publish the final state before moving the host away from the battle.
 try{
  if(session.isHost&&api.getState().phase==='finished'){try{await request('sync',{state:api.onlineSnapshot(),ack:[]});}catch(e){if(!/closed|expired|not a member|host disconnected/i.test(e.message))throw e;}}
  session.roomId=original;const data=await request('poll',{version:-1,matchmaking:'return'});
  if(g!==generation)return;
  session.active=false;session.version=-1;session.pendingPlan=null;lastState='';lastLobby='';acks=[];lastResult=null;returnPartyId=null;lastMatchCheck=0;acceptRoom(data);screen('lobby');
 }catch(e){if(g===generation){session.roomId=matchId;error(e.message);if(lastResult&&!resultsDialog.open)resultsDialog.showModal();}}
 finally{if(g===generation){busy=false;matchSwitching=false;}}
}
function renderTowerLobby(){
 const l=session.lobby,mine=l.players.find(p=>p.peerId===session.peerId),floor=partyFloor(l.players);
 const link=new URL('arena.html',location.href);
 link.searchParams.set('lobby',l.hostId);link.searchParams.set('tower','1');
 shell(`<div class="portal-heading"><h1>Caglimot Tower · Floor ${floor}</h1>${btn('Leave Lobby','leave','subtle')}</div><div class="portal-panel"><p>All players fight together on the lowest-level wizard’s floor. A win levels up wizards whose current floor matches the fight.</p><div class="share-link"><input id="lobbyLink" readonly value="${escape(link.href)}" aria-label="Lobby invitation link">${btn('Copy invite link','copy')}</div>${l.players.map(p=>`<p>${escape(p.profile.name)} · Level ${p.profile.level} · ${p.ready?'Ready':'Not ready'}</p>`).join('')}<div class="portal-actions">${btn(mine?.ready?'Not ready':'Ready','ready','primary')}${session.isHost?`<button class="portal-btn" data-action="startTowerLobby" ${l.players.every(p=>p.ready)?'':'disabled'}>Fight Floor ${floor}</button>`:''}</div></div>`);
}
async function startTowerLobby(){
 const l=session.lobby;
 if(!session.isHost||startingFloor||l?.phase!=='lobby'||!l.players.every(p=>p.ready))return;
 startingFloor=true;
 try{
   towerMessage='';api.startTower(l.players,partyFloor(l.players),true);
   const combat=api.getState();await command('towerStart',{state:combat});
   session.active=true;lastState=JSON.stringify(combat);showBattle();
 }catch(err){error(err.message);}finally{startingFloor=false;}
}
async function startOnline(){const l=session.lobby;if(startingMatch||session.active||!session.isHost||!l?.players.every(p=>p.isCpu||p.ready)||![0,1].every(t=>l.players.some(p=>p.team===t)))return;startingMatch=true;try{session.active=true;api.startLobby(l.players,l.size);const state=api.getState();await command('start',{state});lastState=JSON.stringify(state);showBattle();}catch(e){session.active=false;error(e.message);}finally{startingMatch=false;}}
portal.addEventListener('change',async e=>{if(e.target.dataset.namePart!==undefined){
 nameParts[Number(e.target.dataset.namePart)]=e.target.value;
 syncNamePreview();
 return;
 }if(e.target.dataset.gear&&Object.hasOwn(B.gear,e.target.dataset.gear))draft[e.target.dataset.gear]=e.target.value;if(['createRobe','createHat','createSkin','createFacialHair','createHeadHair'].includes(e.target.id)){readDraft();}if(e.target.id==='lobbySize'&&session.isHost){const size=Number(e.target.value);if(session.lobby.players.some(p=>p.slot>=size)){error('Move players out of the higher seats before reducing match size.');e.target.value=session.lobby.size;return;}try{await command('size',{size});}catch(e){error(e.message);}}});
portal.addEventListener('submit',async e=>{
 if(e.target.id!=='cloudForm')return;e.preventDefault();if(busyAccount)return;
 const form=e.target,mode=view==='signup'?'signup':'login',fields=new FormData(form),username=String(fields.get('username')||''),password=String(fields.get('password')||'');
 if(mode==='signup'&&password!==fields.get('confirm')){error('Passwords do not match.');return;}
 if(new TextEncoder().encode(password).length>72){error('Password is too long.');return;}
 const submit=form.querySelector('button[type="submit"]');submit.disabled=true;
 try{await accountLogin(mode,username,password);}catch(err){error(err.message);}finally{submit.disabled=false;}
});
portal.addEventListener('click',async e=>{if(busyAccount)return;const button=e.target.closest('button');if(!button||button.disabled)return;try{
 if(button.dataset.randomNamePart!==undefined){if((view==='create'||view==='wizardTester')&&step===0)randomizeNamePart(Number(button.dataset.randomNamePart));return;}
 if(button.dataset.binderElement){binderElement=button.dataset.binderElement;render();portal.querySelector(`[data-binder-element="${binderElement}"]`)?.focus();return;}
 if(button.dataset.binderCard){inspectBinderCard(button.dataset.binderCard);return;}
 if(button.dataset.draftCard&&view==='spellDraft'){const card=cards.find(c=>c.id===button.dataset.draftCard);if(card){offerChoices[card.school]=card.id;render();}return;}
 if(button.dataset.libraryWizard){active=saved.find(p=>p.id===button.dataset.libraryWizard&&p.towerCleared);if(active){binderElement=active.masteries[0];screen('library');}return;}
 if(button.dataset.testMastery&&view==='libraryTester'){const e=button.dataset.testMastery,m=[...libraryTestProfile.masteries];if(!B.elements.includes(e))return;if(m.includes(e)){if(m.length===1)return;m.splice(m.indexOf(e),1);}else if(m.length<2)m.push(e);else{m.shift();m.push(e);}startLibraryTester(m);return;}
 if(button.dataset.buySpell&&['library','libraryTester'].includes(view)){const testing=view==='libraryTester',profile=testing?libraryTestProfile:active;const next=B.normalize(B.buySpell(cards,profile,button.dataset.buySpell),cards,true);if(testing)libraryTestProfile=next;else persistProfile(next);render();return;}
 if(button.dataset.progressSkill){changeProgressPoints(button.dataset.progressSkill,Number(button.dataset.delta));return;}
 if(button.dataset.action==='resetProgressPoints'){changeProgressPoints(null);return;}
 if(button.dataset.hatStyle){draft.hat=button.dataset.hatStyle;for(const choice of portal.querySelectorAll('[data-hat-style]'))choice.setAttribute('aria-pressed',String(choice===button));return;}
 if(button.dataset.step!==undefined){readDraft();const next=Number(button.dataset.step);if(onlineDraft&&next===0)return;step=next;render();return;}
 if(button.dataset.mastery){if(draft.rogue&&(draft.level>1||draft.towerCleared)){error('Masteries cannot change after a Tower run begins.');return;}const key=button.dataset.mastery;if(draft.masteries.includes(key)){draft.masteries=draft.masteries.filter(x=>x!==key);draft.skills[key]=0;draft.deck=draft.deck.filter(id=>cards.find(c=>c.id===id)?.school!==key);}else if(draft.masteries.length<2){draft.masteries.push(key);}else{error('Up to two mastery elements are allowed. Remove one before choosing another.');return;}if(draft.rogue)Object.assign(draft,B.rogueStarter(cards,draft.masteries));else draft.deck=B.progressionDeck(cards,draft.masteries,draft.level);render();return;}
 if(button.dataset.skill){const key=button.dataset.skill,delta=Number(button.dataset.delta);if(delta<0&&draft.skills[key]>0||delta>0&&B.stats(draft).remaining>0)draft.skills[key]+=delta;render();return;}
 if(button.dataset.deck){
   const profile=view==='towerDeck'?deckDraft:draft;
   const id=button.dataset.deck,delta=Number(button.dataset.delta);
   if(delta<0){const at=profile.deck.indexOf(id);if(at>=0)profile.deck.splice(at,1);}
   else {
     const available=B.availableSpells(cards,profile);
     if(profile.deck.length<(profile.rogue?24:B.deckSize(available))&&profile.deck.filter(x=>x===id).length<B.copyLimit(profile,id)&&available.some(c=>c.id===id))profile.deck.push(id);
   }
   render();portal.querySelector(`[data-deck="${id}"][data-delta="${delta}"]:not([disabled])`)?.focus({preventScroll:true});return;
 }
 if(button.dataset.deleteWizard){deleteId=button.dataset.deleteWizard;render();return;}
 if(button.hasAttribute('data-cancel-delete')){deleteId=null;render();return;}
 if(button.dataset.confirmWizard&&button.dataset.confirmWizard===deleteId){
   const next=saved.filter(p=>p.id!==deleteId);
   saveCollection(next);
   if(active?.id===deleteId)active=null;
   deleteId=null;render();return;
 }
 if(button.dataset.load){onlineProfile=null;towerMessage='';active=saved.find(p=>p.id===button.dataset.load);api.configureProfile(active);screen('hub');return;}
 if(button.dataset.edit){editProfile(saved.find(p=>p.id===button.dataset.edit));return;}
 if(button.dataset.practice){startBattle(Number(button.dataset.practice));return;}
 if(button.dataset.addCpu||button.dataset.removeCpu){const add=!!button.dataset.addCpu,[team,slot]=(button.dataset.addCpu||button.dataset.removeCpu).split(',').map(Number);await command(add?'cpuAdd':'cpuRemove',{team,slot,...(add?{profile:B.cpu(cards,team*4+slot)}:{})});return;}
 if(button.dataset.seat){const [team,slot]=button.dataset.seat.split(',').map(Number);hostSeat(session.peerId,team,slot);return;}
 const action=button.dataset.action;
 if(action==='cloudAccount'){screen('account');return;}
 if(action==='cloudLogin'){screen('login');return;}
 if(action==='cloudSignup'){screen('signup');return;}
 if(action==='cloudLogout'){await signOutAccount();return;}
 if(action==='cloudImport'){importGuest();return;}
 if(action==='cloudRetry'){if(account.dirty)await flushCloud();else{try{const d=await cloudRequest('get',{token:account.token});adoptCloud(d,account.token);render();}catch(e){if(e.status===401){expired=true;cloudStatus('Session expired · sign in again');render();}else error(e.message);}}return;}
 if(action==='cloudUseRemote'||action==='cloudUseLocal'){resolveCloud(action==='cloudUseLocal');return;}
 if(action==='editTowerDeck'){editTowerDeck();return;}
 if(action==='libraryTester'){startLibraryTester();return;}
 if(action==='resetLibraryTester'){startLibraryTester(libraryTestProfile.masteries);return;}
 if(action==='libraryDeck'){if(view==='libraryTester'){deckReturn='libraryTester';deckDraft=structuredClone(libraryTestProfile);binderElement=deckDraft.masteries[0];screen('towerDeck');}else editTowerDeck('library');return;}
 if(action==='librarySelect'){screen('librarySelect');return;}
 if(action==='library'){binderElement=active.masteries[0];screen('library');return;}
 if(action==='claimDraft'){persistProfile(B.normalize(B.chooseOffer(cards,active,offerChoices),cards,true));offerChoices={};editTowerDeck(draftReturn);return;}
 if(action==='saveTowerDeck'){saveTowerDeck();return;}
 if(action==='cancelTowerDeck'){deckDraft=null;screen(deckReturn);return;}
 if(view==='towerDeck'&&action==='allCards'){deckDraft.deck=B.fillOwned(cards,deckDraft);render();return;}
 if(view==='towerDeck'&&action==='clearDeck'){deckDraft.deck=[];render();return;}
 if(action==='nextFloor'){await nextFloor();return;}
 if(action==='leaveProgress'){leaveMatch();return;}
 if(action==='randomName'){
   nameLists.forEach((_,i)=>randomizeNamePart(i));
   return;
 }
 if(action==='cardTester')startCardTester();else if(action==='wizardTester')create(true);else if(action==='create')create();else if(action==='edit'){editProfile(active);}else if(action==='next'){readDraft();if(step===0)requireName();if(step===1&&!draft.masteries.length)throw Error('Choose one or two masteries.');step=Math.min(3,step+1);render();}else if(action==='previous'){readDraft();step=Math.max(0,step-1);render();}else if(action==='save')save();else if(action==='resetPoints'){for(const k in draft.skills)draft.skills[k]=0;render();}else if(action==='allCards'){draft.deck=B.fillOwned(cards,draft);render();}else if(action==='clearDeck'){draft.deck=[];render();}else if(action==='cancelBuild'){pendingSocialInvite=null;const back=onlineDraft?'online':view==='wizardTester'?'tests':active?'hub':'home';onlineDraft=false;if(back==='online'&&!onlineProfile){screen('hub');}else screen(back);}
 else if(action==='online')openOnline();
 else if(action==='onlineMenu')screen('online');
 else if(action==='custom')screen('custom');
 else if(action==='casual')await host(false,true);
 else if(action==='matchQueue')await matchAction('queue');
 else if(action==='matchCancel')await matchAction('cancel');
 else if(action==='matchAccept')await matchAction('accept');
 else if(action==='matchDecline')await matchAction('decline');
 else if(action==='buildOnline')buildOnline();
 else if(action==='useOwn'&&ownBuildReady()){onlineProfile=active;screen('online');}
 else if(action==='invited'){if(incomingTower)await join(joinCode,true);else openOnline();}
 else if(action==='soloTower')startSoloTower();
 else if(action==='hostTower')await host(true);
 else if(action==='joinTowerInput')await join(el('towerJoin').value,true);
 else if(action==='joinTowerInvite')await join(joinCode,true);
 else if(action==='startTowerLobby')await startTowerLobby();
 else if(action==='host')await host();else if(action==='join')await join(joinCode);else if(action==='joinInput')await join(el('joinInput').value);else if(action==='leave'){closeSession();screen(towerLobby?'tower':'online');}else if(action==='ready'){const p=session.lobby.players.find(p=>p.peerId===session.peerId);await command('ready',{ready:!p.ready});}else if(action==='copy'){const input=el('lobbyLink');try{await navigator.clipboard.writeText(input.value);button.textContent='Copied';}catch{input.focus();input.select();error('Select and copy the invitation link.');}}else if(action==='startOnline')await startOnline();else if(['home','load','hub','tests','cpu','tower'].includes(action))screen(action);
 }catch(err){error(err.message);}});
document.getElementById('battleHome').onclick=()=>{
 const combat=api.getState();
 if(combat.phase==='finished'){showMatchResults(combat);return;}
 lastResult=combat;leaveMatch();
};
document.getElementById('battleFullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{}};
// Keep practice reset tied to the saved build, never the retired duel.
document.getElementById('testerSize').onchange=e=>{
 const state=api.getState(),size=Number(e.target.value);
 if(state.mode==='tester'&&state.phase==='planning'&&[1,2,3,4].includes(size)&&size!==state.size)startCardTester(size);
};
document.getElementById('testerMinionPreview').onclick=()=>{if(api.previewTesterMinion())el('testerTools').open=false;};
document.getElementById('testerDefeatPreview').onclick=()=>{if(api.previewTesterDefeat())el('testerTools').open=false;};
document.getElementById('testerOpponentMode').onchange=e=>api.switchTesterOpponentMode(e.target.value);
document.getElementById('testerTarget').onchange=e=>api.switchTesterTarget(e.target.value);
document.getElementById('resetTester').onclick=()=>startCardTester(api.getState().size);
document.getElementById('resetButton').onclick=()=>{if(!session.active){if(api.getState().mode==='tester')startCardTester(api.getState().size);else if(api.getState().tower)screen('tower');else startBattle(api.getState().size);}};
if(typeof window.addEventListener==='function'){
 document.addEventListener('click',e=>{
  const opener=e.target.closest('[data-friends-open]');if(opener){void openFriends();return;}
  const button=e.target.closest('[data-social-action]');if(button&&!button.disabled)void onSocialAction(button);
 });
 el('friendsClose').addEventListener('click',()=>socialDialog().close());
 el('friendsAddForm').addEventListener('submit',async e=>{
  e.preventDefault();if(socialBusy)return;socialBusy=true;const input=el('friendsUsername'),button=el('friendsAddButton');button.disabled=true;
  try{await socialRequest('request',{username:input.value.trim()});input.value='';socialError('Friend request sent.');await pollSocial(true);}
  catch(err){socialError(err.message);}finally{button.disabled=false;socialBusy=false;}
 });
 setInterval(()=>{if(account&&!expired)void pollSocial();},12000);
}
window.addEventListener?.('online',()=>{if(account?.dirty)void flushCloud();if(account)void pollSocial(true);});
 document.addEventListener?.('visibilitychange',()=>{if(document.visibilityState==='visible'&&account?.dirty)void flushCloud();});
 if(stored(ACCOUNT_KEY,null)?.token)void restoreAccount();
 else if(new URLSearchParams(location.search).get('tester')==='wizard')create(true);
 else screen('home');
})();
