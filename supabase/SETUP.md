# Supabase Setup Guide

## 1. Create a Supabase Project
Go to [supabase.com](https://supabase.com) → New Project.

## 2. Run the Schema
Dashboard → SQL Editor → paste and run `schema.sql`.  
This creates all 7 tables, RLS policies, triggers, and seeds the college registry.

## 3. Get Your Keys
Dashboard → Project Settings → API:
- `Project URL` → `SUPABASE_URL` (backend) and `VITE_SUPABASE_URL` (frontend)
- `anon public` key → `VITE_SUPABASE_ANON_KEY` (frontend)
- `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (backend only, never expose to frontend)

## 4. Fill in .env Files

**backend/.env**
```
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
JWT_SECRET=your_strong_secret
```

**frontend/.env**
```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

## 5. Enable Realtime (optional)
Dashboard → Database → Replication → enable `notifications` and `interview_requests` tables.  
This lets the frontend subscribe to live notification updates instead of polling.

## 6. Storage Bucket for Resumes (optional)
Dashboard → Storage → New Bucket → name it `resumes` → set to private.  
Update the resume upload route to use `supabase.storage.from('resumes').upload(...)`.

## Tables Created
| Table | Purpose |
|---|---|
| `users` | All users (students, alumni, TNP) — extends Supabase auth |
| `college_registry` | Replaces `college_db.json` for student OCR verification |
| `schedule_slots` | Alumni availability slots |
| `interview_requests` | Replaces localStorage request store |
| `interview_records` | Completed interview data + AI output |
| `notifications` | Replaces localStorage notification store |
| `resume_analyses` | Persisted resume analysis history |
