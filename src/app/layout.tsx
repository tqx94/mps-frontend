import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "@/app/styles/globals.css"
import "@/styles/package-system.css"
// app/layout.tsx
// slick carousel styles (must be in the root layout)
import 'slick-carousel/slick/slick.css'
import 'slick-carousel/slick/slick-theme.css'
import WhatsappLive from "@/components/whatsapp-logo/WhatsappLive";
import { Toaster } from "@/components/ui/toaster"
import HomeToast from "@/components/HomeToast"
import NextTopLoader from 'nextjs-toploader'

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MyProductiveSpace",
  description: "MyProductiveSpace is a pretty cool productivity co-working space in Kovan, Singapore.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <NextTopLoader
          color="#f97316"
          initialPosition={0.08}
          crawlSpeed={200}
          height={3}
          crawl={true}
          showSpinner={true}
          easing="ease"
          speed={200}
          shadow="0 0 10px #f97316,0 0 5px #f97316"
        />
        <div className="w-full">
          {children}
          <WhatsappLive />
        </div>
        
        <Toaster />
        <HomeToast />
      </body>
    </html>
  );
}