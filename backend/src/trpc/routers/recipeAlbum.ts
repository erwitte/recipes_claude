import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "../init";
import { albums, recipeAlbums, recipes } from "../../db/schema";

async function assertOwned(
  db: typeof import("../../db/client").db,
  workspaceId: string,
  recipeId: string,
  albumId: string,
) {
  const [recipe] = await db
    .select({ id: recipes.id })
    .from(recipes)
    .where(and(eq(recipes.id, recipeId), eq(recipes.workspaceId, workspaceId)))
    .limit(1);
  const [album] = await db
    .select({ id: albums.id })
    .from(albums)
    .where(and(eq(albums.id, albumId), eq(albums.workspaceId, workspaceId)))
    .limit(1);

  if (!recipe || !album) {
    throw new TRPCError({ code: "NOT_FOUND" });
  }
}

const attachInput = z.object({ recipeId: z.string().uuid(), albumId: z.string().uuid() });

export const recipeAlbumRouter = router({
  attach: protectedProcedure.input(attachInput).mutation(async ({ ctx, input }) => {
    await assertOwned(ctx.db, ctx.workspace.id, input.recipeId, input.albumId);
    await ctx.db
      .insert(recipeAlbums)
      .values({ recipeId: input.recipeId, albumId: input.albumId })
      .onConflictDoNothing();
    return { recipeId: input.recipeId, albumId: input.albumId };
  }),

  detach: protectedProcedure.input(attachInput).mutation(async ({ ctx, input }) => {
    await assertOwned(ctx.db, ctx.workspace.id, input.recipeId, input.albumId);
    await ctx.db
      .delete(recipeAlbums)
      .where(and(eq(recipeAlbums.recipeId, input.recipeId), eq(recipeAlbums.albumId, input.albumId)));
    return { recipeId: input.recipeId, albumId: input.albumId };
  }),
});
