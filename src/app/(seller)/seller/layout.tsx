import type { Metadata } from "next";
import "@/app/globals.css";
import SellerLayoutClient from "@/components/seller/SellerLayoutClient";

export const metadata: Metadata = {
  title: "Seller Center - Kampung Ilmu",
  description: "Kelola buku dan penjualan Anda di Kampung Ilmu",
};

export default function SellerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SellerLayoutClient>{children}</SellerLayoutClient>;
}
