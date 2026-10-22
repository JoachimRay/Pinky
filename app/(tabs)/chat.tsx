import {Text} from "@/components/ui/text";
import {ScrollView, View} from "react-native";
import {useSafeAreaInsets} from "react-native-safe-area-context";

export default function ChatScreen() {
	const insets = useSafeAreaInsets();

	return (
		<ScrollView
			className="flex-1 bg-shell"
			contentContainerClassName="flex-grow px-6 pb-10"
			contentContainerStyle={{paddingTop: insets.top + 8}}>
			<View className="mb-8 gap-2">
				<Text className="font-serif text-4xl text-wine">Chats</Text>
				<Text className="text-sm text-ink">
					Your conversations with matches will appear here.
				</Text>
			</View>
			<View className="flex-1 items-center justify-center gap-2 rounded-3xl bg-white px-6 py-12">
				<Text className="font-serif text-2xl text-wine">Start a conversation</Text>
				<Text className="text-center text-sm text-ink">
					When you connect with a match, you can chat with them here.
				</Text>
			</View>
		</ScrollView>
	);
}
