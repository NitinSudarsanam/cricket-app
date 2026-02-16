import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "@/styles/index.css";
import { ToastProvider } from "@/components/ToastProvider";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-sans-fallback",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const siteName = 'Fantasy Cricket Draft';
const description = 'IPL Fantasy Cricket Draft System – real-time draft with smart validation.';

export const metadata: Metadata = {
  title: {
    default: siteName,
    template: `%s | ${siteName}`,
  },
  description,
  openGraph: {
    title: siteName,
    description,
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: siteName,
    description,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${plusJakarta.variable} antialiased`}>
        {children}
        <ToastProvider position="top-right" />
      </body>
    </html>
  );
}
