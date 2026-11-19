create extension if not exists pgcrypto with schema extensions;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('profile-avatars', 'profile-avatars', true, 5242880, array['image/jpeg', 'image/png', 'image/webp']),
  ('chat-images', 'chat-images', false, 8388608, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public can view profile avatars" on storage.objects;
create policy "Public can view profile avatars"
  on storage.objects for select to anon, authenticated
  using (bucket_id = 'profile-avatars');
drop policy if exists "Users can upload their own profile avatar" on storage.objects;
create policy "Users can upload their own profile avatar"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'profile-avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
drop policy if exists "Users can update their own profile avatar" on storage.objects;
create policy "Users can update their own profile avatar"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'profile-avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'profile-avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
drop policy if exists "Users can delete their own profile avatar" on storage.objects;
create policy "Users can delete their own profile avatar"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'profile-avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

alter table public.profiles
  add column if not exists availability_days smallint[] not null default '{1,2,3,4,5}',
  add column if not exists availability_start time not null default '09:00',
  add column if not exists availability_end time not null default '20:00',
  add column if not exists timezone text not null default 'Europe/Madrid',
  add column if not exists promoted_from timestamptz,
  add column if not exists promoted_until timestamptz;

alter table public.profiles
  drop constraint if exists profiles_availability_days_check;
alter table public.profiles
  add constraint profiles_availability_days_check check (
    cardinality(availability_days) between 1 and 7
    and availability_days <@ array[1,2,3,4,5,6,7]::smallint[]
    and availability_start < availability_end
  );
alter table public.profiles
  drop constraint if exists profiles_hourly_rate_check;
alter table public.profiles
  add constraint profiles_hourly_rate_check
  check (hourly_rate is null or hourly_rate >= 0.50);

create table if not exists public.teacher_promotions (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'pending_payment'
    check (status in ('pending_payment', 'active', 'expired', 'cancelled')),
  amount_cents integer not null default 2499 check (amount_cents = 2499),
  currency text not null default 'eur' check (currency = 'eur'),
  starts_at timestamptz,
  ends_at timestamptz,
  stripe_checkout_session_id text unique,
  stripe_payment_intent_id text,
  created_at timestamptz not null default now(),
  constraint teacher_promotions_active_dates check (
    status <> 'active' or (starts_at is not null and ends_at > starts_at)
  )
);
create index if not exists teacher_promotions_teacher_created_idx
  on public.teacher_promotions (teacher_id, created_at desc);
create index if not exists teacher_promotions_active_end_idx
  on public.teacher_promotions (ends_at)
  where status = 'active';

create or replace function public.list_public_teachers()
returns table (
  id uuid,
  full_name text,
  headline text,
  subject text,
  languages text[],
  city text,
  online_available boolean,
  hourly_rate numeric,
  avatar_url text,
  promoted_from timestamptz,
  promoted_until timestamptz
)
language sql
stable
set search_path = ''
as $$
  select p.id, p.full_name, p.headline, p.subject, p.languages, p.city,
    p.online_available, p.hourly_rate, p.avatar_url, p.promoted_from, p.promoted_until
  from public.profiles p
  where p.role = 'docente' and p.is_public = true
  order by coalesce(p.promoted_from <= now() and p.promoted_until > now(), false) desc,
    p.created_at desc
  limit 60;
$$;
revoke all on function public.list_public_teachers() from public;
grant execute on function public.list_public_teachers() to anon, authenticated;

drop policy if exists "Teachers can view their promotions" on public.teacher_promotions;
alter table public.teacher_promotions enable row level security;
create policy "Teachers can view their promotions"
  on public.teacher_promotions for select to authenticated
  using (auth.uid() = teacher_id);

create or replace function public.prevent_user_promotion_edits()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if auth.role() = 'authenticated'
    and (new.promoted_from is distinct from old.promoted_from
      or new.promoted_until is distinct from old.promoted_until) then
    raise exception 'Promotion status can only be changed by a verified payment';
  end if;
  return new;
end;
$$;
drop trigger if exists profiles_protected_promotion on public.profiles;
create trigger profiles_protected_promotion
  before update on public.profiles
  for each row execute procedure public.prevent_user_promotion_edits();

create table if not exists public.teacher_payout_accounts (
  teacher_id uuid primary key references public.profiles (id) on delete cascade,
  stripe_account_id text not null unique,
  details_submitted boolean not null default false,
  charges_enabled boolean not null default false,
  payouts_enabled boolean not null default false,
  updated_at timestamptz not null default now()
);

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles (id) on delete cascade,
  teacher_id uuid not null references public.profiles (id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  amount_cents integer not null check (amount_cents > 0),
  platform_fee_cents integer not null check (platform_fee_cents >= 0),
  currency text not null default 'eur' check (currency = 'eur'),
  status text not null default 'pending_payment'
    check (status in ('pending_payment', 'confirmed', 'cancelled', 'completed', 'refund_pending', 'refunded')),
  stripe_checkout_session_id text unique,
  stripe_payment_intent_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint bookings_different_users check (student_id <> teacher_id),
  constraint bookings_valid_duration check (ends_at > starts_at and ends_at - starts_at <= interval '3 hours')
);

alter table public.bookings
  drop constraint if exists bookings_status_check;
alter table public.bookings
  add constraint bookings_status_check
  check (status in ('pending_payment', 'confirmed', 'cancelled', 'completed', 'refund_pending', 'refunded'));

create index if not exists bookings_teacher_schedule_idx
  on public.bookings (teacher_id, starts_at)
  where status in ('pending_payment', 'confirmed');
create index if not exists bookings_student_schedule_idx
  on public.bookings (student_id, starts_at desc);

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  user_a uuid not null references public.profiles (id) on delete cascade,
  user_b uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint conversations_distinct_users check (user_a < user_b),
  constraint conversations_unique_pair unique (user_a, user_b)
);

drop policy if exists "Conversation members can read chat images" on storage.objects;
create policy "Conversation members can read chat images"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'chat-images'
    and exists (
      select 1 from public.conversations c
      where c.id::text = (storage.foldername(name))[1]
        and auth.uid() in (c.user_a, c.user_b)
    )
  );
drop policy if exists "Conversation members can upload their chat images" on storage.objects;
create policy "Conversation members can upload their chat images"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'chat-images'
    and (storage.foldername(name))[2] = auth.uid()::text
    and exists (
      select 1 from public.conversations c
      where c.id::text = (storage.foldername(name))[1]
        and auth.uid() in (c.user_a, c.user_b)
    )
  );
drop policy if exists "Users can update their own chat images" on storage.objects;
create policy "Users can update their own chat images"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'chat-images'
    and (storage.foldername(name))[2] = auth.uid()::text
    and exists (
      select 1 from public.conversations c
      where c.id::text = (storage.foldername(name))[1]
        and auth.uid() in (c.user_a, c.user_b)
    )
  )
  with check (
    bucket_id = 'chat-images'
    and (storage.foldername(name))[2] = auth.uid()::text
    and exists (
      select 1 from public.conversations c
      where c.id::text = (storage.foldername(name))[1]
        and auth.uid() in (c.user_a, c.user_b)
    )
  );
drop policy if exists "Users can delete their own chat images" on storage.objects;
create policy "Users can delete their own chat images"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'chat-images'
    and (storage.foldername(name))[2] = auth.uid()::text
    and exists (
      select 1 from public.conversations c
      where c.id::text = (storage.foldername(name))[1]
        and auth.uid() in (c.user_a, c.user_b)
    )
  );

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  sender_id uuid not null references public.profiles (id) on delete cascade,
  content text not null check (char_length(content) between 1 and 3000),
  created_at timestamptz not null default now()
);
alter table public.messages
  add column if not exists message_type text not null default 'text',
  add column if not exists attachment_path text;
alter table public.messages
  drop constraint if exists messages_attachment_check;
alter table public.messages
  add constraint messages_attachment_check check (
    (message_type = 'text' and attachment_path is null)
    or (message_type = 'image' and attachment_path is not null)
  );
create index if not exists messages_conversation_created_idx
  on public.messages (conversation_id, created_at desc);

create table if not exists public.study_rooms (
  id uuid primary key default gen_random_uuid(),
  host_id uuid not null references public.profiles (id) on delete cascade,
  title text not null check (char_length(title) between 3 and 100),
  starts_at timestamptz not null,
  duration_minutes integer not null check (duration_minutes in (60, 120, 180)),
  capacity integer not null default 8 check (capacity between 2 and 10),
  status text not null default 'scheduled' check (status in ('scheduled', 'cancelled', 'completed')),
  created_at timestamptz not null default now()
);
create index if not exists study_rooms_schedule_idx
  on public.study_rooms (starts_at)
  where status = 'scheduled';

create table if not exists public.study_room_members (
  room_id uuid not null references public.study_rooms (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'pending_payment' check (status in ('pending_payment', 'joined', 'cancelled', 'refund_pending', 'refunded')),
  pending_until timestamptz not null default (now() + interval '30 minutes'),
  stripe_checkout_session_id text unique,
  stripe_payment_intent_id text,
  created_at timestamptz not null default now(),
  joined_at timestamptz,
  primary key (room_id, user_id)
);

alter table public.study_room_members
  add column if not exists stripe_payment_intent_id text;
alter table public.study_room_members
  drop constraint if exists study_room_members_status_check;
alter table public.study_room_members
  add constraint study_room_members_status_check
  check (status in ('pending_payment', 'joined', 'cancelled', 'refund_pending', 'refunded'));

create index if not exists study_room_members_user_idx
  on public.study_room_members (user_id, created_at desc);

create or replace function public.reserve_paid_booking(
  p_student_id uuid,
  p_teacher_id uuid,
  p_starts_at timestamptz
)
returns table (booking_id uuid)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_booking_id uuid;
begin
  if p_student_id = p_teacher_id then
    raise exception 'You cannot book your own class';
  end if;
  if p_starts_at < now() + interval '15 minutes'
    or p_starts_at > now() + interval '90 days' then
    raise exception 'The selected time is outside the booking window';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_teacher_id::text, 0));

  if exists (
    select 1
    from public.bookings b
    where b.teacher_id = p_teacher_id
      and b.status in ('pending_payment', 'confirmed')
      and tstzrange(b.starts_at, b.ends_at, '[)')
        && tstzrange(p_starts_at, p_starts_at + interval '1 hour', '[)')
  ) then
    raise exception 'This teacher already has a booking at the selected time';
  end if;

  if not exists (
    select 1
    from public.profiles p
    join public.teacher_payout_accounts a on a.teacher_id = p.id and a.charges_enabled = true
    where p.id = p_teacher_id
      and p.role = 'docente'
      and p.is_public = true
      and p.hourly_rate > 0
      and extract(isodow from (p_starts_at at time zone p.timezone))::smallint = any(p.availability_days)
      and (p_starts_at at time zone p.timezone)::time >= p.availability_start
      and ((p_starts_at + interval '1 hour') at time zone p.timezone)::time <= p.availability_end
      and (p_starts_at at time zone p.timezone)::date = ((p_starts_at + interval '1 hour') at time zone p.timezone)::date
  ) then
    raise exception 'The teacher is not available at the selected time';
  end if;

  insert into public.bookings (student_id, teacher_id, starts_at, ends_at, amount_cents, platform_fee_cents)
  select p_student_id, p.id, p_starts_at, p_starts_at + interval '1 hour',
    round(p.hourly_rate * 100)::integer,
    round(p.hourly_rate * 8)::integer
  from public.profiles p
  join public.teacher_payout_accounts a on a.teacher_id = p.id and a.charges_enabled = true
  where p.id = p_teacher_id
    and p.role = 'docente'
    and p.is_public = true
    and p.hourly_rate > 0
  returning id into v_booking_id;

  if v_booking_id is null then
    raise exception 'This teacher is not currently accepting paid bookings';
  end if;
  return query select v_booking_id;
end;
$$;

create or replace function public.reserve_study_room_seat(
  p_room_id uuid,
  p_user_id uuid
)
returns table (room_title text, room_starts_at timestamptz, room_duration_minutes integer, room_capacity integer)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_room public.study_rooms%rowtype;
  v_active_count integer;
begin
  perform pg_advisory_xact_lock(hashtextextended(p_room_id::text, 0));

  select * into v_room
  from public.study_rooms
  where id = p_room_id and status = 'scheduled'
  for update;
  if not found then
    raise exception 'Study room not found';
  end if;
  if v_room.starts_at < now() + interval '15 minutes'
    or v_room.starts_at > now() + interval '90 days' then
    raise exception 'The study room is outside the booking window';
  end if;
  if exists (
    select 1 from public.study_room_members m
    where m.room_id = p_room_id
      and m.user_id = p_user_id
      and m.status = 'joined'
  ) then
    raise exception 'You already joined this study room';
  end if;
  if exists (
    select 1 from public.study_room_members m
    where m.room_id = p_room_id
      and m.user_id = p_user_id
      and m.status = 'pending_payment'
      and m.pending_until > now()
  ) then
    raise exception 'You already have a pending checkout for this room';
  end if;
  select count(*) into v_active_count
  from public.study_room_members m
  where m.room_id = p_room_id
    and (m.status = 'joined' or (m.status = 'pending_payment' and m.pending_until > now()));
  if v_active_count >= v_room.capacity then
    raise exception 'This study room is full';
  end if;
  insert into public.study_room_members (room_id, user_id)
  values (p_room_id, p_user_id)
  on conflict (room_id, user_id) do update
    set status = 'pending_payment',
        pending_until = now() + interval '30 minutes',
        stripe_checkout_session_id = null
    where public.study_room_members.status <> 'joined';
  if not found then
    raise exception 'You already joined this study room';
  end if;
  return query select v_room.title, v_room.starts_at, v_room.duration_minutes, v_room.capacity;
end;
$$;

create or replace function public.get_or_create_conversation(p_target_user_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_current_user uuid := auth.uid();
  v_conversation_id uuid;
  v_user_a uuid;
  v_user_b uuid;
begin
  if v_current_user is null then
    raise exception 'Authentication required';
  end if;
  if v_target_user_id = v_current_user then
    raise exception 'You cannot start a conversation with yourself';
  end if;
  if not exists (
    select 1 from public.profiles
    where id = p_target_user_id and role = 'docente' and is_public = true
  ) then
    raise exception 'This profile is not available for contact';
  end if;

  v_user_a := least(v_current_user, p_target_user_id);
  v_user_b := greatest(v_current_user, p_target_user_id);
  insert into public.conversations (user_a, user_b)
  values (v_user_a, v_user_b)
  on conflict (user_a, user_b) do update set user_a = excluded.user_a
  returning id into v_conversation_id;
  return v_conversation_id;
end;
$$;

create or replace function public.activate_teacher_promotion(
  p_promotion_id uuid,
  p_checkout_session_id text,
  p_payment_intent_id text
)
returns table (promotion_starts_at timestamptz, promotion_ends_at timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_promotion public.teacher_promotions%rowtype;
  v_start timestamptz;
  v_end timestamptz;
  v_count integer := 0;
begin
  select * into v_promotion
  from public.teacher_promotions
  where id = p_promotion_id
    and stripe_checkout_session_id = p_checkout_session_id
  for update;
  if not found then
    raise exception 'Promotion checkout not found';
  end if;

  if v_promotion.status = 'active' then
    return query select v_promotion.starts_at, v_promotion.ends_at;
    return;
  end if;
  if v_promotion.status <> 'pending_payment' then
    raise exception 'Promotion is no longer pending';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(v_promotion.teacher_id::text, 1));
  select coalesce(max(p.ends_at), now()) into v_start
  from public.teacher_promotions p
  where p.teacher_id = v_promotion.teacher_id
    and p.status = 'active'
    and p.ends_at > now();
  v_end := v_start;

  while v_count < 15 loop
    if extract(isodow from (v_end at time zone 'Europe/Madrid')) between 1 and 5 then
      v_count := v_count + 1;
    end if;
    if v_count < 15 then
      v_end := v_end + interval '1 day';
    end if;
  end loop;

  update public.teacher_promotions
  set status = 'active',
      starts_at = v_start,
      ends_at = v_end,
      stripe_payment_intent_id = p_payment_intent_id
  where id = p_promotion_id;

  update public.profiles
  set promoted_from = v_start, promoted_until = v_end, updated_at = now()
  where id = v_promotion.teacher_id;

  return query select v_start, v_end;
end;
$$;

alter table public.teacher_payout_accounts enable row level security;
alter table public.bookings enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.study_rooms enable row level security;
alter table public.study_room_members enable row level security;
alter table public.teacher_promotions enable row level security;

drop policy if exists "Participants can view bookings" on public.bookings;
create policy "Participants can view bookings"
  on public.bookings for select to authenticated
  using (auth.uid() = student_id or auth.uid() = teacher_id);

drop policy if exists "Participants can view conversations" on public.conversations;
create policy "Participants can view conversations"
  on public.conversations for select to authenticated
  using (auth.uid() = user_a or auth.uid() = user_b);

drop policy if exists "Participants can view messages" on public.messages;
create policy "Participants can view messages"
  on public.messages for select to authenticated
  using (exists (
    select 1 from public.conversations c
    where c.id = conversation_id and auth.uid() in (c.user_a, c.user_b)
  ));

drop policy if exists "Participants can send messages" on public.messages;
create policy "Participants can send messages"
  on public.messages for insert to authenticated
  with check (
    sender_id = auth.uid()
    and exists (
      select 1 from public.conversations c
      where c.id = conversation_id and auth.uid() in (c.user_a, c.user_b)
    )
  );

drop policy if exists "Users can view scheduled rooms" on public.study_rooms;
create policy "Users can view scheduled rooms"
  on public.study_rooms for select to authenticated
  using (
    status = 'scheduled'
    and (starts_at > now() - interval '3 hours')
  );

drop policy if exists "Room members can view their seats" on public.study_room_members;
create policy "Room members can view their seats"
  on public.study_room_members for select to authenticated
  using (
    auth.uid() = user_id
    or exists (
      select 1 from public.study_rooms r
      where r.id = room_id and r.host_id = auth.uid()
    )
  );

revoke all on public.teacher_payout_accounts from anon, authenticated;
revoke insert, update, delete on public.bookings from anon, authenticated;
revoke insert, update, delete on public.conversations from anon, authenticated;
revoke insert, update, delete on public.study_rooms from anon, authenticated;
revoke insert, update, delete on public.study_room_members from anon, authenticated;
revoke insert, update, delete on public.teacher_promotions from anon, authenticated;
grant select on public.bookings, public.conversations, public.messages, public.study_rooms, public.study_room_members to authenticated;
grant select on public.teacher_promotions to authenticated;
grant insert on public.messages to authenticated;
grant select on public.profiles to authenticated;
grant select, update on public.profiles to service_role;
grant all on public.teacher_payout_accounts, public.bookings, public.conversations, public.messages,
  public.study_rooms, public.study_room_members, public.teacher_promotions to service_role;
grant execute on function public.get_or_create_conversation(uuid) to authenticated;
revoke all on function public.activate_teacher_promotion(uuid, text, text) from public, anon, authenticated;
grant execute on function public.activate_teacher_promotion(uuid, text, text) to service_role;
revoke all on function public.reserve_paid_booking(uuid, uuid, timestamptz) from public, anon, authenticated;
revoke all on function public.reserve_study_room_seat(uuid, uuid) from public, anon, authenticated;
grant execute on function public.reserve_paid_booking(uuid, uuid, timestamptz) to service_role;
grant execute on function public.reserve_study_room_seat(uuid, uuid) to service_role;

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'messages'
    ) then
      alter publication supabase_realtime add table public.messages;
    end if;
  end if;
end;
$$;
