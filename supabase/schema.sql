-- Run in your OWN Supabase project's SQL Editor, after reviewing it.
-- For viewing, public artwork records and images are readable by anyone with the link.
-- Writing requires a signed-in Supabase Auth account that YOU manually add to admin_users.

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.artworks (
  id uuid primary key default gen_random_uuid(),
  title text not null check (length(btrim(title)) between 1 and 150),
  student_name text not null check (length(btrim(student_name)) between 1 and 120),
  class_id integer not null check (class_id between 1 and 7),
  section text not null check (section in ('drawing','ornament','printing','ceramics')),
  description text not null default '' check (length(description) <= 800),
  image_path text not null check (length(image_path) between 5 and 255),
  created_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;
alter table public.artworks enable row level security;

-- Idempotent setup: policies can be reapplied if needed.
drop policy if exists "View own admin status" on public.admin_users;
create policy "View own admin status" on public.admin_users
for select to authenticated using (user_id = (select auth.uid()));

drop policy if exists "Public may view artwork" on public.artworks;
create policy "Public may view artwork" on public.artworks
for select to anon, authenticated using (true);

drop policy if exists "Only administrators can insert" on public.artworks;
create policy "Only administrators can insert" on public.artworks
for insert to authenticated with check (
  exists(select 1 from public.admin_users where user_id = (select auth.uid()))
);

drop policy if exists "Only administrators can update" on public.artworks;
create policy "Only administrators can update" on public.artworks
for update to authenticated using (
  exists(select 1 from public.admin_users where user_id = (select auth.uid()))
) with check (
  exists(select 1 from public.admin_users where user_id = (select auth.uid()))
);

drop policy if exists "Only administrators can delete" on public.artworks;
create policy "Only administrators can delete" on public.artworks
for delete to authenticated using (
  exists(select 1 from public.admin_users where user_id = (select auth.uid()))
);

insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('artworks','artworks',true,6291456,array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public may view artwork images" on storage.objects;
create policy "Public may view artwork images" on storage.objects
for select to anon, authenticated using (bucket_id='artworks');

drop policy if exists "Admins may upload artwork images" on storage.objects;
create policy "Admins may upload artwork images" on storage.objects
for insert to authenticated with check (
  bucket_id='artworks' and
  exists(select 1 from public.admin_users where user_id = (select auth.uid()))
);

drop policy if exists "Admins may update artwork images" on storage.objects;
create policy "Admins may update artwork images" on storage.objects
for update to authenticated using (
  bucket_id='artworks' and
  exists(select 1 from public.admin_users where user_id = (select auth.uid()))
) with check (
  bucket_id='artworks' and
  exists(select 1 from public.admin_users where user_id = (select auth.uid()))
);

drop policy if exists "Admins may delete artwork images" on storage.objects;
create policy "Admins may delete artwork images" on storage.objects
for delete to authenticated using (
  bucket_id='artworks' and
  exists(select 1 from public.admin_users where user_id = (select auth.uid()))
);

-- DO NOT add an admin account in public frontend code.
-- After creating the admin user in Authentication > Users, run from SQL Editor:
-- insert into public.admin_users(user_id)
-- select id from auth.users where email = 'YOUR_ADMIN_EMAIL@example.com'
-- on conflict do nothing;
