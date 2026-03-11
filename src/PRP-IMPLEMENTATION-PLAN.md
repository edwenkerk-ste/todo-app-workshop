# PRP Implementation Plan

This plan is derived from **[PRPs/README.md](../PRPs/README.md)** and aligned with **[EVALUATION.md](../EVALUATION.md)** so implementation scores as high as possible on the 200-point evaluation.

---

## Evaluation Scoring (Target: 180–200 / 200)

| Category | Max | How to maximize |
|----------|-----|------------------|
| **Feature Completeness** | 110 | Implement all 11 features fully (10 pts each); partial = 5 pts. Use EVALUATION.md per-feature checklists. |
| **Testing Coverage** | 30 | E2E (15) + Unit (10) + Manual (5). Per-feature E2E + unit tests; document manual checks. |
| **Deployment** | 30 | Deploy to Railway (15), env + docs (5+5), production verification (5). Prefer Railway for SQLite persistence. |
| **Quality & Performance** | 30 | Code quality (10), performance (10), accessibility (5), security (5). Hit targets below. |

**Rating goal:** 180–200 = Excellent (production ready, exceeds expectations).

---

## Score-Maximization Checklist

### Feature Completeness (110 pts)
- [ ] **01–11**: Each feature has all items in EVALUATION.md "Implementation Checklist" and "Acceptance Criteria" done.
- [ ] Use EVALUATION.md section "Core Features Evaluation" as the source of truth; tick off each checkbox as you implement.
- [ ] Partial implementation = 5 pts per feature; full = 10. Aim for full on every feature.

### Testing (30 pts)
- [ ] **E2E (15 pts):** All test cases listed under each feature in EVALUATION.md "Testing" implemented; `tests/helpers.ts`; virtual authenticator; Singapore timezone in Playwright config; tests pass 3 consecutive runs.
- [ ] **Unit (10 pts):** DB CRUD, date/time (Singapore), progress calculation, ID remapping, validation, utilities covered.
- [ ] **Manual (5 pts):** Document manual checks (notifications, browser permission, cross-browser) per EVALUATION.md.

### Deployment (30 pts)
- [ ] **Deploy (15 pts):** Successfully deployed (Railway recommended for SQLite; see [RAILWAY_DEPLOYMENT.md](../RAILWAY_DEPLOYMENT.md)).
- [ ] **Env (5 pts):** `.env.example`, JWT_SECRET, RP_ID, RP_NAME, RP_ORIGIN documented and set.
- [ ] **Prod testing (5 pts):** Post-deployment verification in EVALUATION.md completed.
- [ ] **Docs (5 pts):** README deployment instructions, env vars, known issues.

### Quality & Performance (30 pts)
- [ ] **Code (10 pts):** ESLint passing, TypeScript strict, no TS errors, no console.errors in prod, error handling in API routes, loading states.
- [ ] **Performance (10 pts):** Page load <2s, TTI <3s, FCP <1s, todo ops <500ms, search/filter <100ms, API <300ms, indexes on FKs and `due_date`, debounce 300ms.
- [ ] **Accessibility (5 pts):** WCAG AA contrast, keyboard nav, screen reader labels, focus indicators, Lighthouse a11y >90.
- [ ] **Security (5 pts):** HTTP-only + Secure cookies, SameSite, no secrets in logs, prepared statements, CORS, XSS prevention.

---

## Overview

| # | PRP | Focus | Eval checklist |
|---|-----|--------|----------------|
| 01 | [Todo CRUD Operations](../PRPs/01-todo-crud-operations.md) | Create, read, update, delete; Singapore TZ; validation; optimistic UI | [EVALUATION.md § Feature 01](../EVALUATION.md#-feature-01-todo-crud-operations) |
| 02 | [Priority System](../PRPs/02-priority-system.md) | High/Medium/Low; badges; sorting; filtering | [EVALUATION.md § Feature 02](../EVALUATION.md#-feature-02-priority-system) |
| 03 | [Recurring Todos](../PRPs/03-recurring-todos.md) | Daily/weekly/monthly/yearly; next instance; due date logic | [EVALUATION.md § Feature 03](../EVALUATION.md#-feature-03-recurring-todos) |
| 04 | [Reminders & Notifications](../PRPs/04-reminders-notifications.md) | Browser notifications; timing; polling; duplicate prevention | [EVALUATION.md § Feature 04](../EVALUATION.md#-feature-04-reminders--notifications) |
| 05 | [Subtasks & Progress](../PRPs/05-subtasks-progress.md) | Checklists; progress bars; position; cascade delete | [EVALUATION.md § Feature 05](../EVALUATION.md#-feature-05-subtasks--progress-tracking) |
| 06 | [Tag System](../PRPs/06-tag-system.md) | Labels; many-to-many; tag CRUD; filter by tag | [EVALUATION.md § Feature 06](../EVALUATION.md#-feature-06-tag-system) |
| 07 | [Template System](../PRPs/07-template-system.md) | Save/reuse patterns; subtasks JSON; due offsets; categories | [EVALUATION.md § Feature 07](../EVALUATION.md#-feature-07-template-system) |
| 08 | [Search & Filtering](../PRPs/08-search-filtering.md) | Real-time search; advanced search; multi-criteria; client perf | [EVALUATION.md § Feature 08](../EVALUATION.md#-feature-08-search--filtering) |
| 09 | [Export & Import](../PRPs/09-export-import.md) | JSON backup; ID remapping; relationships; validation | [EVALUATION.md § Feature 09](../EVALUATION.md#-feature-09-export--import) |
| 10 | [Calendar View](../PRPs/10-calendar-view.md) | Monthly view; SG holidays; due-date visualization; navigation | [EVALUATION.md § Feature 10](../EVALUATION.md#-feature-10-calendar-view) |
| 11 | [WebAuthn Authentication](../PRPs/11-authentication-webauthn.md) | Passkeys; JWT sessions; route protection | [EVALUATION.md § Feature 11](../EVALUATION.md#-feature-11-authentication-webauthn) |

> **Note:** If a linked PRP file is missing, implement from the README and **EVALUATION.md** per-feature checklists.

---

## Dependency Graph

```
Todo CRUD (01) ──► Priority (02), Recurring (03), Subtasks (05), Tags (06)
Tags (06) ──► Search/Filtering (08)
Subtasks (05) ──► Templates (07)
Todos (01) ──► Export/Import (09), Calendar (10)
Authentication (11) ──► All features (production; can be last)
```

**Rule of thumb:** Complete **01** first; **06** before **08**; **05** before **07**; **09** and **10** after stable CRUD.

---

## Phased Roadmap

Each phase: implement **all** items in EVALUATION.md for that feature (Implementation Checklist + Acceptance Criteria + Testing), then run E2E and mark verified.

### Phase 1 — Foundation
| Order | PRP | Deliverables | Eval |
|-------|-----|--------------|------|
| 1 | **01** Todo CRUD | CRUD API + UI, SG timezone, validation, optimistic updates, sections (Overdue/Active/Completed), delete cascade | [§ Feature 01](../EVALUATION.md#-feature-01-todo-crud-operations) |
| 2 | **02** Priority | 3 levels, badges (red/yellow/blue), sort, filter, dark mode, WCAG AA | [§ Feature 02](../EVALUATION.md#-feature-02-priority-system) |

### Phase 2 — Core Features
| Order | PRP | Deliverables | Eval |
|-------|-----|--------------|------|
| 3 | **03** Recurring | Patterns, next instance, due date inheritance, 🔄 badge | [§ Feature 03](../EVALUATION.md#-feature-03-recurring-todos) |
| 4 | **04** Reminders | Notifications, 7 timing options, polling, `last_notification_sent`, 🔔 badge | [§ Feature 04](../EVALUATION.md#-feature-04-reminders--notifications) |
| 5 | **05** Subtasks | Checklists, progress bar (X/Y, %), ordering, cascade delete | [§ Feature 05](../EVALUATION.md#-feature-05-subtasks--progress-tracking) |

### Phase 3 — Organization
| Order | PRP | Deliverables | Eval |
|-------|-----|--------------|------|
| 6 | **06** Tags | Colors, M:N, tag CRUD, filter, Manage Tags modal | [§ Feature 06](../EVALUATION.md#-feature-06-tag-system) |
| 7 | **08** Search & Filter | Text + tag search, debounce 300ms, combined filters, perf <100ms for 1k todos | [§ Feature 08](../EVALUATION.md#-feature-08-search--filtering) |

### Phase 4 — Productivity
| Order | PRP | Deliverables | Eval |
|-------|-----|--------------|------|
| 8 | **07** Templates | Save/use template, subtasks JSON, due offset, categories | [§ Feature 07](../EVALUATION.md#-feature-07-template-system) |
| 9 | **09** Export/Import | JSON export/import, ID remapping, tag conflict resolution | [§ Feature 09](../EVALUATION.md#-feature-09-export--import) |
| 10 | **10** Calendar | Month view, Singapore holidays, day modal, URL `?month=` | [§ Feature 10](../EVALUATION.md#-feature-10-calendar-view) |

### Phase 5 — Infrastructure (parallel or last)
| Order | PRP | Deliverables | Eval |
|-------|-----|--------------|------|
| 11 | **11** WebAuthn | Register/login, JWT, middleware, HTTP-only cookie 7d | [§ Feature 11](../EVALUATION.md#-feature-11-authentication-webauthn) |

---

## Pre-Submit Verification (from EVALUATION.md)

Before final evaluation, confirm:

**MVP (minimum for 140+):**
- [ ] All 11 features implemented and working
- [ ] E2E tests passing (3 consecutive runs)
- [ ] Deployed to Railway (or Vercel) with HTTPS
- [ ] WebAuthn works on production domain
- [ ] Database persists (use Railway volumes for SQLite)
- [ ] No critical bugs

**Production ready (160+):**
- [ ] All MVP items
- [ ] Performance targets met (see Score-Maximization Checklist)
- [ ] Accessibility score > 90
- [ ] Security checklist complete (EVALUATION.md)
- [ ] Cross-browser tested
- [ ] Error boundaries, 404, 500 pages
- [ ] User docs updated

**Excellent (180–200):**
- [ ] All Production ready items
- [ ] Code coverage > 80%
- [ ] Lighthouse > 90 all categories
- [ ] Sub-second API response times
- [ ] Custom domain (optional)
- [ ] Monitoring/analytics (optional)

---

## Technical Stack (from PRPs)

| Area | Choice |
|------|--------|
| Framework | Next.js 16 (App Router) |
| Database | SQLite via `better-sqlite3` (sync API) |
| Auth | WebAuthn via `@simplewebauthn` |
| Timezone | Singapore (`Asia/Singapore`) — use `lib/timezone.ts` |
| E2E | Playwright |
| Styling | Tailwind CSS 4 |

---

## Per-PRP Workflow

For each feature:

1. Read the corresponding PRP (or this plan + [EVALUATION.md](../EVALUATION.md) if PRP file absent).
2. Follow **[.github/copilot-instructions.md](../.github/copilot-instructions.md)** for project patterns.
3. Align with **[USER_GUIDE.md](../USER_GUIDE.md)** for user-visible behavior.
4. Implement per PRP + **EVALUATION.md** Implementation Checklist and Acceptance Criteria for that feature.
5. Add E2E and unit tests per EVALUATION.md "Testing" for that feature.
6. Tick off EVALUATION.md checkboxes and run tests until verified.

**Copilot-style prompt:**

```text
I want to implement [feature name].
Here's the PRP: [paste PRP content]
Use EVALUATION.md [Feature 0X] checklist for implementation and tests.
Please implement following project patterns in copilot-instructions.md.
```

---

## PRP Document Structure (checklist)

When authoring or reviewing a PRP, ensure:

- [ ] Feature overview  
- [ ] User stories  
- [ ] User flow  
- [ ] Technical requirements (DB, API, types)  
- [ ] UI components  
- [ ] Edge cases  
- [ ] Acceptance criteria  
- [ ] Testing requirements  
- [ ] Out of scope  
- [ ] Success metrics  

---

## Related Docs

| Doc | Purpose |
|-----|---------|
| [EVALUATION.md](../EVALUATION.md) | **Scoring rubric, checklists, deployment verification** — use for max score |
| [PRPs/README.md](../PRPs/README.md) | Full PRP index and tips |
| [RAILWAY_DEPLOYMENT.md](../RAILWAY_DEPLOYMENT.md) | Railway deploy steps (recommended for SQLite) |
| [.github/copilot-instructions.md](../.github/copilot-instructions.md) | Repo-wide AI/dev patterns |
| [USER_GUIDE.md](../USER_GUIDE.md) | End-user documentation |
| [README.md](../README.md) | Setup and install |

---

**Source:** PRPs/README.md + EVALUATION.md — 11 PRPs, 200-point evaluation. Target: 180–200 (Excellent).
