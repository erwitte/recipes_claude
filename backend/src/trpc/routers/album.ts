import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "../init";
import { albums, recipeAlbums } from "../../db/schema";
import { assertOwnedImageKey } from "../../imageKey";

async function loadAlbumOrThrow(
  db: typeof import("../../db/client").db,
  workspaceId: string,
  albumId: string,
) {
  const [album] = await db
    .select()
    .from(albums)
    .where(and(eq(albums.id, albumId), eq(albums.workspaceId, workspaceId)))
    .limit(1);

  if (!album) {
    throw new TRPCError({ code: "NOT_FOUND" });
  }
  return album;
}

export const albumRouter = router({
  create: protectedProcedure
    .input(z.object({ name: z.string().min(1), coverImageKey: z.string().nullable().optional() }))
    .mutation(async ({ ctx, input }) => {
      assertOwnedImageKey(ctx.workspace.id, input.coverImageKey);
      const [album] = await ctx.db
        .insert(albums)
        .values({ workspaceId: ctx.workspace.id, name: input.name, coverImageKey: input.coverImageKey ?? null })
        .returning();
      if (!album) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      return album;
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().min(1),
        coverImageKey: z.string().nullable().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await loadAlbumOrThrow(ctx.db, ctx.workspace.id, input.id);
      assertOwnedImageKey(ctx.workspace.id, input.coverImageKey);
      const [album] = await ctx.db
        .update(albums)
        .set({ name: input.name, coverImageKey: input.coverImageKey ?? null, updatedAt: new Date() })
        .where(eq(albums.id, input.id))
        .returning();
      if (!album) throw new TRPCError({ code: "NOT_FOUND" });
      return album;
    }),

  delete: protectedProcedure.input(z.object({ id: z.string().uuid() })).mutation(async ({ ctx, input }) => {
    await loadAlbumOrThrow(ctx.db, ctx.workspace.id, input.id);
    await ctx.db.delete(recipeAlbums).where(eq(recipeAlbums.albumId, input.id));
    await ctx.db.delete(albums).where(eq(albums.id, input.id));
    return { id: input.id };
  }),

  get: protectedProcedure.input(z.object({ id: z.string().uuid() })).query(({ ctx, input }) => {
    return loadAlbumOrThrow(ctx.db, ctx.workspace.id, input.id);
  }),

  list: protectedProcedure.query(({ ctx }) => {
    return ctx.db.select().from(albums).where(eq(albums.workspaceId, ctx.workspace.id));
  }),
});
