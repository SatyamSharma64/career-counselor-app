import { createTRPCRouter } from "../trpc/server";
import { chatRouter } from "./routers/chat";
import { userRouter } from "./routers/user";

export const appRouter = createTRPCRouter({
  chat: chatRouter,
  user: userRouter
});

export type AppRouter = typeof appRouter;