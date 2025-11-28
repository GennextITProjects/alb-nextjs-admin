// src/app/layout.tsx
"use client";
import { useState } from "react";
import { usePathname } from "next/navigation";
import "./globals.css";
import Header from "@/components/layout/Header";
import Sidebar from "./layout/sidebar";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const pathname = usePathname();

  const handleToggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  //hide sidebar for login page
  if (pathname === "/login") {
    return (
      <html lang="en">
        <body className="bg-gray-100 ">
          {children}
        </body>
      </html>
    );
  }

  return (
    <html lang="en">
      <body className="bg-[rgb(241,242,247)]">
        <div className="flex h-screen text-gray-800">
          {/* Sidebar */}
          <aside
            className={`bg-white shadow-md border-r border-gray-200 fixed left-0 top-0 h-full transition-all duration-300 z-20 ${
              isSidebarOpen ? "w-64" : "w-20"
            }`}
          >
            <Sidebar isSidebarOpen={isSidebarOpen} />
          </aside>

          {/* Main Section */}
          <div
            className={`flex-1 flex flex-col h-screen transition-all duration-300 overflow-hidden ${
              isSidebarOpen ? "ml-64" : "ml-20"
            }`}
          >
            {/* Header */}
            <header className="bg-white shadow-sm border-b border-gray-200 z-10 flex-shrink-0">
              <Header isSidebarOpen={isSidebarOpen} onToggleSidebar={handleToggleSidebar} />
            </header>

            {/* Page Content */}
            <main className="flex-1 overflow-auto bg-[rgb(241,242,247)] min-h-0">
              <div className="w-full">{children}</div>
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}