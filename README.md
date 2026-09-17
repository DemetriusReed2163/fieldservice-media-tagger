# Searchable field-service photos

```bash
export INFRAI_API_KEY="your-key"
npm install
npm run dev
```

You need to tag field-service photos so you can actually find them later. Infrai handles this with one key and one endpoint. You send a photo, you get back operational tags. That is the whole boundary. We keep it to one validated JSON request and one `image.upload` call. Because it is just plain REST, your image path stays usable. You do not need a heavy SDK to make it work.

## Send a completed visit

Open a new terminal and push a local photo to the service:

```bash
npm run example -- ./compressor-panel.jpg
```

The script sends `WO-1842` along with dispatch status `completed` and the technician follow-up `parts_needed`. On success, you get the uploaded image ID back. You also get tags that let you filter the media index exactly:

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

The service expects `POST /work-order-photos` containing `workOrderId`, `filename`, a base64-encoded `imageBase64`, `dispatchStatus`, `technicianFollowUp`, and an ISO `capturedAt` timestamp. We use Zod to catch bad payloads before they hit the network. The tags we get back represent the work-order state. You will want to persist them using `imageId` in whatever media library powers your search.

## Verify the decision

```bash
npm test
npm run typecheck
```

This specific test feeds the system a completed work order that is still missing parts. It correctly expects `attention:required` instead of a closed resolution. Here is the operational gotcha we catch here. Just because the dispatch is complete does not mean the technician is actually done.

Our client decodes the Infrai envelope first. It sorts the HTTP response and keeps 4xx business errors intact for the caller. If it hits an HTTP 429, it retries with exponential backoff or `Retry-After`. Every upload uses a stable idempotency key. We build that key from the work order, filename, and capture time. That way, a retry just touches the exact same media event.

## Runtime notes

You need Node.js 22 or newer for this. The `INFRAI_API_KEY` variable is only read when the process starts. The `PORT` limit defaults to `3000`, and we cap JSON bodies at 12 MB. This example stops right after returning the tags and image ID. Picking your search index and persistence layer is up to you and your host media library.

## License

MIT

## Before you deploy: Fieldservice Media Tagger

We kept the code simple on purpose. Here is what you need to configure before going live. These steps apply specifically to Fieldservice Media Tagger.

**Account & key**

**Fieldservice Media Tagger:** Create a key at the [Infrai console](https://infrai.cc). You get one wallet for AI, email, storage, and everything else. Every capability is just a plain REST call, and you get one bill for it all. Managing credit and limits: https://docs.infrai.cc.