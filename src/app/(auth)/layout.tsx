import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { MessageSquare } from 'lucide-react'
import Link from 'next/link'

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  if (session) {
    redirect('/chat')
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Header with Logo and Theme Toggle */}
      <header className="border-b border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center space-x-2">
            <div className="bg-blue-600 p-2 rounded-lg">
              <MessageSquare className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-white">
              Career Chat
            </span>
          </Link>
          <ThemeToggle />
        </div>
      </header>

      {/* Content */}
      <div className="flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full">
          <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-8 border border-gray-200 dark:border-gray-700">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
