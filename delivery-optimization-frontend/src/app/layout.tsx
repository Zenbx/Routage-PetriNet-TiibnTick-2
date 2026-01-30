import React from "react";
import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/layout/Sidebar";
import { ToastContainer } from "@/components/ui/Toast";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"]
});

export const metadata: Metadata = {
  title: "TiibnTick Optimizer",
  description: "Advanced Delivery Optimization System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className={`${poppins.className} bg-slate-50 text-slate-900`}>
        <div className="flex h-screen overflow-hidden relative">
          <Sidebar />
          <main className="flex-1 h-screen relative overflow-hidden">
            {children}
          </main>
          <ToastContainer />
        </div>
      </body>
    </html>
  );
}
