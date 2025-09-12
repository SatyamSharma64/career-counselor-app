import { type NextRequest } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '../db'

export async function createContext(req: NextRequest) {
  const session = await getServerSession(authOptions)
  
  return {
    session,
    prisma,
  }
}

export type Context = Awaited<ReturnType<typeof createContext>>