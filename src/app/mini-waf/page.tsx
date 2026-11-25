import Link from "next/link";
import { ArrowLeft, Download, Layers, ShieldCheck, Terminal } from "lucide-react";
import { MiniWafSimulator } from "@/components/simulators/MiniWafSimulator";

export default function MiniWafPage() {
  const artifacts = [
    { file: "mini-waf-project.zip", desc: "Toàn bộ dự án Python FastAPI + Docker Compose + Tests + Benchmark" },
    { file: "SPECIFICATION_V2.md", desc: "Đặc tả hợp nhất giải quyết 5 điểm phản biện kỹ thuật" },
    { file: "docker-compose.yml", desc: "Điều phối mạng frontend_net / backend_net internal=true + CIS flags" },
    { file: "rules.json", desc: "Bộ quy tắc Anomaly Scoring (SQLi, XSS, LFI, Scanner UA)" },
    { file: "dataset.json", desc: "100 mẫu chuẩn hóa (50 tấn công đa kỹ thuật + 50 hợp lệ biên)" },
    { file: "run_benchmark.py", desc: "Script đo TPR/FPR/Precision/Recall/F1 và p95 Latency Overhead" },
  ];

  const memberAssignments = [
    {
      member: "1. Sơn (Nhóm trưởng)",
      scope: "Kiến trúc Docker Cô lập & Lõi Reverse Proxy (:8080) + Active Defense",
      files: "docker-compose.yml, waf/Dockerfile, waf/main.py, waf/proxy/forward.py, waf/protection/*",
      highlights: "Dual-plane ASGI (:8080 Proxy / 127.0.0.1:8888 Admin), X-Forwarded-For anti-spoofing, Fixed vs Sliding Window (deque), Auto-Ban TTL 300s & Server Header Scrubbing.",
    },
    {
      member: "2. Hùng",
      scope: "Lõi Kiểm tra Sâu (Inspection Engine) & Kiểm thử Red Team Anti-Evasion",
      files: "waf/inspection/parser.py, normalizer.py, sql_lexer.py, engine.py, waf/rules.json",
      highlights: "Giải mã URL 3 tầng + HTML entity + NFKC + xử lý bình luận /*!...*/ & UN/**/ION, bảo toàn HPP (?id=1&id=...), SQL Lexical Tokenizer cho O'Brien/D'Angelo.",
    },
    {
      member: "3. Quyết",
      scope: "CSDL SQLite WAL, Admin Dashboard (:8888) & Cảnh báo Telegram Bảo mật",
      files: "waf/database/*, waf/monitoring/logger.py, dashboard.py, telegram_alert.py, dashboard.html",
      highlights: "PRAGMA journal_mode=WAL, che giấu Cookie/Authorization/password (***MASKED***), Dashboard tách cổng xác thực Admin & nút Unban, Telegram bất đồng bộ không lộ PII.",
    },
    {
      member: "4. Khánh",
      scope: "Ứng dụng Mục tiêu (Website Quản lý Điểm) & Đo kiểm Khoa học (Benchmark)",
      files: "target_web/app.py, benchmark/dataset.json, benchmark/run_benchmark.py, tests/*",
      highlights: "Target Web hỗ trợ toggle vulnerable vs secure (Prepared Statements + Path Guard), đo TP/FP/TN/FN, Precision/Recall/F1 và Latency Overhead OFF vs BLOCKING.",
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-hairline pb-4">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted transition-colors hover:text-ink sm:text-sm"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Quay lại Tổng quan BTL
        </Link>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/mo-phong"
            className="inline-flex items-center gap-1.5 rounded-md border border-hairline bg-subtle px-3 py-1.5 text-xs font-semibold text-ink hover:bg-canvas"
          >
            <Terminal className="h-3.5 w-3.5" aria-hidden="true" />
            Phòng Lab DVWA 4 Thành viên
          </Link>
          <a
            href="/mini-waf/mini-waf-project.zip"
            download="mini-waf-project.zip"
            className="inline-flex items-center gap-1.5 rounded-md bg-ink px-3.5 py-1.5 text-xs font-semibold text-canvas hover:opacity-90"
          >
            <Download className="h-3.5 w-3.5" aria-hidden="true" />
            Tải mini-waf-project.zip
          </a>
        </div>
      </div>

      <section className="space-y-3">
        <div className="font-mono text-xs font-semibold uppercase tracking-wider text-accent">
          Nâng cấp Hệ thống Phòng thủ Chủ động (Blue Team Engineering)
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">
          Mini-WAF Reverse Proxy, Giám sát Thời gian thực &amp; Đo kiểm Hiệu năng
        </h1>
        <p className="max-w-3xl text-sm leading-relaxed text-secondary">
          Hợp nhất đặc tả kỹ thuật bảo vệ đồng thời Website Quản lý Điểm Sinh viên tự xây dựng (cổng 8000) và DVWA (cổng 80) trong mạng nội bộ Docker <code className="font-mono text-ink">internal: true</code>, đặt toàn bộ lưu lượng qua cổng kiểm soát Mini-WAF <code className="font-mono text-ink">:8080</code> và cổng quản trị riêng biệt <code className="font-mono text-ink">127.0.0.1:8888</code>.
        </p>
      </section>

      <MiniWafSimulator />

      {/* 4 Member Assignments */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Layers className="h-5 w-5 text-accent" aria-hidden="true" />
          <h2 className="text-lg font-bold tracking-tight text-ink">
            Phân công Mô-đun Mã nguồn Mini-WAF (25% / Thành viên)
          </h2>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {memberAssignments.map((item) => (
            <div key={item.member} className="rounded-lg border border-hairline bg-surface p-4 text-xs space-y-2">
              <div className="font-bold text-ink text-sm">{item.member}</div>
              <div className="font-semibold text-accent">{item.scope}</div>
              <div className="rounded border border-hairline bg-subtle px-2.5 py-1.5 font-mono text-[11px] text-ink">
                {item.files}
              </div>
              <p className="leading-relaxed text-secondary">{item.highlights}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Downloadable Source Artifacts */}
      <section className="rounded-lg border border-hairline bg-surface p-5 space-y-4">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-bold text-ink">
            <ShieldCheck className="h-4 w-4 text-emerald-600" aria-hidden="true" />
            Tệp Mã nguồn &amp; Tài liệu Kiểm định Mini-WAF (Sẵn sàng Clone &amp; Run)
          </h2>
          <p className="mt-1 text-xs text-muted">
            Tải xuống từng tệp cấu hình, đặc tả hợp nhất V2, tập 100 mẫu benchmark hoặc gói dự án đầy đủ để chạy trực tiếp với <code className="font-mono text-ink">pytest</code> và <code className="font-mono text-ink">docker compose up --build</code>.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {artifacts.map((a) => (
            <a
              key={a.file}
              href={`/mini-waf/${a.file}`}
              download={a.file}
              className="flex flex-col justify-between rounded-md border border-hairline bg-subtle p-3.5 text-xs transition-colors hover:bg-canvas"
            >
              <div className="flex items-center justify-between gap-2 font-mono font-bold text-ink">
                <span>{a.file}</span>
                <Download className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
              </div>
              <p className="mt-1.5 leading-relaxed text-muted">{a.desc}</p>
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}
