import { useState } from "react";
import AlbumCard from "../components/AlbumCard";
import Button from "../components/Button";
import Input from "../components/Input";
import Layout from "../components/Layout";
import PostCard from "../components/PostCard";
import { mockPosts } from "../data/mockPosts";
import type { Album, Page } from "../types";

const filters = ["All", "Office", "Formal", "Casual", "Streetwear", "Feminine", "Minimal"];

type StyleLibraryPageProps = {
  currentPage: Page;
  savedPostIds: string[];
  albums: Album[];
  onNavigate: (page: Page) => void;
  onSave: (postId: string) => void;
  onCreateAlbum: (name: string) => void;
  onOpenAlbum: (albumId: string) => void;
  onAddPostToAlbum: (albumId: string, postId: string) => void;
  onRemovePostFromAlbum: (postId: string) => void;
  onDeleteAlbum: (albumId: string) => void;
  isLoggedIn?: boolean;
  onLoginClick?: () => void;
};

export default function StyleLibraryPage({ currentPage, savedPostIds, albums, onNavigate, onSave, onCreateAlbum, onOpenAlbum, onAddPostToAlbum, onRemovePostFromAlbum, onDeleteAlbum, isLoggedIn = false, onLoginClick }: StyleLibraryPageProps) {
  const [filter, setFilter] = useState("All");
  const [albumName, setAlbumName] = useState("");
  const [changingPostId, setChangingPostId] = useState("");
  const savedPosts = mockPosts.filter((post) => savedPostIds.includes(post.id));
  const visiblePosts = savedPosts.filter((post) => filter === "All" || [...post.styleTags, ...post.occasionTags].join(" ").toLowerCase().includes(filter.toLowerCase()));
  const findAlbumForPost = (postId: string) => albums.find((album) => album.postIds.includes(postId));

  return (
    <Layout currentPage={currentPage} onNavigate={onNavigate} isLoggedIn={isLoggedIn} onLoginClick={onLoginClick}>
      <section className="bg-neutral-50 px-6 py-16">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-neutral-500">Saved looks</p>
          <h1 className="mt-4 text-5xl font-semibold tracking-tight">Style Library</h1>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-neutral-600">A saved space for looks you want to revisit.</p>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-6 py-10">
        <div className="flex flex-wrap gap-3">
          {filters.map((item) => (
            <button key={item} onClick={() => setFilter(item)} className={`rounded-full border px-4 py-2 text-sm transition ${filter === item ? "border-black bg-black text-white" : "border-neutral-200 bg-white text-neutral-600 hover:border-neutral-400"}`}>
              {item}
            </button>
          ))}
        </div>
        <div className="mt-10 rounded-3xl border border-neutral-200 bg-neutral-50 p-6">
          <h2 className="text-2xl font-semibold">Albums</h2>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <Input value={albumName} onChange={(event) => setAlbumName(event.target.value)} placeholder="New album name" />
            <Button className="sm:w-auto" onClick={() => { if (albumName.trim()) { onCreateAlbum(albumName.trim()); setAlbumName(""); } }}>Create album</Button>
          </div>
          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
            {albums.map((album) => <AlbumCard key={album.id} album={album} onOpen={() => onOpenAlbum(album.id)} onDelete={() => onDeleteAlbum(album.id)} />)}
          </div>
        </div>
        {visiblePosts.length === 0 ? (
          <div className="mt-10 rounded-3xl border border-dashed border-neutral-300 bg-neutral-50 p-12 text-center text-neutral-500">
            Your saved looks will appear here.
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {visiblePosts.map((post) => {
            const assignedAlbum = findAlbumForPost(post.id);
            const showDropdown = albums.length > 0 && (!assignedAlbum || changingPostId === post.id);

            return (
              <PostCard key={post.id} post={post} isSaved onSave={onSave} showMatch={false}>
                {assignedAlbum && changingPostId !== post.id && (
                  <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                    <p className="text-sm text-neutral-600">Added to: <span className="font-semibold text-black">{assignedAlbum.name}</span></p>
                    <div className="mt-3 flex flex-wrap gap-3">
                      <button type="button" onClick={() => setChangingPostId(post.id)} className="text-sm font-medium text-neutral-500 underline-offset-4 hover:text-black hover:underline">Change album</button>
                      <button type="button" onClick={() => onRemovePostFromAlbum(post.id)} className="text-sm font-medium text-neutral-500 underline-offset-4 hover:text-black hover:underline">Remove from album</button>
                    </div>
                  </div>
                )}
                {showDropdown && (
                  <select
                    value={assignedAlbum?.id ?? ""}
                    onChange={(event) => {
                      if (event.target.value) {
                        onAddPostToAlbum(event.target.value, post.id);
                        setChangingPostId("");
                      }
                    }}
                    className="w-full rounded-2xl border border-neutral-200 px-3 py-2 text-sm"
                  >
                    <option value="">Add to album</option>
                    {albums.map((album) => <option key={album.id} value={album.id}>{album.name}</option>)}
                  </select>
                )}
              </PostCard>
            );
          })}
          </div>
        )}
      </section>
    </Layout>
  );
}