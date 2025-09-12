import { createTRPCRouter, publicProcedure, protectedProcedure } from '../server'

export const authRouter = createTRPCRouter({
  getSession: publicProcedure.query(({ ctx }) => {
    return ctx.session
  }),

  getSecretMessage: protectedProcedure.query(() => {
    return "you can now see this secret message!"
  }),
})
