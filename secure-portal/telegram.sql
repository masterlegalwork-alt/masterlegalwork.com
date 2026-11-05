begin;
create schema if not exists mlw_telegram;
revoke all on schema mlw_telegram from public;

create table mlw_telegram.updates (
  update_id bigint primary key,
  received_at timestamptz not null default now()
);
create table mlw_telegram.codes (
  code uuid primary key default gen_random_uuid(),
  telegram_id bigint not null,
  expires_at timestamptz not null default (now() + interval '5 minutes')
);
create table mlw_telegram.links (
  matter_id uuid references public.matters(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  telegram_id bigint not null,
  primary key (matter_id, user_id),
  unique (matter_id, telegram_id)
);

create function public.mlw_telegram_start(update_number bigint, sender bigint)
returns uuid language plpgsql security definer set search_path = '' as $$
declare issued uuid;
begin
  if update_number < 0 or sender <= 0 then return null; end if;
  insert into mlw_telegram.updates(update_id) values (update_number)
    on conflict do nothing;
  if not found then return null; end if;

  insert into mlw_telegram.codes(telegram_id) values (sender)
    returning code into issued;
  return issued;
end;
$$;

create function public.mlw_telegram_link(mid uuid, pairing_code uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare actor uuid := auth.uid();
declare sender bigint;
begin
  perform 1 from public.staff_roles where user_id = actor for share;
  perform 1 from public.matter_access where matter_id = mid and user_id = actor for share;
  if actor is null or auth.jwt()->>'aal' is distinct from 'aal2'
     or not public.can_access_matter(mid) then
    raise exception 'Matter access and MFA required';
  end if;

  delete from mlw_telegram.codes
    where code = pairing_code and expires_at > now()
    returning telegram_id into sender;
  if sender is null then raise exception 'Pairing code unavailable'; end if;

  insert into mlw_telegram.links(matter_id, user_id, telegram_id)
    values (mid, actor, sender)
    on conflict (matter_id, user_id) do update set telegram_id = excluded.telegram_id;
  insert into public.case_audit(actor_id, matter_id, action)
    values (actor, mid, 'telegram_bot_linked');
end;
$$;

create function public.mlw_telegram_unlink(mid uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  delete from mlw_telegram.links where matter_id = mid and user_id = auth.uid();
  if found then
    insert into public.case_audit(actor_id, matter_id, action)
      values (auth.uid(), mid, 'telegram_bot_unlinked');
  end if;
end;
$$;

-- Remove bindings when explicit case access or the global owner role is revoked.
create function mlw_telegram.revoke_links()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if tg_table_name = 'matter_access' then
    delete from mlw_telegram.links where matter_id = old.matter_id and user_id = old.user_id;
  elsif old.role = 'owner' then
    delete from mlw_telegram.links where user_id = old.user_id;
  end if;
  return null;
end;
$$;
create trigger mlw_telegram_revoke_assignment
  after delete or update on public.matter_access
  for each row execute function mlw_telegram.revoke_links();
create trigger mlw_telegram_revoke_owner
  after delete or update on public.staff_roles
  for each row execute function mlw_telegram.revoke_links();

revoke all on function public.mlw_telegram_start(bigint,bigint),
  public.mlw_telegram_link(uuid,uuid), public.mlw_telegram_unlink(uuid)
  from public, anon, authenticated, service_role;
grant execute on function public.mlw_telegram_start(bigint,bigint) to service_role;
grant execute on function public.mlw_telegram_link(uuid,uuid),
  public.mlw_telegram_unlink(uuid) to authenticated;
commit;

