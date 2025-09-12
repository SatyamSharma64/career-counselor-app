import { z } from "zod"

export const createChatSessionSchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title must be less than 100 characters"),
  description: z.string().max(500, "Description must be less than 500 characters").optional(),
})

export const sendMessageSchema = z.object({
  content: z.string().min(1, "Message cannot be empty").max(4000, "Message must be less than 4000 characters"),
  chatSessionId: z.string().min(1, "Chat session ID is required"),
})

export type CreateChatSessionInput = z.infer<typeof createChatSessionSchema>
export type SendMessageInput = z.infer<typeof sendMessageSchema>
