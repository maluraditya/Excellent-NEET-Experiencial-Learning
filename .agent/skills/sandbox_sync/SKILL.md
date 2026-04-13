---
name: sandbox-sync-protocol
description: Use whenever the user asks to "sync with main", "pull the latest changes", or establish Git workflow procedures for sandbox branches (aditya-sandbox and dev-sandbox).
---

# Sandbox Sync Protocol

## Overview
The Excellent Academy project utilizes a strict multi-sandbox branch strategy to protect the `main` branch:
- `aditya-sandbox`: The primary sandbox for the lead developer.
- `dev-sandbox`: An isolated sandbox for external developers.
- `main`: The heavily protected source of truth.

Whenever multiple developers are successfully merging features into `main` over time, the respective active sandbox branches will slowly drift out of date. To ensure no one is building on stale code causing painful future merge conflicts, branches must be synced periodically.

## Triggering the Skill
Invoke these procedures automatically if the user requests:
- "Sync my branch"
- "Update my sandbox from main"
- "Get latest changes"

## The Sync Workflow

Execute the following steps sequentially via `run_command` tools. **Do not attempt to run them all as one massive combo command; execute them cleanly and read the console output carefully.**

### Step 1: Ensure Working Tree is Clean
Check for unsaved/untracked changes before initiating a sync.
`git status`

If the tree is dirty with meaningful code changes, commit and push them to secure the work first:
`git add .`
`git commit -m "chore: save local state before sync"`
`git push origin HEAD`

### Step 2: Fetch and Update Main
Pull the absolute latest verified code from remote `main` to the local `main` tracker securely:
`git checkout main`
`git pull origin main`

### Step 3: Merge Main into the Sandbox
Return to the active sandbox (e.g. `aditya-sandbox` or `dev-sandbox`) and inject the newly fetched code safely:
`git checkout <active-sandbox-branch>`
`git merge main`

### Step 4: Handle Conflicts & Verify
- **If Merge is Clean:** Push the synced sandbox immediately to the remote server to lock it in:
  `git push origin <active-sandbox-branch>`
  
- **If Merge has Conflicts:**
  1. Halt execution immediately.
  2. Inform the user "Git merge conflict detected."
  3. List out the specific conflicted files cleanly.
  4. Work with the user to manually resolve the conflicts block-by-block.
  5. Once cleanly resolved, finish the commit and run `npm run build` to verify the application didn't break during conflict resolution before finally pushing.

## Golden Rules
1. **NEVER** run `git pull origin main` *while checked out* on a sandbox branch (e.g., `git pull origin main` physically inside `dev-sandbox`). It bypasses clean checkout tracking and creates horrific merge matrices. Always switch to `main` -> pull -> switch back -> merge `main` locally.
2. If the user tells you they are starting a brand new day of work, actively suggest running this Sync Protocol first so they don't accidentally write code on yesterday's layout.
