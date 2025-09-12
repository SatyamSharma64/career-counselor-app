import { createTRPCRouter } from "../trpc/server";
import { chatRouter } from "./routers/chat";
// import { authRouter } from "./routers/auth";

export const appRouter = createTRPCRouter({
  chat: chatRouter,
  // auth: authRouter,
});

export type AppRouter = typeof appRouter;