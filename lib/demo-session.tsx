import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Profile } from "@/types/profile";
import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
} from "react";
import { localDateKey } from "@/lib/suggestions";

export type Decision = "like" | "pass";
export type RewriteStyle = "warm" | "playful" | "flirty";

export type ChatMessage = {
	id: string;
	sender: "you" | "match" | "system";
	text: string;
	rewriteStyle?: RewriteStyle;
};

export type RewriteSettings = {
	enabled: boolean;
	style: RewriteStyle;
};

export type SuggestionSet = {
	kind: "opening" | "follow-up";
	suggestions: [string, string, string];
	generatedOn: string;
	refreshNumber: number;
};

type SavedSession = {
	decisions: Record<number, Decision>;
	matches: Profile[];
	messagesByMatchId: Record<number, ChatMessage[]>;
	suggestionSetsByMatchId: Record<number, SuggestionSet | undefined>;
	rewriteSettingsByMatchId: Record<number, RewriteSettings | undefined>;
	simulatedToday: string | null;
};

type DemoSession = SavedSession & {
	isHydrated: boolean;
	decide: (profile: Profile, decision: Decision) => boolean;
	sendMessage: (matchId: number, text: string, rewriteStyle?: RewriteStyle) => void;
	saveSuggestionSet: (matchId: number, set: SuggestionSet) => void;
	setRewriteEnabled: (matchId: number, enabled: boolean) => void;
	setRewriteStyle: (matchId: number, style: RewriteStyle) => void;
	seedDemoConversation: (profile: Profile) => void;
	advanceDemoDay: () => void;
};

const STORAGE_KEY = "pinky-demo-session-v1";

const emptySession: SavedSession = {
	decisions: {},
	matches: [],
	messagesByMatchId: {},
	suggestionSetsByMatchId: {},
	rewriteSettingsByMatchId: {},
	simulatedToday: null,
};

const DemoSessionContext = createContext<DemoSession | null>(null);

export function DemoSessionProvider({ children }: { children: React.ReactNode }) {
	const [session, setSession] = useState<SavedSession>(emptySession);
	const [isHydrated, setIsHydrated] = useState(false);

	useEffect(() => {
		let isMounted = true;

		async function restoreSession() {
			try {
				const saved = await AsyncStorage.getItem(STORAGE_KEY);
				if (saved && isMounted) {
					setSession({ ...emptySession, ...JSON.parse(saved) });
				}
			} catch (error) {
				console.warn("Could not restore the Pinky demo session", error);
			} finally {
				if (isMounted) setIsHydrated(true);
			}
		}

		void restoreSession();
		return () => {
			isMounted = false;
		};
	}, []);

	useEffect(() => {
		if (!isHydrated) return;
		void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(session)).catch((error) =>
			console.warn("Could not save the Pinky demo session", error),
		);
	}, [isHydrated, session]);

	const decide = useCallback(
		(profile: Profile, decision: Decision) => {
			if (session.decisions[profile.id]) return false;

			const isNewMatch =
				decision === "like" &&
				Boolean(profile.mutualLike) &&
				!session.matches.some((match) => match.id === profile.id);

			setSession((current) => ({
				...current,
				decisions: current.decisions[profile.id]
					? current.decisions
					: { ...current.decisions, [profile.id]: decision },
				matches: isNewMatch && !current.matches.some((match) => match.id === profile.id)
					? [...current.matches, profile]
					: current.matches,
			}));

			return isNewMatch;
		},
		[session.decisions, session.matches],
	);

	const sendMessage = useCallback((matchId: number, text: string, rewriteStyle?: RewriteStyle) => {
		const trimmed = text.trim();
		if (!trimmed) return;

		setSession((current) => ({
			...current,
			messagesByMatchId: {
				...current.messagesByMatchId,
				[matchId]: [
					...(current.messagesByMatchId[matchId] ?? []),
					{
						id: `${Date.now()}-${Math.random()}`,
						sender: "you",
						text: trimmed,
						...(rewriteStyle ? {rewriteStyle} : {}),
					},
				],
			},
		}));
	}, []);

	const setRewriteEnabled = useCallback((matchId: number, enabled: boolean) => {
		setSession((current) => {
			const previous = current.rewriteSettingsByMatchId[matchId] ?? {
				enabled: false,
				style: "warm" as const,
			};
			if (previous.enabled === enabled) return current;

			const notice = enabled
				? `AI rewrite mode is on (${previous.style} style).`
				: "AI rewrite mode is off.";
			return {
				...current,
				rewriteSettingsByMatchId: {
					...current.rewriteSettingsByMatchId,
					[matchId]: {...previous, enabled},
				},
				messagesByMatchId: {
					...current.messagesByMatchId,
					[matchId]: [
						...(current.messagesByMatchId[matchId] ?? []),
						{
							id: `system-${Date.now()}-${Math.random()}`,
							sender: "system",
							text: notice,
						},
					],
				},
			};
		});
	}, []);

	const setRewriteStyle = useCallback((matchId: number, style: RewriteStyle) => {
		setSession((current) => {
			const previous = current.rewriteSettingsByMatchId[matchId] ?? {
				enabled: false,
				style: "warm" as const,
			};
			if (previous.style === style) return current;

			const messages = current.messagesByMatchId[matchId] ?? [];
			return {
				...current,
				rewriteSettingsByMatchId: {
					...current.rewriteSettingsByMatchId,
					[matchId]: {...previous, style},
				},
				messagesByMatchId: previous.enabled
					? {
							...current.messagesByMatchId,
							[matchId]: [
								...messages,
								{
									id: `system-${Date.now()}-${Math.random()}`,
									sender: "system",
									text: `AI rewrite style changed to ${style}.`,
								},
							],
						}
					: current.messagesByMatchId,
			};
		});
	}, []);

	const saveSuggestionSet = useCallback((matchId: number, set: SuggestionSet) => {
		setSession((current) => ({
			...current,
			suggestionSetsByMatchId: {
				...current.suggestionSetsByMatchId,
				[matchId]: set,
			},
		}));
	}, []);

	const seedDemoConversation = useCallback((profile: Profile) => {
		setSession((current) => ({
			...current,
			matches: current.matches.some((match) => match.id === profile.id)
				? current.matches
				: [...current.matches, profile],
			messagesByMatchId: {
				...current.messagesByMatchId,
				[profile.id]: [
					{ id: "demo-you-1", sender: "you", text: "I have a project presentation coming up soon." },
					{ id: "demo-match-1", sender: "match", text: "That sounds like a big week. What is the presentation about?" },
					{ id: "demo-you-2", sender: "you", text: "It is about a community garden app I have been designing." },
				],
			},
			suggestionSetsByMatchId: {
				...current.suggestionSetsByMatchId,
				[profile.id]: undefined,
			},
			simulatedToday: localDateKey(),
		}));
	}, []);

	const advanceDemoDay = useCallback(() => {
		setSession((current) => {
			const parts = (current.simulatedToday ?? localDateKey()).split("-").map(Number);
			const nextDay = new Date(parts[0], parts[1] - 1, parts[2] + 1);
			return { ...current, simulatedToday: localDateKey(nextDay) };
		});
	}, []);

	const value = useMemo(
		() => ({
			...session,
			isHydrated,
			decide,
			sendMessage,
			saveSuggestionSet,
			setRewriteEnabled,
			setRewriteStyle,
			seedDemoConversation,
			advanceDemoDay,
		}),
		[session, isHydrated, decide, sendMessage, saveSuggestionSet, setRewriteEnabled, setRewriteStyle, seedDemoConversation, advanceDemoDay],
	);

	return <DemoSessionContext.Provider value={value}>{children}</DemoSessionContext.Provider>;
}

export function useDemoSession() {
	const context = useContext(DemoSessionContext);
	if (!context) throw new Error("useDemoSession must be used inside DemoSessionProvider");
	return context;
}
