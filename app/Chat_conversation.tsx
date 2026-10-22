import {ArrowLeftIcon} from "@/components/icons/ArrowLeftIcon";
import {ArrowUpIcon} from "@/components/icons/ArrowUpIcon";
import {BadgeCheckIcon} from "@/components/icons/BadgeCheckIcon";
import {ShieldCheckIcon} from "@/components/icons/ShieldCheckIcon";
import palette from "@/constants/palette";
import {profileImages} from "@/data/profile-images";
import {useDemoSession} from "@/lib/demo-session";
import {localDateKey, makeDemoSuggestions} from "@/lib/suggestions";
import {router, useFocusEffect, useLocalSearchParams} from "expo-router";
import {useCallback, useRef, useState} from "react";
import {
	ActivityIndicator,
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
import {useSafeAreaInsets} from "react-native-safe-area-context";

const EMPTY_MESSAGES: {sender: "you" | "match"; text: string; id: string}[] =
	[];

export default function ChatConversationScreen() {
	const {matchId} = useLocalSearchParams<{matchId: string}>();
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
	const insets = useSafeAreaInsets();
	const scrollRef = useRef<ScrollView>(null);
	const id = Number(matchId);
	const profile = matches.find((item) => item.id === id);
	const messages = messagesByMatchId[id] ?? EMPTY_MESSAGES;
	const suggestionSet = suggestionSetsByMatchId[id];
	const today = simulatedToday ?? localDateKey();
	const [draft, setDraft] = useState("");
	const [isGenerating, setIsGenerating] = useState(false);
	const [suggestionError, setSuggestionError] = useState("");
	const generationLock = useRef(false);
	const canSend = draft.trim().length > 0;

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
		return (
			<View style={[styles.screen, styles.centered]}>
				<ActivityIndicator color={palette.wine} />
				<Text style={styles.stateText}>Loading conversation…</Text>
			</View>
		);
	}

	if (!profile) {
		return (
			<View style={[styles.screen, styles.centered, {paddingTop: insets.top}]}>
				<Text style={styles.stateTitle}>Match not found</Text>
				<Text style={styles.stateText}>
					This match wasn’t found in the current demo session.
				</Text>
				<Pressable
					accessibilityRole="button"
					onPress={() => router.back()}
					style={styles.outlineButton}>
					<Text style={styles.outlineButtonText}>Back to chats</Text>
				</Pressable>
			</View>
		);
	}

	return (
		<KeyboardAvoidingView
			style={styles.screen}
			behavior={Platform.OS === "ios" ? "padding" : "height"}>
			<View style={[styles.header, {paddingTop: insets.top}]}>
				<Pressable
					accessibilityRole="button"
					accessibilityLabel="Back to chats"
					hitSlop={12}
					onPress={() => router.back()}>
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
						onPress={() => router.push(`/profile/${profile.id}`)}>
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
					scrollRef.current?.scrollToEnd({animated: true})
				}>
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
					const isOwn = message.sender === "you";
					return (
						<View
							key={message.id}
							style={[
								styles.bubble,
								isOwn ? styles.ownBubble : styles.matchBubble,
							]}
							accessibilityLabel={`${isOwn ? "You" : profile.name}: ${message.text}`}>
							<Text style={[styles.bubbleText, isOwn && styles.ownBubbleText]}>
								{message.text}
							</Text>
						</View>
					);
				})}

				<View
					accessibilityLabel="Suggested message choices"
					style={styles.suggestionsBox}>
					<View style={styles.sectionHeader}>
						<Text style={styles.sectionLabel}>SUGGESTED MESSAGES</Text>
						<Pressable
							accessibilityRole="button"
							accessibilityLabel="Refresh suggestions"
							accessibilityState={{disabled: isGenerating}}
							disabled={isGenerating}
							hitSlop={8}
							onPress={() => generateSuggestions(true)}>
							<Text
								style={[styles.refreshText, isGenerating && styles.disabled]}>
								Refresh
							</Text>
						</Pressable>
					</View>

					{isGenerating ? (
						<View style={styles.inlineState}>
							<ActivityIndicator size="small" color={palette.wine} />
							<Text style={styles.stateText}>Generating suggestions…</Text>
						</View>
					) : null}

					{suggestionError ? (
						<View style={styles.errorBox} accessibilityRole="alert">
							<Text style={styles.errorText}>{suggestionError}</Text>
							<Pressable
								accessibilityRole="button"
								hitSlop={8}
								onPress={() => generateSuggestions(true)}>
								<Text style={styles.refreshText}>Retry</Text>
							</Pressable>
						</View>
					) : null}

					<View style={styles.suggestionList}>
						{suggestionSet?.suggestions.map((suggestion, index) => (
							<Pressable
								key={`${suggestionSet.generatedOn}-${index}-${suggestion}`}
								accessibilityRole="button"
								accessibilityHint="Puts this message in the composer"
								onPress={() => setDraft(suggestion)}
								style={({pressed}) => [
									styles.suggestion,
									pressed && styles.pressed,
								]}>
								<Text style={styles.suggestionText}>{suggestion}</Text>
							</Pressable>
						))}
					</View>
				</View>

				{__DEV__ ? (
					<Pressable
						accessibilityRole="button"
						onPress={advanceDemoDay}
						style={styles.devButton}>
						<Text style={styles.devButtonText}>Demo: simulate next day</Text>
					</Pressable>
				) : null}
			</ScrollView>

			<View
				style={[styles.composer, {paddingBottom: Math.max(insets.bottom, 12)}]}>
				<TextInput
					value={draft}
					onChangeText={setDraft}
					placeholder={`Message ${profile.name}…`}
					placeholderTextColor={palette.muted}
					multiline
					accessibilityLabel={`Message ${profile.name}`}
					style={styles.input}
				/>
				<Pressable
					accessibilityRole="button"
					accessibilityLabel="Send message"
					accessibilityState={{disabled: !canSend}}
					disabled={!canSend}
					onPress={handleSendMessage}
					style={[styles.sendButton, !canSend && styles.disabled]}>
					<ArrowUpIcon />
				</Pressable>
			</View>
		</KeyboardAvoidingView>
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
	bubbleText: {
		fontFamily: "Inter_400Regular",
		fontSize: 14,
		lineHeight: 20,
		color: palette.ink,
	},
	ownBubbleText: {
		color: "#FFFFFF",
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
	composer: {
		flexDirection: "row",
		alignItems: "flex-end",
		gap: 10,
		paddingHorizontal: 20,
		paddingTop: 12,
		borderTopWidth: 1,
		borderTopColor: palette.line,
		backgroundColor: palette.shell,
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
