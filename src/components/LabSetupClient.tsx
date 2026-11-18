"use client";

import { useState } from "react";
import {
  CheckCircle2,
  Database,
  Download,
  KeyRound,
  RefreshCw,
  Terminal,
  Wrench,
} from "lucide-react";
import { CodeBlock } from "@/components/CodeBlock";
import { WindowControls } from "@/components/WindowBar";
import { DockerDesktopEmulator } from "@/components/simulators/DockerDesktopEmulator";
import { DvwaWebEmulator } from "@/components/simulators/DvwaWebEmulator";
import { TerminalEmulator } from "@/components/simulators/TerminalEmulator";
import { useWorkspace } from "@/components/WorkspaceProvider";
import { LAB_MAINTENANCE_COMMANDS, UBUNTU_SETUP_COMMANDS } from "@/data/scenarioData";

export function LabSetupClient() {
  const { snapshot, seedSupabase } = useWorkspace();
  const [sandboxOs, setSandboxOs] = useState<"macos" | "ubuntu">("ubuntu");
  const [sandboxRunning, setSandboxRunning] = useState(true);
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

      {/* Interactive Terminal + Docker Desktop Lab Sandbox */}
      <section className="rounded-lg border border-hairline bg-surface p-5 sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-hairline pb-4">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-bold text-ink">
              <Terminal className="h-4 w-4 text-accent" aria-hidden="true" />
              Thực hành Trực tiếp: Terminal Gõ Tay &amp; Docker Container DVWA
            </h2>
            <p className="mt-1 text-xs text-muted sm:text-sm">
              Gõ trực tiếp các lệnh <code className="font-mono text-ink">docker ps</code>,{" "}
              <code className="font-mono text-ink">docker stop</code>,{" "}
              <code className="font-mono text-ink">docker start</code>,{" "}
              <code className="font-mono text-ink">docker exec -it ... bash</code> và quan sát trạng thái container đồng bộ ngay trên Docker Desktop.
            </p>
          </div>

          <div className="inline-flex rounded-md border border-hairline bg-subtle p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setSandboxOs("ubuntu")}
              className={`cursor-pointer rounded px-3 py-1 font-medium transition-colors ${
                sandboxOs === "ubuntu"
                  ? "bg-surface font-semibold text-ink shadow-sm"
                  : "text-muted hover:text-ink"
              }`}
            >
              Ubuntu VM (--name dvwa)
            </button>
            <button
              type="button"
              onClick={() => setSandboxOs("macos")}
              className={`cursor-pointer rounded px-3 py-1 font-medium transition-colors ${
                sandboxOs === "macos"
                  ? "bg-surface font-semibold text-ink shadow-sm"
                  : "text-muted hover:text-ink"
              }`}
            >
              macOS (Sơn · 215d3a734374)
            </button>
          </div>
        </div>

        <div className="space-y-5">
          <TerminalEmulator
            key={sandboxOs}
            os={sandboxOs}
            username={sandboxOs === "macos" ? "soncris" : "hung"}
            hostname={sandboxOs === "macos" ? "MacBook-Pro" : "ubuntu-vm"}
            containerRef={sandboxOs === "macos" ? "215d3a734374" : "dvwa"}
            containerRunning={sandboxRunning}
            onContainerRunningChange={setSandboxRunning}
            stepGroups={[
              {
                id: "lab-init",
                label: "Khởi tạo Container DVWA",
                commands: [
                  "docker --version",
                  "docker pull vulnerables/web-dvwa",
                  "docker run -d --name dvwa -p 8080:80 vulnerables/web-dvwa",
                  "docker ps",
                ],
              },
            ]}
            presets={[
              { label: "docker --version", command: "docker --version" },
              {
                label: "docker pull vulnerables/web-dvwa",
                command: "docker pull vulnerables/web-dvwa",
              },
              {
                label: "docker run -d --name dvwa -p 8080:80 vulnerables/web-dvwa",
                command: "docker run -d --name dvwa -p 8080:80 vulnerables/web-dvwa",
              },
              { label: "docker ps -a", command: "docker ps -a" },
              {
                label: `${sandboxRunning ? "docker stop" : "docker start"} ${
                  sandboxOs === "macos" ? "215d3a734374" : "dvwa"
                }`,
                command: `${sandboxRunning ? "docker stop" : "docker start"} ${
                  sandboxOs === "macos" ? "215d3a734374" : "dvwa"
                }`,
              },
              {
                label: `docker exec -it ${sandboxOs === "macos" ? "215d3a734374" : "dvwa"} bash`,
                command: `docker exec -it ${sandboxOs === "macos" ? "215d3a734374" : "dvwa"} bash`,
              },
            ]}
          />

          <DockerDesktopEmulator
            platform={sandboxOs}
            containerId="215d3a734374"
            containerName={sandboxOs === "macos" ? "epic_dijkstra" : "dvwa"}
            running={sandboxRunning}
            onRunningChange={setSandboxRunning}
          />

          <DvwaWebEmulator
            defaultPage="setup"
            containerRunning={sandboxRunning}
          />
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

      {/* 3. Cryptography Hash Anatomy */}
      <section className="rounded-lg border border-hairline bg-surface p-5 sm:p-6">
        <div className="mb-4 border-b border-hairline pb-4">
          <h2 className="flex items-center gap-2 text-lg font-bold text-ink">
            <KeyRound className="h-4 w-4 text-accent" aria-hidden="true" />
            3. Giải phẫu Chuỗi băm Mật khẩu: MD5 Không Salt vs Bcrypt (cost = 12)
          </h2>
          <p className="mt-1 text-xs text-muted sm:text-sm">
            Cơ sở học thuật giải thích vì sao tài khoản <code className="font-mono text-ink">admin</code> và{" "}
            <code className="font-mono text-ink">smithy</code> bị lộ đồng loạt trong PoC 3 và cách Bcrypt khắc phục triệt để.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="overflow-hidden rounded-lg border border-zinc-800 bg-[#0d1117] font-mono text-xs">
            <div className="flex items-center justify-between border-b border-zinc-800 bg-[#161b22] px-3.5 py-2">
              <div className="flex items-center gap-2.5">
                <WindowControls />
                <span className="font-bold text-rose-300">MD5 Không Salt (DVWA Mặc định · CWE-759)</span>
              </div>
              <span className="text-[11px] text-zinc-400">32 ký tự hex (128-bit)</span>
            </div>
            <div className="space-y-2 p-4 text-zinc-200">
              <div>
                <span className="text-zinc-500">admin  (&quot;password&quot;) -&gt;</span>{" "}
                <span className="font-bold text-rose-300">5f4dcc3b5aa765d61d8327deb882cf99</span>
              </div>
              <div>
                <span className="text-zinc-500">smithy (&quot;password&quot;) -&gt;</span>{" "}
                <span className="font-bold text-rose-300">5f4dcc3b5aa765d61d8327deb882cf99</span>
              </div>
              <p className="pt-2 font-sans text-xs leading-relaxed text-zinc-400">
                Hai mật khẩu giống nhau luôn cho ra cùng 1 chuỗi MD5 cố định. Tin tặc tra bảng cầu vồng (Rainbow Table) một lần duy nhất sẽ mở khóa hàng loạt tài khoản dùng mật khẩu phổ biến.
              </p>
            </div>
          </div>

          <div className="overflow-hidden rounded-lg border border-zinc-800 bg-[#0d1117] font-mono text-xs">
            <div className="flex items-center justify-between border-b border-zinc-800 bg-[#161b22] px-3.5 py-2">
              <div className="flex items-center gap-2.5">
                <WindowControls />
                <span className="font-bold text-emerald-300">Bcrypt Có Salt (Bản vá PoC 3 · cost = 12)</span>
              </div>
              <span className="text-[11px] text-zinc-400">60 ký tự chuẩn Modular Crypt</span>
            </div>
            <div className="space-y-2.5 p-4 text-zinc-200">
              <div className="break-all rounded border border-zinc-800 bg-[#05070a] p-2.5">
                <span className="font-bold text-sky-400">$2y$</span>
                <span className="font-bold text-amber-300">12$</span>
                <span className="font-bold text-emerald-300">K9p8Q3vT2xL7wR4mN6zA1e</span>
                <span className="text-zinc-200">H8cB5vD0fG2jK4lM6nP8qR0sT2uV4wX</span>
              </div>
              <ul className="space-y-1 font-sans text-xs text-zinc-300">
                <li>
                  • <code className="font-mono font-bold text-sky-400">$2y$</code>: Định danh thuật toán Bcrypt an toàn trên PHP.
                </li>
                <li>
                  • <code className="font-mono font-bold text-amber-300">12$</code>: Cost Factor (<span className="font-mono">2^12 = 4,096</span> vòng lặp băm) làm chậm GPU dò mật khẩu.
                </li>
                <li>
                  • <code className="font-mono font-bold text-emerald-300">22 ký tự tiếp theo</code>: Salt ngẫu nhiên 128-bit riêng cho từng bản ghi.
                </li>
                <li>
                  • <code className="font-mono text-zinc-200">31 ký tự cuối</code>: Mã băm thực tế sau khi trộn mật khẩu + Salt.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Maintenance & Diagnostic Commands */}
      <section className="rounded-lg border border-hairline bg-surface p-5 sm:p-6">
        <div className="mb-4 border-b border-hairline pb-4">
          <h2 className="flex items-center gap-2 text-lg font-bold text-ink">
            <Wrench className="h-4 w-4 text-muted" aria-hidden="true" />
            4. Cẩm nang Lệnh Vận hành, Chẩn đoán &amp; Khôi phục Nhanh Lab DVWA
          </h2>
          <p className="mt-1 text-xs text-muted sm:text-sm">
            Các lệnh xử lý nhanh sự cố cổng mạng, theo dõi log realtime hoặc reset sạch container trước khi thực hành lại.
          </p>
        </div>

        <div className="space-y-4">
          {LAB_MAINTENANCE_COMMANDS.map((item) => (
            <CodeBlock
              key={item.id}
              label={item.title}
              shell="zsh / bash"
              code={item.command}
              explanation={item.explanation}
            />
          ))}
        </div>
      </section>

      {/* 5. Security Engineering R&D Scripts */}
      <section className="rounded-lg border border-hairline bg-surface p-5 sm:p-6">
        <div className="mb-4 border-b border-hairline pb-4">
          <h2 className="flex items-center gap-2 text-lg font-bold text-ink">
            <Terminal className="h-4 w-4 text-accent" aria-hidden="true" />
            5. Bộ Công cụ Kỹ sư Bảo mật Tự phát triển (Security Engineering R&amp;D)
          </h2>
          <p className="mt-1 text-xs text-muted sm:text-sm">
            4 tệp mã nguồn Python 3 stdlib và MySQL Stored Procedure chạy độc lập phục vụ phần nâng cao cho cả 4 thành viên.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {[
            {
              member: "Thành viên 1 — Sơn",
              file: "son_sec_gate.py",
              href: "/engineering/son_sec_gate.py",
              summary:
                "DevSecOps Security Gate kiểm tra 5 HTTP Headers + phương thức TRACE và 5 cờ Docker CIS Hardening, xuất báo cáo JSON và mã thoát Exit 0/1.",
              cmd: "python3 public/engineering/son_sec_gate.py --demo hardened --threshold 85",
            },
            {
              member: "Thành viên 2 — Hùng",
              file: "hung_blind_bisect.py",
              href: "/engineering/hung_blind_bisect.py",
              summary:
                "Khai thác Blind SQLi bằng Tìm kiếm Nhị phân O(log2 N) giảm ~85% số request và phát hiện bất thường Log qua Shannon Entropy H(X) + Z-Score.",
              cmd: 'python3 public/engineering/hung_blind_bisect.py --demo --query "database()"',
            },
            {
              member: "Thành viên 3 — Quyết",
              file: "quyet_zero_downtime_migration.sql",
              href: "/engineering/quyet_zero_downtime_migration.sql",
              summary:
                "Di trú Dual-Hash (MD5 -> Bcrypt) không gián đoạn qua Stored Procedure DEFINER, SQL View ẩn cột mật khẩu và Bẫy Canary tại user_id = 0.",
              cmd: "docker exec -i dvwa mysql -u root < public/engineering/quyet_zero_downtime_migration.sql",
            },
            {
              member: "Thành viên 4 — Khánh",
              file: "khanh_sql_lexer_waf.py",
              href: "/engineering/khanh_sql_lexer_waf.py",
              summary:
                "Bộ phân tích từ vựng SQL Lexical Tokenizer chuẩn libinjection vượt qua giới hạn Regex (chống /*!50000UNION*/ & 0% chặn nhầm O'Connor) + SafePDO.",
              cmd: "python3 public/engineering/khanh_sql_lexer_waf.py --benchmark",
            },
          ].map((tool) => (
            <div
              key={tool.file}
              className="flex flex-col justify-between rounded-lg border border-hairline bg-subtle p-4"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[11px] font-semibold text-accent">
                    {tool.member}
                  </span>
                  <a
                    href={tool.href}
                    download={tool.file}
                    className="inline-flex items-center gap-1 rounded border border-hairline bg-surface px-2.5 py-1 font-mono text-[11px] font-semibold text-ink hover:bg-canvas"
                  >
                    <Download className="h-3 w-3" aria-hidden="true" />
                    {tool.file}
                  </a>
                </div>
                <p className="text-xs leading-relaxed text-secondary">{tool.summary}</p>
              </div>
              <pre className="mt-3 overflow-x-auto rounded border border-zinc-800 bg-[#0d1117] px-3 py-2 font-mono text-[11px] text-emerald-300">
                $ {tool.cmd}
              </pre>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
