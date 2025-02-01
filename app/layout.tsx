import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Layout } from '@/components/layout/Layout'
import { Toaster } from '@/components/ui/toaster'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Poker Results',
  description: 'Track and analyze poker results',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Layout>
          {children}
        </Layout>
        <Toaster />
      </body>
    </html>
  )
}
