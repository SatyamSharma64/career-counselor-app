"use client"

import { useState, useCallback, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils/cn'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { trpc } from '@/lib/trpc/client'
import { useToast } from '@/hooks/use-toast'
import { 
  MessageSquare, 
  Plus, 
  User, 
  Settings, 
  Menu,
  X,
  Trash2,
  Loader2,
  Sparkles
} from 'lucide-react'
import { formatRelativeTime } from '@/lib/utils'
import { SessionType } from '@/types/chat'
import { NewChatModal } from '@/components/models/NewChatModel'
import { QuickStartModal } from '@/components/models/QuickStartModel'

interface SessionItemProps {
  session: SessionType;
  isActive: boolean;
  onDelete: (sessionId: string) => void;
  deleteSessionMutation: any;
}

const SessionItem: React.FC<SessionItemProps> = ({ 
  session, 
  isActive, 
  onDelete, 
  deleteSessionMutation 
}) => {
  const handleDeleteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onDelete(session.id);
  };

  return (
    <Link
      href={`/chat/${session.id}`}
      className={cn(
        "group flex items-center justify-between p-3 rounded-lg text-sm hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors",
        isActive && "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
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
        onClick={handleDeleteClick}
        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 dark:hover:bg-red-900/20 rounded transition-opacity"
        disabled={deleteSessionMutation.isPending}
        title="Delete chat"
      >
        {deleteSessionMutation.isPending ? (
          <Loader2 className="w-3 h-3 animate-spin text-red-500" />
        ) : (
          <Trash2 className="w-3 h-3 text-red-500" />
        )}
      </button>
    </Link>
  );
};

export default function DashboardSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isQuickStartModalOpen, setIsQuickStartModalOpen] = useState(false);

  // Quick start titles
  const QUICK_START_TITLES = [
    "Career Planning Discussion",
    "Professional Development Chat", 
    "Job Search Strategy",
    "Skills Assessment Session",
    "Interview Preparation",
    "Salary Negotiation Advice"
  ];

  // Close mobile menu when pathname changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Infinite query for sessions with pagination
  const {
    data: sessionsData,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = trpc.chat.getSessions.useInfiniteQuery(
    { limit: 20 },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    }
  );

  const utils = trpc.useUtils();

  const createSessionMutation = trpc.chat.createSession.useMutation({
    onSuccess: (newSession) => {
      utils.chat.getSessions.invalidate();
      router.push(`/chat/${newSession.id}`);
      setIsMobileMenuOpen(false);
      toast({
        title: "New chat created",
        description: `"${newSession.title}" is ready for your questions!`,
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to create chat",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const deleteSessionMutation = trpc.chat.deleteSession.useMutation({
    onSuccess: () => {
      utils.chat.getSessions.invalidate();
    },
    onError: (error) => {
      toast({
        title: "Failed to delete chat",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const currentSessionId = pathname.startsWith('/chat/') 
    ? pathname.split('/chat/')[1] 
    : undefined;

  const sessions = sessionsData?.pages.flatMap((page) => page.sessions) || [];

  const handleCreateChat = useCallback(async (title: string) => {
    if (!title.trim()) {
      toast({
        title: "Invalid title",
        description: "Please provide a valid title for your chat session.",
        variant: "destructive",
      });
      return;
    }

    await createSessionMutation.mutateAsync({
      title: title.trim(),
      description: `Career discussion: ${title.trim()}`,
    });
    setIsModalOpen(false);
  }, [createSessionMutation, toast]);

  const handleQuickStart = useCallback(() => {
    setIsQuickStartModalOpen(true);
  }, []);

  const handleQuickStartCreate = useCallback(async (title: string) => {
    createSessionMutation.mutate({
      title: title,
      description: `Career discussion: ${title}`,
    });
    setIsQuickStartModalOpen(false);
  }, [createSessionMutation]);

  // delete session with redirection
  const handleDeleteSession = useCallback(async (sessionId: string) => {
    if (!confirm('Are you sure you want to delete this chat session?')) {
      return;
    }

    try {
      await deleteSessionMutation.mutateAsync({ sessionId });
      
      const isCurrentlyOpenSession = sessionId === currentSessionId;
      
      if (isCurrentlyOpenSession) {
        // Redirect to /chat landing page
        router.push('/chat');
      }

      toast({
        title: "Chat deleted",
        description: "Your chat session has been removed.",
      });
      
    } catch (error) {
      console.error('Failed to delete session:', error);
      toast({
        title: "Deletion failed",
        description: "Could not delete the chat session. Please try again.",
        variant: "destructive",
      });
    }
  }, [deleteSessionMutation, currentSessionId, router, toast]);

  // Load more sessions
  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const sidebarContent = (
    <>
      {/* Header with Modal and Quick Start */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 space-y-2">
        <Button 
          onClick={() => setIsModalOpen(true)} 
          className="w-full" 
          size="sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Chat
        </Button>
        
        <Button
          onClick={handleQuickStart}
          variant="outline"
          className="w-full"
          size="sm"
        >
          <Sparkles className="h-4 w-4 mr-2" />
          Quick Start
        </Button>
      </div>

      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        {isLoading && (
          <div className="text-center py-8">
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-400" />
          </div>
        )}

        {sessions.map((session: SessionType) => (
          <SessionItem
            key={session.id}
            session={session}
            isActive={pathname === `/chat/${session.id}`}
            onDelete={handleDeleteSession}
            deleteSessionMutation={deleteSessionMutation}
          />
        ))}

        {hasNextPage && (
          <div className="pt-4">
            <Button
              onClick={handleLoadMore}
              variant="outline"
              size="sm"
              className="w-full"
              disabled={isFetchingNextPage}
            >
              {isFetchingNextPage ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                "Load More"
              )}
            </Button>
          </div>
        )}
        
        {sessions.length === 0 && !isLoading && (
          <div className="text-center text-gray-500 py-8">
            <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No chat sessions yet</p>
            <p className="text-xs">Start a new conversation above</p>
          </div>
        )}
      </nav>

      {/* Footer Navigation */}
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
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden fixed top-4 left-4 z-50 bg-white dark:bg-gray-800 shadow-md"
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

      {/* Chat Modal */}
      <NewChatModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreate={handleCreateChat}
      />

      {/* Quick Start Modal */}
      <QuickStartModal
        isOpen={isQuickStartModalOpen}
        onClose={() => setIsQuickStartModalOpen(false)}
        onCreate={handleQuickStartCreate}
        titles={QUICK_START_TITLES}
      />

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