import { Loader2 } from 'lucide-react'

export default function ChatLoading() {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
        <p className="text-gray-600">Loading chat...</p>
      </div>
    </div>
  )
}