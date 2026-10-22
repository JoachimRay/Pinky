import palette from "@/constants/palette";
import { DemoSessionProvider } from "@/lib/demo-session";
import { Tabs } from "expo-router";
import { StyleSheet, Text, View, type ColorValue } from "react-native";

import { ChatIcon } from "@/components/icons/ChatIcon";
import { LayersIcon } from "@/components/icons/LayersIcon";
import { VioletOutlineIcon } from "@/components/icons/VioletOutlineIcon";

function tabLabel(text: string) {
  return function TabLabel({
    focused,
    color,
  }: {
    focused: boolean;
    color: ColorValue;
  }) {
    return (
      <Text
        style={[styles.tabLabel, { color }, focused && styles.tabLabelActive]}
      >
        {text}
      </Text>
    );
  };
}

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
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            tabBarLabel: tabLabel("Discover"),
            tabBarAccessibilityLabel: "Discover Profiles",
            tabBarIcon: ({ focused, color }) => (
              <View style={[styles.pill, focused && styles.pillActive]}>
                <LayersIcon color={color} />
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="Chat_Logs"
          options={{
            tabBarLabel: tabLabel("Chat"),
            tabBarAccessibilityLabel: "Your Chats",
            tabBarIcon: ({ focused, color }) => (
              <View style={[styles.pill, focused && styles.pillActive]}>
                <ChatIcon color={color} />
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="violets"
          options={{
            tabBarLabel: tabLabel("Violets"),
            tabBarAccessibilityLabel: "Your Violets",
            tabBarIcon: ({ focused, color }) => (
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
  tabLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 10,
    marginTop: 5,
  },
  tabLabelActive: {
    fontFamily: "Inter_600SemiBold",
  },
});
