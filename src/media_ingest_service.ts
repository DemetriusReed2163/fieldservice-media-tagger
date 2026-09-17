import express from "express";
import { ZodError } from "zod";
import { InfraiError, InfraiImageClient } from "./infrai_image_client.js";
import { photoRequestSchema, tagsForWorkOrder } from "./work_order_tags.js";

const apiKey = process.env.INFRAI_API_KEY;
if (!apiKey) throw new Error("INFRAI_API_KEY is required");

const app = express();
const images = new InfraiImageClient(apiKey);

app.use(express.json({ limit: "12mb" }));

app.post("/work-order-photos", async (request, response) => {
  try {
    const input = photoRequestSchema.parse(request.body);
    const bytes = Buffer.from(input.imageBase64, "base64");
    if (bytes.length === 0) return response.status(400).json({ error: "imageBase64 decoded to an empty file" });

    const idempotencyKey = `work-order-photo:${input.workOrderId}:${input.filename}:${input.capturedAt}`;
    const uploaded = await images.upload(bytes, input.filename, idempotencyKey);
    return response.status(201).json({
      imageId: uploaded.id,
      workOrderId: input.workOrderId,
      tags: tagsForWorkOrder(input)
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return response.status(400).json({ error: "invalid_request", issues: error.issues });
    }
    if (error instanceof InfraiError) {
      const status = error.status >= 400 && error.status < 500 ? error.status : 502;
      return response.status(status).json({ error: error.code, details: error.details });
    }
    console.error("photo ingest failed", error);
    return response.status(502).json({ error: "photo_ingest_failed" });
  }
});

const port = Number(process.env.PORT ?? 3000);
app.listen(port, () => console.log(`field-service media ingest listening on :${port}`));
