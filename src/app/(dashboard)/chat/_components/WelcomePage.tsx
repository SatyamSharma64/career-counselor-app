'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { trpc } from '@/lib/trpc/client'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/hooks/use-toast'
import { NewChatModal } from '@/components/models/NewChatModel'
import { MessageSquare, Sparkles, Target, TrendingUp, Plus, Loader2 } from 'lucide-react'
import { QuickStartModal } from '@/components/models/QuickStartModel'

export function WelcomePage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isQuickStartModalOpen, setIsQuickStartModalOpen] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const QUICK_START_TITLES = [
    "Career Planning Discussion",
    "Professional Development Chat", 
    "Job Search Strategy",
    "Skills Assessment Session",
    "Interview Preparation",
    "Salary Negotiation Advice"
  ];

  const utils = trpc.useUtils();

  const createSessionMutation = trpc.chat.createSession.useMutation({
    onSuccess: (newSession) => {
      utils.chat.getSessions.invalidate();
      router.push(`/chat/${newSession.id}`);
      toast({
        title: "New chat created",
        description: `"${newSession.title}" is ready for your questions!`,
      });
    },
    onError: (error) => {
      console.error('Failed to create session:', error);
      toast({
        title: "Failed to create chat",
        description: error.message,
        variant: "destructive",
      });
    },
  })

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

  const handleTopicClick = (topic: { title: string; description: string }) => {
    createSessionMutation.mutate({ 
      title: topic.title,
      description: topic.description
    });
  }

  const suggestedTopics = [
    {
      title: "Career Change Guidance",
      description: "Explore new career paths and transition strategies",
      icon: <Target className="h-5 w-5 sm:h-6 sm:w-6" />,
    },
    {
      title: "Resume & Interview Prep",
      description: "Get help with your resume and interview skills",
      icon: <Sparkles className="h-5 w-5 sm:h-6 sm:w-6" />,
    },
    {
      title: "Skill Development",
      description: "Identify and develop key professional skills",
      icon: <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6" />,
    },
    {
      title: "General Career Advice",
      description: "Ask anything about your professional development",
      icon: <MessageSquare className="h-5 w-5 sm:h-6 sm:w-6" />,
    },
  ]

  return (
    <>
      {/* Modals */}
      <NewChatModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreate={handleCreateChat}
      />

      <QuickStartModal
        isOpen={isQuickStartModalOpen}
        onClose={() => setIsQuickStartModalOpen(false)}
        onCreate={handleQuickStartCreate}
        titles={QUICK_START_TITLES}
      />

      <div 
        className="h-screen flex flex-col overflow-hidden bg-white dark:bg-gray-900 transition-colors"
      >
        <div 
          className="flex-1 overflow-y-auto lg:overflow-hidden overflow-x-hidden"
          style={{
            WebkitOverflowScrolling: 'touch',
            touchAction: 'pan-y'
          }}
        >
          <div className="w-full max-w-6xl mx-auto px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-12">
            
            {/* Hero section */}
            <div className="text-center mb-6 sm:mb-8 lg:mb-10">
              <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-4 transition-colors">
                <MessageSquare className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 text-blue-600 dark:text-blue-400" />
              </div>
              
              <h1 className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4 transition-colors leading-tight">
                Welcome to Your AI Career Counselor
              </h1>
              
              <p className="text-base lg:text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto transition-colors leading-relaxed px-2">
                Get personalized career guidance and advice from our AI counselor.
                Start a conversation about any aspect of your professional journey.
              </p>
            </div>

            {/* Topic cards grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-8 sm:mb-12">
              {suggestedTopics.map((topic, index) => (
                <div
                  key={index}
                  className="p-2 sm:p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-md dark:hover:shadow-lg hover:shadow-gray-100 dark:hover:shadow-black/20 transition-all cursor-pointer group bg-white dark:bg-gray-800"
                  onClick={() => handleTopicClick(topic)}
                >
                  <div className="flex items-start sm:items-center mb-3 sm:mb-4">
                    <div className="text-blue-500 dark:text-blue-400 mr-3 group-hover:scale-110 transition-transform flex-shrink-0 mt-0.5 sm:mt-0">
                      {topic.icon}
                    </div>
                    <h3 className="font-semibold text-gray-900 dark:text-white text-left transition-colors text-sm sm:text-base leading-tight">
                      {topic.title}
                    </h3>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 text-xs sm:text-sm text-left transition-colors leading-relaxed">
                    {topic.description}
                  </p>
                </div>
              ))}
            </div>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-stretch sm:items-center mb-8">
              <Button
                onClick={() => setIsModalOpen(true)}
                size="lg"
                className="w-full sm:w-auto px-6 sm:px-8 py-4 text-sm sm:text-base font-medium"
                disabled={createSessionMutation.isPending}
              >
                {createSessionMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 mr-2 animate-spin" />
                    Creating Chat...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                    Create Custom Chat
                  </>
                )}
              </Button>

              <Button
                onClick={handleQuickStart}
                size="lg"
                variant="outline"
                className="w-full sm:w-auto px-6 sm:px-8 py-4 text-sm sm:text-base font-medium"
                disabled={createSessionMutation.isPending}
              >
                {createSessionMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 mr-2 animate-spin" />
                    Starting...
                  </>
                ) : (
                  <>
                    <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                    Quick Start Chat
                  </>
                )}
              </Button>
            </div>

            {/* Footer section */}
            <div className="pt-6 sm:pt-8 border-t border-gray-200 dark:border-gray-700 transition-colors">
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 transition-colors text-center leading-relaxed">
                💡 <strong className="text-gray-700 dark:text-gray-300">Pro Tip:</strong> You can always create multiple chat sessions for different topics or switch between them using the sidebar.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
