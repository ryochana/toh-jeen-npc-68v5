import type { Metadata } from 'next'
import { Sarabun } from 'next/font/google'

const sarabun = Sarabun({ 
  subsets: ['latin', 'thai'],
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap'
})

export const metadata: Metadata = {
  title: 'โต๊ะจีนบ้านโนนผักชี',
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
        <script
          dangerouslySetInnerHTML={{
            __html: `
              tailwind.config = {
                theme: {
                  extend: {
                    fontFamily: {
                      'sarabun': ['Sarabun', 'sans-serif'],
                    }
                  }
                }
              }
            `,
          }}
        />
      </head>
      <body className={`${sarabun.className} font-sarabun`}>{children}</body>
    </html>
  )
}
