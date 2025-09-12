import { createTRPCRouter } from "../trpc/server";
import { chatRouter } from "./routers/chat";
import { userRouter } from "./routers/user";
// import { authRouter } from "./routers/auth";

export const appRouter = createTRPCRouter({
  chat: chatRouter,
  user: userRouter
  // auth: authRouter,
});

export type AppRouter = typeof appRouter;