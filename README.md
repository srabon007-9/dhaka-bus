# Dhaka Bus Tracking System 🚌

Hey! Welcome to my Dhaka Bus project. I built this application to try and solve the mess of tracking buses and buying tickets manually in Dhaka. It's a full-stack project built mainly for my university, but it actually has some pretty cool features.

It's got a React frontend, an Express/Node.js backend, and uses a real MySQL database. I also set it all up with Docker, so you don't have to waste time installing dependencies one by one.

## How to get it running on your machine

Just clone the repo and run docker compose. It's super easy:

```bash
git clone https://github.com/srabon007-9/dhaka-bus.git
cd dhaka-bus
docker compose up --build -d
```

Once it's done building (might take a minute the first time), you can open it up:
- The actual website: http://localhost
- To check if the backend is alive: http://localhost:3000/api/health

I've already added some dummy accounts you can use to log in:
- **Admin panel:** admin@dhakabus.com / admin123
- **Normal user:** user@dhakabus.com / user123

## Need more help?

I wrote down some more details in these files if you get stuck or want to push this to the cloud:
- If you're having trouble getting it running locally, read [SETUP.md](SETUP.md).
- If you want to know how the tables are connected, check out [DATABASE.md](DATABASE.md).
- If you want to host it for free (like I did for my faculty demo), I made a guide in [DEPLOY_FREE.md](DEPLOY_FREE.md).

## What's inside the folder?

Here's how I organized the code:
- `frontend/` - All the React stuff. Uses Vite and Tailwind.
- `backend/` - The Express API. Connects to the database and handles sockets.
- `database/` - My raw SQL files and seed data to fill the DB.
- `docker-compose.yml` - The magic file that links the frontend, backend, and MySQL together.

## Running into issues?

If things break, usually the easiest fix is just wiping the containers and starting over:
```bash
docker compose down -v
docker compose up --build -d
```

If you want to add a feature or fix a bug, feel free to make a branch and open a PR! Just make sure to test it locally with Docker first so it doesn't break the main branch.
