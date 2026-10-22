---
name: domain-change
description: Use when modifying core business logic in invoice, stock, or payment services to ensure ACID transaction integrity and domain separation.
---

# Domain Change Skill

## 1. Purpose
Guide the safe modification of core domain business logic in `smart-inventory-desktop/src/services/` (invoices, stock movements, and financial ledgers) adhering strictly to non-negotiable architecture rules.

## 2. Trigger Conditions
- **Use when:** Modifying or adding methods to `invoice.service.ts`, `stock.service.ts`, or `payment.service.ts`.
- **Do not use when:** Making purely presentational UI updates or styling changes.

## 3. Prerequisites
- Review `CLAUDE.md` service layer rules and domain boundaries.
- Inspect affected service files in `smart-inventory-desktop/src/services/` and `shared/models/Schemas.ts`.

## 4. Steps
1. **Analyze Domain Boundaries:** Ensure no cross-domain writes occur during transactions (e.g. no stock updates inside payment services).
2. **Enforce Atomic Transactions:** Wrap all database modifications in a single `realm.write()` block.
3. **Validate Business Rules:** Implement pre-validation checks (e.g., sufficient stock before outward movement).
4. **Preserve Audit Trails:** Ensure audit records (`StockMovement`) are correctly populated.

## 5. Safety Rules
- **Never** perform `realm.write()` directly from UI components.
- **Never** modify confirmed invoices in-place; follow cancellation and reversal flows.

## 6. Verification Criteria
- All domain invariants are enforced.
- Run `cd smart-inventory-desktop && npm run lint` to confirm no static analysis errors.

## 7. Failure Handling
- Ensure Realm transactions abort cleanly on error without leaving partial state.

## 8. Final Report
- Report modified service files, updated invariants, and verification results.
