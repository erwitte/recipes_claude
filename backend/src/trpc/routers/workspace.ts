import { router, protectedProcedure } from "../init";

export const workspaceRouter = router({
  get: protectedProcedure.query(({ ctx }) => {
    return ctx.workspace;
  }),
});
