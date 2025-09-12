import { notFound } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/server/db'
import ChatInterface from '../_components/ChatInterface'

interface ChatSessionPageProps {
  params: {
    sessionId: string
  }
}

export default async function ChatSessionPage({ params }: ChatSessionPageProps) {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    return notFound()
  }

  // Verify the session belongs to the user
  const chatSession = await prisma.chatSession.findFirst({
    where: {
      id: params.sessionId,
      userId: session.user.id,
    },
  })

  if (!chatSession) {
    return notFound()
  }

  return <ChatInterface sessionId={params.sessionId} />
}