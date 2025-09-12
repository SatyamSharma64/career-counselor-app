import { MessageRole as Role } from '@prisma/client'

export interface ChatMessage {
  id: string
  content: string
  role: Role
  createdAt: Date
  updatedAt?: Date
}

export interface ChatSession {
  id: string
  title: string
  description: string | null
  createdAt: Date
  updatedAt: Date
  messages: ChatMessage[]
  _count: {
    messages: number
  }
}

export interface CreateChatSessionData {
  title: string
  description?: string
}

export interface SendMessageData {
  content: string
  chatSessionId: string
}


export type SessionType = {
  id: string;
  title: string;
  // description: string | null;
  createdAt: Date;
  updatedAt: Date;
  _count: {
    messages: number;
  };
}