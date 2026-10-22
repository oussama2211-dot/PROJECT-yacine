# Project Architecture

## System Architecture
Smart Inventory (evolving into an ERP-lite system) is engineered as a cross-platform local-first application tailored for Algerian SMBs. It features strict domain separation, ACID transactions through local Realm databases, and complete bilingual support (French / Arabic with RTL layout support).

```
┌────────────────────────────────────────────────────────┐
│                   Presentation Layer                   │
│  - Electron + React + TypeScript (Desktop)             │
│  - React Native + Expo (Mobile)                        │
│  - Bilingual FR/AR, Offline-First UI                   │
└───────────────────────────┬────────────────────────────┘
                            │ Delegates actions & reads data
                            ▼
┌────────────────────────────────────────────────────────┐
│                     Service Layer                      │
│  - invoice.service.ts (Invoice lifecycle & payments)   │
│  - stock.service.ts (Atomic stock movements)           │
│  - payment.service.ts (Financial ledger tracking)      │
│  - Enforces business invariants, validation, & audit   │
└───────────────────────────┬────────────────────────────┘
                            │ Executes atomic transactions
                            ▼
┌────────────────────────────────────────────────────────┐
│                   Database Layer (Realm)               │
│  - Local-first embedded Realm database                 │
│  - Shared Schemas (`shared/models/Schemas.ts`)         │
│  - Immutable historical documents & event-sourced stock│
└────────────────────────────────────────────────────────┘
```

## Major Modules & Responsibilities

1. **Shared (`/shared`)**:
   - **Models (`/shared/models/Schemas.ts`)**: Defines Realm schemas and TypeScript interfaces for `Product`, `Invoice`, `InvoiceItem`, `StockMovement`, `Payment`, `Customer`, and `Settings`.
   - **Types (`/shared/types/index.ts`)**: Common API contracts, DTOs, and enumeration definitions.
   - **Utils (`/shared/utils/index.ts`)**: Formatters for currency, dates, bilingual translation helpers, and tax/fiscal constants.

2. **Desktop Application (`/smart-inventory-desktop`)**:
   - **Electron Main/Preload (`/smart-inventory-desktop/electron/`)**: Desktop shell configuration and bridge.
   - **State & Context (`/smart-inventory-desktop/src/models/RealmContext.ts`)**: React context provider managing Realm instance initialization and lifecycle.
   - **Services (`/smart-inventory-desktop/src/services/`)**:
     - `invoice.service.ts`: Handles draft creation, atomic confirmation (numbering, stock reduction, financial ledger init), cancellation with reversal, and payment recording.
     - `stock.service.ts`: Implements `_moveStockInTransaction()` ensuring pre-validation against negative inventory and audit trail generation.
     - `payment.service.ts`: Processes financial transactions against invoices with multiple modes (*Espèce*, *Chèque*, *Virement*, *Crédit*).
   - **UI Components (`/smart-inventory-desktop/src/components/`)**: Atomic presentation components including product management, cart, sales screen, invoice listings, and dialogs.

3. **Mobile Application (`/smart-inventory-mobile`)**:
   - React Native mobile client sharing the core Realm schemas and domain services for mobile-first touch workflows.

## Application Execution Flow
- **Initialization**: App launches, loads environment configuration, and instantiates Realm via `RealmContext` using schemas from `shared/models/Schemas.ts`.
- **Sales & Invoicing Workflow**:
  1. User builds cart in UI (`SalesScreen.tsx`, `Cart.tsx`).
  2. UI calls `InvoiceService.createDraft()` or directly confirms via service.
  3. `InvoiceService.confirm()` runs a single atomic `realm.write()` transaction: generating fiscal invoice numbers, recording `StockMovement` items, updating product quantities, and initializing financial records.
- **Stock Adjustment Workflow**:
  - All inventory changes invoke `StockService._moveStockInTransaction()` to guarantee traceable audit trails and prevent negative stock.

## Database Architecture
- **Realm Local-First**: Synchronizable local DB supporting fully offline operation.
- **Immutable Documents**: Confirmed invoices are never updated in-place; modifications or returns go through cancellation/reversal cycles.
- **Event-Sourced Inventory**: Stock states are projections of logged `StockMovement` records.
