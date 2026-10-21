import {Text} from "@/components/ui/text";
import {useDemoSession} from "@/lib/demo-session";
import {ScrollView, View} from "react-native";
import {useSafeAreaInsets} from "react-native-safe-area-context";

export default function MatchesScreen() {
	const {matches} = useDemoSession();
	const insets = useSafeAreaInsets();

	return (
		<ScrollView
			className="flex-1 bg-shell"
			contentContainerClassName="flex-grow px-6 pb-10"
			contentContainerStyle={{paddingTop: insets.top + 24}}>
			<View className="mb-8 gap-2">
				<Text className="font-serif text-4xl text-wine">Your violets</Text>
				<Text className="text-sm text-ink">People who liked you back.</Text>
			</View>
			{matches.length === 0 ? (
				<View className="flex-1 items-center justify-center gap-2 rounded-3xl bg-white px-6 py-12">
					<Text className="font-serif text-2xl text-wine">No matches yet</Text>
					<Text className="text-center text-sm text-ink">
						Keep browsing and send a Violet when someone catches your eye.
					</Text>
				</View>
			) : (
				<View className="gap-3">
					{matches.map((profile) => (
						<View
							key={profile.id}
							className="flex-row items-center gap-4 rounded-2xl bg-white p-4">
							<View className="h-14 w-14 items-center justify-center rounded-full bg-blush">
								<Text className="font-serif text-2xl text-wine">
									{profile.name[0]}
								</Text>
							</View>
							<View className="flex-1 gap-1">
								<Text className="font-semibold text-wine">
									{profile.name}, {profile.age}
								</Text>
								<Text className="text-xs text-ink">
									You both liked each other
								</Text>
							</View>
						</View>
					))}
				</View>
			)}
		</ScrollView>
	);
}
