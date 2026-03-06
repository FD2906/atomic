

## Build Out the ATOMIC Data Model and Wire Up the Application

Based on the class diagram, the app needs these database tables and then the frontend pages wired to real data instead of mock data.

### Phase 1: Database Migration

Create all tables in a single migration:

**profiles** -- auto-created on auth signup via trigger
- `id` (uuid, PK, references auth.users)
- `email` (text)
- `first_name` (text)
- `last_name` (text)
- `spending_limit` (numeric, default null)
- `onboarding_completed` (boolean, default false)
- `date_registered` (timestamptz, default now())
- `created_at` / `updated_at`

**charities** -- seeded with 5 charities
- `id` (uuid, PK)
- `name`, `description`, `category` (text)
- `sdg_alignment` (text)
- `is_featured` (boolean, default false)
- `total_received` (numeric, default 0)

**habits**
- `id` (uuid, PK)
- `user_id` (uuid, references profiles, not null)
- `title`, `description`, `frequency`, `category` (text)
- `daily_deadline` (time)
- `start_date`, `end_date` (date)
- `status` (text: active/completed/failed, default 'active')
- `verification_type` (text, default 'photo')
- `created_at`

**stakes**
- `id` (uuid, PK)
- `habit_id` (uuid, references habits)
- `user_id` (uuid, references profiles)
- `charity_id` (uuid, references charities)
- `amount` (numeric, not null)
- `currency` (text, default 'GBP')
- `status` (text: held/returned/donated, default 'held')
- `date_created` (timestamptz, default now())
- `date_resolved` (timestamptz)

**verification_submissions** (evidence)
- `id` (uuid, PK)
- `habit_id` (uuid, references habits)
- `user_id` (uuid, references profiles)
- `evidence_type` (text, default 'photo')
- `file_url` (text)
- `notes` (text)
- `submitted_at` (timestamptz, default now())
- `status` (text: pending/approved/rejected, default 'pending')
- `rejection_reason` (text)

**transactions**
- `id` (uuid, PK)
- `user_id` (uuid, references profiles)
- `stake_id` (uuid, references stakes)
- `amount` (numeric)
- `type` (text: stake/charity_donation/refund)
- `status` (text: pending/completed, default 'pending')
- `timestamp` (timestamptz, default now())
- `payment_reference` (text)

**challenges**
- `id` (uuid, PK)
- `title`, `description` (text)
- `is_group_challenge` (boolean, default false)
- `start_date`, `end_date` (date)
- `status` (text, default 'active')
- `created_by` (uuid, references profiles)

**challenge_participants**
- `id` (uuid, PK)
- `challenge_id` (uuid, references challenges)
- `user_id` (uuid, references profiles)
- unique(challenge_id, user_id)

**notifications**
- `id` (uuid, PK)
- `user_id` (uuid, references profiles)
- `message`, `type` (text)
- `is_read` (boolean, default false)
- `created_at` (timestamptz, default now())

**Plus:**
- A trigger on `auth.users` insert to auto-create a `profiles` row
- A storage bucket `evidence` for photo uploads
- RLS policies on all tables (users can only CRUD their own rows; charities readable by all)
- Seed the 5 charities (MIND, WWF, Cancer Research UK, Shelter, British Heart Foundation)
- Enable realtime on `notifications`

### Phase 2: Frontend Wiring

**Files to edit:**

1. **CreateHabit.tsx** -- save habit + stake + charity to DB on submit; load charities from DB instead of mock
2. **Dashboard.tsx** -- fetch user's active habits, stakes, and compute stats from DB; replace all mock data
3. **SubmitEvidence.tsx** -- upload photo to storage bucket, insert verification_submission row
4. **History.tsx** -- fetch completed/failed habits from DB with stake outcomes
5. **Profile.tsx** -- load profile from DB; save spending limit to DB
6. **SpendingLimit.tsx** -- read/write spending_limit on profiles table
7. **Notifications.tsx** -- fetch real notifications from DB, mark as read

**New files:**
- `src/hooks/useAuth.ts` -- shared auth hook with redirect guard for protected routes
- `src/hooks/useProfile.ts` -- fetch/update profile data

### Phase 3: Auth Guards

- Add an auth check wrapper so `/dashboard`, `/create`, `/history`, `/profile` redirect to `/login` if not authenticated
- After login/register, redirect to `/onboarding` if `onboarding_completed` is false, otherwise `/dashboard`

---

### Summary of changes

| Area | Action |
|------|--------|
| Database | 1 migration with 9 tables, RLS, trigger, seed data |
| Storage | 1 `evidence` bucket |
| Dashboard | Real data from habits + stakes |
| CreateHabit | Insert habit + stake + charity link |
| SubmitEvidence | Upload to storage + insert submission |
| History | Query completed habits |
| Profile/SpendingLimit | Read/write profiles table |
| Notifications | Real notifications with realtime |
| Auth | Protected route wrapper + onboarding flow |

