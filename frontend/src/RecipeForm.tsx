import { useState } from "react";
import { useImageUpload } from "./useImageUpload";

export interface IngredientDraft {
  name: string;
  quantity: string;
  unit: string;
}

export interface StepDraft {
  instruction: string;
  imageKey: string | null;
}

export interface RecipeDraft {
  title: string;
  servings: string;
  notes: string;
  coverImageKey: string | null;
  ingredients: IngredientDraft[];
  steps: StepDraft[];
}

export function emptyRecipeDraft(): RecipeDraft {
  return {
    title: "",
    servings: "",
    notes: "",
    coverImageKey: null,
    ingredients: [{ name: "", quantity: "", unit: "" }],
    steps: [{ instruction: "", imageKey: null }],
  };
}

export function RecipeForm({
  initial,
  onSubmit,
  submitLabel,
}: {
  initial: RecipeDraft;
  onSubmit: (draft: RecipeDraft) => void;
  submitLabel: string;
}) {
  const [draft, setDraft] = useState<RecipeDraft>(initial);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const uploadImage = useImageUpload();

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(draft);
      }}
    >
      <label>
        Title
        <input
          value={draft.title}
          onChange={(e) => setDraft({ ...draft, title: e.target.value })}
          required
        />
      </label>

      <label>
        Servings
        <input value={draft.servings} onChange={(e) => setDraft({ ...draft, servings: e.target.value })} />
      </label>

      <label>
        Notes
        <textarea value={draft.notes} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} />
      </label>

      {uploadError && <p role="alert">Error: {uploadError}</p>}

      <label>
        Cover image
        <input
          type="file"
          accept="image/*"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            try {
              const { key } = await uploadImage(file);
              setDraft({ ...draft, coverImageKey: key });
            } catch {
              setUploadError("Failed to upload cover image");
            }
          }}
        />
        {draft.coverImageKey && <span> Uploaded</span>}
      </label>

      <fieldset>
        <legend>Ingredients</legend>
        {draft.ingredients.map((ingredient, index) => (
          <div key={index}>
            <input
              placeholder="name"
              value={ingredient.name}
              onChange={(e) => {
                const ingredients = [...draft.ingredients];
                ingredients[index] = { ...ingredient, name: e.target.value };
                setDraft({ ...draft, ingredients });
              }}
            />
            <input
              placeholder="quantity"
              value={ingredient.quantity}
              onChange={(e) => {
                const ingredients = [...draft.ingredients];
                ingredients[index] = { ...ingredient, quantity: e.target.value };
                setDraft({ ...draft, ingredients });
              }}
            />
            <input
              placeholder="unit"
              value={ingredient.unit}
              onChange={(e) => {
                const ingredients = [...draft.ingredients];
                ingredients[index] = { ...ingredient, unit: e.target.value };
                setDraft({ ...draft, ingredients });
              }}
            />
            <button
              type="button"
              onClick={() =>
                setDraft({ ...draft, ingredients: draft.ingredients.filter((_, i) => i !== index) })
              }
            >
              Remove
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() =>
            setDraft({ ...draft, ingredients: [...draft.ingredients, { name: "", quantity: "", unit: "" }] })
          }
        >
          Add ingredient
        </button>
      </fieldset>

      <fieldset>
        <legend>Steps</legend>
        {draft.steps.map((step, index) => (
          <div key={index}>
            <textarea
              value={step.instruction}
              onChange={(e) => {
                const steps = [...draft.steps];
                steps[index] = { ...step, instruction: e.target.value };
                setDraft({ ...draft, steps });
              }}
            />
            <input
              type="file"
              accept="image/*"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                try {
                  const { key } = await uploadImage(file);
                  const steps = [...draft.steps];
                  steps[index] = { ...step, imageKey: key };
                  setDraft({ ...draft, steps });
                } catch {
                  setUploadError("Failed to upload step photo");
                }
              }}
            />
            {step.imageKey && <span> Uploaded</span>}
            <button
              type="button"
              onClick={() => setDraft({ ...draft, steps: draft.steps.filter((_, i) => i !== index) })}
            >
              Remove
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => setDraft({ ...draft, steps: [...draft.steps, { instruction: "", imageKey: null }] })}
        >
          Add step
        </button>
      </fieldset>

      <button type="submit">{submitLabel}</button>
    </form>
  );
}
