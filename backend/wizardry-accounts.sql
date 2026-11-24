-- Isolated Wizardry username accounts. No shared Supabase Auth identities.
create table public.wizardry_accounts (
 id uuid primary key default gen_random_uuid(), username text unique not null check(username ~ '^[a-z0-9_]{3,24}$'),
 password_hash text not null, wizards jsonb not null default '[]'::jsonb check(jsonb_typeof(wizards)='array'),
 revision bigint not null default 0, updated_at timestamptz not null default now()
);
create table public.wizardry_account_sessions (
 token_hash text primary key, account_id uuid not null references public.wizardry_accounts(id) on delete cascade,
 expires_at timestamptz not null default(now()+interval '30 days')
);
create index wizardry_account_sessions_account_idx on public.wizardry_account_sessions(account_id);
create table public.wizardry_account_limits (bucket text primary key,window_start timestamptz not null,attempts integer not null);
alter table public.wizardry_accounts enable row level security;
alter table public.wizardry_account_sessions enable row level security;
alter table public.wizardry_account_limits enable row level security;
revoke all on public.wizardry_accounts,public.wizardry_account_sessions,public.wizardry_account_limits from public,anon,authenticated;
grant select,insert,update,delete on public.wizardry_accounts,public.wizardry_account_sessions,public.wizardry_account_limits to service_role;
create function public.wizardry_account_request(p_action text,p_username text,p_password text,p_token text,p_revision bigint,p_wizards jsonb,p_ip text)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare
 a public.wizardry_accounts%rowtype;
 token text; k text; n int;
begin
 if p_action in ('signup','login') then
  if p_username is null or p_username !~ '^[a-z0-9_]{3,24}$' or p_password is null or octet_length(p_password) not between 10 and 72 then
   return jsonb_build_object('error','Use a 3–24 character username and password of 10–72 bytes.','status',400);
  end if;
  foreach k in array array['ip:'||coalesce(p_ip,'unknown'),'user:'||p_username] loop
   insert into public.wizardry_account_limits as l(bucket,window_start,attempts) values(k,now(),1)
   on conflict(bucket) do update set
    attempts=case when l.window_start<now()-interval '15 minutes' then 1 else l.attempts+1 end,
    window_start=case when l.window_start<now()-interval '15 minutes' then now() else l.window_start end
   returning attempts into n;
   if n>(case when k like 'ip:%' then 40 else 10 end) then
    return jsonb_build_object('error','Too many attempts. Try again in 15 minutes.','status',429);
   end if;
  end loop;
  if p_action='signup' then
   insert into public.wizardry_accounts(username,password_hash) values(p_username,extensions.crypt(p_password,extensions.gen_salt('bf',12)))
   on conflict(username) do nothing returning * into a;
   if not found then return jsonb_build_object('error','Username is already taken.','status',409); end if;
  else
   select * into a from public.wizardry_accounts where username=p_username;
   if not found then
    perform extensions.crypt(p_password,extensions.gen_salt('bf',12));
    return jsonb_build_object('error','Incorrect username or password.','status',401);
   end if;
   if extensions.crypt(p_password,a.password_hash) is distinct from a.password_hash then
    return jsonb_build_object('error','Incorrect username or password.','status',401);
   end if;
  end if;
  delete from public.wizardry_account_sessions where account_id=a.id and expires_at<=now();
  token:=encode(extensions.gen_random_bytes(32),'hex');
  insert into public.wizardry_account_sessions(token_hash,account_id) values(encode(extensions.digest(token,'sha256'),'hex'),a.id);
  return jsonb_build_object('username',a.username,'token',token,'revision',a.revision,'wizards',a.wizards);
 end if;
 if p_token is null or p_token !~ '^[0-9a-f]{64}$' then
  return jsonb_build_object('error','Please sign in again.','status',401);
 end if;
 select u.* into a from public.wizardry_accounts u join public.wizardry_account_sessions s on s.account_id=u.id
 where s.token_hash=encode(extensions.digest(p_token,'sha256'),'hex') and s.expires_at>now() for update of u;
 if not found then return jsonb_build_object('error','Your session expired. Please sign in again.','status',401); end if;
 if p_action='logout' then
  delete from public.wizardry_account_sessions where token_hash=encode(extensions.digest(p_token,'sha256'),'hex');
  return jsonb_build_object('ok',true);
 elsif p_action='get' then
  return jsonb_build_object('username',a.username,'revision',a.revision,'wizards',a.wizards);
 elsif p_action='save' then
  if p_revision is distinct from a.revision then
   return jsonb_build_object('error','Cloud saves changed on another device.','status',409,'revision',a.revision,'wizards',a.wizards);
  end if;
  if p_wizards is null or jsonb_typeof(p_wizards)<>'array' or octet_length(p_wizards::text)>1000000 then
   return jsonb_build_object('error','Invalid or oversized save.','status',400);
  end if;
  if jsonb_array_length(p_wizards)>100 or exists(select 1 from jsonb_array_elements(p_wizards) v where jsonb_typeof(v)<>'object' or jsonb_typeof(v->'id') is distinct from 'string' or length(v->>'id') not between 1 and 128)
  or (select count(distinct v->>'id') from jsonb_array_elements(p_wizards) v)<>jsonb_array_length(p_wizards) then
   return jsonb_build_object('error','Invalid wizard collection (maximum 100 unique wizards).','status',400);
  end if;
  update public.wizardry_accounts set wizards=p_wizards,revision=revision+1,updated_at=now() where id=a.id returning * into a;
  return jsonb_build_object('username',a.username,'revision',a.revision);
 end if;
 return jsonb_build_object('error','Unknown request.','status',400);
end;
$$;
revoke all on function public.wizardry_account_request(text,text,text,text,bigint,jsonb,text) from public,anon,authenticated;
grant execute on function public.wizardry_account_request(text,text,text,text,bigint,jsonb,text) to service_role;
