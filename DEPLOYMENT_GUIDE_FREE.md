# Free Deployment Guide (Fully Free) — Distribution Management System (Next.js + Prisma + PostgreSQL on Neon)

This project is a **Next.js App Router** app using **Prisma**.

✅ New goal in this guide: publish **PostgreSQL** (instead of SQLite) and host the **frontend on Cloudflare**.

**Recommended stack (fully free friendly):**
- **PostgreSQL:** Neon (free tier)
- **Next.js server:** Railway (free tier)
- **Frontend / CDN:** Cloudflare (free)

> Important: your current `prisma/schema.prisma` is set to `sqlite`. To use PostgreSQL you must switch Prisma provider + run migrations.


> Notes / limitations
- **SQLite + stateless hosting** requires **persistent storage** for the database file (`prisma/dev.db` or a production sqlite file). Without persistence, data will be lost on redeploy.
- Environment variables for Prisma must be set.
- You must run Prisma migrations against the production DB after deploy.

---

## 1) Prepare your project locally

### 1.1 Install dependencies
```bash
npm install
```

### 1.2 Ensure Prisma schema is correct
This repo uses:
- `prisma/schema.prisma`
- migrations in `prisma/migrations/`

### 1.3 Build test
```bash
npm run build
```

### 1.4 Create production sqlite DB (recommended)
Create/prepare a production DB file (do not rely on `prisma/dev.db` for production).

Option A (simple): copy dev DB to a new prod DB file
```bash
copy prisma\dev.db prisma\prod.db
```

Option B: start from scratch with migrations only (see section 4).

---

## 2) Choose a free host

### Recommended: Railway Free (best for SQLite persistence)
- Create an account (free tier).
- Create a **New Project** → **Deploy from GitHub**.
- Add a **Persistent Volume** (railway feature) so the sqlite file stays across restarts.

(If you don’t want volumes, do not use SQLite for production. You would need Postgres—usually not free.)

---

## 3) Push code to GitHub
Railway/Render typically deploy from GitHub.

```bash
git init
git add .
git commit -m "init"
git branch -M main
git remote add origin <YOUR_GITHUB_REPO_URL>
git push -u origin main
```

---

## 4) Prisma + database setup on the server

### 4.1 Prisma DB URL
You must set the Prisma datasource URL to your sqlite file path.

Common approach for sqlite on Railway:
- set `DATABASE_URL` to a path inside the mounted persistent volume

For example (path will vary by platform):
```env
DATABASE_URL="file:/var/lib/sqlite/prod.db"
```

Add `DATABASE_URL` to Railway **Environment Variables**.

### 4.2 Run migrations after deploy
Deployments should run:
- `prisma migrate deploy`
- optionally `prisma db seed`

For this repo, seed script is configured:
- `prisma.seed` in `package.json`
- command: `tsx prisma/seed.ts`

---

## 5) Configure build + start commands
In Railway (or similar), set:

### Build command
```bash
npm run build
```

### Start command
```bash
npm run start
```

### Add “post-deploy” migration step
Depending on your platform settings, set a command to run after build:
```bash
npx prisma migrate deploy
npm run prisma:seed
```

However your repo `package.json` does **not** define `prisma:seed`.
So either:
- run the seed via the prisma seed config directly:

```bash
npx prisma db seed
```

Or add a script (optional).

---

## 6) Environment variables you may need
Your app uses authentication cookies and Prisma.
At minimum, configure:

### Required
- `DATABASE_URL` (SQLite file URL)

### Recommended
- `NODE_ENV=production`

### Optional (if used in middleware/auth)
Search in code for `process.env` if you get build/runtime errors.
Common examples might be:
- `NEXTAUTH_SECRET` (not likely here)
- encryption keys (if used)

---

## 7) Deploy steps (Railway example)
1. Create a **New Project** → **GitHub** deploy
2. Select your repo
3. Add Environment Variables:
   - `DATABASE_URL`
4. Add Persistent Volume and mount it
   - Make sure the sqlite file path matches `DATABASE_URL`
5. Set Commands:
   - Build: `npm run build`
   - Start: `npm run start`
6. Add a migration step (as a separate “script” if supported)
   - `npx prisma migrate deploy`
7. Seed (optional):
   - `npx prisma db seed`
8. Deploy

---

## 8) Verify deployment
After deploy:
- Open the Railway live URL
- Login with a seeded user (if you used seed)
- Confirm `/purchases`, `/employees`, etc load
- Confirm stock changes persist after reload

---

## 9) Common issues

### Issue: Prisma cannot find database / file
- Ensure `DATABASE_URL` points to a writable persistent mount path.
- Ensure the sqlite file exists or migrations create it.

### Issue: migrations fail
- Make sure you’re running from the project root.
- Ensure `prisma/schema.prisma` is present.

### Issue: build fails
- Run `npm run build` locally and fix the error.

---

## 10) What to do if you want “true free” without paying for volumes
If volumes are not available on your chosen host, the only fully reliable way is:
- Use **Postgres** (usually not “fully free” at all times), OR
- Store sqlite in a service that persists (volume)

---

## Files involved
- `prisma/schema.prisma`
- `prisma/migrations/*`
- `src/lib/prisma.ts` (Prisma client + datasource)
- `package.json` scripts (`build`, `start`)

---

## Next local commands you can run (for sanity)
```bash
npm run build
npx prisma migrate deploy
npx prisma db seed
npm run start
```

---

If any error appears during deploy, paste the build/runtime logs and the current `DATABASE_URL` you set; the guide can be adjusted precisely to your host’s filesystem paths.
