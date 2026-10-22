---
name: schema-migration
description: Use when updating Realm database models and schemas in shared/models/Schemas.ts to ensure data compatibility and safe migration.
---

# Schema Migration Skill

## 1. Purpose
Safely manage database schema updates in `shared/models/Schemas.ts` with proper versioning and backward compatibility.

## 2. Trigger Conditions
- **Use when:** Adding new fields, tables, or modifying properties in Realm models.
- **Do not use when:** Making UI or service logic changes that do not touch database schemas.

## 3. Prerequisites
- Review existing schemas in `shared/models/Schemas.ts`.
- Understand Realm schema versioning requirements.

## 4. Steps
1. **Plan Schema Changes:** Identify added/modified properties and required default values.
2. **Update Schema Version:** Increment schema version appropriately in `shared/models/Schemas.ts`.
3. **Write Migration Logic:** Implement migration callbacks for data transformations if necessary.
4. **Verify Type Definitions:** Update corresponding TypeScript interfaces and shared types.

## 5. Safety Rules
- Avoid breaking backward compatibility for existing local offline databases.
- Never delete historical fields without a structured deprecation and migration path.

## 6. Verification Criteria
- TypeScript compilation and lint checks pass without errors.
- Schemas correctly validate against sample data models.

## 7. Failure Handling
- Roll back schema edits if type mismatches or migration exceptions occur.

## 8. Final Report
- Report schema version updates, modified models, and migration verification steps.
