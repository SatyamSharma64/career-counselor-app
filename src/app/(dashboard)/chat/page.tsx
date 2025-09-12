import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { WelcomePage } from './_components/WelcomePage'

export default async function ChatPage() {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect('/signin')
  }

  return <WelcomePage />
}