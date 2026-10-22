import {createServer} from "node:http";

const HOST = "127.0.0.1";
const PORT = 4317;
const MAX_BODY_BYTES = 16 * 1024;
const replies = [];
let lastReplyId = Date.now();

function sendJson(response, status, body) {
	response.writeHead(status, {
		"Access-Control-Allow-Origin": "*",
		"Access-Control-Allow-Methods": "GET, POST, OPTIONS",
		"Access-Control-Allow-Headers": "Content-Type",
		"Cache-Control": "no-store",
		"Content-Type": "application/json; charset=utf-8",
	});
	response.end(JSON.stringify(body));
}

async function readJson(request) {
	let body = "";
	for await (const chunk of request) {
		body += chunk;
		if (Buffer.byteLength(body) > MAX_BODY_BYTES) {
			throw new Error("Request body is too large.");
		}
	}
	return JSON.parse(body);
}

const server = createServer(async (request, response) => {
	if (request.method === "OPTIONS") {
		response.writeHead(204, {
			"Access-Control-Allow-Origin": "*",
			"Access-Control-Allow-Methods": "GET, POST, OPTIONS",
			"Access-Control-Allow-Headers": "Content-Type",
		});
		response.end();
		return;
	}

	const url = new URL(request.url ?? "/", `http://${HOST}:${PORT}`);
	if (url.pathname === "/health" && request.method === "GET") {
		sendJson(response, 200, {ok: true});
		return;
	}

	if (url.pathname !== "/replies") {
		sendJson(response, 404, {error: "Route not found."});
		return;
	}

	if (request.method === "GET") {
		const matchId = Number(url.searchParams.get("matchId"));
		const after = Number(url.searchParams.get("after") ?? 0);
		if (!Number.isSafeInteger(matchId) || matchId <= 0 || !Number.isFinite(after)) {
			sendJson(response, 400, {error: "Provide a valid matchId and after cursor."});
			return;
		}
		const newReplies = replies.filter(
			(reply) => reply.matchId === matchId && reply.id > after,
		);
		sendJson(response, 200, {replies: newReplies});
		return;
	}

	if (request.method === "POST") {
		try {
			const body = await readJson(request);
			const matchId = Number(body?.matchId);
			const text = typeof body?.text === "string" ? body.text.trim() : "";
			if (!Number.isSafeInteger(matchId) || matchId <= 0 || !text) {
				sendJson(response, 400, {error: "Provide a positive matchId and non-empty text."});
				return;
			}
			if (text.length > 500) {
				sendJson(response, 400, {error: "Reply text must be 500 characters or fewer."});
				return;
			}

			const createdAt = Date.now();
			lastReplyId = Math.max(createdAt, lastReplyId + 1);
			const reply = {id: lastReplyId, matchId, text, createdAt};
			replies.push(reply);
			sendJson(response, 201, {reply});
		} catch (error) {
			sendJson(response, 400, {
				error: error instanceof Error ? error.message : "Invalid JSON request.",
			});
		}
		return;
	}

	sendJson(response, 405, {error: "Method not allowed."});
});

server.listen(PORT, HOST, () => {
	console.log(`Pinky mock chat server listening at http://${HOST}:${PORT}`);
	console.log("Post replies with POST /replies using { matchId, text }.");
});
