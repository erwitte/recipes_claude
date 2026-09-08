import { useState } from "react";
import { trpc } from "./trpc";
import { useImageUpload } from "./useImageUpload";
import { imageSrc } from "./imageUrl";
import { BookIcon } from "./icons";

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
      <div className="page-header">
        <div>
          <h1>Albums</h1>
          <p>Group your recipes by theme, occasion, or cuisine.</p>
        </div>
      </div>

      <form
        className="card card-padded"
        style={{ display: "flex", gap: 10, alignItems: "flex-end", marginBottom: 28 }}
        onSubmit={(e) => {
          e.preventDefault();
          if (newName.trim() === "") return;
          createMutation.mutate({ name: newName });
        }}
      >
        <div className="field" style={{ flex: 1, marginBottom: 0 }}>
          <label htmlFor="new-album-name">New album</label>
          <input
            id="new-album-name"
            className="input"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="e.g. Christmas, Weeknight dinners"
          />
        </div>
        <button type="submit" className="btn btn-primary">
          + Create album
        </button>
      </form>

      {!albums.isLoading && albums.data?.length === 0 && (
        <div className="empty-state">
          <BookIcon />
          <h3>No albums yet</h3>
          <p>Create your first album to start organizing recipes.</p>
        </div>
      )}

      <div className="grid">
        {albums.data?.map((album) => {
          const src = imageSrc(album.coverImageKey);
          return (
            <div key={album.id} className="card album-card">
              <div className="album-card-media">
                {src ? <img src={src} alt="" /> : <BookIcon width={36} height={36} />}
              </div>
              <input
                className="input"
                defaultValue={album.name}
                onBlur={(e) => {
                  if (e.target.value.trim() !== "" && e.target.value !== album.name) {
                    updateMutation.mutate({ id: album.id, name: e.target.value, coverImageKey: album.coverImageKey });
                  }
                }}
              />
              <div className="album-card-actions">
                <label className="btn btn-secondary btn-sm file-btn">
                  {album.coverImageKey ? "Change photo" : "Add photo"}
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
                </label>
                {album.coverImageKey && (
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => updateMutation.mutate({ id: album.id, name: album.name, coverImageKey: null })}
                  >
                    Remove photo
                  </button>
                )}
                <button
                  type="button"
                  className="btn btn-danger btn-sm"
                  onClick={() => deleteMutation.mutate({ id: album.id })}
                >
                  Delete
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
