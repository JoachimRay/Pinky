import type { Profile } from "@/types/profile";

export type SuggestionKind = "opening" | "follow-up";
export type SuggestionList = [string, string, string];

type HistoryMessage = {
  sender: "you" | "match";
  text: string;
};

export function localDateKey(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function makeDemoSuggestions(
  profile: Profile,
  history: HistoryMessage[],
  refreshNumber = 0,
): { kind: SuggestionKind; suggestions: SuggestionList } {
  const messages = history.map((message) => message.text.trim()).filter(Boolean);
  const recentDetail = messages[messages.length - 1]?.slice(0, 70);

  const choices = recentDetail
    ? [
        `You mentioned “${recentDetail}”. What would you like to share about it now?`,
        `Could you tell me a little more about “${recentDetail}”?`,
        `What part of “${recentDetail}” has been on your mind?`,
        `Has anything else come to mind about “${recentDetail}”?`,
        `What feels important to you about “${recentDetail}”?`,
        `Is there more you wanted to say about “${recentDetail}”?`,
        `What would you like me to understand about “${recentDetail}”?`,
        `How would you describe “${recentDetail}” to someone new?`,
        `What was the most interesting part of “${recentDetail}” for you?`,
        `Would you like to tell me more about “${recentDetail}”?`,
        `What else should I know about “${recentDetail}”?`,
        `What came to mind when you mentioned “${recentDetail}”?`,
      ]
    : makeOpeningChoices(profile);

  return {
    kind: messages.length > 0 ? "follow-up" : "opening",
    suggestions: chooseThree(choices, refreshNumber),
  };
}

function makeOpeningChoices(profile: Profile): string[] {
  const interest = profile.interests.find((item) => item.trim())?.trim();
  const bioDetail = profile.bio.split(/[.!?]/)[0]?.trim();
  const name = profile.name.trim();

  return [
    interest ? `What got you interested in ${interest}?` : `What do you enjoy doing in your free time?`,
    bioDetail ? `Could you tell me more about “${bioDetail}”?` : `What’s something you’ve been enjoying lately?`,
    `Hi ${name}, what’s something you’re looking forward to?`,
    interest ? `How did you first get into ${interest}?` : `What’s a topic you could talk about for hours?`,
    bioDetail ? `What do you like most about “${bioDetail}”?` : `What has made you smile recently?`,
    `Hi ${name}, how has your week been?`,
    interest ? `What’s your favorite thing about ${interest}?` : `What do you like to do on a day off?`,
    bioDetail ? `How did “${bioDetail}” become part of your life?` : `What’s something you’d like to try?`,
    `Hi ${name}, what’s been the highlight of your week?`,
    interest ? `Do you have a favorite memory involving ${interest}?` : `What kind of conversations do you enjoy?`,
    bioDetail ? `What else would you like to share about “${bioDetail}”?` : `What are you curious about lately?`,
    `Hi ${name}, what’s something you’re excited about these days?`,
  ];
}

function chooseThree(choices: string[], refreshNumber: number): SuggestionList {
  const groupCount = Math.floor(choices.length / 3);
  const group = ((refreshNumber % groupCount) + groupCount) % groupCount;
  const start = group * 3;

  return [choices[start], choices[start + 1], choices[start + 2]];
}
