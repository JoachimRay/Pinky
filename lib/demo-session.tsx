import type { Profile } from "@/types/profile";
import {
	createContext,
	useCallback,
	useContext,
	useMemo,
	useState,
} from "react";

export type Decision = "like" | "pass";

export type ChatMessage = {
  id: string;
  sender: "you" | "match";
  text: string;
};

type DemoSession = {
  decisions: Record<number, Decision>;
  matches: Profile[];
  messagesByMatchId: Record<number, ChatMessage[]>;
  decide: (profile: Profile, decision: Decision) => boolean;
  sendMessage: (matchId: number, text: string) => void;
};

const DemoSessionContext = createContext<DemoSession | null>(null);

export function DemoSessionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [decisions, setDecisions] = useState<Record<number, Decision>>({});
  const [matches, setMatches] = useState<Profile[]>([]);
  const [messagesByMatchId, setMessagesByMatchId] = useState<
    Record<number, ChatMessage[]>
  >({});

  const decide = useCallback(
    (profile: Profile, decision: Decision) => {
      if (decisions[profile.id]) return false;

      setDecisions((current) =>
        current[profile.id]
          ? current
          : { ...current, [profile.id]: decision },
      );

      const isNewMatch =
        decision === "like" &&
        Boolean(profile.mutualLike) &&
        !matches.some((match) => match.id === profile.id);

      if (isNewMatch) {
        setMatches((current) =>
          current.some((match) => match.id === profile.id)
            ? current
            : [...current, profile],
        );
      }

      return isNewMatch;
    },
    [decisions, matches],
  );

  const sendMessage = useCallback((matchId: number, text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    setMessagesByMatchId((current) => ({
      ...current,
      [matchId]: [
        ...(current[matchId] ?? []),
        {
          id: `${Date.now()}-${Math.random()}`,
          sender: "you",
          text: trimmed,
        },
      ],
    }));
  }, []);

  const value = useMemo(
    () => ({
      decisions,
      matches,
      messagesByMatchId,
      decide,
      sendMessage,
    }),
    [decisions, matches, messagesByMatchId, decide, sendMessage],
  );

  return (
    <DemoSessionContext.Provider value={value}>
      {children}
    </DemoSessionContext.Provider>
  );
}

export function useDemoSession() {
  const context = useContext(DemoSessionContext);

  if (!context) {
    throw new Error("useDemoSession must be used inside DemoSessionProvider");
  }

  return context;
}