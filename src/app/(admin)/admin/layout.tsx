import type { Metadata } from "next";
import "@/app/globals.css";
import AdminLayoutClient from "@/components/admin/AdminLayoutClient";

export const metadata: Metadata = {
  title: "Admin Panel - Kampung Ilmu",
  description: "Panel administrasi Kampung Ilmu",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminLayoutClient>{children}</AdminLayoutClient>;
}
