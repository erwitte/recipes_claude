import type { ImageStorage } from "./imageStorage";

export function createFakeImageStorage(): ImageStorage & { get: (key: string) => Buffer | undefined } {
  const files = new Map<string, Buffer>();

  return {
    async put(key, data) {
      files.set(key, data);
    },
    getUrl(key) {
      return `memory://${key}`;
    },
    async delete(key) {
      files.delete(key);
    },
    get(key) {
      return files.get(key);
    },
  };
}
