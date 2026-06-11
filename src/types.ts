export type Page =
  | "welcome"
  | "login"
  | "signup"
  | "onboarding-style"
  | "onboarding-body"
  | "onboarding-fit"
  | "onboarding-direction"
  | "home"
  | "library"
  | "album-detail"
  | "account"
  | "app-preferences"
  | "settings"
  | "privacy";

export type UserAccount = {
  fullName: string;
  email: string;
  password: string;
};

export type Post = {
  id: string;
  creatorName: string;
  image: string;
  hashtags?: string[];
  caption: string;
  matchLabelPrimary?: string;
  matchLabelSecondary?: string;
  styleTags: string[];
  sizeRange: string[];
  heightRange: string;
  fitTags: string[];
  genderStyle: string[];
  occasionTags: string[];
  bodyFriendlyLabel: string;
};

export type OnboardingAnswers = {
  styleAttraction: string[];
  sizeRange: string[];
  heightRange: string;
  fitPreferences: string[];
  stylingDirection: string[];
  completed: boolean;
};

export type AppPreferences = {
  prioritiseSimilarBodyReferences: boolean;
  showExperimentalStyles: boolean;
  showCreatorExplanations: boolean;
  showMatchPercentage: boolean;
};

export type Album = {
  id: string;
  name: string;
  postIds: string[];
  createdAt: string;
};

export type MatchResult = {
  percentage: number;
  reason: string;
  score: number;
};
