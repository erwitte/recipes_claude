import { verifyToken } from "@clerk/backend";

export async function resolveUserId(req: Request): Promise<string | null> {
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice("Bearer ".length) : null;
  if (!token) return null;

  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) return null;

  try {
    const payload = await verifyToken(token, { secretKey });
    return payload.sub;
  } catch {
    return null;
  }
}
