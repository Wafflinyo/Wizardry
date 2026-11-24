-- Wizardry social features: private account-scoped relationships, presence and lobby invitations.
create table public.wizardry_friendships (
 a uuid not null references public.wizardry_accounts(id) on delete cascade,
 b uuid not null references public.wizardry_accounts(id) on delete cascade,
 requested_by uuid not null references public.wizardry_accounts(id) on delete cascade,
 accepted boolean not null default false, created_at timestamptz not null default now(),
 primary key(a,b),check(a<b),check(requested_by in(a,b))
);
create index wizardry_friendships_b_idx on public.wizardry_friendships(b);
create table public.wizardry_presence (
 account_id uuid primary key references public.wizardry_accounts(id) on delete cascade,
 seen_at timestamptz not null default now()
);
create table public.wizardry_friend_invites (
 id uuid primary key default gen_random_uuid(),
 sender uuid not null references public.wizardry_accounts(id) on delete cascade,
 recipient uuid not null references public.wizardry_accounts(id) on delete cascade,
 room_id uuid not null references public.wizardry_test_lobbies(id) on delete cascade,
 tower boolean not null, expires_at timestamptz not null default now()+interval '10 minutes',
 unique(sender,recipient,room_id),check(sender<>recipient)
);
create index wizardry_friend_invites_recipient_idx on public.wizardry_friend_invites(recipient,expires_at);
alter table public.wizardry_friendships enable row level security;
alter table public.wizardry_presence enable row level security;
alter table public.wizardry_friend_invites enable row level security;
revoke all on public.wizardry_friendships,public.wizardry_presence,public.wizardry_friend_invites from public,anon,authenticated;
grant select,insert,update,delete on public.wizardry_friendships,public.wizardry_presence,public.wizardry_friend_invites to service_role;
create function public.wizardry_social_request(p_action text,p_token text,p_payload jsonb)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare
 me uuid; other uuid; lo uuid; hi uuid; friend public.wizardry_friendships%rowtype;
 invite public.wizardry_friend_invites%rowtype; room public.wizardry_test_lobbies%rowtype;
 roomid uuid; inviteid uuid; uname text; result jsonb;
begin
 if p_token is null or p_token !~ '^[0-9a-f]{64}$' then return jsonb_build_object('error','Please sign in.','status',401);end if;
 select account_id into me from public.wizardry_account_sessions where token_hash=encode(extensions.digest(p_token,'sha256'),'hex') and expires_at>now();
 if me is null then return jsonb_build_object('error','Please sign in again.','status',401);end if;
 if p_action='list' then
  insert into public.wizardry_presence(account_id,seen_at) values(me,now()) on conflict(account_id) do update set seen_at=excluded.seen_at;
  delete from public.wizardry_friend_invites where recipient=me and expires_at<=now();
  return jsonb_build_object(
   'friends',coalesce((select jsonb_agg(jsonb_build_object('username',u.username,'online',coalesce(p.seen_at>now()-interval '45 seconds',false),'state',case when f.accepted then 'friend' when f.requested_by=me then 'outgoing' else 'incoming' end) order by u.username)
   from public.wizardry_friendships f join public.wizardry_accounts u on u.id=case when f.a=me then f.b else f.a end left join public.wizardry_presence p on p.account_id=u.id where me in(f.a,f.b)),'[]'::jsonb),
   'invites',coalesce((select jsonb_agg(jsonb_build_object('id',i.id,'username',u.username,'tower',i.tower) order by i.expires_at desc)
   from public.wizardry_friend_invites i join public.wizardry_accounts u on u.id=i.sender join public.wizardry_test_lobbies l on l.id=i.room_id
   where i.recipient=me and i.expires_at>now() and l.phase='lobby' and l.expires_at>now() and l.updated_at>now()-interval '3 minutes'
   and exists(select 1 from public.wizardry_friendships f where f.a=least(me,i.sender) and f.b=greatest(me,i.sender) and f.accepted)),'[]'::jsonb));
 elsif p_action='offline' then
  delete from public.wizardry_presence where account_id=me;return jsonb_build_object('ok',true);
 elsif p_action in('inviteAccept','inviteDecline') then
  if coalesce(p_payload->>'id','') !~ '^[0-9a-fA-F-]{36}$' then return jsonb_build_object('error','Invalid invitation.','status',400);end if;
  begin inviteid:=(p_payload->>'id')::uuid;exception when invalid_text_representation then return jsonb_build_object('error','Invalid invitation.','status',400);end;
  select * into invite from public.wizardry_friend_invites where id=inviteid and recipient=me;
  if not found then return jsonb_build_object('error','Invitation not found.','status',404);end if;
  if p_action='inviteDecline' then delete from public.wizardry_friend_invites where id=inviteid and recipient=me;return jsonb_build_object('ok',true);end if;
  if invite.expires_at<=now() or not exists(select 1 from public.wizardry_friendships f where f.a=least(me,invite.sender) and f.b=greatest(me,invite.sender) and f.accepted) then
   return jsonb_build_object('error','Invitation expired or withdrawn.','status',409);end if;
  select * into room from public.wizardry_test_lobbies where id=invite.room_id and phase='lobby' and expires_at>now() and updated_at>now()-interval '3 minutes';
  if not found then return jsonb_build_object('error','That lobby is no longer available.','status',409);end if;
  return jsonb_build_object('roomId',invite.room_id,'tower',invite.tower);
 end if;
 uname:=lower(trim(coalesce(p_payload->>'username','')));
 if uname !~ '^[a-z0-9_]{3,24}$' then return jsonb_build_object('error','Enter an exact username.','status',400);end if;
 select id into other from public.wizardry_accounts where username=uname;
 if other is null or other=me then return jsonb_build_object('error','No other account with that username.','status',404);end if;
 lo:=least(me,other);hi:=greatest(me,other);
 select * into friend from public.wizardry_friendships where a=lo and b=hi;
 if p_action='request' then
  if friend.a is not null then return jsonb_build_object('error','A friendship or request already exists.','status',409);end if;
  if (select count(*) from public.wizardry_friendships where me in(a,b))>=100 or (select count(*) from public.wizardry_friendships where other in(a,b))>=100 then return jsonb_build_object('error','Friend list is full.','status',409);end if;
  insert into public.wizardry_friendships(a,b,requested_by) values(lo,hi,me) on conflict do nothing;
 elsif p_action='accept' then
  update public.wizardry_friendships set accepted=true where a=lo and b=hi and requested_by=other and not accepted;
  if not found then return jsonb_build_object('error','No incoming request.','status',409);end if;
 elsif p_action='remove' then
  delete from public.wizardry_friendships where a=lo and b=hi;
  delete from public.wizardry_friend_invites where (sender=me and recipient=other) or (sender=other and recipient=me);
 elsif p_action='invite' then
  if not coalesce(friend.accepted,false) then return jsonb_build_object('error','Only accepted friends can be invited.','status',403);end if;
  if coalesce(p_payload->>'roomId','') !~ '^[0-9a-fA-F-]{36}$' or coalesce(p_payload->>'lobbyToken','') !~ '^[0-9a-f]{64}$' then return jsonb_build_object('error','Open a lobby first.','status',400);end if;
  begin roomid:=(p_payload->>'roomId')::uuid;exception when invalid_text_representation then return jsonb_build_object('error','Invalid lobby.','status',400);end;
  select * into room from public.wizardry_test_lobbies where id=roomid and phase='lobby' and expires_at>now() and updated_at>now()-interval '3 minutes'
  and players->0->>'key'=encode(extensions.digest(p_payload->>'lobbyToken','sha256'),'hex');
  if not found then return jsonb_build_object('error','Only the host of an open lobby can invite friends.','status',403);end if;
  insert into public.wizardry_friend_invites(sender,recipient,room_id,tower)
  values(me,other,roomid,coalesce(room.players->0->'profile'->>'towerLobby'='true',false))
  on conflict(sender,recipient,room_id) do update set expires_at=now()+interval '10 minutes';
 else return jsonb_build_object('error','Unknown social action.','status',400);end if;
 return jsonb_build_object('ok',true);
end;
$$;
revoke all on function public.wizardry_social_request(text,text,jsonb) from public,anon,authenticated;
grant execute on function public.wizardry_social_request(text,text,jsonb) to service_role;
