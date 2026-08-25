# Study Hub

A production-ready personal study management app: subjects, notes, a weekly
schedule, resource links/files, and progress tracking — all private to each
signed-in user.

**Stack:** Next.js 14 (App Router, TypeScript) · Supabase (Auth, Postgres,
Storage) · Tailwind CSS · deployed on Vercel.

---

## 1. Create the Supabase project

1. Go to [supabase.com](https://supabase.com) → **New project**. Pick a name,
   a database password (save it somewhere safe), and a region close to you.
   Wait ~2 minutes for it to provision.
2. In the dashboard, open **SQL Editor → New query**, paste the entire
   contents of [`supabase/schema.sql`](./supabase/schema.sql), and click
   **Run**. This creates every table, enables Row Level Security so each
   user can only ever see their own rows, sets up the `resources` storage
   bucket, and adds a trigger that creates a `profiles` row on signup.
3. Go to **Settings → API**. You'll need two values in the next step:
   - **Project URL**
   - **`anon` `public` key**
4. (Optional but recommended) Go to **Authentication → Providers → Email**
   and confirm "Confirm email" is on, so new signups verify their address.
   For local testing you can turn this off to skip the confirmation email.

## 2. Run the project locally

Requires [Node.js](https://nodejs.org) 18.18 or newer.

```bash
# 1. Unzip the project, then from inside the folder:
npm install

# 2. Copy the env template and fill in your Supabase values
cp .env.local.example .env.local
```

Open `.env.local` and paste in the Project URL and anon key from step 1.3:

```
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT-REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
```

Then start the dev server:

```bash
npm run dev
```

Visit `http://localhost:3000` — you'll land on the login page. Click
**Sign up**, create an account, confirm the email Supabase sends you (or skip
if you disabled confirmation), then log in. You'll start with an empty
account — add your own subjects from the **Subjects** page.

## 3. Deploy to Vercel (publish it online)

1. Push this project to a GitHub repository (create one on GitHub, then from
   the project folder):
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR-USERNAME/study-hub.git
   git push -u origin main
   ```
2. Go to [vercel.com](https://vercel.com) → **Add New → Project** → import
   the GitHub repo you just pushed.
3. Vercel auto-detects Next.js — leave the build settings as default.
4. Before deploying, open **Environment Variables** and add the same two
   values from your `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Click **Deploy**. In about a minute you'll get a live URL like
   `https://study-hub-yourname.vercel.app` — that's your app, online.
6. In Supabase, go to **Authentication → URL Configuration** and add your
   Vercel URL to **Site URL** and **Redirect URLs**, so email confirmation
   links point to the live site instead of `localhost`.

That's it — the app is live, and every user who signs up gets their own
private subjects, notes, schedule, resources, and progress, enforced at the
database level by Postgres Row Level Security (not just app-level checks).

## How data privacy works

Every table has Row Level Security enabled with a policy like
`auth.uid() = user_id`. This means even if someone found your Supabase URL
and anon key (which are meant to be public — they're safe in client-side
code), Postgres itself refuses to return or modify another user's rows.
Uploaded files in Storage are similarly scoped: each file is stored under a
path beginning with the uploader's user ID, and storage policies only allow
reading/writing within your own folder.

## Project structure

```
app/
  (auth)/login, (auth)/signup      — public auth pages
  (app)/dashboard, subjects,       — protected pages (redirect to
       notes, schedule,               /login if signed out)
       resources, progress
  layout.tsx, globals.css          — root layout, fonts, design tokens
components/                         — Sidebar, MobileNav, Modal, ConfirmDialog
lib/
  supabase/client.ts               — browser Supabase client
  supabase/server.ts               — server-component Supabase client
  supabase/middleware.ts           — session refresh + route protection
  context/SubjectsContext.tsx      — shares the subjects list across pages
  types.ts                         — shared TypeScript types
middleware.ts                      — wires up route protection
supabase/schema.sql                — full DB schema, RLS, storage policies
```

## Extending it

- **Password reset / magic links** — Supabase supports both out of the box;
  add a "Forgot password" link on the login page calling
  `supabase.auth.resetPasswordForEmail(email)`.
- **Recurring schedule / calendar view** — the `schedule_sessions` table
  uses a day-of-week model (like a weekly template). For specific calendar
  dates, add a `date` column and adjust the queries in
  `app/(app)/schedule/page.tsx`.
- **Sharing notes** — RLS currently scopes everything to the owner. To share,
  you'd add a `shared_with` table and a policy allowing reads for listed
  users.
