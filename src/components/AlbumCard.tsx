import type { Album } from "../types";

type AlbumCardProps = {
  album: Album;
  onOpen: () => void;
  onDelete?: () => void;
};

export default function AlbumCard({ album, onOpen, onDelete }: AlbumCardProps) {
  return (
    <article className="rounded-3xl border border-neutral-200 bg-white p-6 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
      <button type="button" onClick={onOpen} className="block w-full text-left">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-neutral-400">Album</p>
        <h3 className="mt-3 text-xl font-semibold">{album.name}</h3>
        <p className="mt-2 text-sm text-neutral-500">{album.postIds.length} saved look{album.postIds.length === 1 ? "" : "s"}</p>
      </button>
      {onDelete && (
        <button type="button" onClick={onDelete} className="mt-5 text-sm font-medium text-neutral-400 underline-offset-4 transition hover:text-black hover:underline">
          Delete album
        </button>
      )}
    </article>
  );
}