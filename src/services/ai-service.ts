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


// Helper function to check if error is an Error instance
function isError(error: unknown): error is Error {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as any).message === 'string'
  )
}

// Helper function to safely get error message
function getErrorMessage(error: unknown): string {
  if (isError(error)) {
    return error.message
  }
  if (typeof error === 'string') {
    return error
  }
  return 'Unknown error occurred'
}

function parseAIResponse(response: any): string {
  console.log('Parsing AI response:', {
    status: response.status,
    outputCount: response.output?.length || 0,
    error: response.error
  })

  if (!response.output || !Array.isArray(response.output)) {
    throw new Error('Invalid response format: missing output array')
  }

  // Find the assistant message
  const assistantMessage = response.output.find((item: any) => {
    return item.type === 'message' && 'role' in item && item.role === 'assistant'
  })

  if (!assistantMessage) {
    throw new Error('No assistant message found in response')
  }

  if (!('content' in assistantMessage) || !assistantMessage.content) {
    throw new Error('Assistant message has no content')
  }

  // Check message status
  if ('status' in assistantMessage && assistantMessage.status !== 'completed') {
    console.warn('Assistant message not completed, status:', assistantMessage.status)
  }

  // Extract text content
  const textContent = assistantMessage.content.find((content: any) => 
    content.type === 'output_text'
  )

  if (!textContent?.text) {
    throw new Error('No text content found in assistant message')
  }

  const output = textContent.text.trim()

  if (!output) {
    throw new Error('AI returned empty response text')
  }

  console.log('AI response parsed successfully:', {
    length: output.length,
    preview: output.slice(0, 150) + '...',
    tokensUsed: response.usage?.total_tokens || 0
  })

  return output
}

export class AIService {
  // private readonly maxTokens = 1500
  private readonly temperature = 0.7
  private readonly model = process.env.OPENAI_MODEL || 'gpt-5-nano'
  
  // Generate AI response for career counseling
  async generateCareerAdvice(
    userMessage: string,
    conversationHistory: ConversationMessage[] = []
  ): Promise<string> {
    try {
      const messages = this.buildConversationContext(userMessage, conversationHistory)

      const response = await openai.responses.create({
          model: this.model,
          input: messages,
          // max_output_tokens: this.maxTokens,
          // temperature: this.temperature
      });

      console.log('OpenAI response structure:', {
        status: response.status,
        outputCount: response.output?.length || 0,
        error: response.error,
        model: response.model
      })

      return parseAIResponse(response)

    } catch (error: unknown) {
      console.error('AI Service Error:', getErrorMessage(error))
      throw new Error(`AI service error: ${getErrorMessage(error)}`)
    }
  }

  // Build conversation context for LLM
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

  // Validate message content
  validateMessage(content: string): boolean {
    if (!content || content.trim().length === 0) {
      return false
    }
    
    if (content.length > 4000) {
      return false
    }

    return true
  }


  // Get conversation summary (useful for very long conversations)
  async generateConversationSummary(messages: ConversationMessage[]): Promise<string> {
    if (messages.length === 0) return ''

    const conversationText = messages
      .map(msg => `${msg.role}: ${msg.content}`)
      .join('\n')

    try {
      const summaryInput = [
        {
          role: 'system' as const,
          content: [
            {
              type: 'input_text' as const,
              text: 'You are a helpful assistant that creates concise summaries of career counseling conversations. Summarize the key topics discussed and main advice given in 2-3 sentences.',
            }
          ]
        },
        {
          role: 'user' as const,
          content: [
            {
              type: 'input_text' as const,
              text: `Please summarize this career counseling conversation:\n\n${conversationText}`,
            }
          ]
        }
      ]

      const response = await openai.responses.create({
        model: this.model,
        input: summaryInput,
        max_output_tokens: 200,
        temperature: 0.3,
      })

      return parseAIResponse(response)

    } catch (error) {
      console.error('Failed to generate summary:', error)
      return ''
    }
  }

  async continueResponse(previousResponse: string, userMessage: string): Promise<string> {
    const continuePrompt = `Please continue your previous response that was cut off. 

Previous response: "${previousResponse.slice(-200)}..."

Original question: "${userMessage}"

Please continue from where you left off and provide a complete answer.`

    return this.generateCareerAdvice(continuePrompt, [])
  }
}

export const aiService = new AIService()
