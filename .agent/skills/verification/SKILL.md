---
name: verification-before-completion
description: Use before claiming work is complete, fixed, or passing — requires running verification commands and confirming output before making any success claims. Evidence before assertions, always.
---

# Verification Before Completion

## Overview
Claiming work is complete without verification is dishonesty, not efficiency.

**Core principle:** Evidence before claims, always.

**Violating the letter of this rule is violating the spirit of this rule.**

## The Iron Law
```
NO COMPLETION CLAIMS WITHOUT FRESH VERIFICATION EVIDENCE
```

If you haven't run the verification command in this message, you cannot claim it passes.

## The Gate Function
```
BEFORE claiming any status or expressing satisfaction:

1. IDENTIFY: What command proves this claim?
2. RUN: Execute the FULL command (fresh, complete)
3. READ: Full output, check exit code, count failures
4. VERIFY: Does output confirm the claim?
   - If NO: State actual status with evidence
   - If YES: State claim WITH evidence
5. ONLY THEN: Make the claim

Skip any step = lying, not verifying
```

## Project-Specific Verification Commands

| Claim | Required Command | Not Sufficient |
|-------|-----------------|----------------|
| "Build succeeds" | `npm run build` → exit 0 | "I fixed the TypeScript error" |
| "No TypeScript errors" | `npx tsc --noEmit` → 0 errors | "Types look correct" |
| "App loads correctly" | Open browser, verify rendering | "Code compiles" |
| "Simulation works" | Navigate to lab, interact with controls | "Component renders" |
| "PWA works offline" | Test in incognito with network off | "Service worker registered" |
| "Bug is fixed" | Reproduce original steps → passes | "Code changed, assumed fixed" |
| "PR is safe to merge" | Build passes + visual verification | "Code review looks good" |

## Red Flags — STOP

- Using "should", "probably", "seems to"
- Expressing satisfaction before verification ("Great!", "Perfect!", "Done!")
- About to recommend merge without running `npm run build`
- Trusting that a code change "obviously works"
- Relying on partial verification
- **ANY wording implying success without having run verification**

## Rationalization Prevention

| Excuse | Reality |
|--------|---------|
| "Should work now" | RUN the verification |
| "I'm confident" | Confidence ≠ evidence |
| "Just this once" | No exceptions |
| "TypeScript compiled" | Compile ≠ runtime correctness |
| "Build passed" | Build ≠ visual correctness |
| "Partial check is enough" | Partial proves nothing |

## Key Patterns

**Build:**
```
✅ [Run `npm run build`] [See: exit 0, no warnings] "Build passes"
❌ "Should pass now" / "Types look correct"
```

**Bug Fix:**
```
✅ [Reproduce bug steps] [Confirm behavior is correct] "Bug is fixed"
❌ "I changed the function, it should work"
```

**PR Review:**
```
✅ [Run build] [Check browser] [Test affected simulation] "SAFE TO MERGE"
❌ "Code looks clean" (without running anything)
```

## When To Apply

**ALWAYS before:**
- ANY variation of success/completion claims
- ANY expression of satisfaction about code state
- Recommending "SAFE TO MERGE" in a PR review
- Moving to next task
- Telling the user a bug is fixed

## The Bottom Line

**No shortcuts for verification.**

Run the command. Read the output. THEN claim the result.

This is non-negotiable.
