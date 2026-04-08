create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(trim(display_name)) between 2 and 60),
  is_admin boolean not null default false,
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.profiles
  add column if not exists is_admin boolean not null default false;

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  post_slug text not null,
  user_id uuid not null references public.profiles(id) on delete cascade,
  content text not null check (char_length(trim(content)) between 1 and 2000),
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists comments_post_slug_created_at_idx
  on public.comments (post_slug, created_at desc);

alter table public.profiles enable row level security;
alter table public.comments enable row level security;

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

revoke all on table public.profiles from anon, authenticated;
revoke all on table public.comments from anon, authenticated;

grant select on table public.profiles to anon, authenticated;
grant select on table public.comments to anon, authenticated;
grant insert, delete on table public.comments to authenticated;

drop policy if exists "Public can view profiles" on public.profiles;
drop policy if exists "Anyone can view comments" on public.comments;
drop policy if exists "Authenticated users can insert their own comments" on public.comments;
drop policy if exists "Users can delete their own comments" on public.comments;

create policy "Public can view profiles"
  on public.profiles
  for select
  using (true);

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
