import { useAuth } from "@clerk/clerk-react";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL ?? "http://localhost:3000";

export function useImageUpload() {
  const { getToken } = useAuth();

  return async function uploadImage(file: File): Promise<{ key: string; url: string }> {
    const token = await getToken();
    const form = new FormData();
    form.set("file", file);

    const response = await fetch(`${BACKEND_URL}/upload/image`, {
      method: "POST",
      headers: token ? { authorization: `Bearer ${token}` } : {},
      body: form,
    });

    if (!response.ok) {
      throw new Error("Image upload failed");
    }

    return response.json();
  };
}
