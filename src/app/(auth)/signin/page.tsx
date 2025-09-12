"use client"

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Chrome, Github, Loader2, MessageSquare } from 'lucide-react'
import Link from 'next/link'

export default function SignInPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [email, setEmail] = useState('')
  const router = useRouter()

  const handleOAuthSignIn = async (provider: string) => {
    setIsLoading(true)
    try {
      await signIn(provider, { callbackUrl: '/chat' })
    } catch (error) {
      console.error('Sign in error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      const result = await signIn('email', { 
        email, 
        redirect: false,
        callbackUrl: '/chat'
      })
      
      if (result?.ok) {
        router.push('/chat')
      }
    } catch (error) {
      console.error('Email sign in error:', error)
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
          Sign in to your account
        </h2>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Continue your career journey with AI guidance
        </p>
      </div>

      {/* OAuth Providers */}
      <div className="space-y-3">
        <Button
          onClick={() => handleOAuthSignIn('google')}
          disabled={isLoading}
          className="w-full flex items-center justify-center"
          variant="outline"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Chrome className="h-4 w-4 mr-2" />
          )}
          Continue with Google
        </Button>

        <Button
          onClick={() => handleOAuthSignIn('github')}
          disabled={isLoading}
          className="w-full flex items-center justify-center"
          variant="outline"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Github className="h-4 w-4 mr-2" />
          )}
          Continue with GitHub
        </Button>
      </div>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300 dark:border-gray-600" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
            Or continue with email
          </span>
        </div>
      </div>

      {/* Email Form */}
      <form onSubmit={handleEmailSignIn} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Email address
          </label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="Enter your email"
            className="mt-1"
          />
        </div>

        <Button
          type="submit"
          disabled={isLoading || !email}
          className="w-full"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : null}
          Sign in with Email
        </Button>
      </form>

      {/* Footer Links */}
      <div className="text-center space-y-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Don't have an account?{' '}
          <Link 
            href="/signup" 
            className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
          >
            Sign up here
          </Link>
        </p>

        <p className="text-xs text-gray-500 dark:text-gray-400">
          By signing in, you agree to our{' '}
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
