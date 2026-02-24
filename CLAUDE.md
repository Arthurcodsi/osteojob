# OsteoJob

A job board website for osteopaths to post and find job offers.

## Tech Stack
- **Framework:** Next.js 16 (App Router) with TypeScript
- **Styling:** Tailwind CSS v4
- **Auth & Database:** Supabase
- **Deployment:** Vercel

## Local Development
```bash
cd C:\Users\codsi\osteojob
npm run dev
```
Runs on http://localhost:3000

## Key Links
- **Vercel (production):** https://osteojob-eight.vercel.app/
- **GitHub:** https://github.com/Arthurcodsi/osteojob
- **Supabase:** https://tpidiusbxsknhbnlbdxp.supabase.co

## Supabase
- **URL:** https://tpidiusbxsknhbnlbdxp.supabase.co
- **Anon key:** eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRwaWRpdXNieHNrbmhibmxiZHhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3Njk4MzMsImV4cCI6MjA4MzM0NTgzM30.OGDBTPHZOUgdOmtNghNYmexL1YgwwIU-k8WVgVtPP4o

## Route Structure
- `/` — Home
- `/jobs` — Job listings
- `/jobs/[id]` — Job detail
- `/jobs/[id]/apply` — Apply for a job
- `/dashboard` — User dashboard (protected)
- `/profile` — User settings
- `/account/change-password` — Change password (protected)
- `/post-job` — Post a job (employers only)
- `/auth/login` — Login
- `/auth/signup` — Signup
- `/auth/forgot-password` — Forgot password
- `/auth/reset-password` — Reset password (via email link)

## User Types
- **candidate** — can browse and apply for jobs
- **employer** — can post and manage jobs

## Key Files
- `app/layout.tsx` — Root layout with header/nav/footer and account menu
- `lib/supabase.ts` — Supabase client and TypeScript types

## One-Time Scripts

### Backfill city images for existing jobs
Fetches a Wikipedia photo for each job that has no `featured_image`. Uses the city name, falls back to country.
Requires the Supabase service role key (Supabase → Project Settings → API → service_role secret).

```bash
# 1. Paste service_role key into scripts/backfill-city-images.mjs
# 2. Run:
node scripts/backfill-city-images.mjs
# 3. Remove the key from the script afterwards
```

Already run once on 2026-02-23 — updated ~160 of 243 jobs.

---

## TODO at Launch: Switch Domain from SiteGround to Vercel

The domain `osteojob.com` is registered on GoDaddy but DNS is currently managed by SiteGround (old website).

### Steps to go live on Vercel:
1. **In Vercel** → Project Settings → Domains → Add `osteojob.com`
   - Vercel will give you DNS records to add (an A record and/or CNAME)
2. **In SiteGround** → go to DNS Zone Editor and update the records:
   - Point the A record for `@` to Vercel's IP
   - Point `www` CNAME to `cname.vercel-dns.com`
   - (Or update GoDaddy nameservers to point to Vercel's nameservers instead)
3. Wait up to 24h for DNS propagation — the old SiteGround site will go offline
4. SSL is handled automatically by Vercel (no action needed)

> Do this last, after everything else is ready (Zoho email, bulk invite, final testing).

---

## TODO at Launch: Email Setup

Currently using **Gmail SMTP** for testing. Switch to **Zoho Mail** at launch.

### 1. Set up Zoho Mail
- Create a Zoho Mail account at zoho.com/mail
- Add your domain (`osteojob.com`) and verify it via DNS records in SiteGround
- Create a mailbox e.g. `hello@osteojob.com`
- Generate an App Password in Zoho (My Account → Security → App Passwords)

### 2. Update `.env.local` and Vercel environment variables
```
ZOHO_SMTP_HOST=smtp.zoho.eu
ZOHO_SMTP_USER=hello@osteojob.com
ZOHO_SMTP_PASS=your_zoho_app_password
```
In Vercel → Project Settings → Environment Variables, update all three.

### 3. Update the email template logo URL
In `app/api/notify-application/route.ts` line 68, change:
```
https://osteojob-eight.vercel.app/logo.png
→
https://osteojob.com/logo.png
```

### 4. Update the email template dashboard link
Already set to `https://osteojob.com/dashboard` — nothing to change.

---

## Migration Plan (WordPress → Supabase)

Existing employers are in the `profiles` table (imported from WordPress) with jobs already linked.
`auth.users` will be wiped clean before launch. Profiles and jobs must be kept intact.

### How re-linking works
A Supabase trigger (`on_auth_user_created`) fires when a new auth user is created.
It matches the signup email to an existing profile, updates `profiles.id` to the new auth UUID,
and `jobs.employer_id` CASCADE UPDATEs automatically — so all their jobs reappear in the dashboard.

### TODO at launch: bulk invite script (Option 2)
Use the Supabase Admin API to send each employer a magic invite link.
They click it, set a password, and land straight in their dashboard with all jobs intact.

```ts
// Run once per employer email in the profiles table
const { data, error } = await supabase.auth.admin.inviteUserByEmail('employer@example.com')
```

Steps:
1. Fetch all employer emails from `profiles` where `user_type = 'employer'`
2. Call `inviteUserByEmail` for each one
3. Supabase sends a magic link — one click and they're in with all jobs linked
