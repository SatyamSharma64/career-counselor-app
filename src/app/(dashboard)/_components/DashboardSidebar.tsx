"use client"

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/utils/cn'
import { Button } from '@/components/ui/Button'
import { trpc } from '@/lib/trpc/client'
import { 
  MessageSquare, 
  Plus, 
  User, 
  Settings, 
  Menu,
  X,
  Trash2
} from 'lucide-react'
import { formatRelativeTime } from '@/lib/utils'
import { SessionType } from '@/types/chat'


export default function DashboardSidebar() {
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  
  const { data: sessions, refetch } = trpc.chat.getSessions.useQuery({ limit: 20 })
  const createSession = trpc.chat.createSession.useMutation({
    onSuccess: () => {
      refetch()
    }
  })
  const deleteSession = trpc.chat.deleteSession.useMutation({
    onSuccess: () => {
      refetch()
    }
  })

  const handleNewChat = async () => {
    try {
      const session = await createSession.mutateAsync({
        title: "New Career Chat",
        description: "Career counseling session"
      })
      // Navigate to new session
      window.location.href = `/chat/${session.id}`
    } catch (error) {
      console.error('Failed to create session:', error)
    }
  }

  const handleDeleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (confirm('Are you sure you want to delete this chat session?')) {
      try {
        await deleteSession.mutateAsync({ sessionId })
      } catch (error) {
        console.error('Failed to delete session:', error)
      }
    }
  }

  const sidebarContent = (
    <>
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <Button onClick={handleNewChat} className="w-full" disabled={createSession.isPending}>
          <Plus className="w-4 h-4 mr-2" />
          New Chat
        </Button>
      </div>

      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        {sessions?.sessions.map((session: SessionType) => (
          <Link
            key={session.id}
            href={`/chat/${session.id}`}
            className={cn(
              "group flex items-center justify-between p-3 rounded-lg text-sm hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors",
              pathname === `/chat/${session.id}` && "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
            )}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center">
                <MessageSquare className="w-4 h-4 mr-2 flex-shrink-0" />
                <span className="truncate font-medium">{session.title}</span>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {formatRelativeTime(session.updatedAt)} • {session._count.messages} messages
              </div>
            </div>
            <button
              onClick={(e) => handleDeleteSession(session.id, e)}
              className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 dark:hover:bg-red-900/20 rounded transition-opacity"
              disabled={deleteSession.isPending}
            >
              <Trash2 className="w-3 h-3 text-red-500" />
            </button>
          </Link>
        ))}
        
        {sessions?.sessions.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No chat sessions yet</p>
            <p className="text-xs">Start a new conversation above</p>
          </div>
        )}
      </nav>

      <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-1">
        <Link
          href="/profile"
          className={cn(
            "flex items-center px-3 py-2 rounded-lg text-sm hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors",
            pathname === '/profile' && "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
          )}
        >
          <User className="w-4 h-4 mr-2" />
          Profile
        </Link>
        <Link
          href="/settings"
          className={cn(
            "flex items-center px-3 py-2 rounded-lg text-sm hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors",
            pathname === '/settings' && "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
          )}
        >
          <Settings className="w-4 h-4 mr-2" />
          Settings
        </Link>
      </div>
    </>
  )

  return (
    <>
      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden fixed top-4 left-4 z-50"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      >
        {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </Button>

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 z-40 bg-black bg-opacity-50"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col transition-transform duration-200 ease-in-out",
        "max-md:fixed max-md:inset-y-0 max-md:left-0 max-md:z-40",
        isMobileMenuOpen ? "max-md:translate-x-0" : "max-md:-translate-x-full"
      )}>
        {sidebarContent}
      </aside>
    </>
  )
}
