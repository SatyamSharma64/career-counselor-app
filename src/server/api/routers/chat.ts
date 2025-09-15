import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { createTRPCRouter, protectedProcedure } from '@/server/trpc/server'
import { aiService } from '@/services/ai-service'
import { MessageService } from '@/services/message-service'
import { MessageRole } from '@prisma/client'

const createMessageSchema = z.object({
  content: z.string().min(1).max(4000),
  chatSessionId: z.string(),
  isRetry: z.boolean().default(false),
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

  getSessionMessages: protectedProcedure
    .input(z.object({ 
      sessionId: z.string(),
      limit: z.number().min(1).max(50).default(20),
      cursor: z.string().nullish(), // message ID to start from
    }))
    .query(async ({ ctx, input }) => {
      const session = await ctx.prisma.chatSession.findFirst({
        where: {
          id: input.sessionId,
          userId: ctx.session.user.id,
        },
      });

      if (!session) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Chat session not found',
        });
      }

      const messages = await ctx.prisma.message.findMany({
        where: {
          chatSessionId: input.sessionId,
        },
        orderBy: {
          createdAt: 'desc', // Get newest first for cursor pagination
        },
        take: input.limit + 1, // Take one extra to check if there are more
        cursor: input.cursor ? { id: input.cursor } : undefined,
        select: {
          id: true,
          content: true,
          role: true,
          createdAt: true,
        },
      });

      let nextCursor: typeof input.cursor | undefined = undefined;
      if (messages.length > input.limit) {
        const nextItem = messages.pop();
        nextCursor = nextItem?.id;
      }

      // Reverse to show oldest first in UI
      const reversedMessages = messages.reverse();

      return {
        messages: reversedMessages,
        nextCursor,
        hasMore: !!nextCursor,
        session: {
          id: session.id,
          title: session.title,
          createdAt: session.createdAt,
        }
      };
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

      let userMessage;

      if(!input.isRetry){
        // Save user message
        userMessage = await messageService.saveUserMessage(
          input.content,
          input.chatSessionId
        )
        console.log('user message:', userMessage?.id)

      } else {
        // For retries, find the existing user message
        userMessage = await messageService.getUserMessage(
          input.content, 
          input.chatSessionId, 
          MessageRole.USER
        )

        console.log('Found existing user message for retry:', userMessage?.id)
      }

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
