import { describe, test, expect, beforeEach } from "bun:test";
import { eq } from "drizzle-orm";
import { workspaces } from "../src/db/schema";
import { callerAs, resetDb, testDb } from "./helpers";

describe("workspace auto-provisioning", () => {
  beforeEach(async () => {
    await resetDb();
  });

  test("creates exactly one workspace for a new Clerk user on first protected call", async () => {
    const caller = callerAs("user_1");

    const workspace = await caller.workspace.get();

    expect(workspace.clerkUserId).toBe("user_1");

    const rows = await testDb.select().from(workspaces).where(eq(workspaces.clerkUserId, "user_1"));
    expect(rows).toHaveLength(1);
  });

  test("reuses the same workspace on a second call for the same user", async () => {
    const caller = callerAs("user_2");

    const first = await caller.workspace.get();
    const second = await caller.workspace.get();

    expect(second.id).toBe(first.id);

    const rows = await testDb.select().from(workspaces).where(eq(workspaces.clerkUserId, "user_2"));
    expect(rows).toHaveLength(1);
  });

  test("isolates workspaces per user", async () => {
    const workspaceA = await callerAs("user_a").workspace.get();
    const workspaceB = await callerAs("user_b").workspace.get();

    expect(workspaceA.id).not.toBe(workspaceB.id);
  });

  test("rejects an unauthenticated call", async () => {
    const caller = callerAs(null);

    await expect(caller.workspace.get()).rejects.toThrow();
  });
});
