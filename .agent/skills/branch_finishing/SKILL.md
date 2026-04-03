---
name: finishing-a-development-branch
description: Use when the developer's work on dev-sandbox is complete and you need to guide the merge/PR workflow. Ensures tests pass, presents structured options, and handles cleanup.
---

# Finishing a Development Branch

## Overview
Guide completion of development work by presenting clear options and handling the chosen workflow.

**Core principle:** Verify build → Present options → Execute choice → Clean up.

**Announce at start:** "I'm using the branch-finishing skill to complete this work."

## The Process

### Step 1: Verify Build
**Before presenting options, verify the build passes:**

```bash
npm run build
```

**If build fails:**
```
Build failing with <N> errors. Must fix before completing:

[Show errors]

Cannot proceed with merge/PR until build passes.
```

Stop. Don't proceed to Step 2.

**If build passes:** Continue to Step 2.

### Step 2: Run the PR Review Skill
Before offering merge options, run the `pr_review` skill on the diff:

```bash
git diff main...dev-sandbox
```

Review all changes using the PR Code Review Expert checklist. If the review finds HIGH severity bugs, stop and report them.

### Step 3: Present Options

Present exactly these 4 options:

```
Implementation complete and reviewed. What would you like to do?

1. Merge dev-sandbox into main locally
2. Push and create a Pull Request on GitHub
3. Keep the branch as-is (I'll handle it later)
4. Discard this work

Which option?
```

**Don't add explanation** — keep options concise.

### Step 4: Execute Choice

#### Option 1: Merge Locally

```bash
# Switch to main
git checkout main

# Pull latest
git pull origin main

# Merge feature branch
git merge dev-sandbox

# Verify build on merged result
npm run build

# If build passes, push
git push origin main

# Clean up the dev branch
git branch -d dev-sandbox
git push origin --delete dev-sandbox
```

**After merge:** Recreate a fresh `dev-sandbox` from the updated `main` for the developer's next task:
```bash
git checkout -b dev-sandbox
git push -u origin dev-sandbox
```

#### Option 2: Push and Create PR

```bash
# Ensure dev-sandbox is pushed
git push origin dev-sandbox

# Create PR (requires GitHub CLI)
gh pr create --base main --head dev-sandbox \
  --title "<descriptive title>" \
  --body "## Summary
<2-3 bullets of what changed>

## Review Checklist
- [ ] Build passes (`npm run build`)
- [ ] No TypeScript errors
- [ ] Affected simulations tested visually
- [ ] No leftover console.log statements"
```

#### Option 3: Keep As-Is

Report: "Keeping branch `dev-sandbox`. No changes made."

#### Option 4: Discard

**Confirm first:**
```
⚠️ This will permanently delete all work on dev-sandbox:
- All commits since branching from main
- All code changes

Type 'discard' to confirm.
```

Wait for exact confirmation. If confirmed:
```bash
git checkout main
git branch -D dev-sandbox
git push origin --delete dev-sandbox

# Recreate fresh branch for developer's next task
git checkout -b dev-sandbox
git push -u origin dev-sandbox
```

## Quick Reference

| Option | Merge | Push | Cleanup Branch | Recreate Branch |
|--------|-------|------|----------------|-----------------|
| 1. Merge locally | ✓ | ✓ (main) | ✓ | ✓ (fresh) |
| 2. Create PR | - | ✓ (branch) | - | - |
| 3. Keep as-is | - | - | - | - |
| 4. Discard | - | - | ✓ (force) | ✓ (fresh) |

## Red Flags

**Never:**
- Proceed with failing build
- Merge without running `pr_review` skill first
- Delete work without typed confirmation
- Force-push without explicit user request

**Always:**
- Verify build before offering options
- Run code review before offering merge
- Present exactly 4 options
- Recreate `dev-sandbox` after merge or discard so developer always has a branch ready
