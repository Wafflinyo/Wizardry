-- Isolated Wizardry test rooms. No direct anonymous or authenticated table access.
create table public.wizardry_test_lobbies (
 id uuid primary key default gen_random_uuid(), players jsonb not null default '[]',
 room_size integer not null default 4 check(room_size between 1 and 4),
 phase text not null default 'lobby' check(phase in ('lobby','battle','closed')),
 battle_state jsonb, state_version bigint not null default 0,
 pending jsonb not null default '{}', created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(), expires_at timestamptz not null default now()+interval '24 hours'
);
alter table public.wizardry_test_lobbies enable row level security;
revoke all on public.wizardry_test_lobbies from public, anon, authenticated;
grant all on public.wizardry_test_lobbies to service_role;
CREATE OR REPLACE FUNCTION public.wizardry_test_action(action_name text, room_id uuid, actor_key text, payload jsonb DEFAULT '{}'::jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare r public.wizardry_test_lobbies%rowtype; actor jsonb; p jsonb; found_actor boolean; result_players jsonb; idx integer; t integer; s integer; claimed boolean; ack jsonb; host boolean; pid text; v bigint; tower boolean; floor_no integer; unlock_catalog jsonb; legal_deck_size integer; mastery_count integer;
begin
 if actor_key is null or length(actor_key)<>64 then raise exception 'Invalid session'; end if;
 if action_name='create' then
  delete from public.wizardry_test_lobbies where expires_at<now();
  if (select count(*) from public.wizardry_test_lobbies where phase<>'closed')>=200 then raise exception 'Test lobbies are busy. Please try again later.'; end if;
  pid=gen_random_uuid()::text;
  insert into public.wizardry_test_lobbies(players) values(jsonb_build_array(jsonb_build_object('peerId',pid,'key',actor_key,'profile',payload->'profile','team',0,'slot',0,'ready',false))) returning * into r;
 else
  if action_name='poll' then
   select * into r from public.wizardry_test_lobbies where id=room_id and expires_at>now();
  else
   select * into r from public.wizardry_test_lobbies where id=room_id and expires_at>now() for update;
  end if;
  if not found or r.phase='closed' then raise exception 'This lobby is closed or expired.'; end if;
  select value into actor from jsonb_array_elements(r.players) where value->>'key'=actor_key;
  host=coalesce(r.players->0->>'key'=actor_key,false);
  tower=coalesce(r.players->0->'profile'->>'towerLobby'='true',false);
  if action_name='join' and actor is null then
   if tower is distinct from coalesce(payload->'profile'->>'towerLobby'='true',false) then
    raise exception 'Use the matching Tower or Online Battles menu to join this lobby.';
   end if;
   if r.phase<>'lobby' then raise exception 'This match has already started.'; end if;
   if jsonb_array_length(r.players)>=8 then raise exception 'This lobby is full.'; end if;
   select tt,ss into t,s from generate_series(0,1) tt cross join generate_series(0,r.room_size-1) ss
    where (not tower or tt=0) and not exists(select 1 from jsonb_array_elements(r.players) x where (x->>'team')::int=tt and (x->>'slot')::int=ss)
    order by tt,ss limit 1;
   if not found then raise exception 'All active seats are occupied.';end if;
   pid=gen_random_uuid()::text;
   r.players=r.players||jsonb_build_array(jsonb_build_object('peerId',pid,'key',actor_key,'profile',payload->'profile','team',t,'slot',s,'ready',false));
   select jsonb_agg(jsonb_set(x,'{ready}',case when x->>'isCpu'='true' then 'true'::jsonb else 'false'::jsonb end)) into r.players from jsonb_array_elements(r.players) x;
   select value into actor from jsonb_array_elements(r.players) where value->>'key'=actor_key;
  end if;
  if actor is null then raise exception 'This player is not a member of the lobby.'; end if;
  pid=actor->>'peerId';
  if not host and r.updated_at<now()-interval '3 minutes' then raise exception 'The host disconnected. Create a new lobby.';end if;
  if action_name='seat' then
   if tower then raise exception 'Tower parties fight together against guardians.';end if;
   if r.phase<>'lobby' then raise exception 'The match has started.';end if;
   t=(payload->>'team')::int;s=(payload->>'slot')::int;
   if t not in(0,1) or s<0 or s>=r.room_size then raise exception 'Invalid seat.';end if;
   if exists(select 1 from jsonb_array_elements(r.players) x where (x->>'team')::int=t and (x->>'slot')::int=s and x->>'peerId'<>pid) then raise exception 'That seat has been taken.';end if;
   select jsonb_agg(case when x->>'peerId'=pid then x||jsonb_build_object('team',t,'slot',s,'ready',false) else jsonb_set(x,'{ready}',case when x->>'isCpu'='true' then 'true'::jsonb else 'false'::jsonb end) end) into r.players from jsonb_array_elements(r.players) x;
  elsif action_name in('cpuAdd','cpuRemove') then
   if tower then raise exception 'Tower parties fight together against guardians.';end if;
   if not host or r.phase<>'lobby' then raise exception 'Only the host can manage CPUs before the match.';end if;
   t=(payload->>'team')::int;s=(payload->>'slot')::int;
   if t not in(0,1) or s<0 or s>=r.room_size then raise exception 'Invalid CPU seat.';end if;
   if action_name='cpuAdd' then
    if exists(select 1 from jsonb_array_elements(r.players) x where (x->>'team')::int=t and (x->>'slot')::int=s) then raise exception 'That seat is occupied.';end if;
    r.players=r.players||jsonb_build_array(jsonb_build_object('peerId','cpu-'||gen_random_uuid()::text,'isCpu',true,'profile',payload->'profile','team',t,'slot',s,'ready',true));
   else
    if not exists(select 1 from jsonb_array_elements(r.players) x where (x->>'team')::int=t and (x->>'slot')::int=s and x->>'isCpu'='true') then raise exception 'There is no CPU in that seat.';end if;
    select jsonb_agg(x) into r.players from jsonb_array_elements(r.players) x where not((x->>'team')::int=t and (x->>'slot')::int=s);
   end if;
   select jsonb_agg(jsonb_set(x,'{ready}',case when x->>'isCpu'='true' then 'true'::jsonb else 'false'::jsonb end)) into r.players from jsonb_array_elements(r.players) x;
  elsif action_name='ready' then
   if r.phase<>'lobby' then raise exception 'The match has started.';end if;
   p=actor->'profile';
   if tower and payload ? 'towerSkills' then
    if jsonb_typeof(payload->'towerSkills') is distinct from 'object' then raise exception 'Invalid skill allocation.';end if;
    if exists(select 1 from jsonb_each(payload->'towerSkills') as skill(key,value)
      where jsonb_typeof(value)<>'number' or value::text !~ '^(0|[1-9]|1[0-9]|20)$'
      or key not in ('hp','mana','water','earth','lightning','nature','wind','dark','fire','ice')
      or (key not in ('hp','mana') and not (actor->'profile'->'masteries' ? key) and value::text<>'0')) then
      raise exception 'Invalid skill allocation.';
    end if;
    if (select coalesce(sum(value::text::int),0) from jsonb_each(payload->'towerSkills'))>(actor->'profile'->>'level')::int then
      raise exception 'Skill allocation exceeds the wizard level.';
    end if;
    p=jsonb_set(p,'{skills}',payload->'towerSkills');
   end if;
   if tower and payload ? 'towerDeck' then
    if jsonb_typeof(payload->'towerDeck') is distinct from 'array' then raise exception 'Invalid Tower deck.';end if;
    -- Mirror the curated unlock schedule in WizardryBuilds.
    unlock_catalog='{"poseidon":["water",15,15],"volt":["lightning",1,1],"estel":["nature",1,1],"wind":["wind",5,10],"vampire":["dark",1,5],"dragon":["fire",5,10],"bear":["ice",5,10],"shark":["water",1,1],"thunder":["lightning",5,10],"arrows":["fire",1,1],"ronin":["wind",1,1],"reaper":["dark",15,15],"bender":["earth",1,1],"frosty":["ice",15,15],"solidity":["earth",1,1],"calming":["water",1,1],"static":["lightning",1,1],"rage":["fire",1,1],"turbulence":["wind",1,5],"soul":["dark",1,1],"healingaura":["nature",10,10],"freezing":["ice",1,1],"scorpion":["earth",1,1],"octo":["water",1,1],"devil":["fire",1,1],"bloom":["nature",1,5],"rod":["lightning",1,5],"undead":["dark",1,1],"centaur":["nature",5,10],"winddome":["wind",1,1],"penguins":["ice",1,1],"blizzard":["ice",10,10],"thornwrap":["nature",1,5],"kineticsand":["earth",1,5],"zeus":["lightning",15,15],"gunpowderkiss":["fire",1,1],"flowstate":["water",1,5],"windfist":["wind",1,5],"jack":["dark",1,1],"croc":["water",15,15],"electricalcharge":["lightning",1,1],"grillmaster":["fire",1,5],"venustrap":["nature",1,1],"heizmann":["ice",15,15],"boulderweight":["earth",1,1],"cyclops":["earth",10,10],"acidair":["wind",10,10],"decaystrength":["dark",1,1],"burningpheonix":["fire",15,15],"electrodisc":["lightning",1,1],"zen":["wind",1,1],"scaldingair":["wind",1,1],"tree":["nature",15,15],"bulletseed":["nature",1,1],"yeti":["ice",1,5],"totallyrad":["ice",1,1],"lightningball":["lightning",1,5],"wickedwitch":["dark",10,10],"kamikaze":["fire",1,5],"ragingwaters":["water",5,10],"crabgiant":["water",1,5],"meteorshower":["earth",15,15],"manascourge":["dark",1,5],"soulharvest":["dark",5,10],"sirensmelody":["water",10,10],"quicksand":["earth",1,5],"reikel":["fire",10,10],"crystalicemirrors":["ice",1,5],"electriceel":["lightning",10,10],"growth":["nature",1,1],"sticksandstones":["wind",15,15],"darksorcerer":["dark",15,15],"bubbleshield":["water",1,1],"drowzyflowers":["nature",15,15],"stormlizard":["lightning",15,15],"volcaniceruption":["fire",15,15],"frozentouch":["ice",1,1],"wynzor":["wind",15,15],"sentinelfissure":["earth",15,15],"rogginbowler":["earth",5,10],"iceblast":["ice",1,1],"blazingembers":["fire",1,1],"rockblast":["earth",1,1],"solarblast":["nature",1,1],"darkblast":["dark",1,1],"shockblast":["lightning",1,1],"waterblast":["water",1,1],"windblast":["wind",1,1],"windrazor":["wind",15,15],"waterprison":["water",15,15],"lightningfield":["lightning",15,15],"sunfire":["fire",15,15],"landray":["earth",15,15],"doublepick":["ice",15,15],"darkgrounds":["dark",15,15],"groveland":["nature",15,15],"aromatherapy":["wind",15,15],"flamingflamingo":["fire",15,15],"earthquake":["earth",15,15],"claritystrike":["lightning",15,15],"cursedhold":["dark",15,15],"reflectiveice":["ice",15,15],"thornyhug":["nature",15,15],"hightide":["water",15,15],"whale":["water",15,15],"flamewheel":["fire",15,15],"sandwarrior":["earth",15,15],"soulghoul":["dark",15,15],"flashover":["fire",15,15],"briarremedy":["nature",15,15],"lifevine":["nature",15,15],"blooddebt":["dark",15,15],"coldstorage":["ice",15,15],"glacierlance":["ice",15,15],"ripcurrent":["water",15,15],"pressuredrop":["wind",15,15],"chainedjavelin":["lightning",15,15],"razorang":["wind",15,15],"faultlinebulwark":["earth",15,15],"livewire":["lightning",15,15],"hellhound":["fire",15,15],"infernotitan":["fire",15,15],"ringoffire":["fire",15,15],"backdraft":["fire",15,15],"furnace":["fire",15,15],"thunderbirds":["lightning",15,15],"thundergoddrums":["lightning",15,15],"magneticpulse":["lightning",15,15],"shortcircuit":["lightning",15,15],"thundermine":["lightning",15,15],"tectoniccrush":["earth",15,15],"quicksilver":["earth",15,15],"crystalcavern":["earth",15,15],"petrify":["earth",15,15],"giantarmadillo":["earth",15,15],"stampede":["nature",15,15],"killerbees":["nature",15,15],"guardianroots":["nature",15,15],"photosynthesis":["nature",15,15],"mothernature":["nature",15,15]}'::jsonb;
    if payload ? 'towerRogue' then
      if jsonb_typeof(payload->'towerRogue') is distinct from 'object'
         or jsonb_typeof(payload->'towerRogue'->'owned') is distinct from 'object'
         or coalesce(payload->'towerRogue'->'pending','null'::jsonb)<>'null'::jsonb then
        raise exception 'Claim all spell rewards before continuing.';
      end if;
      if p ? 'rogue' and ((payload->'towerRogue'->>'gold') is distinct from (p->'rogue'->>'gold')
          or (payload->'towerRogue'->>'replayFloor') is distinct from (p->'rogue'->>'replayFloor')) then
        raise exception 'Tower gold or replay floor is out of sync.';
      end if;
      if exists(select 1 from jsonb_each(payload->'towerRogue'->'owned') as owned(id,n)
        where not coalesce((p->'masteries') ? (unlock_catalog->owned.id->>0),false)
        or jsonb_typeof(n)<>'number' or n::text !~ '^[1-4]$') then
        raise exception 'Invalid spell collection.';
      end if;
      if exists(select 1 from jsonb_each(coalesce(p->'rogue'->'owned','{}'::jsonb)) as old(id,n)
        where coalesce((payload->'towerRogue'->'owned'->>old.id)::int,0)<old.n::text::int) then
        raise exception 'Previously owned spells cannot be removed.';
      end if;
      p=jsonb_set(p,'{rogue}',payload->'towerRogue');
    end if;
    if p ? 'rogue' then
      if jsonb_array_length(payload->'towerDeck')<>24 or exists(
        select 1 from jsonb_array_elements_text(payload->'towerDeck') as cards(id)
        where not coalesce((p->'masteries') ? (unlock_catalog->cards.id->>0),false)
      ) or exists(select 1 from jsonb_array_elements_text(payload->'towerDeck') as cards(id)
        group by cards.id having count(*)>coalesce((p->'rogue'->'owned'->>cards.id)::int,0)) then
        raise exception 'Your Tower deck must contain exactly 24 owned spell copies.';
      end if;
    else
      mastery_count=jsonb_array_length(p->'masteries');
      select least(24,4*count(*)) into legal_deck_size from jsonb_each(unlock_catalog)
      where (p->'masteries') ? (value->>0) and (value->>mastery_count)::int<=(p->>'level')::int;
      if jsonb_array_length(payload->'towerDeck')<>legal_deck_size then raise exception 'A Tower deck must contain % unlocked spells.',legal_deck_size;end if;
      if exists(select 1 from jsonb_array_elements_text(payload->'towerDeck') as cards(id)
        where not coalesce((p->'masteries') ? (unlock_catalog->cards.id->>0)
          and (unlock_catalog->cards.id->>mastery_count)::int<=(p->>'level')::int,false))
        or exists(select 1 from jsonb_array_elements_text(payload->'towerDeck') as cards(id) group by cards.id having count(*)>4) then
        raise exception 'Use up to four copies of each unlocked spell from your mastered elements.';
      end if;
    end if;
    p=jsonb_set(p,'{deck}',payload->'towerDeck');
   end if;
   select jsonb_agg(case when x->>'peerId'=pid then jsonb_set(jsonb_set(x,'{profile}',p),'{ready}',coalesce(payload->'ready','false')) else x end order by ord)
   into r.players from jsonb_array_elements(r.players) with ordinality as members(x,ord);
  elsif action_name='size' then
   if tower then raise exception 'Tower parties fight together against guardians.';end if;
   if not host or r.phase<>'lobby' then raise exception 'Only the host can change match size.';end if;
   s=(payload->>'size')::int;if s not between 1 and 4 then raise exception 'Invalid match size.';end if;
   if exists(select 1 from jsonb_array_elements(r.players) x where (x->>'slot')::int>=s) then raise exception 'Move players out of higher seats first.';end if;
   r.room_size=s;select jsonb_agg(jsonb_set(x,'{ready}',case when x->>'isCpu'='true' then 'true'::jsonb else 'false'::jsonb end)) into r.players from jsonb_array_elements(r.players) x;
  elsif action_name='start' then
   if tower then raise exception 'Tower parties fight together against guardians.';end if;
   if not host or r.phase<>'lobby' then raise exception 'Only the host can start this match.';end if;
   if exists(select 1 from jsonb_array_elements(r.players) x where x->>'ready'<>'true') then raise exception 'Every player must ready up first.';end if;
   if not exists(select 1 from jsonb_array_elements(r.players) x where x->>'team'='0') or not exists(select 1 from jsonb_array_elements(r.players) x where x->>'team'='1') then raise exception 'Both teams need at least one wizard.';end if;
   r.phase='battle';r.battle_state=payload->'state';r.state_version=r.state_version+1;
  elsif action_name='towerStart' then
   if not tower or not host or r.phase<>'lobby' then raise exception 'Only the Tower host can start a floor.';end if;
   if exists(select 1 from jsonb_array_elements(r.players) x where x->>'ready'<>'true') then raise exception 'Every wizard must ready up first.';end if;
   select min((case when coalesce((x->'profile'->>'towerCleared')::boolean,false) and x->'profile' ? 'rogue' then coalesce((x->'profile'->'rogue'->>'replayFloor')::int,1) when (x->'profile'->>'level')::int=20 and coalesce((x->'profile'->>'finalBossUnlocked')::boolean,(x->'profile'->>'towerCleared')::boolean,false) then 21 else (x->'profile'->>'level')::int end)) into floor_no from jsonb_array_elements(r.players) x;
   if (payload->'state'->'tower'->>'floor')::int is distinct from floor_no or payload->'state'->>'phase' is distinct from 'planning' then
    raise exception 'The party must start on the lowest-level wizard’s floor.';
   end if;
   r.phase='battle';r.battle_state=payload->'state';r.pending='{}';r.state_version=r.state_version+1;
  elsif action_name='towerNext' then
   if not tower or not host or r.phase<>'battle' or r.battle_state->>'phase' is distinct from 'finished' then
    raise exception 'Wait for the finished Tower result before returning to the lobby.';
   end if;
   floor_no=(r.battle_state->'tower'->>'floor')::int;
   select jsonb_agg(
     jsonb_set(case when r.battle_state->>'winner'='0' then
       jsonb_set(x,'{profile}',(x->'profile')||jsonb_build_object(
         'level',case when (case when coalesce((x->'profile'->>'towerCleared')::boolean,false) and x->'profile' ? 'rogue' then coalesce((x->'profile'->'rogue'->>'replayFloor')::int,1) when (x->'profile'->>'level')::int=20 and coalesce((x->'profile'->>'finalBossUnlocked')::boolean,(x->'profile'->>'towerCleared')::boolean,false) then 21 else (x->'profile'->>'level')::int end)=floor_no then least(20,(x->'profile'->>'level')::int+1) else (x->'profile'->>'level')::int end,
         'lastTowerWin',r.battle_state->'tower'->>'id',
         'finalBossUnlocked',coalesce((x->'profile'->>'finalBossUnlocked')::boolean,false) or ((case when coalesce((x->'profile'->>'towerCleared')::boolean,false) and x->'profile' ? 'rogue' then coalesce((x->'profile'->'rogue'->>'replayFloor')::int,1) when (x->'profile'->>'level')::int=20 and coalesce((x->'profile'->>'finalBossUnlocked')::boolean,(x->'profile'->>'towerCleared')::boolean,false) then 21 else (x->'profile'->>'level')::int end)=floor_no and floor_no>=20),
         'towerCleared',coalesce((x->'profile'->>'towerCleared')::boolean,false) or ((case when coalesce((x->'profile'->>'towerCleared')::boolean,false) and x->'profile' ? 'rogue' then coalesce((x->'profile'->'rogue'->>'replayFloor')::int,1) when (x->'profile'->>'level')::int=20 and coalesce((x->'profile'->>'finalBossUnlocked')::boolean,(x->'profile'->>'towerCleared')::boolean,false) then 21 else (x->'profile'->>'level')::int end)=floor_no and floor_no=21)
       ) || case when x->'profile' ? 'rogue' then jsonb_build_object('rogue',(x->'profile'->'rogue')||jsonb_build_object(
         'gold',coalesce((x->'profile'->'rogue'->>'gold')::int,0)+50+10*floor_no,
         'replayFloor',case when coalesce((x->'profile'->>'towerCleared')::boolean,false) and (case when coalesce((x->'profile'->>'towerCleared')::boolean,false) and x->'profile' ? 'rogue' then coalesce((x->'profile'->'rogue'->>'replayFloor')::int,1) when (x->'profile'->>'level')::int=20 and coalesce((x->'profile'->>'finalBossUnlocked')::boolean,(x->'profile'->>'towerCleared')::boolean,false) then 21 else (x->'profile'->>'level')::int end)=floor_no then case when floor_no=21 then 1 else floor_no+1 end else coalesce((x->'profile'->'rogue'->>'replayFloor')::int,1) end
       )) else '{}'::jsonb end)
       else x end,'{ready}','false'::jsonb) order by ord)
   into r.players from jsonb_array_elements(r.players) with ordinality as members(x,ord);
   -- Keep the finished snapshot until the next floor starts so every member can see the results.
   r.phase='lobby';r.pending='{}';r.state_version=r.state_version+1;
  elsif action_name='plan' then
   if r.phase<>'battle' or r.battle_state->>'phase'<>'planning' then raise exception 'Wait for the next planning round.';end if;
   if (payload->'plan'->>'round')::int<>(r.battle_state->>'round')::int then raise exception 'This round has already changed.';end if;
   r.pending=jsonb_set(r.pending,array[pid],payload->'plan');
  elsif action_name='sync' then
   if not host then raise exception 'Only the host can publish combat state.';end if;
   if r.phase='battle' and jsonb_typeof(payload->'state')='object' then r.battle_state=payload->'state';r.state_version=r.state_version+1;end if;
   for ack in select value from jsonb_array_elements(coalesce(payload->'ack','[]')) loop
    if r.pending->(ack->>'peerId')->>'round'=ack->>'round' and (r.pending->(ack->>'peerId')->>'requestId') is not distinct from (ack->>'requestId') then r.pending=r.pending-(ack->>'peerId');end if;
   end loop;
  elsif action_name='leave' then
   if host then r.phase='closed';else select coalesce(jsonb_agg(x),'[]') into r.players from jsonb_array_elements(r.players) x where x->>'peerId'<>pid; r.pending=r.pending-pid;end if;
  elsif action_name not in('poll','join') then raise exception 'Unknown lobby action.';
  end if;
  if action_name<>'poll' then
   update public.wizardry_test_lobbies set players=r.players,room_size=r.room_size,phase=r.phase,battle_state=r.battle_state,state_version=r.state_version,pending=r.pending,updated_at=case when host then now() else updated_at end where id=r.id;
  end if;
 end if;
 select coalesce(jsonb_agg(x-'key'),'[]') into result_players from jsonb_array_elements(r.players) x;
 v=coalesce((payload->>'version')::bigint,-1);
 return jsonb_build_object('roomId',r.id,'peerId',pid,'isHost',r.players->0->>'key'=actor_key,'lobby',jsonb_build_object('hostId',r.id,'tower',coalesce(r.players->0->'profile'->>'towerLobby'='true',false),'size',r.room_size,'phase',r.phase,'players',result_players),'version',r.state_version,'state',case when r.state_version>v then r.battle_state else null end,'pending',case when r.players->0->>'key'=actor_key then r.pending else '{}'::jsonb end);
end $function$;
revoke all on function public.wizardry_test_action(text,uuid,text,jsonb) from public,anon,authenticated;
grant execute on function public.wizardry_test_action(text,uuid,text,jsonb) to service_role;
