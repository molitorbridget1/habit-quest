# Habit Quest — Tonight's MVP

This is the working core loop: parent signup → add a child → child logs in with a PIN → daily habit tracker with XP, levels, streaks, and mood check-in. Coach features, lessons, and squads are intentionally not in this build — this proves the loop first.

## 1. Create your Supabase project
1. Go to supabase.com → New Project (same flow you used for Molitor OS)
2. Once it's created, go to **SQL Editor** and paste the contents of `supabase/migrations/0001_mvp_init.sql`, then run it. This creates all the tables and security policies.
3. Go to **Project Settings → API** and copy your **Project URL** and **anon public key**.

## 2. Run it locally first (recommended before deploying)
```
npm install
cp .env.local.example .env.local
```
Paste your Supabase URL and anon key into `.env.local`, then:
```
npm run dev
```
Open http://localhost:3000 and test the whole flow yourself: sign up → add a child → switch to kid view → log in with the PIN → tap through the habit loop.

## 3. Push to GitHub
```
git init
git add .
git commit -m "Habit Quest MVP"
```
Create a new repo on GitHub, then push (same pattern as your `molitormarketing/ifilmit` repo).

## 4. Deploy to Vercel
1. Import the GitHub repo into Vercel
2. In the Vercel project's **Environment Variables**, add the same two values from `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Deploy. You'll get a live `.vercel.app` URL to send to Allison and Jason.

## Known shortcuts taken for speed tonight (fix before real users)
- **Child PINs are stored in plain text** in the database for this demo. Before any real family uses this, PINs need to be hashed server-side — flag this to whoever does the security pass.
- **No email verification gate is enforced** — Supabase may still send a confirmation email depending on your project's auth settings; if you want zero friction for tonight's demo, you can turn off "Confirm email" under Authentication → Settings in Supabase.
- **Kid session is just a browser flag** (sessionStorage), not the signed short-lived token described in the full schema doc — fine for a same-device demo, not production-ready for a real child account system.
- No COPPA parental-consent screen is wired in yet — the full user flows doc has this designed, just not built into tonight's version.

## What to actually show Allison and Jason
Sign up as a parent live, add a kid, switch to kid view, and tap through logging water/veggies/movement/sleep — show the XP bar moving and the "Adventure Complete" celebration. That's the loop the whole business is betting on.
