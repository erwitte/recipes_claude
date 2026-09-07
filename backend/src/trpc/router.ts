import { router } from "./init";
import { workspaceRouter } from "./routers/workspace";
import { recipeRouter } from "./routers/recipe";
import { albumRouter } from "./routers/album";
import { recipeAlbumRouter } from "./routers/recipeAlbum";

export const appRouter = router({
  workspace: workspaceRouter,
  recipe: recipeRouter,
  album: albumRouter,
  recipeAlbum: recipeAlbumRouter,
});

export type AppRouter = typeof appRouter;
