# Setup Guide 🛠️

So you want to run this locally? Awesome. I made sure to containerize everything so you won't have to spend 2 hours debugging Node.js versions or installing MySQL on your laptop.

This guide works whether you're on Windows, macOS, or Linux.

## What you actually need installed

Literally just two things:
- Git (to download the code)
- Docker Desktop (if you're on Windows/Mac) or Docker Engine (if you're on Linux)

## Let's get it running

1. First, pull the code from GitHub:
```bash
git clone https://github.com/srabon007-9/dhaka-bus.git
cd dhaka-bus
```

2. Tell Docker to build the images and start the containers:
```bash
docker compose up --build -d
```
*Note: If this is your first time running it, go grab a coffee. It has to download the Node and MySQL base images, which can take a few minutes depending on your internet.*

3. That's it! Everything is running.
- **Frontend:** Head over to http://localhost to see the app.
- **Backend API:** It's running on http://localhost:3000. You can check http://localhost:3000/api/health to make sure it didn't crash.
- **Database GUI:** If you want to look at the database visually without using the terminal, I included phpMyAdmin at http://localhost:8080.

To log in, use these demo accounts:
- **Admin:** admin@dhakabus.com / admin123
- **Regular user:** user@dhakabus.com / user123

## "Help, it didn't work!"

If something isn't starting, 99% of the time it's because one of the ports is already being used by another app on your computer. 
Make sure you don't have anything running on ports `80`, `3000`, `3306`, or `8080`. (If you already have local MySQL running, you'll need to turn it off or change the port in the `docker-compose.yml`).

If you just want to turn it off and back on again:
```bash
docker compose down
docker compose up --build -d
```

## Want to contribute?

If you want to add a feature or fix a bug, please don't push directly to the master branch! 

Instead, make a branch:
```bash
git checkout -b feature/whatever-you-are-building
```
Write your code, commit it, push the branch, and then open a Pull Request on GitHub. I'll review it when I have time!
