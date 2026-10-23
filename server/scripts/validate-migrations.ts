import fs from "node:fs";
import path from "node:path";

const MIGRATIONS_DIR = path.resolve(__dirname, "../migrations");

const REQUIRED_TABLES = [
  "communities",
  "zones",
  "sites",
  "equipment_categories",
  "service_providers",
  "profiles",
  "provider_memberships",
  "category_provider_routing",
  "incidents",
  "incident_attachments",
  "incident_status_history",
  "incident_comments",
  "service_reports",
  "quotations",
  "purchase_orders",
  "notification_outbox",
  "audit_logs"
];

export function validateMigrations(): { success: boolean; errors: string[]; tablesFound: string[] } {
  const errors: string[] = [];
  const tablesFound: Set<string> = new Set();
  const rlsEnabledTables: Set<string> = new Set();

  if (!fs.existsSync(MIGRATIONS_DIR)) {
    return { success: false, errors: [`Migrations directory not found at ${MIGRATIONS_DIR}`], tablesFound: [] };
  }

  const migrationFiles = fs.readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  if (migrationFiles.length === 0) {
    return { success: false, errors: ["No .sql migration files found in migrations/"], tablesFound: [] };
  }

  for (const file of migrationFiles) {
    const fullPath = path.join(MIGRATIONS_DIR, file);
    const content = fs.readFileSync(fullPath, "utf-8");

    // Check table creations
    const tableRegex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:public\.)?([a-zA-Z0-9_]+)/gi;
    let match;
    while ((match = tableRegex.exec(content)) !== null) {
      tablesFound.add(match[1]);
    }

    // Check RLS enablement
    const rlsRegex = /ALTER\s+TABLE\s+(?:public\.)?([a-zA-Z0-9_]+)\s+ENABLE\s+ROW\s+LEVEL\s+SECURITY/gi;
    while ((match = rlsRegex.exec(content)) !== null) {
      rlsEnabledTables.add(match[1]);
    }
  }

  // Validate all 17 required tables exist
  for (const reqTable of REQUIRED_TABLES) {
    if (!tablesFound.has(reqTable)) {
      errors.push(`Missing mandatory table creation: '${reqTable}'`);
    }
    if (!rlsEnabledTables.has(reqTable)) {
      errors.push(`Missing Row Level Security (RLS) enablement for table: '${reqTable}'`);
    }
  }

  return {
    success: errors.length === 0,
    errors,
    tablesFound: Array.from(tablesFound)
  };
}

if (require.main === module || process.argv[1]?.includes("validate-migrations")) {
  const result = validateMigrations();
  if (result.success) {
    console.log(`✅ All ${result.tablesFound.length} database tables and RLS policies successfully validated!`);
    process.exit(0);
  } else {
    console.error("❌ Migration validation errors found:");
    result.errors.forEach((e) => console.error(`  - ${e}`));
    process.exit(1);
  }
}
