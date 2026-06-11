import { useMemo, useState } from "react";
import Layout from "../components/Layout";
import PostCard from "../components/PostCard";
import { mockPosts } from "../data/mockPosts";
import type { AppPreferences, OnboardingAnswers, Page } from "../types";
import { getMatchedPosts } from "../utils/matchingLogic";

const categories = ["All", "Minimal", "Office", "Casual", "Streetwear", "Feminine", "Formal"];

type HomePageProps = {
  currentPage: Page;
  onboarding: OnboardingAnswers;
  appPreferences: AppPreferences;
  savedPostIds: string[];
  onNavigate: (page: Page) => void;
  onSave: (postId: string) => void;
  isLoggedIn?: boolean;
  onLoginClick?: () => void;
};

export default function HomePage({ currentPage, onboarding, appPreferences, savedPostIds, onNavigate, onSave, isLoggedIn = false, onLoginClick }: HomePageProps) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const savedPosts = useMemo(() => mockPosts.filter((post) => savedPostIds.includes(post.id)), [savedPostIds]);

  const matchedPosts = useMemo(() => {
    const query = search.trim().toLowerCase();
    const selectedCategory = category.toLowerCase();

    return getMatchedPosts(mockPosts, onboarding, savedPosts, appPreferences).filter(({ post }) => {
      const tags = [...(post.styleTags ?? []), ...(post.fitTags ?? []), ...(post.genderStyle ?? []), ...(post.occasionTags ?? [])].join(" ").toLowerCase();
      const matchesSearch = !query || post.creatorName.toLowerCase().includes(query) || post.caption.toLowerCase().includes(query) || tags.includes(query);
      const matchesCategory = category === "All" || tags.includes(selectedCategory);
      return matchesSearch && matchesCategory;
    });
  }, [appPreferences, category, onboarding, savedPosts, search]);

  return (
    <Layout currentPage={currentPage} onNavigate={onNavigate} isLoggedIn={isLoggedIn} onLoginClick={onLoginClick}>
      <section className="bg-neutral-50 px-6 py-16">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-neutral-500">Discover</p>
          <h1 className="mt-4 text-5xl font-semibold tracking-tight">Discover looks</h1>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-neutral-600">Browse real-life outfit references shaped around your style preferences.</p>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-6 py-10">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="w-full rounded-full border border-neutral-200 bg-white px-6 py-4 text-sm shadow-sm outline-none transition focus:border-black"
          placeholder="Find looks that fit you"
        />
        <div className="mt-6 flex flex-wrap gap-3">
          {categories.map((item) => (
            <button
              key={item}
              onClick={() => setCategory(item)}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                category === item ? "border-black bg-black text-white" : "border-neutral-200 bg-white text-neutral-600 hover:border-neutral-400"
              }`}
            >
              {item}
            </button>
          ))}
        </div>
        <div className="mt-10 flex items-end justify-between gap-4">
          <h2 className="text-2xl font-semibold tracking-tight">Recommended looks</h2>
          <p className="text-sm text-neutral-500">{matchedPosts.length} looks</p>
        </div>
        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {matchedPosts.map(({ post, match }) => (
            <PostCard key={post.id} post={post} match={match} showMatch={appPreferences.showMatchPercentage} isSaved={savedPostIds.includes(post.id)} onSave={onSave} />
          ))}
        </div>
      </section>
    </Layout>
  );
}