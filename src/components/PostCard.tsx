import { Bookmark } from "lucide-react";
import type { MatchResult, Post } from "../types";

type PostCardProps = {
  post: Post;
  isSaved: boolean;
  onSave: (postId: string) => void;
  match?: MatchResult;
  showMatch?: boolean;
  children?: React.ReactNode;
};

export default function PostCard({ post, isSaved, onSave, match, showMatch = true, children }: PostCardProps) {
  const hashtags = post.hashtags?.length ? post.hashtags : [...(post.styleTags ?? []), ...(post.occasionTags ?? [])].slice(0, 3).map((tag) => `#${tag}`);
  const primaryMatchLabel = post.matchLabelPrimary ?? "Similar to you";
  const secondaryMatchLabel = post.matchLabelSecondary ?? post.bodyFriendlyLabel;

  return (
    <article className="group overflow-hidden rounded-[2rem] border border-neutral-200/80 bg-white shadow-[0_18px_45px_rgba(15,15,15,0.06)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_70px_rgba(15,15,15,0.12)]">
      <div className="relative m-3 aspect-[4/5] overflow-hidden rounded-[1.5rem] bg-gradient-to-br from-stone-100 via-neutral-100 to-stone-200">
        <img src={post.image} alt={post.caption} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" loading="lazy" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/5 to-transparent opacity-80" />
        <button
          onClick={() => onSave(post.id)}
          aria-label={isSaved ? "Remove saved look" : "Save look"}
          className="absolute right-3 top-3 rounded-full bg-white/90 p-2.5 text-black shadow-sm backdrop-blur transition hover:bg-white hover:scale-105"
        >
          <Bookmark className="h-4 w-4" fill={isSaved ? "currentColor" : "none"} strokeWidth={1.8} />
        </button>
        <div className="absolute bottom-4 left-4 right-4">
          <p className="text-[11px] font-medium uppercase tracking-[0.32em] text-white/75">MUSÉ look</p>
          <h3 className="mt-1 text-xl font-semibold tracking-tight text-white drop-shadow-sm">{post.creatorName}</h3>
        </div>
      </div>
      <div className="space-y-4 px-5 pb-5 pt-2">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-semibold text-neutral-900">{post.creatorName}</h3>
          {showMatch && match && (
            <span className="shrink-0 rounded-full bg-black px-3 py-1 text-xs font-semibold text-white">
              {match.percentage}% match
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {hashtags.map((tag) => (
            <span key={tag} className="rounded-full bg-neutral-100 px-3 py-1 text-[11px] font-medium tracking-wide text-neutral-700">
              {tag.startsWith("#") ? tag : `#${tag}`}
            </span>
          ))}
        </div>
        <div className="space-y-2">
          <p className="text-base font-semibold tracking-tight text-neutral-950">{post.caption}</p>
          <p className="line-clamp-2 text-sm leading-6 text-neutral-500">{match?.reason ?? post.bodyFriendlyLabel}</p>
        </div>
        <div className="flex flex-wrap gap-2 border-t border-neutral-100 pt-4">
          <span className="rounded-full bg-neutral-950 px-3.5 py-2 text-xs font-semibold text-white shadow-sm">{primaryMatchLabel}</span>
          <span className="rounded-full border border-neutral-200 bg-white px-3.5 py-2 text-xs font-medium text-neutral-700">{secondaryMatchLabel}</span>
        </div>
        {children}
      </div>
    </article>
  );
}