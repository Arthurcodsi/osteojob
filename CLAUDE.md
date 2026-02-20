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
