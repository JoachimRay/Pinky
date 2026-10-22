import { ArrowLeftIcon } from "@/components/icons/ArrowLeftIcon";
import { ArrowUpIcon } from "@/components/icons/ArrowUpIcon";
import { BadgeCheckIcon } from "@/components/icons/BadgeCheckIcon";
import { ShieldCheckIcon } from "@/components/icons/ShieldCheckIcon";
import palette from "@/constants/palette";
import { profileImages } from "@/data/profile-images";
import { useDemoSession, type RewriteStyle } from "@/lib/demo-session";
import { localDateKey } from "@/lib/suggestions";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const EMPTY_MESSAGES: { sender: "you" | "match"; text: string; id: string }[] =
  [];

type SuggestionsApiResponse = {
  kind: "opening" | "follow-up";
  suggestions: [string, string, string];
};

type RewriteApiResponse = { message: string; rewritten: boolean };

const REWRITE_STYLES: { value: RewriteStyle; label: string }[] = [
  { value: "warm", label: "Warm" },
  { value: "playful", label: "Playful" },
  { value: "flirty", label: "Flirty" },
];

function isSuggestionsApiResponse(
  value: unknown,
): value is SuggestionsApiResponse {
  if (typeof value !== "object" || value === null) return false;

  const result = value as Record<string, unknown>;
  const suggestions = result.suggestions;

  return (
    (result.kind === "opening" || result.kind === "follow-up") &&
    Array.isArray(suggestions) &&
    suggestions.length === 3 &&
    suggestions.every(
      (item) => typeof item === "string" && item.trim().length > 0,
    ) &&
    new Set(suggestions).size === 3
  );
}

function isRewriteApiResponse(value: unknown): value is RewriteApiResponse {
  if (typeof value !== "object" || value === null) return false;
  const result = value as Record<string, unknown>;
  return (
    typeof result.message === "string" &&
    result.message.trim().length > 0 &&
    typeof result.rewritten === "boolean"
  );
}

export default function ChatConversationScreen() {
  const { matchId } = useLocalSearchParams<{ matchId: string }>();
  const {
    matches,
    messagesByMatchId,
    suggestionSetsByMatchId,
    simulatedToday,
    isHydrated,
    sendMessage,
    saveSuggestionSet,
    advanceDemoDay,
    rewriteSettingsByMatchId,
    setRewriteEnabled,
    setRewriteStyle,
  } = useDemoSession();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const id = Number(matchId);
  const profile = matches.find((item) => item.id === id);
  const messages = messagesByMatchId[id] ?? EMPTY_MESSAGES;
  const conversationHistory = useMemo(
    () => messages.filter(({ sender }) => sender !== "system"),
    [messages],
  );
  const suggestionSet = suggestionSetsByMatchId[id];
  const rewriteSettings = rewriteSettingsByMatchId[id] ?? {
    enabled: false,
    style: "warm" as const,
  };
  const today = simulatedToday ?? localDateKey();
  const [draft, setDraft] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSuggestionsVisible, setIsSuggestionsVisible] = useState(true);
  const [suggestionError, setSuggestionError] = useState("");
  const [isRewriting, setIsRewriting] = useState(false);
  const [rewriteError, setRewriteError] = useState("");
  const [rewriteNeedsChoice, setRewriteNeedsChoice] = useState(false);
  const generationLock = useRef(false);
  const canSend = draft.trim().length > 0;

  function goBackToChats() {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(tabs)/Chat_Logs");
    }
  }

  const generateSuggestions = useCallback(
    async (forceRefresh = false) => {
      if (!isHydrated || !profile || generationLock.current) return;
      if (
        !forceRefresh &&
        suggestionSet?.generatedOn === today &&
        suggestionSet.historyMessageCount === conversationHistory.length
      ) {
        return;
      }

      generationLock.current = true;
      setIsGenerating(true);
      setSuggestionError("");

      const refreshNumber = suggestionSet ? suggestionSet.refreshNumber + 1 : 0;

      try {
        const response = await fetch("/api/suggestions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            profile: {
              name: profile.name,
              bio: profile.bio,
              interests: profile.interests,
            },
            history: conversationHistory.map(({ sender, text }) => ({ sender, text })),
          }),
        });

        if (!response.ok) {
          const details = await response.text();
          throw new Error(
            `Suggestions request failed: ${response.status} ${details}`,
          );
        }

        const result: unknown = await response.json();

        if (!isSuggestionsApiResponse(result)) {
          throw new Error("The suggestions response was not valid.");
        }

        saveSuggestionSet(id, {
          kind: result.kind,
          suggestions: result.suggestions,
          generatedOn: today,
          historyMessageCount: conversationHistory.length,
          refreshNumber,
        });
      } catch (error) {
        console.error("[suggestions] request failed", error);
        setSuggestionError("Could not generate suggestions. Try again.");
      } finally {
        generationLock.current = false;
        setIsGenerating(false);
      }
    },
    [
      id,
      isHydrated,
      conversationHistory,
      profile,
      saveSuggestionSet,
      suggestionSet,
      today,
    ],
  );

  useFocusEffect(
    useCallback(() => {
      generateSuggestions();
    }, [generateSuggestions]),
  );

  async function handleSendMessage() {
    const trimmed = draft.trim();
    if (!profile || !trimmed || isRewriting) return;

    if (!rewriteSettings.enabled) {
      sendMessage(profile.id, trimmed);
      setDraft("");
      return;
    }

    setIsRewriting(true);
    setRewriteError("");
    setRewriteNeedsChoice(false);
    try {
      const response = await fetch("/api/rewrite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: trimmed,
          style: rewriteSettings.style,
          history: conversationHistory.map(({ sender, text, createdAt, id: messageId }) => ({
            sender,
            text,
            createdAt:
              createdAt ??
              (Number.isFinite(Number(messageId.split("-")[0]))
                ? Number(messageId.split("-")[0])
                : undefined),
          })),
        }),
      });
      if (!response.ok) {
        const details = await response.text();
        throw new Error(
          `Rewrite request failed: ${response.status} ${details}`,
        );
      }

      const result: unknown = await response.json();
      if (!isRewriteApiResponse(result)) {
        throw new Error("The rewrite response was not valid.");
      }

      if (result.rewritten) {
        sendMessage(profile.id, result.message.trim(), rewriteSettings.style);
        setDraft("");
      } else {
        setRewriteError(
          "AI couldn't safely rewrite this draft. Choose how you want to continue.",
        );
        setRewriteNeedsChoice(true);
      }
    } catch (error) {
      console.error("[rewrite] request failed", error);
      setRewriteError(
        "AI rewrite failed. Your draft is still here. Choose how you want to continue.",
      );
      setRewriteNeedsChoice(true);
    } finally {
      setIsRewriting(false);
    }
  }

  function sendOriginalDraft() {
    const trimmed = draft.trim();
    if (!profile || !trimmed || isRewriting) return;
    sendMessage(profile.id, trimmed);
    setDraft("");
    setRewriteError("");
    setRewriteNeedsChoice(false);
  }

  if (!isHydrated) {
    return (
      <View style={[styles.screen, styles.centered]}>
        <ActivityIndicator color={palette.wine} />
        <Text style={styles.stateText}>Loading conversation…</Text>
      </View>
    );
  }

  if (!profile) {
    return (
      <View
        style={[styles.screen, styles.centered, { paddingTop: insets.top }]}
      >
        <Text style={styles.stateTitle}>Match not found</Text>
        <Text style={styles.stateText}>
          This match wasn’t found in the current demo session.
        </Text>
        <Pressable
          accessibilityRole="button"
          onPress={goBackToChats}
          style={styles.outlineButton}
        >
          <Text style={styles.outlineButtonText}>Back to chats</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back to chats"
          hitSlop={12}
          onPress={goBackToChats}
        >
          <ArrowLeftIcon />
        </Pressable>
        <View style={styles.avatar}>
          <Text style={styles.avatarInitial}>{profile.name[0]}</Text>
          <Image
            source={profileImages[profile.id]}
            style={StyleSheet.absoluteFill}
            accessible={false}
          />
        </View>
        <View style={styles.identity}>
          <View style={styles.nameRow}>
            <Text style={styles.name} accessibilityRole="header">
              {profile.name}
            </Text>
            {profile.verified && (
              <BadgeCheckIcon
                width={16}
                height={16}
                color={palette.wine}
                accessibilityLabel="Verified"
              />
            )}
          </View>
          <Pressable
            accessibilityRole="link"
            accessibilityLabel={`View ${profile.name}'s profile`}
            onPress={() => router.push(`/profile/${profile.id}`)}
          >
            <Text style={styles.viewProfile}>View profile</Text>
          </Pressable>
        </View>
      </View>

      <ScrollView
        ref={scrollRef}
        style={styles.conversation}
        contentContainerStyle={styles.conversationContent}
        keyboardShouldPersistTaps="handled"
        onContentSizeChange={() =>
          scrollRef.current?.scrollToEnd({ animated: true })
        }
      >
        <View style={styles.safetyNote}>
          <ShieldCheckIcon />
          <Text style={styles.safetyText}>
            Keep it here until you feel comfortable.
          </Text>
        </View>

        {messages.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.stateTitle}>Say hi to {profile.name}</Text>
            <Text style={styles.stateText}>
              Pick a suggestion below or write your own.
            </Text>
          </View>
        ) : null}

        {messages.map((message) => {
          if (message.sender === "system") {
            return (
              <View key={message.id} style={styles.systemNotice}>
                <Text style={styles.systemNoticeText}>{message.text}</Text>
              </View>
            );
          }

          const isOwn = message.sender === "you";
          return (
            <View
              key={message.id}
              style={[
                styles.bubble,
                isOwn ? styles.ownBubble : styles.matchBubble,
              ]}
              accessibilityLabel={`${isOwn ? "You" : profile.name}: ${message.text}`}
            >
              <Text style={[styles.bubbleText, isOwn && styles.ownBubbleText]}>
                {message.text}
              </Text>
              {message.rewriteStyle ? (
                <Text style={styles.rewriteMessageIndicator}>
                  AI rewrite ·{" "}
                  {
                    REWRITE_STYLES.find(
                      (item) => item.value === message.rewriteStyle,
                    )?.label
                  }
                </Text>
              ) : null}
            </View>
          );
        })}

        {isRewriting ? <TypingBubble /> : null}

        <View
          accessibilityLabel="Suggested message choices"
          style={styles.suggestionsBox}
        >
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionLabel}>SUGGESTED MESSAGES</Text>
            <View style={styles.suggestionActions}>
              {isSuggestionsVisible ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Refresh suggestions"
                  accessibilityState={{ disabled: isGenerating }}
                  disabled={isGenerating}
                  hitSlop={8}
                  onPress={() => generateSuggestions(true)}
                >
                  <Text
                    style={[
                      styles.refreshText,
                      isGenerating && styles.disabled,
                    ]}
                  >
                    Refresh
                  </Text>
                </Pressable>
              ) : null}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={
                  isSuggestionsVisible ? "Hide suggestions" : "Show suggestions"
                }
                accessibilityState={{ expanded: isSuggestionsVisible }}
                hitSlop={8}
                onPress={() => setIsSuggestionsVisible((visible) => !visible)}
              >
                <Text style={styles.refreshText}>
                  {isSuggestionsVisible ? "Hide" : "Show"}
                </Text>
              </Pressable>
            </View>
          </View>

          {isSuggestionsVisible && isGenerating ? (
            <View style={styles.inlineState}>
              <ActivityIndicator size="small" color={palette.wine} />
              <Text style={styles.stateText}>Generating suggestions…</Text>
            </View>
          ) : null}

          {isSuggestionsVisible && suggestionError ? (
            <View style={styles.errorBox} accessibilityRole="alert">
              <Text style={styles.errorText}>{suggestionError}</Text>
              <Pressable
                accessibilityRole="button"
                hitSlop={8}
                onPress={() => generateSuggestions(true)}
              >
                <Text style={styles.refreshText}>Retry</Text>
              </Pressable>
            </View>
          ) : null}

          {isSuggestionsVisible ? (
            <View style={styles.suggestionList}>
              {suggestionSet?.suggestions.map((suggestion, index) => (
                <Pressable
                  key={`${suggestionSet.generatedOn}-${index}-${suggestion}`}
                  accessibilityRole="button"
                  accessibilityHint="Puts this message in the composer"
                  onPress={() => setDraft(suggestion)}
                  style={({ pressed }) => [
                    styles.suggestion,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={styles.suggestionText}>{suggestion}</Text>
                </Pressable>
              ))}
            </View>
          ) : null}
        </View>

        {__DEV__ ? (
          <Pressable
            accessibilityRole="button"
            onPress={advanceDemoDay}
            style={styles.devButton}
          >
            <Text style={styles.devButtonText}>Demo: simulate next day</Text>
          </Pressable>
        ) : null}
      </ScrollView>

      <View
        style={[
          styles.composerShell,
          { paddingBottom: Math.max(insets.bottom, 12) },
        ]}
      >
        <View style={styles.rewriteControls}>
          <Pressable
            accessibilityRole="switch"
            accessibilityLabel="AI message rewrite"
            accessibilityState={{
              checked: rewriteSettings.enabled,
              disabled: isRewriting,
            }}
            disabled={isRewriting}
            onPress={() => setRewriteEnabled(id, !rewriteSettings.enabled)}
            style={[
              styles.rewriteToggle,
              rewriteSettings.enabled && styles.rewriteToggleActive,
              isRewriting && styles.disabled,
            ]}
          >
            <Text
              style={[
                styles.rewriteToggleText,
                rewriteSettings.enabled && styles.rewriteToggleTextActive,
              ]}
            >
              AI rewrite {rewriteSettings.enabled ? "ON" : "OFF"}
            </Text>
          </Pressable>

          {rewriteSettings.enabled ? (
            <View style={styles.rewriteStyles}>
              {REWRITE_STYLES.map((option) => {
                const selected = rewriteSettings.style === option.value;
                return (
                  <Pressable
                    key={option.value}
                    accessibilityRole="radio"
                    accessibilityState={{ selected, disabled: isRewriting }}
                    disabled={isRewriting}
                    onPress={() => setRewriteStyle(id, option.value)}
                    style={[
                      styles.rewriteStyleOption,
                      selected && styles.rewriteStyleOptionSelected,
                      isRewriting && styles.disabled,
                    ]}
                  >
                    <Text
                      style={[
                        styles.rewriteStyleText,
                        selected && styles.rewriteStyleTextSelected,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          ) : null}
        </View>

        {rewriteError ? (
          <Text style={styles.rewriteError} accessibilityRole="alert">
            {rewriteError}
          </Text>
        ) : null}

        {rewriteNeedsChoice ? (
          <View style={styles.rewriteActions}>
            <Pressable
              accessibilityRole="button"
              disabled={isRewriting}
              onPress={sendOriginalDraft}
              style={[styles.rewriteActionButton, styles.sendOriginalButton]}
            >
              <Text style={styles.sendOriginalText}>Send original</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              disabled={isRewriting}
              onPress={handleSendMessage}
              style={[styles.rewriteActionButton, styles.retryRewriteButton]}
            >
              <Text style={styles.retryRewriteText}>
                {isRewriting ? "Retrying…" : "Retry AI"}
              </Text>
            </Pressable>
          </View>
        ) : null}

        <View style={styles.composer}>
          <TextInput
            value={draft}
            onChangeText={(value) => {
              setDraft(value);
              setRewriteError("");
              setRewriteNeedsChoice(false);
            }}
            placeholder={`Message ${profile.name}…`}
            placeholderTextColor={palette.muted}
            multiline
            accessibilityLabel={`Message ${profile.name}`}
            style={styles.input}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              isRewriting ? "Rewriting message" : "Send message"
            }
            accessibilityState={{ disabled: !canSend || isRewriting }}
            disabled={!canSend || isRewriting}
            onPress={handleSendMessage}
            style={[
              styles.sendButton,
              (!canSend || isRewriting) && styles.disabled,
            ]}
          >
            {isRewriting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <ArrowUpIcon />
            )}
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

function TypingBubble() {
  const [dotAnimations] = useState(() => [
    new Animated.Value(0.35),
    new Animated.Value(0.35),
    new Animated.Value(0.35),
  ]);

  useEffect(() => {
    const animations = dotAnimations.map((value, index) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(index * 130),
          Animated.timing(value, {
            toValue: 1,
            duration: 260,
            useNativeDriver: true,
          }),
          Animated.timing(value, {
            toValue: 0.35,
            duration: 260,
            useNativeDriver: true,
          }),
          Animated.delay((2 - index) * 130),
        ]),
      ),
    );
    animations.forEach((animation) => animation.start());
    return () => animations.forEach((animation) => animation.stop());
  }, [dotAnimations]);

  return (
    <View
      style={styles.typingBubble}
      accessibilityLabel="AI is rewriting your message"
      accessibilityLiveRegion="polite"
    >
      {dotAnimations.map((value, index) => (
        <Animated.View
          key={index}
          style={[
            styles.typingDot,
            { opacity: value, transform: [{ scale: value }] },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: palette.shell,
  },
  centered: {
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 24,
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: palette.line,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: palette.blush,
  },
  avatarInitial: {
    fontFamily: "Lora_400Regular",
    fontSize: 20,
    color: palette.wine,
  },
  identity: {
    flex: 1,
    gap: 2,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  name: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 17,
    color: palette.ink,
  },
  viewProfile: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: palette.muted,
  },

  // Conversation
  conversation: {
    flex: 1,
  },
  conversationContent: {
    gap: 16,
    paddingHorizontal: 24,
    paddingTop: 18,
    paddingBottom: 14,
  },
  safetyNote: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 10,
    borderRadius: 12,
    backgroundColor: palette.bubble,
  },
  safetyText: {
    flex: 1,
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: palette.muted,
  },
  emptyState: {
    alignItems: "center",
    gap: 4,
    paddingVertical: 24,
  },
  bubble: {
    maxWidth: "78%",
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 24,
  },
  ownBubble: {
    alignSelf: "flex-end",
    backgroundColor: palette.wine,
    borderBottomRightRadius: 5,
  },
  matchBubble: {
    alignSelf: "flex-start",
    backgroundColor: palette.bubble,
    borderBottomLeftRadius: 5,
  },
  typingBubble: {
    alignSelf: "flex-end",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    minWidth: 58,
    paddingHorizontal: 15,
    paddingVertical: 14,
    borderRadius: 24,
    borderBottomRightRadius: 5,
    backgroundColor: palette.bubble,
  },
  typingDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: palette.muted,
  },
  systemNotice: {
    alignSelf: "center",
    maxWidth: "90%",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 14,
    backgroundColor: palette.bubble,
  },
  systemNoticeText: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: palette.muted,
    textAlign: "center",
  },
  bubbleText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    lineHeight: 20,
    color: palette.ink,
  },
  ownBubbleText: {
    color: "#FFFFFF",
  },
  rewriteMessageIndicator: {
    marginTop: 6,
    fontFamily: "Inter_400Regular",
    fontSize: 10,
    color: palette.cream,
  },

  // Suggestions
  suggestionsBox: {
    gap: 10,
    padding: 13,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: palette.line,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  suggestionActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  sectionLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 10,
    letterSpacing: 0.5,
    color: palette.muted,
  },
  refreshText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: palette.wine,
  },
  suggestionList: {
    gap: 8,
  },
  suggestion: {
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: palette.line,
  },
  suggestionText: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    lineHeight: 19,
    color: palette.ink,
  },
  inlineState: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    padding: 10,
    borderRadius: 12,
    backgroundColor: palette.bubble,
  },
  errorText: {
    flex: 1,
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: palette.rose,
  },

  // Shared states
  stateTitle: {
    fontFamily: "Lora_400Regular",
    fontSize: 20,
    color: palette.wine,
    textAlign: "center",
  },
  stateText: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: palette.muted,
    textAlign: "center",
  },
  outlineButton: {
    marginTop: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: palette.line,
  },
  outlineButtonText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: palette.wine,
  },
  devButton: {
    alignSelf: "center",
    paddingVertical: 6,
  },
  devButtonText: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: palette.muted,
    textDecorationLine: "underline",
  },
  pressed: {
    opacity: 0.7,
  },
  disabled: {
    opacity: 0.4,
  },

  // Composer
  composerShell: {
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: palette.line,
    backgroundColor: palette.shell,
  },
  rewriteControls: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 20,
    marginBottom: 9,
  },
  rewriteToggle: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: palette.line,
    backgroundColor: "#FFFFFF",
  },
  rewriteToggleActive: {
    borderColor: palette.wine,
    backgroundColor: palette.wine,
  },
  rewriteToggleText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    color: palette.muted,
  },
  rewriteToggleTextActive: {
    color: "#FFFFFF",
  },
  rewriteStyles: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  rewriteStyleOption: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: palette.line,
    backgroundColor: "#FFFFFF",
  },
  rewriteStyleOptionSelected: {
    backgroundColor: palette.cream,
    borderColor: palette.rose,
  },
  rewriteStyleText: {
    fontFamily: "Inter_400Regular",
    fontSize: 10,
    color: palette.muted,
  },
  rewriteStyleTextSelected: {
    fontFamily: "Inter_600SemiBold",
    color: palette.wine,
  },
  rewriteError: {
    paddingHorizontal: 20,
    marginBottom: 8,
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: palette.rose,
  },
  rewriteActions: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  rewriteActionButton: {
    flex: 1,
    minHeight: 40,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  sendOriginalButton: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: palette.line,
  },
  sendOriginalText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    color: palette.ink,
  },
  retryRewriteButton: {
    backgroundColor: palette.wine,
  },
  retryRewriteText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    color: "#FFFFFF",
  },
  composer: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
    paddingHorizontal: 20,
  },
  input: {
    flex: 1,
    minHeight: 46,
    maxHeight: 120,
    paddingHorizontal: 15,
    paddingTop: 13,
    paddingBottom: 13,
    borderRadius: 23,
    borderWidth: 1,
    borderColor: palette.line,
    backgroundColor: "#FFFFFF",
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: palette.ink,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: palette.wine,
    marginBottom: 1,
  },
});
