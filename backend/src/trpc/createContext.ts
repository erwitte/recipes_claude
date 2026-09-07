import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import { db } from "../db/client";
import { resolveUserId } from "../auth";
import type { Context } from "./context";

export async function createContext({ req }: FetchCreateContextFnOptions): Promise<Context> {
  const userId = await resolveUserId(req);
  return { db, auth: { userId } };
}
