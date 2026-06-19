# CodeReviewAI

AI-powered code review tool for developers. Paste a snippet or submit a public GitHub repository URL and get severity-ranked issues, quality scores, Big O complexity analysis, concrete refactors, and a context-aware AI assistant — all in one workspace.

![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square)
![Node.js](https://img.shields.io/badge/Node.js-Express-green?style=flat-square)
![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-brightgreen?style=flat-square)
![Redis](https://img.shields.io/badge/Redis-Upstash-red?style=flat-square)
![License](https://img.shields.io/badge/license-ISC-lightgrey?style=flat-square)

> **GitHub:** https://github.com/maheswari8074/CodeReviewAI

---

## Features

### Code snippet review
Paste any code into the Monaco editor. Choose a language or let the system auto-detect from 7 supported languages. The review returns:
- Overall quality score (0–100) with four sub-dimensions: readability, performance, security, maintainability
- Time and space complexity (Big O notation)
- Severity-ranked issues: critical, warning, suggestion — each with a description and suggested fix
- Before/after refactoring examples with explanations
- Plain-English summary

### Repository review
Submit a public GitHub URL. The system fetches the repository tree, selects up to 8 representative source files under 30 KB (skipping `node_modules`, `dist`, `.next`, and generated folders), reviews each file independently, and aggregates the results into a single report with per-file scores and a combined issue list.

### Context-aware AI chat
Every code review and repository report has a floating AI assistant pre-loaded with the review context. Ask follow-up questions about specific issues, request alternative fixes, or explore design decisions. A standalone general-purpose assistant is also available for coding questions unrelated to any review.

### Dashboard analytics
After completing reviews, the dashboard shows:
- Combined code review + repository review score trend (line chart)
- Issues by severity across all reviews (pie chart)
- Quality breakdown by dimension: readability, performance, security, maintainability (bar chart)
- Reviews by language (bar chart)
- Repository scores per repo (bar chart)
- Summary stats: total code reviews, total repo reviews, average score, total issues found

### Review history
Full searchable, filterable history for both code reviews and repository reviews in a tabbed view. Supports:
- Search by filename or language (code) / repository name (repo)
- Filter code reviews by status: completed, processing, failed
- Rerun any previous code review with one click (restores original code and settings)
- Delete reviews (ownership-scoped — users can only delete their own)
- Pagination on both tabs

### PDF export
Export a complete review report as a PDF from both the code review detail page and the repository review detail page. Includes scores, issue list, complexity notes, and refactoring suggestions.

### Onboarding
First-time users see a 3-step guided modal after login that walks through the three main workflows: code review, repository review, and AI chat. Dismissed to localStorage — shown only once.

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 (App Router), React 19, TypeScript 5 |
| Styling | CSS Modules, Tailwind CSS, Space Grotesk + JetBrains Mono |
| Code editor | Monaco Editor (`@monaco-editor/react`) |
| Charts | Recharts |
| PDF export | jsPDF |
| Backend | Node.js, Express 5 |
| Database | MongoDB + Mongoose |
| Cache | Upstash Redis (1-hour TTL, base64-hashed key per code+language) |
| AI | Groq SDK — `llama-3.3-70b-versatile` |
| Auth | GitHub OAuth → JWT (Bearer token) |
| Job processing | In-memory queue (2 concurrent workers), immediate response + polling |
| Rate limiting | Per-user in-memory windowed limiter |
| Testing | Jest + Supertest |

---

## Architecture

```
Browser
  └── Next.js App Router (frontend/)
        ├── /dashboard        — overview + analytics
        ├── /review           — Monaco editor + polling + results
        ├── /review/[id]      — saved report + PDF export + chat
        ├── /repo-review      — URL input + progress + polling
        ├── /repo-review/[id] — per-file sidebar + PDF export + chat
        ├── /history          — tabbed code/repo history
        ├── /chat             — standalone AI assistant
        └── /auth/callback    — JWT token exchange

Express API (backend/)
  ├── POST   /api/auth/github/callback  — OAuth exchange, JWT issue
  ├── GET    /api/auth/me               — current user
  ├── POST   /api/reviews               — submit code review (async)
  ├── GET    /api/reviews               — paginated list + search + stats
  ├── GET    /api/reviews/:id           — full review
  ├── GET    /api/reviews/:id/status    — polling endpoint
  ├── DELETE /api/reviews/:id           — ownership-scoped delete
  ├── POST   /api/repo-reviews          — submit repo review (async)
  ├── GET    /api/repo-reviews          — paginated list
  ├── GET    /api/repo-reviews/:id      — full report
  ├── GET    /api/repo-reviews/:id/status
  ├── DELETE /api/repo-reviews/:id      — ownership-scoped delete
  ├── POST   /api/chat                  — send message (context-aware)
  └── GET    /api/chat                  — chat history

Async flow:
  Client POSTs code/URL
    → Server creates DB record (status: processing), responds immediately with ID
    → Background worker calls Groq API
    → On completion, updates DB record (status: completed)
    → Client polls /status every 3s until completed or failed
```

---

## Project structure

```
CodeReviewAI/
├── backend/
│   ├── config/
│   │   └── db.js                  — MongoDB connection
│   ├── controllers/
│   │   ├── authController.js      — GitHub OAuth + JWT
│   │   ├── reviewController.js    — code review CRUD
│   │   ├── repoController.js      — repository review CRUD
│   │   └── chatController.js      — context-aware chat
│   ├── middleware/
│   │   ├── auth.js                — JWT Bearer verification
│   │   └── rateLimiter.js         — per-user windowed rate limiter
│   ├── models/
│   │   ├── User.js                — GitHub profile
│   │   ├── Review.js              — code review + result
│   │   ├── RepoReview.js          — repo review + per-file results
│   │   └── Chat.js                — chat message history
│   ├── queues/
│   │   └── reviewQueue.js         — in-memory job queue (2 workers)
│   ├── routes/
│   │   ├── auth.js
│   │   ├── review.js
│   │   ├── repo.js
│   │   └── chat.js
│   ├── services/
│   │   ├── groqService.js         — Groq LLM: review + chat
│   │   ├── githubService.js       — repo tree fetch + file filtering
│   │   └── cacheService.js        — Upstash Redis read/write
│   ├── tests/
│   │   ├── setup.js               — Jest env setup
│   │   ├── auth.test.js           — JWT middleware (5 tests)
│   │   ├── reviewController.test.js — submit/delete/list (12 tests)
│   │   ├── repoController.test.js — submit/delete/get (8 tests)
│   │   └── rateLimiter.test.js    — per-user limits (3 tests)
│   └── index.js                   — Express app entry
│
└── frontend/
    └── app/
        ├── components/
        │   ├── AppShell.tsx        — authenticated sidebar layout
        │   ├── AppIcon.tsx         — SVG icon set
        │   ├── ChatPanel.tsx       — floating + embedded chat
        │   ├── DashboardCharts.tsx — Recharts analytics
        │   ├── OnboardingModal.tsx — first-login guided tour
        │   ├── Pagination.tsx      — ellipsis pagination
        │   ├── ReviewReport.tsx    — shared score + issues + refactors
        │   └── UI.tsx              — PageHeader, StateCard, LoadingCard
        ├── hooks/
        │   ├── useAuth.ts          — user session + logout
        │   └── useJobPolling.ts    — generic async job poller
        ├── lib/
        │   └── api.ts              — typed apiFetch + ApiError
        └── types.ts                — shared TypeScript interfaces
```

---

## Getting started

### Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)
- A [GitHub OAuth App](https://github.com/settings/developers) — set callback URL to `http://localhost:5000/api/auth/github/callback`
- A [Groq API key](https://console.groq.com)
- An [Upstash Redis](https://upstash.com) database (free tier works)

### Backend setup

```bash
cd backend
npm install
```

Create `backend/.env`:

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
FRONTEND_URL=http://localhost:3000
JWT_SECRET=a_long_random_secret_string
GITHUB_CLIENT_ID=your_github_oauth_client_id
GITHUB_CLIENT_SECRET=your_github_oauth_client_secret
GROQ_API_KEY=your_groq_api_key
UPSTASH_REDIS_REST_URL=your_upstash_redis_url
UPSTASH_REDIS_REST_TOKEN=your_upstash_redis_token
```

```bash
npm run dev       # development with nodemon
npm start         # production
npm test          # run 28 unit tests
```

### Frontend setup

```bash
cd frontend
npm install
```

Create `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

```bash
npm run dev       # development server on http://localhost:3000
npm run build     # production build
npm run lint      # ESLint
```

---

## Environment variables reference

| Variable | Where | Description |
|---|---|---|
| `PORT` | backend | Express server port (default 5000) |
| `MONGODB_URI` | backend | MongoDB connection string |
| `FRONTEND_URL` | backend | CORS allowed origin |
| `JWT_SECRET` | backend | Secret for signing/verifying JWTs |
| `GITHUB_CLIENT_ID` | backend | GitHub OAuth app client ID |
| `GITHUB_CLIENT_SECRET` | backend | GitHub OAuth app client secret |
| `GROQ_API_KEY` | backend | Groq API key for LLM calls |
| `UPSTASH_REDIS_REST_URL` | backend | Upstash Redis REST endpoint |
| `UPSTASH_REDIS_REST_TOKEN` | backend | Upstash Redis auth token |
| `NEXT_PUBLIC_API_URL` | frontend | Backend base URL for API calls |

---

## API rate limits

| Endpoint | Limit |
|---|---|
| `POST /api/reviews` | 10 requests / minute per user |
| `POST /api/repo-reviews` | 5 requests / minute per user |
| `POST /api/chat` | 20 requests / minute per user |

---

## Running tests

```bash
cd backend
npm test
```

**28 tests across 4 suites:**

| Suite | Tests | What's covered |
|---|---|---|
| `auth.test.js` | 5 | Valid token, missing token, malformed token, wrong secret, expired token |
| `reviewController.test.js` | 12 | Submit validation, cache hit, queue dispatch, delete ownership, 404, pagination, status filter, SQL injection guard |
| `repoController.test.js` | 8 | Missing URL, parse failure, immediate response, delete ownership, 404, get review |
| `rateLimiter.test.js` | 3 | Under limit passes, over limit blocked with 429, per-user isolation |

---

## Security

- All authenticated routes require a valid JWT Bearer token
- Every database query is scoped to `userId` — users cannot access or modify other users' data
- Rate limiting is applied per authenticated user on all write endpoints
- Review results are cached server-side by a hashed key — submitted code is never logged or exposed in list responses (list endpoint strips `code` and `result.refactoring` fields)
- Submitted code and repository file contents are processed for analysis and stored with the review record. Remove secrets, tokens, and personal data before submitting.

---

## Known limitations

- The job queue is in-memory. If the server restarts while a review is processing, the job is lost and the review stays in `processing` status. A production deployment should swap the queue for BullMQ backed by Redis.
- Repository review only supports public GitHub repositories. Private repos and other Git hosts are not supported.
- The in-memory rate limiter resets on server restart. A Redis-backed distributed limiter would be needed for multi-instance deployments.

---

## License

ISC
