import type { Profile } from "@/types/profile";
import { createContext, useCallback, useContext, useMemo, useState } from "react";

export type Decision = "like" | "pass";

type DemoSession = {
	decisions: Record<number, Decision>;
	matches: Profile[];
	decide: (profile: Profile, decision: Decision) => boolean;
};

const DemoSessionContext = createContext<DemoSession | null>(null);

export function DemoSessionProvider({ children }: { children: React.ReactNode }) {
	const [decisions, setDecisions] = useState<Record<number, Decision>>({});
	const [matches, setMatches] = useState<Profile[]>([]);

	const decide = useCallback((profile: Profile, decision: Decision) => {
		if (decisions[profile.id]) return false;
		setDecisions((current) => current[profile.id] ? current : { ...current, [profile.id]: decision });
		const matched = decision === "like" && Boolean(profile.mutualLike) && !matches.some((match) => match.id === profile.id);
		if (matched) setMatches((current) => current.some((match) => match.id === profile.id) ? current : [...current, profile]);
		return matched;
	}, [decisions, matches]);

	const value = useMemo(() => ({ decisions, matches, decide }), [decisions, matches, decide]);
	return <DemoSessionContext.Provider value={value}>{children}</DemoSessionContext.Provider>;
}

export function useDemoSession() {
	const context = useContext(DemoSessionContext);
	if (!context) throw new Error("useDemoSession must be used inside DemoSessionProvider");
	return context;
}
