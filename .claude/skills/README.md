# Project Skills Index

This repository contains focused Claude Code Skills for recurring development workflows:

1. **`domain-change`**: Modifying core business logic in invoice, stock, or payment services (`smart-inventory-desktop/src/services/`).
   - *Trigger*: Editing `invoice.service.ts`, `stock.service.ts`, or `payment.service.ts`.
   - *Example*: Invoked when updating invoice confirmation or stock movement rules.

2. **`schema-migration`**: Updating Realm database models and schemas (`shared/models/Schemas.ts`).
   - *Trigger*: Modifying `shared/models/Schemas.ts`.
   - *Example*: Invoked when adding new fields to Product or Invoice models.

3. **`bug-fix`**: Investigating and fixing runtime errors or linter issues.
   - *Trigger*: Fixing reported bugs or failing linter checks (`npm run lint`).
   - *Example*: Invoked when resolving static analysis warnings.
