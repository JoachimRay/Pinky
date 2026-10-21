import {ArrowUpRightIcon} from "@/components/icons/ArrowUpRightIcon";
import {BadgeCheckIcon} from "@/components/icons/BadgeCheckIcon";
import {VioletIcon} from "@/components/icons/VioletIcon";
import {XIcon} from "@/components/icons/XIcon";
import {Text} from "@/components/ui/text";

import {LinearGradient} from "expo-linear-gradient";
import {useState} from "react";
import {
	Image,
	Pressable,
	StyleSheet,
	View,
	type ImageSourcePropType,
} from "react-native";

import dummy from "@/data/dummy.json";
import {useDemoSession} from "@/lib/demo-session";
import type {Profile} from "@/types/profile";

const profiles: Profile[] = dummy;

const profileImages: Record<number, ImageSourcePropType> = {
	1: require("../../assets/profiles/girl lq icon.jpg"),
	2: require("../../assets/profiles/pexels-soc-nang-d-ng-2150345854-35718894.jpg"),
	3: require("../../assets/profiles/pexels-quintin-alderman-1104905988-29637279.jpg"),
	4: require("../../assets/profiles/Kendall.jpg"),
	5: require("../../assets/profiles/pexels-doquyen-1520760.jpg"),
	6: require("../../assets/profiles/pexels-kenzhar-sharap-125323072-19718654.jpg"),
	7: require("../../assets/profiles/pexels-paperpilot-17550359.jpg"),
	8: require("../../assets/profiles/pic1.jpg"),
	9: require("../../assets/profiles/pexels-husamettin-akgun-1162768-3695844.jpg"),
	10: require("../../assets/profiles/pexels-meowrian-7893962.jpg"),
};

function profileDetails(profile: Profile) {
	const details = [
		profile.pronouns,
		profile.orientation,
		profile.distance,
	].filter(Boolean);
	return details.length > 0
		? details.join(" · ")
		: profile.interests.join(" · ");
}

export default function CardStack() {
	const [index, setIndex] = useState(0);
	const [newMatch, setNewMatch] = useState<Profile | null>(null);
	const {decide} = useDemoSession();
	const item = profiles[index];

	function goToNext() {
		setNewMatch(null);
		setIndex((currentIndex) => currentIndex + 1);
	}

	function handlePass(profile: Profile) {
		decide(profile, "pass");
		goToNext();
	}

	function handleViolet(profile: Profile) {
		const matched = decide(profile, "like");
		goToNext();
		if (matched) setNewMatch(profile);
	}

	function handleStartOver() {
		setIndex(0);
	}

	if (!item) {
		return (
			<View className="flex-1 items-center justify-center gap-4 px-5">
				<Text className="font-serif text-2xl text-wine">
					{"You're all caught up"}
				</Text>
				<Pressable
					onPress={handleStartOver}
					accessibilityRole="button"
					className="rounded-full border border-line px-5 py-2.5 active:opacity-70">
					<Text className="text-sm text-wine">Start over</Text>
				</Pressable>
			</View>
		);
	}

	return (
		<View className="w-full max-w-[460px] flex-1 self-center gap-3 px-5 pb-2 pt-3">
			<View
				key={item.id}
				className="relative w-full flex-1 overflow-hidden rounded-3xl">
				<View className="absolute inset-0 items-center justify-center bg-blush">
					<Text className="text-6xl text-wine">{item.name[0]}</Text>
				</View>
				<Image
					source={profileImages[item.id]}
					style={[
						StyleSheet.absoluteFill,
						{width: "100%", height: "100%", resizeMode: "cover", zIndex: 1},
					]}
					resizeMethod="resize"
					accessible={false}
					onError={({nativeEvent}) =>
						console.log("Profile image failed to load:", nativeEvent.error)
					}
				/>
				<LinearGradient
					colors={["rgba(255,255,255,0)", "rgba(49,0,13,0.81)"]}
					locations={[0.35, 1]}
					style={[StyleSheet.absoluteFill, {zIndex: 2, elevation: 2}]}
				/>

				<View
					className="absolute left-4 right-4 top-[14px] flex-row gap-[5px]"
					style={{zIndex: 3, elevation: 3}}
					accessible={false}>
					<View className="h-[3px] flex-1 rounded-sm bg-white" />
					<View className="h-[3px] flex-1 rounded-sm bg-white/40" />
				</View>

				<Pressable
					accessibilityRole="button"
					accessibilityLabel={`Open ${item.name}'s profile`}
					className="absolute bottom-[114px] right-[18px] h-[34px] w-[34px] items-center justify-center rounded-full bg-white/20 active:opacity-70"
					style={{zIndex: 3, elevation: 3}}>
					<ArrowUpRightIcon />
				</Pressable>

				<View
					className="absolute bottom-6 left-[22px] right-[22px] items-start gap-2"
					style={{zIndex: 3, elevation: 3}}>
					<View className="flex-row items-center gap-2">
						<Text className="font-serif text-[34px] text-white">
							{item.name}, {item.age}
						</Text>
						{item.verified && <BadgeCheckIcon accessibilityLabel="Verified" />}
					</View>
					<Text className="text-[13px] text-white">{profileDetails(item)}</Text>
					{item.intention && (
						<View className="rounded-full bg-shell/20 px-2.5 py-1.5">
							<Text className="text-xs text-white">{item.intention}</Text>
						</View>
					)}
					<Text className="text-sm text-white">“{item.bio}”</Text>
				</View>
			</View>

			<View className="flex-row justify-center gap-[38px]">
				<Pressable
					onPress={() => handlePass(item)}
					accessibilityRole="button"
					accessibilityLabel={`Pass on ${item.name}`}
					className="items-center gap-[5px] active:opacity-70">
					<View className="h-[60px] w-[60px] items-center justify-center rounded-full border border-line bg-white">
						<XIcon />
					</View>
					<Text className="text-xs text-ink">Pass</Text>
				</Pressable>
				<Pressable
					onPress={() => handleViolet(item)}
					accessibilityRole="button"
					accessibilityLabel={`Send a violet to ${item.name}`}
					className="items-center gap-[5px] active:opacity-70">
					<View className="h-[60px] w-[60px] items-center justify-center rounded-full bg-violet">
						<VioletIcon />
					</View>
					<Text className="text-xs text-ink">Violet</Text>
				</Pressable>
			</View>

			{newMatch && (
				<View
					accessibilityRole="alert"
					className="rounded-2xl bg-violet px-5 py-4">
					<Text className="font-serif text-xl text-white">It’s a match!</Text>
					<Text className="mt-1 text-sm text-white">
						You and {newMatch.name} liked each other.
					</Text>
					<Pressable
						onPress={() => setNewMatch(null)}
						accessibilityRole="button"
						accessibilityLabel="Dismiss match notice"
						className="mt-3 self-start">
						<Text className="text-sm text-white underline">Keep browsing</Text>
					</Pressable>
				</View>
			)}
		</View>
	);
}
