import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/server/db'
import ChatInterface from '../_components/ChatInterface'

interface ChatSessionPageProps {
  params: Promise<{ sessionId: string }> 
}

export default async function ChatSessionPage({ params }: ChatSessionPageProps) {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect('/signin')
  }

  const { sessionId } = await params

  
  const chatSession = await prisma.chatSession.findFirst({
    where: {
      id: sessionId,
      userId: session.user.id,
    }
  })

  if (!chatSession) {
    redirect('/chat')
  }

  return <ChatInterface sessionId={sessionId} />
}
