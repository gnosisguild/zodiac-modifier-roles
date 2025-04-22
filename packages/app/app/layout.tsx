import "./globals.css"
import { mono, body } from "./fonts"
import type { Metadata } from "next"
import { Analytics } from "@vercel/analytics/react"

export const metadata: Metadata = {
  title: "Zodiac Roles",
  description: "Role-based access control for smart accounts",
  manifest: "/manifest.json",
}

export default function PageLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <Analytics />
      <body className={`${body.className} ${body.variable} ${mono.variable}`}>
        {children}
      </body>
    </html>
  )
}
