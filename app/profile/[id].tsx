import { BadgeCheckIcon } from "@/components/icons/BadgeCheckIcon";
import { Text } from "@/components/ui/text";
import palette from "@/constants/palette";
import dummy from "@/data/dummy.json";
import { profileImages } from "@/data/profile-images";
import type { Profile } from "@/types/profile";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const profiles: Profile[] = dummy;

export default function ProfileDetailsScreen(){
    const {id} = useLocalSearchParams<{id: string}>();
    const insets = useSafeAreaInsets();
    const [safetyNotice, setSafetyNotice] = useState("");
    const profile = profiles.find((candidate) => candidate.id === Number(id));

    if(!profile){
        return(
            <View style={[styles.screen, styles.centered, {paddingTop: insets.top}]}>
                <Stack.Screen options={{title: "Profile"}} />
                <Text style={styles.title}>Profile unavailable</Text>
                <Pressable
                    onPress={() => router.back()}
                    accessibilityRole="button"
                    style={styles.backButton}
                >
                    <Text style={styles.backLink}>Back to browsing</Text>
                </Pressable>
            </View>
        );
    }

    const details = [
        profile.pronouns,
        profile.orientation,
        profile.location,
        profile.distance,
    ].filter(Boolean);

    return(
        <View style={[styles.screen, {paddingTop: insets.top}]}>
            <Stack.Screen options={{title: `${profile.name}'s profile`}}/>

            <View style={styles.header}>
                <Pressable
                    onPress={() => router.back()}
                    accessibilityRole="button"
                    accessibilityLabel="Back to browsing"
                    hitSlop={10}
                    style={styles.backButton}
                >
                    <Text style={styles.backLink}>‹</Text>
                </Pressable>
                <Text style={styles.headerTitle}>Discover · Profile</Text>
                <View style={styles.headerSpacer}/>
            </View>

            <ScrollView
                contentContainerStyle={[
                    styles.content,
                    {paddingBottom: Math.max(insets.bottom, 24)},
                ]}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.hero}>
                    {profileImages[profile.id] ? (
                        <Image
                            source={profileImages[profile.id]}
                            style={styles.image}
                            accessibilityLabel={`${profile.name}'s profile photo`}
                        />
                    ) : (
                        <View style={[styles.image, styles.imageFallback]}>
                            <Text style={styles.fallbackInitial}>
                                {profile.name.charAt(0)}
                            </Text>
                        </View>
                    )}
                </View>

                <View style={styles.nameRow}>
                    <Text style={styles.title}>
                        {profile.name}, {profile.age}
                    </Text>
                    {profile.verified && (
                        <BadgeCheckIcon accessibilityLabel="Verified Profile"/>
                    )}
                </View>

                {details.length > 0 && (
                    <Text style={styles.subtitle}>{details.join(" · ")}</Text>
                )}

                {profile.intention ? (
                    <View style={styles.intention}>
                        <Text style={styles.eyebrow}>LOOKING FOR</Text>
                        <Text style={styles.intentionText}>{profile.intention}</Text>
                    </View>
                ) : null}

                {profile.bio?.trim() ? (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>A little about me</Text>
                        <Text style={styles.body}>{profile.bio}</Text>
                    </View>
                ) : null}

                {profile.occupation?.trim() || profile.location?.trim() ? (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>More about {profile.name}</Text>
                        {profile.occupation?.trim() ? (
                            <Text style={styles.body}>{profile.occupation}</Text>
                        ) : null}
                        {profile.location?.trim() ? (
                            <Text style={styles.body}>{profile.location}</Text>
                        ): null}
                    </View>
                ) : null}

                {profile.interests?.length > 0 ? (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Interests</Text>
                        <View style={styles.chips}>
                            {profile.interests.filter(Boolean).map((interest) => (
                                <View key={interest} style={styles.chip}>
                                    <Text style={styles.chipText}>{interest}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                ): null}

                {profile.sharedInterests?.filter(Boolean).length ? (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Our little overlaps</Text>
                        <View style={styles.chips}>
                            {profile.sharedInterests.filter(Boolean).map((interest) => (
                                <View key={interest} style={styles.overlapChip}>
                                    <Text style={styles.overlapChipText}>{interest}</Text>
                                </View>
                            ))}
                        </View>
                        <Text style={styles.helperText}>Highlighted interests are ones you share.</Text>
                    </View>
                ) : null}

                {profile.firstDatePrompt?.trim() ? (
                    <View style={styles.promptCard}>
                        <Text style={styles.eyebrow}>MY IDEAL FIRST DATE</Text>
                        <Text style={styles.promptText}>{profile.firstDatePrompt}</Text>
                    </View>
                ) : null}

                {profile.secondaryPhotoUri?.trim() ? (
                    <Image
                        source={{uri: profile.secondaryPhotoUri}}
                        style={styles.secondaryImage}
                        accessibilityLabel={`${profile.name}'s additional photo`}
                    />
                ) : null}

                {profile.profileNote?.trim() ? (
                    <View style={styles.promptCard}>
                        <Text style={styles.eyebrow}>THE WAY TO MY HEART</Text>
                        <Text style={styles.promptText}>{profile.profileNote}</Text>
                    </View>
                ) : null}

                <View style={styles.safetySection}>
                    {profile.verified ? (
                        <Text style={styles.helperText}>✓ Photo verified. Distance is approximate.</Text>
                    ) : null}
                    <View style={styles.safetyActions}>
                        <Pressable
                            onPress={() => setSafetyNotice("Blocking isn't connected in this demo yet.")}
                            accessibilityRole="button"
                            style={styles.safetyButton}
                        >
                            <Text style={styles.safetyText}>Block {profile.name}</Text>
                        </Pressable>
                        <Pressable
                            onPress={() => setSafetyNotice("Reporting isn't connected in this demo yet.")}
                            accessibilityRole="button"
                            style={styles.safetyButton}
                        >
                            <Text style={styles.safetyText}>Report profile</Text>
                        </Pressable>
                    </View>
                    {safetyNotice ? <Text accessibilityRole="alert" style={styles.helperText}>{safetyNotice}</Text> : null}
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: palette.shell,
    },
    centered: {
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
    },
    header: {
        height: 52,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 24,
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: "center",
    },
    backLink: {
        color: palette.wine,
        fontSize: 28,
    },
    headerTitle: {
        color: palette.muted,
        fontSize: 13,
    },
    headerSpacer: {
        width: 40,
    },
    content: {
        width: "100%",
        maxWidth: 520,
        alignSelf: "center",
        paddingHorizontal: 24,
        gap: 18,
    },
    hero: {
        width: "100%",
        aspectRatio: 0.82,
        borderRadius: 24,
        overflow: "hidden",
        backgroundColor: palette.cream,
    },
    image: {
        width: "100%",
        height: "100%",
        resizeMode: "cover",
    },
    imageFallback: {
        alignItems: "center",
        justifyContent: "center",
    },
    fallbackInitial: {
        fontSize: 72,
        color: palette.wine,
        fontFamily: "Lora_400Regular",
    },
    nameRow: {
        flexDirection: "row",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 8,
        marginTop: 2,
    },
    title: {
        fontFamily: "Lora_400Regular",
        fontSize: 32,
        lineHeight: 40,
        color: palette.wine,
        flexShrink: 1,
    },
    subtitle: {
        color: palette.muted,
        fontSize: 14,
        lineHeight: 21,
    },
    intention: {
        backgroundColor: palette.cream,
        borderRadius: 18,
        padding: 16,
        gap: 5,
    },
    eyebrow: {
        fontSize: 11,
        color: palette.muted,
        fontWeight: "600",
    },
    intentionText: {
        fontSize: 15,
        color: palette.ink,
        fontWeight: "600",
    },
    section: {
        gap: 10,
        marginTop: 4,
    },
    sectionTitle: {
        fontSize: 16,
        color: palette.ink,
        fontWeight: "600",
    },
    body: {
        fontSize: 15,
        lineHeight: 23,
        color: palette.ink,
    },
    chips: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
    },
    chip: {
        borderRadius: 999,
        backgroundColor: palette.cream,
        paddingHorizontal: 14,
        paddingVertical: 9,
        maxWidth: "100%",
    },
    chipText: {
        fontSize: 13,
        color: palette.wine,
        flexShrink: 1,
    },
    overlapChip: {
        borderRadius: 999,
        backgroundColor: palette.wine,
        paddingHorizontal: 14,
        paddingVertical: 9,
        maxWidth: "100%",
    },
    overlapChipText: {
        fontSize: 13,
        color: palette.shell,
        flexShrink: 1,
    },
    helperText: {
        color: palette.muted,
        fontSize: 12,
        lineHeight: 18,
    },
    promptCard: {
        backgroundColor: "#FCE9DF",
        borderRadius: 24,
        padding: 22,
        gap: 10,
    },
    promptText: {
        color: palette.wine,
        fontFamily: "Lora_400Regular",
        fontSize: 26,
        lineHeight: 33,
        flexShrink: 1,
    },
    secondaryImage: {
        width: "100%",
        aspectRatio: 1.15,
        borderRadius: 24,
        resizeMode: "cover",
    },
    safetySection: {
        gap: 14,
        paddingTop: 4,
        paddingBottom: 12,
    },
    safetyActions: {
        flexDirection: "row",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 12,
    },
    safetyButton: {
        minHeight: 44,
        justifyContent: "center",
        paddingVertical: 8,
    },
    safetyText: {
        color: palette.wine,
        fontSize: 13,
    },
});
