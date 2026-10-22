---
name: bug-fix
description: Use when investigating and fixing reported bugs or runtime errors to ensure root-cause resolution and regression prevention.
---

# Bug Fix Skill

## 1. Purpose
Systematically investigate, diagnose, and fix bugs while adhering to architecture rules and preventing regressions.

## 2. Trigger Conditions
- **Use when:** Resolving user-reported bugs, linter errors, or unexpected runtime failures.
- **Do not use when:** Implementing brand-new feature workflows.

## 3. Prerequisites
- Reproduce or identify the exact error message and failing code location (`file_path:line_number`).
- Review relevant domain rules in `CLAUDE.md`.

## 4. Steps
1. **Analyze Root Cause:** Inspect the failure path using Grep and Read.
2. **Design Fix:** Apply targeted fixes without bypassing domain services or architecture rules.
3. **Verify Static Checks:** Run linters (`cd smart-inventory-desktop && npm run lint`) and type checks.
4. **Test Behavior:** Verify the fix addresses the root cause.

## 5. Safety Rules
- Do not introduce direct database writes from UI to fix a bug.
- Avoid workarounds that violate domain separation.

## 6. Verification Criteria
- Bug is successfully resolved.
- Linter and build checks pass successfully.

## 7. Failure Handling
- Revert incomplete or failing patches and re-evaluate root cause.

## 8. Final Report
- Report root cause, files fixed, and verification commands executed.
