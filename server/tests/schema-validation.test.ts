import { describe, it, expect } from "vitest";
import { validateMigrations } from "../scripts/validate-migrations";

describe("Database Migrations & Security Validation", () => {
  it("should contain all 17 required PostgreSQL tables and have RLS enabled on every single table", () => {
    const result = validateMigrations();
    expect(result.errors).toEqual([]);
    expect(result.success).toBe(true);
    expect(result.tablesFound.length).toBeGreaterThanOrEqual(17);
  });
});
