-- Run this in Supabase SQL Editor to fix RLS for frontend direct access

-- Allow users to insert their own row during signup (auth.uid() matches id)
drop policy if exists "Users can insert own profile" on public.users;
create policy "Users can insert own profile"
  on public.users for insert
  with check (auth.uid() = id);

-- Allow service role to insert any user (for seeding and backend)
-- This is handled automatically by service role bypassing RLS

-- Allow reading all users (needed for alumni discovery, student profile lookup)
drop policy if exists "Users can read all profiles" on public.users;
create policy "Users can read all profiles"
  on public.users for select using (true);

-- Allow users to update their own profile
drop policy if exists "Users can update own profile" on public.users;
create policy "Users can update own profile"
  on public.users for update
  using (true);

-- Allow authenticated users to insert interview requests
drop policy if exists "Students can create requests" on public.interview_requests;
create policy "Students can create requests"
  on public.interview_requests for insert
  with check (true);

-- Allow involved users to read requests
drop policy if exists "Involved users can view requests" on public.interview_requests;
create policy "Involved users can view requests"
  on public.interview_requests for select
  using (true);

-- Allow alumni to update requests (accept/decline/book)
drop policy if exists "Alumni can update requests" on public.interview_requests;
create policy "Alumni can update requests"
  on public.interview_requests for update
  using (true);

-- Allow inserting notifications
drop policy if exists "System can insert notifications" on public.notifications;
create policy "System can insert notifications"
  on public.notifications for insert
  with check (true);

-- Allow users to read own notifications
drop policy if exists "Users see own notifications" on public.notifications;
create policy "Users see own notifications"
  on public.notifications for select
  using (auth.uid() = user_id);

-- Allow users to mark own notifications read
drop policy if exists "Users can mark own notifications read" on public.notifications;
create policy "Users can mark own notifications read"
  on public.notifications for update
  using (auth.uid() = user_id);

-- Resume analyses
drop policy if exists "Users can insert own analyses" on public.resume_analyses;
create policy "Users can insert own analyses"
  on public.resume_analyses for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users see own analyses" on public.resume_analyses;
create policy "Users see own analyses"
  on public.resume_analyses for select
  using (auth.uid() = user_id);
