import { createServer } from "node:http";
import { Buffer } from "node:buffer";

// Queues live only for this server process. Pinky persists delivered messages.
const queues = new Map();
let nextId = 0;

const server = createServer(async (request, response) => {
  response.setHeader("Content-Type", "application/json");
  response.setHeader("Access-Control-Allow-Origin", "*");
  response.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type");
  response.setHeader("Cache-Control", "no-store");
  const send = (status, data) => {
    response.writeHead(status);
    response.end(JSON.stringify(data));
  };
  if (request.method === "OPTIONS") return send(204, null);
  const url = new URL(request.url, "http://127.0.0.1:4317");
  if (url.pathname !== "/replies") return send(404, { error: "Not found" });

  if (request.method === "GET") {
    const matchId = Number(url.searchParams.get("matchId"));
    if (!Number.isSafeInteger(matchId) || matchId <= 0) {
      return send(400, { error: "A positive integer matchId is required." });
    }
    const replies = queues.get(matchId) ?? [];
    queues.delete(matchId);
    return send(200, { replies });
  }

  if (request.method !== "POST") return send(405, { error: "Use GET or POST." });
  try {
    let raw = "";
    for await (const chunk of request) {
      raw += chunk;
      if (Buffer.byteLength(raw) > 16_384) {
        return send(413, { error: "Request body is too large." });
      }
    }
    const body = JSON.parse(raw);
    if (!body || !Number.isSafeInteger(body.matchId) || body.matchId <= 0 ||
        typeof body.text !== "string" || !body.text.trim() || body.text.length > 4000) {
      return send(400, { error: "Provide a positive integer matchId and text (1–4000 characters)." });
    }
    const reply = {
      id: `mock-${Date.now()}-${++nextId}`,
      matchId: body.matchId,
      text: body.text.trim(),
      createdAt: Date.now(),
    };
    const queue = queues.get(body.matchId) ?? [];
    if (queue.length >= 100) return send(429, { error: "This match's queue is full." });
    queues.set(body.matchId, [...queue, reply]);
    return send(201, reply);
  } catch {
    return send(400, { error: "Invalid JSON request." });
  }
});

server.on("error", (error) => {
  console.error(`Mock chat server: ${error.message}`);
  process.exitCode = 1;
});
server.listen(4317, "127.0.0.1", () => {
  console.log("Mock chat ready at http://127.0.0.1:4317/replies");
  console.log('POST { "matchId": 2, "text": "Hello!" } to queue an incoming message.');
});
