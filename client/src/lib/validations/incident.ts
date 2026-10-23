import { z } from "zod";

export const IncidentPriorityEnum = z.enum(["low", "medium", "high"]);
export const IncidentStatusEnum = z.enum(["open", "in_progress", "pending", "resolved"]);

export const ValidStatusTransitions: Record<
  z.infer<typeof IncidentStatusEnum>,
  z.infer<typeof IncidentStatusEnum>[]
> = {
  open: ["in_progress"],
  in_progress: ["pending", "resolved"],
  pending: ["in_progress", "resolved"],
  resolved: ["open"], // Re-opening only with authorized recorded reason
};

export function canTransitionStatus(
  currentStatus: z.infer<typeof IncidentStatusEnum>,
  newStatus: z.infer<typeof IncidentStatusEnum>,
  userRole: string
): { allowed: boolean; reason?: string } {
  if (currentStatus === newStatus) {
    return { allowed: false, reason: "Status is already set to this value." };
  }

  // Contractors cannot resolve or reopen incidents directly
  if (userRole === "contractor") {
    if (newStatus === "resolved") {
      return { allowed: false, reason: "Contractors cannot sign off and resolve tickets. A maintenance manager or admin must verify." };
    }
    if (currentStatus === "resolved") {
      return { allowed: false, reason: "Contractors cannot reopen resolved incidents." };
    }
  }

  const allowedNext = ValidStatusTransitions[currentStatus];
  if (!allowedNext || !allowedNext.includes(newStatus)) {
    return {
      allowed: false,
      reason: `Invalid state transition from '${currentStatus}' to '${newStatus}'.`,
    };
  }

  return { allowed: true };
}

export const createIncidentSchema = z
  .object({
    zone_id: z.string().uuid("Please select a valid operational zone"),
    site_id: z.string().uuid("Please select a valid site").nullable().optional(),
    category_id: z.string().uuid("Please select an equipment category"),
    camera_number: z.string().trim().max(50, "Camera number cannot exceed 50 characters").optional(),
    exact_location: z
      .string()
      .trim()
      .min(3, "Exact location must be at least 3 characters")
      .max(250, "Exact location cannot exceed 250 characters"),
    priority: IncidentPriorityEnum,
    description: z
      .string()
      .trim()
      .min(10, "Description must be at least 10 characters")
      .max(3000, "Description cannot exceed 3000 characters"),
    requires_camera_number: z.boolean().optional(),
  })
  .refine(
    (data) => {
      if (data.requires_camera_number && (!data.camera_number || data.camera_number.trim().length === 0)) {
        return false;
      }
      return true;
    },
    {
      message: "Camera / Asset reference number is mandatory for this category",
      path: ["camera_number"],
    }
  );

export type CreateIncidentInput = z.infer<typeof createIncidentSchema>;

export const serviceReportSchema = z.object({
  incident_id: z.string().uuid(),
  report_reference: z.string().trim().max(50).optional(),
  findings: z.string().trim().min(5, "Findings must be at least 5 characters").max(3000),
  work_performed: z.string().trim().min(5, "Work performed must be at least 5 characters").max(3000),
  recommended_action: z.string().trim().max(1000).optional(),
  completion_status: z.enum(["work_completed", "parts_required", "further_investigation"]),
});

export type ServiceReportInput = z.infer<typeof serviceReportSchema>;

export const quotationSchema = z.object({
  incident_id: z.string().uuid(),
  quotation_reference: z.string().trim().min(2, "Quotation reference required").max(60),
  amount: z.number().min(0, "Amount must be a non-negative number").max(10000000, "Amount exceeds system limit"),
  currency: z.literal("AED"),
  review_notes: z.string().trim().max(1000).optional(),
});

export type QuotationInput = z.infer<typeof quotationSchema>;
