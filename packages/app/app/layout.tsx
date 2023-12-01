import "./globals.css"
import { mono, body } from "./fonts"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Zodiac Roles",
  description: "Role-based access control for smart accounts",
}

export default function PageLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${body.className} ${body.variable} ${mono.variable}`}>
        {children}
      </body>
    </html>
  )
}
