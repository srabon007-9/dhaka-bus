# Local Development Setup

This guide helps you set up the project for local development without Docker (optional).

## Using Docker (Recommended)

The easiest way to get started:

```bash
# Clone the repository
git clone https://github.com/srabon007-9/dhaka-bus.git
cd dhaka-bus

# Start all services
docker-compose up --build

# Visit http://localhost
```

That's it! All services (frontend, backend, MySQL) are running.

## Local Development Setup (Without Docker)

### Prerequisites

- **Node.js** v18+ (https://nodejs.org)
- **MySQL** v8.0 (https://dev.mysql.com/downloads/mysql/)
- **npm** (comes with Node.js)

### Step 1: Setup Database

```bash
# Start MySQL service
# On Mac with Homebrew:
brew services start mysql

# Connect to MySQL
mysql -u root

# In MySQL prompt, run:
CREATE DATABASE dhaka_bus;
EXIT;

# Run schema and seed
mysql -u root dhaka_bus < database/schema.sql
mysql -u root dhaka_bus < database/seed.sql
```

### Step 2: Setup Backend

```bash
# Navigate to backend folder
cd backend

# Create .env file
cp .env.example .env

# Edit .env with your MySQL credentials:
# DB_HOST=localhost
# DB_USER=root
# DB_PASSWORD=your_password
# DB_NAME=dhaka_bus

# Install dependencies
npm install

# Start server (runs on port 3000)
npm run dev
```

### Step 3: Setup Frontend

```bash
# In another terminal, navigate to frontend
cd frontend

# Create .env.local file
cp .env.example .env.local

# Install dependencies
npm install

# Start development server (runs on port 5173)
npm run dev
```

### Step 4: Access Application

- Frontend: http://localhost:5173
- Backend API: http://localhost:3000/api
- Database: localhost:3306

## Common Issues

### MySQL Connection Failed

```bash
# Check if MySQL is running
mysql -u root -e "SELECT 1;"

# If not running, start it
# On Mac: brew services start mysql
# On Linux: sudo systemctl start mysql
# On Windows: Open Services and find MySQL
```

### Port 3000 or 5173 Already in Use

```bash
# Option 1: Kill the process using the port
# On Mac/Linux:
lsof -i :3000
kill -9 <PID>

# Option 2: Use different port in .env
BACKEND_PORT=3001
```

### Node Modules Issues

```bash
# Delete and reinstall
rm -rf node_modules package-lock.json
npm install
```

## Useful Commands

```bash
# Frontend development
cd frontend
npm run dev          # Start dev server
npm run build        # Production build
npm run preview      # Preview production build
npm run lint         # Check code quality

# Backend development
cd backend
npm run dev          # Start with nodemon
npm start            # Start production server

# Database
mysql -u root dhaka_bus        # Connect to database
SHOW TABLES;                    # List tables
SELECT * FROM buses;           # View buses
```

## Environment Variables

### Backend (.env)

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=dhaka_bus
FRONTEND_URL=http://localhost:5173
```

### Frontend (.env.local)

```env
VITE_API_URL=http://localhost:3000/api
```

## Next Steps

1. Read [CONTRIBUTING.md](CONTRIBUTING.md) to start contributing
2. Check [README.md](README.md) for project overview
3. Explore the codebase in `frontend/src` and `backend/`

---

**Happy coding!** 🚀
