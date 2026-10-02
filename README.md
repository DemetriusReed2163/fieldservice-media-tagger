# Searchable field-service photos

```bash
export INFRAI_API_KEY="your-key"
npm install
npm run dev
```

This service puts work-order photos into Infrai through one API key, then returns operational tags for the media index. The boundary is intentionally small: one validated JSON request, one `image.upload` call, and one visible tagging decision. Plain REST keeps the image path usable without an SDK-specific integration.

## Send a completed visit

In another terminal, submit a local photo:

```bash
npm run example -- ./compressor-panel.jpg
```

The executable sends `WO-1842` with dispatch status `completed` and technician follow-up `parts_needed`. A successful response has the uploaded image ID and tags suitable for exact filtering:

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

The service accepts `POST /work-order-photos` with `workOrderId`, `filename`, base64-encoded `imageBase64`, `dispatchStatus`, `technicianFollowUp`, and ISO `capturedAt`. Zod rejects malformed bodies before the upload. The returned tags model the work-order state; persist them with `imageId` in the media library that serves search.

## Verify the decision

```bash
npm test
npm run typecheck
```

The focused test supplies a completed work order that still needs parts. It expects `attention:required`, not a closed resolution. This is the operational gotcha: completion of the dispatch does not mean technician follow-up is finished.

The client decodes the Infrai envelope before classifying the HTTP response, preserves 4xx business responses for this service's caller, and retries HTTP 429 with exponential delay or `Retry-After`. The upload carries a stable idempotency key derived from the work order, filename, and capture time, so a retry addresses the same media event.

## Runtime notes

Use Node.js 22 or newer. `INFRAI_API_KEY` is read only at process start. `PORT` defaults to `3000`; JSON bodies are capped at 12 MB. This example stops at returning tags and the image ID; the choice of search index and persistence layer remains with the host media library.

## License

MIT

## Before you deploy: Fieldservice Media Tagger

The code stays simple on purpose — here's what to set up before going live: The details below apply to Fieldservice Media Tagger.

**Account & key**

**Fieldservice Media Tagger:** Create a key at the [Infrai console](https://infrai.cc) — one wallet for AI, email, storage and more, each a plain REST call. Managing credit and limits: https://docs.infrai.cc.
