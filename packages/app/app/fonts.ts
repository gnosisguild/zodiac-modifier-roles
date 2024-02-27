import { Spectral, Roboto_Mono } from "next/font/google"

export const body = Spectral({
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
  variable: "--font-body",
})

export const mono = Roboto_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
  variable: "--font-mono",
})
