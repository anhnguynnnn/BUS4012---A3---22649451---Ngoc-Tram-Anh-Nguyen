import Button from "../components/Button";
import Layout from "../components/Layout";
import PostCard from "../components/PostCard";
import { mockPosts } from "../data/mockPosts";
import type { AppPreferences, OnboardingAnswers, Page } from "../types";
import { defaultAppPreferences, defaultOnboarding, getMatchedPosts } from "../utils/matchingLogic";
import { useMemo, useState } from "react";

type WelcomePageProps = {
  onGetStarted: () => void;
  onExplore: () => void;
  onNavigate: (page: Page) => void;
  isLoggedIn?: boolean;
  onLoginClick?: () => void;
  savedPostIds?: string[];
  onSave?: (postId: string) => void;
  onboarding?: OnboardingAnswers;
  appPreferences?: AppPreferences;
};

const features = [
  ["Body-aware discovery", "Find looks based on style, fit, and real-life references."],
  ["Save your inspiration", "Keep your favourite looks inside your personal style library."],
  ["Explore beyond trends", "Discover outfits that match your routine, not just the algorithm."],
];

export default function WelcomePage({ onGetStarted, onExplore, onNavigate, isLoggedIn = false, onLoginClick, savedPostIds = [], onSave = () => undefined, onboarding = defaultOnboarding, appPreferences = defaultAppPreferences }: WelcomePageProps) {
  const trendingPosts = useMemo(() => mockPosts.slice(0, 9), []);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const filters = ["All", "Minimal", "Office", "Casual", "Streetwear", "Feminine", "Formal"];
  const savedPosts = useMemo(() => mockPosts.filter((post) => savedPostIds.includes(post.id)), [savedPostIds]);
  const postsWithMatch = useMemo(() => {
    const posts = isLoggedIn ? mockPosts : trendingPosts;
    const query = search.trim().toLowerCase();

    return getMatchedPosts(posts, onboarding, savedPosts, appPreferences).filter(({ post }) => {
      const text = [post.creatorName, post.caption, ...post.styleTags, ...post.fitTags, ...post.occasionTags].join(" ").toLowerCase();
      const matchesSearch = !query || text.includes(query);
      const matchesFilter = filter === "All" || text.includes(filter.toLowerCase());
      return matchesSearch && matchesFilter;
    });
  }, [appPreferences, filter, isLoggedIn, onboarding, savedPosts, search, trendingPosts]);

  const scrollToFeed = () => {
    document.getElementById("outfit-feed")?.scrollIntoView({ behavior: "smooth" });
    onExplore();
  };

  return (
    <Layout currentPage="home" onNavigate={onNavigate} onGetStarted={onGetStarted} isLoggedIn={isLoggedIn} onLoginClick={onLoginClick}>
      {!isLoggedIn && (
        <>
          <section className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-14 px-6 py-20 lg:grid-cols-2 lg:py-28">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-neutral-500">Fashion discovery</p>
              <h1 className="mt-6 max-w-3xl text-5xl font-semibold tracking-tight text-neutral-950 md:text-7xl">Find what fits you.</h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-neutral-600">
                MUSÉ helps you browse real-life outfit inspiration from people with different styles, sizes, heights, and everyday routines.
              </p>
              <div className="mt-10 flex flex-col gap-3 sm:flex-row">
                <Button onClick={onGetStarted} className="sm:w-auto">Get Started</Button>
                <Button onClick={scrollToFeed} variant="secondary" className="sm:w-auto">Explore Looks</Button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="pt-12">
                <div className="h-80 rounded-3xl bg-[url('https://images.unsplash.com/photo-1529139574466?auto=format&fit=crop&w=900&q=80')] bg-cover bg-center" />
              </div>
              <div>
                <div className="h-[28rem] rounded-3xl bg-[url('https://images.unsplash.com/photo-1483985988355?auto=format&fit=crop&w=900&q=80')] bg-cover bg-center" />
              </div>
            </div>
          </section>
          <section className="bg-neutral-50 py-16">
            <div className="mx-auto grid max-w-7xl grid-cols-1 gap-5 px-6 md:grid-cols-3">
              {features.map(([title, text]) => (
                <article key={title} className="rounded-3xl border border-neutral-200 bg-white p-8 shadow-sm">
                  <h2 className="text-xl font-semibold">{title}</h2>
                  <p className="mt-3 leading-7 text-neutral-600">{text}</p>
                </article>
              ))}
            </div>
          </section>
        </>
      )}
      <section id="outfit-feed" className="mx-auto max-w-7xl scroll-mt-24 px-6 py-16">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-neutral-500">Outfit feed</p>
            <h2 className="mt-3 text-4xl font-semibold tracking-tight">{isLoggedIn ? "Explore looks" : "Trending looks"}</h2>
            <p className="mt-3 max-w-2xl leading-7 text-neutral-600">{isLoggedIn ? "Browse real-life outfit references shaped around your style preferences." : "Browse real-life outfit inspiration before creating an account. Save looks when you’re ready to personalise your style library."}</p>
          </div>
          {!isLoggedIn && <Button onClick={scrollToFeed} variant="secondary" className="md:w-auto">Explore more</Button>}
        </div>
        {isLoggedIn && (
          <div className="mt-8 space-y-5">
            <input value={search} onChange={(event) => setSearch(event.target.value)} className="w-full rounded-full border border-neutral-200 bg-white px-6 py-4 text-sm shadow-sm outline-none transition focus:border-black" placeholder="Find looks that fit you" />
            <div className="flex flex-wrap gap-3">
              {filters.map((item) => <button key={item} onClick={() => setFilter(item)} className={`rounded-full border px-4 py-2 text-sm font-medium transition ${filter === item ? "border-black bg-black text-white" : "border-neutral-200 bg-white text-neutral-600 hover:border-neutral-400"}`}>{item}</button>)}
            </div>
          </div>
        )}
        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {postsWithMatch.map(({ post, match }) => <PostCard key={post.id} post={post} match={match} isSaved={savedPostIds.includes(post.id)} onSave={onSave} showMatch={appPreferences.showMatchPercentage} />)}
        </div>
      </section>
    </Layout>
  );
}