import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'ระบบจองโต๊ะงานแต่งงาน',
  description: 'ระบบจองโต๊ะสำหรับงานแต่งงาน',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="th">
      <head>
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body>{children}</body>
    </html>
  )
}
