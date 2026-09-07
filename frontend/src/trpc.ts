import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "recipes-backend";

export const trpc = createTRPCReact<AppRouter>();
