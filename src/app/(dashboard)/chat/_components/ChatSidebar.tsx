"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "../../utils/api";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { 
  MessageSquare, 
  Plus, 
  MoreVertical, 
  Trash2, 
  Edit2,
  Loader2 
} from "lucide-react";
import { DropdownMenu } from "../ui/DropdownMenu";

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
  const utils = api.useContext();

  const {
    data: sessionsData,
    isLoading,
    fetchNextPage,
    hasNextPage,
  } = api.chat.getSessions.useInfiniteQuery(
    { limit: 20 },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    }
  );

  const createSessionMutation = api.chat.createSession.useMutation({
    onSuccess: (newSession) => {
      utils.chat.getSessions.invalidate();
      onSessionSelect(newSession.id);
      setIsCreating(false);
      setNewSessionTitle("");
    },
  });

  const deleteSessionMutation = api.chat.deleteSession.useMutation({
    onSuccess: () => {
      utils.chat.getSessions.invalidate();
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

  const updateSessionMutation = api.chat.updateSessionTitle.useMutation({
    onSuccess: () => {
      utils.chat.getSessions.invalidate();
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

  const startEditing = (session: any) => {
    setEditingSessionId(session.id);
    setEditTitle(session.title);
  };

  return (
    <div className="w-80 bg-gray-50 border-r h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold mb-4">Career Chat</h2>
        
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
                disabled={!newSessionTitle.trim() || createSessionMutation.isLoading}
              >
                {createSessionMutation.isLoading ? (
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
            <Loader2 className="h-6 w-6 animate-spin mx-auto" />
          </div>
        )}

        {sessions.map((session) => (
          <div
            key={session.id}
            className={`group relative border-b hover:bg-gray-100 ${
              currentSessionId === session.id ? "bg-blue-50" : ""
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
                    <h3 className="font-medium text-sm truncate">
                      {session.title}
                    </h3>
                    <p className="text-xs text-gray-500">
                      {session._count.messages} messages
                    </p>
                  </div>
                </div>

                <DropdownMenu
                  trigger={
                    <Button
                      variant="ghost"
                      size="sm"
                      className="opacity-0 group-hover:opacity-100"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  }
                  items={[
                    {
                      label: "Edit Title",
                      icon: <Edit2 className="h-4 w-4" />,
                      onClick: () => startEditing(session),
                    },
                    {
                      label: "Delete",
                      icon: <Trash2 className="h-4 w-4" />,
                      onClick: () =>
                        deleteSessionMutation.mutate({ sessionId: session.id }),
                      className: "text-red-600",
                    },
                  ]}
                />
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
      </div>
    </div>
  );
};