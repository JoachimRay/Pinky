import {VioletIcon} from "@/components/icons/VioletIcon";
import {Text} from "@/components/ui/text";
import palette from "@/constants/palette";
import dummy from "@/data/dummy.json";
import {profileImages} from "@/data/profile-images";
import {useDemoSession} from "@/lib/demo-session";
import type {Profile} from "@/types/profile";
import {router} from "expo-router";
import {Image, Pressable, ScrollView, StyleSheet, View} from "react-native";
import {useSafeAreaInsets} from "react-native-safe-area-context";

const profiles: Profile[] = dummy;
const DAILY_VIOLETS = 3;
const semibold = {fontFamily: "Inter_600SemiBold"};
const purpleViolet = {
	petal: palette.lilac,
	petalAlt: palette.violet,
	center: palette.cream,
};

function Photo({profile, style}: {profile: Profile; style: object}) {
	return (
		<View
			className="items-center justify-center overflow-hidden bg-blush"
			style={style}>
			<Text className="font-serif text-2xl text-wine">{profile.name[0]}</Text>
			<Image
				source={profileImages[profile.id]}
				style={StyleSheet.absoluteFill}
				accessible={false}
			/>
		</View>
	);
}

function openChat(profile: Profile) {
	router.push({
		pathname: "/Chat_conversation",
		params: {matchId: String(profile.id)},
	});
}

export default function VioletsScreen() {
	const {decisions, matches, decide} = useDemoSession();
	const insets = useSafeAreaInsets();

	const matchIds = new Set(matches.map((match) => match.id));
	const received = profiles.filter(
		(profile) => profile.mutualLike && !decisions[profile.id],
	);
	const sent = profiles.filter((profile) => decisions[profile.id] === "like");
	const violetsLeft = Math.max(DAILY_VIOLETS - sent.length, 0);

	return (
		<ScrollView
			className="flex-1 bg-shell"
			contentContainerClassName="flex-grow gap-[22px] px-6 pb-10"
			contentContainerStyle={{paddingTop: insets.top + 8}}>
			<Text
				className="font-serif text-4xl text-wine"
				accessibilityRole="header">
				Your violets.
			</Text>

			<Text className="text-sm text-muted">
				People who sent you a violet. Send one back and it&apos;s a pinky
				promise.
			</Text>

			<View
				className="flex-row items-center gap-2.5 self-start rounded-full bg-violet-tint py-2.5 pl-3.5 pr-4"
				accessible
				accessibilityLabel={
					violetsLeft > 0
						? `${violetsLeft} violets left to send today`
						: "No violets left today"
				}>
				<View className="flex-row gap-1">
					{Array.from({length: DAILY_VIOLETS}, (_, index) => (
						<VioletIcon
							key={index}
							width={20}
							height={20}
							{...purpleViolet}
							opacity={index < violetsLeft ? 1 : 0.3}
						/>
					))}
				</View>
				<Text className="text-[13px] text-violet">
					{violetsLeft > 0
						? `${violetsLeft} ${violetsLeft === 1 ? "violet" : "violets"} left to send today`
						: "No violets left today"}
				</Text>
			</View>

			<View className="gap-3">
				<View className="flex-row items-center justify-between">
					<Text className="text-sm text-wine" style={semibold}>
						Sent you a violet
					</Text>
					{received.length > 0 ? (
						<Text className="text-xs text-muted">{received.length} new</Text>
					) : null}
				</View>

				{received.length === 0 ? (
					<Text className="text-[13px] text-muted">
						No new violets right now.
					</Text>
				) : (
					<View className="flex-row flex-wrap justify-between gap-y-3">
						{received.map((profile) => (
							<View
								key={profile.id}
								className="overflow-hidden rounded-[22px] border border-cream bg-white pb-3"
								style={{width: "48%"}}>
								<Photo profile={profile} style={{height: 150, width: "100%"}} />
								<View className="gap-[3px] px-3 pt-2">
									<View className="flex-row items-center gap-1.5">
										<VioletIcon width={14} height={14} {...purpleViolet} />
										<Text
											numberOfLines={1}
											className="flex-1 text-[15px] text-wine"
											style={semibold}>
											{profile.name.split(" ")[0]}, {profile.age}
										</Text>
									</View>
									<Text
										numberOfLines={2}
										className="min-h-[34px] text-xs leading-[17px] text-muted">
										“{profile.bio}”
									</Text>
								</View>
								<Pressable
									accessibilityRole="button"
									accessibilityLabel={`Send a violet back to ${profile.name}`}
									onPress={() => decide(profile, "like")}
									className="mx-3 mt-2 flex-row items-center justify-center gap-1.5 rounded-full bg-violet py-[9px] active:opacity-70">
									<VioletIcon width={14} height={14} />
									<Text className="text-[13px] text-shell" style={semibold}>
										Send one back
									</Text>
								</Pressable>
							</View>
						))}
					</View>
				)}
			</View>

			<View className="gap-3">
				<Text className="text-sm text-wine" style={semibold}>
					You sent
				</Text>

				{sent.length === 0 ? (
					<Text className="text-[13px] text-muted">
						Violets you send will show up here.
					</Text>
				) : (
					sent.map((profile) => {
						const isMatch = matchIds.has(profile.id);
						return (
							<Pressable
								key={profile.id}
								accessibilityRole="button"
								accessibilityLabel={
									isMatch
										? `${profile.name}, pinky promise. Open chat`
										: `${profile.name}, waiting for a violet back`
								}
								disabled={!isMatch}
								onPress={() => openChat(profile)}
								className="flex-row items-center gap-3 rounded-[18px] border border-cream bg-white py-3 pl-3 pr-3.5 active:opacity-70">
								<Photo
									profile={profile}
									style={{width: 44, height: 44, borderRadius: 22}}
								/>
								<View className="flex-1 gap-0.5">
									<Text
										numberOfLines={1}
										className="text-[15px] text-wine"
										style={semibold}>
										{profile.name.split(" ")[0]}, {profile.age}
									</Text>
									<Text className="text-xs text-muted">
										{isMatch ? "Sent one back" : "Waiting for a violet back"}
									</Text>
								</View>
								{isMatch ? (
									<View className="rounded-full bg-rose px-3 py-1.5">
										<Text className="text-xs text-shell" style={semibold}>
											Pinky promise
										</Text>
									</View>
								) : (
									<View className="rounded-full border border-line px-3 py-1.5">
										<Text className="text-xs text-muted">Waiting</Text>
									</View>
								)}
							</Pressable>
						);
					})
				)}
			</View>
		</ScrollView>
	);
}
