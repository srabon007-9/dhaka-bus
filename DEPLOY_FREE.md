# Free Deployment Guide

This guide explains one simple way to deploy the project using free or low-cost services. It is meant for demos, student projects, or portfolio use.

The stack described here is:

- Frontend: Vercel
- Backend: Render
- Database: TiDB Cloud

This is not the only way to deploy the project, but it is a practical option if you want to get it online without much setup.

## Before you deploy

Make sure the project works locally first:

```bash
docker compose up --build -d
```

If it works on your machine, deployment will be much easier.

## Deployment overview

You will deploy the project in three parts:

1. create a cloud database
2. deploy the backend API
3. deploy the frontend

## Step 1: Set up the database

TiDB Cloud is MySQL-compatible, so it works well with this project.

### What to do

1. Create a TiDB Cloud account
2. Create a free serverless cluster
3. Open the SQL console
4. Create the database:

```sql
CREATE DATABASE dhakabus;
```

5. Create a database user
6. Save the following values:

- database host
- database username
- database password
- database name

You will need them when configuring the backend.

## Step 2: Deploy the backend on Render

### Basic setup

1. Create a Render account
2. Connect your GitHub repository
3. Create a new web service
4. Point Render to the `backend` folder

Recommended settings:

- Root Directory: `backend`
- Build Command: `npm install`
- Start Command: `npm start`

### Environment variables

Add these environment variables in Render:

```env
NODE_ENV=production
FRONTEND_URL=https://your-frontend-domain.com

DB_HOST=<your-tidb-host>
DB_USER=<your-tidb-user>
DB_PASSWORD=<your-tidb-password>
DB_NAME=dhakabus
DB_SSL=true
DB_SSL_REJECT_UNAUTHORIZED=true

JWT_SECRET=<your-random-secret>
```

You may also want to add other optional variables later for email or payment features, but the values above are the most important to get the backend online.

### Notes

- Render free services can be slow to wake up after inactivity
- the first request after sleep may take some time

## Step 3: Deploy the frontend on Vercel

### Basic setup

1. Create a Vercel account
2. Import the same GitHub repository
3. Point Vercel to the `frontend` folder

Recommended settings:

- Root Directory: `frontend`
- Build Command: `npm run build`
- Output Directory: `dist`

### Environment variable

Add this variable in Vercel:

```env
VITE_API_URL=https://your-render-backend-domain.onrender.com/api
```

This tells the frontend where the backend API lives.

If you deploy without this value, the frontend may open correctly but fail to load real data.

## After deployment

Once both frontend and backend are deployed:

1. open the frontend URL
2. test login
3. test route loading
4. test ticket pages
5. test the backend health endpoint

A good backend check looks like:

```text
https://your-render-backend-domain.onrender.com/api/health
```

## Common deployment issues

### The frontend opens, but no data loads

Usually this means:

- `VITE_API_URL` is missing
- the backend URL is wrong
- the backend is asleep or failed to start

### The backend cannot connect to the database

Check:

- database host
- database username and password
- SSL settings
- whether the cloud database allows the backend service to connect

### SSL connection problems

If TiDB connection errors appear during setup, you can test with:

```env
DB_SSL_REJECT_UNAUTHORIZED=false
```

Use that only for debugging if needed. If possible, keep strict SSL enabled in the final deployment.

## Optional production improvements

If you plan to keep the app online longer, consider these improvements:

- use a paid backend plan to avoid sleep
- use a custom domain
- add proper email credentials
- add production-ready payment credentials
- store secrets in the hosting platform, not in code

## Final summary

If you want the shortest deployment explanation:

- database on TiDB Cloud
- backend on Render
- frontend on Vercel

Set the correct environment variables, test the backend first, then connect the frontend to it.
