# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## ROLE CONTEXT
You are working with a system designed by:
- **CTO**: Responsible for technical vision, architecture decisions, and technology stack
- **Senior Software Architect**: Ensures domain-driven design, scalability, and maintainability  
- **Product Manager**: Focuses on Algerian SMB needs, bilingual requirements (FR/AR), and offline-first experience

## PROJECT CONTEXT
**System**: Smart Inventory → evolving into ERP-lite  
**Stack**:
- Electron (desktop)
- React + TypeScript  
- Realm (local-first DB)
- Shared code (desktop + mobile)

**Target**:
- Algerian SMB
- Bilingual (FR / AR)
- Offline-first

## CORE PRINCIPLES (NON-NEGOTIABLE)

### 1. NO CRUD MINDSET
Do NOT build simple CRUD apps. Every feature must reflect:
- **Business logic** (tax calculations, inventory valuation, payment reconciliation)
- **Real workflows** (invoice lifecycle: draft → confirm → pay → archive)
- **Data integrity** (financial accuracy, audit trails, prevention of inconsistent states)

### 2. DOMAIN SEPARATION
Strict boundaries with ACID transactions:
- **Invoice → document only** (represents a transaction, not a mutable entity)
  - Never update confirmed invoices - only cancel with reversal
  - InvoiceItems are immutable snapshots at time of transaction
- **Payment → financial ledger** (records money movement, separate from invoices)
  - Tracks actual cash flow vs. invoiced amounts
  - Supports partial payments, credit terms, multiple payment modes
- **Stock → inventory system** (tracks physical goods, updated via stock movements)
  - Never modify stock directly - only through StockMovement events
  - Maintains audit trail of every inventory change

Violating domain separation creates data inconsistency and breaks auditability.

### 3. NO DIRECT DB WRITES FROM UI
❌ Forbidden: `realm.write()` in UI/components/services  
✅ Required: All database modifications must go through dedicated service layers that enforce:
- Business rules validation (stock availability, credit limits, tax rules)
- Atomic transactions (all-or-nothing updates)  
- Domain separation (no cross-domain writes during transactions)
- Audit trails and data integrity
- Offline-first conflict resolution patterns

## Project Structure

This is a Smart Inventory system evolving into an ERP-lite system with three main components:
1. `smart-inventory-desktop` - Electron desktop application built with React, TypeScript, and Vite
2. `smart-inventory-mobile` - React Native mobile application built with Expo  
3. `shared` - Shared code including models, types, and utilities used by both applications

## Development Commands

### Smart Inventory Desktop
- **Development**: `cd smart-inventory-desktop && npm run dev`
- **Build**: `cd smart-inventory-desktop && npm run build`
- **Preview**: `cd smart-inventory-desktop && npm run preview`
- **Lint**: `cd smart-inventory-desktop && npm run lint`

### Smart Inventory Mobile
- **Start**: `cd smart-inventory-mobile && npm start`
- **Android**: `cd smart-inventory-mobile && npm run android`
- **iOS**: `cd smart-inventory-mobile && npm run ios`
- **Web**: `cd smart-inventory-mobile && npm run web`

## Architecture Overview

### Domain-Driven Design Layers

#### 1. Database Layer (Realm)
- Local-first database using Realm with automatic conflict resolution
- All data persisted locally enabling true offline-first operation
- Schemas defined in `shared/models/Schemas.ts` with strict validation
- Designed for synchronization backend when network connectivity exists

#### 2. Service Layer (Business Logic Enforcement)
- **Critical**: All database writes MUST go through service methods
- Services enforce transactional integrity and business invariants:

Key services in `smart-inventory-desktop/src/services/`:
- `invoice.service.ts` - Handles complete invoice lifecycle:
  * `createDraft()`: Creates invoice in draft state (NO stock/financial impact)
  * `confirm()`: Atomically performs:
    1. Permanent invoice number generation (fiscal year sequencing)
    2. Status transition to 'confirmed' + timestamp
    3. Stock reduction/increase via StockMovements
    4. Financial ledger initialization (amountPaid = 0)
    5. Optional immediate cash payment recording
  * `cancel()`: Atomically reverses confirmed invoice (stock restoration + status change)
  * `recordPayment()`: Updates financial ledger without touching stock
- `stock.service.ts` - Manages physical inventory:
  * `_moveStockInTransaction()`: Core method that validates levels, creates movement, updates stock
  * Prevents negative inventory through pre-validation
  * Every stock change creates auditable StockMovement record
- `payment.service.ts` - Processes financial transactions:
  * Records payments against invoices with multiple modes (Espèce, Chèque, Virement, Crédit)
  * Updates invoice.amountPaid atomically
  * Handles partial payments, overpayments, and credit note generation

#### 3. UI Layer (Presentation Only)
- React components (desktop) / React Native components (mobile)
- **Never** contain `realm.write()` calls or business logic
- Only read data and delegate actions to service layer
- Responsible for: user interaction, input validation feedback, navigation, loading/error states
- Must handle offline/online state indication for user clarity

### Desktop Application (Electron + React + Vite)
- Entry point: `src/main.tsx`
- Main App component: `src/App.tsx`
- UI Components: Located in `src/components/` following atomic design principles
  - Product management: `ProductList.tsx`, `ProductForm.tsx`, `ProductSearch.tsx`
  - Sales/Purchasing: `SalesScreen.tsx`, `Cart.tsx`, `SaleToast.tsx`
  - Financial: Payment forms, invoice listings, reports
  - UI helpers: `ProductHeader.tsx`, `ConfirmDialog.tsx`, bilingual labels
- Styles: CSS files in `src/` and `src/styles/` with RTL support for Arabic
- State Management: Realm database via `src/models/RealmContext.ts` (provider pattern)

### Mobile Application (Expo + React Native)
- Entry point: `App.tsx`
- Shares identical business logic with desktop app through service layer pattern
- Optimized for touch interfaces and mobile-specific workflows
- Uses Realm for local data storage with identical schema
- Assets in `assets/` directory with bilingual image/text resources
- Background sync capabilities for offline-first operation

### Shared Code
- `shared/models/` - Realm model definitions (with strict schema validation and types)
- `shared/types/` - TypeScript interfaces and types (API contracts, DTOs, enum definitions)
- `shared/utils/` - Utility functions:
  * Formatters (currency, date, bilingual text)
  * Validators (business rules, input validation)
  * Constants (tax rates, payment modes, document types)
  * Helpers (bilingual text switching, fiscal year calculations)

## Key Technologies
- **Desktop**: React 19, TypeScript, Vite, Electron, Realm Database
- **Mobile**: React Native, Expo, TypeScript, Realm Database
- **State Management**: Realm (local-first, offline-capable with conflict resolution)
- **Styling**: CSS (desktop with RTL support), React Native styling (mobile)
- **Build Tools**: Vite (desktop), Expo CLI (mobile)
- **Linting**: ESLint with React hooks and refresh plugins, Prettier for code formatting
- **Internationalization**: Built-in bilingual support (FR/AR) with RTL layout handling

## Service Layer Rules (MUST FOLLOW)

### Invoice Service (`invoice.service.ts`)
- `createDraft()`: Creates invoice in draft state (NO stock changes, NO financial impact)
  - Validates: product availability, customer credit limits (if applicable)
  - Returns draft with temporary "DRAFT" invoice number
- `confirm()`: Atomically performs ALL operations within SINGLE realm.write():
  1. **Document numbering**: Assigns permanent invoice number (increments Settings counter fiscally)
  2. **Lifecycle management**: Sets status = 'confirmed' + confirmedAt timestamp
  3. **Inventory impact**: Creates StockMovements for each line item AND updates Product.currentStock
  4. **Financial initialization**: Sets amountPaid = 0 (ready for payment tracking)
  5. **Optional payment**: If paymentMode = 'Espèce', records full payment immediately
  6. **Audit trail**: Preserves who/when confirmed via system fields
- `cancel()`: Atomically reverses confirmed invoice within SINGLE realm.write():
  1. **Inventory restoration**: Creates reverse StockMovements (return_in/sale_out) AND restores Product.currentStock
  2. **Lifecycle management**: Sets status = 'cancelled' + cancellation reason in notes
  3. **Financial handling**: Voids associated payments or marks as refunded per business rules
  4. **Audit trail**: Preserves original invoice data while marking as cancelled
- **Never** modify invoice fields directly from UI - always use these transactional methods
- All monetary calculations use decimal precision to prevent rounding errors

### Stock Service (`stock.service.ts`)
- `_moveStockInTransaction(realm, productId, movementType, quantity, reference)`: Core atomic method that:
  1. **Validation**: Loads product, checks sufficient stock for outward movements
  2. **Audit creation**: Creates StockMovement record with before/after quantities
  3. **State update**: Updates Product.currentStock atomically
  4. **Reference tracking**: Links movement to source document (invoice number, adjustment ID)
  5. **Throws**: Business rule violations (insufficient stock, invalid movement type)
- All stock adjustments (manual counts, losses, returns, production) MUST use this method
- Direct stock writes bypassing this method break inventory audit trail and cause discrepancies

### Payment Service
- Records payments against invoices with strict financial controls:
  * Validates: payment amount doesn't exceed invoice outstanding balance
  * Updates: invoice.amountPaid atomically within transaction
  * Creates: Payment record with mode, reference, timestamp
  * Handles: overpayments (creates credit balance), partial payments, late fees
  * Supports: multiple payment modes with different clearing times (Espèce immediate, Chèque delayed)
- Never modifies invoice stock or document fields - purely financial ledger updates

## Database Design Principles

### 1. Immutable Business Documents
- Invoices, once confirmed, represent historical facts - never modified
  - Corrections made through cancellation + re-invoicing (preserves audit trail)
  - InvoiceItems are snapshots: productRef, designation, unitPriceHT, tvaRate copied at time of transaction
  - Financial integrity: all amounts (subtotal, tax, total) calculated and stored at transaction time
  - Legal compliance: supports archival requirements for financial documents

### 2. Event-Sourced Inventory & Finance
- Every StockMovement represents a factual inventory change (physical receipt, shipment, adjustment)
- Every Payment represents actual money movement (cash received, check deposited, transfer completed)
- Current states (Product.currentStock, Invoice.amountPaid) are projections of these event streams
- Enables powerful reporting: inventory valuation at any point in time, cash flow analysis, tax reporting

### 3. Bilingual & Localization-First Design
- All user-facing text externalized for FR/AR switching
- Database stores canonical values (product codes, numbers, dates) - presentation layer handles translation
- RTL layout support built into CSS frameworks and mobile styling
- Date/number/currency formatting respects locale settings (DD/MM/YYYY vs MM/DD/YYYY, comma/decimal separator)
- Fiscal year configuration in Settings for Algerian business calendar alignment

### 4. Offline-First Resilience
- All critical operations work 100% offline using local Realm database
- Conflict resolution strategy: last-write-wins for most data, manual resolution for financial conflicts
- Queue mechanism for outgoing payments/synchronization when connectivity restored
- UI clearly indicates online/offline status and prevents actions requiring backend when offline
- Automatic synchronization when network available with conflict detection

## Common Development Tasks (Following Principles)

1. **Adding new business functionality** (e.g., purchase orders, expense tracking):
   - Create/update service methods in appropriate domain service (NEVER direct realm writes)
   - Ensure atomic transactions and comprehensive data validation
   - Map to existing domain boundaries (extend Invoice/Payment/Stock patterns)
   - Update UI to call service methods with proper loading/error states
   - Add bilingual labels and formatters for new fields

2. **Modifying data models** (e.g., adding fields to Product):
   - Update shared models in `shared/models/Schemas.ts` with migration strategy
   - Consider backward compatibility: default values, nullable fields, version checks
   - Update related services if behavior changes (validation rules, calculations)
   - Ensure UI handles new fields appropriately in create/edit views
   - Test migration paths with existing data

3. **Adding UI features** (e.g., new report, dashboard widget):
   - Create components that ONLY read data through service/query methods
   - Never put business logic or database writes in components
   - Handle loading states, empty states, and error states explicitly
   - Use shared utility formatters for consistent bilingual presentation
   - Follow existing component patterns for consistency

4. **Implementing new workflows** (e.g., credit management, recurring invoices):
   - Map to domain boundaries: which entities are created/modified?
   - Ensure proper separation of concerns (don't mix stock updates in payment workflow, etc.)
   - Create service methods that encapsulate the complete workflow with transactional integrity
   - Consider offline behavior: what parts can work offline vs requiring sync?
   - Add appropriate audit trails and reversal mechanisms

5. **Cross-platform features** (e.g., new barcode scanning, biometric login):
   - Place shared business logic in services that both platforms can import/use
   - UI differences handled in platform-specific directories with shared design tokens
   - Utilize shared utility functions for formatters, validators, constants
   - Test both platforms thoroughly for consistent behavior

## Testing Approach
- **Unit test service methods**: Test business logic in isolation with mocked dependencies
- **Integration test service + database**: Verify transactional behavior and constraint enforcement
- **UI tests**: Focus on presentation, service delegation, and user interaction flows
- **Never test direct realm writes from UI components** - this violates architectural principles
- **Test offline scenarios**: Verify behavior when network unavailable
- **Test bilingual rendering**: Ensure FR/AR text displays correctly with proper layout
- **Test edge cases**: Negative stock prevention, financial rounding, concurrent modifications

## Quality Gates
Before any code is considered complete:
1. All database writes go through service layer (no realm.write in UI/components)
2. Domain separation maintained (no stock changes in payment service, etc.)
3. Bilingual support implemented for all user-facing text
4. Offline functionality verified for core operations
5. Atomic transactions used for multi-step operations
6. Proper error handling and user feedback implemented
7. Audit trails preserved for financial and inventory operations

This architecture ensures the system maintains financial integrity, supports complex business workflows, and provides a reliable offline-first experience for Algerian SMBs operating in disconnected environments.