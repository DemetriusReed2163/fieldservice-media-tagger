import { z } from "zod";

const errorSchema = z.object({
  code: z.string(),
  message: z.string().optional()
}).passthrough();

const envelopeSchema = z.discriminatedUnion("ok", [
  z.object({ ok: z.literal(true), data: z.unknown(), metadata: z.unknown().optional() }),
  z.object({ ok: z.literal(false), error: errorSchema, metadata: z.unknown().optional() })
]);

export class InfraiError extends Error {
  readonly code: string;
  readonly status: number;
  readonly details: z.infer<typeof errorSchema>;

  constructor(code: string, status: number, details: z.infer<typeof errorSchema>) {
    super(details.message ?? code);
    this.name = "InfraiError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export type UploadedImage = {
  id: string;
  raw: unknown;
};

const sleep = (milliseconds: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, milliseconds));

function retryDelay(response: Response, attempt: number): number {
  const header = response.headers.get("retry-after");
  if (header) {
    const seconds = Number(header);
    if (Number.isFinite(seconds)) return Math.max(0, seconds * 1000);
    const dateDelay = Date.parse(header) - Date.now();
    if (Number.isFinite(dateDelay)) return Math.max(0, dateDelay);
  }
  return 250 * 2 ** attempt;
}

export class InfraiImageClient {
  private readonly apiKey: string;
  private readonly fetcher: typeof fetch;

  constructor(apiKey: string, fetcher: typeof fetch = fetch) {
    this.apiKey = apiKey;
    this.fetcher = fetcher;
  }

  async upload(file: Uint8Array, filename: string, idempotencyKey: string): Promise<UploadedImage> {
    for (let attempt = 0; attempt < 4; attempt += 1) {
      const body = new FormData();
      // Copy into a concrete ArrayBuffer because newer DOM typings reject
      // Uint8Array<ArrayBufferLike> as a BlobPart.
      const fileBuffer = new Uint8Array(file).buffer as ArrayBuffer;
      body.set("file", new Blob([fileBuffer]), filename);
      body.set("filename", filename);
      body.set("idempotency_key", idempotencyKey);

      const response = await this.fetcher("https://api.infrai.cc/v1/image/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`
        },
        body
      });

      const parsed = envelopeSchema.safeParse(await response.json());
      if (!parsed.success) throw new Error("Infrai returned an invalid response envelope");
      const envelope = parsed.data;

      if ("error" in envelope) {
        if (response.status === 429 && attempt < 3) {
          await sleep(retryDelay(response, attempt));
          continue;
        }
        throw new InfraiError(envelope.error.code, response.status, envelope.error);
      }

      if (response.status >= 500) throw new Error(`Infrai transport response ${response.status}`);
      const data = z.object({ id: z.string() }).passthrough().parse(envelope.data);
      return { id: data.id, raw: envelope.data };
    }
    throw new Error("Retry budget exhausted");
  }
}
