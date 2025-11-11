# Git Workflow Reference (Company Standard)

The Goal of this doc is it to synchronize the Repos of all the Peer Departments. It complements each repo’s `CONTRIBUTING.md` and keeps day‑to‑day work consistent across teams.

For some more guidelines about how to use Git (commands) refer to this page:
[![Contributing](https://img.shields.io/badge/Contributing-Guidelines-blue.svg)](CONTRIBUTING.md)
---

## Branch Model (Two Stable Branches + Short‑Lived Work Branches)

**Stable branches**
- **`main`** — always points to the **current released production** version.
- **`development`** — integration branch for the **current dev/testing** build.

**Short‑lived branches** (create off `development` only):
- `username/feat/<short-desc>` — new features
- `username/fix/<short-desc>` — bug fixes
- `username/docs/<short-desc>` — documentation
- `username/refactor/<short-desc>` — restructurings
- `username/test/<short-desc>` — tests
- `username/chore/<short-desc>` — tooling/CI/deps

> Keep names lowercase, short, and descriptive.

### Visual: Typical Flow
```
   (releases)
      |        |
      v        v
-----●---------●--------------------  main (releases only)
         \      \
          \      \ (merge via PR w/ release version + notes)
           \      ●------------------  development (integrate & test)
            \    /
             ●--●   short‑lived branches (feat/fix/docs/…)
                \
                 ●  done -> PR into development -> delete branch
```

---

## What May Update Each Branch

- **`main`**
  - **Only** via a **Pull Request from `development`**.
  - PR **must state the release version** (for example, `Release 1.3.0`) and include **release notes** (changelog + any extra info).

- **`development`**
  - **Only** via **PRs from short‑lived branches** (`feat/`, `fix/`, `docs/`, etc.).
  - Each PR must briefly describe **what changes**, **why** and **link to the related ClickUp task ID or URL**.


---

## Commit Policy

- Commit **small-ish, focused changes**.
- **Commit only to short‑lived branches** (never directly to `main` or `development`).
- Use **clear, short subjects** in imperative mood.
- **Daily safety snapshot**: at **end of your workday**, add a final commit labeled **WIP** to store progress.

### Recommended commit style
Use Conventional-style messages:
```
<type>(<optional-scope>): <short subject>

[optional body]
```
**Types**: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`.

**Examples**
```
feat(auth): add OAuth2 login
fix(header): resolve mobile overflow
docs(readme): clarify setup steps
chore: update CI cache key
chore: WIP — end of day snapshot (2025-11-11)
```

> Keep subjects ≲ 50 chars; explain the **why** in the body when helpful.

---

## Pull Requests (PRs)

**From short‑lived branch → `development`**
- Title: concise summary (e.g., `feat: profile privacy controls`).
- Description: **What/Why/How**, screenshots if UI, test notes, and any risks (only if helpfull).
- Link tickets/issues, especially the **ClickUp task link or ID**.
- Assign reviewers and request review early if feedback is needed.

**From `development` → `main` (Release PR)**
- Title: `Release X.Y.Z`
- Description must include **Release Notes**:
  - Added / Changed / Fixed / Removed
  - Migrations/ops steps
  - Known issues

### Minimal PR template
```
## Summary
Short explanation of the change.

## Impact / Risks
- ...

## Links
- ClickUp: [Task ID or URL]
- ... (additional important/helpfull links)
```


