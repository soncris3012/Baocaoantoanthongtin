import Link from "next/link";
import { ArrowLeft, Download, Globe, Layers, ShieldCheck, Terminal } from "lucide-react";
import { MiniWafSimulator } from "@/components/simulators/MiniWafSimulator";

export default function MiniWafPage() {
  const artifacts = [
    { file: "mini-waf-project.zip", desc: "Dự án Python FastAPI + Target Web + Docker Compose + Tests" },
    { file: "SPECIFICATION_V2.md", desc: "Đặc tả V2 & Ma trận phân công" },
    { file: "docker-compose.yml", desc: "Mạng frontend_net / backend_net (internal)" },
    { file: "rules.json", desc: "Bộ quy tắc SQLi, XSS, LFI, Scanner" },
    { file: "dataset.json", desc: "100 mẫu Ground Truth (50 tấn công + 50 hợp lệ)" },
    { file: "run_benchmark.py", desc: "Script đo Precision/Recall/F1/Latency p95" },
  ];

  const memberAssignments = [
    {
      member: "1. Sơn — Web & Reverse Proxy",
      files: "target_web/, main.py, proxy/server.py, proxy/forward.py, docker-compose.yml",
    },
    {
      member: "2. Hùng — Inspection Engine",
      files: "inspection/parser.py, normalizer.py, sqli.py, xss.py, traversal.py, engine.py",
    },
    {
      member: "3. Quyết — Phòng thủ & Giám sát",
      files: "protection/ (rate_limit.py, blacklist.py, decision.py), database/, monitoring/",
    },
    {
      member: "4. Khánh — Kiểm thử & Benchmark",
      files: "tests/ (test_sqli.py, test_xss.py, test_proxy.py, benchmark.py), dataset.json",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-hairline pb-4">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted transition-colors hover:text-ink sm:text-sm"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Tổng quan
        </Link>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/mini-waf?tab=portal"
            className="inline-flex items-center gap-1.5 rounded-md border border-accent bg-accent/10 px-3 py-1.5 text-xs font-semibold text-accent hover:bg-accent/20"
          >
            <Globe className="h-3.5 w-3.5" aria-hidden="true" />
            Cổng Sinh viên
          </Link>
          <Link
            href="/mo-phong"
            className="inline-flex items-center gap-1.5 rounded-md border border-hairline bg-subtle px-3 py-1.5 text-xs font-semibold text-ink hover:bg-canvas"
          >
            <Terminal className="h-3.5 w-3.5" aria-hidden="true" />
            DVWA Lab
          </Link>
          <a
            href="/mini-waf/mini-waf-project.zip"
            download="mini-waf-project.zip"
            className="inline-flex items-center gap-1.5 rounded-md bg-ink px-3.5 py-1.5 text-xs font-semibold text-canvas hover:opacity-90"
          >
            <Download className="h-3.5 w-3.5" aria-hidden="true" />
            Tải .zip
          </a>
        </div>
      </div>

      <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">
        Mini-WAF Reverse Proxy
      </h1>

      <MiniWafSimulator />

      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-base font-bold tracking-tight text-ink">
          <Layers className="h-4 w-4 text-accent" aria-hidden="true" />
          Phân công Mô-đun Mã nguồn
        </h2>

        <div className="grid gap-3 md:grid-cols-2">
          {memberAssignments.map((item) => (
            <div key={item.member} className="rounded-lg border border-hairline bg-surface p-3.5 text-xs space-y-1.5">
              <div className="font-bold text-ink">{item.member}</div>
              <div className="rounded border border-hairline bg-subtle px-2.5 py-1.5 font-mono text-[11px] text-secondary">
                {item.files}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-hairline bg-surface p-4 space-y-3">
        <h2 className="flex items-center gap-2 text-base font-bold text-ink">
          <ShieldCheck className="h-4 w-4 text-emerald-600" aria-hidden="true" />
          Tệp Mã nguồn &amp; Tài liệu
        </h2>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {artifacts.map((a) => (
            <a
              key={a.file}
              href={`/mini-waf/${a.file}`}
              download={a.file}
              className="flex flex-col justify-between rounded-md border border-hairline bg-subtle p-3 text-xs transition-colors hover:bg-canvas"
            >
              <div className="flex items-center justify-between gap-2 font-mono font-bold text-ink">
                <span>{a.file}</span>
                <Download className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
              </div>
              <p className="mt-1 text-muted">{a.desc}</p>
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}
