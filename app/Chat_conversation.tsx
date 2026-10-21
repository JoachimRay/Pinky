import { useDemoSession } from "@/lib/demo-session";
import type { Profile } from "@/types/profile";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";

type OpenerResponse = {
  opener: string;
  source: "ai" | "fallback";
};

async function requestOpener(profile: Profile): Promise<OpenerResponse> {
  const response = await fetch("/api/opener", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: profile.name,
      bio: profile.bio,
      interests: profile.interests,
    }),
  });

  if (!response.ok) {
    throw new Error("The opener request failed");
  }

  return response.json();
}

export default function ChatConversationScreen() {
  const { matchId } = useLocalSearchParams<{ matchId: string }>();
  const { matches, messagesByMatchId, sendMessage } = useDemoSession();

  const profile = matches.find((item) => item.id === Number(matchId));
  const messages = profile ? (messagesByMatchId[profile.id] ?? []) : [];

  const [draft, setDraft] = useState("");
  const [opener, setOpener] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hasRegenerated, setHasRegenerated] = useState(false);
  const [openerWasSent, setOpenerWasSent] = useState(false);

  async function handleGenerateOpener(isRegeneration = false) {
    if (!profile || loading) return;

    setLoading(true);
    setError("");

    try {
      const result = await requestOpener(profile);
      const suggestion = result.opener?.trim();

      if (!suggestion) {
        setError("No opener came back. Try again.");
        return;
      }

      setOpener(suggestion);

      if (isRegeneration) {
        setHasRegenerated(true);
      }
    } catch {
      setError("Couldn’t load an opener. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleSendMessage(text = draft) {
    if (!profile) return;

    const trimmed = text.trim();
    if (!trimmed) return;

    sendMessage(profile.id, trimmed);
    setDraft("");

    if (trimmed === opener) {
      setOpenerWasSent(true);
    }
  }

  if (!profile) {
    return (
      <View style={{ flex: 1 }}>
        <Text>This match wasn’t found in the current demo session.</Text>
        <Pressable accessibilityRole="button" onPress={() => router.back()}>
          <Text>Back to chats</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back to chats"
          onPress={() => router.back()}
        >
          <Text>Back</Text>
        </Pressable>
        <Text>{profile.name}</Text>
      </View>

      <ScrollView style={{ flex: 1 }}>
        {messages.length === 0 && !opener && !loading ? (
          <View>
            <Text>You matched with {profile.name}</Text>
            <Text>Generate an opening line to start chatting.</Text>
          </View>
        ) : null}

        {messages.map((message) => (
          <View key={message.id}>
            <Text>{message.sender}: {message.text}</Text>
          </View>
        ))}

        {loading ? (
          <Text>Thinking of an opener…</Text>
        ) : null}

        {error ? (
          <View>
            <Text>{error}</Text>
            <Pressable accessibilityRole="button" onPress={() => handleGenerateOpener(Boolean(opener))}>
              <Text>Try again</Text>
            </Pressable>
          </View>
        ) : null}

        {opener && !openerWasSent ? (
          <View>
            <Text>Suggested opener</Text>
            <Text>{opener}</Text>
            <Pressable accessibilityRole="button" onPress={() => handleSendMessage(opener)}>
              <Text>Send opener</Text>
            </Pressable>

            {!hasRegenerated ? (
              <Pressable
                accessibilityRole="button"
                disabled={loading}
                onPress={() => handleGenerateOpener(true)}
              >
                <Text>Try another opener</Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}

        {openerWasSent ? (
          <Text>Your opening line has been sent.</Text>
        ) : null}
      </ScrollView>

      {!opener && !openerWasSent ? (
        <Pressable
          accessibilityRole="button"
          disabled={loading}
          onPress={() => handleGenerateOpener()}
        >
          <Text>{loading ? "Thinking…" : "Generate an opening line"}</Text>
        </Pressable>
      ) : null}

      <View>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder="Message…"
          multiline
          onSubmitEditing={() => handleSendMessage()}
        />

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Send message"
          onPress={() => handleSendMessage()}
        >
          <Text>Send</Text>
        </Pressable>
      </View>
    </View>
  );
}
