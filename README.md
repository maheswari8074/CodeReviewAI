<div align="center">
  <h1>CodeReviewAI</h1>
  <p>AI-powered code review platform for developers</p>

  ![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat-square)
  ![Node.js](https://img.shields.io/badge/Node.js-Express-green?style=flat-square)
  ![MongoDB](https://img.shields.io/badge/Database-MongoDB-brightgreen?style=flat-square)
  ![Groq](https://img.shields.io/badge/AI-Groq%20Llama%203.3-orange?style=flat-square)
  ![Redis](https://img.shields.io/badge/Cache-Redis-red?style=flat-square)

  <br />

  🔗 **[Live Demo](https://codereviewai.vercel.app)** — coming soon
</div>

---

## Overview

CodeReviewAI is a full-stack web application that gives developers instant, detailed feedback on their code using large language models. Submit any code snippet and get back bug reports, complexity analysis, quality scores, and refactoring suggestions — all in seconds.

## Features

- **Bug & Issue Detection** — Identifies logic errors, security vulnerabilities, and code smells with severity levels (critical / warning / suggestion)
- **Complexity Analysis** — Computes Time and Space complexity in Big O notation
- **Quality Scoring** — Rates code across Readability, Performance, Security, and Maintainability
- **Refactoring Suggestions** — Side-by-side before/after code with explanations
- **Review History** — Tracks all past reviews with scores over time
- **PDF Reports** — Export any review as a formatted PDF document
- **Multi-language Support** — Python, JavaScript, TypeScript, Java, C++, Go, Rust

## Tech Stack

| Layer | Technology | Reason |
|---|---|---|
| Frontend | Next.js 14 | App Router, SSR, Vercel deployment |
| Backend | Node.js + Express | REST API, middleware support |
| Database | MongoDB | Flexible schema for review results |
| AI | Groq (Llama 3.3 70B) | Fast inference, free tier |
| Cache | Redis (Upstash) | Serverless, REST-based |
| Auth | GitHub OAuth 2.0 + JWT | Frictionless for developers |

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Client Browser                    │
└─────────────────────┬───────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────┐
│              Next.js Frontend (Vercel)               │
│                                                      │
│   Landing → Dashboard → Review → History → Detail   │
└─────────────────────┬───────────────────────────────┘
                      │ REST API
                      ▼
┌─────────────────────────────────────────────────────┐
│             Express Backend (Railway)                │
│                                                      │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────┐  │
│  │ Rate Limiter│  │  Auth (JWT)  │  │  Routes   │  │
│  └─────────────┘  └──────────────┘  └───────────┘  │
│                                                      │
│  ┌──────────────────────────────────────────────┐   │
│  │              Job Queue (2 workers)           │   │
│  └──────────────────────┬───────────────────────┘   │
└─────────────────────────┼───────────────────────────┘
                          │
          ┌───────────────┼───────────────┐
          ▼               ▼               ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   MongoDB    │  │    Redis     │  │   Groq API   │
│   (Atlas)    │  │  (Upstash)   │  │  Llama 3.3   │
│              │  │              │  │              │
│ Users        │  │ Review cache │  │ Code analysis│
│ Reviews      │  │ TTL: 1 hour  │  │ JSON output  │
└──────────────┘  └──────────────┘  └──────────────┘
```

## How It Works

1. User logs in via GitHub OAuth — backend exchanges code for access token, fetches user profile, issues a JWT
2. User submits code — backend checks Redis cache first; if hit, returns instantly
3. Cache miss — job is added to the async queue with a 2-worker concurrency limit
4. Worker calls Groq API with a structured prompt — response is parsed into JSON
5. Result is saved to MongoDB, cached in Redis, and returned to the frontend
6. User sees scores, issues, refactoring suggestions, and can export a PDF report

## Key Design Decisions

**Why a Job Queue?**
If 100 users submit code simultaneously, direct API calls would overwhelm the system. The queue processes jobs with a configurable worker limit, ensuring stability under load.

**Why Redis Caching?**
Identical code submissions return cached results instantly without hitting the AI API. Cache TTL is 1 hour, reducing latency and API costs significantly.

**Why Rate Limiting?**
Each user is limited to 10 requests per minute to prevent abuse and ensure fair usage across all users.

**Why GitHub OAuth?**
Code review is a developer tool — GitHub OAuth gives frictionless login for the exact target audience with no password management needed.

## Local Development

### Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)
- [Groq API key](https://console.groq.com) — free
- [GitHub OAuth App](https://github.com/settings/developers)
- [Upstash Redis](https://upstash.com) — free

### Setup

```bash
# Clone the repo
git clone https://github.com/maheswari8074/CodeReviewAI.git
cd CodeReviewAI

# Backend
cd backend
npm install
cp .env.example .env
# Fill in your environment variables
npm run dev

# Frontend (new terminal)
cd frontend
npm install
cp .env.example .env.local
# Fill in your environment variables
npm run dev
```

### Environment Variables

**`backend/.env`**
```env
PORT=5000
MONGODB_URI=
JWT_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GROQ_API_KEY=
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
FRONTEND_URL=http://localhost:3000
```

**`frontend/.env.local`**
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

## API Reference

```
GET    /api/auth/github              → Redirect to GitHub OAuth
GET    /api/auth/github/callback     → OAuth callback, issues JWT
GET    /api/auth/me                  → Get authenticated user

POST   /api/reviews                  → Submit code for review
GET    /api/reviews                  → List all reviews for user
GET    /api/reviews/:id              → Get single review detail
GET    /api/reviews/queue/stats      → Get queue status
```

## Project Structure

```
CodeReviewAI/
├── frontend/
│   └── app/
│       ├── page.tsx              # Landing page
│       ├── dashboard/page.tsx    # User dashboard
│       ├── review/page.tsx       # Code submission
│       ├── review/[id]/page.tsx  # Review detail
│       ├── history/page.tsx      # Review history
│       ├── auth/callback/        # OAuth callback
│       └── hooks/useAuth.ts      # Auth hook
│
└── backend/
    ├── controllers/              # Route handlers
    ├── models/                   # MongoDB schemas
    ├── routes/                   # API routes
    ├── services/
    │   ├── claudeService.js      # Groq AI integration
    │   └── cacheService.js       # Redis caching
    ├── queues/
    │   └── reviewQueue.js        # Async job queue
    ├── middleware/
    │   ├── auth.js               # JWT verification
    │   └── rateLimiter.js        # Rate limiting
    └── index.js
```

## Author

**Maheswari** — [@maheswari8074](https://github.com/maheswari8074)