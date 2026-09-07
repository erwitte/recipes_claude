import { createDb } from "../src/db/client";
import { appRouter } from "../src/trpc/router";
import { createFakeAuthContext } from "../src/trpc/context";
import { workspaces, recipes, albums } from "../src/db/schema";
import { createFakeImageStorage } from "../src/storage/fakeImageStorage";

export { createFakeImageStorage };

const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ?? "postgres://test:test@localhost:5433/recipes_test";

export const testDb = createDb(TEST_DATABASE_URL);

export function callerAs(userId: string | null) {
  return appRouter.createCaller(createFakeAuthContext(testDb, userId));
}

export async function resetDb() {
  await testDb.delete(recipes);
  await testDb.delete(albums);
  await testDb.delete(workspaces);
}
