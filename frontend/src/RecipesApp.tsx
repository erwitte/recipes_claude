import { useState } from "react";
import { trpc } from "./trpc";
import { RecipeForm, RecipeDraft, emptyRecipeDraft } from "./RecipeForm";
import { AlbumManager } from "./AlbumManager";

type View =
  | { name: "list" }
  | { name: "detail"; id: string }
  | { name: "create" }
  | { name: "edit"; id: string }
  | { name: "albums" };

function toMutationInput(draft: RecipeDraft) {
  return {
    title: draft.title,
    servings: draft.servings.trim() === "" ? null : Number(draft.servings),
    notes: draft.notes.trim() === "" ? null : draft.notes,
    coverImageKey: draft.coverImageKey,
    ingredients: draft.ingredients
      .filter((i) => i.name.trim() !== "")
      .map((i) => ({
        name: i.name,
        quantity: i.quantity.trim() === "" ? null : i.quantity,
        unit: i.unit.trim() === "" ? null : i.unit,
      })),
    steps: draft.steps
      .filter((s) => s.instruction.trim() !== "")
      .map((s) => ({ instruction: s.instruction, imageKey: s.imageKey })),
  };
}

export function RecipesApp() {
  const [view, setView] = useState<View>({ name: "list" });
  const [albumFilter, setAlbumFilter] = useState<string>("");
  const utils = trpc.useUtils();
  const albums = trpc.album.list.useQuery();
  const allRecipes = trpc.recipe.list.useQuery(undefined, { enabled: albumFilter === "" });
  const filteredRecipes = trpc.recipe.listByAlbum.useQuery(
    { albumId: albumFilter },
    { enabled: albumFilter !== "" },
  );
  const recipes = albumFilter === "" ? allRecipes : filteredRecipes;

  const createMutation = trpc.recipe.create.useMutation({
    onSuccess: () => {
      utils.recipe.list.invalidate();
      setView({ name: "list" });
    },
  });

  const deleteMutation = trpc.recipe.delete.useMutation({
    onSuccess: () => {
      utils.recipe.list.invalidate();
      setView({ name: "list" });
    },
  });

  const mutationError = createMutation.error ?? deleteMutation.error;

  if (view.name === "albums") {
    return (
      <div>
        <button onClick={() => setView({ name: "list" })}>Back to recipes</button>
        <AlbumManager />
      </div>
    );
  }

  if (view.name === "list") {
    return (
      <div>
        <h1>Recipes</h1>
        <button onClick={() => setView({ name: "create" })}>New recipe</button>
        <button onClick={() => setView({ name: "albums" })}>Manage albums</button>
        <label>
          Album
          <select value={albumFilter} onChange={(e) => setAlbumFilter(e.target.value)}>
            <option value="">All recipes</option>
            {albums.data?.map((album) => (
              <option key={album.id} value={album.id}>
                {album.name}
              </option>
            ))}
          </select>
        </label>
        {mutationError && <p role="alert">Error: {mutationError.message}</p>}
        {recipes.isLoading && <p>Loading...</p>}
        <ul>
          {recipes.data?.map((recipe) => (
            <li key={recipe.id}>
              <button onClick={() => setView({ name: "detail", id: recipe.id })}>{recipe.title}</button>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  if (view.name === "create") {
    return (
      <div>
        <button onClick={() => setView({ name: "list" })}>Back</button>
        {createMutation.error && <p role="alert">Error: {createMutation.error.message}</p>}
        <RecipeForm
          initial={emptyRecipeDraft()}
          submitLabel="Create"
          onSubmit={(draft) => createMutation.mutate(toMutationInput(draft))}
        />
      </div>
    );
  }

  if (view.name === "detail") {
    return <RecipeDetail id={view.id} onBack={() => setView({ name: "list" })} onEdit={() => setView({ name: "edit", id: view.id })} onDelete={() => deleteMutation.mutate({ id: view.id })} />;
  }

  return <RecipeEdit id={view.id} onDone={() => setView({ name: "detail", id: view.id })} />;
}

function RecipeDetail({
  id,
  onBack,
  onEdit,
  onDelete,
}: {
  id: string;
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const recipe = trpc.recipe.get.useQuery({ id });

  if (recipe.isLoading) return <p>Loading...</p>;
  if (recipe.error || !recipe.data) return <p>Recipe not found.</p>;

  const r = recipe.data;
  return (
    <div>
      <button onClick={onBack}>Back</button>
      <h1>{r.title}</h1>
      {r.servings != null && <p>Servings: {r.servings}</p>}
      <h2>Ingredients</h2>
      <ul>
        {r.ingredients.map((i) => (
          <li key={i.id}>
            {i.name}
            {i.quantity ? ` — ${i.quantity}${i.unit ? ` ${i.unit}` : ""}` : ""}
          </li>
        ))}
      </ul>
      <h2>Steps</h2>
      <ol>
        {r.steps.map((s) => (
          <li key={s.id}>{s.instruction}</li>
        ))}
      </ol>
      {r.notes && (
        <>
          <h2>Notes</h2>
          <p>{r.notes}</p>
        </>
      )}
      <button onClick={onEdit}>Edit</button>
      <button onClick={onDelete}>Delete</button>
    </div>
  );
}

function RecipeEdit({ id, onDone }: { id: string; onDone: () => void }) {
  const recipe = trpc.recipe.get.useQuery({ id });
  const utils = trpc.useUtils();
  const updateMutation = trpc.recipe.update.useMutation({
    onSuccess: () => {
      utils.recipe.get.invalidate({ id });
      utils.recipe.list.invalidate();
      onDone();
    },
  });

  if (recipe.isLoading) return <p>Loading...</p>;
  if (!recipe.data) return <p>Recipe not found.</p>;

  const initial: RecipeDraft = {
    title: recipe.data.title,
    servings: recipe.data.servings?.toString() ?? "",
    notes: recipe.data.notes ?? "",
    coverImageKey: recipe.data.coverImageKey,
    ingredients: recipe.data.ingredients.map((i) => ({
      name: i.name,
      quantity: i.quantity ?? "",
      unit: i.unit ?? "",
    })),
    steps: recipe.data.steps.map((s) => ({ instruction: s.instruction, imageKey: s.imageKey })),
  };

  return (
    <div>
      {updateMutation.error && <p role="alert">Error: {updateMutation.error.message}</p>}
      <RecipeForm
        initial={initial}
        submitLabel="Save"
        onSubmit={(draft) => updateMutation.mutate({ id, ...toMutationInput(draft) })}
      />
    </div>
  );
}
