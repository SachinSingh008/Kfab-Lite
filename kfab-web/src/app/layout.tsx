import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "KFAB BASIC — Enterprise Operations & Admin",
  description: "Muster Attendance, Fabrication Stock & Supplies Management",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full bg-[#f8fafc] text-slate-900 antialiased">
        {children}
      </body>
    </html>
  );
}
