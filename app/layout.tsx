import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/sidebar";

export const metadata: Metadata = {
  title: "Hardware Store Admin",
  description: "Admin panel for hardware store inventory management",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Sidebar />
        <main className="ml-56 min-h-screen">
          <div className="max-w-6xl mx-auto px-4 py-6">{children}</div>
        </main>
      </body>
    </html>
  );
}
