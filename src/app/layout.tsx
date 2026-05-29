import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { ToastProvider } from "@/components/ui/Toast";

const inter = Inter({ subsets: ["latin"] });

const MIDTRANS_CLIENT_KEY =
  process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || "Mid-client-21KMD3yLI1fwB1Z5";
const MIDTRANS_SNAP_URL =
  process.env.NEXT_PUBLIC_MIDTRANS_SNAP_URL ||
  "https://app.sandbox.midtrans.com/snap/snap.js";

export const metadata: Metadata = {
  title: "Kampung Ilmu - Marketplace Buku Online",
  description:
    "Marketplace buku online terlengkap dengan ribuan pilihan buku dari berbagai penerbit dan penulis terbaik di Indonesia",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <head>
        {/* Midtrans Snap - loaded once for whole app */}
        <Script
          src={MIDTRANS_SNAP_URL}
          data-client-key={MIDTRANS_CLIENT_KEY}
          strategy="afterInteractive"
        />
        {/* Google Identity Services for Sign-In */}
        <Script
          src="https://accounts.google.com/gsi/client"
          strategy="afterInteractive"
          async
          defer
        />
      </head>
      <body className={inter.className} suppressHydrationWarning>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
