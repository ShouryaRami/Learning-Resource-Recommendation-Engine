# CLAUDE.md — Project Context for UMBC Learn
# Learning Resource Recommendation Engine
# Capstone Project — SENG 701, Spring 2026
# Student: Shourya Rami (AD39491) | UMBC MPS Software Engineering

---

## IMPORTANT — READ BEFORE DOING ANYTHING

Do NOT generate any code, files, folders, or configurations yet.
Do NOT run any commands yet.
Your job right now is to fully understand this project, its architecture, its
data structures, its engineering principles, and its phased delivery plan.
When you are done reading, ask clarifying questions as instructed at the bottom
of this file.
We will work commit-by-commit, step-by-step. Nothing happens until I say so.

---

## WHAT — What is this project?

UMBC Learn is a web-based Learning Resource Recommendation Engine built as a
graduate-level Software Engineering Capstone project at the University of
Maryland Baltimore County (UMBC).

The system helps software engineering students find personalized learning
resources — tutorials, documentation, GitHub repos, YouTube videos, and
library materials — based on their specific project context. Instead of
manually searching across dozens of platforms, a student enters their project
type, programming language, skill level, and goals, and the system returns
a ranked, sequenced set of resources tailored to them.

The system also provides faculty and administrators with an analytics dashboard
to track usage patterns, popular languages, domain trends, and student
engagement metrics.

### Core user types
- Student (primary end user) — discovers resources, follows learning paths,
  tracks progress, rates resources, uses AI guidance chat
- Admin / Faculty (secondary user) — views analytics, manages resource
  database, monitors engagement trends

### Project repository
https://github.com/ShouryaRami/Learning-Resource-Recommendation-Engine

---

## WHY — Why does this project exist?

This project was born from direct observation during the developer's prior role
as a Teaching Assistant in software engineering courses at UMBC. The following
recurring problems were identified:

1. Students frequently asked "where do I start?" for every new project type,
   even when resources were publicly available.
2. Students selected tools and technologies that were too complex for their
   skill level, causing project delays and frustration.
3. A significant portion of TA and instructor time was spent repeating the
   same resource recommendations across different students.
4. Students had no structured learning path — they would jump between
   unrelated resources without sequencing or progression.
5. Faculty had no visibility into which resources were being used, which
   skills were trending, or where students were struggling.

Existing university systems (UMBC library portal, SLIB catalog, Blackboard)
provide access to resources but offer zero personalization, zero sequencing,
and zero analytics. This system acts as an intelligent decision-support layer
on top of those systems without replacing them.

---

## HOW — How will this be built?

### Technology Stack

Frontend:
- React 18 (Vite scaffold)
- React Router v6 (client-side routing, protected routes)
- Tailwind CSS (utility-first styling, UMBC color scheme)
- Chart.js (admin analytics dashboard charts)
- Axios (API communication)

Backend:
- Node.js + Express.js (REST API)
- MongoDB + Mongoose (database and ODM)
- JSON Web Tokens / JWT (authentication)
- bcrypt (password hashing)
- dotenv (environment variable management)

External APIs (phased):
- Anthropic Claude API — AI guidance chat widget (Alpha)
- YouTube Data API v3 — video recommendations (Beta, NOT Alpha)

DevOps / Tooling:
- Git + GitHub (version control, all commits documented)
- VSCode with Claude Code (development environment)
- Postman (API testing)
- MongoDB Atlas or local MongoDB (database)

### Architecture — Three-Tier

The system follows a strict three-tier architecture:

```
┌─────────────────────────────────────┐
│         Presentation Layer           │
│   React SPA (Vite)                   │
│   Pages, Components, Charts, Forms   │
└───────────────┬─────────────────────┘
                │ HTTP / REST (JSON)
                │ Axios calls to /api/*
┌───────────────▼─────────────────────┐
│         Application Layer            │
│   Node.js + Express REST API         │
│   Auth, Recommendation Logic,        │
│   Scoring, Filtering, Chat Proxy     │
└───────────────┬─────────────────────┘
                │ Mongoose ODM
┌───────────────▼─────────────────────┐
│           Data Layer                 │
│   MongoDB                            │
│   Users, Resources, Projects,        │
│   Feedback, Sessions, Analytics      │
└─────────────────────────────────────┘
```

### Authentication Flow

```
User submits login form
  → POST /api/auth/login
  → Express validates credentials
  → bcrypt compares hashed password
  → JWT token generated (payload: userId, role, email)
  → Token returned to frontend
  → Frontend stores token in localStorage
  → All subsequent requests include Authorization: Bearer <token>
  → Protected routes check token via middleware
  → Role-based access: student routes vs admin routes
```

---

## DATA STRUCTURES — Full Schema Definitions

These schemas are critical for DFDs, ERDs, and documentation later.
Every field must be understood before any code is written.

### 1. User Schema (users collection)

```
User {
  _id:          ObjectId (auto)
  fullName:     String, required
  email:        String, required, unique (must be @umbc.edu preferred)
  password:     String, required (bcrypt hashed, never stored plain)
  role:         String, enum: ['student', 'admin'], default: 'student'
  skillLevel:   String, enum: ['beginner', 'intermediate', 'advanced']
  createdAt:    Date, default: Date.now
  lastLogin:    Date
}
```

### 2. Resource Schema (resources collection)

```
Resource {
  _id:              ObjectId (auto)
  title:            String, required
  url:              String, required
  description:      String
  domain:           String, enum: ['web', 'mobile', 'ml', 'data', 'security',
                    'systems', 'devops', 'general']
  language:         String, enum: ['javascript', 'python', 'java', 'cpp',
                    'typescript', 'go', 'any']
  skillLevel:       String, enum: ['beginner', 'intermediate', 'advanced']
  resourceType:     String, enum: ['tutorial', 'documentation', 'github',
                    'video', 'article', 'book', 'library']
  estimatedHours:   Number
  youtubeUrl:       String (optional, added in Alpha as static field)
  tags:             [String] (e.g. ['react', 'hooks', 'frontend'])
  baseScore:        Number, default: 50 (0-100, manually curated quality score)
  averageRating:    Number, default: 0 (computed from feedback)
  totalRatings:     Number, default: 0
  usageCount:       Number, default: 0 (incremented on recommendation)
  addedBy:          ObjectId, ref: 'User' (admin who added it)
  createdAt:        Date, default: Date.now
  isActive:         Boolean, default: true
}
```

### 3. Project Schema (projects collection)

```
Project {
  _id:            ObjectId (auto)
  userId:         ObjectId, ref: 'User', required
  title:          String, required
  domain:         String, enum: same as Resource.domain
  language:       String, enum: same as Resource.language
  skillLevel:     String, enum: ['beginner', 'intermediate', 'advanced']
  timeline:       String, enum: ['1week', '2weeks', '1month', '3months',
                  'semester']
  description:    String
  status:         String, enum: ['active', 'completed', 'paused'],
                  default: 'active'
  recommendations:[ObjectId], ref: 'Resource' (cached recommendation result)
  createdAt:      Date, default: Date.now
  updatedAt:      Date
}
```

### 4. SavedResource Schema (savedresources collection)

```
SavedResource {
  _id:          ObjectId (auto)
  userId:       ObjectId, ref: 'User', required
  resourceId:   ObjectId, ref: 'Resource', required
  projectId:    ObjectId, ref: 'Project' (optional, which project it was
                saved under)
  isCompleted:  Boolean, default: false
  savedAt:      Date, default: Date.now
  completedAt:  Date (optional)
}
```

### 5. Feedback Schema (feedbacks collection)

```
Feedback {
  _id:          ObjectId (auto)
  userId:       ObjectId, ref: 'User', required
  resourceId:   ObjectId, ref: 'Resource', required
  projectId:    ObjectId, ref: 'Project' (optional)
  rating:       Number, min: 1, max: 5, required
  comment:      String (optional)
  helpful:      Boolean (quick thumbs up/down)
  createdAt:    Date, default: Date.now
}
```

### 6. ChatSession Schema (chatsessions collection)
(For Alpha this is lightweight — just logging. Full implementation in Beta.)

```
ChatSession {
  _id:        ObjectId (auto)
  userId:     ObjectId, ref: 'User'
  projectId:  ObjectId, ref: 'Project' (optional, provides context)
  messages:   [
    {
      role:       String, enum: ['user', 'assistant']
      content:    String
      timestamp:  Date
    }
  ]
  createdAt:  Date, default: Date.now
}
```

---

## RECOMMENDATION ENGINE LOGIC

This is the core algorithm. It must be clearly understood for DFD documentation.

### Input (from project form)
- domain (required)
- language (required, can be 'any')
- skillLevel (required)
- timeline (optional, affects complexity scoring)
- description (optional, future NLP use)

### Processing Steps (Alpha — rule-based)

```
Step 1 — Hard filter
  Filter resources where:
    resource.domain === input.domain
    AND resource.isActive === true
    AND (resource.language === input.language OR resource.language === 'any'
         OR input.language === 'any')
    AND resource.skillLevel === input.skillLevel

Step 2 — Scoring
  For each filtered resource, compute a relevance score:
    score = resource.baseScore                     (quality weight: 40%)
           + (resource.averageRating / 5) * 30     (user rating weight: 30%)
           + normalize(resource.usageCount) * 20   (popularity weight: 20%)
           + tagMatchBonus(resource.tags,           (tag match weight: 10%)
                           input.description)

Step 3 — Sort descending by score

Step 4 — Slice top 8-10 results

Step 5 — Group by resourceType for learning path sequencing:
  Order: documentation → tutorial → github → video → article
  This gives the student a natural "read docs first, then follow
  tutorial, then see code, then watch video" progression.

Step 6 — Return ranked list + sequenced learning path
```

### Note on Alpha vs Beta
- Alpha: All data is from a static seeded JSON file. Scores are pre-computed.
  MongoDB stores users and projects but resource data is seeded on startup.
- Beta: Real-time scoring updates as users rate resources. Usage count
  increments on each recommendation event.

---

## PROJECT FOLDER STRUCTURE (target, not to create yet)

```
umbc-learn/
├── client/                        (React frontend)
│   ├── public/
│   ├── src/
│   │   ├── api/                   (Axios instance + API call functions)
│   │   ├── components/            (reusable UI components)
│   │   │   ├── layout/            (Navbar, Sidebar, PageWrapper)
│   │   │   ├── cards/             (ResourceCard, ProjectCard, StatCard)
│   │   │   ├── forms/             (ProjectInputForm, LoginForm, RegisterForm)
│   │   │   └── chat/              (ChatWidget, MessageBubble)
│   │   ├── pages/                 (one file per route)
│   │   │   ├── Landing.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── NewProject.jsx
│   │   │   ├── Recommendations.jsx
│   │   │   ├── SavedResources.jsx
│   │   │   ├── LearningPaths.jsx
│   │   │   ├── Profile.jsx
│   │   │   └── admin/
│   │   │       ├── AdminDashboard.jsx
│   │   │       ├── ManageResources.jsx
│   │   │       └── StudentInsights.jsx
│   │   ├── context/               (AuthContext for global auth state)
│   │   ├── hooks/                 (useAuth, useRecommendations)
│   │   ├── utils/                 (token helpers, formatters)
│   │   ├── App.jsx                (router config, protected routes)
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   └── tailwind.config.js
│
├── server/                        (Express backend)
│   ├── config/
│   │   └── db.js                  (MongoDB connection)
│   ├── middleware/
│   │   ├── auth.js                (JWT verification middleware)
│   │   └── roleCheck.js           (admin-only route guard)
│   ├── models/
│   │   ├── User.js
│   │   ├── Resource.js
│   │   ├── Project.js
│   │   ├── SavedResource.js
│   │   ├── Feedback.js
│   │   └── ChatSession.js
│   ├── routes/
│   │   ├── auth.js                (POST /login, /register, /logout)
│   │   ├── resources.js           (GET /resources, GET /resources/:id)
│   │   ├── projects.js            (POST /projects, GET /projects/:userId)
│   │   ├── recommendations.js     (POST /recommend)
│   │   ├── saved.js               (POST/GET/DELETE /saved)
│   │   ├── feedback.js            (POST /feedback)
│   │   ├── chat.js                (POST /chat — Claude API proxy)
│   │   └── admin.js               (GET /analytics — admin only)
│   ├── data/
│   │   └── seedResources.js       (static resource data, 30+ entries)
│   ├── utils/
│   │   └── recommendationEngine.js (the scoring + filtering logic)
│   └── index.js                   (Express app entry point)
│
├── docs/                          (documentation — DFDs, diagrams, etc.)
│   ├── DFD_Level0.png
│   ├── DFD_Level1.png
│   ├── ERD.png
│   └── architecture.md
│
├── .env                           (never commit — gitignored)
├── .env.example                   (commit this — shows required vars)
├── .gitignore
├── README.md
└── CLAUDE.md                      (this file)
```

---

## ENVIRONMENT VARIABLES (.env)

```
# Server
PORT=5000
MONGODB_URI=mongodb://localhost:27017/umbc-learn
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=7d

# Anthropic
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Client (Vite prefix required)
VITE_API_BASE_URL=http://localhost:5000/api
```

---

## COLOR SCHEME — UMBC Brand

Primary:    #000000 (black)
Accent:     #FFD700 (UMBC gold)
Background: #F9F9F9 (off-white)
Surface:    #FFFFFF
Text muted: #666666
Border:     #E5E5E5
Success:    #22C55E
Error:      #EF4444

Tailwind custom config will extend these as 'umbc-black' and 'umbc-gold'.

---

## 20-COMMIT SPIRAL DELIVERY PLAN (Agile / Incremental)

Each commit is one focused, working, testable unit. Never commit broken code.
Commits must be descriptive and follow this format:
  feat: description       (new feature)
  fix: description        (bug fix)
  docs: description       (documentation only)
  style: description      (UI styling, no logic change)
  refactor: description   (code cleanup, no feature change)
  chore: description      (config, setup, tooling)

### Spiral 1 — Foundation (Commits 1–5)

Commit 01 — chore: initialize project structure
  What: Create folder structure, Vite React app, Node/Express server,
        package.json files, .gitignore, .env.example, README skeleton
  Why:  Establishes the two-app monorepo pattern (client + server)
  How:  Vite scaffold for client, manual setup for server

Commit 02 — chore: configure tooling and environment
  What: Tailwind CSS config with UMBC colors, Axios instance with base URL,
        CORS setup on Express, dotenv config, nodemon for dev server
  Why:  All subsequent work depends on these being correct from the start
  How:  tailwind.config.js, src/api/axios.js, server/index.js config

Commit 03 — feat: MongoDB connection and all Mongoose schemas
  What: db.js connection file, all 6 schema files (User, Resource, Project,
        SavedResource, Feedback, ChatSession)
  Why:  Data layer must be defined before any routes or logic
  How:  Mongoose models as defined in this document above

Commit 04 — feat: authentication backend (register, login, JWT)
  What: POST /api/auth/register, POST /api/auth/login, JWT middleware,
        bcrypt password hashing, role field support
  Why:  Every other feature requires authenticated users
  How:  auth.js route, auth.js middleware, User model

Commit 05 — feat: authentication frontend (login, register, AuthContext)
  What: Login page, Register page, AuthContext with useReducer,
        useAuth hook, token storage in localStorage, protected route wrapper
  Why:  Frontend must reflect auth state globally
  How:  React Context API, React Router protected route component

### Spiral 2 — Core UI Shell (Commits 6–9)

Commit 06 — feat: app router and page scaffolds
  What: React Router setup in App.jsx, all page components as empty shells
        with correct routes, 404 page, redirect logic for auth state
  Why:  Navigation structure must exist before building individual pages
  How:  React Router v6 createBrowserRouter or <Routes>

Commit 07 — style: layout components (navbar, sidebar, page wrapper)
  What: Sidebar with role-aware nav links, top navbar with user info and
        logout button, PageWrapper for consistent padding/layout
  Why:  Every page uses these — build once, reuse everywhere
  How:  Tailwind, UMBC colors, conditional rendering based on role

Commit 08 — style: landing page and auth page styling
  What: Landing page hero section ("Smart Learning Starts Here"),
        features section with 3 icons, styled Login and Register forms
  Why:  First impression for reviewers and demo purposes
  How:  Tailwind, matches lo-fi prototype aesthetic from Figma

Commit 09 — style: student dashboard page (static)
  What: Dashboard with welcome message, recent projects section (empty state),
        quick stats row (3 cards), "Start New Project" CTA button
  Why:  Students land here after login — it must feel complete
  How:  StatCard component, empty state illustration/message

### Spiral 3 — Resource Engine (Commits 10–13)

Commit 10 — feat: seed resource data (30+ static resources)
  What: server/data/seedResources.js with 30+ resource objects covering
        web, ml, mobile, data, security domains across all skill levels,
        seed script to insert into MongoDB on startup if empty
  Why:  Recommendation engine has nothing to work with without data
  How:  Static JS array with full schema fields, mongoose insertMany

Commit 11 — feat: recommendation engine logic (server)
  What: utils/recommendationEngine.js with filter → score → sort → sequence,
        POST /api/recommendations route that accepts project input and
        returns ranked resources with learning path sequence
  Why:  Core system feature — the engine IS the product
  How:  Pure function, unit-testable, uses scoring algorithm from this doc

Commit 12 — feat: project input form (frontend)
  What: NewProject page with form fields (title, domain, language, skill
        level, timeline, description), form validation, submit handler,
        POST to /api/projects and then POST to /api/recommendations
  Why:  Entry point for the entire student workflow
  How:  React controlled form, Axios POST, navigate to results on success

Commit 13 — feat: recommendations results page
  What: Recommendations page showing ranked ResourceCard components,
        learning path sequence display (numbered steps by resource type),
        "Save" button per resource, resource metadata display
  Why:  Output of the engine must be clearly presented
  How:  ResourceCard component, sorted display, Axios GET from project data

### Spiral 4 — Features and Data (Commits 14–17)

Commit 14 — feat: saved resources (save, view, mark complete)
  What: POST /api/saved and GET /api/saved/:userId routes,
        SavedResources page showing bookmarked items with filter by type
        and project, checkbox to mark as complete
  Why:  Students need to track what they're working through (R6 requirement)
  How:  SavedResource model, Axios calls, filter UI

Commit 15 — feat: AI chat widget (Claude API integration)
  What: POST /api/chat route proxying to Anthropic API with system prompt
        scoped to UMBC software engineering context, ChatWidget component
        with floating button, message history, user/assistant bubbles
  Why:  Key differentiator feature — provides contextual AI guidance
  How:  Anthropic API call in backend, React state for message array

Commit 16 — feat: admin dashboard (static charts and metrics)
  What: AdminDashboard page with 4 stat cards (hardcoded sample data),
        Chart.js bar chart for popular languages, bar chart for domains,
        most used resources list, skill level distribution
  Why:  Faculty/admin use case — analytics visibility (R8, R9 requirements)
  How:  Chart.js, hardcoded seed data for Alpha, admin route guard

Commit 17 — feat: profile page and basic feedback (star rating)
  What: Profile page showing user info with edit name functionality,
        star rating component on ResourceCard that POSTs to /api/feedback,
        rating updates averageRating on resource document
  Why:  Completes student workflow and fulfills R10 feedback requirement
  How:  PUT /api/users/:id for profile, POST /api/feedback

### Spiral 5 — Polish and Documentation (Commits 18–20)

Commit 18 — style: UI consistency pass and responsive design
  What: Review all pages for visual consistency, fix any layout breaks,
        ensure mobile-friendly at 768px breakpoint, UMBC color use audit,
        loading spinners on async operations, error messages on form errors
  Why:  Alpha demo must look intentional, not like a broken prototype
  How:  Tailwind responsive classes, consistent component reuse

Commit 19 — docs: inline code documentation and README update
  What: JSDoc comments on all utility functions especially the
        recommendation engine, schema field comments, README with setup
        instructions, API endpoint documentation, environment variable guide
  Why:  Documentation is a graded component of the capstone
  How:  JSDoc, markdown README

Commit 20 — chore: final alpha cleanup, .env.example, demo data check
  What: Remove console.logs, verify all routes return correct status codes,
        confirm seed data loads cleanly, test full user flows end to end
        (register → login → create project → get recommendations → save
        resource → open chat → admin login → view dashboard → logout)
  Why:  Alpha checkpoint submission — must be demo-ready and stable
  How:  Manual walkthrough of all user flows, fix any blockers

---

## WHAT IS INTENTIONALLY INCOMPLETE IN ALPHA (Beta scope)

The following features are NOT to be built during Alpha. If I ask for them
during Alpha development, remind me they are Beta scope:

- YouTube Data API integration (Alpha uses static youtubeUrl field only)
- Learning path completion tracking with progress percentage
- Adaptive recommendations that update based on completed resources
- Admin resource management CRUD (add/edit/delete resources via UI)
- Student insights page with per-student drill-down
- Advanced feedback loop (ratings influencing future recommendations)
- Email notifications
- Collaborative or social features
- Any ML or NLP on the description field

---

## DFD CONTEXT (for future documentation)

Context Diagram (Level 0) entities:
- External: Student, Admin/Faculty
- System: UMBC Learn (single process)
- Data flows in: project parameters, login credentials, feedback ratings
- Data flows out: recommended resources, learning paths, analytics reports

Level 1 DFD processes:
1.0 Authenticate User
2.0 Manage Projects
3.0 Generate Recommendations
4.0 Manage Saved Resources
5.0 Process Feedback
6.0 Provide AI Guidance
7.0 Generate Analytics

Data stores (for DFD notation):
D1 Users
D2 Resources
D3 Projects
D4 Saved Resources
D5 Feedback
D6 Chat Sessions

---

## FIGMA PROTOTYPE NOTE

The developer has a Figma lo-fi prototype showing the intended UI. Key
design decisions visible in the prototype:
- Black sidebar navigation on the left (~220px wide)
- UMBC gold (#FFD700) as the primary action color (buttons, highlights)
- Clean white content area
- Card-based resource display
- Faculty dashboard with bar charts (Chart.js style)
If the Figma link or screenshots are shared, update this section.

---

## ENGINEERING PRINCIPLES TO FOLLOW

1. Separation of concerns — business logic stays in utils/, not in routes/
2. Single responsibility — each component and route does one thing
3. DRY — no duplicated logic; reuse components, middleware, and utilities
4. Fail loudly in development — use proper HTTP status codes and error messages
5. Security defaults — never log passwords, always hash, always validate input
6. Commit discipline — every commit is a working, tested, isolated increment
7. No commented-out code committed — use Git history instead
8. Environment variables only — no hardcoded secrets, URLs, or credentials

---

## YOUR FIRST ACTION

You have now read the full project context.
Do not write any code.
Do not create any files.
Do not run any commands.

Ask me questions to clarify project requirements, technical requirements,
engineering principles, and other things.
