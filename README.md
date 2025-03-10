# Parking Management System

A modern parking management system built with TypeScript, React, and Node.js.

## Project Structure

- `/admin` - Admin Dashboard application
- `/gate-in` - Entry Gate application
- `/gate-out` - Exit Gate application
- `/server` - Backend API server
- `/shared` - Shared utilities and types

## Features

- Real-time parking session management
- Vehicle tracking and management
- User authentication and authorization
- Dynamic rate calculation
- Receipt generation
- Offline-first functionality
- Backup and restore capabilities

## Tech Stack

### Frontend
- React
- TypeScript
- Material-UI
- Redux Toolkit
- Socket.IO Client

### Backend
- Node.js
- Express
- TypeORM
- PostgreSQL
- Socket.IO

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   # Install server dependencies
   cd server
   npm install

   # Install admin dashboard dependencies
   cd ../admin
   npm install
   ```

3. Set up the database:
   - Create a PostgreSQL database
   - Configure `.env` file with database credentials

4. Start the development servers:
   ```bash
   # Start backend server
   cd server
   npm run dev

   # Start admin dashboard
   cd admin
   npm start
   ```

## Environment Variables

Create a `.env` file in the server directory with the following variables:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=parking_system

# JWT Configuration
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=24h

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:3000
```

## License

MIT License - see LICENSE for details 