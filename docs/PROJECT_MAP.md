# Project Map

```
D:\project yasine\
├── CLAUDE.md                      # Primary developer & Claude guidance
├── package.json                   # Root monorepo configuration
├── shared/                        # Shared domain logic across platforms
│   ├── models/
│   │   └── Schemas.ts             # Realm database schemas & TS interfaces
│   ├── types/
│   │   └── index.ts               # Shared types & API contracts
│   └── utils/
│       └── index.ts               # Currency, date, & bilingual formatters
├── smart-inventory-desktop/       # Electron desktop application
│   ├── electron/                  # Electron main & preload scripts
│   └── src/
│       ├── App.tsx                # Main desktop application shell
│       ├── main.tsx               # Entry point
│       ├── models/
│       │   └── RealmContext.ts    # Realm provider & initialization
│       ├── services/              # Domain business logic (NO direct UI writes)
│       │   ├── invoice.service.ts # Invoice lifecycle & transaction coordination
│       │   ├── payment.service.ts # Financial ledger payment processing
│       │   └── stock.service.ts   # Atomic stock movements & audit logging
│       ├── components/            # UI presentation components
│       │   ├── Cart.tsx           # Sales cart management
│       │   ├── ConfirmDialog.tsx  # Confirmation modals
│       │   ├── ProductForm.tsx    # Product creation/editing form
│       │   ├── ProductHeader.tsx  # Header component
│       │   ├── ProductList.tsx    # Inventory product table/grid
│       │   ├── ProductSearch.tsx  # Search & filter component
│       │   ├── SalesScreen.tsx    # POS / Sales interface
│       │   └── SaleToast.tsx      # Notification toasts
│       └── styles/                # CSS stylesheets with RTL support
└── smart-inventory-mobile/        # React Native (Expo) mobile application
    ├── App.tsx                    # Mobile entry point
    └── src/                       # Mobile-specific screens & components
```

## Key File Responsibilities
- **`shared/models/Schemas.ts`**: The single source of truth for database entities (Product, Invoice, StockMovement, Payment, Customer, Settings).
- **`smart-inventory-desktop/src/services/invoice.service.ts`**: Coordinates invoice creation, atomic confirmation (numbering, inventory reduction, payment initialization), and cancellation.
- **`smart-inventory-desktop/src/services/stock.service.ts`**: Enforces strict stock validation and records audit movements.
- **`smart-inventory-desktop/src/services/payment.service.ts`**: Manages payment ledgers and invoice balance updates.
- **`smart-inventory-desktop/src/models/RealmContext.ts`**: Supplies the reactive Realm database instance to React component trees.
