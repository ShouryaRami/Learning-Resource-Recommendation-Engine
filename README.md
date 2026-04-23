# UMBC Learn
## Course-Based Project Guidance and Resource Recommendation System

> SENG 701 Software Engineering Capstone — Spring 2026
> University of Maryland Baltimore County
> Student: Shourya Rami (AD39491)
> Advisors: Dr. Mohammad Samarah | Prof. Melissa Sahl

---

## Live Demo

| | URL |
|---|---|
| Frontend | https://umbc-learning-resource-recommendation.vercel.app |
| Backend API | https://umbc-learn-server.onrender.com |
| GitHub | https://github.com/ShouryaRami/Learning-Resource-Recommendation-Engine |

---

## What This Is

UMBC Learn is a course-based project guidance system for UMBC Software Engineering students. Instructors upload their lecture slides, notes, and assignments. Students pitch project ideas and receive learning recommendations grounded in their professor's actual course materials — not generic internet resources.

This is different from ChatGPT because answers reference the professor's actual slides and notes. A student asking about database design gets an answer that cites their professor's lecture on database design, not a generic Stack Overflow post.

---

## Key Features (Beta)

- **Course Material Upload** — Instructors upload PDFs, PowerPoints, Word docs, and ZIPs. Text is extracted for RAG search.
- **RAG-Based Recommendations** — 60% course materials + 25% YouTube tutorials + 15% GitHub code examples
- **AI Chat Assistant** — Gemini 2.5 Flash answers questions grounded in uploaded course materials with source citations
- **Project Pitch Flow** — Students pitch ideas, instructors approve. Assigned projects also supported.
- **5-Role Access Control** — Admin, Department Head, Instructor, Teaching Assistant, Student
- **TA Permission System** — Instructors grant specific per-course permissions to each TA
- **Google OAuth + OTP Auth** — Email verification, password reset, Google sign-in
- **Department Enrollment** — Students request to join a department; Department Head approves
- **Course Enrollment** — Students request to join a course; Instructor or TA approves

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Tailwind CSS |
| Backend | Node.js 18, Express.js |
| Database | MongoDB Atlas, Mongoose, GridFS |
| Auth | JWT, bcryptjs, Passport.js, Google OAuth |
| AI | Gemini 2.5 Flash (RAG chat + analysis) |
| Video API | YouTube Data API v3 |
| Code API | GitHub Search API |
| Email | Nodemailer + Gmail |
| File Storage | MongoDB GridFS |
| Text Extraction | pdf-parse, mammoth, pptx XML parsing |

---

## Role Structure

| Role | Description |
|------|-------------|
| **Admin** | Full system control, role assignment, department creation |
| **Department Head** | `instructor` with `isDepartmentHead: true` — manages their department, courses, and enrollments |
| **Instructor** | Manages assigned courses, uploads materials, approves pitches, sets TA permissions |
| **Teaching Assistant** | Default: view students and materials. Additional permissions granted per-course by instructor |
| **Student** | Enrolls in courses, pitches projects, receives recommendations, uses AI chat |

---

## Project Structure

```
Learning-Resource-Recommendation-Engine/
├── client/                  React + Vite frontend
│   └── src/
│       ├── api/             Axios API functions (auth, courses, materials, ta, etc.)
│       ├── components/
│       │   ├── cards/       StatCard, CourseCard, ProjectCard, MaterialCard
│       │   ├── chat/        ChatWidget (Gemini RAG)
│       │   └── layout/      Sidebar (role-aware), PageWrapper
│       ├── context/         AuthContext
│       ├── pages/
│       │   ├── admin/       AdminDashboard, ManageUsers, RoleAssignment, ...
│       │   ├── instructor/  InstructorDashboard, ProjectApprovals, TAPermissions
│       │   ├── depthead/    DeptHeadDashboard
│       │   ├── ta/          TADashboard
│       │   └── (student)    Dashboard, Courses, CourseDetail, LearningPaths, ...
│       └── App.jsx          Router, ErrorBoundary wrapping, layout
└── server/
    ├── config/              DB connection, Passport, Nodemailer
    ├── middleware/          auth.js, roleCheck.js, rateLimiter.js, validate.js
    ├── models/              User, Course, Department, Enrollment, CourseMaterial,
    │                        TAPermission, Project, SavedResource, OTP, ChatSession
    ├── routes/              auth, courses, departments, enrollments, materials,
    │                        projects, recommendations, chat, saved, ta, admin, users
    └── utils/               geminiAPI.js, youtubeAPI.js, githubAPI.js,
                             materialSearch.js, textExtractor.js, gridfs.js
```

---

## Setup Instructions

### Prerequisites

- Node.js 18 or higher
- npm
- MongoDB Atlas account (free tier works)
- Gemini API key from [aistudio.google.com](https://aistudio.google.com)
- YouTube Data API v3 key from Google Cloud Console
- Gmail account with App Password enabled

### Installation

**Step 1** — Clone the repository:
```bash
git clone https://github.com/ShouryaRami/Learning-Resource-Recommendation-Engine.git
cd Learning-Resource-Recommendation-Engine
```

**Step 2** — Install server dependencies:
```bash
cd server && npm install
```

**Step 3** — Install client dependencies:
```bash
cd ../client && npm install
```

**Step 4** — Configure server environment:

Create `server/.env` with these values:
```
PORT=5000
MONGODB_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_secret_key_min_32_chars
JWT_EXPIRES_IN=7d
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

GOOGLE_CLIENT_ID=your_google_oauth_client_id
GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback

EMAIL_USER=your_gmail@gmail.com
EMAIL_APP_PASSWORD=your_16_char_app_password
EMAIL_FROM=UMBC Learn <your_gmail@gmail.com>

GEMINI_API_KEY=your_gemini_key_from_aistudio
YOUTUBE_API_KEY=your_youtube_data_api_v3_key

# Optional fallback AI if Gemini quota exceeded
GROQ_API_KEY=your_groq_key_from_console.groq.com
```

**Step 5** — Configure client environment:

Create `client/.env`:
```
VITE_API_BASE_URL=http://localhost:5000/api
VITE_GOOGLE_CLIENT_ID=your_google_oauth_client_id
```

**Step 6** — Start the backend:
```bash
cd server && node index.js
```

**Step 7** — Start the frontend (new terminal):
```bash
cd client && npm run dev
```

**Step 8** — Open browser:
```
http://localhost:5173
```

---

## Deployment

### Backend — Render (free tier)
1. Connect GitHub repo at render.com
2. Set Root Directory: `server`
3. Build Command: `npm install`
4. Start Command: `node index.js`
5. Add all environment variables from the list above
6. Your API URL: `https://your-app.onrender.com`

### Frontend — Vercel (free tier)
1. Connect GitHub repo at vercel.com
2. Set Root Directory: `client`
3. Framework Preset: Vite
4. Build Command: `npm run build`
5. Output Directory: `dist`
6. Add environment variable: `VITE_API_BASE_URL=https://your-render-url/api`

### Database — MongoDB Atlas
- Use M0 free cluster
- Set Network Access to `0.0.0.0/0` so Render can connect
- GridFS handles all file storage — no S3 or external service needed

---

## API Endpoints (Beta)

### Auth
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | /api/auth/register | Register new user | Public |
| POST | /api/auth/login | Login with email/password | Public |
| POST | /api/auth/verify-otp | Verify email OTP | Public |
| POST | /api/auth/forgot-password | Send password reset OTP | Public |
| POST | /api/auth/reset-password | Reset password with OTP | Public |
| GET | /api/auth/me | Get current user | Private |
| GET | /api/auth/google | Google OAuth entry | Public |

### Courses & Departments
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | /api/courses | List all courses | Private |
| GET | /api/courses/:id | Course detail | Private |
| POST | /api/courses | Create course | Dept Head |
| GET | /api/departments | List departments | Private |
| POST | /api/enrollments/request | Request course enrollment | Student |
| GET | /api/enrollments/me | My enrollments | Private |

### Course Materials
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | /api/materials/upload | Upload material file | Instructor/TA |
| GET | /api/materials/course/:courseId | List materials for course | Enrolled |
| GET | /api/materials/:id | Material metadata | Enrolled |
| GET | /api/materials/:id/download | Download file from GridFS | Enrolled |
| DELETE | /api/materials/:id | Soft-delete material | Instructor/TA |

### Projects & Recommendations
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | /api/projects/pitch | Pitch a project idea | Student |
| GET | /api/projects/mine | My projects | Student |
| PATCH | /api/projects/:id/approve | Approve pitch | Instructor/TA |
| PATCH | /api/projects/:id/reject | Reject pitch with feedback | Instructor/TA |
| GET | /api/recommendations/:projectId | Generate learning path | Private |
| POST | /api/chat | AI chat (Gemini RAG) | Private |

### Admin & TA
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | /api/admin/analytics | System-wide stats | Admin |
| GET | /api/admin/users | All users | Admin |
| PUT | /api/ta/permissions | Set TA course permissions | Instructor |
| GET | /api/ta/permissions/:courseId | Get TA permissions | Instructor |

---

## Test Accounts

These accounts are pre-seeded by `server/data/seed.js` and available on the live demo:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@umbc.edu | Admin123 |
| Instructor | instructor@umbc.edu | Instructor123 |
| Teaching Assistant | ta@umbc.edu | TA123pass |
| Student | student@umbc.edu | Student123 |

---

## Admin Setup

The first admin must be created manually:

1. Register a normal account through the app
2. In MongoDB Atlas, go to Browse Collections → `users`
3. Find your user document and edit `role` from `student` to `admin`
4. Log out and log back in

After that, the admin can assign roles to other users through the Role Assignment page at `/admin/roles`.

---

## Beta Checkpoint Status

### Completed in Beta (Commits 30–39)

- Renamed faculty → instructor role throughout
- `isDepartmentHead` flag on instructor role
- TA permission system (per-course, per-TA, 5 toggleable permissions)
- Course material upload with GridFS storage
- Text extraction: PDF (pdf-parse), Word (mammoth), PowerPoint (XML), ZIP
- RAG-based recommendation engine (course materials + YouTube + GitHub)
- Gemini 2.5 Flash AI chat grounded in course materials with citations
- Project pitch and approval flow (student pitches, instructor approves)
- Instructor dashboard with pending pitches, course overview, materials
- Department Head dashboard with department management
- TA dashboard with permission-aware action display
- Admin role assignment page
- ErrorBoundary wrapping on all routes
- SkeletonCard loading placeholders
- axios retry interceptor (3x on 5xx, auto-logout on 401)
- MongoDB indexes on all high-traffic queries
- OTP cleanup on server startup

### Planned for Final Checkpoint

- Vector similarity search on materials (semantic, not keyword)
- Email notifications for project approvals and new materials
- Student progress reports for instructors
- Collaborative project features
- Advanced analytics with Chart.js

---

## Capstone Information

- Course: SENG 701 Software Engineering Capstone
- University: UMBC MPS Software Engineering
- Semester: Spring 2026
- Alpha Checkpoint: March 30, 2026
- Beta Checkpoint: April 21, 2026
- Repository: github.com/ShouryaRami/Learning-Resource-Recommendation-Engine
