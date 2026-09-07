import { randomUUID } from "node:crypto";
import type { Db } from "../db/client";
import type { ImageStorage } from "../storage/imageStorage";
import { resolveUserId as resolveUserIdViaClerk } from "../auth";
import { resolveOrCreateWorkspace } from "../workspace";
import { processImage } from "../imageProcessing";

const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;

export interface UploadDeps {
  db: Db;
  storage: ImageStorage;
  resolveUserId?: (req: Request) => Promise<string | null>;
}

export async function handleImageUpload(req: Request, deps: UploadDeps): Promise<Response> {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const resolveUserId = deps.resolveUserId ?? resolveUserIdViaClerk;
  const userId = await resolveUserId(req);
  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const workspace = await resolveOrCreateWorkspace(deps.db, userId);

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return Response.json({ error: "Missing 'file' field" }, { status: 400 });
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return Response.json({ error: "File too large" }, { status: 400 });
  }

  const input = Buffer.from(await file.arrayBuffer());
  let original: Buffer, thumbnail: Buffer, contentType: string;
  try {
    ({ original, thumbnail, contentType } = await processImage(input));
  } catch {
    return Response.json({ error: "Uploaded file is not a valid image" }, { status: 400 });
  }

  const id = randomUUID();
  const key = `${workspace.id}/${id}.jpg`;
  const thumbnailKey = `${workspace.id}/${id}-thumb.jpg`;

  await deps.storage.put(key, original, contentType);
  await deps.storage.put(thumbnailKey, thumbnail, contentType);

  return Response.json({
    key,
    thumbnailKey,
    url: deps.storage.getUrl(key),
    thumbnailUrl: deps.storage.getUrl(thumbnailKey),
  });
}
