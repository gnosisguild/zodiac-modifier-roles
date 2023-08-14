import { Spectral, Roboto_Mono } from "next/font/google";

export const spectral = Spectral({
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
  variable: "--font-spectral",
});

export const roboto_mono = Roboto_Mono({
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
  variable: "--font-roboto-mono",
});
