import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { WorkspaceProvider } from "@/components/WorkspaceProvider";
import { Navbar } from "@/components/Navbar";
import { getWorkspaceSnapshot } from "@/lib/repository";

const inter = Inter({
  subsets: ["latin", "vietnamese"],
  variable: "--font-inter",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin", "vietnamese"],
  variable: "--font-jetbrains",
});

export const metadata: Metadata = {
  title: "BTL An Toàn Thông Tin — Mô phỏng Kịch bản 4 Thành viên (DVWA)",
  description:
    "Trang web mô phỏng thực tế kịch bản kiểm thử hộp đen & kiểm toán hộp trắng DVWA chia rõ 4 thành viên, đồng bộ dữ liệu Supabase & Vercel.",
};

export const dynamic = "force-dynamic";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const initialSnapshot = await getWorkspaceSnapshot();

  return (
    <html lang="vi" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="min-h-screen bg-[#060913] text-slate-100 font-sans antialiased cyber-grid-bg">
        <WorkspaceProvider initialSnapshot={initialSnapshot}>
          <Navbar />
          <main className="mx-auto max-w-7xl px-4 pb-16 pt-6 sm:px-6 lg:px-8">
            {children}
          </main>
        </WorkspaceProvider>
      </body>
    </html>
  );
}
