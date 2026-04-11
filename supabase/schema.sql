-- ============================================================
-- AlumniConnect Supabase Schema
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

-- Enable UUID extension (already enabled on Supabase by default)
create extension if not exists "uuid-ossp";

-- ─── 1. USERS ────────────────────────────────────────────────
-- Extends Supabase auth.users with app-specific profile data
create table if not exists public.users (
  id                  uuid primary key references auth.users(id) on delete cascade,
  role                text not null default 'STUDENT' check (role in ('STUDENT','ALUMNI','TNP')),
  name                text not null,
  email               text not null unique,
  department          text,
  college_id          text,           -- for students (e.g. STU1001)
  company             text,           -- for alumni
  batch_year          int,            -- for alumni
  verification_status text not null default 'PENDING' check (verification_status in ('PENDING','VERIFIED','REJECTED')),
  profile_data        jsonb,          -- resume analysis results, skills, bio, links
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- ─── 2. COLLEGE REGISTRY ─────────────────────────────────────
-- Replaces college_db.json
create table if not exists public.college_registry (
  college_id  text primary key,
  name        text not null,
  department  text not null
);

-- Seed the registry with initial data
insert into public.college_registry (college_id, name, department) values
  ('STU1001', 'Alice Johnson',  'Computer Science'),
  ('STU1002', 'Bob Smith',      'Electrical Engineering'),
  ('STU1003', 'Charlie Davis',  'Mechanical Engineering')
on conflict (college_id) do nothing;

-- ─── 3. SCHEDULE SLOTS ───────────────────────────────────────
create table if not exists public.schedule_slots (
  slot_id     uuid primary key default uuid_generate_v4(),
  alumni_id   uuid not null references public.users(id) on delete cascade,
  student_id  uuid references public.users(id) on delete set null,
  start_time  timestamptz not null,
  end_time    timestamptz not null,
  status      text not null default 'OPEN' check (status in ('OPEN','BOOKED','COMPLETED','CANCELLED')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ─── 4. INTERVIEW REQUESTS ───────────────────────────────────
-- Replaces localStorage interview requests store
create table if not exists public.interview_requests (
  request_id               uuid primary key default uuid_generate_v4(),
  student_id               uuid not null references public.users(id) on delete cascade,
  alumni_id                uuid not null references public.users(id) on delete cascade,
  topic                    text not null default 'Mock Interview',
  message                  text,
  status                   text not null default 'PENDING' check (status in ('PENDING','ACCEPTED','SLOT_BOOKED','DECLINED')),
  room_id                  text,
  scheduled_time           timestamptz,
  student_profile_snapshot jsonb,     -- snapshot of student profile at request time
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

-- ─── 5. INTERVIEW RECORDS ────────────────────────────────────
create table if not exists public.interview_records (
  interview_id    uuid primary key default uuid_generate_v4(),
  student_id      uuid not null references public.users(id) on delete cascade,
  alumni_id       uuid not null references public.users(id) on delete cascade,
  slot_id         uuid references public.schedule_slots(slot_id) on delete set null,
  request_id      uuid references public.interview_requests(request_id) on delete set null,
  transcript      text,
  student_score   float,
  alumni_feedback text,
  ai_action_items jsonb,              -- structured AI output
  status          text not null default 'SCHEDULED' check (status in ('SCHEDULED','IN_PROGRESS','COMPLETED')),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ─── 6. NOTIFICATIONS ────────────────────────────────────────
-- Replaces localStorage notifications store
create table if not exists public.notifications (
  notification_id uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references public.users(id) on delete cascade,
  type            text not null check (type in ('ACCEPTED','SLOT_BOOKED','DECLINED','SYSTEM')),
  title           text not null,
  message         text not null,
  request_id      uuid references public.interview_requests(request_id) on delete set null,
  read            boolean not null default false,
  created_at      timestamptz not null default now()
);

-- ─── 7. RESUME ANALYSES ──────────────────────────────────────
create table if not exists public.resume_analyses (
  id               uuid primary key default uuid_generate_v4(),
  user_id          uuid not null references public.users(id) on delete cascade,
  score            int,
  target_companies jsonb,
  formatting_fixes jsonb,
  created_at       timestamptz not null default now()
);

-- ─── UPDATED_AT TRIGGER ──────────────────────────────────────
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger users_updated_at
  before update on public.users
  for each row execute function public.handle_updated_at();

create trigger schedule_slots_updated_at
  before update on public.schedule_slots
  for each row execute function public.handle_updated_at();

create trigger interview_requests_updated_at
  before update on public.interview_requests
  for each row execute function public.handle_updated_at();

create trigger interview_records_updated_at
  before update on public.interview_records
  for each row execute function public.handle_updated_at();

-- ─── ROW LEVEL SECURITY ──────────────────────────────────────
alter table public.users               enable row level security;
alter table public.college_registry    enable row level security;
alter table public.schedule_slots      enable row level security;
alter table public.interview_requests  enable row level security;
alter table public.interview_records   enable row level security;
alter table public.notifications       enable row level security;
alter table public.resume_analyses     enable row level security;

-- Users: can read all profiles, only update own
create policy "Users can read all profiles"
  on public.users for select using (true);

create policy "Users can update own profile"
  on public.users for update using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.users for insert with check (auth.uid() = id);

-- College registry: public read
create policy "College registry is public"
  on public.college_registry for select using (true);

-- Schedule slots: public read, alumni manage own
create policy "Anyone can view slots"
  on public.schedule_slots for select using (true);

create policy "Alumni can insert own slots"
  on public.schedule_slots for insert
  with check (auth.uid() = alumni_id);

create policy "Alumni can update own slots"
  on public.schedule_slots for update
  using (auth.uid() = alumni_id);

-- Interview requests: student or alumni involved can read
create policy "Involved users can view requests"
  on public.interview_requests for select
  using (auth.uid() = student_id or auth.uid() = alumni_id);

create policy "Students can create requests"
  on public.interview_requests for insert
  with check (auth.uid() = student_id);

create policy "Alumni can update requests"
  on public.interview_requests for update
  using (auth.uid() = alumni_id or auth.uid() = student_id);

-- Interview records: involved users can read
create policy "Involved users can view records"
  on public.interview_records for select
  using (auth.uid() = student_id or auth.uid() = alumni_id);

create policy "System can insert records"
  on public.interview_records for insert
  with check (auth.uid() = student_id or auth.uid() = alumni_id);

create policy "Involved users can update records"
  on public.interview_records for update
  using (auth.uid() = student_id or auth.uid() = alumni_id);

-- Notifications: users can only see their own
create policy "Users see own notifications"
  on public.notifications for select
  using (auth.uid() = user_id);

create policy "System can insert notifications"
  on public.notifications for insert
  with check (true);

create policy "Users can mark own notifications read"
  on public.notifications for update
  using (auth.uid() = user_id);

-- Resume analyses: users see own
create policy "Users see own analyses"
  on public.resume_analyses for select
  using (auth.uid() = user_id);

create policy "Users can insert own analyses"
  on public.resume_analyses for insert
  with check (auth.uid() = user_id);

-- ─── REALTIME ────────────────────────────────────────────────
-- Enable realtime for notifications and interview_requests
-- (Run in Supabase Dashboard → Database → Replication, or via SQL)
alter publication supabase_realtime add table public.notifications;
alter publication supabase_realtime add table public.interview_requests;
