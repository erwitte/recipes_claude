import { TRPCError } from "@trpc/server";

// Upload keys are minted as `${workspaceId}/${uuid}.jpg` by handleImageUpload,
// so this prefix check keeps one workspace from attaching another's image by
// guessing or reusing a leaked key.
export function assertOwnedImageKey(workspaceId: string, key: string | null | undefined) {
  if (key == null) return;
  if (!key.startsWith(`${workspaceId}/`)) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Image does not belong to this workspace" });
  }
}
