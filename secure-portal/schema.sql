-- MLW case portal: Supabase/PostgreSQL. Apply through authenticated project SQL editor.
-- Default DENY. No seed data; grant first owner manually using the Auth user UUID.
create extension if not exists pgcrypto;
create table if not exists public.staff_roles (
 user_id uuid primary key references auth.users(id) on delete cascade,
 role text not null check(role in ('owner','advocate','staff')),
 created_at timestamptz not null default now()
);
create table if not exists public.clients (
 id uuid primary key default gen_random_uuid(),
 full_name text not null,
 email text,
 phone text,
 created_at timestamptz not null default now()
);
create table if not exists public.matters (
 id uuid primary key default gen_random_uuid(),
 client_id uuid not null references public.clients(id),
 title text not null,
 internal_ref text unique,
 court text,
 case_number text,
 stage text,
 status text not null default 'Open',
 created_at timestamptz not null default now()
);
create table if not exists public.matter_access (
 matter_id uuid not null references public.matters(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 access_role text not null check(access_role in ('advocate','staff','client')),
 primary key(matter_id,user_id)
);
create table if not exists public.case_documents (
 id uuid primary key default gen_random_uuid(),
 matter_id uuid not null references public.matters(id) on delete cascade,
 storage_path text not null unique,
 display_name text not null,
 doc_type text,
 client_visible boolean not null default false,
 uploaded_by uuid not null references auth.users(id),
 created_at timestamptz not null default now()
);
create table if not exists public.case_events (
 id uuid primary key default gen_random_uuid(),
 matter_id uuid not null references public.matters(id) on delete cascade,
 event_type text not null,
 event_at timestamptz not null,
 note text,
 verified boolean not null default false,
 created_at timestamptz not null default now()
);
create table if not exists public.case_notes (
 id uuid primary key default gen_random_uuid(),
 matter_id uuid not null references public.matters(id) on delete cascade,
 content text not null,
 author_id uuid not null references auth.users(id),
 created_at timestamptz not null default now()
);
create table if not exists public.case_audit (
 id uuid primary key default gen_random_uuid(),
 actor_id uuid not null references auth.users(id),
 matter_id uuid,
 action text not null,
 occurred_at timestamptz not null default now()
);
create or replace function public.is_owner() returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.staff_roles s where s.user_id=(select auth.uid()) and s.role='owner');
$$;
create or replace function public.is_staff() returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.staff_roles s where s.user_id=(select auth.uid()) and s.role in ('owner','advocate','staff'));
$$;
create or replace function public.can_access_matter(mid uuid) returns boolean language sql stable security definer set search_path='' as $$
 select public.is_owner() or exists (
 select 1 from public.matter_access a where a.matter_id=mid and a.user_id=(select auth.uid()));
$$;
create or replace function public.can_edit_matter(mid uuid) returns boolean language sql stable security definer set search_path='' as $$
 select public.is_owner() or exists(
 select 1 from public.matter_access a where a.matter_id=mid and a.user_id=(select auth.uid()) and a.access_role in ('advocate','staff'));
$$;
revoke all on function public.is_owner() from public;
revoke all on function public.is_staff() from public;
revoke all on function public.can_access_matter(uuid) from public;
revoke all on function public.can_edit_matter(uuid) from public;
grant execute on function public.is_owner(), public.is_staff(), public.can_access_matter(uuid), public.can_edit_matter(uuid) to authenticated;
alter table public.staff_roles enable row level security;
alter table public.clients enable row level security;
alter table public.matters enable row level security;
alter table public.matter_access enable row level security;
alter table public.case_documents enable row level security;
alter table public.case_events enable row level security;
alter table public.case_notes enable row level security;
alter table public.case_audit enable row level security;
create policy "owner read staff roles" on public.staff_roles for select to authenticated using(public.is_owner() or user_id=(select auth.uid()));
create policy "owner manage staff roles" on public.staff_roles for all to authenticated using(public.is_owner()) with check(public.is_owner());
create policy "staff read authorised client records" on public.clients for select to authenticated using(public.is_owner() or exists(select 1 from public.matters m where m.client_id=clients.id and public.can_access_matter(m.id) and public.can_edit_matter(m.id)));
create policy "owner creates clients" on public.clients for insert to authenticated with check(public.is_owner());
create policy "owner updates clients" on public.clients for update to authenticated using(public.is_owner()) with check(public.is_owner());
create policy "read own matters" on public.matters for select to authenticated using(public.can_access_matter(id));
create policy "owner insert matters" on public.matters for insert to authenticated with check(public.is_owner());
create policy "owner update matters" on public.matters for update to authenticated using(public.is_owner()) with check(public.is_owner());
create policy "owner delete matters" on public.matters for delete to authenticated using(public.is_owner());
create policy "read own assignments" on public.matter_access for select to authenticated using(public.is_owner() or user_id=(select auth.uid()));
create policy "owner manages assignments" on public.matter_access for all to authenticated using(public.is_owner()) with check(public.is_owner());
create policy "read permitted documents" on public.case_documents for select to authenticated using(public.can_access_matter(matter_id) and (public.can_edit_matter(matter_id) or client_visible));
create policy "staff insert documents" on public.case_documents for insert to authenticated with check(public.can_edit_matter(matter_id) and uploaded_by=(select auth.uid()) and client_visible=false);
create policy "owner manage documents" on public.case_documents for update to authenticated using(public.is_owner()) with check(public.is_owner());
create policy "owner delete documents" on public.case_documents for delete to authenticated using(public.is_owner());
create policy "read permitted events" on public.case_events for select to authenticated using(public.can_access_matter(matter_id) and (public.can_edit_matter(matter_id) or verified));
create policy "staff add events" on public.case_events for insert to authenticated with check(public.can_edit_matter(matter_id) and verified=false);
create policy "owner modify events" on public.case_events for update to authenticated using(public.is_owner()) with check(public.is_owner());
create policy "internal read notes" on public.case_notes for select to authenticated using(public.can_edit_matter(matter_id));
create policy "internal add notes" on public.case_notes for insert to authenticated with check(public.can_edit_matter(matter_id) and author_id=(select auth.uid()));
create policy "owner read audit" on public.case_audit for select to authenticated using(public.is_owner());
-- Private Storage: user must create bucket 'case-files' with public=FALSE in Supabase Storage.
-- Object key convention is <matter_uuid>/<random_uuid>/<sanitized_filename>.
-- Storage access is checked against metadata and case assignments, never public bucket permissions.
create policy "read approved case objects" on storage.objects for select to authenticated using (
 bucket_id='case-files' and exists(
 select 1 from public.case_documents d
 where d.storage_path=name and public.can_access_matter(d.matter_id)
 and (public.can_edit_matter(d.matter_id) or d.client_visible)
 ));
-- Storage upload is deliberately NOT enabled until quarantine, antivirus and atomic metadata-write API exist.
-- Do not create broad storage insert/update policies.
-- Bootstrap: after owner signs up in Supabase Auth, use secure SQL editor:
-- insert into public.staff_roles(user_id,role) values ('<OWNER_AUTH_UUID>','owner');
