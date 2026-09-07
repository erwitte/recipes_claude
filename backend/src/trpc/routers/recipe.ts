import { z } from "zod";
import { and, asc, eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "../init";
import { albums, ingredients, recipeAlbums, recipes, steps } from "../../db/schema";
import { assertOwnedImageKey } from "../../imageKey";

const ingredientInput = z.object({
  name: z.string().min(1),
  quantity: z.string().nullable().optional(),
  unit: z.string().nullable().optional(),
});

const stepInput = z.object({
  instruction: z.string().min(1),
  imageKey: z.string().nullable().optional(),
});

const recipeInput = z.object({
  title: z.string().min(1),
  servings: z.number().int().positive().nullable().optional(),
  notes: z.string().nullable().optional(),
  coverImageKey: z.string().nullable().optional(),
  ingredients: z.array(ingredientInput).min(1),
  steps: z.array(stepInput).min(1),
});

async function loadRecipeOrThrow(
  db: typeof import("../../db/client").db,
  workspaceId: string,
  recipeId: string,
) {
  const [recipe] = await db
    .select()
    .from(recipes)
    .where(and(eq(recipes.id, recipeId), eq(recipes.workspaceId, workspaceId)))
    .limit(1);

  if (!recipe) {
    throw new TRPCError({ code: "NOT_FOUND" });
  }
  return recipe;
}

async function fullRecipe(
  db: typeof import("../../db/client").db,
  workspaceId: string,
  recipeId: string,
) {
  const recipe = await loadRecipeOrThrow(db, workspaceId, recipeId);

  const [recipeIngredients, recipeSteps] = await Promise.all([
    db.select().from(ingredients).where(eq(ingredients.recipeId, recipeId)).orderBy(asc(ingredients.position)),
    db.select().from(steps).where(eq(steps.recipeId, recipeId)).orderBy(asc(steps.position)),
  ]);

  return { ...recipe, ingredients: recipeIngredients, steps: recipeSteps };
}

export const recipeRouter = router({
  create: protectedProcedure.input(recipeInput).mutation(async ({ ctx, input }) => {
    assertOwnedImageKey(ctx.workspace.id, input.coverImageKey);
    for (const step of input.steps) assertOwnedImageKey(ctx.workspace.id, step.imageKey);

    const recipeId = await ctx.db.transaction(async (tx) => {
      const [recipe] = await tx
        .insert(recipes)
        .values({
          workspaceId: ctx.workspace.id,
          title: input.title,
          servings: input.servings ?? null,
          notes: input.notes ?? null,
          coverImageKey: input.coverImageKey ?? null,
        })
        .returning();

      if (!recipe) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }

      if (input.ingredients.length > 0) {
        await tx.insert(ingredients).values(
          input.ingredients.map((ingredient, position) => ({
            recipeId: recipe.id,
            name: ingredient.name,
            quantity: ingredient.quantity ?? null,
            unit: ingredient.unit ?? null,
            position,
          })),
        );
      }

      if (input.steps.length > 0) {
        await tx.insert(steps).values(
          input.steps.map((step, position) => ({
            recipeId: recipe.id,
            position,
            instruction: step.instruction,
            imageKey: step.imageKey ?? null,
          })),
        );
      }

      return recipe.id;
    });

    return fullRecipe(ctx.db, ctx.workspace.id, recipeId);
  }),

  update: protectedProcedure
    .input(recipeInput.extend({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await loadRecipeOrThrow(ctx.db, ctx.workspace.id, input.id);
      assertOwnedImageKey(ctx.workspace.id, input.coverImageKey);
      for (const step of input.steps) assertOwnedImageKey(ctx.workspace.id, step.imageKey);

      await ctx.db.transaction(async (tx) => {
        await tx
          .update(recipes)
          .set({
            title: input.title,
            servings: input.servings ?? null,
            notes: input.notes ?? null,
            coverImageKey: input.coverImageKey ?? null,
            updatedAt: new Date(),
          })
          .where(eq(recipes.id, input.id));

        await tx.delete(ingredients).where(eq(ingredients.recipeId, input.id));
        await tx.delete(steps).where(eq(steps.recipeId, input.id));

        if (input.ingredients.length > 0) {
          await tx.insert(ingredients).values(
            input.ingredients.map((ingredient, position) => ({
              recipeId: input.id,
              name: ingredient.name,
              quantity: ingredient.quantity ?? null,
              unit: ingredient.unit ?? null,
              position,
            })),
          );
        }

        if (input.steps.length > 0) {
          await tx.insert(steps).values(
            input.steps.map((step, position) => ({
              recipeId: input.id,
              position,
              instruction: step.instruction,
              imageKey: step.imageKey ?? null,
            })),
          );
        }
      });

      return fullRecipe(ctx.db, ctx.workspace.id, input.id);
    }),

  delete: protectedProcedure.input(z.object({ id: z.string().uuid() })).mutation(async ({ ctx, input }) => {
    await loadRecipeOrThrow(ctx.db, ctx.workspace.id, input.id);
    await ctx.db.delete(recipeAlbums).where(eq(recipeAlbums.recipeId, input.id));
    await ctx.db.delete(recipes).where(eq(recipes.id, input.id));
    return { id: input.id };
  }),

  get: protectedProcedure.input(z.object({ id: z.string().uuid() })).query(({ ctx, input }) => {
    return fullRecipe(ctx.db, ctx.workspace.id, input.id);
  }),

  list: protectedProcedure.query(({ ctx }) => {
    return ctx.db.select().from(recipes).where(eq(recipes.workspaceId, ctx.workspace.id));
  }),

  listByAlbum: protectedProcedure.input(z.object({ albumId: z.string().uuid() })).query(async ({ ctx, input }) => {
    const [album] = await ctx.db
      .select({ id: albums.id })
      .from(albums)
      .where(and(eq(albums.id, input.albumId), eq(albums.workspaceId, ctx.workspace.id)))
      .limit(1);
    if (!album) {
      throw new TRPCError({ code: "NOT_FOUND" });
    }

    return ctx.db
      .select({ recipe: recipes })
      .from(recipeAlbums)
      .innerJoin(recipes, eq(recipes.id, recipeAlbums.recipeId))
      .where(and(eq(recipeAlbums.albumId, input.albumId), eq(recipes.workspaceId, ctx.workspace.id)))
      .then((rows) => rows.map((r) => r.recipe));
  }),
});
