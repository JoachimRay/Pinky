import palette from "@/constants/palette";
import {DemoSessionProvider} from "@/lib/demo-session";
import {Tabs} from "expo-router";
import {StyleSheet} from "react-native";

export default function TabLayout() {
	return (
		<DemoSessionProvider>
			<Tabs
				screenOptions={{
					headerShown: false,
					tabBarActiveTintColor: palette.wine,
					tabBarInactiveTintColor: palette.muted,
					tabBarStyle: styles.tabBar,
					tabBarLabelStyle: styles.tabLabel,
				}}>
				<Tabs.Screen name="index" options={{title: "Browse"}} />
				<Tabs.Screen name="Matches" options={{title: "Matches"}} />
			</Tabs>
		</DemoSessionProvider>
	);
}

const styles = StyleSheet.create({
	tabBar: {
		backgroundColor: palette.shell,
		borderTopColor: palette.line,
		borderTopWidth: 1,
		paddingTop: 10,
	},
	tabLabel: {
		fontSize: 10,
		marginTop: 5,
	},
});
