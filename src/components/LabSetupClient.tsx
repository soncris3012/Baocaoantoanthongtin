"use client";

import { useState } from "react";
import {
  CheckCircle2,
  Database,
  Download,
  RefreshCw,
  Server,
  Terminal,
  Wrench,
} from "lucide-react";
import { CodeBlock } from "@/components/CodeBlock";
import { useWorkspace } from "@/components/WorkspaceProvider";
import { UBUNTU_SETUP_COMMANDS } from "@/data/scenarioData";

export function LabSetupClient() {
  const { snapshot, seedSupabase } = useWorkspace();
  const [seeding, setSeeding] = useState(false);
  const [seedFeedback, setSeedFeedback] = useState<{
    ok: boolean;
    message: string;
  } | null>(null);

  const handleSeed = async () => {
    setSeeding(true);
    setSeedFeedback(null);
    const res = await seedSupabase();
    setSeedFeedback(res);
    setSeeding(false);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <section className="rounded-3xl border border-slate-800 bg-gradient-to-br from-[#0d152a] to-[#080d1b] p-6 sm:p-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-300">
          <Wrench className="h-3.5 w-3.5" />
          Hạ tầng Đồng bộ 4 Máy (1 MacBook + 3 Laptop Windows Ubuntu VM)
        </div>
        <h1 className="mt-3 text-2xl font-extrabold text-white sm:text-3xl">
          Thiết lập Nền tảng Lab DVWA & Đồng bộ Dữ liệu Supabase
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-300">
          Cả 4 máy có thể dựng môi trường độc lập 100% vì macOS và Ubuntu đều dùng chung hệ sinh thái dòng lệnh Unix/Linux, còn container mục tiêu DVWA chạy trên nhân Debian Linux (Apache/2.4.25).
        </p>
      </section>

      {/* 1-Click Ubuntu Script & Shared Setup */}
      <section className="rounded-2xl border border-slate-800 bg-[#0b1120] p-5 sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-bold text-white">
              <Terminal className="h-5 w-5 text-emerald-400" />
              1. Cài đặt Nền tảng Chung cho 3 Máy ảo Ubuntu (Lap Win 1, 2, 3)
            </h2>
            <p className="mt-1 text-xs text-slate-400 sm:text-sm">
              Tải script tự động <code className="text-cyan-300">setup_dvwa_ubuntu.sh</code> hoặc copy cụm lệnh dưới đây chạy trên Terminal Ubuntu.
            </p>
          </div>
          <a
            href="/setup_dvwa_ubuntu.sh"
            download="setup_dvwa_ubuntu.sh"
            className="flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-xs font-bold text-slate-950 transition hover:bg-emerald-400"
          >
            <Download className="h-4 w-4" />
            Tải Script 1-Click (.sh)
          </a>
        </div>

        <div className="space-y-4">
          <CodeBlock
            label="Cụm lệnh khởi tạo Docker + DVWA trên Ubuntu VM"
            shell="zsh / bash"
            code={UBUNTU_SETUP_COMMANDS}
            explanation="Đặt cờ --name dvwa giúp cả 3 bạn Windows gõ chữ 'dvwa' thay cho mã ID 215d3a734374 của máy Mac trong mọi lệnh docker exec."
          />

          <CodeBlock
            label="Hoặc chạy tự động hoàn toàn bằng file setup_dvwa_ubuntu.sh vừa tải"
            shell="zsh / bash"
            code={`chmod +x setup_dvwa_ubuntu.sh && ./setup_dvwa_ubuntu.sh && newgrp docker`}
            explanation="Script tự cài docker.io, curl, grep, sqlmap, kéo image vulnerables/web-dvwa và khởi chạy sẵn container tên 'dvwa' ở cổng 8080."
          />

          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 text-xs leading-relaxed text-slate-300">
              <div className="font-bold text-cyan-300">
                Bước Khởi tạo CSDL lần đầu (Bắt buộc trên cả 4 máy):
              </div>
              <ol className="mt-2 list-inside list-decimal space-y-1">
                <li>
                  Mở trình duyệt truy cập{" "}
                  <code className="text-amber-200">http://127.0.0.1:8080/setup.php</code>
                </li>
                <li>
                  Bấm nút <strong>Create / Reset Database</strong>.
                </li>
                <li>
                  Đăng nhập với tài khoản <code className="text-emerald-300">admin</code> và mật khẩu{" "}
                  <code className="text-emerald-300">password</code>.
                </li>
              </ol>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 text-xs leading-relaxed text-slate-300">
              <div className="font-bold text-amber-300">
                Mẹo Đồng bộ Lệnh giữa MacBook & 3 Máy Ubuntu:
              </div>
              <p className="mt-2">
                Trên máy Mac trong báo cáo, Container ID là{" "}
                <code className="text-cyan-300">215d3a734374</code>. Trên Ubuntu, nhờ cờ{" "}
                <code className="text-emerald-300">--name dvwa</code>, bạn thay{" "}
                <code className="text-cyan-300">215d3a734374</code> bằng chữ{" "}
                <code className="text-emerald-300">dvwa</code> (hoặc lấy ID thật qua{" "}
                <code>docker ps</code>).
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Supabase Cloud Sync Panel */}
      <section
        id="supabase"
        className="rounded-2xl border border-slate-800 bg-[#0b1120] p-5 sm:p-6"
      >
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-bold text-white">
              <Database className="h-5 w-5 text-cyan-400" />
              2. Trạng thái Cơ sở dữ liệu Supabase & Triển khai Vercel
            </h2>
            <p className="mt-1 text-xs text-slate-400 sm:text-sm">
              Đồng bộ dữ liệu kịch bản 4 thành viên, bảng CWE/CVSS và tiến độ thực hành giữa 4 máy qua Supabase Cloud.
            </p>
          </div>

          <div
            className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold ${
              snapshot.source === "supabase"
                ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-300"
                : "border-amber-500/40 bg-amber-500/15 text-amber-300"
            }`}
          >
            <Server className="h-3.5 w-3.5" />
            {snapshot.source === "supabase"
              ? "Đã kết nối & Đang đọc từ Supabase"
              : snapshot.supabaseConfigured
              ? "Đã có Env Supabase — Cần Seed bảng dữ liệu"
              : "Chế độ Local Seed (Chưa gắn Supabase Env)"}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 text-xs leading-relaxed text-slate-300">
            <div className="font-bold text-white">Các bước gắn Supabase (2 phút):</div>
            <ol className="mt-2 list-inside list-decimal space-y-1.5">
              <li>
                Tạo Project mới tại <strong>supabase.com</strong> (chọn region Singapore).
              </li>
              <li>
                Mở <strong>SQL Editor</strong>, dán toàn bộ nội dung file{" "}
                <code className="text-cyan-300">supabase/schema.sql</code> trong repo và bấm <strong>Run</strong>.
              </li>
              <li>
                Vào <strong>Project Settings → API</strong> lấy <code>Project URL</code> và{" "}
                <code>anon public key</code>.
              </li>
              <li>
                Thêm 2 biến môi trường trên Vercel Project:{" "}
                <code className="text-emerald-300">NEXT_PUBLIC_SUPABASE_URL</code> và{" "}
                <code className="text-emerald-300">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> rồi Redeploy.
              </li>
            </ol>
          </div>

          <div className="flex flex-col justify-between rounded-xl border border-slate-800 bg-slate-950/70 p-4">
            <div>
              <div className="text-xs font-bold text-white">
                Nạp / Khởi tạo Dữ liệu Kịch bản lên Supabase (1-Click Seed)
              </div>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-400">
                Sau khi chạy <code>supabase/schema.sql</code> và gắn biến môi trường, bấm nút dưới đây để tự động đẩy toàn bộ 4 thành viên, các bước thực hành, bảng CWE/CVSS và Q&amp;A lên PostgreSQL của Supabase (hoặc chạy trực tiếp file{" "}
                <code className="text-cyan-300">supabase/seed.sql</code>).
              </p>
            </div>

            <div className="mt-4 space-y-2">
              <button
                type="button"
                onClick={handleSeed}
                disabled={seeding}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-500 px-4 py-2.5 text-xs font-bold text-slate-950 transition hover:bg-cyan-400 disabled:opacity-60"
              >
                <RefreshCw className={`h-4 w-4 ${seeding ? "animate-spin" : ""}`} />
                {seeding ? "Đang đồng bộ lên Supabase..." : "Seed / Đồng bộ dữ liệu lên Supabase"}
              </button>

              {seedFeedback && (
                <div
                  className={`flex items-start gap-2 rounded-lg border p-2.5 text-xs ${
                    seedFeedback.ok
                      ? "border-emerald-500/40 bg-emerald-950/30 text-emerald-200"
                      : "border-rose-500/40 bg-rose-950/30 text-rose-200"
                  }`}
                >
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{seedFeedback.message}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
