import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/sidebar";
import { SidebarProvider } from "@/components/sidebar-context";
import MainContent from "@/components/main-content";

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
        <SidebarProvider>
          <Sidebar />
          <MainContent>{children}</MainContent>
        </SidebarProvider>
      </body>
    </html>
  );
}
