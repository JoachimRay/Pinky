import {DiscoverHeader} from "@/components/DiscoverHeader";
import CardStack from "@/components/Card_Swipe/CardStack";
import {View} from "react-native";
import {useSafeAreaInsets} from "react-native-safe-area-context";

export default function HomeScreen() {
	const insets = useSafeAreaInsets();

	return (
		<View className="flex-1 bg-shell" style={{paddingTop: insets.top}}>
			<DiscoverHeader />
			<CardStack />
		</View>
	);
}
