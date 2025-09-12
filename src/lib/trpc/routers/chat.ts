import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { createTRPCRouter, protectedProcedure } from '../server'
import { openai, CAREER_COUNSELOR_PROMPT } from '../../openai'
import { MessageRole as Role } from '@prisma/client'

const createMessageSchema = z.object({
  content: z.string().min(1).max(4000),
  chatSessionId: z.string(),
})

const createSessionSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().optional(),
})

export const chatRouter = createTRPCRouter({
  // Get all chat sessions for a user
  getSessions: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(50),
        cursor: z.string().nullish(),
      })
    )
    .query(async ({ ctx, input }) => {
      const sessions = await ctx.prisma.chatSession.findMany({
        where: {
          userId: ctx.session.user.id,
          isActive: true,
        },
        orderBy: {
          updatedAt: 'desc',
        },
        take: input.limit + 1,
        cursor: input.cursor ? { id: input.cursor } : undefined,
        select: {
          id: true,
          title: true,
          description: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              messages: true,
            },
          },
        },
      })

      let nextCursor: typeof input.cursor | undefined = undefined
      if (sessions.length > input.limit) {
        const nextItem = sessions.pop()
        nextCursor = nextItem?.id
      }

      return {
        sessions,
        nextCursor,
      }
    }),

  // Get a specific chat session with messages
  getSession: protectedProcedure
    .input(z.object({ sessionId: z.string() }))
    .query(async ({ ctx, input }) => {
      const session = await ctx.prisma.chatSession.findFirst({
        where: {
          id: input.sessionId,
          userId: ctx.session.user.id,
        },
        include: {
          messages: {
            orderBy: {
              createdAt: 'asc',
            },
            select: {
              id: true,
              content: true,
              role: true,
              createdAt: true,
            },
          },
        },
      })

      if (!session) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Chat session not found',
        })
      }

      return session
    }),

  // Create a new chat session
  createSession: protectedProcedure
    .input(createSessionSchema)
    .mutation(async ({ ctx, input }) => {
      const session = await ctx.prisma.chatSession.create({
        data: {
          title: input.title,
          description: input.description,
          userId: ctx.session.user.id,
        },
      })

      return session
    }),

  // Send a message and get AI response
  sendMessage: protectedProcedure
    .input(createMessageSchema)
    .mutation(async ({ ctx, input }) => {
      // Verify session ownership
      const session = await ctx.prisma.chatSession.findFirst({
        where: {
          id: input.chatSessionId,
          userId: ctx.session.user.id,
        },
        include: {
          messages: {
            orderBy: {
              createdAt: 'asc',
            },
            take: 20, // Last 20 messages for context
          },
        },
      })

      if (!session) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Chat session not found',
        })
      }

      // Save user message
      const userMessage = await ctx.prisma.message.create({
        data: {
          content: input.content,
          role: Role.USER,
          chatSessionId: input.chatSessionId,
          userId: ctx.session.user.id,
        },
      })

      try {
        // Prepare conversation history for OpenAI
        const messages = [
          {
            role: 'system' as const,
            content: CAREER_COUNSELOR_PROMPT,
          },
          ...session.messages.map((msg: any) => ({
            role: msg.role.toLowerCase() as 'user' | 'assistant',
            content: msg.content,
          })),
          {
            role: 'user' as const,
            content: input.content,
          },
        ]

        // Get AI response
        const completion = await openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages,
          max_tokens: 500,
          temperature: 0.7,
        })

        const aiResponse = completion.choices[0]?.message?.content

        if (!aiResponse) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'No response from AI',
          })
        }

        // Save AI message
        const aiMessage = await ctx.prisma.message.create({
          data: {
            content: aiResponse,
            role: Role.ASSISTANT,
            chatSessionId: input.chatSessionId,
            userId: ctx.session.user.id,
          },
        })

        // Update session timestamp
        await ctx.prisma.chatSession.update({
          where: {
            id: input.chatSessionId,
          },
          data: {
            updatedAt: new Date(),
          },
        })

        return {
          userMessage,
          aiMessage,
        }
      } catch (error) {
        console.error('OpenAI API Error:', error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get AI response',
        })
      }
    }),

  // Delete a chat session
  deleteSession: protectedProcedure
    .input(z.object({ sessionId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const session = await ctx.prisma.chatSession.findFirst({
        where: {
          id: input.sessionId,
          userId: ctx.session.user.id,
        },
      })

      if (!session) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Chat session not found',
        })
      }

      await ctx.prisma.chatSession.update({
        where: {
          id: input.sessionId,
        },
        data: {
          isActive: false,
        },
      })

      return { success: true }
    }),

  // Update session title
  updateSession: protectedProcedure
    .input(
      z.object({
        sessionId: z.string(),
        title: z.string().min(1).max(100),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const session = await ctx.prisma.chatSession.findFirst({
        where: {
          id: input.sessionId,
          userId: ctx.session.user.id,
        },
      })

      if (!session) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Chat session not found',
        })
      }

      const updatedSession = await ctx.prisma.chatSession.update({
        where: {
          id: input.sessionId,
        },
        data: {
          title: input.title,
          description: input.description,
        },
      })

      return updatedSession
    }),
})
