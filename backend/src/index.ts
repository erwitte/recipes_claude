import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "./trpc/router";
import { createContext } from "./trpc/createContext";
import { db } from "./db/client";
import { handleImageUpload } from "./http/uploadHandler";
import { createMinioImageStorage } from "./storage/minioImageStorage";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": process.env.FRONTEND_ORIGIN ?? "http://localhost:5173",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

const storage = createMinioImageStorage({
  endpoint: process.env.MINIO_ENDPOINT ?? "http://localhost:9000",
  region: process.env.MINIO_REGION ?? "us-east-1",
  accessKeyId: process.env.MINIO_ACCESS_KEY ?? "",
  secretAccessKey: process.env.MINIO_SECRET_KEY ?? "",
  bucket: process.env.MINIO_BUCKET ?? "recipes",
  publicUrl: process.env.MINIO_PUBLIC_URL ?? "http://localhost:9000",
});

Bun.serve({
  port: process.env.PORT ? Number(process.env.PORT) : 3000,
  async fetch(req) {
    if (req.method === "OPTIONS") {
      return new Response(null, { headers: CORS_HEADERS });
    }

    const url = new URL(req.url);

    if (url.pathname.startsWith("/trpc")) {
      const response = await fetchRequestHandler({
        endpoint: "/trpc",
        req,
        router: appRouter,
        createContext,
      });
      for (const [key, value] of Object.entries(CORS_HEADERS)) {
        response.headers.set(key, value);
      }
      return response;
    }

    if (url.pathname === "/upload/image") {
      const response = await handleImageUpload(req, { db, storage });
      for (const [key, value] of Object.entries(CORS_HEADERS)) {
        response.headers.set(key, value);
      }
      return response;
    }

    return new Response("Not found", { status: 404 });
  },
});

console.log(`Backend listening on port ${process.env.PORT ?? 3000}`);
