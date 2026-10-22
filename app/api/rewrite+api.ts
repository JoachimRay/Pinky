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

type ConversationMessage = {sender: "you" | "match"; text: string};

function normalizeMessage(value: string) {
	return value.trim().toLocaleLowerCase().replace(/[.!?\s]+$/g, "");
}

function hasGenericOpenerDrift(value: string, source: string) {
	const normalizedValue = value.toLocaleLowerCase();
	const normalizedSource = source.toLocaleLowerCase();
	const genericOpeners = [
		"making you smile",
		"highlight of your week",
		"looking forward to",
		"how has your week",
		"how's your week",
	];
	return genericOpeners.some(
		(phrase) => normalizedValue.includes(phrase) && !normalizedSource.includes(phrase),
	);
}

async function askOllama(
	text: string,
	style: RewriteStyle,
	history: ConversationMessage[],
	retry: boolean,
) {
	const instruction = retry
		? `The previous rewrite was unsuitable. Rewrite the user's exact draft in a ${styleDirections[style]} tone. Preserve the same topic, meaning, and intent. Use the conversation history only to make the wording fit as the user's next message. Do not answer the draft, replace it with a conversation opener, or introduce a new topic. Do not invent facts. Return one concise sentence as JSON: {"message":"..."}.`
		: `Rewrite the user's exact draft in a ${styleDirections[style]} tone. Preserve its topic, meaning, and intent; do not answer it or replace it with a different message. Use the recent conversation only to make the wording fit naturally as the user's next message. Never turn an observation into an unrelated question, and never use a generic opener unless the draft itself is an opener. Do not add facts, promises, or events. Keep it concise and return only JSON in this shape: {"message":"..."}.`;

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
				{role: "user", content: JSON.stringify({draft: text, style, recentConversation: history})},
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
	const history: ConversationMessage[] = Array.isArray(body.history)
		? body.history
				.filter(isRecord)
				.slice(-8)
				.map((item) => ({
					sender: item.sender === "match" ? ("match" as const) : ("you" as const),
					text: typeof item.text === "string" ? item.text.trim().slice(0, 300) : "",
				}))
				.filter((item) => item.text.length > 0)
		: [];
	const sourceContext = `${text} ${history.map((item) => item.text).join(" ")}`;

	try {
		let rewritten = await askOllama(text, style, history, false);
		if (
			normalizeMessage(rewritten) === normalizeMessage(text) ||
			hasGenericOpenerDrift(rewritten, sourceContext)
		) {
			rewritten = await askOllama(text, style, history, true);
		}
		if (
			normalizeMessage(rewritten) === normalizeMessage(text) ||
			hasGenericOpenerDrift(rewritten, sourceContext)
		) {
			return Response.json(
				{error: "The AI could not rewrite your draft without changing its meaning. Your draft is still available."},
				{status: 502},
			);
		}
		return Response.json({message: rewritten});
	} catch (error) {
		console.error("[rewrite] Ollama request failed", error);
		return Response.json({error: "Could not connect to Ollama."}, {status: 502});
	}
}
