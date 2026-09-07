import { describe, test, expect, beforeEach } from "bun:test";
import { TRPCError } from "@trpc/server";
import { callerAs, resetDb } from "./helpers";

describe("album cover image", () => {
  beforeEach(async () => {
    await resetDb();
  });

  test("a user can upload a cover image for an album", async () => {
    const caller = callerAs("user_1");
    const workspace = await caller.workspace.get();
    const album = await caller.album.create({ name: "Christmas", coverImageKey: `${workspace.id}/abc.jpg` });
    expect(album.coverImageKey).toBe(`${workspace.id}/abc.jpg`);
  });

  test("an album with no cover image has a null coverImageKey (placeholder shown client-side)", async () => {
    const caller = callerAs("user_1");
    const album = await caller.album.create({ name: "Christmas" });
    expect(album.coverImageKey).toBeNull();
  });

  test("a user can change an album's cover image", async () => {
    const caller = callerAs("user_1");
    const workspace = await caller.workspace.get();
    const album = await caller.album.create({ name: "Christmas", coverImageKey: `${workspace.id}/old.jpg` });

    const updated = await caller.album.update({
      id: album.id,
      name: "Christmas",
      coverImageKey: `${workspace.id}/new.jpg`,
    });

    expect(updated?.coverImageKey).toBe(`${workspace.id}/new.jpg`);
  });

  test("a user can remove an album's cover image", async () => {
    const caller = callerAs("user_1");
    const workspace = await caller.workspace.get();
    const album = await caller.album.create({ name: "Christmas", coverImageKey: `${workspace.id}/old.jpg` });

    const updated = await caller.album.update({ id: album.id, name: "Christmas", coverImageKey: null });

    expect(updated?.coverImageKey).toBeNull();
  });

  test("rejects a cover image key belonging to another workspace", async () => {
    const owner = callerAs("owner");
    const otherWorkspace = await callerAs("other").workspace.get();

    await expect(
      owner.album.create({ name: "Christmas", coverImageKey: `${otherWorkspace.id}/stolen.jpg` }),
    ).rejects.toThrow(TRPCError);
  });
});
