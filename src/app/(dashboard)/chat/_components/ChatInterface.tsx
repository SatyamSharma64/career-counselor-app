"use client"

import { useState, useEffect, useRef } from 'react'
import { trpc } from '@/lib/trpc/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import {MessageBubble} from './MessageBubble'
import {TypingIndicator} from './TypingIndicator'
import { Send, Loader2 } from 'lucide-react'
import { generateSessionTitle } from '@/lib/utils'
import { ChatMessage } from '@/types/chat'

interface ChatInterfaceProps {
  sessionId: string
}

export default function ChatInterface({ sessionId }: ChatInterfaceProps) {
  const [message, setMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const { data: session, refetch } = trpc.chat.getSession.useQuery({ sessionId })
  const sendMessage = trpc.chat.sendMessage.useMutation({
    onSuccess: () => {
      refetch()
      setIsTyping(false)
    },
    onError: () => {
      setIsTyping(false)
    }
  })

  const updateSession = trpc.chat.updateSession.useMutation()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [session?.messages, isTyping])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!message.trim() || sendMessage.isPending) return

    const messageContent = message.trim()
    setMessage('')
    setIsTyping(true)

    try {
      // Update session title based on first message
      if (session?.messages.length === 0) {
        const title = generateSessionTitle(messageContent)
        await updateSession.mutateAsync({
          sessionId,
          title,
        })
      }

      await sendMessage.mutateAsync({
        content: messageContent,
        chatSessionId: sessionId,
      })
    } catch (error) {
      console.error('Failed to send message:', error)
      setMessage(messageContent) // Restore message on error
    }
  }

  if (!session) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
      {/* Chat Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {session.title}
          </h2>
          {/* {session.description && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {session.description}
            </p>
          )} */}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-4xl mx-auto space-y-4">
          {session.messages.length === 0 ? (
            <div className="text-center py-12">
              <div className="bg-blue-100 dark:bg-blue-900 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-blue-600 dark:text-blue-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Start Your Career Journey
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                I'm your AI career counselor, ready to help with career planning, job search strategies, 
                skill development, and professional growth. What would you like to discuss?
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl mx-auto">
                {[
                  "Help me choose a career path",
                  "Review my resume and give feedback",
                  "Prepare for job interviews",
                  "Salary negotiation strategies"
                ].map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => setMessage(suggestion)}
                    className="p-3 text-left bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 transition-colors text-sm"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {session.messages.map((msg: ChatMessage) => (
                <MessageBubble
                  key={msg.id}
                  content={msg.content}
                  role={msg.role}
                  timestamp={msg.createdAt}
                />
              ))}
              {isTyping && <TypingIndicator />}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Message Input */}
      <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSubmit} className="flex space-x-4">
            <div className="flex-1">
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Ask about your career, job search, or professional development..."
                disabled={sendMessage.isPending}
                className="w-full"
                maxLength={4000}
              />
            </div>
            <Button
              type="submit"
              disabled={!message.trim() || sendMessage.isPending}
              size="icon"
            >
              {sendMessage.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>
          <div className="text-xs text-gray-500 mt-2">
            Press Enter to send • {message.length}/4000 characters
          </div>
        </div>
      </div>
    </div>
  )
}
