import type { Db } from "../db/client";

export interface Auth {
  userId: string | null;
}

export interface Context {
  db: Db;
  auth: Auth;
}

export function createFakeAuthContext(db: Db, userId: string | null): Context {
  return { db, auth: { userId } };
}
