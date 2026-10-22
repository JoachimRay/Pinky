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

function cleanRewrite(value: string) {
	return value
		.replace(/[\p{Extended_Pictographic}\p{Emoji_Presentation}\p{Regional_Indicator}\uFE0F\u200D]/gu, "")
		.replace(/[—–]/g, ",")
		.replace(/\s*,\s*/g, ", ")
		.replace(/\s+/g, " ")
		.trim();
}

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
		? `The previous result was rejected. Rephrase the user's draft in a ${styleDirections[style]} tone. Use different wording and sentence structure while keeping the same topic, meaning, and form. A greeting stays a greeting, a statement stays a statement, and a question stays a question. Conversation history is context only. Do not answer the draft or add facts, compliments, questions, names, plans, or events not present in it. Do not use emojis or em dashes. Return one concise sentence as JSON: {"message":"..."}.`
		: `Rephrase the user's draft in a ${styleDirections[style]} tone. Make a natural wording change while preserving the same topic, meaning, and form. A greeting stays a greeting, a statement stays a statement, and a question stays a question. Use conversation history only to understand context, not to add content. Do not answer the draft or add facts, compliments, questions, names, plans, or events not present in it. Playful means light wording, not an invented joke or scenario. Do not use emojis or em dashes. Keep it concise and return only JSON in this shape: {"message":"..."}.`;

	const response = await fetch("http://127.0.0.1:11434/api/chat", {
		method: "POST",
		headers: {"Content-Type": "application/json"},
		connectTimeout: 120_000,
		body: JSON.stringify({
			model: "qwen3:4b",
			stream: false,
			think: false,
			keep_alive: "10m",
			options: {num_predict: 120, temperature: retry ? 0.7 : 0.5},
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
	return cleanRewrite(result.message).slice(0, 300);
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
	const simpleGreeting = text.toLocaleLowerCase().replace(/[.!?\s]/g, "");
	if (["hi", "hello", "hey", "hiya"].includes(simpleGreeting)) {
		const greetingByStyle: Record<RewriteStyle, string> = {
			warm: "Hi there!",
			playful: "Hey there!",
			flirty: "Hello, you.",
		};
		return Response.json({message: greetingByStyle[style], rewritten: true});
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
			return Response.json({message: text, rewritten: false});
		}
		return Response.json({message: rewritten, rewritten: true});
	} catch (error) {
		console.error("[rewrite] Ollama request failed", error);
		return Response.json({error: "Could not connect to Ollama."}, {status: 502});
	}
}
