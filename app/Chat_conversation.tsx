import { useDemoSession } from "@/lib/demo-session";
import { localDateKey, makeDemoSuggestions } from "@/lib/suggestions";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useRef, useState } from "react";
import {
	Pressable,
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	View,
} from "react-native";

const EMPTY_MESSAGES: { sender: "you" | "match"; text: string; id: string }[] = [];

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
	} = useDemoSession();
	const id = Number(matchId);
	const profile = matches.find((item) => item.id === id);
	const messages = messagesByMatchId[id] ?? EMPTY_MESSAGES;
	const suggestionSet = suggestionSetsByMatchId[id];
	const today = simulatedToday ?? localDateKey();
	const [draft, setDraft] = useState("");
	const [isGenerating, setIsGenerating] = useState(false);
	const [suggestionError, setSuggestionError] = useState("");
	const generationLock = useRef(false);

	const generateSuggestions = useCallback(
		(forceRefresh = false) => {
			if (!isHydrated || !profile || generationLock.current) return;
			if (!forceRefresh && suggestionSet?.generatedOn === today) return;

			generationLock.current = true;
			setIsGenerating(true);
			setSuggestionError("");

			setTimeout(() => {
				try {
					const refreshNumber = suggestionSet
						? suggestionSet.refreshNumber + 1
						: 0;
					const result = makeDemoSuggestions(profile, messages, refreshNumber);
					saveSuggestionSet(id, {
						...result,
						generatedOn: today,
						refreshNumber,
					});
				} catch {
					setSuggestionError("Could not generate suggestions. Try again.");
				} finally {
					generationLock.current = false;
					setIsGenerating(false);
				}
			}, 150);
		},
		[
			id,
			isHydrated,
			messages,
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

	function handleSendMessage() {
		const trimmed = draft.trim();
		if (!profile || !trimmed) return;
		sendMessage(profile.id, trimmed);
		setDraft("");
	}

	if (!isHydrated) {
		return <Text>Loading conversation…</Text>;
	}

	if (!profile) {
		return (
			<View style={styles.screen}>
				<Text>This match wasn’t found in the current demo session.</Text>
				<Pressable accessibilityRole="button" onPress={() => router.back()}>
					<Text>Back to chats</Text>
				</Pressable>
			</View>
		);
	}

	return (
		<View style={styles.screen}>
			<View style={styles.header}>
				<Pressable accessibilityRole="button" onPress={() => router.back()}>
					<Text>Back</Text>
				</Pressable>
				<Text>{profile.name}</Text>
			</View>

			<ScrollView
				style={styles.conversation}
				contentContainerStyle={styles.conversationContent}
			>
				{messages.length === 0 ? (
					<Text>No messages yet. Choose a suggestion or write your own.</Text>
				) : null}

				{messages.map((message) => (
					<View
						key={message.id}
						style={[
							styles.message,
							message.sender === "you"
								? styles.ownMessage
								: styles.matchMessage,
						]}
					>
						<Text>{message.sender}: {message.text}</Text>
					</View>
				))}

				<View
					accessibilityLabel="Suggested message choices"
					style={styles.suggestionsBox}
				>
					<View style={styles.sectionHeader}>
						<Text>Suggested messages</Text>
						<Pressable
							accessibilityRole="button"
							disabled={isGenerating}
							onPress={() => generateSuggestions(true)}
						>
							<Text>Refresh</Text>
						</Pressable>
					</View>

					{isGenerating ? <Text>Generating suggestions…</Text> : null}
					{suggestionError ? (
						<View>
							<Text>{suggestionError}</Text>
							<Pressable onPress={() => generateSuggestions(true)}>
								<Text>Retry</Text>
							</Pressable>
						</View>
					) : null}

					<View style={styles.suggestionList}>
						{suggestionSet?.suggestions.map((suggestion, index) => (
							<Pressable
								key={`${suggestionSet.generatedOn}-${index}-${suggestion}`}
								accessibilityRole="button"
								onPress={() => setDraft(suggestion)}
								style={styles.suggestion}
							>
								<Text>{suggestion}</Text>
							</Pressable>
						))}
					</View>
				</View>

				{__DEV__ ? (
					<Pressable accessibilityRole="button" onPress={advanceDemoDay}>
						<Text>Demo: simulate next day</Text>
					</Pressable>
				) : null}
			</ScrollView>

			<View style={styles.composer}>
				<TextInput
					value={draft}
					onChangeText={setDraft}
					placeholder="Message…"
					multiline
					onSubmitEditing={handleSendMessage}
					style={styles.input}
				/>
				<Pressable accessibilityRole="button" onPress={handleSendMessage}>
					<Text>Send</Text>
				</Pressable>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	screen: {
		flex: 1,
		paddingHorizontal: 16,
		paddingTop: 8,
	},
	header: {
		flexDirection: "row",
		alignItems: "center",
		gap: 16,
		paddingBottom: 12,
	},
	conversation: {
		flex: 1,
	},
	conversationContent: {
		gap: 12,
		paddingVertical: 12,
	},
	message: {
		maxWidth: "85%",
	},
	ownMessage: {
		alignSelf: "flex-end",
	},
	matchMessage: {
		alignSelf: "flex-start",
	},
	suggestionsBox: {
		borderWidth: 1,
		borderColor: "#999999",
		padding: 12,
		marginTop: 12,
		gap: 8,
	},
	sectionHeader: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
	},
	suggestionList: {
		gap: 8,
	},
	suggestion: {
		paddingVertical: 4,
	},
	composer: {
		flexDirection: "row",
		alignItems: "flex-end",
		gap: 8,
		paddingVertical: 8,
	},
	input: {
		flex: 1,
		minHeight: 40,
		maxHeight: 120,
	},
});
