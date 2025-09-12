"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { 
  MessageSquare, 
  Plus, 
  MoreVertical, 
  Trash2, 
  Edit2,
  Loader2 
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";
import { SessionType } from "@/types/chat";

interface ChatSidebarProps {
  currentSessionId?: string;
  onSessionSelect: (sessionId: string) => void;
}

export const ChatSidebar: React.FC<ChatSidebarProps> = ({
  currentSessionId,
  onSessionSelect,
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newSessionTitle, setNewSessionTitle] = useState("");
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  
  const router = useRouter();
  const utils = trpc.useUtils(); // Add this line

  const {
    data: sessionsData,
    isLoading,
    fetchNextPage,
    hasNextPage,
  } = trpc.chat.getSessions.useInfiniteQuery(
    { limit: 20 },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    }
  );

  const createSessionMutation = trpc.chat.createSession.useMutation({
    onSuccess: (newSession) => {
      utils.chat.getSessions.invalidate(); // Fixed
      onSessionSelect(newSession.id);
      setIsCreating(false);
      setNewSessionTitle("");
    },
  });

  const deleteSessionMutation = trpc.chat.deleteSession.useMutation({
    onSuccess: () => {
      utils.chat.getSessions.invalidate(); // Fixed
      if (currentSessionId && sessionsData?.pages[0]?.sessions[0]) {
        const remainingSessions = sessionsData.pages[0].sessions.filter(
          (s) => s.id !== currentSessionId
        );
        if (remainingSessions.length > 0) {
          onSessionSelect(remainingSessions[0].id);
        } else {
          router.push("/chat");
        }
      }
    },
  });

  const updateSessionMutation = trpc.chat.updateSession.useMutation({
    onSuccess: () => {
      utils.chat.getSessions.invalidate(); // Fixed
      setEditingSessionId(null);
      setEditTitle("");
    },
  });

  const sessions = sessionsData?.pages.flatMap((page) => page.sessions) || [];

  const handleCreateSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSessionTitle.trim()) return;

    createSessionMutation.mutate({
      title: newSessionTitle.trim(),
    });
  };

  const handleUpdateTitle = (sessionId: string) => {
    if (!editTitle.trim()) {
      setEditingSessionId(null);
      return;
    }

    updateSessionMutation.mutate({
      sessionId,
      title: editTitle.trim(),
    });
  };

  const startEditing = (session: SessionType) => {
    setEditingSessionId(session.id);
    setEditTitle(session.title);
  };

  const handleDeleteSession = (sessionId: string) => {
    if (confirm('Are you sure you want to delete this chat session?')) {
      deleteSessionMutation.mutate({ sessionId });
    }
  };

  return (
    <div className="w-80 bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Career Chat</h2>
        
        {!isCreating ? (
          <Button
            onClick={() => setIsCreating(true)}
            className="w-full"
            size="sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Chat
          </Button>
        ) : (
          <form onSubmit={handleCreateSession} className="space-y-2">
            <Input
              value={newSessionTitle}
              onChange={(e) => setNewSessionTitle(e.target.value)}
              placeholder="Chat topic..."
              autoFocus
            />
            <div className="flex space-x-2">
              <Button
                type="submit"
                size="sm"
                disabled={!newSessionTitle.trim() || createSessionMutation.isPending}
              >
                {createSessionMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Create"
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsCreating(false);
                  setNewSessionTitle("");
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        )}
      </div>

      {/* Sessions List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading && (
          <div className="p-4 text-center">
            <Loader2 className="h-6 w-6 animate-spin mx-auto text-gray-400" />
          </div>
        )}

        {sessions.map((session) => (
          <div
            key={session.id}
            className={`group relative border-b border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 ${
              currentSessionId === session.id ? "bg-blue-50 dark:bg-blue-900/20" : ""
            }`}
          >
            {editingSessionId === session.id ? (
              <div className="p-4">
                <Input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  onBlur={() => handleUpdateTitle(session.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleUpdateTitle(session.id);
                    } else if (e.key === "Escape") {
                      setEditingSessionId(null);
                      setEditTitle("");
                    }
                  }}
                  autoFocus
                />
              </div>
            ) : (
              <div
                className="p-4 cursor-pointer flex items-center justify-between"
                onClick={() => onSessionSelect(session.id)}
              >
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <MessageSquare className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <h3 className="font-medium text-sm truncate text-gray-900 dark:text-white">
                      {session.title}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {session._count.messages} messages
                    </p>
                  </div>
                </div>

                {/* Fixed DropdownMenu structure */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="opacity-0 group-hover:opacity-100"
                      onClick={(e) => e.stopPropagation()} // Prevent session selection
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem 
                      onClick={(e) => {
                        e.stopPropagation();
                        startEditing(session);
                      }}
                    >
                      <Edit2 className="h-4 w-4 mr-2" />
                      Edit Title
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteSession(session.id);
                      }}
                      className="text-red-600 dark:text-red-400"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>
        ))}

        {hasNextPage && (
          <div className="p-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchNextPage()}
              className="w-full"
            >
              Load More
            </Button>
          </div>
        )}

        {sessions.length === 0 && !isLoading && (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No chat sessions yet</p>
            <p className="text-xs">Create your first chat to get started</p>
          </div>
        )}
      </div>
    </div>
  );
};
