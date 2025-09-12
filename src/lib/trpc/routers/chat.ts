import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { createTRPCRouter, protectedProcedure } from '../server'
import { aiService } from '@/services/ai-service'
import { MessageService } from '@/services/message-service'

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
          // description: true,
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
          // description: input.description,
          userId: ctx.session.user.id,
        },
      })

      return session
    }),

  // Send a message and get AI response
  sendMessage: protectedProcedure
    .input(createMessageSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id
      const messageService = new MessageService(ctx.prisma)

      // Validate message content
      if (!aiService.validateMessage(input.content)) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Invalid message content',
        })
      }

      // Verify session ownership
      const session = await ctx.prisma.chatSession.findFirst({
        where: {
          id: input.chatSessionId,
          userId,
        },
      })

      if (!session) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Chat session not found',
        })
      }

      // Get conversation history
      const conversationHistory = await messageService.getConversationHistory(
        input.chatSessionId
      )

      // Save user message
      const userMessage = await messageService.saveUserMessage(
        input.content,
        input.chatSessionId
      )

      try {
        // Generate AI response using the AI service
        const aiResponse = await aiService.generateCareerAdvice(
          input.content,
          conversationHistory
        )

        // Save AI message
        const aiMessage = await messageService.saveAssistantMessage(
          aiResponse,
          input.chatSessionId
        )

        // Update session timestamp
        await messageService.updateSessionTimestamp(input.chatSessionId)

        return {
          userMessage,
          aiMessage,
        }
      } catch (error) {
        console.error('Failed to process message:', error)
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
          // description: input.description,
        },
      })

      return updatedSession
    }),

  // Get conversation summary
  getSummary: protectedProcedure
    .input(z.object({ sessionId: z.string() }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id
      const messageService = new MessageService(ctx.prisma)
      
      const messages = await messageService.getConversationHistory(
        input.sessionId,
        50 // Get more messages for summary
      )

      if (messages.length === 0) {
        return { summary: '' }
      }

      const summary = await aiService.generateConversationSummary(messages)
      
      return { summary }
    }),
})
