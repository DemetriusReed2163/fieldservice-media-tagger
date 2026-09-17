export {};

const imagePath = process.argv[2];
if (!imagePath) throw new Error("Run with: npm run example -- ./photo.jpg");

const { readFile } = await import("node:fs/promises");
const imageBase64 = (await readFile(imagePath)).toString("base64");
const response = await fetch("http://localhost:3000/work-order-photos", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    workOrderId: "WO-1842",
    filename: "compressor-panel.jpg",
    imageBase64,
    dispatchStatus: "completed",
    technicianFollowUp: "parts_needed",
    capturedAt: "2026-09-03T08:30:00.000Z"
  })
});

console.log(JSON.stringify(await response.json(), null, 2));
if (!response.ok) process.exitCode = 1;
