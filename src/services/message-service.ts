import { PrismaClient, MessageRole } from '@prisma/client'

export class MessageService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Save user message to database
   */
  async saveUserMessage(
    content: string,
    chatSessionId: string
  ) {
    return await this.prisma.message.create({
      data: {
        content,
        role: MessageRole.USER,
        chatSessionId,
        // userId,
      },
    })
  }

  /**
   * Save AI assistant message to database
   */
  async saveAssistantMessage(
    content: string,
    chatSessionId: string
  ) {
    return await this.prisma.message.create({
      data: {
        content,
        role: MessageRole.ASSISTANT,
        chatSessionId,
        // userId,
      },
    })
  }

  /**
   * Get conversation history for a session
   */
  async getConversationHistory(chatSessionId: string, limit = 20) {
    return await this.prisma.message.findMany({
      where: {
        chatSessionId,
        // userId,
      },
      orderBy: {
        createdAt: 'asc',
      },
      take: limit,
      select: {
        id: true,
        content: true,
        role: true,
        createdAt: true,
      },
    })
  }

  /**
   * Update session timestamp
   */
  async updateSessionTimestamp(sessionId: string) {
    await this.prisma.chatSession.update({
      where: {
        id: sessionId,
      },
      data: {
        updatedAt: new Date(),
      },
    })
  }
}
