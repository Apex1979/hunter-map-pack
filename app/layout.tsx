import type { Metadata } from "next"
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google"
import { TooltipProvider } from "@/components/ui/tooltip"
import "./globals.css"

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

const instrument = Instrument_Serif({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-instrument",
})

export const metadata: Metadata = {
  title: "Hunter — map pack operator",
  description:
    "Run Hunter. Rank null is BUILD. Rank 4+ is STEAL. Rank 1–3 is PROTECT. Own ads only. Human tap before anything posts.",
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`dark ${geistSans.variable} ${geistMono.variable} ${instrument.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <div className="noise-overlay" />
        <div className="scanlines" />
        <TooltipProvider>{children}</TooltipProvider>
      </body>
    </html>
  )
}
