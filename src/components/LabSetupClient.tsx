"use client";

import { useState } from "react";
import {
  CheckCircle2,
  Database,
  Download,
  RefreshCw,
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
    <div className="space-y-10">
      {/* Header */}
      <section className="border-b border-hairline pb-6">
        <div className="font-mono text-xs font-medium uppercase tracking-wider text-muted">
          Hạ tầng Lab &amp; Cơ sở dữ liệu
        </div>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-ink sm:text-3xl">
          Thiết lập Môi trường DVWA &amp; Đồng bộ Supabase
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-secondary">
          Cả macOS và Ubuntu VM dùng chung hệ sinh thái dòng lệnh Unix/Linux, còn container mục tiêu DVWA chạy trên nhân Debian Linux (Apache/2.4.25).
        </p>
      </section>

      {/* 1-Click Ubuntu Script & Shared Setup */}
      <section className="rounded-lg border border-hairline bg-surface p-5 sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-hairline pb-4">
          <div>
            <h2 className="text-lg font-bold text-ink">
              1. Cài đặt Nền tảng Chung cho Ubuntu VM
            </h2>
            <p className="mt-1 text-xs text-muted sm:text-sm">
              Tải script <code className="font-mono text-ink">setup_dvwa_ubuntu.sh</code> hoặc copy cụm lệnh dưới đây chạy trên Terminal Ubuntu.
            </p>
          </div>
          <a
            href="/setup_dvwa_ubuntu.sh"
            download="setup_dvwa_ubuntu.sh"
            className="inline-flex items-center gap-2 rounded-md bg-ink px-4 py-2 text-xs font-semibold text-canvas transition-opacity hover:opacity-90"
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            Tải Script (.sh)
          </a>
        </div>

        <div className="space-y-4">
          <CodeBlock
            label="Cụm lệnh khởi tạo Docker + DVWA trên Ubuntu VM"
            shell="zsh / bash"
            code={UBUNTU_SETUP_COMMANDS}
            explanation="Đặt cờ --name dvwa giúp gõ chữ 'dvwa' thay cho mã ID 215d3a734374 trong mọi lệnh docker exec."
          />

          <CodeBlock
            label="Hoặc chạy tự động bằng file setup_dvwa_ubuntu.sh"
            shell="zsh / bash"
            code={`chmod +x setup_dvwa_ubuntu.sh && ./setup_dvwa_ubuntu.sh && newgrp docker`}
            explanation="Script tự cài docker.io, curl, grep, sqlmap, kéo image vulnerables/web-dvwa và khởi chạy sẵn container 'dvwa' ở cổng 8080."
          />

          <div className="grid gap-4 pt-2 md:grid-cols-2">
            <div className="rounded-md border border-hairline bg-subtle p-4 text-xs leading-relaxed text-secondary">
              <div className="font-bold text-ink">
                Khởi tạo CSDL lần đầu trên trình duyệt:
              </div>
              <ol className="mt-2 list-inside list-decimal space-y-1">
                <li>
                  Truy cập <code className="font-mono text-ink">http://127.0.0.1:8080/setup.php</code>
                </li>
                <li>
                  Bấm <strong>Create / Reset Database</strong>.
                </li>
                <li>
                  Đăng nhập tài khoản <code className="font-mono text-ink">admin</code> / mật khẩu{" "}
                  <code className="font-mono text-ink">password</code>.
                </li>
              </ol>
            </div>

            <div className="rounded-md border border-hairline bg-subtle p-4 text-xs leading-relaxed text-secondary">
              <div className="font-bold text-ink">
                Quy ước đồng bộ Container ID / Name:
              </div>
              <p className="mt-2">
                Container ID trên máy chính là <code className="font-mono text-ink">215d3a734374</code>.
                Trên các máy Ubuntu dùng cờ <code className="font-mono text-ink">--name dvwa</code>, bạn thay{" "}
                <code className="font-mono text-ink">215d3a734374</code> bằng chữ{" "}
                <code className="font-mono text-ink">dvwa</code> (hoặc lấy ID thật qua <code>docker ps</code>).
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Supabase Cloud Sync Panel */}
      <section
        id="supabase"
        className="rounded-lg border border-hairline bg-surface p-5 sm:p-6"
      >
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-hairline pb-4">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-bold text-ink">
              <Database className="h-4 w-4 text-muted" aria-hidden="true" />
              2. Kết nối Cơ sở dữ liệu Supabase &amp; Vercel
            </h2>
            <p className="mt-1 text-xs text-muted sm:text-sm">
              Đồng bộ kịch bản, bảng CWE/CVSS và trạng thái hoàn thành của cả 4 thành viên lên Supabase PostgreSQL.
            </p>
          </div>

          <span className="rounded-md border border-hairline bg-subtle px-3 py-1 font-mono text-xs font-medium text-ink">
            {snapshot.source === "supabase"
              ? "Trạng thái: Supabase Live"
              : snapshot.supabaseConfigured
              ? "Trạng thái: Đã có Env — Cần Seed"
              : "Trạng thái: Local Seed"}
          </span>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div className="rounded-md border border-hairline bg-subtle p-4 text-xs leading-relaxed text-secondary">
            <div className="font-bold text-ink">Hướng dẫn gắn Supabase:</div>
            <ol className="mt-2 list-inside list-decimal space-y-1.5">
              <li>
                Tạo Project mới tại <strong>supabase.com</strong> (region Singapore).
              </li>
              <li>
                Mở <strong>SQL Editor</strong>, dán và chạy file{" "}
                <code className="font-mono text-ink">supabase/schema.sql</code>.
              </li>
              <li>
                Vào <strong>Project Settings → API</strong> lấy <code>Project URL</code> và{" "}
                <code>anon public key</code>.
              </li>
              <li>
                Thêm 2 biến môi trường trên Vercel:{" "}
                <code className="font-mono text-ink">NEXT_PUBLIC_SUPABASE_URL</code> và{" "}
                <code className="font-mono text-ink">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> rồi Redeploy.
              </li>
            </ol>
          </div>

          <div className="flex flex-col justify-between rounded-md border border-hairline bg-subtle p-4">
            <div>
              <div className="text-xs font-bold text-ink">
                Nạp dữ liệu mẫu lên Supabase
              </div>
              <p className="mt-1.5 text-xs leading-relaxed text-muted">
                Sau khi chạy <code>supabase/schema.sql</code> và cấu hình biến môi trường, bấm nút bên dưới để đẩy dữ liệu kịch bản lên Supabase (hoặc chạy trực tiếp file{" "}
                <code className="font-mono text-ink">supabase/seed.sql</code>).
              </p>
            </div>

            <div className="mt-4 space-y-2">
              <button
                type="button"
                onClick={handleSeed}
                disabled={seeding}
                className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-md bg-ink px-4 py-2 text-xs font-semibold text-canvas transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                <RefreshCw
                  className={`h-3.5 w-3.5 ${seeding ? "animate-spin" : ""}`}
                  aria-hidden="true"
                />
                {seeding ? "Đang đồng bộ..." : "Đồng bộ dữ liệu lên Supabase"}
              </button>

              {seedFeedback && (
                <div
                  className={`flex items-start gap-2 rounded-md border p-2.5 text-xs ${
                    seedFeedback.ok
                      ? "border-emerald-600/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                      : "border-rose-600/40 bg-rose-500/10 text-rose-700 dark:text-rose-300"
                  }`}
                >
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
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
