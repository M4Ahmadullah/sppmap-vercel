import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Debug: Log the database URL (without password)
console.log('Prisma DATABASE_URL:', process.env.DATABASE_URL?.replace(/:[^@]*@/, ':***@'));

// Force new Prisma client instance
export const prisma = new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
