import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import TRPCProvider from '@/lib/trpc/TRPCProvider'
import AuthProvider from '@/components/providers/AuthProvider'
import { ThemeProvider } from '@/components/providers/ThemeProvider'
import { Toaster } from '@/components/ui/toaster'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Career Chat - AI Career Counseling',
  description: 'Get personalized career guidance with our AI-powered career counselor',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} min-h-screen bg-background text-foreground antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <TRPCProvider>
              {children}
              <Toaster />
            </TRPCProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
