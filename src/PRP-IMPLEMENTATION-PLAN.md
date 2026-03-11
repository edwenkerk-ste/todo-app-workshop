# PRP Implementation Plan

This plan is derived from **[PRPs/README.md](../PRPs/README.md)** — Product Requirement Prompts for the Todo App. Use it to sequence work, track dependencies, and onboard AI assistants.

---

## Overview

| # | PRP | Focus |
|---|-----|--------|
| 01 | [Todo CRUD Operations](../PRPs/01-todo-crud-operations.md) | Create, read, update, delete; Singapore TZ; validation; optimistic UI |
| 02 | [Priority System](../PRPs/02-priority-system.md) | High/Medium/Low; badges; sorting; filtering |
| 03 | [Recurring Todos](../PRPs/03-recurring-todos.md) | Daily/weekly/monthly/yearly; next instance; due date logic |
| 04 | [Reminders & Notifications](../PRPs/04-reminders-notifications.md) | Browser notifications; timing; polling; duplicate prevention |
| 05 | [Subtasks & Progress](../PRPs/05-subtasks-progress.md) | Checklists; progress bars; position; cascade delete |
| 06 | [Tag System](../PRPs/06-tag-system.md) | Labels; many-to-many; tag CRUD; filter by tag |
| 07 | [Template System](../PRPs/07-template-system.md) | Save/reuse patterns; subtasks JSON; due offsets; categories |
| 08 | [Search & Filtering](../PRPs/08-search-filtering.md) | Real-time search; advanced search; multi-criteria; client perf |
| 09 | [Export & Import](../PRPs/09-export-import.md) | JSON backup; ID remapping; relationships; validation |
| 10 | [Calendar View](../PRPs/10-calendar-view.md) | Monthly view; SG holidays; due-date visualization; navigation |
| 11 | [WebAuthn Authentication](../PRPs/11-authentication-webauthn.md) | Passkeys; JWT sessions; route protection |

> **Note:** If a linked PRP file is missing, implement from the README’s phase list and stack reference below, or add the PRP file under `PRPs/` following the standard structure.

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

### Phase 1 — Foundation
| Order | PRP | Deliverables |
|-------|-----|--------------|
| 1 | **01** Todo CRUD | CRUD API + UI, SG timezone, validation, optimistic updates |
| 2 | **02** Priority | 3 levels, badges, sort, filter |

### Phase 2 — Core Features
| Order | PRP | Deliverables |
|-------|-----|--------------|
| 3 | **03** Recurring | Patterns, next instance, due date inheritance |
| 4 | **04** Reminders | Notifications, configurable lead time, polling |
| 5 | **05** Subtasks | Checklists, progress UI, ordering, cascade delete |

### Phase 3 — Organization
| Order | PRP | Deliverables |
|-------|-----|--------------|
| 6 | **06** Tags | Colors, M:N, tag CRUD, filter |
| 7 | **08** Search & Filter | Text + tags search, multi-criteria, perf |

### Phase 4 — Productivity
| Order | PRP | Deliverables |
|-------|-----|--------------|
| 8 | **07** Templates | Save/reuse, JSON subtasks, offsets, categories |
| 9 | **09** Export/Import | JSON backup/restore, remap IDs, preserve relations |
| 10 | **10** Calendar | Month view, holidays, due-date drill-down |

### Phase 5 — Infrastructure (parallel or last)
| Order | PRP | Deliverables |
|-------|-----|--------------|
| 11 | **11** WebAuthn | Registration/login, JWT, protected routes |

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

1. Read the corresponding PRP (or this plan + copilot instructions if PRP file absent).
2. Follow **[.github/copilot-instructions.md](../.github/copilot-instructions.md)** for project patterns.
3. Align with **[USER_GUIDE.md](../USER_GUIDE.md)** for user-visible behavior.
4. Implement per PRP technical requirements (schema, API, types, UI).
5. Validate against PRP acceptance criteria.
6. Add tests per PRP testing section (E2E + unit as specified).

**Copilot-style prompt:**

```text
I want to implement [feature name].
Here's the PRP: [paste PRP content]
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
| [PRPs/README.md](../PRPs/README.md) | Full PRP index and tips |
| [.github/copilot-instructions.md](../.github/copilot-instructions.md) | Repo-wide AI/dev patterns |
| [USER_GUIDE.md](../USER_GUIDE.md) | End-user documentation |
| [README.md](../README.md) | Setup and install |

---

**Source:** PRPs/README.md — Last indexed: 11 PRPs (10 app features + 1 infrastructure).
