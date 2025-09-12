import { getServerSession } from 'next-auth'
import { authOptions } from '../../lib/auth'
import { prisma } from '../db'

export const createTRPCContext = async () => {
  const session = await getServerSession(authOptions)

  return {
    session,
    prisma,
  }
}
