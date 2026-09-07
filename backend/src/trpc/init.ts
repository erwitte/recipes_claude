import { initTRPC, TRPCError } from "@trpc/server";
import type { Context } from "./context";
import { resolveOrCreateWorkspace } from "../workspace";

const t = initTRPC.context<Context>().create();

export const router = t.router;
export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.auth.userId) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  let workspace;
  try {
    workspace = await resolveOrCreateWorkspace(ctx.db, ctx.auth.userId);
  } catch {
    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to resolve workspace" });
  }

  return next({
    ctx: {
      ...ctx,
      workspace,
    },
  });
});
