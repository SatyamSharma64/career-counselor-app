import { useState, useCallback } from 'react'
import { trpc } from '@/lib/trpc/client'

export function useChat(sessionId?: string) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { data: session, refetch } = trpc.chat.getSession.useQuery(
    { sessionId: sessionId! },
    { enabled: !!sessionId }
  )

  const sendMessageMutation = trpc.chat.sendMessage.useMutation()

  const sendMessage = useCallback(async (content: string, isRetry: boolean) => {
    if (!sessionId) return

    setIsLoading(true)
    setError(null)

    try {
      await sendMessageMutation.mutateAsync({
        content,
        chatSessionId: sessionId,
        isRetry,
      })
      await refetch()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message')
    } finally {
      setIsLoading(false)
    }
  }, [sessionId, sendMessageMutation, refetch])

  return {
    session,
    sendMessage,
    isLoading: isLoading || sendMessageMutation.isPending,
    error,
    refetch,
  }
}
