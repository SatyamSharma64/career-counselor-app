'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { trpc } from '@/lib/trpc/client'
import { Button } from '@/components/ui/Button'
import { MessageSquare, Sparkles, Target, TrendingUp, Plus } from 'lucide-react'

export function WelcomePage() {
  const [isCreating, setIsCreating] = useState(false)
  const router = useRouter()

  const createSessionMutation = trpc.chat.createSession.useMutation({
    onSuccess: (newSession) => {
      router.push(`/chat/${newSession.id}`)
    },
    onError: (error) => {
      console.error('Failed to create session:', error)
    },
  })

  const handleStartChat = (topic: string) => {
    setIsCreating(true)
    createSessionMutation.mutate({ title: topic })
  }

  const suggestedTopics = [
    {
      title: "Career Change Guidance",
      description: "Explore new career paths and transition strategies",
      icon: <Target className="h-6 w-6" />,
    },
    {
      title: "Resume & Interview Prep",
      description: "Get help with your resume and interview skills",
      icon: <Sparkles className="h-6 w-6" />,
    },
    {
      title: "Skill Development",
      description: "Identify and develop key professional skills",
      icon: <TrendingUp className="h-6 w-6" />,
    },
    {
      title: "General Career Advice",
      description: "Ask anything about your professional development",
      icon: <MessageSquare className="h-6 w-6" />,
    },
  ]

  return (
    <div className="flex items-center justify-center h-full bg-white">
      <div className="max-w-4xl mx-auto text-center p-8">
        <div className="mb-8">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <MessageSquare className="h-10 w-10 text-blue-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome to Your AI Career Counselor
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Get personalized career guidance and advice from our AI counselor.
            Start a conversation about any aspect of your professional journey.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {suggestedTopics.map((topic, index) => (
            <div
              key={index}
              className="p-6 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all cursor-pointer group"
              onClick={() => handleStartChat(topic.title)}
            >
              <div className="flex items-center mb-4">
                <div className="text-blue-500 mr-3 group-hover:scale-110 transition-transform">
                  {topic.icon}
                </div>
                <h3 className="font-semibold text-gray-900 text-left">
                  {topic.title}
                </h3>
              </div>
              <p className="text-gray-600 text-sm text-left">
                {topic.description}
              </p>
            </div>
          ))}
        </div>

        <Button
          onClick={() => handleStartChat("General Career Discussion")}
          size="lg"
          disabled={isCreating || createSessionMutation.isPending}
          className="px-8"
        >
          {isCreating || createSessionMutation.isPending ? (
            <>
              <Plus className="h-5 w-5 mr-2 animate-spin" />
              Creating Chat...
            </>
          ) : (
            <>
              <Plus className="h-5 w-5 mr-2" />
              Start New Conversation
            </>
          )}
        </Button>
      </div>
    </div>
  )
}