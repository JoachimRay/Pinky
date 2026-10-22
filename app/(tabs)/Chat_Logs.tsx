import { useDemoSession } from "@/lib/demo-session";
import dummy from "@/data/dummy.json";
import { router } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";

export default function ChatScreen() {
  const { matches, messagesByMatchId, seedDemoConversation } = useDemoSession();

  return (
    <ScrollView>
      {__DEV__ ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            const profile = dummy[0];
            seedDemoConversation(profile);
            router.push({
              pathname: "/Chat_conversation",
              params: { matchId: String(profile.id) },
            });
          }}
        >
          <Text>Demo: open a seeded conversation</Text>
        </Pressable>
      ) : null}

      {matches.length === 0 ? (
        <View>
          <Text>No Chats Yet</Text>
          <Text>Start swiping to find matches and start chatting!</Text>
        </View>
      ) : (
        <View>
          <View>
            {matches.map((profile) => {
              const messages = messagesByMatchId[profile.id] ?? [];
              const lastMessage = messages[messages.length - 1];

              return (
                <Pressable
                  key={profile.id}
                  accessibilityRole="button"
                  accessibilityLabel={`Chat with ${profile.name}`}
                  onPress={() =>
                    router.push({
                      pathname: "/Chat_conversation",
                      params: { matchId: String(profile.id) },
                    })
                  }
                >
                  <View>
                    <Text>{profile.name[0]}</Text>
                  </View>

                  <View>
                    <Text>
                      {profile.name}, {profile.age}
                    </Text>
                    <Text numberOfLines={1} className="text-sm text-ink">
                      {lastMessage?.text ?? "New match · Start a conversation"}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>
      )}
    </ScrollView>
  );
}
