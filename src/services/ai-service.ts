import { openai, CAREER_COUNSELOR_PROMPT } from '@/lib/openai'
import { MessageRole } from '@prisma/client'

export type ChatMessage = {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export type ConversationMessage = {
  id: string
  content: string
  role: MessageRole
  createdAt: Date
}

export class AIService {
  private readonly maxTokens = 500
  private readonly temperature = 0.7
  private readonly model = 'gpt-3.5-turbo'
  
  /**
   * Generate AI response for career counseling
   */
  async generateCareerAdvice(
    userMessage: string,
    conversationHistory: ConversationMessage[] = []
  ): Promise<string> {
    try {
      const messages = this.buildConversationContext(userMessage, conversationHistory)
      
      const completion = await openai.chat.completions.create({
        model: this.model,
        messages,
        max_tokens: this.maxTokens,
        temperature: this.temperature,
      })

      const response = completion.choices[0]?.message?.content

      if (!response) {
        throw new Error('No response received from AI')
      }

      return response.trim()
    } catch (error) {
      console.error('AI Service Error:', error)
      throw new Error('Failed to generate AI response')
    }
  }

  /**
   * Build conversation context for OpenAI
   */
  private buildConversationContext(
    userMessage: string,
    conversationHistory: ConversationMessage[]
  ): ChatMessage[] {
    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: CAREER_COUNSELOR_PROMPT,
      }
    ]

    // Add conversation history (last 20 messages for context)
    const recentHistory = conversationHistory.slice(-20)
    for (const msg of recentHistory) {
      messages.push({
        role: msg.role.toLowerCase() as 'user' | 'assistant',
        content: msg.content,
      })
    }

    // Add current user message
    messages.push({
      role: 'user',
      content: userMessage,
    })

    return messages
  }

  /**
   * Validate message content
   */
  validateMessage(content: string): boolean {
    if (!content || content.trim().length === 0) {
      return false
    }
    
    if (content.length > 4000) {
      return false
    }

    return true
  }

  /**
   * Get conversation summary (useful for very long conversations)
   */
  async generateConversationSummary(messages: ConversationMessage[]): Promise<string> {
    if (messages.length === 0) return ''

    const conversationText = messages
      .map(msg => `${msg.role}: ${msg.content}`)
      .join('\n')

    try {
      const completion = await openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'Summarize this career counseling conversation in 2-3 sentences, focusing on key topics discussed and advice given.',
          },
          {
            role: 'user',
            content: conversationText,
          },
        ],
        max_tokens: 150,
        temperature: 0.3,
      })

      return completion.choices[0]?.message?.content?.trim() || ''
    } catch (error) {
      console.error('Failed to generate summary:', error)
      return ''
    }
  }
}

// Export singleton instance
export const aiService = new AIService()
