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
declare r public.wizardry_test_lobbies%rowtype; actor jsonb; p jsonb; found_actor boolean; result_players jsonb; idx integer; t integer; s integer; claimed boolean; ack jsonb; host boolean; pid text; v bigint; tower boolean; floor_no integer;
begin
 if actor_key is null or length(actor_key)<>64 then raise exception 'Invalid session'; end if;
 if action_name='create' then
  delete from public.wizardry_test_lobbies where expires_at<now();
  if (select count(*) from public.wizardry_test_lobbies where phase<>'closed')>=200 then raise exception 'Test lobbies are busy. Please try again later.'; end if;
  pid=gen_random_uuid()::text;
  insert into public.wizardry_test_lobbies(players) values(jsonb_build_array(jsonb_build_object('peerId',pid,'key',actor_key,'profile',payload->'profile','team',0,'slot',0,'ready',false))) returning * into r;
 else
  select * into r from public.wizardry_test_lobbies where id=room_id and expires_at>now() for update;
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
   select jsonb_agg(case when x->>'peerId'=pid then jsonb_set(x,'{ready}',coalesce(payload->'ready','false')) else x end) into r.players from jsonb_array_elements(r.players) x;
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
   select min((x->'profile'->>'level')::int) into floor_no from jsonb_array_elements(r.players) x;
   if (payload->'state'->'tower'->>'floor')::int is distinct from floor_no or payload->'state'->>'phase' is distinct from 'planning' then
    raise exception 'The party must start on the lowest-level wizard’s floor.';
   end if;
   r.phase='battle';r.battle_state=payload->'state';r.pending='{}';r.state_version=r.state_version+1;
  elsif action_name='towerNext' then
   if not tower or not host or r.phase<>'battle' or r.battle_state->>'phase' is distinct from 'finished' then
    raise exception 'Wait for the finished Tower result before returning to the lobby.';
   end if;
   select jsonb_agg(
    jsonb_set(
     case when r.battle_state->>'winner'='0' and (x->'profile'->>'level')::int=(r.battle_state->'tower'->>'floor')::int
      then jsonb_set(x,'{profile}',(x->'profile')||jsonb_build_object(
       'level',least(20,(x->'profile'->>'level')::int+1),
       'lastTowerWin',r.battle_state->'tower'->>'id',
       'towerCleared',coalesce((x->'profile'->>'towerCleared')::boolean,false) or (r.battle_state->'tower'->>'floor')::int=20))
      else x end,'{ready}','false'::jsonb)
    order by ord
   ) into r.players from jsonb_array_elements(r.players) with ordinality as members(x,ord);
   r.phase='lobby';r.battle_state=null;r.pending='{}';r.state_version=r.state_version+1;
  elsif action_name='plan' then
   if r.phase<>'battle' or r.battle_state->>'phase'<>'planning' then raise exception 'Wait for the next planning round.';end if;
   if (payload->'plan'->>'round')::int<>(r.battle_state->>'round')::int then raise exception 'This round has already changed.';end if;
   r.pending=jsonb_set(r.pending,array[pid],payload->'plan');
  elsif action_name='sync' then
   if not host then raise exception 'Only the host can publish combat state.';end if;
   if r.phase='battle' and jsonb_typeof(payload->'state')='object' then r.battle_state=payload->'state';r.state_version=r.state_version+1;end if;
   for ack in select value from jsonb_array_elements(coalesce(payload->'ack','[]')) loop
    if r.pending->(ack->>'peerId')->>'round'=ack->>'round' then r.pending=r.pending-(ack->>'peerId');end if;
   end loop;
  elsif action_name='leave' then
   if host then r.phase='closed';else select coalesce(jsonb_agg(x),'[]') into r.players from jsonb_array_elements(r.players) x where x->>'peerId'<>pid; r.pending=r.pending-pid;end if;
  elsif action_name not in('poll','join') then raise exception 'Unknown lobby action.';
  end if;
  update public.wizardry_test_lobbies set players=r.players,room_size=r.room_size,phase=r.phase,battle_state=r.battle_state,state_version=r.state_version,pending=r.pending,updated_at=case when host then now() else updated_at end where id=r.id;
 end if;
 select coalesce(jsonb_agg(x-'key'),'[]') into result_players from jsonb_array_elements(r.players) x;
 v=coalesce((payload->>'version')::bigint,-1);
 return jsonb_build_object('roomId',r.id,'peerId',pid,'isHost',r.players->0->>'key'=actor_key,'lobby',jsonb_build_object('hostId',r.id,'tower',coalesce(r.players->0->'profile'->>'towerLobby'='true',false),'size',r.room_size,'phase',r.phase,'players',result_players),'version',r.state_version,'state',case when r.state_version>v then r.battle_state else null end,'pending',case when r.players->0->>'key'=actor_key then r.pending else '{}'::jsonb end);
end $function$;
revoke all on function public.wizardry_test_action(text,uuid,text,jsonb) from public,anon,authenticated;
grant execute on function public.wizardry_test_action(text,uuid,text,jsonb) to service_role;
