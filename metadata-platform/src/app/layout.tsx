import type { Metadata } from 'next'

import { QueryProvider } from '@/lib/query/provider'

import './globals.css'

export const metadata: Metadata = {
  title: 'dodam',
  description: 'Metadata management platform for standards, domains, and codes',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ko">
      <body className="antialiased">
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  )
}
