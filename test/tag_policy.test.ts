import assert from "node:assert/strict";
import test from "node:test";
import { photoRequestSchema, tagsForWorkOrder } from "../src/work_order_tags.js";

test("a completed visit needing parts remains searchable as requiring attention", () => {
  const photo = photoRequestSchema.parse({
    workOrderId: "WO-1842",
    filename: "compressor-panel.jpg",
    imageBase64: "AQID",
    dispatchStatus: "completed",
    technicianFollowUp: "parts_needed",
    capturedAt: "2026-09-03T08:30:00.000Z"
  });

  assert.deepEqual(tagsForWorkOrder(photo), [
    "work-order:WO-1842",
    "dispatch:completed",
    "follow-up:parts_needed",
    "captured-date:2026-09-03",
    "attention:required"
  ]);
});
