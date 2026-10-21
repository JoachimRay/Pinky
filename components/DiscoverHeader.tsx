import {PinkyMarkIcon} from "@/components/icons/PinkyMarkIcon";
import {SlidersIcon} from "@/components/icons/SlidersIcon";
import {Text} from "@/components/ui/text";
import {Pressable, View} from "react-native";

export function DiscoverHeader() {
	return (
		<View className="gap-3 px-5">
			<View className="h-[46px] flex-row items-center justify-between">
				<View accessible accessibilityRole="header" accessibilityLabel="Pinky">
					<Text className="font-serif text-[29px] text-wine">Pınky</Text>
					<PinkyMarkIcon style={{position: "absolute", left: 16, top: 3.5}} />
				</View>
				<Pressable
					accessibilityRole="button"
					accessibilityLabel="Filters"
					className="h-10 w-10 items-center justify-center rounded-full border border-line">
					<SlidersIcon />
				</Pressable>
			</View>
			<View className="flex-row justify-between">
				<Text className="text-[13px] text-ink">
					A little closer to your kind.
				</Text>
				<Text className="text-xs text-muted">Brooklyn</Text>
			</View>
		</View>
	);
}
