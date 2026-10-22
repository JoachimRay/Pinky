import {Text} from "@/components/ui/text";
import dummy from "@/data/dummy.json";
import {useDemoSession} from "@/lib/demo-session";
import {router} from "expo-router";
import {Pressable, ScrollView, View} from "react-native";
import {useSafeAreaInsets} from "react-native-safe-area-context";

export default function ChatScreen() {
	const {matches, messagesByMatchId, seedDemoConversation} = useDemoSession();
	const insets = useSafeAreaInsets();

	return (
		<ScrollView
			className="flex-1 bg-shell"
			contentContainerClassName="flex-grow px-6 pb-10"
			contentContainerStyle={{paddingTop: insets.top + 8}}>
			<View className="mb-5 gap-2">
				<Text className="font-serif text-4xl text-wine">Chats</Text>
				<Text className="text-sm text-ink">
					Your conversations with matches.
				</Text>
			</View>

			<View className="mb-4 h-px bg-line" />

			{__DEV__ ? (
				<Pressable
					accessibilityRole="button"
					className="mb-4 self-start rounded-full border border-line bg-white px-4 py-2"
					onPress={() => {
						const profile = dummy[0];
						seedDemoConversation(profile);
						router.push({
							pathname: "/Chat_conversation",
							params: {matchId: String(profile.id)},
						});
					}}>
					<Text className="text-xs font-semibold text-wine">
						Demo: open a seeded conversation
					</Text>
				</Pressable>
			) : null}

			{matches.length === 0 ? (
				<View className="flex-1 items-center justify-center gap-2 rounded-3xl bg-white px-6 py-12">
					<Text className="font-serif text-2xl text-wine">No chats yet</Text>
					<Text className="text-center text-sm text-ink">
						Start swiping to find matches and start chatting.
					</Text>
				</View>
			) : (
				<View>
					{matches.map((profile, index) => {
						const messages = messagesByMatchId[profile.id] ?? [];
						const lastMessage = messages[messages.length - 1];

						return (
							<View key={profile.id}>
								<Pressable
									accessibilityRole="button"
									accessibilityLabel={`Chat with ${profile.name}`}
									className="flex-row items-center gap-4 py-4"
									onPress={() =>
										router.push({
											pathname: "/Chat_conversation",
											params: {matchId: String(profile.id)},
										})
									}>
									<View className="h-14 w-14 items-center justify-center rounded-full bg-blush">
										<Text className="font-serif text-2xl text-wine">
											{profile.name[0]}
										</Text>
									</View>
									<View className="flex-1 gap-1">
										<Text className="font-semibold text-wine">
											{profile.name}, {profile.age}
										</Text>
										<Text numberOfLines={1} className="text-sm text-ink">
											{lastMessage?.text ?? "New match · Start a conversation"}
										</Text>
									</View>
								</Pressable>
								{index < matches.length - 1 ? (
									<View className="ml-[72px] h-px bg-line" />
								) : null}
							</View>
						);
					})}
				</View>
			)}
		</ScrollView>
	);
}
