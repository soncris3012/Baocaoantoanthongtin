"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Moon, Search, Shield, Sun, Type } from "lucide-react";
import { QuickSearchModal } from "@/components/QuickSearchModal";
import { useWorkspace } from "@/components/WorkspaceProvider";

export function Navbar() {
  const pathname = usePathname();
  const { snapshot, theme, toggleTheme, presentationMode, setPresentationMode } =
    useWorkspace();
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const isSupabaseLive = snapshot.source === "supabase";

  return (
    <header className="sticky top-0 z-40 border-b border-hairline bg-surface/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="flex items-center gap-2.5 text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-md border border-hairline bg-subtle text-ink">
            <Shield className="h-4 w-4" aria-hidden="true" />
          </span>
          <div className="leading-tight">
            <div className="font-mono text-sm font-bold tracking-tight text-ink">
              DVWA-AUDIT
            </div>
            <div className="text-[11px] text-muted">
              BTL An toàn Thông tin
            </div>
          </div>
        </Link>

        <nav aria-label="Điều hướng chính" className="flex flex-wrap items-center gap-1">
          <Link
            href="/"
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors sm:text-sm ${
              pathname === "/"
                ? "bg-ink text-canvas font-semibold"
                : "text-secondary hover:bg-subtle hover:text-ink"
            }`}
          >
            Tổng quan
          </Link>

          {snapshot.members.map((m) => {
            const href = `/thanh-vien/${m.member_number}`;
            const active = pathname === href;
            const completedCount =
              snapshot.workspaceStates[m.member_number]?.completed_step_ids?.length ?? 0;
            const totalCount = snapshot.steps.filter(
              (s) => s.member_number === m.member_number
            ).length;

            return (
              <Link
                key={m.member_number}
                href={href}
                className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors sm:text-sm ${
                  active
                    ? "bg-ink text-canvas font-semibold"
                    : "text-secondary hover:bg-subtle hover:text-ink"
                }`}
              >
                <span>{m.display_name}</span>
                <span
                  className={`font-mono text-[11px] ${
                    active ? "opacity-80" : "text-muted"
                  }`}
                >
                  {completedCount}/{totalCount}
                </span>
              </Link>
            );
          })}

          <Link
            href="/mo-phong"
            className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors sm:text-sm ${
              pathname === "/mo-phong"
                ? "bg-ink text-canvas font-semibold"
                : "text-secondary hover:bg-subtle hover:text-ink"
            }`}
          >
            Mô phỏng Lab
          </Link>

          <Link
            href="/lab-setup"
            className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors sm:text-sm ${
              pathname === "/lab-setup"
                ? "bg-ink text-canvas font-semibold"
                : "text-secondary hover:bg-subtle hover:text-ink"
            }`}
          >
            Lab &amp; DB
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            aria-label="Tìm kiếm nhanh (Cmd+K)"
            title="Tìm kiếm lệnh, CWE, kịch bản (Ctrl+K / Cmd+K)"
            className="flex h-8 cursor-pointer items-center gap-1.5 rounded-md border border-hairline bg-surface px-2.5 text-xs font-medium text-secondary transition-colors hover:bg-subtle hover:text-ink"
          >
            <Search className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="hidden lg:inline">Tìm nhanh</span>
            <kbd className="hidden rounded border border-hairline bg-subtle px-1 font-mono text-[10px] text-muted sm:inline">
              ⌘K
            </kbd>
          </button>

          <Link
            href="/lab-setup#supabase"
            className="hidden items-center gap-1.5 rounded-md border border-hairline bg-subtle px-2.5 py-1 font-mono text-[11px] font-medium text-secondary transition-colors hover:text-ink sm:flex"
            title={
              isSupabaseLive
                ? "Đang đồng bộ trực tiếp với Supabase"
                : "Chạy dữ liệu chuẩn cục bộ — bấm để xem cấu hình Supabase"
            }
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                isSupabaseLive ? "bg-emerald-600" : "bg-amber-500"
              }`}
              aria-hidden="true"
            />
            <span>{isSupabaseLive ? "Supabase" : "Local"}</span>
          </Link>

          <button
            type="button"
            onClick={() => setPresentationMode(!presentationMode)}
            aria-label="Phóng to cỡ chữ"
            title="Phóng to cỡ chữ và khối lệnh"
            className={`flex h-8 cursor-pointer items-center gap-1 rounded-md border px-2.5 text-xs font-medium transition-colors ${
              presentationMode
                ? "border-accent bg-accent text-white"
                : "border-hairline bg-surface text-secondary hover:bg-subtle hover:text-ink"
            }`}
          >
            <Type className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="hidden md:inline">Cỡ chữ</span>
          </button>

          <button
            type="button"
            onClick={toggleTheme}
            aria-label={theme === "light" ? "Chuyển sang giao diện tối" : "Chuyển sang giao diện sáng"}
            title={theme === "light" ? "Giao diện tối" : "Giao diện sáng"}
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-md border border-hairline bg-surface text-secondary transition-colors hover:bg-subtle hover:text-ink"
          >
            {theme === "light" ? (
              <Moon className="h-3.5 w-3.5" aria-hidden="true" />
            ) : (
              <Sun className="h-3.5 w-3.5" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>
      <QuickSearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </header>
  );
}
