# Deployment Guide (Free Stack)

This is the simple deployment setup used for this project.

## Stack

- Frontend: Vercel
- Backend: Render
- Database: TiDB Cloud (MySQL compatible)
- DNS: Namecheap

## 1. Deploy backend on Render

Create a Web Service from this repo with:
- Root Directory: backend
- Build Command: npm install
- Start Command: npm start

Set these environment variables:

```env
NODE_ENV=production
FRONTEND_URL=https://your-frontend-domain

DB_HOST=<tidb-host>
DB_USER=<tidb-user>
DB_PASSWORD=<tidb-password>
DB_NAME=dhakabus
DB_SSL=true
DB_SSL_REJECT_UNAUTHORIZED=true

JWT_SECRET=<strong-random-secret>
```

Optional payment variables can be added later.

## 2. Create database on TiDB Cloud

1. Create a free TiDB Serverless cluster.
2. Create database:

```sql
CREATE DATABASE dhakabus;
```

3. Create a database user.
4. Copy host, user, password to Render env vars.

## 3. Deploy frontend on Vercel

Project settings:
- Root Directory: frontend
- Build Command: npm run build
- Output Directory: dist

Set env var:

```env
VITE_API_URL=https://your-backend-domain/api
```

Redeploy frontend after setting the variable.

## 4. DNS setup

Add CNAME records in Namecheap:

1. Frontend subdomain to the target shown in Vercel.
2. Backend subdomain to your Render service domain.

Do not keep conflicting A or AAAA records for the same host.

## 5. Quick test after deploy

```bash
curl -s https://your-backend-domain/api/health
curl -s https://your-backend-domain/api/routes
```

Then open your frontend domain and check routes, tracking, and booking pages.

## Notes

- Keep secrets only in Render, Vercel, and TiDB settings.
- If DB SSL fails, temporarily set DB_SSL_REJECT_UNAUTHORIZED=false to debug.
- Free tiers can sleep, so first request may be slow.
