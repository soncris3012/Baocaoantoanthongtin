"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Database,
  MonitorPlay,
  ShieldCheck,
  Terminal,
  Wrench,
} from "lucide-react";
import { useWorkspace } from "@/components/WorkspaceProvider";

const MEMBER_DOT_COLORS: Record<number, string> = {
  1: "bg-cyan-400",
  2: "bg-amber-400",
  3: "bg-emerald-400",
  4: "bg-violet-400",
};

export function Navbar() {
  const pathname = usePathname();
  const { snapshot, presentationMode, setPresentationMode } = useWorkspace();

  const isSupabaseLive = snapshot.source === "supabase";

  return (
    <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-[#070b16]/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 transition group-hover:border-cyan-400/60">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold tracking-tight text-slate-100 sm:text-base">
                DVWA Security Audit
              </span>
              <span className="hidden rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-300 sm:inline-block">
                Band 9.5
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              BTL An Toàn Thông Tin • Kịch bản 4 Thành viên
            </p>
          </div>
        </Link>

        <nav className="flex flex-wrap items-center gap-1.5">
          <Link
            href="/"
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition sm:text-sm ${
              pathname === "/"
                ? "bg-slate-800 text-white shadow-inner ring-1 ring-slate-700"
                : "text-slate-300 hover:bg-slate-800/60 hover:text-white"
            }`}
          >
            Tổng quan BTL
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
                className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition sm:text-sm ${
                  active
                    ? "bg-slate-800 text-white ring-1 ring-slate-600"
                    : "text-slate-300 hover:bg-slate-800/60 hover:text-white"
                }`}
              >
                <span
                  className={`h-2 w-2 rounded-full ${MEMBER_DOT_COLORS[m.member_number]}`}
                />
                <span>Người {m.member_number}</span>
                <span className="hidden text-[11px] text-slate-400 md:inline">
                  ({completedCount}/{totalCount})
                </span>
              </Link>
            );
          })}

          <Link
            href="/lab-setup"
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition sm:text-sm ${
              pathname === "/lab-setup"
                ? "bg-slate-800 text-white ring-1 ring-slate-600"
                : "text-slate-300 hover:bg-slate-800/60 hover:text-white"
            }`}
          >
            <Wrench className="h-3.5 w-3.5" />
            <span>Setup Lab & DB</span>
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/lab-setup#supabase"
            title={
              isSupabaseLive
                ? "Đang đồng bộ trực tiếp với Supabase"
                : "Đang chạy chế độ dữ liệu chuẩn (bấm để xem cấu hình Supabase)"
            }
            className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition ${
              isSupabaseLive
                ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                : "border-amber-500/30 bg-amber-500/10 text-amber-300 hover:border-amber-400/50"
            }`}
          >
            <Database className="h-3 w-3" />
            <span className="hidden sm:inline">
              {isSupabaseLive ? "Supabase Live" : "Local Seed"}
            </span>
          </Link>

          <button
            type="button"
            onClick={() => setPresentationMode(!presentationMode)}
            className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition ${
              presentationMode
                ? "border-cyan-400/60 bg-cyan-500/20 text-cyan-200"
                : "border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-600"
            }`}
            title="Phóng to cỡ chữ và khối lệnh để trình chiếu trên lớp"
          >
            {presentationMode ? (
              <MonitorPlay className="h-3.5 w-3.5 text-cyan-300" />
            ) : (
              <Terminal className="h-3.5 w-3.5" />
            )}
            <span className="hidden lg:inline">
              {presentationMode ? "Đang chiếu" : "Chế độ chiếu"}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}
