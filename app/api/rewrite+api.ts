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

type ConversationMessage = {sender: "you" | "match"; text: string; createdAt?: number};

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

function startsWithGreeting(value: string) {
	return /^(?:hey|hello|hi|hiya)\b/i.test(value.trim());
}

function rewriteKnownShortPhrase(text: string, style: RewriteStyle): string | null {
	const compact = text.toLocaleLowerCase().replace(/[^\p{L}\p{N}]/gu, "");
	if (compact === "howareyousopretty") {
		const versions: Record<RewriteStyle, string> = {
			warm: "How do you look so lovely?",
			playful: "How are you this gorgeous?",
			flirty: "How do you manage to look so beautiful?",
		};
		return versions[style];
	}
	if (["yourecool", "youarecool", "urcool", "yourcool"].includes(compact)) {
		const versions: Record<RewriteStyle, string> = {
			warm: "You're really nice to talk to.",
			playful: "You're pretty cool, you know that?",
			flirty: "You're pretty charming, you know.",
		};
		return versions[style];
	}
	return null;
}

async function askOllama(
	text: string,
	style: RewriteStyle,
	history: ConversationMessage[],
	retryReason?: "unchanged" | "off-topic",
	previousOutput?: string,
	avoidNewGreeting = false,
) {
	const baseInstruction = retryReason
		? retryReason === "unchanged"
			? `Your previous output copied the draft verbatim. That is not a rewrite. Rephrase the draft now in a ${styleDirections[style]} tone using different words or sentence structure. Keep the same subject, meaning, and form. If it is a short compliment, preserve the same compliment but change the wording. Do not answer it or add information. No emojis or em dashes. Return one short message as JSON: {"message":"..."}.`
			: `Your previous output changed the topic. Rewrite only the user's draft in a ${styleDirections[style]} tone. Keep the same subject, meaning, and form. Change the wording naturally, but do not answer the draft or add information. No emojis or em dashes. Return one short message as JSON: {"message":"..."}.`
		: `Rewrite ONLY the user's draft as a natural ${styleDirections[style]} chat message. Keep its subject and meaning. Keep its form: greeting stays greeting, statement stays statement, question stays question. Do not reply to it, start a new topic, or add information that is not in the draft. Playful changes the wording only; do not invent jokes or scenarios. No emojis or em dashes. Return one short rewritten message as JSON: {"message":"..."}.`;
	const greetingInstruction = avoidNewGreeting
		? " The conversation has a message from within the last two hours. Do not begin the rewrite with hey, hello, hi, or another opening greeting. Continue directly from the user's draft and the recent conversation."
		: "";
	const instruction = `${baseInstruction}${greetingInstruction}`;

	const response = await fetch("http://127.0.0.1:11434/api/chat", {
		method: "POST",
		headers: {"Content-Type": "application/json"},
		connectTimeout: 120_000,
		body: JSON.stringify({
			model: "qwen3:4b",
			stream: false,
			think: false,
			keep_alive: "10m",
			options: {num_predict: 120, temperature: retryReason ? 0.9 : 0.75},
			format: rewriteSchema,
			messages: [
				{role: "system", content: instruction},
				{
					role: "user",
					content: JSON.stringify({
						draft: text,
						previousOutput,
						style,
						// A retry drops context so earlier messages cannot distract the model.
						recentConversation: retryReason ? [] : history.slice(-1),
					}),
				},
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
	const knownShortRewrite = rewriteKnownShortPhrase(text, style);
	if (knownShortRewrite) {
		return Response.json({message: knownShortRewrite, rewritten: true});
	}
	const history: ConversationMessage[] = Array.isArray(body.history)
		? body.history
				.filter(isRecord)
				.slice(-8)
				.map((item) => ({
					sender: item.sender === "match" ? ("match" as const) : ("you" as const),
					text: typeof item.text === "string" ? item.text.trim().slice(0, 300) : "",
					createdAt: typeof item.createdAt === "number" ? item.createdAt : undefined,
				}))
				.filter((item) => item.text.length > 0)
		: [];
	const latestMatchMessage = [...history]
		.reverse()
		.find((message) => message.sender === "match");
	const rewriteContext = latestMatchMessage ? [latestMatchMessage] : [];
	const sourceContext = `${text} ${rewriteContext.map((item) => item.text).join(" ")}`;
	const latestMessageAt = Math.max(0, ...history.map((message) => message.createdAt ?? 0));
	const recentConversation =
		latestMessageAt > 0 &&
		Date.now() >= latestMessageAt &&
		Date.now() - latestMessageAt <= 2 * 60 * 60 * 1000;
	const avoidNewGreeting = recentConversation && !startsWithGreeting(text);
	const simpleGreeting = text.toLocaleLowerCase().replace(/[.!?\s]/g, "");
	if (["hi", "hello", "hey", "hiya"].includes(simpleGreeting) && !recentConversation) {
		const greetingByStyle: Record<RewriteStyle, string> = {
			warm: "Hi there!",
			playful: "Hey there!",
			flirty: "Hello, you.",
		};
		return Response.json({message: greetingByStyle[style], rewritten: true});
	}

	try {
		let rewritten = "";
		let retryReason: "unchanged" | "off-topic" | undefined;
		for (let attempt = 0; attempt < 3; attempt += 1) {
			rewritten = await askOllama(
				text,
				style,
				rewriteContext,
				retryReason,
				attempt > 0 ? rewritten : undefined,
				avoidNewGreeting,
			);
			const unchanged = normalizeMessage(rewritten) === normalizeMessage(text);
			const offTopic =
				hasGenericOpenerDrift(rewritten, sourceContext) ||
				(avoidNewGreeting && startsWithGreeting(rewritten));
			if (!unchanged && !offTopic) break;
			retryReason = unchanged ? "unchanged" : "off-topic";
		}
		if (
			normalizeMessage(rewritten) === normalizeMessage(text) ||
			hasGenericOpenerDrift(rewritten, sourceContext) ||
			(avoidNewGreeting && startsWithGreeting(rewritten))
		) {
			return Response.json({message: text, rewritten: false});
		}
		return Response.json({message: rewritten, rewritten: true});
	} catch (error) {
		console.error("[rewrite] Ollama request failed", error);
		return Response.json({error: "Could not connect to Ollama."}, {status: 502});
	}
}
