import { MessageRole } from '@prisma/client'
import { formatRelativeTime } from '@/lib/utils'
import { Avatar, AvatarFallback } from '@/components/ui/Avatar'
import { Bot, User, Loader2, AlertTriangle } from 'lucide-react'

interface MessageBubbleProps {
  content: string
  role: MessageRole
  timestamp: Date
  isPending?: boolean
  isFailed?: boolean
}

export function MessageBubble({ content, role, timestamp, isPending, isFailed }: MessageBubbleProps) {
  const isUser = role === MessageRole.USER
  
  return (
    <div className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <Avatar className="w-8 h-8 mt-1">
          <AvatarFallback className="bg-blue-100 dark:bg-blue-900">
            <Bot className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </AvatarFallback>
        </Avatar>
      )}
      
      <div className={`max-w-[80%] ${isUser ? 'order-first' : ''}`}>
        <div
          className={`rounded-2xl px-4 py-3 relative ${
            isUser
              ? 'bg-blue-600 text-white'
              : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
          } ${isPending ? 'opacity-70' : ''} ${isFailed ? 'opacity-60 border-red-300 dark:border-red-600' : ''}`}
        >
          <div className="text-sm whitespace-pre-wrap leading-relaxed">
            {content}
          </div>
          
          {/* Status indicators */}
          {isPending && (
            <div className="flex items-center mt-2 text-xs opacity-70">
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              Sending...
            </div>
          )}
          
          {isFailed && (
            <div className="flex items-center mt-2 text-xs text-red-400">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Failed to send
            </div>
          )}
        </div>
        
        <div className={`text-xs text-gray-500 mt-1 ${isUser ? 'text-right' : ''}`}>
          {isPending ? 'Sending...' : isFailed ? 'Failed' : formatRelativeTime(timestamp)}
        </div>
      </div>
      
      {isUser && (
        <Avatar className="w-8 h-8 mt-1">
          <AvatarFallback className="bg-gray-100 dark:bg-gray-700">
            <User className="w-4 h-4" />
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  )
}
