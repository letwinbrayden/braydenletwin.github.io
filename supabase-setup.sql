create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(trim(display_name)) between 2 and 60),
  is_admin boolean not null default false,
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.profiles
  add column if not exists is_admin boolean not null default false;

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  title text not null check (char_length(trim(title)) between 1 and 200),
  excerpt text not null check (char_length(trim(excerpt)) between 1 and 400),
  content_html text not null check (char_length(trim(content_html)) between 1 and 50000),
  published_at date,
  read_time text,
  is_published boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  post_slug text not null references public.posts(slug) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  content text not null check (char_length(trim(content)) between 1 and 2000),
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists posts_is_published_published_at_idx
  on public.posts (is_published, published_at desc, created_at desc);

create index if not exists comments_post_slug_created_at_idx
  on public.comments (post_slug, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(
      nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''),
      split_part(new.email, '@', 1)
    )
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

drop trigger if exists posts_set_updated_at on public.posts;
create trigger posts_set_updated_at
  before update on public.posts
  for each row execute procedure public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.posts enable row level security;
alter table public.comments enable row level security;

revoke all on table public.profiles from anon, authenticated;
revoke all on table public.posts from anon, authenticated;
revoke all on table public.comments from anon, authenticated;

grant select on table public.profiles to anon, authenticated;
grant select on table public.posts to anon, authenticated;
grant select on table public.comments to anon, authenticated;
grant insert, update, delete on table public.posts to authenticated;
grant insert, delete on table public.comments to authenticated;

drop policy if exists "Public can view profiles" on public.profiles;
drop policy if exists "Public can view published posts" on public.posts;
drop policy if exists "Admins can view all posts" on public.posts;
drop policy if exists "Admins can insert posts" on public.posts;
drop policy if exists "Admins can update posts" on public.posts;
drop policy if exists "Admins can delete posts" on public.posts;
drop policy if exists "Anyone can view comments" on public.comments;
drop policy if exists "Authenticated users can insert their own comments" on public.comments;
drop policy if exists "Users can delete their own comments" on public.comments;

create policy "Public can view profiles"
  on public.profiles
  for select
  using (true);

create policy "Public can view published posts"
  on public.posts
  for select
  using (is_published = true);

create policy "Admins can view all posts"
  on public.posts
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.profiles
      where profiles.id = auth.uid()
        and profiles.is_admin = true
    )
  );

create policy "Admins can insert posts"
  on public.posts
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.profiles
      where profiles.id = auth.uid()
        and profiles.is_admin = true
    )
  );

create policy "Admins can update posts"
  on public.posts
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.profiles
      where profiles.id = auth.uid()
        and profiles.is_admin = true
    )
  )
  with check (
    exists (
      select 1
      from public.profiles
      where profiles.id = auth.uid()
        and profiles.is_admin = true
    )
  );

create policy "Admins can delete posts"
  on public.posts
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.profiles
      where profiles.id = auth.uid()
        and profiles.is_admin = true
    )
  );

create policy "Anyone can view comments"
  on public.comments
  for select
  using (true);

create policy "Authenticated users can insert their own comments"
  on public.comments
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can delete their own comments"
  on public.comments
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

create table if not exists public.publications (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  title_html text not null check (char_length(trim(title_html)) between 1 and 1000),
  meta_lines jsonb not null default '[]'::jsonb,
  badges jsonb not null default '[]'::jsonb,
  links jsonb not null default '[]'::jsonb,
  abstract_html text not null check (char_length(trim(abstract_html)) between 1 and 50000),
  sort_order integer not null default 0,
  is_published boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists publications_is_published_sort_order_idx
  on public.publications (is_published, sort_order desc, updated_at desc, created_at desc);

drop trigger if exists publications_set_updated_at on public.publications;
create trigger publications_set_updated_at
  before update on public.publications
  for each row execute procedure public.set_updated_at();

alter table public.publications enable row level security;

revoke all on table public.publications from anon, authenticated;
grant select on table public.publications to anon, authenticated;
grant insert, update, delete on table public.publications to authenticated;

drop policy if exists "Public can view published publications" on public.publications;
drop policy if exists "Admins can view all publications" on public.publications;
drop policy if exists "Admins can insert publications" on public.publications;
drop policy if exists "Admins can update publications" on public.publications;
drop policy if exists "Admins can delete publications" on public.publications;

create policy "Public can view published publications"
  on public.publications
  for select
  using (is_published = true);

create policy "Admins can view all publications"
  on public.publications
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.profiles
      where profiles.id = auth.uid()
        and profiles.is_admin = true
    )
  );

create policy "Admins can insert publications"
  on public.publications
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.profiles
      where profiles.id = auth.uid()
        and profiles.is_admin = true
    )
  );

create policy "Admins can update publications"
  on public.publications
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.profiles
      where profiles.id = auth.uid()
        and profiles.is_admin = true
    )
  )
  with check (
    exists (
      select 1
      from public.profiles
      where profiles.id = auth.uid()
        and profiles.is_admin = true
    )
  );

create policy "Admins can delete publications"
  on public.publications
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.profiles
      where profiles.id = auth.uid()
        and profiles.is_admin = true
    )
  );
