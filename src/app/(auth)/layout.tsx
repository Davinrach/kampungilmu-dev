import type { Metadata } from "next";
import "@/app/globals.css";

export const metadata: Metadata = {
  title: "Login - Kampung Ilmu",
  description: "Masuk ke akun Kampung Ilmu Anda",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
