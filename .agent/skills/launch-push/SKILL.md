---
name: launch-push-workflow
description: Use when the user types "/launch" or asks to finish work by pulling latest main, preserving local changes, merging main into dev-sandbox, verifying TypeScript and production build, committing, and pushing the complete code to the Excellent-NEET-Experiencial-Learning dev-sandbox branch.
---

# Launch Push Workflow

## Purpose

Complete the local development loop safely:

1. Preserve local work.
2. Pull the latest `main` from the Excellent repo.
3. Merge `main` into `dev-sandbox`.
4. Run TypeScript and build checks.
5. Commit remaining local changes.
6. Push `dev-sandbox`.

## Repository Defaults

- Preferred remote: the remote whose URL contains `Excellent-NEET-Experiencial-Learning`.
- In this repo, that is usually `upstream`.
- Target branch: `dev-sandbox`.
- If the user writes `dev-sandox`, treat it as a typo for `dev-sandbox` unless a real branch named `dev-sandox` exists.

## Safety Rules

- Never run `git reset --hard`, `git checkout -- <file>`, or delete files to make the workflow pass.
- Never discard local changes.
- Do not commit generated cache/build folders such as `.next/`, `dist/`, `node_modules/`, logs, or local env files.
- If there are merge conflicts, stop the automation flow, list conflicted files, resolve carefully, then continue.
- If TypeScript or build fails, do not push. Fix the errors first, rerun checks, then commit and push.
- If remote/branch identity is ambiguous, inspect `git remote -v` and `git branch --list` before acting.

## Workflow

### 1. Inspect State

Run:

```bash
git status --short --branch
git remote -v
git branch --show-current
```

Confirm the active branch is `dev-sandbox`. If not, switch only when the working tree can be preserved safely.

### 2. Resolve Remote

Use the remote pointing to:

```text
maluraditya/Excellent-NEET-Experiencial-Learning
```

Prefer `upstream` when present.

### 3. Fetch Latest Main

Run:

```bash
git fetch <excellent-remote> main
```

### 4. Preserve Local Changes Before Merge

If `git status --short` shows local source changes, stage intended source files and assets.

Use broad staging only if `.gitignore` protects generated output:

```bash
git add -A
```

If generated folders like `.next/` are untracked, do not stage them. Prefer explicit staging:

```bash
git add -u
git add public/logo1.webp public/images
```

Then commit local work if anything is staged:

```bash
git commit -m "Save local changes before syncing main"
```

If there is nothing staged, continue.

### 5. Merge Main Into Local Branch

While on `dev-sandbox`, run:

```bash
git merge <excellent-remote>/main
```

If Git reports conflicts:

1. Run `git status --short`.
2. List conflicted files.
3. Resolve conflicts without dropping local changes.
4. Stage resolved files.
5. Complete the merge commit.

### 6. Verify

Run both commands freshly:

```bash
npm.cmd run typecheck
npm.cmd run build
```

If the environment is not Windows, use:

```bash
npm run typecheck
npm run build
```

Do not push unless both commands exit successfully.

### 7. Commit Post-Merge Fixes

If verification required fixes or there are still staged/unstaged source changes, stage intended files and commit:

```bash
git status --short
git add -u
git add public/logo1.webp public/images
git commit -m "Update dashboard layout and topic data"
```

Adjust the commit message to match the actual work.

### 8. Push to Dev Sandbox

Push to the Excellent repo remote:

```bash
git push <excellent-remote> dev-sandbox
```

### 9. Final Report

Report:

- Remote pushed to.
- Branch pushed.
- Commit hash.
- TypeScript result.
- Build result.
- Any untracked files intentionally left out, such as `.next/`.

## Failure Handling

- **Fetch fails:** Request network/auth approval or report the Git error.
- **Merge conflict:** Stop, list files, resolve carefully, then verify.
- **TypeScript fails:** Fix errors before build/push.
- **Build fails:** Fix errors before push.
- **Push rejected:** Fetch the target branch, merge/rebase only with care, preserve local commits, rerun verification, then push again.
