'use client'

import { Button } from '@/components/ui/Button'
import { AlertTriangle } from 'lucide-react'

export default function ChatError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center max-w-md">
        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Chat Error
        </h2>
        <p className="text-gray-600 mb-4">
          Something went wrong with the chat. Please try again.
        </p>
        <Button onClick={reset}>
          Try Again
        </Button>
      </div>
    </div>
  )
}