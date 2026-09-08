import { useState } from "react";
import { trpc } from "./trpc";
import { RecipeForm, RecipeDraft, emptyRecipeDraft } from "./RecipeForm";
import { AlbumManager } from "./AlbumManager";
import { imageSrc } from "./imageUrl";
import { BookIcon, BowlIcon, ChefHatIcon } from "./icons";

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
        <button className="btn btn-ghost" onClick={() => setView({ name: "list" })}>
          ← Back to recipes
        </button>
        <AlbumManager />
      </div>
    );
  }

  if (view.name === "list") {
    return (
      <div>
        <div className="page-header">
          <div>
            <h1>Your recipes</h1>
            <p>Everything you've saved, ready to cook again.</p>
          </div>
          <div className="page-header-actions">
            <select
              className="select-pill"
              value={albumFilter}
              onChange={(e) => setAlbumFilter(e.target.value)}
            >
              <option value="">All recipes</option>
              {albums.data?.map((album) => (
                <option key={album.id} value={album.id}>
                  {album.name}
                </option>
              ))}
            </select>
            <button className="btn btn-secondary" onClick={() => setView({ name: "albums" })}>
              <BookIcon width={16} height={16} /> Albums
            </button>
            <button className="btn btn-primary" onClick={() => setView({ name: "create" })}>
              + New recipe
            </button>
          </div>
        </div>

        {mutationError && <p className="alert" role="alert">{mutationError.message}</p>}
        {recipes.isLoading && <p className="loading-state">Loading your recipes…</p>}

        {!recipes.isLoading && recipes.data?.length === 0 && (
          <div className="empty-state">
            <ChefHatIcon />
            <h3>No recipes yet</h3>
            <p>Start building your recipe box by adding your first one.</p>
            <button className="btn btn-primary" onClick={() => setView({ name: "create" })}>
              + New recipe
            </button>
          </div>
        )}

        <div className="grid">
          {recipes.data?.map((recipe) => {
            const src = imageSrc(recipe.coverImageKey);
            return (
              <button
                key={recipe.id}
                className="recipe-card"
                onClick={() => setView({ name: "detail", id: recipe.id })}
              >
                <div className="recipe-card-media">
                  {src ? <img src={src} alt={recipe.title} /> : <BowlIcon className="food-placeholder-icon" />}
                </div>
                <div className="recipe-card-body">
                  <div className="recipe-card-title">{recipe.title}</div>
                  {recipe.servings != null && (
                    <div className="recipe-card-meta">Serves {recipe.servings}</div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  if (view.name === "create") {
    return (
      <div>
        <button className="btn btn-ghost" onClick={() => setView({ name: "list" })}>
          ← Back
        </button>
        <h1>New recipe</h1>
        {createMutation.error && <p className="alert" role="alert">{createMutation.error.message}</p>}
        <RecipeForm
          initial={emptyRecipeDraft()}
          submitLabel="Save recipe"
          onSubmit={(draft) => createMutation.mutate(toMutationInput(draft))}
        />
      </div>
    );
  }

  if (view.name === "detail") {
    return (
      <RecipeDetail
        id={view.id}
        onBack={() => setView({ name: "list" })}
        onEdit={() => setView({ name: "edit", id: view.id })}
        onDelete={() => deleteMutation.mutate({ id: view.id })}
      />
    );
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

  if (recipe.isLoading) return <p className="loading-state">Loading recipe…</p>;
  if (recipe.error || !recipe.data) return <p className="loading-state">Recipe not found.</p>;

  const r = recipe.data;
  const src = imageSrc(r.coverImageKey);

  return (
    <div>
      <button className="btn btn-ghost" onClick={onBack}>
        ← Back
      </button>

      <div className="recipe-hero">
        {src ? <img src={src} alt={r.title} /> : <ChefHatIcon className="food-placeholder-icon" />}
      </div>

      <div className="page-header">
        <div>
          <h1>{r.title}</h1>
          {r.servings != null && (
            <div className="recipe-meta-row">
              <span className="pill">Serves {r.servings}</span>
            </div>
          )}
        </div>
        <div className="page-header-actions">
          <button className="btn btn-secondary" onClick={onEdit}>
            Edit
          </button>
          <button className="btn btn-danger" onClick={onDelete}>
            Delete
          </button>
        </div>
      </div>

      <div className="recipe-section">
        <h2>Ingredients</h2>
        <ul className="ingredient-list">
          {r.ingredients.map((i) => (
            <li key={i.id}>
              <span>{i.name}</span>
              {i.quantity && (
                <span className="qty">
                  {i.quantity}
                  {i.unit ? ` ${i.unit}` : ""}
                </span>
              )}
            </li>
          ))}
        </ul>
      </div>

      <div className="recipe-section">
        <h2>Steps</h2>
        <ol className="step-list">
          {r.steps.map((s, idx) => {
            const stepImg = imageSrc(s.imageKey);
            return (
              <li key={s.id}>
                <span className="step-number">{idx + 1}</span>
                <div className="step-body">
                  <p>{s.instruction}</p>
                  {stepImg && (
                    <div className="step-image">
                      <img src={stepImg} alt="" />
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </div>

      {r.notes && (
        <div className="recipe-section">
          <h2>Notes</h2>
          <p>{r.notes}</p>
        </div>
      )}
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

  if (recipe.isLoading) return <p className="loading-state">Loading…</p>;
  if (!recipe.data) return <p className="loading-state">Recipe not found.</p>;

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
      <h1>Edit recipe</h1>
      {updateMutation.error && <p className="alert" role="alert">{updateMutation.error.message}</p>}
      <RecipeForm
        initial={initial}
        submitLabel="Save changes"
        onSubmit={(draft) => updateMutation.mutate({ id, ...toMutationInput(draft) })}
      />
    </div>
  );
}
