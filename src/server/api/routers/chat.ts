import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/lib/trpc/server";
import { db } from "../../db";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export const chatRouter = createTRPCRouter({
  // Get all chat sessions for a user
  getSessions: protectedProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).default(10),
      cursor: z.string().nullish(),
    }))
    .query(async ({ ctx, input }) => {
      const sessions = await db.chatSession.findMany({
        where: { userId: ctx.session.user.id },
        include: {
          messages: {
            take: 1,
            orderBy: { createdAt: "desc" },
          },
          _count: {
            select: { messages: true },
          },
        },
        orderBy: { updatedAt: "desc" },
        take: input.limit + 1,
        cursor: input.cursor ? { id: input.cursor } : undefined,
      });

      let nextCursor: typeof input.cursor | undefined = undefined;
      if (sessions.length > input.limit) {
        const nextItem = sessions.pop();
        nextCursor = nextItem!.id;
      }

      return {
        sessions,
        nextCursor,
      };
    }),

  // Create new chat session
  createSession: protectedProcedure
    .input(z.object({
      title: z.string().min(1).max(100),
    }))
    .mutation(async ({ ctx, input }) => {
      const session = await db.chatSession.create({
        data: {
          title: input.title,
          userId: ctx.session.user.id,
        },
      });
      return session;
    }),

  // Get messages for a chat session
  getMessages: protectedProcedure
    .input(z.object({
      sessionId: z.string(),
      limit: z.number().min(1).max(100).default(50),
      cursor: z.string().nullish(),
    }))
    .query(async ({ ctx, input }) => {
      // Verify user owns the session
      const session = await db.chatSession.findFirst({
        where: {
          id: input.sessionId,
          userId: ctx.session.user.id,
        },
      });

      if (!session) {
        throw new Error("Session not found");
      }

      const messages = await db.message.findMany({
        where: { chatSessionId: input.sessionId },
        orderBy: { createdAt: "asc" },
        take: input.limit + 1,
        cursor: input.cursor ? { id: input.cursor } : undefined,
      });

      let nextCursor: typeof input.cursor | undefined = undefined;
      if (messages.length > input.limit) {
        const nextItem = messages.pop();
        nextCursor = nextItem!.id;
      }

      return {
        messages,
        nextCursor,
      };
    }),

  // Send message and get AI response
  sendMessage: protectedProcedure
    .input(z.object({
      sessionId: z.string(),
      content: z.string().min(1),
    }))
    .mutation(async ({ ctx, input }) => {
      // Verify user owns the session
      const session = await db.chatSession.findFirst({
        where: {
          id: input.sessionId,
          userId: ctx.session.user.id,
        },
      });

      if (!session) {
        throw new Error("Session not found");
      }

      // Save user message
      const userMessage = await db.message.create({
        data: {
          content: input.content,
          role: "USER",
          chatSessionId: input.sessionId,
        },
      });

      // Get conversation history
      const previousMessages = await db.message.findMany({
        where: { chatSessionId: input.sessionId },
        orderBy: { createdAt: "asc" },
        take: 20, // Last 20 messages for context
      });

      // Prepare OpenAI messages
      const openaiMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
        {
          role: "system",
          content: `You are an experienced career counselor and coach. Your role is to provide helpful, practical, and personalized career advice. You should:

1. Ask clarifying questions to better understand the person's situation
2. Provide actionable advice and strategies
3. Be encouraging and supportive while being realistic
4. Draw from knowledge of various industries, job markets, and career paths
5. Help with resume writing, interview preparation, career transitions, and skill development
6. Consider the person's interests, values, and circumstances

Keep your responses conversational, empathetic, and focused on the person's career development needs.`,
        },
        ...previousMessages.map((msg: any) => ({
          role: msg.role.toLowerCase() as "user" | "assistant",
          content: msg.content,
        })),
      ];

      try {
        // Get AI response
        const completion = await openai.chat.completions.create({
          model: "gpt-4",
          messages: openaiMessages,
          max_tokens: 1000,
          temperature: 0.7,
        });

        const aiResponse = completion.choices[0]?.message?.content || "I apologize, but I'm having trouble generating a response. Please try again.";

        // Save AI message
        const aiMessage = await db.message.create({
          data: {
            content: aiResponse,
            role: "ASSISTANT",
            chatSessionId: input.sessionId,
          },
        });

        // Update session timestamp
        await db.chatSession.update({
          where: { id: input.sessionId },
          data: { updatedAt: new Date() },
        });

        return {
          userMessage,
          aiMessage,
        };
      } catch (error) {
        console.error("OpenAI API error:", error);
        
        // Save error message
        const errorMessage = await db.message.create({
          data: {
            content: "I apologize, but I'm experiencing technical difficulties. Please try again in a moment.",
            role: "ASSISTANT",
            chatSessionId: input.sessionId,
          },
        });

        return {
          userMessage,
          aiMessage: errorMessage,
        };
      }
    }),

  // Delete chat session
  deleteSession: protectedProcedure
    .input(z.object({
      sessionId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const session = await db.chatSession.findFirst({
        where: {
          id: input.sessionId,
          userId: ctx.session.user.id,
        },
      });

      if (!session) {
        throw new Error("Session not found");
      }

      await db.chatSession.delete({
        where: { id: input.sessionId },
      });

      return { success: true };
    }),

  // Update session title
  updateSessionTitle: protectedProcedure
    .input(z.object({
      sessionId: z.string(),
      title: z.string().min(1).max(100),
    }))
    .mutation(async ({ ctx, input }) => {
      const session = await db.chatSession.findFirst({
        where: {
          id: input.sessionId,
          userId: ctx.session.user.id,
        },
      });

      if (!session) {
        throw new Error("Session not found");
      }

      const updatedSession = await db.chatSession.update({
        where: { id: input.sessionId },
        data: { title: input.title },
      });

      return updatedSession;
    }),
});