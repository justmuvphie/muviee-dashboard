import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

export const metadata: Metadata = {
  title: "muviee.idd — Admin Dashboard",
  description: "Dashboard management muviee.idd",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className="bg-[#fffafb] text-gray-800 antialiased">
        <Sidebar />

        <main className="min-h-screen lg:ml-64">
          <div className="px-5 pb-10 pt-20 sm:px-8 lg:px-10 lg:pt-10">
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}