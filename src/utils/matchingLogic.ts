import type { AppPreferences, MatchResult, OnboardingAnswers, Post } from "../types";

const normalise = (value: string) => value.toLowerCase().replace(/[–—]/g, "-").trim();

const styleMap: Record<string, string[]> = {
  "minimal / clean": ["minimal", "clean"],
  streetwear: ["streetwear"],
  "feminine / soft": ["feminine", "soft"],
  "classic / tailored": ["classic", "tailored"],
  "trend-driven": ["trend-driven"],
};

const fitMap: Record<string, string[]> = {
  "highlight my waist": ["highlight waist"],
  "balance proportions": ["balance proportions"],
  "prefer more coverage": ["more coverage"],
  "prefer relaxed / loose fits": ["relaxed fit", "loose fit"],
  "add structure to my outfits": ["structured"],
};

const directionMap: Record<string, string[]> = {
  womenswear: ["womenswear"],
  menswear: ["menswear"],
  "gender-neutral": ["gender-neutral"],
};

const asArray = (value: unknown): string[] => Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];

const expandSelections = (items: unknown, map: Record<string, string[]>) =>
  asArray(items).flatMap((item) => map[normalise(item)] ?? [normalise(item)]);

const hasOverlap = (first: string[] = [], second: string[] = []) => {
  const secondSet = new Set(second.map(normalise));
  return first.map(normalise).some((item) => secondSet.has(item));
};

const getDefaultMockPercentage = (postId: string) => {
  const numericSeed = postId.split("").reduce((total, character) => total + character.charCodeAt(0), 0);
  return 55 + (numericSeed % 36);
};

export const defaultOnboarding: OnboardingAnswers = {
  styleAttraction: [],
  sizeRange: [],
  heightRange: "",
  fitPreferences: [],
  stylingDirection: [],
  completed: false,
};

export const defaultAppPreferences: AppPreferences = {
  prioritiseSimilarBodyReferences: true,
  showExperimentalStyles: true,
  showCreatorExplanations: true,
  showMatchPercentage: true,
};

export function calculateMatch(
  post: Post,
  onboarding: OnboardingAnswers,
  savedPosts: Post[] = [],
  preferences: AppPreferences = defaultAppPreferences,
): MatchResult {
  let score = 15;
  const reasons: string[] = [];
  const safeOnboarding = { ...defaultOnboarding, ...onboarding };

  if (!safeOnboarding.completed) {
    const percentage = getDefaultMockPercentage(post.id);

    return {
      percentage,
      reason: post.bodyFriendlyLabel,
      score: percentage,
    };
  }

  const stylePreferences = expandSelections(safeOnboarding.styleAttraction, styleMap);
  const fitPreferences = expandSelections(safeOnboarding.fitPreferences, fitMap);
  const directionPreferences = expandSelections(safeOnboarding.stylingDirection, directionMap);
  const savedSignals = savedPosts.flatMap((savedPost) => [
    ...asArray(savedPost.styleTags),
    ...asArray(savedPost.fitTags),
    ...asArray(savedPost.genderStyle),
    ...asArray(savedPost.occasionTags),
  ]);

  if (hasOverlap(stylePreferences, asArray(post.styleTags))) {
    score += 20;
    reasons.push(`Similar to your ${asArray(post.styleTags).find((tag) => stylePreferences.includes(normalise(tag))) ?? "style"} preference`);
  }

  if (hasOverlap(asArray(safeOnboarding.sizeRange), asArray(post.sizeRange))) {
    score += preferences.prioritiseSimilarBodyReferences ? 25 : 20;
    reasons.push("Includes a similar fit reference range");
  }

  if (safeOnboarding.heightRange && normalise(safeOnboarding.heightRange) === normalise(post.heightRange)) {
    score += preferences.prioritiseSimilarBodyReferences ? 20 : 15;
    reasons.push(`${post.heightRange} fit reference`);
  }

  if (hasOverlap(fitPreferences, asArray(post.fitTags))) {
    score += 20;
    reasons.push(`Matches your ${asArray(post.fitTags).find((tag) => fitPreferences.includes(normalise(tag))) ?? "fit"} preference`);
  }

  if (hasOverlap(directionPreferences, asArray(post.genderStyle))) {
    score += 10;
    reasons.push("Aligned with your styling direction");
  }

  if (savedPosts.length > 0 && hasOverlap(savedSignals, [...asArray(post.styleTags), ...asArray(post.fitTags), ...asArray(post.genderStyle), ...asArray(post.occasionTags)])) {
    score += 15;
    reasons.push("Recommended because you saved similar looks");
  }

  if (preferences.showExperimentalStyles && !hasOverlap(stylePreferences, asArray(post.styleTags))) {
    score += 6;
    reasons.push("Shown to help you explore slightly different styles");
  }

  return {
    percentage: Math.max(35, Math.min(score, 100)),
    reason: reasons[0] ?? post.bodyFriendlyLabel,
    score,
  };
}

export function getMatchedPosts(
  posts: Post[],
  onboarding: OnboardingAnswers,
  savedPosts: Post[] = [],
  preferences: AppPreferences = defaultAppPreferences,
) {
  return posts
    .map((post) => ({ post, match: calculateMatch(post, onboarding, savedPosts, preferences) }))
    .sort((a, b) => b.match.percentage - a.match.percentage);
}

// ---- Phase 6: Backend recommendation integration ----

export type BackendRecommendation = {
  post: {
    id: string;
    creator_name?: string | null;
    image_url?: string | null;
    description?: string | null;
    tags?: string[] | null;
    style_category?: string | null;
    style_tags: string[];
    fit_tags: string[];
    gender_style: string[];
    occasion_tags: string[];
    size_range: string[];
    height_range?: string | null;
    body_friendly_label?: string | null;
    match_label_primary?: string | null;
    match_label_secondary?: string | null;
    view_count: number;
    save_count: number;
    share_count: number;
    created_at?: string | null;
  };
  match_percentage: number;
  match_reason?: string | null;
  match_reason_secondary?: string | null;
  onboarding_score: number;
  behaviour_score: number;
  final_score: number;
};

/**
 * Convert a backend recommendation into the frontend MatchResult format.
 * Used when the frontend receives scored posts from the /recommendations endpoint.
 */
export function recommendationToMatchResult(rec: BackendRecommendation): MatchResult {
  return {
    percentage: rec.match_percentage,
    reason: rec.match_reason ?? rec.post.body_friendly_label ?? "Recommended for you",
    score: rec.final_score,
  };
}

/**
 * Convert backend PostData into the frontend Post format.
 * Maps snake_case DB columns to camelCase frontend types.
 */
export function backendPostToFrontendPost(bp: BackendRecommendation["post"]): Post {
  return {
    id: bp.id,
    creatorName: bp.creator_name ?? "",
    image: bp.image_url ?? "",
    caption: bp.description ?? "",
    hashtags: bp.tags ?? undefined,
    styleTags: bp.style_tags,
    fitTags: bp.fit_tags,
    genderStyle: bp.gender_style,
    occasionTags: bp.occasion_tags,
    sizeRange: bp.size_range,
    heightRange: bp.height_range ?? "",
    bodyFriendlyLabel: bp.body_friendly_label ?? "",
    matchLabelPrimary: bp.match_label_primary ?? undefined,
    matchLabelSecondary: bp.match_label_secondary ?? undefined,
  };
}
