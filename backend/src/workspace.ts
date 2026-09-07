import { eq } from "drizzle-orm";
import type { Db } from "./db/client";
import { workspaces } from "./db/schema";

export async function resolveOrCreateWorkspace(db: Db, userId: string) {
  const [existing] = await db.select().from(workspaces).where(eq(workspaces.clerkUserId, userId)).limit(1);

  const workspace =
    existing ??
    (
      await db
        .insert(workspaces)
        .values({ clerkUserId: userId })
        .onConflictDoNothing({ target: workspaces.clerkUserId })
        .returning()
    )[0] ??
    (await db.select().from(workspaces).where(eq(workspaces.clerkUserId, userId)).limit(1))[0];

  if (!workspace) {
    throw new Error("Failed to resolve workspace");
  }

  return workspace;
}
