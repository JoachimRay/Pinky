import { Tabs } from "expo-router";
import { DemoSessionProvider } from "@/lib/demo-session";

export default function TabLayout() {
	return (
		<DemoSessionProvider>
			<Tabs>
				<Tabs.Screen name="index" options={{ title: "Browse" }} />
				<Tabs.Screen name="Matches" options={{ title: "Matches" }} />
			</Tabs>
		</DemoSessionProvider>
	);
}
