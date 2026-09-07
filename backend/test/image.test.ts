import { describe, test, expect, beforeEach } from "bun:test";
import sharp from "sharp";
import { handleImageUpload } from "../src/http/uploadHandler";
import { processImage } from "../src/imageProcessing";
import { resetDb, testDb, createFakeImageStorage, callerAs } from "./helpers";

async function makeTestImage(): Promise<Buffer> {
  return sharp({
    create: { width: 800, height: 600, channels: 3, background: { r: 200, g: 100, b: 50 } },
  })
    .jpeg()
    .toBuffer();
}

function uploadRequest(imageBuffer: Buffer): Request {
  const form = new FormData();
  form.set("file", new File([imageBuffer], "photo.jpg", { type: "image/jpeg" }));
  return new Request("http://localhost/upload/image", { method: "POST", body: form });
}

const fakeAuthAs = (userId: string | null) => async () => userId;

describe("image upload flow", () => {
  beforeEach(async () => {
    await resetDb();
  });

  test("uploads an image end-to-end via the HTTP handler using the in-memory fake storage", async () => {
    const storage = createFakeImageStorage();
    const image = await makeTestImage();

    const response = await handleImageUpload(uploadRequest(image), {
      db: testDb,
      storage,
      resolveUserId: fakeAuthAs("user_1"),
    });

    expect(response.status).toBe(200);
    const body = (await response.json()) as { key: string; thumbnailKey: string; url: string };

    expect(storage.get(body.key)).toBeDefined();
    expect(storage.get(body.thumbnailKey)).toBeDefined();
    expect(body.url).toBe(`memory://${body.key}`);
  });

  test("rejects an unauthenticated upload", async () => {
    const storage = createFakeImageStorage();
    const image = await makeTestImage();

    const response = await handleImageUpload(uploadRequest(image), {
      db: testDb,
      storage,
      resolveUserId: fakeAuthAs(null),
    });

    expect(response.status).toBe(401);
  });

  test("processImage compresses and produces a thumbnail within bounds", async () => {
    const image = await makeTestImage();

    const { original, thumbnail } = await processImage(image);

    const originalMeta = await sharp(original).metadata();
    const thumbnailMeta = await sharp(thumbnail).metadata();

    expect(thumbnailMeta.width).toBeLessThanOrEqual(400);
    expect(thumbnailMeta.height).toBeLessThanOrEqual(400);
    expect(originalMeta.width).toBeLessThanOrEqual(2000);
  });

  test("rejects an upload whose file is not a valid image", async () => {
    const storage = createFakeImageStorage();
    const form = new FormData();
    form.set("file", new File([Buffer.from("not an image")], "notes.txt", { type: "text/plain" }));
    const req = new Request("http://localhost/upload/image", { method: "POST", body: form });

    const response = await handleImageUpload(req, {
      db: testDb,
      storage,
      resolveUserId: fakeAuthAs("user_1"),
    });

    expect(response.status).toBe(400);
  });

  test("a recipe with no cover image and a step with no photo behave correctly", async () => {
    const caller = callerAs("user_1");

    const recipe = await caller.recipe.create({
      title: "No image",
      ingredients: [{ name: "a" }],
      steps: [{ instruction: "s" }],
    });

    expect(recipe.coverImageKey).toBeNull();
    expect(recipe.steps[0]?.imageKey).toBeNull();
  });
});
