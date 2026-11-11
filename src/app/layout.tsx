import type { Metadata } from "next";
import { IBM_Plex_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { WorkspaceProvider } from "@/components/WorkspaceProvider";
import { Navbar } from "@/components/Navbar";
import { getWorkspaceSnapshot } from "@/lib/repository";

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-ibm-plex",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-jetbrains",
});

export const metadata: Metadata = {
  title: "DVWA Security Audit — Tài liệu & Mô phỏng Thực hành 4 Thành viên",
  description:
    "Hệ thống mô phỏng kịch bản kiểm thử hộp đen và kiểm toán hộp trắng DVWA theo chuẩn PTES, đồng bộ dữ liệu trên Supabase và Vercel.",
};

export const dynamic = "force-dynamic";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const initialSnapshot = await getWorkspaceSnapshot();

  return (
    <html lang="vi" className={`${ibmPlexSans.variable} ${jetbrainsMono.variable}`}>
      <body className="min-h-screen bg-canvas text-ink font-sans antialiased">
        <WorkspaceProvider initialSnapshot={initialSnapshot}>
          <Navbar />
          <main className="mx-auto max-w-6xl px-4 pb-16 pt-8 sm:px-6 lg:px-8">
            {children}
          </main>
        </WorkspaceProvider>
      </body>
    </html>
  );
}
