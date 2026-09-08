import { useState } from "react";
import { useImageUpload } from "./useImageUpload";
import { imageSrc } from "./imageUrl";
import { ChefHatIcon } from "./icons";

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

  const coverSrc = imageSrc(draft.coverImageKey);

  return (
    <form
      className="form-card"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(draft);
      }}
    >
      {uploadError && <p className="alert" role="alert">{uploadError}</p>}

      <div className="field">
        <label htmlFor="recipe-title">Title</label>
        <input
          id="recipe-title"
          className="input"
          value={draft.title}
          onChange={(e) => setDraft({ ...draft, title: e.target.value })}
          placeholder="Grandma's tomato soup"
          required
        />
      </div>

      <div className="form-row">
        <div className="field">
          <label htmlFor="recipe-servings">Servings</label>
          <input
            id="recipe-servings"
            className="input"
            type="number"
            min="0"
            value={draft.servings}
            onChange={(e) => setDraft({ ...draft, servings: e.target.value })}
            placeholder="4"
          />
        </div>

        <div className="field">
          <label>Cover image</label>
          <div className="upload-drop">
            <div className="upload-thumb">
              {coverSrc ? <img src={coverSrc} alt="" /> : <ChefHatIcon width={22} height={22} />}
            </div>
            <label className="btn btn-secondary btn-sm file-btn">
              {draft.coverImageKey ? "Change photo" : "Upload photo"}
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
            </label>
          </div>
        </div>
      </div>

      <div className="field">
        <label htmlFor="recipe-notes">Notes</label>
        <textarea
          id="recipe-notes"
          className="input"
          value={draft.notes}
          onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
          placeholder="Tips, substitutions, or anything worth remembering"
        />
      </div>

      <h2 className="form-section-title">Ingredients</h2>
      {draft.ingredients.map((ingredient, index) => (
        <div className="repeat-row" key={index}>
          <input
            className="input"
            placeholder="Ingredient"
            value={ingredient.name}
            onChange={(e) => {
              const ingredients = [...draft.ingredients];
              ingredients[index] = { ...ingredient, name: e.target.value };
              setDraft({ ...draft, ingredients });
            }}
          />
          <input
            className="input"
            style={{ flex: "0 0 90px" }}
            placeholder="Qty"
            value={ingredient.quantity}
            onChange={(e) => {
              const ingredients = [...draft.ingredients];
              ingredients[index] = { ...ingredient, quantity: e.target.value };
              setDraft({ ...draft, ingredients });
            }}
          />
          <input
            className="input"
            style={{ flex: "0 0 90px" }}
            placeholder="Unit"
            value={ingredient.unit}
            onChange={(e) => {
              const ingredients = [...draft.ingredients];
              ingredients[index] = { ...ingredient, unit: e.target.value };
              setDraft({ ...draft, ingredients });
            }}
          />
          <button
            type="button"
            className="btn btn-ghost btn-icon"
            aria-label="Remove ingredient"
            onClick={() => setDraft({ ...draft, ingredients: draft.ingredients.filter((_, i) => i !== index) })}
          >
            ✕
          </button>
        </div>
      ))}
      <button
        type="button"
        className="btn btn-secondary btn-sm"
        onClick={() =>
          setDraft({ ...draft, ingredients: [...draft.ingredients, { name: "", quantity: "", unit: "" }] })
        }
      >
        + Add ingredient
      </button>

      <h2 className="form-section-title">Steps</h2>
      {draft.steps.map((step, index) => {
        const stepSrc = imageSrc(step.imageKey);
        return (
          <div className="repeat-row-stacked" key={index}>
            <div className="repeat-row-head">
              <textarea
                className="input"
                placeholder={`Step ${index + 1}`}
                value={step.instruction}
                onChange={(e) => {
                  const steps = [...draft.steps];
                  steps[index] = { ...step, instruction: e.target.value };
                  setDraft({ ...draft, steps });
                }}
              />
              <button
                type="button"
                className="btn btn-ghost btn-icon"
                aria-label="Remove step"
                onClick={() => setDraft({ ...draft, steps: draft.steps.filter((_, i) => i !== index) })}
              >
                ✕
              </button>
            </div>
            <div className="upload-drop">
              <div className="upload-thumb">
                {stepSrc ? <img src={stepSrc} alt="" /> : <ChefHatIcon width={18} height={18} />}
              </div>
              <label className="btn btn-secondary btn-sm file-btn">
                {step.imageKey ? "Change photo" : "Add photo"}
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
              </label>
            </div>
          </div>
        );
      })}
      <button
        type="button"
        className="btn btn-secondary btn-sm"
        onClick={() => setDraft({ ...draft, steps: [...draft.steps, { instruction: "", imageKey: null }] })}
      >
        + Add step
      </button>

      <div className="form-actions">
        <button type="submit" className="btn btn-primary">
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
