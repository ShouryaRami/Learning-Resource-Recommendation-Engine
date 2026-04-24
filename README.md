# UMBC Learn
### Learning Resource Recommendation Engine
**SENG 701 Capstone Project — Spring 2026**
Shourya Rami | AD39491 | MPS Software Engineering, UMBC
Advisors: Dr. Mohammad Samarah & Prof. Melissa Sahl

---

## Live Demo

| | URL |
|---|---|
| Frontend | https://umbc-learning-resource-recommendation.vercel.app |
| Backend API | https://umbc-learn-server.onrender.com |
| GitHub | https://github.com/ShouryaRami/Learning-Resource-Recommendation-Engine |

> **Note:** Backend is hosted on Render free tier.
> First request may take 30–60 seconds to wake up.

---

## What is UMBC Learn?

UMBC Learn is a course-based project guidance system for software engineering
students. Unlike generic AI tools, it grounds all recommendations and AI chat
responses in the actual course materials uploaded by instructors. Students get
personalized learning paths built from their professor's lecture slides, notes,
and readings — supplemented by YouTube tutorials and GitHub code examples for
hands-on practice.

The system supports the full academic workflow: faculty upload course materials,
students pitch project ideas for instructor approval, and the AI assistant
answers questions by searching through what the professor actually taught
rather than the generic internet.

---

## User Roles

| Role | Key Permissions |
|---|---|
| Admin | Full system access, manage all users and departments |
| Department Head | Manage department courses and enrollments (instructor with `isDepartmentHead` flag) |
| Instructor | Upload materials, approve projects and enrollments, manage TAs |
| Teaching Assistant | Configurable per-course permissions set by instructor |
| Student | Enroll in courses, pitch projects, view recommendations |

---

## Key Features (Beta Checkpoint)

**Authentication**
- Email registration with OTP verification
- Google OAuth with mandatory password setup
- Password reset via OTP from profile page
- JWT-based session management

**Course Management**
- Department and course hierarchy
- Student enrollment with instructor/TA approval
- Role-based access control with 5 user types

**Course Materials**
- Upload PDF, Word, PowerPoint, and ZIP files
- Automatic text extraction for AI search
- Instructor-controlled student visibility per file
- MongoDB GridFS file storage

**Project Workflow**
- Students pitch project ideas with optional proposal doc
- Instructors can assign projects directly to students
- Approval/rejection with feedback
- Status tracking: pending → active → completed

**AI-Powered Recommendations**
- Course materials searched via keyword RAG system
- YouTube Data API v3 for coding tutorials (cached 24 hr)
- GitHub Search API for relevant code repositories
- Gemini 2.5 Flash for learning path narrative
- All AI chat answers grounded in course materials

**Role Dashboards**
- Student: projects, learning paths, saved resources
- Instructor: course management, material library, TA permissions, project approvals
- Department Head: department overview and enrollments
- TA: assigned courses with permission-based actions
- Admin: analytics, user management, role assignment

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS, React Router v6 |
| Backend | Node.js, Express.js |
| Database | MongoDB Atlas, Mongoose ODM |
| File Storage | MongoDB GridFS |
| AI | Google Gemini 2.5 Flash |
| External APIs | YouTube Data API v3, GitHub Search API |
| Auth | JWT, bcrypt, Passport.js Google OAuth |
| Email | Nodemailer via Gmail SMTP |
| Security | Helmet, express-rate-limit, express-validator |
| Deployment | Vercel (frontend), Render (backend) |

---

## Local Setup

**Prerequisites:** Node.js v18+, MongoDB Atlas account,
Gmail account with App Password enabled

**1. Clone the repository**
```bash
git clone https://github.com/ShouryaRami/Learning-Resource-Recommendation-Engine.git
cd Learning-Resource-Recommendation-Engine
git checkout beta
```

**2. Install dependencies**
```bash
cd server && npm install
cd ../client && npm install
```

**3. Configure environment variables**
```bash
cp server/.env.example server/.env
```
Fill in all values in `server/.env` (see Environment Variables section below).

**4. Seed the database**
```bash
cd server
node data/seed.js
```

**5. Start the backend**
```bash
node index.js
# Server running on port 5000
```

**6. Start the frontend (new terminal)**
```bash
cd client
npm run dev
# App running at http://localhost:5173
```

---

## Test Accounts

| Role | Email | Password |
|---|---|---|
| Admin | admin@umbc.edu | Admin123 |
| Instructor (Dept Head) | instructor@umbc.edu | Instructor123 |
| Teaching Assistant | ta@umbc.edu | TA123pass |
| Student | student@umbc.edu | Student123 |

---

## Environment Variables

Create `server/.env` with these values:

```
# Server
PORT=5000
MONGODB_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=7d
NODE_ENV=development

# Google OAuth
GOOGLE_CLIENT_ID=from_console.cloud.google.com
GOOGLE_CLIENT_SECRET=from_console.cloud.google.com
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback

# Email (Gmail App Password)
EMAIL_USER=your_gmail@gmail.com
EMAIL_APP_PASSWORD=your_16_char_app_password
EMAIL_FROM=UMBC Learn <your_gmail@gmail.com>

# AI APIs
GEMINI_API_KEY=from_aistudio.google.com
YOUTUBE_API_KEY=from_console.cloud.google.com

# Frontend URL
FRONTEND_URL=http://localhost:5173
```

---

## API Endpoints (Key Routes)

**Authentication**

| Method | Route | Description |
|---|---|---|
| POST | /api/auth/register | Register and send OTP |
| POST | /api/auth/verify-otp | Verify email OTP |
| POST | /api/auth/login | Login with email/password |
| GET | /api/auth/google | Google OAuth login |
| POST | /api/auth/forgot-password | Send reset OTP |
| POST | /api/auth/reset-password | Reset with OTP |

**Courses & Enrollment**

| Method | Route | Description |
|---|---|---|
| GET | /api/courses | List all active courses |
| POST | /api/enrollments | Request enrollment |
| PATCH | /api/enrollments/:id/approve | Approve enrollment |

**Materials**

| Method | Route | Description |
|---|---|---|
| POST | /api/materials/upload | Upload course material |
| GET | /api/materials/course/:id | List course materials |
| GET | /api/materials/:id/download | Download file |
| PATCH | /api/materials/:id/visibility | Toggle visibility |

**Projects**

| Method | Route | Description |
|---|---|---|
| POST | /api/projects/pitch | Student pitches project |
| POST | /api/projects/assign | Instructor assigns project |
| PATCH | /api/projects/:id/approve | Approve pitch |
| PATCH | /api/projects/:id/reject | Reject with feedback |

**Recommendations & Chat**

| Method | Route | Description |
|---|---|---|
| GET | /api/recommendations/:id | Get project recommendations |
| POST | /api/chat | AI chat with course context |
| GET | /api/chat/history/:courseId | Get chat history |

**Admin**

| Method | Route | Description |
|---|---|---|
| GET | /api/admin/analytics | System-wide analytics |
| GET | /api/admin/users | All users list |
| PATCH | /api/admin/users/:id | Update user role |
| GET | /api/admin/projects | All projects |

---

## Git Branch Structure

```
main     Production branch (merged at each checkpoint)
├── alpha  Alpha Checkpoint snapshot (frozen)
└── beta   Beta Checkpoint development
```

---

## Checkpoint Status

| Checkpoint | Status | Completion |
|---|---|---|
| Alpha | Submitted April 1, 2026 | ~45% |
| Beta | Submitted April 23, 2026 | ~80% |
| Final | Due May 12, 2026 | TBD |

---

## Known Limitations (Beta)

- Gemini 2.5 Flash free tier has 10 req/min limit —
  chat may show busy message during heavy use
- YouTube and GitHub results are cached 24 hours
  to stay within free API quotas
- File text extraction runs asynchronously —
  materials show "Processing" for 5–10 seconds
  after upload before being searchable
- Render free tier cold starts take 30–60 seconds
  on first request after inactivity
