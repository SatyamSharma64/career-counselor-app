// import { initTRPC, TRPCError } from '@trpc/server'
// import { type Context } from './context'
// import superjson from 'superjson'
// import { ZodError } from 'zod'

// const t = initTRPC.context<Context>().create({
//   transformer: superjson,
//   errorFormatter({ shape, error }) {
//     return {
//       ...shape,
//       data: {
//         ...shape.data,
//         zodError:
//           error.cause instanceof ZodError ? error.cause.flatten() : null,
//       },
//     }
//   },
// })

// export const createTRPCRouter = t.router

// export const publicProcedure = t.procedure

// const enforceUserIsAuthed = t.middleware(({ ctx, next }) => {
//   if (!ctx.session || !ctx.session.user) {
//     throw new TRPCError({ code: 'UNAUTHORIZED' })
//   }
//   return next({
//     ctx: {
//       session: { ...ctx.session, user: ctx.session.user },
//     },
//   })
// })

// export const protectedProcedure = t.procedure.use(enforceUserIsAuthed)

import { initTRPC, TRPCError } from '@trpc/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth'
import { prisma } from '../db'
import superjson from 'superjson'

export const createTRPCContext = async () => {
  const session = await getServerSession(authOptions)

  return {
    session,
    prisma,
  }
}

const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
})

export const createTRPCRouter = t.router
export const publicProcedure = t.procedure

export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.session || !ctx.session.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' })
  }

  return next({
    ctx: {
      ...ctx,
      session: { ...ctx.session, user: ctx.session.user },
    },
  })
})
