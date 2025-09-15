"use client"

import { useState, useEffect, useRef } from 'react'
import { trpc } from '@/lib/trpc/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { MessageBubble } from './MessageBubble'
import { TypingIndicator } from './TypingIndicator'
import { Send, Loader2, RotateCcw, AlertCircle, X, ChevronUp, History } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { MessageRole } from '@prisma/client'

interface ChatInterfaceProps {
  sessionId: string
}

interface UnifiedMessage {
  id: string
  content: string
  role: MessageRole
  timestamp: Date
  status?: 'sending' | 'failed' | 'success'
  error?: string
  isOptimistic?: boolean
}

export default function ChatInterface({ sessionId }: ChatInterfaceProps) {
  const [message, setMessage] = useState('')
  const [optimisticMessages, setOptimisticMessages] = useState<UnifiedMessage[]>([])
  const [isAITyping, setIsAITyping] = useState(false)
  const [showLoadMore, setShowLoadMore] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesStartRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  // Use infinite query for message pagination
  const {
    data: messagesData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch
  } = trpc.chat.getSessionMessages.useInfiniteQuery(
    { 
      sessionId,
      limit: 20 // Load 20 messages at a time
    },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      refetchOnWindowFocus: false,
    }
  )

  const session = messagesData?.pages[0]?.session

  const sendMessage = trpc.chat.sendMessage.useMutation({
    onMutate: async (variables) => {
      const userMessage: UnifiedMessage = {
        id: `user-${Date.now()}`,
        content: variables.content,
        role: MessageRole.USER,
        status: 'sending',
        timestamp: new Date(),
        isOptimistic: true,
      }
      
      setOptimisticMessages(prev => [...prev, userMessage])
      setIsAITyping(true)
      
      return { userMessage }
    },
    
    onSuccess: async (data, variables, context) => {
      setOptimisticMessages(prev => 
        prev.filter(msg => msg.id !== context?.userMessage.id)
      )
      
      setIsAITyping(false)
      
      // Refetch messages to get latest
      await refetch()
      
      toast({
        title: "Message sent successfully",
        duration: 2000,
      })
    },
    
    onError: (error, variables, context) => {
      setOptimisticMessages(prev => 
        prev.map(msg => 
          msg.id === context?.userMessage?.id 
            ? { ...msg, status: 'failed' as const, error: error.message }
            : msg
        )
      )
      
      setIsAITyping(false)
      
      toast({
        title: "Failed to send message",
        description: "Your message has been saved. Click retry to send again.",
        variant: "destructive",
        duration: 5000,
      })
    }
  })

  const updateSession = trpc.chat.updateSession.useMutation()

  // Pagination scrolling
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const scrollToTop = () => {
    messagesStartRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // Load more messages handler
  const handleLoadMore = async () => {
    if (hasNextPage && !isFetchingNextPage) {
      await fetchNextPage()
      setTimeout(() => {
        messagesStartRef.current?.scrollIntoView({ behavior: 'auto' })
      }, 100)
    }
  }

  // Check if we should show load more button
  useEffect(() => {
    const allMessagesCount = messagesData?.pages.reduce((total, page) => total + page.messages.length, 0) || 0
    setShowLoadMore(allMessagesCount > 20) // Show if more than 20 messages
  }, [messagesData])

  useEffect(() => {
    scrollToBottom()
  }, [optimisticMessages, isAITyping])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesData?.pages.length === 1) { 
      setTimeout(() => scrollToBottom(), 100)
    }
  }, [messagesData?.pages.length])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!message.trim() || sendMessage.isPending) return

    const messageContent = message.trim()
    setMessage('')

    try {
      // Update session title based on first message
      // const allMessages = messagesData?.pages.flatMap(page => page.messages) || []
      // if (allMessages.length === 0 && optimisticMessages.length === 0) {
      //   const title = generateSessionTitle(messageContent)
      //   updateSession.mutate({
      //     sessionId,
      //     title,
      //   })
      // }

      await sendMessage.mutateAsync({
        content: messageContent,
        chatSessionId: sessionId,
        isRetry: false,
      })
    } catch (error) {
      console.error('Failed to send message:', error)
    }
  }

  const handleRetry = async (failedMessage: UnifiedMessage) => {
    setOptimisticMessages(prev => 
      prev.map(msg => 
        msg.id === failedMessage.id 
          ? { ...msg, status: 'sending' as const, error: undefined }
          : msg
      )
    )
    
    setIsAITyping(true)
    
    try {
      await sendMessage.mutateAsync({
        content: failedMessage.content,
        chatSessionId: sessionId,
        isRetry: true,
      })
    } catch (error) {
      console.error('Retry failed:', error)
    }
  }

  const handleRemoveFailedMessage = (messageId: string) => {
    setOptimisticMessages(prev => prev.filter(msg => msg.id !== messageId))
    toast({
      title: "Message removed",
      duration: 2000,
    })
  }

  if (!messagesData || !session) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  // Combine all paginated messages with optimistic messages
  const allRealMessages = messagesData.pages.flatMap(page => page.messages)
  
  const normalizedRealMessages: UnifiedMessage[] = allRealMessages.map(msg => ({
    id: msg.id,
    content: msg.content,
    role: msg.role,
    timestamp: msg.createdAt,
    status: 'success' as const,
    isOptimistic: false,
  }))

  const allMessages = [
    ...normalizedRealMessages,
    ...optimisticMessages
  ].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
      {/* Chat Header with message count */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          {/* <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {allRealMessages.length} messages
            </p>
          </div> */}
          
          {/* Scroll to top button */}
          {showLoadMore && (
            <Button
              variant="outline"
              size="sm"
              onClick={scrollToTop}
              className="flex items-center space-x-1"
            >
              <ChevronUp className="h-4 w-4" />
              <span>Top</span>
            </Button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-4xl mx-auto space-y-4">
          <div ref={messagesStartRef} />
          
          {hasNextPage && (
            <div className="text-center py-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handleLoadMore}
                disabled={isFetchingNextPage}
                className="flex items-center space-x-2"
              >
                {isFetchingNextPage ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Loading messages...</span>
                  </>
                ) : (
                  <>
                    <History className="h-4 w-4" />
                    <span>Load older messages</span>
                  </>
                )}
              </Button>
            </div>
          )}

          {allMessages.length === 0 ? (
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
                I&apos;m your AI career counselor, ready to help with career planning, job search strategies, 
                skill development, and professional growth. What would you like to discuss?
              </p>
            </div>
          ) : (
            <>
              {allMessages.map((msg) => (
                <div key={msg.id} className="relative">
                  <MessageBubble
                    content={msg.content}
                    role={msg.role}
                    timestamp={msg.timestamp}
                    isPending={msg.status === 'sending'}
                    isFailed={msg.status === 'failed'}
                  />
                  
                  {msg.status === 'failed' && (
                    <div className="flex items-center justify-end mt-2 space-x-2">
                      <div className="flex items-center text-red-500 text-sm bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Failed to send
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRetry(msg)}
                        disabled={sendMessage.isPending}
                        className="text-xs h-7"
                      >
                        <RotateCcw className="h-3 w-3 mr-1" />
                        Retry
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRemoveFailedMessage(msg.id)}
                        className="text-xs h-7 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
              ))}
              
              {isAITyping && <TypingIndicator />}
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
          <div className="flex justify-between items-center text-xs text-gray-500 mt-2">
            <span>Press Enter to send • {message.length}/4000 characters</span>
            {isAITyping && (
              <span className="text-blue-500 animate-pulse">AI is thinking...</span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
