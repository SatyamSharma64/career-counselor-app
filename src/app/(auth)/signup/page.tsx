"use client"

import { signIn } from 'next-auth/react'
import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import Link from 'next/link'
import { Github, Chrome, MessageSquare } from 'lucide-react'

export default function SignUpPage() {
  const [isLoading, setIsLoading] = useState(false)

  const handleOAuthSignUp = async (provider: string) => {
    setIsLoading(true)
    try {
      await signIn(provider, { callbackUrl: '/chat' })
    } catch (error) {
      console.error('Sign up error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <div className="bg-blue-600 p-3 rounded-xl">
            <MessageSquare className="h-8 w-8 text-white" />
          </div>
        </div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
          Create your account
        </h2>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Start your personalized career counseling journey
        </p>
      </div>

      {/* OAuth Providers */}
      <div className="space-y-4">
        <Button
          variant="outline"
          className="w-full"
          onClick={() => handleOAuthSignUp('github')}
          disabled={isLoading}
        >
          <Github className="w-5 h-5 mr-2" />
          Continue with GitHub
        </Button>

        <Button
          variant="outline"
          className="w-full"
          onClick={() => handleOAuthSignUp('google')}
          disabled={isLoading}
        >
          <Chrome className="w-5 h-5 mr-2" />
          Continue with Google
        </Button>
      </div>

      {/* Footer Links */}
      <div className="text-center space-y-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Already have an account?{' '}
          <Link 
            href="/signin" 
            className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
          >
            Sign in here
          </Link>
        </p>

        <p className="text-xs text-gray-500 dark:text-gray-400">
          By creating an account, you agree to our{' '}
          <Link href="/terms" className="underline hover:no-underline">
            Terms of Service
          </Link>
          {' '}and{' '}
          <Link href="/privacy" className="underline hover:no-underline">
            Privacy Policy
          </Link>
        </p>

        <Link 
          href="/"
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-500 dark:text-gray-400 dark:hover:text-gray-300"
        >
          ← Back to home
        </Link>
      </div>
    </div>
  )
}
