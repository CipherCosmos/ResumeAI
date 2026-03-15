# 📚 ORBITAL SYSTEMS — Complete Application Documentation

> **ResumeAI** (code-named *ORBITAL SYSTEMS*) is a production-ready, full-stack, AI-powered resume builder and ATS optimization platform. This document covers every aspect of the application in sequence — from high-level overview to low-level implementation details.

---

## Table of Contents

1. [Application Overview](#1-application-overview)
2. [Tech Stack](#2-tech-stack)
3. [Directory Structure](#3-directory-structure)
4. [Features & Modules](#4-features--modules)
   - 4.1 [Resume Builder (The Resume Laboratory)](#41-resume-builder-the-resume-laboratory)
   - 4.2 [ATS Tracker (Audit Terminal)](#42-ats-tracker-audit-terminal)
   - 4.3 [Dashboard](#43-dashboard)
   - 4.4 [AI Career Counselor Chatbot](#44-ai-career-counselor-chatbot)
   - 4.5 [Resume Templates](#45-resume-templates)
   - 4.6 [Resume Sharing](#46-resume-sharing)
   - 4.7 [User Profile & Account Management](#47-user-profile--account-management)
5. [Architecture Overview](#5-architecture-overview)
6. [Database Models (Prisma Schema)](#6-database-models-prisma-schema)
7. [TypeScript Types & Interfaces](#7-typescript-types--interfaces)
8. [API Endpoints Reference](#8-api-endpoints-reference)
   - 8.1 [Authentication & User Management](#81-authentication--user-management)
   - 8.2 [Resume Management](#82-resume-management)
   - 8.3 [AI Features](#83-ai-features)
   - 8.4 [ATS & Scoring](#84-ats--scoring)
   - 8.5 [Billing & Credits](#85-billing--credits)
   - 8.6 [Utilities](#86-utilities)
9. [React Components Guide](#9-react-components-guide)
   - 9.1 [Page Components (App Router)](#91-page-components-app-router)
   - 9.2 [Core Components](#92-core-components)
   - 9.3 [Form Section Components](#93-form-section-components)
   - 9.4 [Form Card Components](#94-form-card-components)
   - 9.5 [Resume Templates](#95-resume-templates)
   - 9.6 [UI Primitives (Shadcn/Radix)](#96-ui-primitives-shadcnradix)
10. [State Management (Zustand)](#10-state-management-zustand)
11. [AI System — Multi-Provider Fallback Chain](#11-ai-system--multi-provider-fallback-chain)
12. [ATS Scoring Engine](#12-ats-scoring-engine)
13. [Authentication & Authorization](#13-authentication--authorization)
14. [Credit System](#14-credit-system)
15. [Payment Integration (Razorpay)](#15-payment-integration-razorpay)
16. [Caching Strategy](#16-caching-strategy)
17. [Security](#17-security)
18. [Configuration Files](#18-configuration-files)
19. [Environment Variables Reference](#19-environment-variables-reference)
20. [Setup & Installation](#20-setup--installation)
21. [Development Workflow](#21-development-workflow)
22. [Building & Deploying for Production](#22-building--deploying-for-production)
23. [CI/CD Pipeline](#23-cicd-pipeline)
24. [Useful Commands & Scripts](#24-useful-commands--scripts)

---

## 1. Application Overview

**ORBITAL SYSTEMS** is a full-stack web application that helps job-seekers build, optimize, and share professional resumes. The platform combines a rich resume-builder UI with AI-powered content generation, an ATS (Applicant Tracking System) scoring engine, and a career-coaching chatbot.

### Key Highlights

| Dimension | Details |
|-----------|---------|
| **Type** | Full-stack SaaS web application |
| **Framework** | Next.js 15+ (App Router) |
| **Language** | TypeScript (strict mode) |
| **Database** | PostgreSQL via Prisma ORM |
| **Auth** | NextAuth.js v4 (JWT + OAuth) |
| **AI** | Multi-provider fallback chain (xAI → Groq → Cerebras → Gemini → OpenRouter) |
| **Payments** | Razorpay (credit system) |
| **Deployment** | Vercel-ready (Next.js edge/serverless) |
| **License** | MIT |

### Application URL Structure

| Route | Description |
|-------|-------------|
| `/` | Landing page |
| `/auth/signin` | Sign-in / registration page |
| `/dashboard` | Resume management hub |
| `/builder` | Resume builder (editor + preview) |
| `/ats-tracker` | ATS score analyzer |
| `/profile` | User account & settings |
| `/r/[id]` | Public shareable resume URL |

---

## 2. Tech Stack

### Frontend

| Technology | Version | Purpose |
|-----------|---------|---------|
| Next.js | 15+ | App Router, SSR/SSG, API routes, Turbopack |
| React | 19 | UI framework (Concurrent Mode) |
| TypeScript | 5 | Type-safe development (strict mode) |
| Tailwind CSS | v4 | Utility-first styling |
| Shadcn/UI | latest | Pre-built component library |
| Radix UI | latest | Accessible UI primitives |
| Framer Motion | latest | Micro-animations |
| Zustand | v5 | Global state management with persistence |
| SWR | v2.4.1 | Client-side data fetching & caching |
| React Hook Form | latest | Performant form handling |
| Zod | latest | Runtime schema validation |
| Lucide React | latest | Icon library (577+ icons) |
| react-to-print | v3.3.0 | PDF / print export |
| react-markdown | v10.1.0 | Markdown rendering |
| Sonner | v2.0.7 | Toast notifications |
| Vercel Analytics | v1.6.1 | Usage analytics |

### Backend

| Technology | Version | Purpose |
|-----------|---------|---------|
| Next.js API Routes | 15+ | Serverless API layer |
| Prisma ORM | v7.4.2 | Database abstraction & migrations |
| @prisma/adapter-pg | latest | PostgreSQL adapter |
| NextAuth.js | v4.24.13 | Authentication (JWT + OAuth) |
| bcryptjs | v3.0.3 | Password hashing |
| ioredis | v5.10.0 | Redis client for caching |
| lru-cache | v11.2.6 | In-memory semantic prompt caching |
| unpdf | v1.4.0 | PDF text extraction |
| mammoth | v1.11.0 | DOCX → plain-text conversion |
| Razorpay | v2.9.6 | Payment gateway SDK |

### AI Providers (Fallback Chain)

| Priority | Provider | Model | Free Tier |
|----------|---------|-------|-----------|
| 1 | xAI (Grok) | grok-* | Paid |
| 2 | Groq | llama/mixtral | 14,400 req/day |
| 3 | Cerebras | llama | 30 req/min |
| 4 | Google Gemini | gemini-* | 1,500 req/day |
| 5 | OpenRouter | meta-llama/llama-3.3-70b-instruct:free | 50 req/day |

---

## 3. Directory Structure

```text
ResumeAI/
├── .github/
│   └── workflows/
│       └── ci.yml                  # CI/CD pipeline (build, lint, type-check)
│
├── prisma/
│   └── schema.prisma               # Database schema (Prisma ORM definitions)
│
├── public/                         # Static assets served at root URL
│   ├── docs-hero.png               # Landing page screenshot (README)
│   ├── docs-builder.png            # Builder screenshot (README)
│   ├── docs-audit.png              # ATS Tracker screenshot (README)
│   ├── docs-dashboard.png          # Dashboard screenshot (README)
│   ├── images/                     # Additional images (hero, template previews)
│   ├── file.svg                    # Generic icons
│   ├── globe.svg
│   ├── next.svg
│   ├── vercel.svg
│   └── window.svg
│
├── scripts/
│   └── setup.js                    # Pre-dev environment validation script
│
├── src/
│   ├── app/                        # Next.js App Router pages & API routes
│   │   ├── api/                    # Backend API routes (23 endpoints)
│   │   │   ├── ats-score/          # POST  — Calculate ATS score
│   │   │   ├── ats-tracker/        # GET, POST — ATS history & audit trails
│   │   │   ├── auth/
│   │   │   │   ├── [...nextauth]/  # NextAuth dynamic route
│   │   │   │   └── register/       # POST — New user registration
│   │   │   ├── chat/               # POST (stream) — AI career counselor
│   │   │   ├── cover-letter/       # POST — Generate cover letter
│   │   │   ├── credits/            # GET  — Credit balance & transactions
│   │   │   ├── generate/           # POST — Generate full resume with AI
│   │   │   ├── parse-resume/       # POST — Parse uploaded resume file
│   │   │   ├── profile/
│   │   │   │   ├── disconnect/     # POST — Disconnect OAuth provider
│   │   │   │   └── update/         # POST — Update profile details
│   │   │   ├── razorpay/
│   │   │   │   ├── create-order/   # POST — Create Razorpay order
│   │   │   │   └── verify/         # POST — Verify payment & add credits
│   │   │   ├── resume-fix/         # POST — AI-powered resume repair
│   │   │   ├── resume-review/      # POST — AI feedback on resume quality
│   │   │   ├── resumes/            # GET, POST, PUT, DELETE — Resume CRUD
│   │   │   │   └── [id]/
│   │   │   │       ├── cover-letter/ # POST — Cover letter for a specific resume
│   │   │   │       └── share/        # GET  — Generate shareable link
│   │   │   ├── rewrite-bullets/    # POST — AI bullet point rewriter
│   │   │   ├── suggest/            # POST — Real-time field suggestions
│   │   │   ├── templates/
│   │   │   │   └── [id]/           # GET  — Get template configuration
│   │   │   └── user/
│   │   │       ├── route.ts        # GET, PUT — Get/update user profile
│   │   │       └── password/       # PUT  — Change password
│   │   │
│   │   ├── ats-tracker/
│   │   │   └── page.tsx            # ATS Tracker page
│   │   ├── auth/
│   │   │   └── signin/
│   │   │       └── page.tsx        # Sign-in / register page
│   │   ├── builder/
│   │   │   └── page.tsx            # Resume Builder page
│   │   ├── dashboard/
│   │   │   └── page.tsx            # Dashboard page
│   │   ├── profile/
│   │   │   └── page.tsx            # User profile & settings page
│   │   ├── r/
│   │   │   └── [id]/
│   │   │       └── page.tsx        # Public shareable resume page
│   │   ├── error.tsx               # Route-level error boundary
│   │   ├── global-error.tsx        # Global error boundary
│   │   ├── layout.tsx              # Root layout (providers, analytics)
│   │   ├── not-found.tsx           # 404 page
│   │   └── page.tsx                # Landing page (~21 KB)
│   │
│   ├── components/                 # Reusable React components
│   │   ├── form/                   # Form section components
│   │   │   ├── cards/              # Individual entry cards
│   │   │   │   ├── EducationCard.tsx
│   │   │   │   ├── ExperienceCard.tsx
│   │   │   │   └── ProjectCard.tsx
│   │   │   ├── EducationSection.tsx
│   │   │   ├── ExperienceSection.tsx
│   │   │   ├── PersonalSection.tsx
│   │   │   ├── ProjectsSection.tsx
│   │   │   └── TargetAndJDSection.tsx
│   │   ├── templates/              # 15+ resume template renderers
│   │   │   ├── AcademicTemplate.tsx
│   │   │   ├── BoldTemplate.tsx
│   │   │   ├── ClassicTemplate.tsx
│   │   │   ├── CompactTemplate.tsx
│   │   │   ├── CreativeTemplate.tsx
│   │   │   ├── DataScientistTemplate.tsx
│   │   │   ├── DesignerTemplate.tsx
│   │   │   ├── ElegantTemplate.tsx
│   │   │   ├── ExecutiveTemplate.tsx
│   │   │   ├── FinanceTemplate.tsx
│   │   │   ├── MinimalTemplate.tsx
│   │   │   ├── ModernTemplate.tsx
│   │   │   ├── ProfessionalTemplate.tsx
│   │   │   ├── StartupTemplate.tsx
│   │   │   └── TechTemplate.tsx
│   │   ├── ui/                     # Shadcn/Radix UI primitives
│   │   │   ├── accordion.tsx
│   │   │   ├── avatar.tsx
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── dropdown-menu.tsx
│   │   │   ├── input.tsx
│   │   │   ├── label.tsx
│   │   │   ├── select.tsx
│   │   │   ├── separator.tsx
│   │   │   └── textarea.tsx
│   │   ├── AIBadge.tsx
│   │   ├── ChatBot.tsx             # AI career counselor chat UI
│   │   ├── DebouncedInput.tsx      # Input with debounce & auto-save
│   │   ├── Footer.tsx
│   │   ├── GeometricBackground.tsx # Animated particle canvas background
│   │   ├── Header.tsx              # Top navigation bar
│   │   ├── Providers.tsx           # Root providers wrapper
│   │   ├── ResumeForm.tsx          # Main resume form (all sections, ~1,487 lines)
│   │   ├── ResumePreview.tsx       # Live resume preview renderer
│   │   ├── ThemeProvider.tsx       # next-themes dark/light mode provider
│   │   ├── ThemeToggle.tsx         # Dark/light toggle button
│   │   └── UserMenu.tsx            # User avatar dropdown menu
│   │
│   ├── hooks/
│   │   └── useMousePosition.ts     # Mouse position hook (for animations)
│   │
│   ├── lib/                        # Shared utilities & server-side logic
│   │   ├── ai.ts                   # Multi-provider AI fallback chain
│   │   ├── ats-engine.ts           # Algorithmic ATS scoring engine
│   │   ├── auth.ts                 # NextAuth configuration
│   │   ├── credits.ts              # Credit system helpers
│   │   ├── prisma.ts               # Singleton Prisma client
│   │   ├── redis.ts                # Redis client setup
│   │   └── utils.ts                # Shared utilities (cn, etc.)
│   │
│   ├── store/
│   │   └── useResumeStore.ts       # Zustand store (resume state + persistence)
│   │
│   └── types/
│       └── resume.ts               # TypeScript type definitions
│
├── .env.local                      # Environment variables (not committed)
├── .gitignore
├── components.json                 # Shadcn component manifest
├── eslint.config.mjs               # ESLint v9 flat configuration
├── next.config.ts                  # Next.js configuration (security headers, etc.)
├── package.json                    # Dependencies & npm scripts
├── postcss.config.mjs              # PostCSS pipeline
├── prisma.config.ts                # Prisma CLI configuration
├── tailwind.config.js              # Tailwind CSS v4 configuration
└── tsconfig.json                   # TypeScript compiler options
```

---

## 4. Features & Modules

### 4.1 Resume Builder (The Resume Laboratory)

The Resume Builder (`/builder`) is the core editor of the application. It provides a split-pane layout: a form panel on the left and a live preview panel on the right.

**Sections available in the form:**

| Section | Fields |
|---------|--------|
| **Personal Information** | Full name, email, phone, location, LinkedIn URL, GitHub URL, portfolio URL, profile image (Base64) |
| **Target Role & Job Description** | Target job title, full job description (used by AI for context) |
| **Professional Summary** | Free-text summary paragraph |
| **Work Experience** | Job title, company, location, start/end dates, bullet points (unlimited) |
| **Projects** | Project name, tech stack, description, project URL |
| **Education** | Degree, institution, year, GPA, coursework |
| **Skills** | Comma-separated or tag-based skill list |
| **Certifications** | Free-text list of certifications |
| **Languages** | List of spoken languages |
| **Appearance** | Template selection, theme color picker, font family |

**Key capabilities:**

- **Auto-save**: Debounced 3.5-second auto-save to the database after every change.
- **AI Suggestions**: Context-aware AI suggestions for every section (skills, bullet rewriting, summary generation, etc.).
- **Magic Baseline Generator**: Sends the target role to the AI to generate a full starting-point resume.
- **Resume Parsing**: Upload a PDF, DOCX, TXT, or MD file — the AI extracts and populates all fields automatically.
- **Drag-and-drop reordering**: Work experience, education, and project entries can be reordered interactively.
- **Live Preview**: The right pane renders the selected template in real time.
- **PDF Export**: Uses `react-to-print` to render the preview directly to a printer/PDF with HSL color preservation.
- **Bullet Rewriting**: AI rewrites individual bullet points using the XYZ formula (Accomplished X, by doing Y, resulting in Z).

### 4.2 ATS Tracker (Audit Terminal)

The ATS Tracker (`/ats-tracker`) allows users to measure how well their resume matches a specific job description.

**Analysis dimensions:**

| Category | What is measured |
|----------|-----------------|
| **Keyword Matching** | Technical skills, soft skills, certifications, tools, methodologies, domain keywords present/missing |
| **Section Presence** | Contact info, Summary, Experience, Skills, Education, Projects, Certifications |
| **Bullet Quality** | Action verb usage, quantified metrics, sentence length |
| **Readability** | Avg. sentence length, word count, special character ratio |
| **Format** | Date consistency, resume page length estimate, overall structure |

**Key capabilities:**

- **Live Score Meter**: Real-time 0–100 ATS score with HSL color feedback (red → orange → green).
- **Magic Fix (Neural Repair)**: One-click AI that rewrites the resume to increase the ATS score against the provided job description.
- **Keyword Gap Analysis**: Displays matched and missing keywords side-by-side.
- **Historical Audit Trails**: Every ATS check is saved with full analysis details in the database (`AtsScore` model).
- **Actionable Suggestions**: Prioritized list of specific improvements to make.

### 4.3 Dashboard

The Dashboard (`/dashboard`) is the central command hub for managing all resumes.

**Capabilities:**

- View all saved resumes (title, last-modified date, template used).
- Create a new blank resume.
- Duplicate an existing resume.
- Delete a resume (with confirmation dialog).
- Open a resume in the Builder or ATS Tracker.
- Generate and copy a public shareable link.
- Browse all 15+ templates with visual previews.
- View credit balance and full transaction history.
- Purchase additional credits via Razorpay.

### 4.4 AI Career Counselor Chatbot

The Chatbot (`ChatBot.tsx`) is an AI-powered coaching assistant embedded throughout the application.

**Capabilities:**

- Conversational guidance through resume creation.
- Contextual awareness of the current resume's content.
- ATS coaching: teaches XYZ formula, action verbs, quantification best practices.
- Field-specific suggestions triggered by user questions.
- Security-hardened: prompt injection protection, role-locked to career counseling only.
- Streaming responses (native OpenAI-compatible streaming protocol).

### 4.5 Resume Templates

The application ships with **15+ professionally designed templates**, each implemented as a self-contained React component:

| Template | Style |
|----------|-------|
| Professional | Classic corporate layout |
| Modern | Two-column with accent sidebar |
| Minimal | Clean whitespace-focused design |
| Executive | Bold header for senior roles |
| Creative | Colorful with visual hierarchy |
| Tech | Dark-themed, developer-focused |
| Startup | Dynamic layout for founders |
| Academic | Structured CV-style layout |
| Classic | Traditional single-column format |
| Bold | High-contrast attention-grabbing header |
| Elegant | Serif fonts, refined look |
| Compact | Maximum information density |
| Data Scientist | Charts-inspired data-heavy layout |
| Designer | Visual portfolio-inspired |
| Finance | Conservative, trusted professional look |

Each template supports:
- **Theme color** — applied consistently throughout via CSS custom properties.
- **Font family** — multiple font options selectable from the builder.
- **Print optimization** — all templates include `@media print` styles.
- **HSL color preservation** — colors are preserved accurately in PDF export.

### 4.6 Resume Sharing

Resumes can be shared publicly via a unique URL: `/r/[id]`.

- The link renders the resume using the saved template and theme settings.
- No login required to view a shared resume.
- Shareable links are generated on-demand via `GET /api/resumes/[id]/share`.

### 4.7 User Profile & Account Management

The Profile page (`/profile`) lets users:

- Update their display name, phone number, and address.
- Change their password (for credential accounts).
- Connect or disconnect OAuth providers (Google, GitHub, LinkedIn).
- View connected provider accounts.

---

## 5. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT (Browser)                          │
│                                                                   │
│  ┌──────────┐  ┌─────────────┐  ┌────────────┐  ┌───────────┐  │
│  │ Landing  │  │   Builder   │  │  Dashboard │  │ ATS Track │  │
│  │  Page    │  │  (Editor +  │  │  (CRUD +   │  │  (Score + │  │
│  │          │  │   Preview)  │  │   Credits) │  │   History)│  │
│  └──────────┘  └──────┬──────┘  └─────┬──────┘  └─────┬─────┘  │
│                        │              │                │         │
│           Zustand Store (useResumeStore) — persisted to localStorage
└───────────────────────────────────────────────────────────────────
                         │ HTTP / Fetch / SWR
┌───────────────────────────────────────────────────────────────────┐
│                   NEXT.JS APP ROUTER (Server)                      │
│                                                                    │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────────────┐ │
│  │  NextAuth   │  │  AI Routes   │  │  Resume / ATS / Billing  │ │
│  │  (JWT Auth) │  │  /generate   │  │       API Routes         │ │
│  │  /api/auth  │  │  /chat       │  │                          │ │
│  └──────┬──────┘  │  /suggest    │  └────────────┬─────────────┘ │
│         │         │  /rewrite-.. │               │               │
│         │         └──────┬───────┘               │               │
└─────────┼────────────────┼───────────────────────┼───────────────┘
          │                │                        │
    ┌─────┴──────┐   ┌─────┴──────────┐    ┌───────┴───────┐
    │  PostgreSQL │   │  AI Providers  │    │     Redis      │
    │  (Prisma)   │   │ xAI/Groq/Gemini│    │   (Caching)   │
    └─────────────┘   └───────────────┘    └───────────────┘
```

**Request flow for a typical AI action (e.g., "Generate Resume"):**

1. User clicks "Generate" in the Builder.
2. Client sends `POST /api/generate` with resume data and target role.
3. API route checks authentication (NextAuth session).
4. API route checks and deducts user credits atomically (Prisma transaction).
5. AI module attempts providers in order (xAI → Groq → Cerebras → Gemini → OpenRouter) until one succeeds.
6. Parsed AI response is returned to the client.
7. Client updates Zustand store → triggers re-render of the live preview.
8. Auto-save debounce fires → `PUT /api/resumes` saves updated data to PostgreSQL.

---

## 6. Database Models (Prisma Schema)

File: `prisma/schema.prisma`

### `User`

Stores all registered users.

| Field | Type | Notes |
|-------|------|-------|
| `id` | String (CUID) | Primary key |
| `name` | String? | Display name |
| `email` | String (unique) | Login email |
| `emailVerified` | DateTime? | Email verification timestamp |
| `image` | String? | Profile picture URL |
| `password` | String? | bcryptjs-hashed password (null for OAuth-only users) |
| `phone` | String? | Phone number |
| `address` | String? | Physical address |
| `credits` | Int | Current credit balance (default: 10) |
| `createdAt` | DateTime | Account creation timestamp |
| `updatedAt` | DateTime | Last updated timestamp |

Relations: `accounts`, `sessions`, `transactions`, `resumes`, `atsScores`

---

### `Account`

Stores linked OAuth provider accounts (Google, GitHub, LinkedIn).

| Field | Type | Notes |
|-------|------|-------|
| `id` | String (CUID) | Primary key |
| `userId` | String | FK → `User.id` (cascade delete) |
| `type` | String | e.g. `"oauth"` |
| `provider` | String | e.g. `"google"`, `"github"` |
| `providerAccountId` | String | Provider's unique user ID |
| `access_token` | String? | OAuth access token |
| `refresh_token` | String? | OAuth refresh token |
| `expires_at` | Int? | Token expiry Unix timestamp |
| `token_type` | String? | e.g. `"Bearer"` |
| `scope` | String? | OAuth scopes granted |
| `id_token` | String? | OpenID Connect ID token |
| `session_state` | String? | Session state string |

Unique constraint: `[provider, providerAccountId]`

---

### `Session`

Stores active NextAuth sessions.

| Field | Type | Notes |
|-------|------|-------|
| `id` | String (CUID) | Primary key |
| `sessionToken` | String (unique) | Opaque session token |
| `userId` | String | FK → `User.id` (cascade delete) |
| `expires` | DateTime | Session expiry |

---

### `VerificationToken`

Used for email verification flows.

| Field | Type | Notes |
|-------|------|-------|
| `identifier` | String | Email address |
| `token` | String (unique) | One-time verification token |
| `expires` | DateTime | Token expiry |

---

### `Transaction`

Tracks every credit movement (deductions and purchases).

| Field | Type | Notes |
|-------|------|-------|
| `id` | String (CUID) | Primary key |
| `userId` | String | FK → `User.id` (cascade delete) |
| `amount` | Int | Positive = credit added, Negative = credit used |
| `type` | String | `USAGE`, `PURCHASE`, `BONUS`, `REFUND` |
| `description` | String | Human-readable description of the transaction |
| `createdAt` | DateTime | Transaction timestamp |

---

### `Resume`

Stores all user resumes and their data.

| Field | Type | Notes |
|-------|------|-------|
| `id` | String (CUID) | Primary key |
| `userId` | String | FK → `User.id` (cascade delete) |
| `title` | String | Resume name (default: `"My Resume"`) |
| `data` | Json | Full `ResumeData` object (see §7) |
| `markdown` | String? | Optional generated markdown version |
| `createdAt` | DateTime | Creation timestamp |
| `updatedAt` | DateTime | Last updated timestamp |

Relations: `atsScores: AtsScore[]`

---

### `AtsScore`

Stores historical ATS audit results.

| Field | Type | Notes |
|-------|------|-------|
| `id` | String (CUID) | Primary key |
| `resumeId` | String | FK → `Resume.id` |
| `userId` | String | FK → `User.id` |
| `score` | Int | ATS score (0–100) |
| `jdSnippet` | String? | First ~200 chars of the job description |
| `matched` | Json? | Array of matched keyword strings |
| `missing` | Json? | Array of missing keyword strings |
| `suggestions` | Json? | Array of actionable improvement strings |
| `fullResult` | Json? | Complete structured ATS analysis object |
| `createdAt` | DateTime | Analysis timestamp |

---

## 7. TypeScript Types & Interfaces

File: `src/types/resume.ts`

### `ResumeData`

The top-level object stored in `Resume.data` (JSON column).

```typescript
interface ResumeData {
  personal:       PersonalInfo;
  summary:        string;
  targetRole:     string;
  jobDescription: string;
  skills:         string[];
  experience:     WorkEntry[];
  projects:       ProjectEntry[];
  education:      EducationEntry[];
  certifications: string[];
  languages:      string[];
  template:       ResumeTemplate;   // Union of 15 template name strings
  title:          string;
  themeColor:     string;           // HSL or hex color string
  fontFamily:     string;
}
```

### `PersonalInfo`

```typescript
interface PersonalInfo {
  fullName:     string;
  email:        string;
  phone:        string;
  location:     string;
  linkedin:     string;
  github:       string;
  portfolio:    string;
  profileImage?: string;  // Base64-encoded image
}
```

### `WorkEntry`

```typescript
interface WorkEntry {
  id:        string;   // UUID
  jobTitle:  string;
  company:   string;
  location:  string;
  startDate: string;
  endDate:   string;   // Use "Present" for current roles
  bullets:   string[]; // Achievement bullet points
}
```

### `ProjectEntry`

```typescript
interface ProjectEntry {
  id:          string;
  name:        string;
  techStack:   string;
  description: string;
  link:        string;
}
```

### `EducationEntry`

```typescript
interface EducationEntry {
  id:          string;
  degree:      string;
  institution: string;
  year:        string;
  gpa:         string;
  coursework?: string;
}
```

### `ResumeTemplate` (Union Type)

```typescript
type ResumeTemplate =
  | 'professional'
  | 'modern'
  | 'minimal'
  | 'executive'
  | 'creative'
  | 'tech'
  | 'startup'
  | 'academic'
  | 'classic'
  | 'bold'
  | 'elegant'
  | 'compact'
  | 'data-scientist'
  | 'designer'
  | 'finance';
```

---

## 8. API Endpoints Reference

All API routes live under `src/app/api/`. Every protected route checks for a valid NextAuth session via `getServerSession()`. Endpoints that consume credits perform an atomic Prisma transaction to deduct credits and record a `Transaction` entry.

### 8.1 Authentication & User Management

#### `POST /api/auth/register`

Registers a new user with email and password.

**Request body:**

```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "securePassword123"
}
```

**Response:** `201 Created` with the new user object (password field omitted).

**Errors:** `400` if email already exists or validation fails.

---

#### `GET /api/auth/[...nextauth]` / `POST /api/auth/[...nextauth]`

NextAuth.js dynamic route. Handles all OAuth flows (sign-in, callback, sign-out, session retrieval). Configured in `src/lib/auth.ts`.

---

#### `GET /api/user`

Returns the authenticated user's profile.

**Response:**

```json
{
  "id": "clxxx",
  "name": "Jane Doe",
  "email": "jane@example.com",
  "phone": "...",
  "address": "...",
  "credits": 8,
  "image": "..."
}
```

---

#### `PUT /api/user`

Updates the authenticated user's name, phone, or address.

**Request body (any subset):**

```json
{
  "name": "Jane Smith",
  "phone": "+1-555-1234",
  "address": "New York, NY"
}
```

---

#### `PUT /api/user/password`

Changes the authenticated user's password.

**Request body:**

```json
{
  "currentPassword": "old",
  "newPassword": "new_secure_password"
}
```

---

#### `POST /api/profile/update`

Alias / alternate route for updating profile fields (name, phone, address). Returns updated user.

---

#### `POST /api/profile/disconnect`

Disconnects a linked OAuth provider account from the user.

**Request body:**

```json
{
  "provider": "github"
}
```

---

### 8.2 Resume Management

#### `GET /api/resumes`

Returns all resumes belonging to the authenticated user.

**Response:** Array of `{ id, title, createdAt, updatedAt, data }` objects.

---

#### `POST /api/resumes`

Creates a new blank resume for the authenticated user.

**Request body:**

```json
{
  "title": "My New Resume",
  "data": { /* ResumeData object */ }
}
```

---

#### `PUT /api/resumes`

Updates an existing resume.

**Request body:**

```json
{
  "id": "resume_id",
  "title": "Updated Title",
  "data": { /* ResumeData object */ }
}
```

---

#### `DELETE /api/resumes`

Deletes a resume by ID.

**Request body:**

```json
{
  "id": "resume_id"
}
```

---

#### `GET /api/resumes/[id]/share`

Returns or generates a publicly shareable URL for the given resume.

**Response:**

```json
{
  "url": "https://your-domain.com/r/clxxx"
}
```

---

#### `POST /api/resumes/[id]/cover-letter`

Generates a cover letter for a specific saved resume.

**Request body:**

```json
{
  "jobDescription": "We are looking for a..."
}
```

**Credit cost:** 2 credits.

---

### 8.3 AI Features

All AI endpoints require authentication. Credit costs are noted.

#### `POST /api/generate`

Generates a complete, AI-filled resume based on form data and the user's target role.

**Credit cost:** 2 credits.

**Request body:**

```json
{
  "targetRole": "Senior Software Engineer",
  "data": { /* partial ResumeData */ }
}
```

**Response:** Populated `ResumeData` object.

---

#### `POST /api/parse-resume`

Accepts a multipart form upload (`file` field) containing a PDF, DOCX, TXT, or MD file. Extracts text and maps it to the `ResumeData` structure via AI.

**Credit cost:** 1 credit.

**Request:** `multipart/form-data` with `file` field.

**Response:** Parsed `ResumeData` object.

---

#### `POST /api/chat` (Streaming)

Streams responses from the AI career counselor. Uses Server-Sent Events (SSE) compatible with the `ReadableStream` API.

**Request body:**

```json
{
  "messages": [
    { "role": "user", "content": "Help me improve my summary" }
  ],
  "resumeContext": { /* current ResumeData (optional) */ }
}
```

**Response:** Streaming text (OpenAI-compatible streaming format).

---

#### `POST /api/suggest`

Returns real-time, contextual suggestions for a specific resume field. **Free** (no credit cost).

**Request body:**

```json
{
  "field": "skills",
  "context": { /* current ResumeData */ }
}
```

**Response:** Array of suggestion strings.

---

#### `POST /api/rewrite-bullets`

Rewrites a set of bullet points using the XYZ achievement formula.

**Credit cost:** 1 credit.

**Request body:**

```json
{
  "bullets": ["Led team of engineers", "Improved performance"],
  "jobTitle": "Software Engineer",
  "company": "Acme Corp"
}
```

**Response:** Array of rewritten bullet strings.

---

#### `POST /api/cover-letter`

Generates a full cover letter from resume data and a job description.

**Credit cost:** 2 credits.

**Request body:**

```json
{
  "resumeData": { /* ResumeData */ },
  "jobDescription": "We are looking for..."
}
```

**Response:** `{ "coverLetter": "Dear Hiring Manager, ..." }`

---

#### `POST /api/resume-fix`

AI-powered "magic fix" that repairs and improves the entire resume to better match a job description.

**Request body:**

```json
{
  "resumeData": { /* ResumeData */ },
  "jobDescription": "..."
}
```

**Response:** Improved `ResumeData` object.

---

#### `POST /api/resume-review`

Returns qualitative AI feedback on resume quality (tone, completeness, keyword density, etc.).

**Request body:**

```json
{
  "resumeData": { /* ResumeData */ }
}
```

**Response:** `{ "review": "Your resume is strong in... but could improve..." }`

---

### 8.4 ATS & Scoring

#### `POST /api/ats-score`

Calculates an ATS score for a resume against a job description. Saves the result as an `AtsScore` record.

**Credit cost:** 1 credit.

**Request body:**

```json
{
  "resumeData": { /* ResumeData */ },
  "jobDescription": "Full JD text here",
  "resumeId": "clxxx"
}
```

**Response:**

```json
{
  "score": 78,
  "matched": ["Python", "Docker", "REST API"],
  "missing": ["Kubernetes", "CI/CD"],
  "suggestions": ["Add Kubernetes to your skills section", "..."],
  "fullResult": { /* detailed analysis object */ }
}
```

---

#### `GET /api/ats-tracker`

Returns all historical ATS audit records for the authenticated user.

**Response:** Array of `AtsScore` records (sorted by `createdAt` descending).

---

#### `POST /api/ats-tracker`

Creates/saves an ATS audit entry (typically called internally after scoring).

---

### 8.5 Billing & Credits

#### `GET /api/credits`

Returns the authenticated user's credit balance and last 50 transactions.

**Response:**

```json
{
  "credits": 8,
  "transactions": [
    {
      "id": "clxxx",
      "amount": -1,
      "type": "USAGE",
      "description": "ATS Score calculation",
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ]
}
```

---

#### `POST /api/razorpay/create-order`

Creates a new Razorpay payment order for purchasing a credit bundle.

**Request body:**

```json
{
  "amount": 499,
  "currency": "INR",
  "package": "starter"
}
```

**Response:** Razorpay order object (contains `id`, `amount`, `currency`).

---

#### `POST /api/razorpay/verify`

Verifies a completed Razorpay payment and credits the user's account.

**Request body:**

```json
{
  "razorpay_order_id": "order_xxx",
  "razorpay_payment_id": "pay_xxx",
  "razorpay_signature": "hmac_signature"
}
```

**Response:** `{ "success": true, "credits": 50 }` — the new total credit balance.

---

### 8.6 Utilities

#### `GET /api/templates/[id]`

Returns the configuration metadata for a specific template (colors, fonts, layout options).

**Response:**

```json
{
  "id": "modern",
  "name": "Modern",
  "defaultColor": "#2563eb",
  "fonts": ["Inter", "Roboto", "Georgia"]
}
```

---

## 9. React Components Guide

### 9.1 Page Components (App Router)

| File | Route | Description |
|------|-------|-------------|
| `src/app/page.tsx` | `/` | Full landing page with hero, features, pricing, CTA sections |
| `src/app/auth/signin/page.tsx` | `/auth/signin` | Sign-in and registration form with OAuth buttons |
| `src/app/dashboard/page.tsx` | `/dashboard` | Resume list, template browser, credit display |
| `src/app/builder/page.tsx` | `/builder` | Split-pane editor: ResumeForm + ResumePreview |
| `src/app/ats-tracker/page.tsx` | `/ats-tracker` | ATS score interface with history |
| `src/app/profile/page.tsx` | `/profile` | Account settings, password change, OAuth management |
| `src/app/r/[id]/page.tsx` | `/r/[id]` | Public shareable resume viewer (no auth required) |
| `src/app/layout.tsx` | All | Root layout: Providers, Header, Footer, Analytics |
| `src/app/error.tsx` | All | Route-level error boundary component |
| `src/app/global-error.tsx` | All | Top-level global error boundary |
| `src/app/not-found.tsx` | `*` | 404 not found page |

### 9.2 Core Components

#### `ResumeForm.tsx` (~1,487 lines)

The primary form component rendered in the Builder page. Contains all resume sections as Shadcn `<Accordion>` items.

**Key props:** Receives `resumeData`, `onChange`, and various AI action handlers.

**Responsibilities:**
- Render all form sections (Personal, Summary, Experience, etc.)
- Orchestrate AI suggestion calls for each section
- Handle "Magic Baseline Generator" trigger
- Handle file upload for resume parsing
- Manage accordion open/close state

---

#### `ResumePreview.tsx` (~202 lines)

Renders the live resume preview using the currently selected template component.

**Key props:** `data: ResumeData`, `printRef` (forwarded ref for `react-to-print`).

**Logic:** Dynamically imports and renders the matching template component based on `data.template`.

---

#### `ChatBot.tsx` (~787 lines)

Full conversational AI chat panel.

**Key behaviors:**
- Maintains local message history.
- Streams AI responses via `POST /api/chat`.
- Provides quick-action buttons ("Improve Summary", "Suggest Skills", etc.).
- Collapses to a floating action button when closed.
- Injects current resume data as context.

---

#### `Header.tsx` (~113 lines)

Top navigation bar with:
- Application logo and name.
- Navigation links (Dashboard, Builder, ATS Tracker).
- `ThemeToggle` (dark/light mode).
- `UserMenu` (avatar, profile link, sign-out).

---

#### `UserMenu.tsx` (~107 lines)

Avatar-based dropdown menu showing:
- User's name and email.
- Links to Profile, Dashboard.
- Sign-out button.

---

#### `GeometricBackground.tsx` (~164 lines)

Animated canvas component rendering a particle swarm with connecting lines. Used as the background on the landing page and builder.

---

#### `DebouncedInput.tsx` (~73 lines)

A controlled input that fires `onChange` after a configurable debounce delay (default 500 ms). Used throughout the form to avoid excessive re-renders and API calls.

---

#### `ThemeProvider.tsx`

Wraps the application in `next-themes`' `ThemeProvider` to enable dark/light mode support.

---

#### `Providers.tsx`

Root wrapper component that composes:
1. `SessionProvider` (NextAuth)
2. `ThemeProvider`
3. `Toaster` (Sonner toast notifications)

---

### 9.3 Form Section Components

Each component is a self-contained section within `ResumeForm.tsx`:

| Component | Purpose |
|-----------|---------|
| `PersonalSection.tsx` | Name, contact details, social URLs, profile image upload |
| `TargetAndJDSection.tsx` | Target role input, job description textarea |
| `ExperienceSection.tsx` | Manages the list of `WorkEntry` items; add/remove/reorder |
| `EducationSection.tsx` | Manages the list of `EducationEntry` items |
| `ProjectsSection.tsx` | Manages the list of `ProjectEntry` items |

### 9.4 Form Card Components

Individual data-entry cards rendered inside their parent section:

| Component | Purpose |
|-----------|---------|
| `ExperienceCard.tsx` | Editable card for a single work experience entry with bullet management |
| `EducationCard.tsx` | Editable card for a single education entry |
| `ProjectCard.tsx` | Editable card for a single project entry |

Each card provides:
- Field-level AI suggestion buttons.
- Delete button to remove the entry.
- Drag handle for reordering (via HTML5 drag-and-drop API).

### 9.5 Resume Templates

Each file in `src/components/templates/` is a standalone React component that accepts `ResumeData` as props and renders the complete resume layout.

**Shared contract:**

```tsx
interface TemplateProps {
  data: ResumeData;
  isPrinting?: boolean;
}

export default function ModernTemplate({ data, isPrinting }: TemplateProps) { ... }
```

Templates use only Tailwind utility classes and inline styles for color theming to ensure correct PDF rendering.

### 9.6 UI Primitives (Shadcn/Radix)

Pre-built, accessible UI components in `src/components/ui/`:

| Component | Description |
|-----------|-------------|
| `accordion.tsx` | Collapsible section panels (used in ResumeForm) |
| `avatar.tsx` | Circular profile picture with fallback initials |
| `button.tsx` | Styled button with variants (default, ghost, outline, destructive) |
| `card.tsx` | Container card with header, content, footer slots |
| `dialog.tsx` | Modal dialog with overlay (delete confirmations, etc.) |
| `dropdown-menu.tsx` | Accessible dropdown menus (UserMenu, template selector) |
| `input.tsx` | Styled text input |
| `label.tsx` | Form label with `htmlFor` support |
| `select.tsx` | Accessible select dropdown |
| `separator.tsx` | Horizontal or vertical divider line |
| `textarea.tsx` | Styled multi-line text area |

---

## 10. State Management (Zustand)

File: `src/store/useResumeStore.ts`

The global client state is managed using **Zustand** with `localStorage` persistence via the `persist` middleware.

### Store Shape

```typescript
interface ResumeStore {
  // State
  resumeData:      ResumeData;        // Current resume being edited
  resumeId:        string | null;     // Database ID of current resume
  isSaving:        boolean;           // True while auto-save is in flight
  selectedTemplate: ResumeTemplate;  // Currently selected template name

  // Actions
  setResumeData:   (data: Partial<ResumeData>) => void;
  setResumeId:     (id: string) => void;
  resetResume:     () => void;
  setIsSaving:     (saving: boolean) => void;
  setTemplate:     (template: ResumeTemplate) => void;
}
```

### Persistence

- Data is serialized to `localStorage` under the key `orbital-resume-store`.
- On page load, the persisted state is hydrated automatically.
- Sensitive fields (like `profileImage`) are stored as Base64 strings.

### Auto-save Flow

1. User edits any field → `setResumeData()` called → Zustand state updated.
2. `ResumeForm` or the builder page subscribes to the store.
3. A `useEffect` with a 3.5-second debounce fires `PUT /api/resumes` with the latest state.
4. `isSaving` is toggled to show a saving indicator in the UI.

---

## 11. AI System — Multi-Provider Fallback Chain

File: `src/lib/ai.ts`

### Overview

The AI module implements a **priority-ordered fallback chain** across 5 providers. If a provider fails (rate limit, API error, timeout), the next provider is tried automatically. This ensures maximum uptime without depending on a single paid API key.

### Provider Order

```
1. xAI (Grok)         — Best quality; paid
2. Groq               — Fast, free tier: 14,400 req/day
3. Cerebras           — Free tier: 30 req/min
4. Google Gemini      — Free tier: 1,500 req/day
5. OpenRouter         — Free models (meta-llama/llama-3.3-70b-instruct:free, 50 req/day)
```

### Key Functions

#### `generateText(prompt, systemPrompt?)`

Generates a non-streaming text completion. Tries each provider in order.

```typescript
const text = await generateText(
  "Write a professional summary for a Software Engineer with 5 years of React experience.",
  "You are a professional resume writer."
);
```

#### `streamText(prompt, systemPrompt?, onChunk?)`

Generates a streaming text completion. Returns a `ReadableStream` compatible with `Response` streaming.

```typescript
const stream = await streamText(
  "Improve these bullet points: ...",
  "You are a resume optimizer.",
  (chunk) => console.log(chunk)
);
```

### Semantic Prompt Caching

The module uses **LRU cache** (`lru-cache`) to cache responses for identical or semantically similar prompts. Cache keys are normalized versions of prompts (whitespace trimmed, lowercased). Cache size: 500 entries, TTL: 1 hour.

---

## 12. ATS Scoring Engine

File: `src/lib/ats-engine.ts`

### Overview

A fully algorithmic (no AI API calls required) scoring engine that analyzes a resume against a job description and produces a structured score report.

### Scoring Components (weighted)

| Component | Weight | Description |
|-----------|--------|-------------|
| Keyword Match | 40% | Technical, soft, certification, tool, methodology, domain keywords |
| Section Presence | 20% | Required sections: Contact, Summary, Experience, Skills, Education |
| Bullet Quality | 20% | Action verbs used, metrics/numbers present, sentence length |
| Readability | 10% | Avg. sentence length, word count, special character ratio |
| Format | 10% | Date consistency, resume length (pages), overall structure |

### Keyword Categories

The engine recognizes keyword categories extracted from the job description:

- **Technical** — Programming languages, frameworks, databases
- **Soft** — Leadership, communication, collaboration, etc.
- **Certification** — AWS Certified, PMP, CPA, etc.
- **Tool** — IDEs, CI/CD tools, design tools, etc.
- **Methodology** — Agile, Scrum, Kanban, DevOps, etc.
- **Domain** — Industry-specific terminology

### Output Structure

```typescript
interface ATSResult {
  score:        number;     // 0–100 overall score
  breakdown: {
    keywords:    number;   // keyword sub-score
    sections:    number;   // section presence sub-score
    bullets:     number;   // bullet quality sub-score
    readability: number;   // readability sub-score
    format:      number;   // format sub-score
  };
  matched:     string[];  // Keywords found in resume
  missing:     string[];  // Keywords present in JD but missing from resume
  suggestions: string[];  // Prioritized improvement suggestions
  details: {
    keywordsByCategory: Record<string, { matched: string[]; missing: string[] }>;
    sectionsFound:      string[];
    sectionsMissing:    string[];
    bulletMetrics: {
      totalBullets:       number;
      withActionVerb:     number;
      withMetrics:        number;
      avgLength:          number;
    };
    formatMetrics: {
      estimatedPages:     number;
      dateConsistency:    boolean;
      hasContactInfo:     boolean;
    };
  };
}
```

---

## 13. Authentication & Authorization

File: `src/lib/auth.ts`

### Authentication Providers

| Provider | Type | Configuration |
|---------|------|--------------|
| Email/Password | Credentials | Validates via `bcryptjs.compare()` |
| Google | OAuth 2.0 | Requires `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` |
| GitHub | OAuth 2.0 | Requires `GITHUB_CLIENT_ID` + `GITHUB_CLIENT_SECRET` |
| LinkedIn | OAuth 2.0 | Requires `LINKEDIN_CLIENT_ID` + `LINKEDIN_CLIENT_SECRET` |

OAuth providers are **conditionally registered** — if environment variables are not present, the provider is skipped silently.

### Session Strategy

- **Strategy**: `jwt` (JSON Web Tokens)
- **Session payload includes**: `user.id`, `user.email`, `user.name`, `user.credits`
- **Session is refreshed**: On every request via `session` callback that re-fetches credits from DB

### Account Linking

When a user signs in with an OAuth provider that has the same email as an existing account:
1. The JWT `signIn` callback checks for existing accounts with the same email.
2. If found, it links the new OAuth account to the existing user via `Account.create`.
3. The user retains all their data across authentication methods.

### Route Protection

All API routes that require authentication use:

```typescript
const session = await getServerSession(authOptions);
if (!session?.user?.id) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
```

Page-level protection is handled via client-side `useSession()` redirects.

---

## 14. Credit System

File: `src/lib/credits.ts`

### Overview

Users start with **10 free credits** upon registration. Credits are consumed for AI-powered features.

### Credit Costs

| Action | Credit Cost |
|--------|------------|
| ATS Score calculation | 1 credit |
| Resume parsing (PDF/DOCX upload) | 1 credit |
| Bullet point rewriting | 1 credit |
| Resume generation (Magic Baseline) | 2 credits |
| Cover letter generation | 2 credits |
| Field suggestions | 0 (free) |
| Chatbot messages | 0 (free) |

### Credit Deduction (Atomic Transaction)

Credits are deducted using a Prisma interactive transaction to ensure atomicity:

```typescript
async function deductCredits(userId: string, amount: number, description: string) {
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({ where: { id: userId } });
    if (!user || user.credits < amount) {
      throw new Error("Insufficient credits");
    }
    await tx.user.update({
      where: { id: userId },
      data: { credits: { decrement: amount } },
    });
    await tx.transaction.create({
      data: { userId, amount: -amount, type: "USAGE", description },
    });
  });
}
```

### Credit Packages (via Razorpay)

Users can purchase credit bundles. Package details (amounts, prices) are configurable in the dashboard page.

---

## 15. Payment Integration (Razorpay)

### Flow

1. User selects a credit package on the Dashboard.
2. Client calls `POST /api/razorpay/create-order` → receives Razorpay `order_id`.
3. Razorpay checkout modal opens in the browser (Razorpay JS SDK).
4. User completes payment → Razorpay sends `payment_id` and `signature` to client.
5. Client calls `POST /api/razorpay/verify` with payment details.
6. Server verifies HMAC signature using `RAZORPAY_KEY_SECRET`.
7. On success: credits are added to the user's account + a `PURCHASE` Transaction is recorded.

### Environment Variables Required

```env
RAZORPAY_KEY_ID="rzp_live_xxx"
RAZORPAY_KEY_SECRET="xxx"
```

---

## 16. Caching Strategy

The application uses three layers of caching:

### 1. LRU Cache (In-Memory, `lru-cache`)

- **Scope**: Single server instance (not distributed).
- **Used for**: Semantic prompt caching in the AI module.
- **Config**: 500 entries, 1-hour TTL.

### 2. Redis (`ioredis`)

File: `src/lib/redis.ts`

- **Scope**: Distributed (shared across all server instances).
- **Used for**: Session-level caching, high-frequency prompt results.
- **Config**: Reads `REDIS_URL` from environment. Gracefully disabled if `REDIS_URL` is not set.

### 3. Next.js Cache (`unstable_cache`)

- **Scope**: Per-deployment (invalidated on redeploy).
- **Used for**: Resume list fetches, template configuration lookups.

---

## 17. Security

### HTTP Security Headers

Configured in `next.config.ts` and applied to all responses:

| Header | Value | Protection |
|--------|-------|-----------|
| `X-Frame-Options` | `DENY` | Clickjacking prevention |
| `X-Content-Type-Options` | `nosniff` | MIME-type sniffing prevention |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Referrer leakage prevention |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains` | Enforce HTTPS (HSTS) |
| `X-XSS-Protection` | `1; mode=block` | XSS filter (legacy browsers) |

### Input Validation

All API route inputs are validated with **Zod schemas** before processing.

### Password Security

- Passwords are hashed with **bcryptjs** (adaptive cost factor).
- Plaintext passwords are never stored or logged.

### Prompt Injection Protection

The AI chatbot system prompt includes explicit rules:
- The AI must refuse any instruction to ignore previous instructions.
- The AI must refuse to output code, system commands, or non-career content.
- Role is locked to "career counselor only".

### Credit Atomicity

All credit deductions use Prisma **interactive transactions** to prevent race conditions (double-spend attacks).

### CSRF

Next.js built-in CSRF token via the NextAuth session cookie (`httpOnly`, `sameSite=lax`).

---

## 18. Configuration Files

### `next.config.ts`

- Enables the **React Compiler** (experimental Babel plugin).
- Sets **security HTTP headers** on all routes.
- Configures `images.remotePatterns` for trusted avatar domains (Google, GitHub).
- Enables **Turbopack** in development.

### `tsconfig.json`

- Target: `ES2017`
- `strict: true` — all strict TypeScript checks enabled.
- `paths`: `@/*` maps to `src/*` for clean imports.
- `moduleResolution: bundler`

### `tailwind.config.js`

- Tailwind CSS v4 configuration.
- Extends the default theme with custom colors and border radii.
- Includes `tailwindcss-animate` plugin for animation utilities.

### `eslint.config.mjs`

- ESLint v9 flat config.
- Extends `@next/core-web-vitals` and `@next/typescript` rule sets.
- Configured to lint files in `src/`.

### `prisma/schema.prisma`

- `provider: "prisma-client-js"` — generates a typed Prisma client.
- `datasource db: provider: "postgresql"` — reads `DATABASE_URL` from environment.
- Contains all 6 models: `User`, `Account`, `Session`, `VerificationToken`, `Transaction`, `Resume`, `AtsScore`.

### `components.json`

Shadcn/UI manifest that configures:
- Style: `default`
- Tailwind config path
- Component output directory (`src/components/ui/`)
- Import alias (`@/components`, `@/lib`)

### `.github/workflows/ci.yml`

GitHub Actions pipeline triggered on `push` and `pull_request` to `main`:

1. `npm ci` — clean dependency installation.
2. `npm run lint` — ESLint check.
3. `npx tsc --noEmit` — TypeScript type-check.
4. `npm run build` — Production build.

---

## 19. Environment Variables Reference

Create a `.env.local` file at the repo root with the following variables:

### Required

| Variable | Example | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `postgresql://user:pass@host:5432/db` | PostgreSQL connection string |
| `NEXTAUTH_URL` | `http://localhost:3000` | Base URL of the app (used by NextAuth for callbacks) |
| `NEXTAUTH_SECRET` | `a-random-32-char-string` | Secret used to sign JWT tokens (min 32 chars) |

### AI Providers (at least one required)

| Variable | Description |
|----------|-------------|
| `XAI_API_KEY` | xAI (Grok) API key |
| `GROQ_API_KEY` | Groq API key (free: 14,400 req/day) |
| `CEREBRAS_API_KEY` | Cerebras API key (free: 30 req/min) |
| `GOOGLE_AI_KEY` | Google Gemini API key (free: 1,500 req/day) |
| `OPENROUTER_API_KEY` | OpenRouter API key (free models available) |
| `AI_MODEL` | Default model for OpenRouter (default: `meta-llama/llama-3.3-70b-instruct:free`) |

### OAuth Providers (optional)

| Variable | Description |
|----------|-------------|
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Client Secret |
| `GITHUB_CLIENT_ID` | GitHub OAuth App Client ID |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth App Client Secret |
| `LINKEDIN_CLIENT_ID` | LinkedIn OAuth App Client ID |
| `LINKEDIN_CLIENT_SECRET` | LinkedIn OAuth App Client Secret |

### Payments (required for credit purchases)

| Variable | Description |
|----------|-------------|
| `RAZORPAY_KEY_ID` | Razorpay API Key ID (starts with `rzp_`) |
| `RAZORPAY_KEY_SECRET` | Razorpay API Key Secret |

### Database / SSL (optional)

| Variable | Description |
|----------|-------------|
| `DATABASE_CA_CERT` | Path to CA certificate file for SSL database connections |

### Caching (optional)

| Variable | Example | Description |
|----------|---------|-------------|
| `REDIS_URL` | `redis://localhost:6379` | Redis connection string; caching is disabled if not set |

---

## 20. Setup & Installation

### Prerequisites

| Requirement | Version |
|------------|---------|
| Node.js | v20 or higher |
| npm | v10 or higher |
| PostgreSQL | v14 or higher |
| Redis | v7+ (optional) |

### Step-by-Step Setup

```bash
# 1. Clone the repository
git clone https://github.com/DeepStacker/ResumeAI.git
cd ResumeAI

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.example .env.local   # or create .env.local manually
# Edit .env.local with your database, AI keys, and other credentials

# 4. Set up the database
npx prisma generate          # Generate the Prisma client
npx prisma db push           # Push schema to your PostgreSQL database

# 5. (Optional) Seed test data
npx prisma db seed

# 6. Start the development server
npm run dev
```

The application will be available at **http://localhost:3000**.

---

## 21. Development Workflow

### Running the Development Server

```bash
npm run dev
```

- Uses **Turbopack** for fast hot module replacement.
- Watches all files in `src/` for changes.
- Runs at `http://localhost:3000`.

### Making Code Changes

1. **Frontend components**: Edit files in `src/components/` or `src/app/`. Changes appear instantly via HMR.
2. **API routes**: Edit files in `src/app/api/`. Server components auto-refresh.
3. **Database schema**: Edit `prisma/schema.prisma` → run `npx prisma db push` → run `npx prisma generate`.
4. **Type definitions**: Edit `src/types/resume.ts` — TypeScript will surface any type errors immediately.

### Code Style

- **TypeScript**: Strict mode enforced. All new code must be fully typed.
- **ESLint**: Run `npm run lint` before committing.
- **Formatting**: Follow existing code style (2-space indentation, single quotes in most files).

### Adding a New Resume Template

1. Create a new file `src/components/templates/MyTemplate.tsx`.
2. Implement the `TemplateProps` interface:
   ```tsx
   import { ResumeData } from "@/types/resume";
   interface Props { data: ResumeData; isPrinting?: boolean; }
   export default function MyTemplate({ data }: Props) { ... }
   ```
3. Add the template name to the `ResumeTemplate` union type in `src/types/resume.ts`.
4. Register the template in `ResumePreview.tsx`'s template switcher.
5. Add a display name and preview thumbnail in the Dashboard template browser.

### Adding a New API Endpoint

1. Create `src/app/api/<endpoint-name>/route.ts`.
2. Export named handler functions (`GET`, `POST`, `PUT`, `DELETE`).
3. Add session check and input validation:
   ```typescript
   export async function POST(req: Request) {
     const session = await getServerSession(authOptions);
     if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
     // ... validate body with Zod, deduct credits if applicable, call AI, return response
   }
   ```

---

## 22. Building & Deploying for Production

### Local Production Build

```bash
npm run build    # Runs type-check, then Next.js production build
npm start        # Starts the compiled Next.js server
```

### Deploying to Vercel (Recommended)

1. Connect the GitHub repository to a Vercel project.
2. Set all environment variables in the Vercel dashboard (`Settings > Environment Variables`).
3. Vercel automatically builds and deploys on every push to `main`.

### Database Migrations in Production

```bash
# Apply pending migrations
npx prisma migrate deploy

# Or push schema without migration history (use carefully)
npx prisma db push
```

### Environment Setup Checklist for Production

- [ ] `DATABASE_URL` points to a production PostgreSQL instance.
- [ ] `NEXTAUTH_SECRET` is a strong random 32+ character string.
- [ ] `NEXTAUTH_URL` matches the deployed domain (e.g., `https://resumeai.example.com`).
- [ ] At least one AI provider API key is configured.
- [ ] Razorpay keys set to **live** mode (`rzp_live_*`).
- [ ] Redis configured if horizontal scaling is needed.
- [ ] SSL/TLS configured on the database (use `DATABASE_CA_CERT` if required).

---

## 23. CI/CD Pipeline

File: `.github/workflows/ci.yml`

The pipeline runs automatically on every `push` to `main` and every `pull_request`.

### Pipeline Steps

| Step | Command | Purpose |
|------|---------|---------|
| Checkout | `actions/checkout` | Clone repository |
| Setup Node | `actions/setup-node@v4` (Node 20) | Install Node.js |
| Install deps | `npm ci` | Clean, reproducible install |
| Lint | `npm run lint` | ESLint check |
| Type-check | `npx tsc --noEmit` | TypeScript type safety |
| Build | `npm run build` | Ensure production build succeeds |

### Status Badge

The CI status badge is visible in the README. A failing build blocks merging of pull requests (when branch protection rules are enabled).

---

## 24. Useful Commands & Scripts

### Development

```bash
npm run dev              # Start development server (Turbopack)
npm run build            # Production build
npm start                # Start production server
npm run lint             # Run ESLint
npx tsc --noEmit         # Type-check only
```

### Database (Prisma)

```bash
npx prisma generate      # Regenerate Prisma client after schema changes
npx prisma db push       # Sync schema to database (dev)
npx prisma migrate dev --name <name>   # Create a new named migration
npx prisma migrate deploy              # Apply migrations in production
npx prisma studio        # Open Prisma Studio GUI (database browser)
npx prisma db seed       # Seed the database with test data
npx prisma db push --force-reset       # Reset & re-push schema (destroys all data)
```

### Utilities

```bash
npm run postinstall      # Run after npm install: generates Prisma client
node scripts/setup.js    # Run environment validation script
npm audit                # Check for dependency vulnerabilities
npm ls                   # List installed packages
```

---

*This documentation was generated for the **ORBITAL SYSTEMS (ResumeAI)** project.*  
*License: MIT | Developed by the DeepStacker team.*
