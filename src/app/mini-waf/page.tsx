import Link from "next/link";
import { ArrowLeft, Download, Layers, ShieldCheck, Terminal } from "lucide-react";
import { MiniWafSimulator } from "@/components/simulators/MiniWafSimulator";

export default function MiniWafPage() {
  const artifacts = [
    { file: "mini-waf-project.zip", desc: "Toàn bộ dự án Python FastAPI + Target Web + Docker Compose + Tests" },
    { file: "SPECIFICATION_V2.md", desc: "Đặc tả hợp nhất V2 & Ma trận phân công 4 thành viên" },
    { file: "docker-compose.yml", desc: "Sơn: Điều phối frontend_net / backend_net internal=true + CIS" },
    { file: "rules.json", desc: "Hùng: Bộ quy tắc Anomaly Scoring (SQLi, XSS, LFI, Scanner UA)" },
    { file: "dataset.json", desc: "Khánh: 100 mẫu chuẩn hóa Ground Truth (50 tấn công + 50 hợp lệ)" },
    { file: "run_benchmark.py", desc: "Khánh: Wrapper chạy tests/benchmark.py đo TPR/FPR/Precision/Recall/F1/p95" },
  ];

  const memberAssignments = [
    {
      member: "1. Sơn (Nhóm trưởng) — Web Demo 2 chế độ & Reverse Proxy",
      scope: "Sở hữu ứng dụng Web (:8000), cửa ngõ Reverse Proxy (:8080) & hạ tầng Docker",
      files: "target_web/, main.py, proxy/server.py, proxy/forward.py, docker-compose.yml",
      highlights:
        "Thiết kế Website Quản lý Sinh viên với 2 chế độ VULNERABLE / HARDENED (Prepared Statements, Output Escaping, Path Sandbox), lập trình Reverse Proxy bất đồng bộ (FastAPI + HTTPX), cô lập backend_net internal=true không mở cổng 8000 ra Host.",
    },
    {
      member: "2. Hùng — Bộ não Phân tích Nội dung (Inspection Engine)",
      scope: "Sở hữu toàn bộ lõi giải mã, chuẩn hóa chống bypass & phát hiện tấn công",
      files: "inspection/parser.py, normalizer.py, sqli.py, xss.py, traversal.py, engine.py",
      highlights:
        "Chuẩn hóa URL decode 3 lớp, HTML entity, NFKC, tách bình luận SQL (/*!50000...*/, UN/**/ION), bảo toàn HPP & JSON lồng nhau, nhận diện SQLi/XSS/Path Traversal bằng Regex tuyến tính + SQL Lexical Tokenizer với 0% chặn nhầm tên O'Brien.",
    },
    {
      member: "3. Quyết — Phòng thủ Hành vi & Trung tâm Giám sát",
      scope: "Sở hữu tầng bảo vệ lưu lượng, quyết định hành vi, SQLite WAL, Dashboard & Telegram",
      files: "protection/ (rate_limit.py, blacklist.py, decision.py), database/, monitoring/",
      highlights:
        "Thuật toán Fixed vs Sliding Window Rate Limit (deque), Auto-Ban TTL 300s, chống giả mạo X-Forwarded-For, che dữ liệu nhạy cảm (***MASKED***) trong log SQLite, Dashboard tách cổng :8888 kèm nút Unban & Telegram bất đồng bộ.",
    },
    {
      member: "4. Khánh — Kiểm thử Xâm nhập & Đo kiểm Khoa học",
      scope: "Sở hữu toàn bộ bộ test tự động, dữ liệu Ground Truth & kiểm chứng đối chứng",
      files: "tests/ (test_sqli.py, test_xss.py, test_proxy.py, benchmark.py), dataset.json",
      highlights:
        "Thực nghiệm đối chứng Nmap/Burp/SQLMap (Không WAF OFF vs Có WAF BLOCKING vs HARDENED), chạy 13/13 Pytest và benchmark 100 mẫu đo Precision 100%, Recall 100%, FPR 0%, F1 100%, Mean/Median/p95 Latency.",
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
