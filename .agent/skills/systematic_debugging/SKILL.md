---
name: systematic-debugging
description: Use when encountering any bug, test failure, build error, or unexpected behavior in the Excellent Academy project — before proposing fixes. Enforces root-cause-first debugging.
---

# Systematic Debugging

## Overview
Random fixes waste time and create new bugs. Quick patches mask underlying issues.

**Core principle:** ALWAYS find root cause before attempting fixes. Symptom fixes are failure.

**Violating the letter of this process is violating the spirit of debugging.**

## The Iron Law
```
NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST
```

If you haven't completed Phase 1, you cannot propose fixes.

## When to Use
Use for ANY technical issue in this project:
- Simulation rendering bugs (canvas glitches, SVG misalignment, animation freezes)
- Build failures (`npm run build` errors)
- PWA issues (offline mode, service worker conflicts, caching bugs)
- TypeScript compilation errors
- State management bugs (sliders not updating, labs not responding)
- Deployment failures (Vercel build errors)
- Performance regressions (slow load times, janky animations)

**Use this ESPECIALLY when:**
- Under time pressure (stakeholder demo tomorrow)
- "Just one quick fix" seems obvious
- You've already tried multiple fixes
- Previous fix didn't work
- You don't fully understand the issue

## The Four Phases

### Phase 1: Root Cause Investigation
**BEFORE attempting ANY fix:**

1. **Read Error Messages Carefully**
   - Don't skip past errors or warnings
   - Read stack traces completely
   - Note line numbers, file paths, error codes
   - Check the browser console for React warnings

2. **Reproduce Consistently**
   - Can you trigger it reliably?
   - Does it happen on both laptop and smartboard resolutions?
   - Does it happen in both Chrome and Safari?
   - If PWA issue: does it happen in incognito vs normal mode?

3. **Check Recent Changes**
   - `git diff main...dev-sandbox` — what changed?
   - Were new dependencies added to `package.json`?
   - Were any `vite.config.ts` or `tsconfig.json` settings changed?
   - Did the developer touch `App.tsx` or `TextbookContent.tsx`?

4. **Gather Evidence in Multi-Component Systems**
   ```
   For simulation bugs, check EACH layer:
   - Layer 1: Is the data/config correct? (topic data, physics constants)
   - Layer 2: Is the React state updating? (add temporary console.log)
   - Layer 3: Is the canvas/SVG receiving correct values?
   - Layer 4: Is the rendering math correct? (check formulas)
   
   Run once to gather evidence showing WHERE it breaks.
   THEN analyze evidence to identify failing component.
   THEN investigate that specific component.
   ```

5. **Trace Data Flow**
   - Where does the bad value originate?
   - What called this with the bad value?
   - Keep tracing up until you find the source
   - Fix at source, not at symptom

### Phase 2: Pattern Analysis
1. **Find Working Examples** — Locate similar working labs in the codebase
2. **Compare Against References** — Read the working lab COMPLETELY
3. **Identify Differences** — What's different between working and broken?
4. **Understand Dependencies** — What settings, config, or environment does it need?

### Phase 3: Hypothesis and Testing
1. **Form Single Hypothesis** — "I think X is the root cause because Y"
2. **Test Minimally** — Make the SMALLEST possible change
3. **Verify Before Continuing** — Did it work? If not, form NEW hypothesis. DON'T stack fixes.

### Phase 4: Implementation
1. **Implement Single Fix** — Address root cause. ONE change at a time.
2. **Verify Fix** — Run `npm run build`. Check browser. Test the specific simulation.
3. **If Fix Doesn't Work (3+ attempts)** — STOP. Question the architecture. Discuss with the user before continuing.

## Red Flags — STOP and Follow Process
If you catch yourself thinking:
- "Quick fix for now, investigate later"
- "Just try changing X and see if it works"
- "Add multiple changes, run tests"
- "It's probably X, let me fix that"
- "I don't fully understand but this might work"
- Proposing solutions before tracing data flow
- **"One more fix attempt" (when already tried 2+)**

**ALL of these mean: STOP. Return to Phase 1.**

## Common Rationalizations
| Excuse | Reality |
|--------|---------|
| "Issue is simple" | Simple issues have root causes too |
| "Emergency, no time" | Systematic is FASTER than thrashing |
| "Just try this first" | First fix sets the pattern. Do it right. |
| "I see the problem" | Seeing symptoms ≠ understanding root cause |
| "One more fix" (after 2+) | 3+ failures = architectural problem |

## Real-World Impact
- Systematic approach: 15-30 minutes to fix
- Random fixes approach: 2-3 hours of thrashing
- First-time fix rate: 95% vs 40%
- New bugs introduced: Near zero vs common
