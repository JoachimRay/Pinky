import { DemoSessionProvider } from "@/lib/demo-session";
import { Tabs } from "expo-router";

export default function TabLayout() {
	return (
		<DemoSessionProvider>
			<Tabs>
				<Tabs.Screen name="index" options={{ title: "Browse" }} />
				<Tabs.Screen name="Matches" options={{ title: "Matches" }} />
				<Tabs.Screen name = "Chat_Logs" options={{ title: "Chat" }} />


				<Tabs.Screen
				name = "Chat_Conversation"
				options={{href: null, title: "Chat Conversation"}}/>
				
			</Tabs>
		</DemoSessionProvider>
	);
}
