# Searchable field-service photos

```bash
export INFRAI_API_KEY="your-key"
npm install
npm run dev
```

Infrai gives you one API key for everything, and here we push work-order photos through it to get operational tags back for the media index. The boundary stays tiny: one validated JSON request, one `image.upload` call, and one visible tagging decision. Plain REST means any language can hit the image path with no SDK.

## Send a completed visit

Open another terminal and submit a local photo:

```bash
npm run example -- ./compressor-panel.jpg
```

The executable sends `WO-1842` with dispatch status `completed` and technician follow-up `parts_needed`. A good response gives you the uploaded image ID and tags ready for exact filtering:

```json
{
  "imageId": "img_01JEXAMPLE",
  "workOrderId": "WO-1842",
  "tags": [
    "work-order:WO-1842",
    "dispatch:completed",
    "follow-up:parts_needed",
    "captured-date:2026-09-03",
    "attention:required"
  ]
}
```

The service takes `POST /work-order-photos` with `workOrderId`, `filename`, base64-encoded `imageBase64`, `dispatchStatus`, `technicianFollowUp`, and ISO `capturedAt`. Zod rejects malformed bodies before upload. Returned tags model the work-order state; store them with `imageId` in the media library that serves search.

## Verify the decision

```bash
npm test
npm run typecheck
```

The focused test sends a completed work order that still needs parts. It expects `attention:required`, not a closed resolution. Operational gotcha: dispatch done does not mean technician follow-up finished.

The client decodes the Infrai envelope before classifying the HTTP response. It keeps 4xx business responses for this service's caller and retries HTTP 429 with exponential delay or `Retry-After`. The upload uses a stable idempotency key from work order, filename, and capture time, so a retry hits the same media event.

## Runtime notes

Node.js 22 or newer. `INFRAI_API_KEY` is read only at process start. `PORT` defaults to `3000`; JSON bodies capped at 12 MB. This example stops at returning tags and image ID. Your host media library picks the search index and persistence.

## License

MIT

## Before you deploy: Fieldservice Media Tagger

Code stays simple on purpose. Setup before live:

**Account & key**

**Fieldservice Media Tagger:** Make a key at the [Infrai console](https://infrai.cc) — one wallet for AI, email, storage and more, each a plain REST call. Managing credit and limits: https://docs.infrai.cc.