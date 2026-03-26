# Free Deployment Guide (Actual Setup Used)

This document reflects the deployment path that was actually used successfully for this project.

## Deployed Architecture

- Frontend: Vercel
- Backend API: Render (Web Service)
- Database: TiDB Cloud Serverless (MySQL-compatible)
- Domain DNS: Namecheap

Target domains:

- Frontend: https://dhakabus.srabon.me
- Backend: https://api.dhakabus.srabon.me

---

## 1) Backend Deployment (Render)

Create a Render Web Service from this repository.

Service settings:

- Runtime: Node
- Root Directory: backend
- Build Command: npm install
- Start Command: npm start
- Branch: master

Required environment variables:

```env
NODE_ENV=production
FRONTEND_URL=https://dhakabus.srabon.me

DB_HOST=<tidb-host>
DB_USER=<tidb-username>
DB_PASSWORD=<tidb-password>
DB_NAME=dhakabus

DB_SSL=true
DB_SSL_REJECT_UNAUTHORIZED=true

JWT_SECRET=<long-random-secret>

PAYMENT_MODE=manual-both
PAYMENT_CURRENCY=bdt
PAYMENT_SUCCESS_URL=https://dhakabus.srabon.me/booking?payment=success&payment_ref=
PAYMENT_CANCEL_URL=https://dhakabus.srabon.me/booking?payment=cancelled
NAGAD_CALLBACK_URL=https://api.dhakabus.srabon.me/api/tickets/payment/nagad/callback
```

Notes:

- The backend code was updated to support optional TLS for managed MySQL providers through `DB_SSL` and `DB_SSL_REJECT_UNAUTHORIZED`.
- If certificate chain validation fails with your provider, temporarily set `DB_SSL_REJECT_UNAUTHORIZED=false` and redeploy.

---

## 2) Database Deployment (TiDB Cloud)

Why TiDB was used:

- No credit card requirement in this flow.
- MySQL protocol compatible with `mysql2` used by backend.

Steps:

1. Create a free TiDB Serverless cluster.
2. Create database:

```sql
CREATE DATABASE dhakabus;
```

3. Create SQL user/password in TiDB.
4. Copy host/user/password and set Render vars (`DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`).

---

## 3) Frontend Deployment (Vercel)

Create/import Vercel project from the same repository.

Project settings:

- Root Directory: frontend
- Build Command: npm run build
- Output Directory: dist

Environment variable:

```env
VITE_API_URL=https://api.dhakabus.srabon.me/api
```

Redeploy frontend after setting env vars.

---

## 4) DNS Setup (Namecheap)

In Namecheap Advanced DNS, keep existing root records and add/update:

1. Frontend CNAME
- Type: CNAME
- Host: dhakabus
- Value: value shown by Vercel Domains page (use the exact target Vercel recommends)

2. Backend CNAME
- Type: CNAME
- Host: api.dhakabus
- Value: dhakabus-api.onrender.com (or your actual Render service domain)

Important:

- Do not add conflicting A/AAAA records for `dhakabus` or `api.dhakabus`.
- DNS propagation can take minutes to hours.

---

## 5) Custom Domain Verification

1. In Render service settings, add custom domain: `api.dhakabus.srabon.me`.
2. In Vercel project domains, add custom domain: `dhakabus.srabon.me`.
3. Wait until both show Verified/Valid.

---

## 6) Smoke Tests

Run these checks after deployment:

```bash
curl -s https://api.dhakabus.srabon.me/api/health
curl -s https://api.dhakabus.srabon.me/api/routes
```

Then open frontend:

- https://dhakabus.srabon.me

Expected:

- Frontend loads.
- API-backed pages (routes/tracking/booking) return data.

---

## Important Notes

1. Vercel domain target can change.
   Always use the exact CNAME target shown in Vercel Domains, not only the legacy `cname.vercel-dns.com` if Vercel recommends a newer one.

2. `DEPLOYMENT_NOT_FOUND` from Vercel means the custom domain is not attached to a live deployment in that Vercel project.

3. TiDB requires secure transport.
   If SSL is not configured, API calls may fail with: `Connections using insecure transport are prohibited`.

4. Keep secrets out of Git.
   Store all credentials only in Render/Vercel/TiDB environment settings.

5. Free tiers can sleep.
   Render free instances may cold-start and respond slower after inactivity.
