create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role text not null default 'alumno' check (role in ('docente', 'alumno', 'centro')),
  full_name text not null default '' check (char_length(full_name) <= 80),
  headline text not null default '' check (char_length(headline) <= 100),
  bio_short text not null default '' check (char_length(bio_short) <= 160),
  subject text not null default '' check (char_length(subject) <= 60),
  languages text[] not null default '{}',
  city text not null default '' check (char_length(city) <= 80),
  online_available boolean not null default true,
  hourly_rate numeric(7, 2) check (hourly_rate is null or hourly_rate >= 0.50),
  availability_days smallint[] not null default '{1,2,3,4,5}' check (
    cardinality(availability_days) between 1 and 7
    and availability_days <@ array[1,2,3,4,5,6,7]::smallint[]
  ),
  availability_start time not null default '09:00',
  availability_end time not null default '20:00',
  timezone text not null default 'Europe/Madrid',
  promoted_from timestamptz,
  promoted_until timestamptz,
  avatar_url text not null default '',
  is_public boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profiles_public_teachers_idx
  on public.profiles (role, subject)
  where is_public = true;

create or replace function public.create_profile_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    left(coalesce(new.raw_user_meta_data ->> 'full_name', ''), 80)
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists create_profile_after_signup on auth.users;
create trigger create_profile_after_signup
  after insert on auth.users
  for each row execute procedure public.create_profile_for_new_user();

alter table public.profiles enable row level security;

drop policy if exists "Public can view public teacher profiles" on public.profiles;
create policy "Public can view public teacher profiles"
  on public.profiles for select
  using (role = 'docente' and is_public = true);

drop policy if exists "Users can view their own profile" on public.profiles;
create policy "Users can view their own profile"
  on public.profiles for select
  to authenticated
  using (auth.uid() = id);

drop policy if exists "Users can create their own profile" on public.profiles;
create policy "Users can create their own profile"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

grant select, insert, update on public.profiles to authenticated;
grant select on public.profiles to anon;
