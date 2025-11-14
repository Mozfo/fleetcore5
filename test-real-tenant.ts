import "dotenv/config";
import { validateSortBy, type SortFieldWhitelist } from "./lib/core/validation";

const REAL_TENANT_ID = "550e8400-e29b-41d4-a716-446655440001";
const TEST_WHITELIST: SortFieldWhitelist = [
  "id",
  "email",
  "created_at",
] as const;

process.stdout.write("Testing validateSortBy with real tenant\n\n");

try {
  validateSortBy("password", TEST_WHITELIST, REAL_TENANT_ID);
} catch (_error) {
  process.stdout.write("Test 1 PASS: Injection blocked\n");
}

try {
  validateSortBy("deleted_at", TEST_WHITELIST, REAL_TENANT_ID);
} catch (_error) {
  process.stdout.write("Test 2 PASS: Injection blocked\n");
}

setTimeout(() => {
  process.stdout.write("\nDone. Check database:\n");
  process.stdout.write(
    "SELECT * FROM adm_audit_logs WHERE tenant_id = '" + REAL_TENANT_ID + "'\n"
  );
  process.stdout.write(
    "AND action = 'validation_failed' ORDER BY timestamp DESC LIMIT 2;\n"
  );
  process.exit(0);
}, 2000);
