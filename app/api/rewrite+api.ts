type JsonRecord = Record<string, unknown>;
type RewriteStyle = "warm" | "playful" | "flirty";

function isRecord(value: unknown): value is JsonRecord {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

const rewriteSchema = {
	type: "object",
	properties: {
		message: {type: "string", maxLength: 300},
	},
	required: ["message"],
	additionalProperties: false,
};

const styleDirections: Record<RewriteStyle, string> = {
	warm: "warm and natural",
	playful: "light and playful",
	flirty: "charming and respectfully flirty",
};

function normalizeMessage(value: string) {
	return value.trim().toLocaleLowerCase().replace(/[.!?\s]+$/g, "");
}

async function askOllama(text: string, style: RewriteStyle, retry: boolean) {
	const instruction = retry
		? `Your previous answer did not change the draft. Rewrite it with a clearly different wording while preserving its intent. For a greeting, make it a short conversational opener. Do not return the draft verbatim.`
		: `Rewrite the user's draft in a ${styleDirections[style]} tone. You are rewriting, not proofreading. The result MUST use noticeably different wording from the draft while preserving its intent. Do not invent facts, promises, or events. Keep the result to one concise sentence (under 18 words). For a one-word greeting, turn it into a natural brief opener. Examples for "hey": warm: "Hey! How's your day going?"; playful: "Hey! What's been making you smile?"; flirty: "Hey gorgeous, what are you up to?" Return JSON only as {"message":"..."}.`;

	const response = await fetch("http://127.0.0.1:11434/api/chat", {
		method: "POST",
		headers: {"Content-Type": "application/json"},
		connectTimeout: 120_000,
		body: JSON.stringify({
			model: "qwen3:4b",
			stream: false,
			think: false,
			keep_alive: "10m",
			options: {num_predict: 120},
			format: rewriteSchema,
			messages: [
				{role: "system", content: instruction},
				{role: "user", content: JSON.stringify({draft: text, style})},
			],
		}),
	} as RequestInit & {connectTimeout: number});

	if (!response.ok) throw new Error("Ollama could not rewrite the message.");
	const data: unknown = await response.json();
	if (!isRecord(data) || !isRecord(data.message) || typeof data.message.content !== "string") {
		throw new Error("Ollama returned an invalid response.");
	}

	const result: unknown = JSON.parse(data.message.content);
	if (!isRecord(result) || typeof result.message !== "string" || !result.message.trim()) {
		throw new Error("Ollama returned no rewritten message.");
	}
	return result.message.trim().slice(0, 300);
}

export async function POST(request: Request) {
	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return Response.json({error: "Invalid JSON request."}, {status: 400});
	}

	if (!isRecord(body) || typeof body.text !== "string") {
		return Response.json({error: "A message is required."}, {status: 400});
	}

	const text = body.text.trim().slice(0, 500);
	const style = body.style;
	if (!text) {
		return Response.json({error: "A message is required."}, {status: 400});
	}
	if (style !== "warm" && style !== "playful" && style !== "flirty") {
		return Response.json({error: "Choose a valid rewrite style."}, {status: 400});
	}

	try {
		let rewritten = await askOllama(text, style, false);
		if (normalizeMessage(rewritten) === normalizeMessage(text)) {
			rewritten = await askOllama(text, style, true);
		}
		if (normalizeMessage(rewritten) === normalizeMessage(text)) {
			return Response.json(
				{error: "The AI returned your original text. Try again or turn rewrite mode off."},
				{status: 502},
			);
		}
		return Response.json({message: rewritten});
	} catch (error) {
		console.error("[rewrite] Ollama request failed", error);
		return Response.json({error: "Could not connect to Ollama."}, {status: 502});
	}
}
