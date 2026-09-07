import { useState } from "react";
import { trpc } from "./trpc";
import { useImageUpload } from "./useImageUpload";

const MINIO_PUBLIC_URL = import.meta.env.VITE_MINIO_PUBLIC_URL ?? "http://localhost:9000";
const MINIO_BUCKET = import.meta.env.VITE_MINIO_BUCKET ?? "recipes";

function albumImageSrc(coverImageKey: string | null) {
  if (!coverImageKey) return null;
  return `${MINIO_PUBLIC_URL}/${MINIO_BUCKET}/${coverImageKey}`;
}

export function AlbumManager() {
  const utils = trpc.useUtils();
  const albums = trpc.album.list.useQuery();
  const uploadImage = useImageUpload();
  const [newName, setNewName] = useState("");

  const createMutation = trpc.album.create.useMutation({
    onSuccess: () => {
      utils.album.list.invalidate();
      setNewName("");
    },
  });
  const updateMutation = trpc.album.update.useMutation({
    onSuccess: () => utils.album.list.invalidate(),
  });
  const deleteMutation = trpc.album.delete.useMutation({
    onSuccess: () => utils.album.list.invalidate(),
  });

  return (
    <div>
      <h2>Albums</h2>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (newName.trim() === "") return;
          createMutation.mutate({ name: newName });
        }}
      >
        <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="New album name" />
        <button type="submit">Create album</button>
      </form>

      <ul>
        {albums.data?.map((album) => {
          const src = albumImageSrc(album.coverImageKey);
          return (
            <li key={album.id}>
              {src ? <img src={src} alt="" width={80} height={80} /> : <div>No cover</div>}
              <input
                defaultValue={album.name}
                onBlur={(e) => {
                  if (e.target.value.trim() !== "" && e.target.value !== album.name) {
                    updateMutation.mutate({ id: album.id, name: e.target.value, coverImageKey: album.coverImageKey });
                  }
                }}
              />
              <input
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const { key } = await uploadImage(file);
                  updateMutation.mutate({ id: album.id, name: album.name, coverImageKey: key });
                }}
              />
              {album.coverImageKey && (
                <button
                  type="button"
                  onClick={() => updateMutation.mutate({ id: album.id, name: album.name, coverImageKey: null })}
                >
                  Remove cover
                </button>
              )}
              <button type="button" onClick={() => deleteMutation.mutate({ id: album.id })}>
                Delete
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
