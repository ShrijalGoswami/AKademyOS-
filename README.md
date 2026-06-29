# 🎓 AKademy OS

> Internal platform for managing and visualizing student assessment scores.  
> Built and maintained by the AKademy engineering team.

![Version](https://img.shields.io/badge/version-3.0.0-3B82F6?style=for-the-badge)
![Next.js](https://img.shields.io/badge/Next.js_14-000000?style=for-the-badge&logo=next.js&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript_5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Private](https://img.shields.io/badge/repo-private-red?style=for-the-badge)

---

> ⚠️ **This is a private internal repository.**  
> Do not share, distribute, or expose any part of this codebase or its credentials outside the organisation.

---

## 📌 Overview

AKademy OS is the company's internal educational management platform, split into two layers:

| Layer | Access | Purpose |
|-------|--------|---------|
| **Student Dashboard** | Enrolled Gmail (Google OAuth) | View personal scores, study resources & AI tutor |
| **Admin Dashboard** | Admin Gmail | Import scores from Google Sheets, publish to students |

Students log in with their **enrolled Gmail account**. Their email is matched against the database and the linked Google Spreadsheets automatically — no manual score mapping needed.

---

## ✅ Current Status — v3.0.0

The platform is **fully production-ready**. All core features are implemented, TypeScript build is clean (zero errors), Row-Level Security is enforced on all tables, and all data pipelines work end-to-end.

---

## 🎯 Features

### 🧑‍🎓 Student Dashboard
- **Google OAuth Login** — only enrolled Gmail accounts get access
- **Tab-close session expiry** — session ends automatically when the tab is closed
- **3 switchable score chart views:**
  - 📚 **Homework** — 10 weeks × 3 bars (MCQ, Short Answer, Long Answer)
  - 📝 **Offline Tests** — Week 1, Week 5 & Week 10 (1 bar each)
  - ⚡ **Quiz** — dynamic weekly quiz scores
- **Progress trend line chart** — score trajectory over time
- **Score summary table** — detailed breakdown per category
- **Google Drive resource browser** — access study materials uploaded by admin
- **Ask AK** — AI tutor chat with Markdown + LaTeX rendering

### 🛠️ Admin Dashboard
- **Google Sheets import** — fetch → preview → validate → save → publish
- **4 sheet types supported:** Homework, Offline Test, Quiz, Student Roster
- **Smart parsing** — handles date-mangled values, n/a scores, multi-sheet workbooks, WEEK N headers
- **Email validation** — flags unrecognised student emails before saving
- **Per-student detail view** — all score types, published and unpublished
- **Import audit logs** — every import tracked with timestamp, row counts, and errors
- **Class progress chart** — aggregate score view across all students

---

## 🧱 Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript 5 (strict mode) |
| Styling | Tailwind CSS + Radix UI |
| Charts | Recharts 3.8 |
| Auth | NextAuth.js v4 (Google OAuth, JWT) |
| Database | Supabase PostgreSQL + RLS |
| Spreadsheet | Google Sheets API v4 |
| Storage | Google Drive API |
| AI Tutor | External hosted agent via `/api/ask` |

---

## 🗃️ Database Schema

```
profiles            → enrolled users (id, email, full_name, role, created_at)
homework_scores     → week 1–10, MCQ + Short + Long scores, published flag
offline_test_scores → week 1, 5, 10 only, score + subject + topic, published flag
quiz_scores         → flexible weekly quiz scores, published flag
import_logs         → full audit trail of every Sheets import (admin-only)
```

**Security:**
- Row-Level Security enabled on all tables
- Students see only their own rows where `published = true`
- Admins have full access across all tables
- `prevent_role_change()` trigger blocks privilege escalation
- `handle_new_user()` trigger auto-creates profile on first login

---

## 📊 Google Sheets Format

Each score type uses its own spreadsheet. Share each sheet with the **Google Service Account email** (Viewer access only).

### Homework Sheet
| email | week | mcq_score | mcq_max | short_answer_score | short_answer_max | long_answer_score | long_answer_max |
|-------|------|-----------|---------|-------------------|-----------------|------------------|----------------|
| student@gmail.com | 1 | 85 | 100 | 70 | 100 | 90 | 100 |

> Weeks 1–10. All 3 score columns required per row.

### Offline Test Sheet
| email | week | score | max_score |
|-------|------|-------|-----------|
| student@gmail.com | 1 | 78 | 100 |

> `week` must be `1`, `5`, or `10` only.

### Quiz Sheet
| email | week | quiz_title | score | max_score |
|-------|------|-----------|-------|-----------|
| student@gmail.com | 3 | Chapter 3 Quiz | 92 | 100 |

---

## ⚙️ Local Setup (Internal Team Only)

### Prerequisites
- Node.js 18+
- Access to the company Supabase project
- Access to the company Google Cloud project
- `.env.local` file — request from the tech lead (never share this file)

### 1. Clone the repo
```bash
git clone git@github.com:YOUR_ORG/akademy-os.git
cd akademy-os/frontend
```

### 2. Install dependencies
```bash
npm install
```

### 3. Set up environment variables
```bash
cp .env.example .env.local
# Fill in credentials — obtain from tech lead
```

### 4. Run migrations

Run files from `supabase/migrations/` in your Supabase SQL editor in this order:

```
1. 004_score_tables.sql        ← run this FIRST (ignore filename sort order)
2. 20260624_..._offline.sql
3. 20260627_..._homework.sql
4. remaining files in timestamp order
```

### 5. Run the development server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 🔐 Authentication Flow

```
Student clicks "Login with Google"
          ↓
    Google OAuth (NextAuth.js)
          ↓
  Email checked against profiles table
          ↓
  ┌──────────────────────────────────────┐
  │ Not enrolled? → /auth/error          │
  │ role = student → /dashboard/student  │
  │ role = admin   → /dashboard/admin    │
  └──────────────────────────────────────┘
          ↓
  Tab closed → session expires automatically
```

---

## 📁 Project Structure

```
frontend/
├── app/
│   ├── page.tsx                             # Landing page
│   ├── auth/error/page.tsx                  # Access denied page
│   ├── dashboard/
│   │   ├── layout.tsx                       # Sidebar + session guard
│   │   ├── student/
│   │   │   ├── page.tsx                     # Student dashboard
│   │   │   ├── ask-ak/page.tsx              # AI tutor chat
│   │   │   └── resources/page.tsx           # Google Drive browser
│   │   └── admin/
│   │       ├── page.tsx                     # Admin overview
│   │       ├── import/[type]/page.tsx       # Import detail
│   │       └── students/[email]/page.tsx    # Per-student detail
│   └── api/
│       ├── auth/[...nextauth]/route.ts      # NextAuth handler
│       ├── admin/import/[type]/route.ts     # Sheets → DB import
│       ├── admin/publish/[type]/route.ts    # Publish scores
│       ├── admin/students/route.ts          # Student list
│       ├── ask/route.ts                     # AI tutor proxy
│       ├── student/scores/route.ts          # Student scores
│       └── student/resources/route.ts       # Drive resources
├── components/
│   ├── admin/          # AdminHeader, ImportLogsTable, SheetPreviewTable,
│   │                   # StudentManagementTable, ClassProgressChart
│   ├── charts/         # HomeworkBarChart, OfflineTestBarChart, QuizBarChart
│   ├── dashboard/      # StudentHeader, ScoreGraphTabs, ScoreSummaryTable,
│   │                   # ProgressTrendChart, QuickActions
│   ├── layout/         # Sidebar, SidebarContext, SidebarToggle
│   ├── shared/         # LoginButton, LoadingSpinner, Providers, SessionGuard
│   ├── ask-ak/         # AskAK (chat UI with Markdown + LaTeX)
│   └── ui/             # Radix UI primitives
├── lib/
│   ├── sheets.ts       # Google Sheets parser (all 4 sheet types)
│   ├── drive.ts        # Google Drive browser with ancestry validation
│   ├── supabase/       # Browser, server, and admin Supabase clients
│   └── auth.ts         # NextAuth config (callbacks, session strategy)
└── types/index.ts      # All TypeScript types and interfaces
```

---

## 🌍 Environment Variables

Request `.env.local` from the tech lead. Never commit it, share it, or screenshare it.

| Variable | Purpose |
|----------|---------|
| `NEXTAUTH_URL` | App base URL |
| `NEXTAUTH_SECRET` | JWT signing secret |
| `GOOGLE_CLIENT_ID/SECRET` | OAuth credentials |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only admin DB access |
| `GOOGLE_SHEETS_CLIENT_EMAIL` | Service account email |
| `GOOGLE_SHEETS_PRIVATE_KEY` | Service account private key |
| `GOOGLE_SHEETS_HOMEWORK_SPREADSHEET_ID` | Homework sheet |
| `GOOGLE_SHEETS_OFFLINE_TEST_SPREADSHEET_ID` | Offline test sheet |
| `GOOGLE_SHEETS_QUIZ_SPREADSHEET_ID` | Quiz sheet |
| `GOOGLE_DRIVE_RESOURCES_FOLDER_ID` | Drive resources folder |
| `TUTOR_AGENT_URL` | External AI tutor endpoint |
| `TUTOR_SERVICE_KEY` | AI tutor auth key |

> 🔴 If `.env.local` has ever been shared or screenshared, rotate all keys immediately.

---

## 🗺️ Roadmap

**v3.x — Housekeeping**
- [ ] Add unique constraint to `quiz_scores`
- [ ] Delete `scratch_inspect_all_offline.js`
- [ ] Remove committed `backend/venv/`
- [ ] Rename `004_score_tables.sql` to timestamp convention
- [ ] Add `GOOGLE_DRIVE_RESOURCES_FOLDER_ID` to `.env.example`
- [ ] Wire topbar search box
- [ ] Re-enable ESLint in builds

**v4.0 — Planned Features**
- [ ] Remove or rebuild FastAPI `backend/` skeleton
- [ ] Parent & Teacher role dashboards
- [ ] Email notifications when scores are published
- [ ] PDF score export for students

---

## 🔒 Security & Confidentiality

- This repository is **private**. Do not fork, clone to personal machines, or share externally.
- All credentials live in `.env.local` — never in version control.
- The Supabase service-role key must only ever appear in server-side code.
- Report any security concerns directly to the tech lead.

---

<p align="center">© AKademy — Internal use only</p>
