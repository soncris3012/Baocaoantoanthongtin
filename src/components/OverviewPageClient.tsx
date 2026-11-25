"use client";

import { Fragment, useState } from "react";
import Link from "next/link";
import { ArrowRight, ChevronDown, ChevronUp, Download, Globe, Layers, Play, ShieldCheck, Terminal, Wrench } from "lucide-react";
import { useWorkspace } from "@/components/WorkspaceProvider";
import {
  ATTACK_FLOW_STAGES,
  CODE_COMPARISON_4_LEVELS,
  DEFENSE_IN_DEPTH_LAYERS,
  ENGINEERING_MINDSET_MATRIX,
  INFRA_CHALLENGES,
  OWASP_BY_CWE,
  PROJECT_OVERVIEW,
  VULNERABILITIES,
  parseCvssVector,
} from "@/data/scenarioData";

export function OverviewPageClient() {
  const { snapshot } = useWorkspace();
  const [expandedCweId, setExpandedCweId] = useState<string | null>("vuln-cwe-89");

  const memberNameMap: Record<number, string> = {};
  for (const m of snapshot.members) {
    memberNameMap[m.member_number] = m.display_name;
  }

  const existingVulnIds = new Set(snapshot.vulnerabilities.map((v) => v.id));
  const mergedVulns = [
    ...snapshot.vulnerabilities,
    ...VULNERABILITIES.filter((v) => !existingVulnIds.has(v.id)),
  ].sort((a, b) => b.cvss_score - a.cvss_score);

  const totalSteps = snapshot.steps.length;
  const totalCompleted = snapshot.members.reduce((sum, m) => {
    const done = snapshot.workspaceStates[m.member_number]?.completed_step_ids?.length ?? 0;
    return sum + done;
  }, 0);

  return (
    <div className="space-y-12">
      {/* 1. EDITORIAL HEADER: FORM CHUNG Y TUONG BAI TAP LON */}
      <section className="border-b border-hairline pb-8">
        <div className="font-mono text-xs font-medium uppercase tracking-wider text-muted">
          {PROJECT_OVERVIEW.courseTitle} · OWASP A03:2021 (Injection)
        </div>

        <h1 className="mt-3 max-w-4xl text-2xl font-bold tracking-tight text-ink sm:text-4xl">
          {PROJECT_OVERVIEW.projectTitle}
        </h1>

        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-secondary sm:text-base">
          {PROJECT_OVERVIEW.subtitle}
        </p>

        {/* Clean Hairline Metadata Strip */}
        <div className="mt-7 grid divide-y divide-hairline rounded-lg border border-hairline bg-surface sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          <div className="p-4">
            <div className="font-mono text-[11px] uppercase tracking-wider text-muted">
              Phương pháp Kiểm thử
            </div>
            <div className="mt-1 text-sm font-semibold text-ink">
              PTES (Black-Box + White-Box)
            </div>
            <p className="mt-0.5 text-xs text-muted">
              Kết hợp quét/đánh chặn ngoài biên và kiểm toán mã nguồn PHP, CSDL MariaDB bên trong.
            </p>
          </div>

          <div className="p-4">
            <div className="font-mono text-[11px] uppercase tracking-wider text-muted">
              Hệ thống Mục tiêu
            </div>
            <div className="mt-1 text-sm font-semibold text-ink">
              Docker DVWA (Cổng 8080)
            </div>
            <p className="mt-0.5 text-xs text-muted">
              Apache/2.4.25 (Debian) + PHP + MariaDB triển khai cô lập qua container.
            </p>
          </div>

          <div className="p-4">
            <div className="font-mono text-[11px] uppercase tracking-wider text-muted">
              Tiến độ Thực hành Nhóm
            </div>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-sm font-semibold text-ink">
                {totalCompleted} / {totalSteps} bước hoàn tất
              </span>
              <span className="font-mono text-xs text-muted">
                {totalSteps ? Math.round((totalCompleted / totalSteps) * 100) : 0}%
              </span>
            </div>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-subtle">
              <div
                className="h-full bg-accent transition-all"
                style={{
                  width: `${totalSteps ? Math.round((totalCompleted / totalSteps) * 100) : 0}%`,
                }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* 2. PHAN CHIA KICH BAN 4 THANH VIEN */}
      <section>
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-ink">
              Phân chia Kịch bản Thực hành 4 Thành viên
            </h2>
            <p className="mt-1 text-sm text-muted">
              Chọn đúng phần của từng thành viên để xem thao tác từng bước, lấy lệnh động và chạy trình mô phỏng.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/mo-phong"
              className="inline-flex items-center gap-1.5 rounded-md bg-ink px-3.5 py-2 text-xs font-semibold text-canvas transition-opacity hover:opacity-90"
            >
              <Terminal className="h-3.5 w-3.5" aria-hidden="true" />
              Mở Phòng Lab Mô phỏng
            </Link>
            <Link
              href="/lab-setup"
              className="inline-flex items-center gap-2 rounded-md border border-hairline bg-surface px-3.5 py-2 text-xs font-semibold text-ink transition-colors hover:bg-subtle"
            >
              <Wrench className="h-3.5 w-3.5 text-muted" aria-hidden="true" />
              Setup Lab &amp; .sh
            </Link>
          </div>
        </div>

        {/* Live Simulator Callout */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-lg border border-hairline bg-surface p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-subtle text-accent border border-hairline">
              <Play className="h-4 w-4" aria-hidden="true" />
            </div>
            <div>
              <div className="text-sm font-bold text-ink">
                Phòng Lab Mô phỏng Trực tuyến (Interactive Web Simulator)
              </div>
              <p className="mt-0.5 text-xs text-muted max-w-2xl">
                Không cần cài máy ảo, bạn có thể chạy thử trực tiếp chuỗi lệnh Docker/Nmap của <strong>Sơn</strong>, bắt gói tin Burp của <strong>Hùng</strong>, chạy SQLMap của <strong>Quyết</strong> và kiểm thử WAF của <strong>Khánh</strong>.
              </p>
            </div>
          </div>
          <Link
            href="/mo-phong"
            className="inline-flex items-center gap-2 rounded-md border border-hairline bg-subtle px-3.5 py-2 text-xs font-semibold text-ink transition-colors hover:bg-canvas"
          >
            Trải nghiệm Console ↗
          </Link>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          {snapshot.members.map((member) => {
            const memberSteps = snapshot.steps.filter(
              (s) => s.member_number === member.member_number
            );
            const doneIds =
              snapshot.workspaceStates[member.member_number]?.completed_step_ids ?? [];
            const doneCount = memberSteps.filter((s) => doneIds.includes(s.id)).length;
            const pct = memberSteps.length
              ? Math.round((doneCount / memberSteps.length) * 100)
              : 0;

            return (
              <div
                key={member.member_number}
                className="flex flex-col justify-between rounded-lg border border-hairline bg-surface p-5 transition-colors hover:border-slate-400 dark:hover:border-zinc-600"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 border-b border-hairline pb-3">
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono text-xs font-bold text-accent">
                        0{member.member_number}
                      </span>
                      <span className="text-xs font-medium text-muted">
                        {member.device}
                      </span>
                    </div>
                    <span className="font-mono text-xs text-muted">
                      {member.stage_label}
                    </span>
                  </div>

                  <h3 className="mt-3.5 text-lg font-bold text-ink">
                    {member.display_name}
                  </h3>
                  <p className="mt-0.5 text-sm font-medium text-secondary">
                    {member.role_title}
                  </p>
                  <p className="mt-2.5 text-xs leading-relaxed text-muted sm:text-sm">
                    {member.overview_summary}
                  </p>

                  <dl className="mt-4 space-y-2 border-l-2 border-hairline pl-3 text-xs">
                    <div>
                      <dt className="font-semibold text-ink">Thực hành chính</dt>
                      <dd className="text-secondary">{member.main_practice}</dd>
                    </div>
                    <div>
                      <dt className="font-semibold text-ink">Gia cố &amp; Mở rộng</dt>
                      <dd className="text-secondary">{member.defense_scope}</dd>
                    </div>
                  </dl>

                  <div className="mt-4 font-mono text-[11px] text-muted">
                    Công cụ: {member.tools.join(" · ")}
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-between gap-3 border-t border-hairline pt-4">
                  <div className="text-xs text-muted">
                    Hoàn thành:{" "}
                    <span className="font-mono font-semibold text-ink">
                      {doneCount}/{memberSteps.length}
                    </span>{" "}
                    ({pct}%)
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      href={`/mo-phong?member=${member.member_number}`}
                      className="inline-flex items-center gap-1.5 rounded-md border border-hairline bg-subtle px-3 py-1.5 text-xs font-semibold text-ink transition-colors hover:bg-canvas"
                    >
                      <Play className="h-3 w-3" aria-hidden="true" />
                      Mô phỏng
                    </Link>
                    <Link
                      href={`/thanh-vien/${member.member_number}`}
                      className="inline-flex items-center gap-1.5 rounded-md bg-ink px-3 py-1.5 text-xs font-semibold text-canvas transition-opacity hover:opacity-90"
                    >
                      <span>Vào kịch bản</span>
                      <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. SO DO LUONG 4 GIAI DOAN */}
      <section>
        <div className="mb-4">
          <h2 className="text-xl font-bold tracking-tight text-ink">
            Luồng Thực nghiệm 4 Giai đoạn (Attack-to-Defense Pipeline)
          </h2>
          <p className="mt-1 text-sm text-muted">
            Kết quả thu thập ở giai đoạn trước là đầu vào trực tiếp cho thành viên ở giai đoạn tiếp theo.
          </p>
        </div>

        <div className="divide-y divide-hairline rounded-lg border border-hairline bg-surface">
          {ATTACK_FLOW_STAGES.map((stage) => (
            <div
              key={stage.stage}
              className="grid gap-4 p-4 sm:p-5 lg:grid-cols-12 lg:items-start"
            >
              <div className="lg:col-span-4">
                <div className="font-mono text-[11px] font-semibold uppercase tracking-wider text-accent">
                  {stage.badge}
                </div>
                <h3 className="mt-1 text-sm font-bold text-ink sm:text-base">
                  {stage.title}
                </h3>
                <div className="mt-1.5 font-mono text-xs text-muted">
                  {stage.tools}
                </div>
              </div>

              <div className="space-y-1.5 text-xs leading-relaxed text-secondary sm:text-sm lg:col-span-6">
                <p>
                  <strong className="text-ink">Thao tác:</strong> {stage.action}
                </p>
                <p>
                  <strong className="text-ink">Đầu ra:</strong> {stage.output}
                </p>
                <p className="text-xs text-muted">→ {stage.handoff}</p>
              </div>

              <div className="flex lg:col-span-2 lg:justify-end">
                <Link
                  href={`/thanh-vien/${stage.owner_member}`}
                  className="inline-flex items-center gap-1 rounded-md border border-hairline bg-subtle px-3 py-1.5 text-xs font-semibold text-ink transition-colors hover:bg-canvas"
                >
                  <span>{memberNameMap[stage.owner_member] ?? `Thành viên ${stage.owner_member}`}</span>
                  <ArrowRight className="h-3 w-3" aria-hidden="true" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3B. BUOC CHUYEN TU DUY KY SU (ENGINEERING UPGRADE MATRIX) */}
      <section>
        <div className="mb-4">
          <h2 className="text-lg font-bold tracking-tight text-ink sm:text-xl">
            Bước chuyển Tư duy: Từ Người dùng Công cụ sang Kỹ sư Bảo mật (Security Engineering R&amp;D)
          </h2>
          <p className="text-xs text-muted sm:text-sm">
            Giải quyết triệt để hạn chế chạy lại công cụ có sẵn theo kịch bản dập khuôn: cả 4 thành viên đều tự thiết kế thuật toán, kiến trúc CSDL hoặc bộ phân tích từ vựng RASP chạy độc lập.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {ENGINEERING_MINDSET_MATRIX.map((row) => (
            <div
              key={row.memberNumber}
              className="flex flex-col justify-between rounded-lg border border-hairline bg-surface p-4 sm:p-5"
            >
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-hairline pb-2.5">
                  <div>
                    <div className="font-mono text-[11px] font-semibold uppercase tracking-wider text-accent">
                      Thành viên 0{row.memberNumber} · {row.roleTitle}
                    </div>
                    <div className="text-base font-bold text-ink">
                      {memberNameMap[row.memberNumber] ?? row.memberName}
                    </div>
                  </div>
                  <span className="rounded border border-emerald-600/40 bg-emerald-500/10 px-2 py-0.5 font-mono text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
                    {row.customArtifact}
                  </span>
                </div>

                <div className="space-y-2 text-xs leading-relaxed">
                  <div className="rounded-md border border-hairline bg-subtle p-2.5 text-muted">
                    <strong className="text-secondary">Mức cơ bản (Tool User):</strong>{" "}
                    {row.toolUserBaseline}
                  </div>
                  <div className="rounded-md border border-emerald-600/30 bg-emerald-500/5 p-2.5 text-secondary">
                    <strong className="text-emerald-700 dark:text-emerald-300">
                      Nâng cấp Kỹ sư (Sáng tạo R&amp;D):
                    </strong>{" "}
                    {row.engineerUpgrade}
                  </div>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-hairline pt-3 text-xs">
                <span className="font-mono text-[11px] font-medium text-muted">
                  {row.verifiedMetric}
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  <a
                    href={row.artifactHref}
                    download={row.customArtifact}
                    className="inline-flex items-center gap-1 rounded border border-hairline bg-subtle px-2.5 py-1 font-mono text-[11px] font-semibold text-ink hover:bg-canvas"
                  >
                    <Download className="h-3 w-3" aria-hidden="true" />
                    Tải Script
                  </a>
                  <Link
                    href={row.workbenchHref}
                    className="inline-flex items-center gap-1 rounded bg-accent px-2.5 py-1 font-semibold text-white hover:opacity-90"
                  >
                    <Play className="h-3 w-3" aria-hidden="true" />
                    Mở Workbench
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3C. KIEN TRUC MINI-WAF V2 & KET QUA DO KIEM THUC NGHIEM */}
      <section className="rounded-lg border border-hairline bg-surface p-5 sm:p-6 space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-hairline pb-4">
          <div className="space-y-1">
            <div className="font-mono text-[11px] font-semibold uppercase tracking-wider text-accent">
              Blue Team Engineering · Hợp nhất Đặc tả 9 trang &amp; Đề cương 11 trang
            </div>
            <h2 className="text-lg font-bold tracking-tight text-ink sm:text-xl">
              Hệ thống Mini-WAF Chủ động (FastAPI Reverse Proxy + Inspection + Benchmark)
            </h2>
            <p className="max-w-3xl text-xs leading-relaxed text-muted sm:text-sm">
              Kế thừa giai đoạn kiểm toán DVWA ban đầu để đóng gói sản phẩm phần mềm phòng thủ tầng biên hoàn chỉnh bằng Python (FastAPI + HTTPX + SQLite WAL + Docker Compose): cách ly kép <code className="font-mono text-ink">frontend_net</code> / <code className="font-mono text-ink">backend_net (internal=true)</code> cho cả Portal Quản lý Điểm (:8000) và DVWA (:80).
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/mini-waf"
              className="inline-flex items-center gap-1.5 rounded-md bg-accent px-3.5 py-2 text-xs font-semibold text-white hover:opacity-90"
            >
              <Play className="h-3.5 w-3.5" aria-hidden="true" />
              Kịch bản 12 Bước + Web Live
            </Link>
            <Link
              href="/mini-waf?tab=portal"
              className="inline-flex items-center gap-1.5 rounded-md border border-accent bg-accent/10 px-3 py-2 text-xs font-semibold text-accent hover:bg-accent/20"
            >
              <Globe className="h-3.5 w-3.5" aria-hidden="true" />
              Web Quản lý Điểm Trực tiếp
            </Link>
            <a
              href="/mini-waf/mini-waf-project.zip"
              download="mini-waf-project.zip"
              className="inline-flex items-center gap-1.5 rounded-md border border-hairline bg-subtle px-3 py-2 font-mono text-xs font-semibold text-ink hover:bg-canvas"
            >
              <Download className="h-3.5 w-3.5" aria-hidden="true" />
              Tải Full Code (.zip)
            </a>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-xs">
          <div className="rounded-md border border-emerald-600/40 bg-emerald-500/5 p-3.5">
            <div className="font-mono text-[11px] text-muted">Đo kiểm 100 Mẫu (50 Attack / 50 Benign)</div>
            <div className="mt-1 font-mono text-lg font-bold text-emerald-700 dark:text-emerald-300">
              TPR 100% · FPR 0%
            </div>
            <p className="mt-1 text-muted">TP=50, FP=0, TN=50, FN=0 · Cho qua an toàn họ tên O&apos;Brien, D&apos;Angelo &amp; phép so sánh 5 &lt; 10.</p>
          </div>

          <div className="rounded-md border border-hairline bg-subtle p-3.5">
            <div className="font-mono text-[11px] text-muted">Độ trễ Phụ trội (OFF vs BLOCKING)</div>
            <div className="mt-1 font-mono text-lg font-bold text-ink">
              +0.709 ms TB (p95: 2.16ms)
            </div>
            <p className="mt-1 text-muted">0.928 ms (không WAF) lên 1.637 ms (có WAF) · Kiểm chứng trên 300 request lặp 3 lượt.</p>
          </div>

          <div className="rounded-md border border-hairline bg-subtle p-3.5">
            <div className="font-mono text-[11px] text-muted">Cô lập &amp; Tách cổng Quản trị</div>
            <div className="mt-1 font-mono text-lg font-bold text-ink">
              :8080 Proxy · :8888 Admin
            </div>
            <p className="mt-1 text-muted">Port :8080 trả 404 mọi API quản trị; 0 payload độc hại lọt xuống target_web VULNERABLE/HARDENED (150/300 hits).</p>
          </div>

          <div className="rounded-md border border-hairline bg-subtle p-3.5">
            <div className="font-mono text-[11px] text-muted">Kiểm thử Đơn vị &amp; Phòng thủ Chủ động</div>
            <div className="mt-1 font-mono text-lg font-bold text-accent">
              13/13 Pytest Passed
            </div>
            <p className="mt-1 text-muted">test_sqli, test_xss, test_proxy, test_defense + Auto-Ban TTL 300s &amp; Log Masking.</p>
          </div>
        </div>
      </section>

      {/* 4. CONG CU & XU LY HA TANG */}
      <section className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <h2 className="mb-3 text-lg font-bold text-ink">
            Hệ sinh thái 4 Công cụ Thực nghiệm
          </h2>
          <div className="overflow-x-auto rounded-lg border border-hairline bg-surface">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-hairline bg-subtle text-muted">
                  <th className="px-4 py-2.5 font-semibold">Công cụ</th>
                  <th className="px-4 py-2.5 font-semibold">Vai trò</th>
                  <th className="px-4 py-2.5 font-semibold">Cấu hình</th>
                  <th className="px-4 py-2.5 font-semibold">Kết quả</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline">
                {PROJECT_OVERVIEW.toolkit.map((t) => (
                  <tr key={t.name}>
                    <td className="px-4 py-3 font-semibold text-ink">{t.name}</td>
                    <td className="px-4 py-3 text-secondary">{t.role}</td>
                    <td className="px-4 py-3 font-mono text-xs text-muted">{t.config}</td>
                    <td className="px-4 py-3 text-xs text-secondary">{t.outcome}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <h2 className="mb-3 text-lg font-bold text-ink">
            2 Bài toán Hạ tầng Đã xử lý
          </h2>
          <div className="space-y-4">
            {INFRA_CHALLENGES.map((item) => (
              <div
                key={item.id}
                className="rounded-lg border border-hairline bg-surface p-4 text-xs leading-relaxed"
              >
                <div className="font-bold text-ink">{item.title}</div>
                <p className="mt-1.5 text-muted">
                  <strong className="text-secondary">Vấn đề:</strong> {item.problem}
                </p>
                <p className="mt-1.5 border-l-2 border-emerald-600 pl-2.5 text-secondary">
                  <strong className="text-ink">Giải pháp:</strong> {item.solution}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. BANG CWE / CVSS & DOI CHIEU 4 CAP DO MA NGUON */}
      <section className="space-y-8">
        <div id="cwe-matrix" className="scroll-mt-24">
          <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 className="text-lg font-bold text-ink">
                Bảng Định lượng Rủi ro Chuẩn Quốc tế (CWE, OWASP Top 10 &amp; CVSS v3.1)
              </h2>
              <p className="text-xs text-muted">
                Bấm vào từng dòng để phân rã chi tiết 8 chỉ số Vector CVSS v3.1 (AV, AC, PR, UI, S, C, I, A).
              </p>
            </div>
            <span className="font-mono text-xs text-muted">
              Tổng cộng: {mergedVulns.length} lỗ hổng
            </span>
          </div>

          <div className="overflow-x-auto rounded-lg border border-hairline bg-surface">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-hairline bg-subtle text-muted">
                  <th className="px-4 py-2.5 font-semibold">Mã CWE &amp; OWASP</th>
                  <th className="px-4 py-2.5 font-semibold">Lỗ hổng / Điểm yếu</th>
                  <th className="px-4 py-2.5 font-semibold">CVSS v3.1</th>
                  <th className="px-4 py-2.5 font-semibold">Mức độ</th>
                  <th className="px-4 py-2.5 font-semibold">Hướng khắc phục</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline">
                {mergedVulns.map((v) => {
                  const isExpanded = expandedCweId === v.id;
                  const metrics = isExpanded ? parseCvssVector(v.cvss_vector) : [];
                  const ownerName = memberNameMap[v.owner_member] ?? `Thành viên ${v.owner_member}`;
                  const owaspTag = OWASP_BY_CWE[v.cwe_id] ?? "OWASP Top 10:2021";

                  return (
                    <Fragment key={v.id}>
                      <tr
                        onClick={() => setExpandedCweId(isExpanded ? null : v.id)}
                        className={`cursor-pointer transition-colors hover:bg-subtle/60 ${
                          isExpanded ? "bg-subtle/50" : ""
                        }`}
                      >
                        <td className="px-4 py-3 align-top">
                          <div className="flex items-center gap-1.5 font-mono font-bold text-ink">
                            <span>{v.cwe_id}</span>
                            {isExpanded ? (
                              <ChevronUp className="h-3.5 w-3.5 text-muted" aria-hidden="true" />
                            ) : (
                              <ChevronDown className="h-3.5 w-3.5 text-muted" aria-hidden="true" />
                            )}
                          </div>
                          <div className="mt-1 font-mono text-[10px] text-accent">
                            {owaspTag}
                          </div>
                        </td>
                        <td className="px-4 py-3 align-top">
                          <div className="font-medium text-ink">{v.title}</div>
                          <div className="mt-1 flex flex-wrap items-center gap-2 font-mono text-[11px] text-muted">
                            <span>{v.poc_ref}</span>
                            <span>·</span>
                            <span className="text-ink">Phụ trách: {ownerName}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 align-top font-mono text-xs text-muted">
                          <div className="font-bold text-ink">{v.cvss_score}</div>
                          <div className="text-[11px]">{v.cvss_vector}</div>
                        </td>
                        <td className="px-4 py-3 align-top">
                          <span
                            className={`inline-block rounded px-2 py-0.5 font-mono text-xs font-semibold ${
                              v.severity === "High" || v.severity === "Critical"
                                ? "bg-rose-500/15 text-rose-700 dark:text-rose-300"
                                : "bg-amber-500/15 text-amber-800 dark:text-amber-300"
                            }`}
                          >
                            {v.severity}
                          </span>
                        </td>
                        <td className="px-4 py-3 align-top text-xs leading-relaxed text-secondary">
                          {v.remediation}
                        </td>
                      </tr>

                      {isExpanded && (
                        <tr className="bg-canvas/70">
                          <td colSpan={5} className="px-4 py-3.5">
                            <div className="mb-2 font-mono text-[11px] font-semibold uppercase tracking-wider text-muted">
                              Giải nghĩa Chi tiết Vector {v.cvss_vector}
                            </div>
                            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                              {metrics.map((m) => (
                                <div
                                  key={m.code}
                                  className="rounded border border-hairline bg-surface p-2.5 text-xs"
                                >
                                  <div className="flex items-center justify-between font-mono text-[11px]">
                                    <span className="font-bold text-ink">{m.code}</span>
                                    <span
                                      className={`rounded px-1.5 py-0.5 font-bold ${
                                        m.impactLevel === "bad"
                                          ? "bg-rose-500/15 text-rose-700 dark:text-rose-300"
                                          : m.impactLevel === "warn"
                                          ? "bg-amber-500/15 text-amber-800 dark:text-amber-300"
                                          : m.impactLevel === "good"
                                          ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                                          : "bg-subtle text-muted"
                                      }`}
                                    >
                                      {m.valueCode}
                                    </span>
                                  </div>
                                  <div className="mt-1 font-medium text-ink">{m.name}</div>
                                  <div className="mt-0.5 text-[11px] text-muted">{m.valueLabel}</div>
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <h2 className="mb-1 text-lg font-bold text-ink">
            Đối chiếu Kỹ thuật Toàn diện 4 Cấp độ PHP (PoC 4)
          </h2>
          <p className="mb-3 text-xs text-muted">
            Phân tích sự tiến hóa kiến trúc qua 4 tệp mã nguồn thực tế trong DVWA (<code className="font-mono">/vulnerabilities/sqli/source/</code>).
          </p>
          <div className="overflow-x-auto rounded-lg border border-hairline bg-surface">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-hairline bg-subtle text-muted">
                  <th className="px-3.5 py-2.5 font-semibold">Tiêu chí Đánh giá</th>
                  <th className="px-3.5 py-2.5 font-semibold text-rose-700 dark:text-rose-300">
                    low.php
                  </th>
                  <th className="px-3.5 py-2.5 font-semibold text-amber-800 dark:text-amber-300">
                    medium.php
                  </th>
                  <th className="px-3.5 py-2.5 font-semibold text-amber-800 dark:text-amber-300">
                    high.php
                  </th>
                  <th className="px-3.5 py-2.5 font-semibold text-emerald-700 dark:text-emerald-300">
                    impossible.php
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline">
                {CODE_COMPARISON_4_LEVELS.map((row) => (
                  <tr key={row.criterion}>
                    <td className="px-3.5 py-3 font-semibold text-ink">{row.criterion}</td>
                    <td className="px-3.5 py-3 text-secondary">{row.low}</td>
                    <td className="px-3.5 py-3 text-secondary">{row.medium}</td>
                    <td className="px-3.5 py-3 text-secondary">{row.high}</td>
                    <td className="px-3.5 py-3 font-medium text-ink">{row.impossible}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* 6. KIEN TRUC PHONG THU CHIEU SAU 4 TANG (DEFENSE-IN-DEPTH) */}
      <section>
        <div className="mb-4 flex items-center gap-2">
          <Layers className="h-5 w-5 text-accent" aria-hidden="true" />
          <div>
            <h2 className="text-lg font-bold tracking-tight text-ink">
              Ma trận Kiến trúc Phòng thủ Chiều sâu 4 Tầng (Defense-in-Depth)
            </h2>
            <p className="text-xs text-muted">
              Kết hợp gia cố đồng bộ từ tầng biên WAF, máy chủ web Apache, logic ứng dụng PHP đến tầng lưu trữ MariaDB.
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {DEFENSE_IN_DEPTH_LAYERS.map((layer) => {
            const ownerName = memberNameMap[layer.owner_member] ?? `Thành viên ${layer.owner_member}`;
            return (
              <div
                key={layer.layer_number}
                className="flex flex-col justify-between rounded-lg border border-hairline bg-surface p-4 text-xs"
              >
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-hairline pb-2.5">
                    <span className="font-mono font-bold text-accent">{layer.layer_name}</span>
                    <span className="rounded border border-hairline bg-subtle px-2 py-0.5 font-mono text-[11px] text-ink">
                      {layer.standard_ref}
                    </span>
                  </div>

                  <div className="mt-3 font-semibold text-ink">{layer.target_component}</div>

                  <div className="mt-2.5 space-y-2 leading-relaxed">
                    <div className="border-l-2 border-rose-500/70 pl-2.5 text-muted">
                      <strong className="text-rose-700 dark:text-rose-300">Trước gia cố:</strong>{" "}
                      {layer.before_state}
                    </div>
                    <div className="border-l-2 border-emerald-600 pl-2.5 text-secondary">
                      <strong className="text-emerald-700 dark:text-emerald-300">
                        Sau gia cố:
                      </strong>{" "}
                      {layer.after_state}
                    </div>
                  </div>
                </div>

                <div className="mt-3.5 flex flex-wrap items-center justify-between gap-2 border-t border-hairline pt-2.5">
                  <span className="inline-flex items-center gap-1 font-mono text-[11px] text-muted">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
                    Kiểm chứng: <code className="text-ink">{layer.verification_cmd}</code>
                  </span>
                  <Link
                    href={`/thanh-vien/${layer.owner_member}`}
                    className="font-semibold text-accent hover:underline"
                  >
                    {ownerName} ↗
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
