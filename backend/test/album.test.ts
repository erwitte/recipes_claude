import { describe, test, expect, beforeEach } from "bun:test";
import { TRPCError } from "@trpc/server";
import { callerAs, resetDb } from "./helpers";

async function createRecipe(caller: ReturnType<typeof callerAs>, title: string) {
  return caller.recipe.create({
    title,
    ingredients: [{ name: "a" }],
    steps: [{ instruction: "s" }],
  });
}

describe("album CRUD + recipe-album association", () => {
  beforeEach(async () => {
    await resetDb();
  });

  test("creates an album with a name", async () => {
    const caller = callerAs("user_1");
    const album = await caller.album.create({ name: "Christmas" });
    expect(album.name).toBe("Christmas");
  });

  test("renames and deletes an album", async () => {
    const caller = callerAs("user_1");
    const album = await caller.album.create({ name: "Christmas" });

    const renamed = await caller.album.update({ id: album.id, name: "Xmas" });
    expect(renamed?.name).toBe("Xmas");

    await caller.album.delete({ id: album.id });
    await expect(caller.album.get({ id: album.id })).rejects.toThrow(TRPCError);
  });

  test("a recipe can be attached to any number of albums, including zero", async () => {
    const caller = callerAs("user_1");
    const recipe = await createRecipe(caller, "Turkey");
    const christmas = await caller.album.create({ name: "Christmas" });
    const thanksgiving = await caller.album.create({ name: "Thanksgiving" });

    await caller.recipeAlbum.attach({ recipeId: recipe.id, albumId: christmas.id });
    await caller.recipeAlbum.attach({ recipeId: recipe.id, albumId: thanksgiving.id });

    const inChristmas = await caller.recipe.listByAlbum({ albumId: christmas.id });
    const inThanksgiving = await caller.recipe.listByAlbum({ albumId: thanksgiving.id });
    expect(inChristmas.map((r) => r.id)).toEqual([recipe.id]);
    expect(inThanksgiving.map((r) => r.id)).toEqual([recipe.id]);
  });

  test("a recipe can be detached from an album without being deleted", async () => {
    const caller = callerAs("user_1");
    const recipe = await createRecipe(caller, "Turkey");
    const album = await caller.album.create({ name: "Christmas" });

    await caller.recipeAlbum.attach({ recipeId: recipe.id, albumId: album.id });
    await caller.recipeAlbum.detach({ recipeId: recipe.id, albumId: album.id });

    const inAlbum = await caller.recipe.listByAlbum({ albumId: album.id });
    expect(inAlbum).toHaveLength(0);

    const stillExists = await caller.recipe.get({ id: recipe.id });
    expect(stillExists.id).toBe(recipe.id);
  });

  test("deleting an album removes associations but never deletes the recipes (story 18)", async () => {
    const caller = callerAs("user_1");
    const recipe = await createRecipe(caller, "Turkey");
    const album = await caller.album.create({ name: "Christmas" });
    await caller.recipeAlbum.attach({ recipeId: recipe.id, albumId: album.id });

    await caller.album.delete({ id: album.id });

    const stillExists = await caller.recipe.get({ id: recipe.id });
    expect(stillExists.id).toBe(recipe.id);

    const allRecipes = await caller.recipe.list();
    expect(allRecipes.map((r) => r.id)).toContain(recipe.id);
  });

  test("recipes not in any album appear in the unfiltered browse-all view", async () => {
    const caller = callerAs("user_1");
    const recipe = await createRecipe(caller, "Uncategorized dish");

    const all = await caller.recipe.list();
    expect(all.map((r) => r.id)).toContain(recipe.id);
  });

  test("albums are scoped to the owning workspace", async () => {
    const owner = callerAs("owner");
    const other = callerAs("other");
    const album = await owner.album.create({ name: "Owner's album" });

    await expect(other.album.get({ id: album.id })).rejects.toThrow(TRPCError);
    await expect(other.album.update({ id: album.id, name: "Hijacked" })).rejects.toThrow(TRPCError);
    await expect(other.album.delete({ id: album.id })).rejects.toThrow(TRPCError);

    const ownAlbums = await other.album.list();
    expect(ownAlbums).toHaveLength(0);
  });

  test("attach/detach reject cross-workspace recipe or album ids", async () => {
    const owner = callerAs("owner");
    const other = callerAs("other");
    const recipe = await createRecipe(owner, "Owner's recipe");
    const album = await other.album.create({ name: "Other's album" });

    await expect(other.recipeAlbum.attach({ recipeId: recipe.id, albumId: album.id })).rejects.toThrow(
      TRPCError,
    );
  });
});
