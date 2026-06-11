import Button from "../components/Button";
import Layout from "../components/Layout";
import PostCard from "../components/PostCard";
import { mockPosts } from "../data/mockPosts";
import type { Album, Page } from "../types";

type Props = {
  currentPage: Page;
  album?: Album;
  onNavigate: (page: Page) => void;
  onSave: (postId: string) => void;
  onRemoveFromAlbum: (postId: string) => void;
  isLoggedIn?: boolean;
};

export default function AlbumDetailPage({ currentPage, album, onNavigate, onSave, onRemoveFromAlbum, isLoggedIn = true }: Props) {
  const posts = album ? mockPosts.filter((post) => album.postIds.includes(post.id)) : [];

  return (
    <Layout currentPage={currentPage} onNavigate={onNavigate} isLoggedIn={isLoggedIn}>
      <section className="mx-auto max-w-7xl px-6 py-16">
        <Button variant="secondary" className="w-auto" onClick={() => onNavigate("library")}>Back to Style Library</Button>
        <h1 className="mt-8 text-5xl font-semibold tracking-tight">{album?.name ?? "Album"}</h1>
        {posts.length === 0 ? (
          <p className="mt-6 rounded-3xl border border-dashed border-neutral-300 bg-neutral-50 p-12 text-neutral-500">No saved looks in this album yet.</p>
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => <PostCard key={post.id} post={post} isSaved onSave={onSave} showMatch={false}><Button variant="secondary" onClick={() => onRemoveFromAlbum(post.id)}>Remove from album</Button></PostCard>)}
          </div>
        )}
      </section>
    </Layout>
  );
}