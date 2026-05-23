import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Kampung Ilmu - Marketplace Buku Online",
  description: "Marketplace buku online terlengkap dengan ribuan pilihan buku dari berbagai penerbit dan penulis terbaik di Indonesia",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className={inter.className} suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
