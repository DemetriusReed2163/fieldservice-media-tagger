import { z } from "zod";

export const photoRequestSchema = z.object({
  workOrderId: z.string().trim().min(1).max(80),
  filename: z.string().trim().min(1).max(180),
  imageBase64: z.string().min(1),
  dispatchStatus: z.enum(["scheduled", "en_route", "on_site", "completed"]),
  technicianFollowUp: z.enum(["none", "parts_needed", "return_visit", "customer_contact"]),
  capturedAt: z.iso.datetime()
});

export type PhotoRequest = z.infer<typeof photoRequestSchema>;

export function tagsForWorkOrder(input: PhotoRequest): string[] {
  const tags = [
    `work-order:${input.workOrderId}`,
    `dispatch:${input.dispatchStatus}`,
    `follow-up:${input.technicianFollowUp}`,
    `captured-date:${input.capturedAt.slice(0, 10)}`
  ];

  if (input.dispatchStatus === "completed" && input.technicianFollowUp === "none") {
    tags.push("resolution:closed");
  } else if (input.technicianFollowUp !== "none") {
    tags.push("attention:required");
  } else {
    tags.push("resolution:active");
  }

  return tags;
}
