# UMBC Learn
## Learning Resource Recommendation Engine

> SENG 701 Software Engineering Capstone
> Spring 2026 | University of Maryland Baltimore County
> Student: Shourya Rami

---

## Overview

UMBC Learn is a web-based personalized learning
resource recommendation engine for Software
Engineering students at UMBC. Students enter their
project type, programming language, and skill level
and receive a ranked list of curated learning
resources along with a structured learning path.

---

## Features

- Personalized resource recommendations using a
  weighted scoring algorithm
- Structured learning path generation sequenced
  by resource type
- AI-powered guidance chat (full LLM in Beta)
- Save and track learning resources per project
- Star rating and feedback system
- Admin analytics dashboard with Chart.js
- JWT authentication with student and admin roles
- Role-based access control

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Tailwind CSS |
| Backend | Node.js, Express.js |
| Database | MongoDB Atlas, Mongoose |
| Auth | JWT, bcryptjs |
| Charts | Chart.js, react-chartjs-2 |
| AI Chat | Keyword-based (LLM in Beta) |
| Tools | Git, Postman |

---

## Project Structure

```
Learning-Resource-Recommendation-Engine/
├── client/                  React frontend
│   └── src/
│       ├── api/             Axios API functions
│       ├── components/      Reusable components
│       │   ├── cards/       StatCard, ResourceCard
│       │   ├── chat/        ChatWidget
│       │   └── layout/      Sidebar, PageWrapper
│       ├── context/         AuthContext
│       ├── pages/           Page components
│       │   └── admin/       Admin pages
│       └── App.jsx          Router and layout
├── server/                  Node.js backend
│   ├── config/              Database connection
│   ├── data/                Seed data and script
│   ├── middleware/          Auth and role guards
│   ├── models/              Mongoose schemas
│   ├── routes/              Express API routes
│   └── utils/               Recommendation engine
└── docs/                    Documentation
```

---

## Setup Instructions

### Prerequisites
- Node.js 18 or higher
- npm
- MongoDB Atlas account (free tier)
- Git

### Installation

Step 1 — Clone the repository:
```bash
git clone https://github.com/ShouryaRami/Learning-Resource-Recommendation-Engine.git
cd Learning-Resource-Recommendation-Engine
```

Step 2 — Install server dependencies:
```bash
cd server && npm install
```

Step 3 — Install client dependencies:
```bash
cd ../client && npm install
```

Step 4 — Configure environment:

Copy `server/.env.example` to `server/.env` and fill in these values:
```
PORT=5000
MONGODB_URI=your_atlas_connection_string
JWT_SECRET=your_secret_key
JWT_EXPIRES_IN=7d
ANTHROPIC_API_KEY=optional_for_beta
```

Also create `client/.env`:
```
VITE_API_BASE_URL=http://localhost:5000/api
```

Step 5 — Seed the database:
```bash
cd server && node data/seed.js
```

Step 6 — Start the backend:
```bash
cd server && node index.js
```

Step 7 — Start the frontend (new terminal):
```bash
cd client && npm run dev
```

Step 8 — Open browser:
```
http://localhost:5173
```

---

## Deployment

### Backend — Render (free)
1. Go to render.com and connect GitHub repo
2. Set Root Directory to: server
3. Set Build Command: npm install
4. Set Start Command: node index.js
5. Add all environment variables from
   server/.env.example
6. Deploy — you get a URL like:
   https://umbc-learn-server.onrender.com

### Frontend — Vercel (free)
1. Go to vercel.com and connect GitHub repo
2. Set Root Directory to: client
3. Set Framework Preset to: Vite
4. Set Build Command: npm run build
5. Set Output Directory: dist
6. Add environment variable:
   VITE_API_BASE_URL = your Render backend URL + /api
7. Deploy — you get a URL like:
   https://umbc-learn.vercel.app

### Database — MongoDB Atlas (free)
Already configured. Make sure Network Access
allows connections from anywhere (0.0.0.0/0)
for Render to connect successfully.

---

## API Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | /api/auth/register | Register user | Public |
| POST | /api/auth/login | Login user | Public |
| GET | /api/auth/me | Get current user | Private |
| POST | /api/projects | Create project | Private |
| GET | /api/projects/user/:id | Get user projects | Private |
| GET | /api/projects/:id | Get project | Private |
| DELETE | /api/projects/:id | Delete project | Private |
| POST | /api/recommendations | Get recommendations | Private |
| GET | /api/saved | Get saved resources | Private |
| POST | /api/saved | Save a resource | Private |
| DELETE | /api/saved/:id | Remove saved | Private |
| PATCH | /api/saved/:id/complete | Mark complete | Private |
| POST | /api/feedback | Submit rating | Private |
| PUT | /api/users/:id | Update profile | Private |
| POST | /api/chat | AI chat message | Private |
| GET | /api/admin/analytics | Admin stats | Admin |

---

## Default Admin Setup

Register a normal account then update the role
field to admin in MongoDB Atlas:
Browse Collections → users → find your user
→ Edit → change role from student to admin
→ Log out and log back in

---

## Capstone Information

- Course: SENG 701 Software Engineering Capstone
- University: UMBC MPS Software Engineering
- Advisor: Dr. Mohammad Samarah and Prof. Melissa Sahl
- Semester: Spring 2026
- Alpha Checkpoint: March 30 2026
- Repository: github.com/ShouryaRami/Learning-Resource-Recommendation-Engine

---

## Alpha Checkpoint Status

Completed in Alpha:
- User authentication (register, login, logout)
- Project creation and management
- Resource recommendation engine with scoring
- Learning path generation and sequencing
- Save and track resources
- Star rating and feedback system
- Admin analytics dashboard
- AI chat widget (keyword-based)
- Responsive layout with sidebar navigation

Planned for Beta:
- Full LLM AI chat integration
- YouTube API video recommendations
- Admin resource management CRUD
- Adaptive recommendations from feedback
- Student insights per-user analytics
