/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CLERK_PUBLISHABLE_KEY: string;
  readonly VITE_BACKEND_URL?: string;
  readonly VITE_MINIO_PUBLIC_URL?: string;
  readonly VITE_MINIO_BUCKET?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
