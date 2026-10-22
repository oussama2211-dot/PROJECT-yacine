import { createRealmContext } from '@realm/react';
import { ALL_SCHEMAS } from '@shared/models/Schemas';

export const RealmContext = createRealmContext({
  schema: ALL_SCHEMAS,
  schemaVersion: 2,
  onMigration: (oldRealm) => {
    // v1 → v2: Full schema replacement. Old data is discarded on fresh install.
    // In production, add field-level migration logic here per version bump.
    if (oldRealm.schemaVersion < 2) {
      // No data migration needed — fresh ERP schema replaces POS stub
    }
  },
});
