// app/layout.jsx
import { Geist, Geist_Mono, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { SocketProvider } from "@/components/providers/SocketProvider";

const jetbrainsMono = JetBrains_Mono({ 
  subsets: ['latin'], 
  variable: '--font-mono' 
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Challenge Battle",
  description: "Battle with images and votes",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={cn(
        "h-full antialiased",
        geistSans.variable,
        geistMono.variable,
        jetbrainsMono.variable
      )}
    >
      <body className="min-h-full flex flex-col">
        <SocketProvider>
          {children}
        </SocketProvider>
      </body>
    </html>
  );
}