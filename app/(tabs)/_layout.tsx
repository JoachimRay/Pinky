import palette from "@/constants/palette";
import {DemoSessionProvider} from "@/lib/demo-session";
import {Tabs} from "expo-router";
import {StyleSheet, View} from "react-native";

import {LayersIcon} from "@/components/icons/LayersIcon";
import {VioletOutlineIcon} from "@/components/icons/VioletOutlineIcon";

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
					tabBarIconStyle: styles.iconSlot,
				}}>
				<Tabs.Screen
					name="index"
					options={{
						title: "Discover",
						tabBarAccessibilityLabel: "Browse Profiles",
						tabBarIcon: ({focused, color}) => (
							<View style={[styles.pill, focused && styles.pillActive]}>
								<LayersIcon color={color} />
							</View>
						),
					}}
				/>
				<Tabs.Screen
					name="violets"
					options={{
						title: "Violets",
						tabBarAccessibilityLabel: "Your matches",
						tabBarIcon: ({focused, color}) => (
							<View style={[styles.pill, focused && styles.pillActive]}>
								<VioletOutlineIcon color={color} />
							</View>
						),
					}}
				/>
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
	iconSlot: {
		width: 46,
		height: 29,
	},
	pill: {
		width: 46,
		height: 29,
		borderRadius: 20,
		alignItems: "center",
		justifyContent: "center",
	},
	pillActive: {
		backgroundColor: palette.cream,
	},
});
