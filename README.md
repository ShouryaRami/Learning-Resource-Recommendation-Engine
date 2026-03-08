# UMBC Learn — Learning Resource Recommendation Engine

Capstone Project | SENG 701, Spring 2026 | Shourya Rami (AD39491)
University of Maryland Baltimore County — MPS Software Engineering

---

## Overview

UMBC Learn is a web-based recommendation engine that helps software engineering
students find personalized learning resources based on their project context.
Students enter their project type, programming language, skill level, and goals
and receive a ranked, sequenced set of resources — tutorials, documentation,
GitHub repos, videos, and library materials.

Faculty and administrators have access to an analytics dashboard tracking usage
patterns, popular languages, domain trends, and student engagement metrics.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 (Vite), React Router v6, Tailwind CSS, Chart.js, Axios |
| Backend | Node.js, Express.js, MongoDB, Mongoose, JWT, bcrypt |
| AI | Anthropic Claude API (chat widget) |
| DevOps | Git, GitHub, Postman |

---

## Project Structure

```
umbc-learn/
├── client/     # React frontend (Vite)
├── server/     # Node.js + Express REST API
├── docs/       # Architecture diagrams, DFDs, ERD
├── .env.example
└── README.md
```

---

## Getting Started

### Prerequisites
- Node.js 18.x
- MongoDB (local or Atlas)

### Install dependencies

```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### Configure environment

```bash
cp .env.example .env
# Edit .env with your MongoDB URI, JWT secret, and Anthropic API key
```

### Run in development

```bash
# Terminal 1 — start API server (port 5000)
cd server
npm run dev

# Terminal 2 — start React dev server (port 5173)
cd client
npm run dev
```

---

## Environment Variables

See `.env.example` for all required variables.

---

## Delivery Plan

Built incrementally across 20 commits following a spiral delivery model:
- Spiral 1 (01–05): Foundation — project structure, tooling, schemas, auth
- Spiral 2 (06–09): Core UI shell — router, layout, landing, dashboard
- Spiral 3 (10–13): Resource engine — seed data, algorithm, forms, results
- Spiral 4 (14–17): Features — saved resources, AI chat, admin dashboard, feedback
- Spiral 5 (18–20): Polish — UI consistency, documentation, final cleanup
