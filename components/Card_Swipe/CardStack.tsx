import { ArrowUpRightIcon } from "@/components/icons/ArrowUpRightIcon";
import { BadgeCheckIcon } from "@/components/icons/BadgeCheckIcon";
import { VioletIcon } from "@/components/icons/VioletIcon";
import { XIcon } from "@/components/icons/XIcon";
import { Text } from "@/components/ui/text";
import dummy from "@/data/dummy.json";
import { profileImages } from "@/data/profile-images";
import { useDemoSession } from "@/lib/demo-session";
import type { Profile } from "@/types/profile";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import {
  Animated,
  PanResponder,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";

const profiles: Profile[] = dummy;
const SWIPE_THRESHOLD = 105;

function profileDetails(profile: Profile) {
  const details = [
    profile.pronouns,
    profile.orientation,
    profile.distance,
  ].filter(Boolean);
  return details.length > 0
    ? details.join(" · ")
    : profile.interests.join(" · ");
}

export default function CardStack() {
  const [index, setIndex] = useState(0);
  const [newMatch, setNewMatch] = useState<Profile | null>(null);
  const { decide } = useDemoSession();
  const { width } = useWindowDimensions();
  const [position] = useState(() => new Animated.ValueXY());
  const [nextCardProgress] = useState(() => new Animated.Value(0));
  const [cardEntryProgress] = useState(() => new Animated.Value(1));
  const isAnimating = useRef(false);
  const item = profiles[index];

  const finishSwipe = useCallback(
    (direction: "left" | "right", profile: Profile) => {
      if (isAnimating.current) return;
      isAnimating.current = true;
      let matched = false;
      if (direction === "right") {
        matched = decide(profile, "like");
      } else {
        decide(profile, "pass");
      }
      const toX = direction === "right" ? width + 80 : -width - 80;
      Animated.timing(position, {
        toValue: { x: toX, y: 30 },
        duration: 230,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (!finished) {
          isAnimating.current = false;
          return;
        }
        // The next profile reuses these animated values. Reset them before
        // changing the index so it never renders at the outgoing card's
        // off-screen position for a frame.
        position.setValue({ x: 0, y: 0 });
        cardEntryProgress.setValue(0);
        nextCardProgress.setValue(0);
        setIndex((currentIndex) => currentIndex + 1);
        setNewMatch(matched ? profile : null);
        isAnimating.current = false;
      });
    },
    [cardEntryProgress, decide, nextCardProgress, position, width],
  );
  const latestItem = useRef(item);
  const latestFinishSwipe = useRef(finishSwipe);
  useEffect(() => {
    latestItem.current = item;
    latestFinishSwipe.current = finishSwipe;
  }, [item, finishSwipe]);

  const [panResponder, setPanResponder] = useState<ReturnType<
    typeof PanResponder.create
  > | null>(null);
  useEffect(() => {
    setPanResponder(
      PanResponder.create({
        onMoveShouldSetPanResponder: (_event, gesture) =>
          Math.abs(gesture.dx) > 8 &&
          Math.abs(gesture.dx) > Math.abs(gesture.dy),
        onMoveShouldSetPanResponderCapture: (_event, gesture) =>
          Math.abs(gesture.dx) > 8 &&
          Math.abs(gesture.dx) > Math.abs(gesture.dy),
        onPanResponderMove: (_event, gesture) => {
          position.setValue({ x: gesture.dx, y: gesture.dy * 0.18 });
        },
        onPanResponderRelease: (_event, gesture) => {
          if (gesture.dx > SWIPE_THRESHOLD || gesture.vx > 0.65) {
            if (latestItem.current)
              latestFinishSwipe.current("right", latestItem.current);
            return;
          }
          if (gesture.dx < -SWIPE_THRESHOLD || gesture.vx < -0.65) {
            if (latestItem.current)
              latestFinishSwipe.current("left", latestItem.current);
            return;
          }
          Animated.spring(position, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: true,
            stiffness: 180,
            damping: 18,
            mass: 0.8,
          }).start();
        },
        onPanResponderTerminate: () => {
          Animated.spring(position, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: true,
            stiffness: 180,
            damping: 18,
            mass: 0.8,
          }).start();
        },
      }),
    );
  }, [position]);

  useLayoutEffect(() => {
    if (!item) {
      position.setValue({ x: 0, y: 0 });
      cardEntryProgress.setValue(1);
      nextCardProgress.setValue(0);
      return;
    }
    if (index === 0) return;
    position.setValue({ x: 0, y: 0 });
    cardEntryProgress.setValue(0);
    Animated.spring(cardEntryProgress, {
      toValue: 1,
      useNativeDriver: true,
      stiffness: 170,
      damping: 20,
    }).start();
    nextCardProgress.setValue(0);
    Animated.spring(nextCardProgress, {
      toValue: 1,
      useNativeDriver: true,
      stiffness: 150,
      damping: 18,
    }).start();
  }, [cardEntryProgress, index, item, nextCardProgress, position]);

  function handleStartOver() {
    setNewMatch(null);
    nextCardProgress.setValue(0);
    cardEntryProgress.setValue(1);
    position.setValue({ x: 0, y: 0 });
    setIndex(0);
  }

  if (!item) {
    return (
      <View className="flex-1 items-center justify-center gap-4 px-5">
        <Text className="font-serif text-2xl text-wine">
          {"You're all caught up"}
        </Text>
        <Pressable
          onPress={handleStartOver}
          accessibilityRole="button"
          className="rounded-full border border-line px-5 py-2.5 active:opacity-70"
        >
          <Text className="text-sm text-wine">Start over</Text>
        </Pressable>
      </View>
    );
  }

  const rotation = position.x.interpolate({
    inputRange: [-width, 0, width],
    outputRange: ["-12deg", "0deg", "12deg"],
  });
  const likeOpacity = position.x.interpolate({
    inputRange: [0, 50, 130],
    outputRange: [0, 0.7, 1],
    extrapolate: "clamp",
  });
  const passOpacity = position.x.interpolate({
    inputRange: [-130, -50, 0],
    outputRange: [1, 0.7, 0],
    extrapolate: "clamp",
  });
  const cardContent = (profile: Profile) => (
    <>
      <View className="absolute inset-0 items-center justify-center bg-blush">
        <Text className="text-6xl text-wine">{profile.name[0]}</Text>
      </View>
      <Animated.Image
        source={profileImages[profile.id]}
        style={[
          StyleSheet.absoluteFill,
          { width: "100%", height: "100%", resizeMode: "cover", zIndex: 1 },
        ]}
        resizeMethod="resize"
        accessible={false}
      />
      <LinearGradient
        colors={["rgba(255,255,255,0)", "rgba(49,0,13,0.81)"]}
        locations={[0.35, 1]}
        style={[StyleSheet.absoluteFill, { zIndex: 2, elevation: 2 }]}
      />
      <View
        className="absolute left-4 right-4 top-[14px] flex-row gap-[5px]"
        style={{ zIndex: 3, elevation: 3 }}
        accessible={false}
      >
        <View className="h-[3px] flex-1 rounded-sm bg-white" />
        <View className="h-[3px] flex-1 rounded-sm bg-white/40" />
      </View>
      <Animated.View
        pointerEvents="none"
        className="absolute left-5 top-8 rounded-lg border-2 border-violet px-3 py-1"
        style={{
          zIndex: 4,
          opacity: likeOpacity,
          transform: [{ rotate: "-12deg" }],
        }}
      >
        <Text className="font-serif text-2xl text-violet">LIKE</Text>
      </Animated.View>
      <Animated.View
        pointerEvents="none"
        className="absolute right-5 top-8 rounded-lg border-2 border-white px-3 py-1"
        style={{
          zIndex: 4,
          opacity: passOpacity,
          transform: [{ rotate: "12deg" }],
        }}
      >
        <Text className="font-serif text-2xl text-white">PASS</Text>
      </Animated.View>
      <View
        className="absolute bottom-6 left-[22px] right-[22px] items-start gap-2"
        style={{ zIndex: 3, elevation: 3 }}
      >
        <View className="w-full flex-row items-center justify-between gap-2">
          <View className="min-w-0 flex-1 flex-row items-center gap-2">
            <Text className="font-serif text-[34px] text-white">
              {profile.name}, {profile.age}
            </Text>
            {profile.verified && <BadgeCheckIcon accessibilityLabel="Verified" />}
          </View>
          <Pressable
            onPress={() => router.push(`/profile/${profile.id}`)}
            accessibilityRole="button"
            accessibilityLabel={`View ${profile.name}'s full profile`}
            className="h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full bg-white/20"
          >
            <ArrowUpRightIcon />
          </Pressable>
        </View>
        <Text className="text-[13px] text-white">
          {profileDetails(profile)}
        </Text>
        {profile.intention && (
          <View className="rounded-full bg-shell/20 px-2.5 py-1.5">
            <Text className="text-xs text-white">{profile.intention}</Text>
          </View>
        )}
        <Text className="text-sm text-white">“{profile.bio}”</Text>
      </View>
    </>
  );

  return (
    <View className="w-full max-w-[460px] flex-1 self-center gap-3 px-5 pb-2 pt-3">
      <View className="relative w-full flex-1 overflow-hidden rounded-3xl">
        {profiles[index + 1] ? (
          <Animated.View
            pointerEvents="none"
            className="absolute inset-0 overflow-hidden rounded-3xl"
            style={[
              styles.card,
              {
                opacity: nextCardProgress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.72, 1],
                }),
                transform: [
                  {
                    scale: nextCardProgress.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.94, 1],
                    }),
                  },
                ],
              },
            ]}
          >
            {cardContent(profiles[index + 1])}
          </Animated.View>
        ) : null}
        <Animated.View
          key={item.id}
          {...(panResponder?.panHandlers ?? {})}
          style={[
            styles.card,
            {
              opacity: cardEntryProgress,
              transform: [
                {
                  translateY: cardEntryProgress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [14, 0],
                  }),
                },
                {
                  scale: cardEntryProgress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.96, 1],
                  }),
                },
                ...position.getTranslateTransform(),
                { rotate: rotation },
              ],
            },
          ]}
        >
          <View className="relative h-full w-full overflow-hidden rounded-3xl">
            {cardContent(item)}
          </View>
        </Animated.View>
      </View>

      <View className="flex-row justify-center gap-[38px]">
        <Pressable
          onPress={() => finishSwipe("left", item)}
          accessibilityRole="button"
          accessibilityLabel={`Pass on ${item.name}`}
          className="items-center gap-[5px] active:opacity-70"
        >
          <View className="h-[60px] w-[60px] items-center justify-center rounded-full border border-line bg-white">
            <XIcon />
          </View>
          <Text className="text-xs text-ink">Pass</Text>
        </Pressable>
        <Pressable
          onPress={() => finishSwipe("right", item)}
          accessibilityRole="button"
          accessibilityLabel={`Send a violet to ${item.name}`}
          className="items-center gap-[5px] active:opacity-70"
        >
          <View className="h-[60px] w-[60px] items-center justify-center rounded-full bg-violet">
            <VioletIcon />
          </View>
          <Text className="text-xs text-ink">Violet</Text>
        </Pressable>
      </View>

      {newMatch && (
        <View
          accessibilityRole="alert"
          className="rounded-2xl bg-violet px-5 py-4"
        >
          <Text className="font-serif text-xl text-white">It’s a match!</Text>
          <Text className="mt-1 text-sm text-white">
            You and {newMatch.name} liked each other.
          </Text>
          <Pressable
            onPress={() => setNewMatch(null)}
            accessibilityRole="button"
            accessibilityLabel="Dismiss match notice"
            className="mt-3 self-start"
          >
            <Text className="text-sm text-white underline">Keep browsing</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    ...StyleSheet.absoluteFill,
    zIndex: 1,
  },
});
