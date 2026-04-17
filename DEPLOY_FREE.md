# How I Deployed This for Free ☁️

If you're reading this, you probably want to host the project on the internet for a demo or a portfolio without spending any money. I got you covered.

Here is the exact tech stack I used to get this live for $0:
- **Frontend:** Vercel (Super fast React hosting)
- **Backend:** Render (Great free tier for Node.js APIs)
- **Database:** TiDB Cloud (A MySQL-compatible cloud database that actually has a generous free tier)
- **DNS/Domain:** Namecheap (Okay, the domain wasn't free, but everything else is!)

## Step 1: The Database (TiDB Cloud)

1. Go to TiDB Cloud and create a free Serverless cluster.
2. Open their SQL console and run this to create your database:
```sql
CREATE DATABASE dhakabus;
```
3. Create a database user and generate a password.
4. Save the Host, User, and Password somewhere safe. We'll need them for the backend.

## Step 2: The Backend (Render)

1. Create an account on Render and click "New Web Service".
2. Connect it to your GitHub repo.
3. Configure it like this:
   - **Root Directory:** `backend`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
4. Now, the most important part—add these Environment Variables in Render:

```env
NODE_ENV=production
FRONTEND_URL=https://your-frontend-domain.com

DB_HOST=<your-tidb-host>
DB_USER=<your-tidb-user>
DB_PASSWORD=<your-tidb-password>
DB_NAME=dhakabus
DB_SSL=true
DB_SSL_REJECT_UNAUTHORIZED=true

JWT_SECRET=<literally-just-mash-your-keyboard-for-30-characters>
```

Wait for Render to finish building. Since it's the free tier, it might take a few minutes.

## Step 3: The Frontend (Vercel)

1. Make an account on Vercel and import your GitHub repo.
2. Tell Vercel how to build the project:
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
3. Add this one Environment Variable so the React app knows where to talk to the backend:

```env
VITE_API_URL=https://your-backend-domain-from-render.onrender.com/api
```

Hit deploy! Note: If you forget to add the `VITE_API_URL` before deploying, the app will load but it won't be able to fetch any data. Just add the variable and hit redeploy.

## Quick Warning about Free Tiers

Because we are using Render's free tier, **the backend will go to sleep if nobody uses it for 15 minutes.** 
This means if you're showing this off to a professor or a recruiter, the very first API request might take 30-50 seconds while the server wakes up. After that, it'll be lightning fast again. 

If your database connections are failing on Render, sometimes TiDB SSL gets a bit picky. You can temporarily set `DB_SSL_REJECT_UNAUTHORIZED=false` in Render's env vars to bypass the strict certificate check while you debug.
