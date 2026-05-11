# MathsApp - Microservices Architecture

A math learning platform built with MERN stack using microservices architecture.

## Architecture

```
MATH/
├── api-gateway/          (Port 5000) - Routes requests to microservices
├── user-service/         (Port 5001) - Authentication & user management
├── question-service/     (Port 5003) - Question bank management
├── quiz-service/         (Port 5004) - Quiz sessions, scoring & stats
└── client/               (Port 5173) - React frontend
```

## Prerequisites

- Node.js 20.19+ (or use Vite 5.x for Node 20.18)
- MongoDB (local or Atlas)

## Setup

### 1. Environment Variables

Copy `.env.example` to `.env` in each service and configure:

**api-gateway/.env**
```
PORT=5000
JWT_SECRET=your_jwt_secret_here
USER_SERVICE_URL=http://localhost:5001
QUESTION_SERVICE_URL=http://localhost:5003
```

**user-service/.env**
```
PORT=5001
MONGODB_URI=mongodb://localhost:27017/mathsapp
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRES_IN=7d
SUPER_ADMIN_EMAIL=superadmin@mathsapp.com
SUPER_ADMIN_PASSWORD=super123
```

**question-service/.env**
```
PORT=5003
MONGODB_URI=mongodb://localhost:27017/mathsapp
JWT_SECRET=your_jwt_secret_here
```

**quiz-service/.env**
```
PORT=5004
MONGODB_URI=mongodb://localhost:27017/mathsapp
JWT_SECRET=your_jwt_secret_here
```

> **Important:** Use the same `JWT_SECRET` and `MONGODB_URI` across all services.

### 2. Install Dependencies

```bash
npm install          # installs concurrently at root
npm run install:all  # installs deps in every service + client
```

### 3. Run All Services (single command)

```bash
npm run dev
```

## Features

### User Roles

- **SUPER_ADMIN**: Manage all users, create Year Coordinators
- **ADMIN (Year Coordinator)**: View students, manage question bank
- **USER (Student)**: Take quizzes (coming soon)

### Question Service API

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/questions | Create question |
| GET | /api/questions | List questions (filter by lesson/difficulty) |
| GET | /api/questions/stats | Get question counts by lesson/difficulty |
| GET | /api/questions/:id | Get single question |
| PUT | /api/questions/:id | Update question |
| DELETE | /api/questions/:id | Delete question |

### Default Super Admin

On first run, a super admin is seeded:
- Email: superadmin@mathsapp.com
- Password: super123

## Tech Stack

- **Backend**: Node.js, Express, MongoDB, Mongoose, JWT
- **Frontend**: React 18, React Router, Axios, Vite
- **Architecture**: Microservices with API Gateway pattern
