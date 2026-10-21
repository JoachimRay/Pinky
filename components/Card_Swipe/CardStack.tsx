import { VioletIcon } from "@/components/icons/VioletIcon";
import { XIcon } from "@/components/icons/XIcon";
import { Text } from "@/components/ui/text";

import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import { Image, Pressable, StyleSheet, View, type ImageSourcePropType } from "react-native";

import dummy from "@/data/dummy.json";
import { useDemoSession } from "@/lib/demo-session";
import type { Profile } from "@/types/profile";

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

export default function CardStack() {
	const [index, setIndex] = useState(0);
	const [newMatch, setNewMatch] = useState<Profile | null>(null);
	const { decide } = useDemoSession();
	const item = profiles[index];

	function goToNext() {
		setIndex((currentIndex) => currentIndex + 1);
	}

	function handlePass(profile: Profile) {
		decide(profile, "pass");
		goToNext();
	}

	function handleViolet(profile: Profile) {
		if (decide(profile, "like")) setNewMatch(profile);
		goToNext();
	}

	function handleStartOver() {
		setIndex(0);
	}

	if (!item) {
		return (
		<View className="items-center gap-4">
			<Text>You're all caught up</Text>
			<Pressable onPress={handleStartOver}>
			<Text>Start over</Text>
			</Pressable>
		</View>
		);
	}
	return (
		<View className="w-full max-w-[460px] self-center px-6 gap-6">
		<View
			key={item.id}
			className="relative w-full aspect-[350/461] rounded-3xl overflow-hidden"
		>
			<View className="absolute inset-0 bg-blush justify-center items-center">
			<Text className="text-6xl text-wine">{item.name[0]}</Text>
			</View>
			<Image
				source={profileImages[item.id]}
				style={[
					StyleSheet.absoluteFill,
					{ width: "100%", height: "100%", resizeMode: "contain", zIndex: 1 },
				]}
				resizeMethod="resize"
				accessible={false}
				onError={({ nativeEvent }) =>
					console.log("Profile image failed to load:", nativeEvent.error)
				}
			/>
			<LinearGradient
				colors={["rgba(255,255,255,0)", "rgba(49,0,13,0.42)"]}
				locations={[0.6, 1]}
				style={[StyleSheet.absoluteFill, { zIndex: 2, elevation: 2 }]}
			/>
			<View className="absolute bottom-6 left-[22px] right-[22px] gap-2" style={{ zIndex: 3, elevation: 3 }}>
			<Text className="font-serif text-[34px] text-white">
				{item.name}, {item.age}
			</Text>
			<Text className="text-[13px] text-white">
				{item.interests.join(" · ")}
			</Text>
			<Text className="text-sm text-white">{item.bio}</Text>
			</View>
		</View>
		<View className="flex-row justify-center gap-[38px]">
			<Pressable
			onPress={() => handlePass(item)}
			accessibilityRole="button"
			accessibilityLabel={`Pass on ${item.name}`}
			className="items-center gap-[5px] active:opacity-70"
			>
			<View className="w-[60px] h-[60px] rounded-full bg-white border border-[#EAD3C8] justify-center items-center">
				<XIcon />
			</View>
			<Text className="text-xs text-ink">Pass</Text>
			</Pressable>
			<Pressable
			onPress={() => handleViolet(item)}
			accessibilityRole="button"
			accessibilityLabel={`Like ${item.name}`}
			className="items-center gap-[5px] active:opacity-70"
			>
			<View className="w-[60px] h-[60px] rounded-full bg-violet justify-center items-center">
				<VioletIcon />
			</View>
			<Text className="text-xs text-ink">Like</Text>
			</Pressable>
		</View>
		{newMatch && (
			<View
			accessibilityRole="alert"
			className="rounded-2xl bg-violet px-5 py-4"
			>
			<Text className="font-serif text-xl text-white">It’s a match!</Text>
			<Text className="mt-1 text-sm text-white">
				You and {newMatch.name} liked each other.
			</Text>
			<Pressable
				onPress={() => setNewMatch(null)}
				accessibilityRole="button"
				accessibilityLabel="Dismiss match notice"
				className="mt-3 self-start"
			>
				<Text className="text-sm text-white underline">Keep browsing</Text>
			</Pressable>
			</View>
		)}
		</View>
	);
}
