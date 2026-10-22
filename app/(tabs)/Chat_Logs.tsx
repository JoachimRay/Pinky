import {BadgeCheckIcon} from "@/components/icons/BadgeCheckIcon";
import {ShieldCheckIcon} from "@/components/icons/ShieldCheckIcon";
import {Text} from "@/components/ui/text";
import palette from "@/constants/palette";
import dummy from "@/data/dummy.json";
import {profileImages} from "@/data/profile-images";
import {useDemoSession} from "@/lib/demo-session";
import type {Profile} from "@/types/profile";
import {router} from "expo-router";
import {Image, Pressable, ScrollView, StyleSheet, View} from "react-native";
import {useSafeAreaInsets} from "react-native-safe-area-context";

const semibold = {fontFamily: "Inter_600SemiBold"};

function openChat(profile: Profile) {
	router.push({
		pathname: "/Chat_conversation",
		params: {matchId: String(profile.id)},
	});
}

function Avatar({profile, size}: {profile: Profile; size: number}) {
	return (
		<View
			className="items-center justify-center overflow-hidden bg-blush"
			style={{width: size, height: size, borderRadius: size / 2}}>
			<Text className="font-serif text-wine" style={{fontSize: size * 0.4}}>
				{profile.name[0]}
			</Text>
			<Image
				source={profileImages[profile.id]}
				style={StyleSheet.absoluteFill}
				accessible={false}
			/>
		</View>
	);
}

export default function ChatScreen() {
	const {matches, messagesByMatchId, seedDemoConversation} = useDemoSession();
	const insets = useSafeAreaInsets();

	const newSparks = matches.filter(
		(profile) => !messagesByMatchId[profile.id]?.length,
	);
	const conversations = matches.filter(
		(profile) => messagesByMatchId[profile.id]?.length,
	);

	return (
		<ScrollView
			className="flex-1 bg-shell"
			contentContainerClassName="flex-grow gap-[22px] px-6 pb-10"
			contentContainerStyle={{paddingTop: insets.top + 8}}>
			<Text
				className="font-serif text-4xl text-wine"
				accessibilityRole="header">
				Your connections.
			</Text>

			{__DEV__ ? (
				<Pressable
					accessibilityRole="button"
					className="self-start rounded-full border border-line bg-white px-4 py-2 active:opacity-70"
					onPress={() => {
						const profile = dummy[0];
						seedDemoConversation(profile);
						openChat(profile);
					}}>
					<Text className="text-xs text-wine" style={semibold}>
						Demo: open a seeded conversation
					</Text>
				</Pressable>
			) : null}

			{matches.length === 0 ? (
				<View className="flex-1 items-center justify-center gap-2 px-6 py-12">
					<Text className="font-serif text-2xl text-wine">
						No connections yet
					</Text>
					<Text className="text-center text-sm text-muted">
						Send a violet on Discover. When it&apos;s mutual, they&apos;ll show
						up here.
					</Text>
				</View>
			) : null}

			{newSparks.length > 0 ? (
				<View className="gap-[13px]">
					<View className="flex-row items-center justify-between">
						<Text className="text-sm text-ink" style={semibold}>
							New sparks
						</Text>
						<Text className="text-xs text-muted">
							{newSparks.length} {newSparks.length === 1 ? "match" : "matches"}
						</Text>
					</View>
					<ScrollView
						horizontal
						showsHorizontalScrollIndicator={false}
						contentContainerClassName="gap-[25px]">
						{newSparks.map((profile) => (
							<Pressable
								key={profile.id}
								accessibilityRole="button"
								accessibilityLabel={`Start a chat with ${profile.name}`}
								onPress={() => openChat(profile)}
								className="w-[76px] items-center gap-[7px] active:opacity-70">
								<View className="rounded-full border-[1.5px] border-rose p-[3px]">
									<Avatar profile={profile} size={68} />
								</View>
								<Text numberOfLines={1} className="text-xs text-ink">
									{profile.name.split(" ")[0]}
								</Text>
							</Pressable>
						))}
					</ScrollView>
				</View>
			) : null}

			{conversations.length > 0 ? (
				<View className="gap-[2px]">
					<Text className="text-sm text-ink" style={semibold}>
						Messages
					</Text>
					{conversations.map((profile) => {
						const messages = messagesByMatchId[profile.id] ?? [];
						const lastMessage = [...messages]
							.reverse()
							.find((message) => message.sender !== "system");
						const isOwn = lastMessage?.sender === "you";

						return (
							<Pressable
								key={profile.id}
								accessibilityRole="button"
								accessibilityLabel={`Chat with ${profile.name}. Last message: ${lastMessage?.text ?? ""}`}
								onPress={() => openChat(profile)}
								className="flex-row items-center gap-3 border-b border-line py-[17px] active:opacity-70">
								<Avatar profile={profile} size={58} />
								<View className="flex-1 gap-1.5">
									<View className="flex-row items-center gap-[5px]">
										<Text className="text-base text-ink" style={semibold}>
											{profile.name}
										</Text>
										{profile.verified && (
											<BadgeCheckIcon
												width={15}
												height={15}
												color={palette.wine}
											/>
										)}
									</View>
									<Text
										numberOfLines={1}
										className={`text-[13px] ${isOwn ? "text-muted" : "text-ink"}`}>
										{isOwn ? `You: ${lastMessage.text}` : lastMessage?.text}
									</Text>
								</View>
							</Pressable>
						);
					})}
				</View>
			) : null}

			{matches.length > 0 ? (
				<View className="flex-row items-start gap-[9px]">
					<ShieldCheckIcon width={18} height={18} />
					<Text className="flex-1 text-xs text-muted">
						Good connections start with kindness.
					</Text>
				</View>
			) : null}
		</ScrollView>
	);
}
