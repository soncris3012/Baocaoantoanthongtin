"use client";

import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Cpu,
  Database,
  Layers,
  Laptop,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Terminal,
  Wrench,
} from "lucide-react";
import { useWorkspace } from "@/components/WorkspaceProvider";
import {
  ATTACK_FLOW_STAGES,
  CODE_COMPARISON_TABLE,
  INFRA_CHALLENGES,
  PROJECT_OVERVIEW,
} from "@/data/scenarioData";
import { AccentTheme } from "@/types/scenario";

const THEME_STYLES: Record<
  AccentTheme,
  { border: string; badge: string; text: string; bar: string; button: string }
> = {
  cyan: {
    border: "border-cyan-500/35 hover:border-cyan-400/70",
    badge: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30",
    text: "text-cyan-300",
    bar: "bg-cyan-400",
    button: "bg-cyan-500 text-slate-950 hover:bg-cyan-400",
  },
  amber: {
    border: "border-amber-500/35 hover:border-amber-400/70",
    badge: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    text: "text-amber-300",
    bar: "bg-amber-400",
    button: "bg-amber-500 text-slate-950 hover:bg-amber-400",
  },
  emerald: {
    border: "border-emerald-500/35 hover:border-emerald-400/70",
    badge: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    text: "text-emerald-300",
    bar: "bg-emerald-400",
    button: "bg-emerald-500 text-slate-950 hover:bg-emerald-400",
  },
  violet: {
    border: "border-violet-500/35 hover:border-violet-400/70",
    badge: "bg-violet-500/15 text-violet-300 border-violet-500/30",
    text: "text-violet-300",
    bar: "bg-violet-400",
    button: "bg-violet-500 text-slate-950 hover:bg-violet-400",
  },
};

export function OverviewPageClient() {
  const { snapshot } = useWorkspace();

  const totalSteps = snapshot.steps.length;
  const totalCompleted = snapshot.members.reduce((sum, m) => {
    const done = snapshot.workspaceStates[m.member_number]?.completed_step_ids?.length ?? 0;
    return sum + done;
  }, 0);

  return (
    <div className="space-y-10">
      {/* 1. HERO: FORM CHUNG Y TUONG CHINH CUA BAI TAP LON */}
      <section className="relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-br from-[#0c1428] via-[#091020] to-[#0b1325] p-6 shadow-2xl sm:p-8">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 font-semibold text-cyan-300">
            {PROJECT_OVERVIEW.courseTitle}
          </span>
          <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 font-semibold text-emerald-300">
            Chuẩn PTES • Black-Box &amp; White-Box
          </span>
          <span className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-slate-300">
            OWASP Top 10 (A03:2021 - Injection)
          </span>
        </div>

        <h1 className="mt-4 max-w-4xl text-2xl font-extrabold tracking-tight text-white sm:text-3xl lg:text-4xl">
          {PROJECT_OVERVIEW.projectTitle}
        </h1>
        <p className="mt-3 max-w-4xl text-sm leading-relaxed text-slate-300 sm:text-base">
          {PROJECT_OVERVIEW.subtitle}
        </p>

        {/* Quick Executive Summary Grid */}
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-800/90 bg-slate-950/60 p-4">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-cyan-300">
              <Layers className="h-4 w-4" /> Chuẩn Kiểm thử
            </div>
            <p className="mt-1.5 text-sm font-medium text-slate-100">
              PTES 4 Giai đoạn
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Kết hợp Black-box (Nmap, Burp, SQLMap) và White-box (MariaDB CLI, PHP cat -n).
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800/90 bg-slate-950/60 p-4">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-300">
              <Cpu className="h-4 w-4" /> Hệ thống Mục tiêu
            </div>
            <p className="mt-1.5 text-sm font-medium text-slate-100">
              Docker DVWA Cô lập
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Apache/2.4.25 (Debian) + PHP + MariaDB chạy tại cổng 8080.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800/90 bg-slate-950/60 p-4">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-300">
              <ShieldCheck className="h-4 w-4" /> Phòng thủ Chiều sâu
            </div>
            <p className="mt-1.5 text-sm font-medium text-slate-100">
              OWASP A03:2021
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Vá Banner Apache, Bcrypt cost=12, Least Privilege DB, PDO Prepared Statements &amp; WAF.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800/90 bg-slate-950/60 p-4">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-violet-300">
              <Database className="h-4 w-4" /> Tiến độ Thực hành Nhóm
            </div>
            <p className="mt-1.5 text-sm font-medium text-slate-100">
              {totalCompleted} / {totalSteps} bước hoàn tất
            </p>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-emerald-400 to-violet-400 transition-all"
                style={{
                  width: `${totalSteps ? Math.round((totalCompleted / totalSteps) * 100) : 0}%`,
                }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* 2. PHAN VAI 4 THANH VIEN - VAO LA BAM XEM NGAY KICH BAN CHI TIET */}
      <section>
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-white sm:text-2xl">
              Phân chia Kịch bản Thực hành 4 Thành viên
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              Mỗi thành viên chọn đúng phần của mình để xem kịch bản từng bước, copy lệnh động và chạy trình mô phỏng thực tế.
            </p>
          </div>
          <Link
            href="/lab-setup"
            className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2 text-xs font-semibold text-slate-200 transition hover:border-cyan-400 hover:text-cyan-200"
          >
            <Wrench className="h-4 w-4 text-cyan-400" />
            Hướng dẫn Setup Lab &amp; Script .sh
          </Link>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          {snapshot.members.map((member) => {
            const theme = THEME_STYLES[member.accent_theme] ?? THEME_STYLES.cyan;
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
                className={`flex flex-col justify-between rounded-2xl border bg-[#0b1120] p-5 shadow-lg transition ${theme.border}`}
              >
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-bold ${theme.badge}`}
                    >
                      <Laptop className="h-3.5 w-3.5" />
                      {member.device}
                    </span>
                    <span className="rounded-md bg-slate-900 px-2.5 py-1 font-mono text-xs text-slate-300">
                      {member.stage_label}
                    </span>
                  </div>

                  <h3 className="mt-3 text-lg font-bold text-white">
                    {member.display_name}
                  </h3>
                  <p className={`text-sm font-medium ${theme.text}`}>
                    {member.role_title}
                  </p>
                  <p className="mt-2 text-xs leading-relaxed text-slate-300">
                    {member.overview_summary}
                  </p>

                  <div className="mt-4 space-y-2 rounded-xl border border-slate-800/80 bg-slate-950/60 p-3 text-xs">
                    <div>
                      <span className="font-semibold text-slate-200">Thực hành chính: </span>
                      <span className="text-slate-300">{member.main_practice}</span>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
                      <div>
                        <span className="font-semibold text-emerald-300">Gia cố &amp; Mở rộng: </span>
                        <span className="text-slate-300">{member.defense_scope}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {member.tools.map((tool) => (
                      <span
                        key={tool}
                        className="rounded-md border border-slate-800 bg-slate-900/90 px-2 py-0.5 font-mono text-[11px] text-slate-300"
                      >
                        {tool}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-5 border-t border-slate-800/80 pt-4">
                  <div className="mb-2 flex items-center justify-between text-xs">
                    <span className="text-slate-400">
                      Tiến độ: {doneCount}/{memberSteps.length} bước ({pct}%)
                    </span>
                    <span className="text-slate-400">{member.os_env}</span>
                  </div>
                  <div className="mb-4 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                    <div
                      className={`h-full rounded-full transition-all ${theme.bar}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <Link
                    href={`/thanh-vien/${member.member_number}`}
                    className={`flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition ${theme.button}`}
                  >
                    <span>Vào Kịch bản Từng bước &amp; Mô phỏng</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. SO DO LUONG KICH BAN TAN CONG -> PHONG THU 4 GIAI DOAN */}
      <section className="rounded-2xl border border-slate-800 bg-[#0b1120] p-5 sm:p-6">
        <div className="mb-5">
          <h2 className="text-lg font-bold text-white sm:text-xl">
            Sơ đồ Luồng Kịch bản 4 Giai đoạn (Attack-to-Defense Flow)
          </h2>
          <p className="mt-1 text-xs text-slate-400 sm:text-sm">
            Dữ liệu đầu ra của thành viên trước là đầu vào trực tiếp cho bước kiểm thử của thành viên kế tiếp.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-4">
          {ATTACK_FLOW_STAGES.map((stage) => (
            <div
              key={stage.stage}
              className="flex flex-col justify-between rounded-xl border border-slate-800 bg-slate-950/70 p-4"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-bold tracking-wider text-cyan-400">
                    {stage.badge}
                  </span>
                </div>
                <h3 className="mt-1.5 text-sm font-bold text-white">{stage.title}</h3>
                <div className="mt-2 rounded bg-slate-900 px-2 py-1 font-mono text-[11px] text-slate-300">
                  Công cụ: {stage.tools}
                </div>
                <p className="mt-2.5 text-xs leading-relaxed text-slate-300">
                  <strong className="text-slate-100">Hành động:</strong> {stage.action}
                </p>
                <p className="mt-2 text-xs leading-relaxed text-emerald-300/90">
                  <strong className="text-emerald-200">Kết quả:</strong> {stage.output}
                </p>
              </div>

              <div className="mt-4 border-t border-slate-800 pt-3">
                <p className="text-[11px] text-amber-300/90">→ {stage.handoff}</p>
                <Link
                  href={`/thanh-vien/${stage.owner_member}`}
                  className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-cyan-300 hover:text-cyan-200"
                >
                  <span>Xem Người {stage.owner_member} ({stage.poc_label})</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. HE SINH THAI 4 CONG CU & XU LY 2 BAI TOAN HA TANG */}
      <section className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-800 bg-[#0b1120] p-5 lg:col-span-2">
          <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-white">
            <Terminal className="h-5 w-5 text-cyan-400" />
            Hệ sinh thái 4 Công cụ Thực nghiệm
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="py-2 pr-3">Công cụ</th>
                  <th className="py-2 pr-3">Vai trò</th>
                  <th className="py-2 pr-3">Cấu hình Thực tế</th>
                  <th className="py-2">Kết quả Thu thập</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {PROJECT_OVERVIEW.toolkit.map((t) => (
                  <tr key={t.name}>
                    <td className="py-2.5 pr-3 font-semibold text-cyan-300">{t.name}</td>
                    <td className="py-2.5 pr-3 text-slate-200">{t.role}</td>
                    <td className="py-2.5 pr-3 font-mono text-xs text-slate-300">{t.config}</td>
                    <td className="py-2.5 text-xs text-slate-300">{t.outcome}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-2xl border border-amber-500/30 bg-[#0b1120] p-5">
          <h2 className="mb-3 text-lg font-bold text-amber-300">
            2 Bài toán Hạ tầng Đã giải quyết
          </h2>
          <div className="space-y-3">
            {INFRA_CHALLENGES.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-slate-800 bg-slate-950/70 p-3.5 text-xs"
              >
                <div className="font-bold text-white">{item.title}</div>
                <p className="mt-1 text-slate-400">
                  <strong className="text-rose-300">Vấn đề:</strong> {item.problem}
                </p>
                <p className="mt-1 text-emerald-300">
                  <strong>Giải pháp:</strong> {item.solution}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. BANG CHUAN HOA RUI RO CWE/CVSS & DOI CHIEU MA NGUON */}
      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-800 bg-[#0b1120] p-5">
          <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-white">
            <ShieldAlert className="h-5 w-5 text-rose-400" />
            Bảng Chuẩn hóa Rủi ro (CWE &amp; CVSS v3.1)
          </h2>
          <div className="space-y-2.5">
            {snapshot.vulnerabilities.map((v) => (
              <div
                key={v.id}
                className="rounded-xl border border-slate-800 bg-slate-950/70 p-3.5 text-xs"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-slate-800 px-2 py-0.5 font-mono font-bold text-cyan-300">
                      {v.cwe_id}
                    </span>
                    <span className="font-bold text-white">{v.title}</span>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-0.5 font-bold ${
                      v.severity === "High" || v.severity === "Critical"
                        ? "bg-rose-500/20 text-rose-300"
                        : "bg-amber-500/20 text-amber-300"
                    }`}
                  >
                    CVSS {v.cvss_score} ({v.severity})
                  </span>
                </div>
                <div className="mt-1.5 font-mono text-[11px] text-slate-400">
                  {v.cvss_vector} • {v.poc_ref}
                </div>
                <div className="mt-1.5 flex items-center justify-between gap-2 text-emerald-300">
                  <span>Khắc phục: {v.remediation}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-[#0b1120] p-5">
          <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-white">
            <CheckCircle2 className="h-5 w-5 text-emerald-400" />
            Đối chiếu Kỹ thuật: low.php vs impossible.php
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="py-2 pr-2">Tiêu chí</th>
                  <th className="py-2 pr-2 text-rose-300">Cấp độ Low</th>
                  <th className="py-2 text-emerald-300">Cấp độ Impossible</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {CODE_COMPARISON_TABLE.map((row) => (
                  <tr key={row.criterion}>
                    <td className="py-2.5 pr-2 font-semibold text-slate-200">{row.criterion}</td>
                    <td className="py-2.5 pr-2 text-rose-200/90">{row.low}</td>
                    <td className="py-2.5 text-emerald-200/90">{row.impossible}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
