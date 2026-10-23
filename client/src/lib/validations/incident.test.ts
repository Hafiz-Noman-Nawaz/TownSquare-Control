import { describe, it, expect } from "vitest";
import {
  createIncidentSchema,
  canTransitionStatus,
} from "./incident";

describe("Incident Validation & Status Transition Rules", () => {
  const validUuid = "11111111-2222-3333-4444-555555555555";

  it("should validate a correct incident submission", () => {
    const validData = {
      zone_id: validUuid,
      site_id: validUuid,
      category_id: validUuid,
      camera_number: "CAM-01",
      exact_location: "IDF12 Level 3 Near Elevator",
      priority: "high" as const,
      description: "Camera feed is black and offline since 14:00.",
      requires_camera_number: true,
    };

    const result = createIncidentSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("should fail validation if category requires camera number but none is provided", () => {
    const invalidData = {
      zone_id: validUuid,
      category_id: validUuid,
      camera_number: "",
      exact_location: "IDF12 Level 3",
      priority: "medium" as const,
      description: "Camera feed flickers constantly.",
      requires_camera_number: true,
    };

    const result = createIncidentSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain("Camera / Asset reference number is mandatory");
    }
  });

  it("should allow empty camera number when requires_camera_number is false (e.g. UPS / Barrier)", () => {
    const validData = {
      zone_id: validUuid,
      category_id: validUuid,
      exact_location: "Main Barrier Entry Gate",
      priority: "low" as const,
      description: "Barrier arm sensor requires routine diagnostic check.",
      requires_camera_number: false,
    };

    const result = createIncidentSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("should enforce permitted status transitions", () => {
    // Open -> In Progress: Allowed for manager
    expect(canTransitionStatus("open", "in_progress", "maintenance_manager").allowed).toBe(true);

    // In Progress -> Resolved: Allowed for manager
    expect(canTransitionStatus("in_progress", "resolved", "maintenance_manager").allowed).toBe(true);

    // In Progress -> Resolved: BLOCKED for contractor
    const contractorResolve = canTransitionStatus("in_progress", "resolved", "contractor");
    expect(contractorResolve.allowed).toBe(false);
    expect(contractorResolve.reason).toContain("Contractors cannot sign off");

    // Open -> Resolved: BLOCKED directly (must go through in_progress)
    expect(canTransitionStatus("open", "resolved", "maintenance_manager").allowed).toBe(false);

    // Resolved -> Open: Allowed for super_admin
    expect(canTransitionStatus("resolved", "open", "super_admin").allowed).toBe(true);
  });
});
