export function computeAge(birthdate: string | null | undefined, fallbackAge: number | null | undefined): number {
  if (birthdate) {
    const bd = new Date(birthdate);
    const today = new Date();
    let age = today.getFullYear() - bd.getFullYear();
    const monthDiff = today.getMonth() - bd.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < bd.getDate())) age--;
    return age;
  }
  return fallbackAge ?? 8;
}

export function ageBucket(age: number): string {
  if (age <= 7) return "5-7";
  if (age <= 10) return "8-10";
  if (age <= 13) return "11-13";
  return "14-18";
}

export type AgeCopy = {
  sectionTitle: string;
  levelSuffix: string;
  adventureComplete: string;
  adventureCompleteSub: string;
  workoutCompleteHeadline: string;
  moodPrompt: string;
};

export function getAgeCopy(bucket: string): AgeCopy {
  switch (bucket) {
    case "5-7":
      return {
        sectionTitle: "Today's Adventure",
        levelSuffix: " Explorer",
        adventureComplete: "Adventure Complete! 🎉",
        adventureCompleteSub: "You did every mission today. Amazing work!",
        workoutCompleteHeadline: "Woohoo! You did it!",
        moodPrompt: "How do you feel today?",
      };
    case "8-10":
      return {
        sectionTitle: "Today's Adventure",
        levelSuffix: " Explorer",
        adventureComplete: "Adventure Complete!",
        adventureCompleteSub: "You did every mission today. Great job!",
        workoutCompleteHeadline: "Nice job! You crushed it.",
        moodPrompt: "How do you feel today?",
      };
    case "11-13":
      return {
        sectionTitle: "Today's Missions",
        levelSuffix: "",
        adventureComplete: "All missions done.",
        adventureCompleteSub: "Everything's checked off for today.",
        workoutCompleteHeadline: "Solid work today.",
        moodPrompt: "How are you feeling today?",
      };
    default: // 14-18
      return {
        sectionTitle: "Today's Goals",
        levelSuffix: "",
        adventureComplete: "All done for today.",
        adventureCompleteSub: "Everything on your list is complete.",
        workoutCompleteHeadline: "Workout complete.",
        moodPrompt: "How are you feeling today?",
      };
  }
}
