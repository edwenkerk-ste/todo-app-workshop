# Gap Plan: Score High (180–200 / 200)

This plan closes the **remaining gaps** so the Todo App reaches **180–200** on [EVALUATION.md](../EVALUATION.md). Feature implementation is **complete (110/110)**; the gap is **Testing (30), Deployment (30), and Quality & Performance (30)**.

---

## Current vs Target

| Category              | Max | Current (est.) | Target | Gap focus                          |
|-----------------------|-----|----------------|--------|------------------------------------|
| Feature Completeness  | 110 | 110            | 110    | None                               |
| Testing Coverage      | 30  | ~10–15        | 25–30  | E2E suite + helpers + unit gaps   |
| Deployment            | 30  | ~5–10         | 25–30  | Deploy + prod verification + docs |
| Quality & Performance | 30  | ~15–20        | 25–30  | A11y, perf, security checks       |

**Goal:** 180–200 (Excellent). Follow this plan in order; each section maps to EVALUATION.md.

---

## 1. E2E Tests (Testing — 15 pts)

### 1.1 Infrastructure (do first)

- [ ] **`tests/helpers.ts`**  
  Reusable helpers used across E2E specs, e.g.:
  - `createTodo(page, { title, priority?, due_date?, ... })`
  - `addSubtask(page, todoId, title)` or via API
  - `createTag(page, { name, color })`
  - `loginWithPasskey(page, username)` (or seed session) for auth tests
  - `clearAllTodos(page)` (already in export-import.spec.ts — extract)
- [ ] **Playwright config**
  - Set **timezone** to `Asia/Singapore` (e.g. `timezone: 'Asia/Singapore'` in project).
  - Configure **virtual authenticator** for WebAuthn (see Playwright docs for CDP/custom setup) so auth E2E can run without a real device.
- [ ] **Base URL / auth**  
  Ensure E2E can hit the app (e.g. `baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000'`). If all routes are protected, helpers must create a session or use a test user (e.g. API-based session cookie or virtual passkey).

### 1.2 Feature E2E specs (EVALUATION.md “Testing” checkboxes)

Create one spec file per feature (or group small ones). Map each to the exact E2E items in EVALUATION.md.

| # | Spec file | Test cases to add (from EVALUATION.md) |
|---|-----------|----------------------------------------|
| 01 | `tests/e2e/todo-crud.spec.ts` | Create todo (title only + all metadata), Edit todo, Toggle completion, Delete todo, Past due date validation |
| 02 | `tests/e2e/priority.spec.ts` | Create with each priority, Edit priority, Filter by priority, Verify sorting (high→medium→low) |
| 03 | `tests/e2e/recurring.spec.ts` | Create daily/weekly recurring, Complete creates next instance, Next due date, Next instance inherits metadata |
| 04 | `tests/e2e/reminders.spec.ts` | Set reminder on todo, Reminder badge displays, API returns todos needing notification |
| 05 | `tests/e2e/subtasks.spec.ts` | Expand subtasks, Add multiple subtasks, Toggle subtask completion, Progress bar updates, Delete subtask, Delete todo cascades to subtasks |
| 06 | `tests/e2e/tags.spec.ts` | Create tag, Edit tag name/color, Delete tag, Assign multiple tags to todo, Filter by tag, Duplicate tag name validation |
| 07 | `tests/e2e/templates.spec.ts` | Save todo as template, Create todo from template, Template preserves settings, Subtasks from template, Edit template, Delete template |
| 08 | `tests/e2e/search-filter.spec.ts` | Search by title, Search by tag name, Filter by priority, Filter by tag, Combine filters, Clear filters |
| 09 | ✅ `tests/e2e/export-import.spec.ts` | Already done |
| 10 | ✅ `tests/e2e/calendar.spec.ts` | Already done; tick EVALUATION.md when verified |
| 11 | `tests/e2e/auth.spec.ts` | Register (virtual authenticator), Login, Logout, Protected route redirects unauthenticated, Login page redirects when authenticated |

- [ ] Implement each spec so the corresponding EVALUATION.md “E2E test: …” items can be checked.
- [ ] Run **3 consecutive full E2E runs** with no flake; then mark “Tests pass consistently” in EVALUATION.md.

---

## 2. Unit Tests (Testing — 10 pts)

- [ ] **DB CRUD**  
  Covered in existing tests; ensure all public DB helpers used by API routes have at least one test (create/read/update/delete paths).
- [ ] **Date/time (Singapore)**  
  Already have `lib/timezone.ts`, `lib/reminders.ts`, recurrence logic; ensure unit tests for due-date validation and reminder/next-due calculations use Singapore timezone.
- [ ] **Progress calculation**  
  `lib/progress.ts` — unit test for `calculateProgress` (0%, 50%, 100%, empty list).
- [ ] **ID remapping**  
  Export/import ID remapping already tested; keep and ensure no regressions.
- [ ] **Validation**  
  `lib/validation.ts` — unit tests for create/update todo schemas, tag schema, and any reminder/recurrence rules.
- [ ] **Utilities**  
  Any other pure functions in `lib/` (e.g. priority normalization, reminder labels) should have tests.
- [ ] **Coverage**  
  Aim **> 80%** for “Excellent” (e.g. `vitest run --coverage`); add tests where coverage is low.

---

## 3. Manual Testing & Docs (Testing — 5 pts, Deployment — 5 pts)

- [ ] **Manual test checklist**  
  Document in README or `docs/MANUAL-TESTING.md`: enable notifications (browser permission), receive notification at correct time, cross-browser (Chrome, Firefox, Safari), WebAuthn on production.
- [ ] **README**  
  Deployment instructions (Railway preferred), link to `.env.example`, list env vars (JWT_SECRET, RP_ID, RP_NAME, RP_ORIGIN), known issues if any.

---

## 4. Deployment (Deployment — 15 + 5 pts)

- [ ] **Deploy to Railway** (or Vercel if acceptable; Railway recommended for SQLite persistence).
  - Use [RAILWAY_DEPLOYMENT.md](../RAILWAY_DEPLOYMENT.md) if present; set `JWT_SECRET`, `RP_ID`, `RP_NAME`, `RP_ORIGIN` for production URL.
  - If Railway: configure **volume** for SQLite DB so data persists across deploys.
- [ ] **Post-deployment verification**  
  Complete “Post-Deployment Verification” and “Vercel/Railway” checklists in EVALUATION.md (app loads, WebAuthn register/login, API works, DB persists, timezone, HTTPS, no console errors).
- [ ] **Env (5 pts)**  
  Already have `.env.example`; ensure production env vars are documented and set in the deployment platform.

---

## 5. Quality & Performance (30 pts)

### 5.1 Code quality (10 pts)

- [ ] **ESLint**  
  `npm run lint` passes.
- [ ] **TypeScript**  
  Strict mode; `npx tsc --noEmit` (or build) passes with no errors.
- [ ] **No `console.error` in production paths**  
  Replace with proper logging or remove; avoid leaking stack traces to clients.
- [ ] **API routes**  
  Consistent error handling (try/catch, 4xx/5xx responses) and validation (e.g. Zod) on inputs.
- [ ] **Loading states**  
  All async UI (create/edit/delete todo, tags, templates, import/export) shows loading/disabled state where appropriate.

### 5.2 Performance (10 pts)

- [ ] **Frontend**  
  Page load < 2s, TTI < 3s, FCP < 1s; todo operations < 500ms; search/filter < 100ms (debounce 300ms already in place).
- [ ] **Backend**  
  API responses < 300ms average; use indexes (e.g. `user_id`, `due_date`, FKs); prepared statements only; no N+1.
- [ ] **Lighthouse**  
  Run Lighthouse on production URL; fix critical perf issues. For “Excellent”, aim Lighthouse > 90 all categories.

### 5.3 Accessibility (5 pts)

- [ ] **WCAG AA**  
  Contrast ratios for text and controls (including priority badges in light/dark).
- [ ] **Keyboard**  
  All actions (create, edit, delete, filter, modals) reachable and usable via keyboard.
- [ ] **Screen reader**  
  Labels on buttons/inputs (e.g. “Filter by priority”, “Add todo”); ARIA where needed (modals, live regions).
- [ ] **Focus**  
  Visible focus indicators; focus trapped in modals.
- [ ] **Lighthouse a11y**  
  Score > 90.

### 5.4 Security (5 pts)

- [ ] **Cookies**  
  Session cookie: HTTP-only, Secure in production, SameSite (e.g. Lax).
- [ ] **Secrets**  
  No JWT_SECRET or credentials in logs or client bundle.
- [ ] **SQL**  
  Prepared statements only (already using better-sqlite3 prepared statements).
- [ ] **CORS / XSS**  
  CORS configured for production origin; React escaping; no `dangerouslySetInnerHTML` with user input.

---

## 6. Optional for “Excellent” (180–200)

- [ ] **Error boundaries**  
  At least one React error boundary so a component error doesn’t white-screen the app.
- [ ] **404 / 500 pages**  
  Custom not-found and error pages.
- [ ] **Code coverage > 80%**  
  Vitest coverage report; add unit tests where needed.
- [ ] **Lighthouse > 90**  
  All categories (perf, a11y, best practices, SEO if applicable).
- [ ] **Sub-second API**  
  Optimize slow endpoints (indexes, reduce work per request).

---

## Execution Order

1. **E2E infrastructure** — `tests/helpers.ts`, Playwright timezone (and virtual authenticator if doing auth E2E).
2. **E2E specs** — One by one: todo-crud → priority → recurring → reminders → subtasks → tags → templates → search-filter → auth. Run after each and fix flakiness.
3. **Unit tests** — Fill gaps (DB, date/time, progress, validation, utilities); run coverage.
4. **Deployment** — Deploy to Railway (or Vercel), set env, verify persistence and WebAuthn.
5. **Quality** — Lint, TypeScript, no console.error, error handling, loading states.
6. **Performance & a11y** — Lighthouse, indexes, keyboard/screen reader, contrast.
7. **Docs** — README deployment + manual test notes; tick EVALUATION.md.

---

## References

- [EVALUATION.md](../EVALUATION.md) — All checklists and scoring.
- [plan/PRP-IMPLEMENTATION-PLAN.md](PRP-IMPLEMENTATION-PLAN.md) — Phased feature roadmap and score-maximization checklist.
- [.github/copilot-instructions.md](../.github/copilot-instructions.md) — Project patterns and test conventions.
