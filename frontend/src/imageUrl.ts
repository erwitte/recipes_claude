const MINIO_PUBLIC_URL = import.meta.env.VITE_MINIO_PUBLIC_URL ?? "http://localhost:9000";
const MINIO_BUCKET = import.meta.env.VITE_MINIO_BUCKET ?? "recipes";

export function imageSrc(imageKey: string | null | undefined) {
  if (!imageKey) return null;
  return `${MINIO_PUBLIC_URL}/${MINIO_BUCKET}/${imageKey}`;
}
