import { createTRPCRouter } from '../server'
import { chatRouter } from './chat'
import { authRouter } from './auth'
import { userRouter } from './user'

export const appRouter = createTRPCRouter({
  chat: chatRouter,
  auth: authRouter,
  user: userRouter,
})

export type AppRouter = typeof appRouter