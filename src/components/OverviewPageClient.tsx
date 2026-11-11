"use client";

import Link from "next/link";
import { ArrowRight, Wrench } from "lucide-react";
import { useWorkspace } from "@/components/WorkspaceProvider";
import {
  ATTACK_FLOW_STAGES,
  CODE_COMPARISON_TABLE,
  INFRA_CHALLENGES,
  PROJECT_OVERVIEW,
} from "@/data/scenarioData";

export function OverviewPageClient() {
  const { snapshot } = useWorkspace();

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
          <Link
            href="/lab-setup"
            className="inline-flex items-center gap-2 rounded-md border border-hairline bg-surface px-3.5 py-2 text-xs font-semibold text-ink transition-colors hover:bg-subtle"
          >
            <Wrench className="h-3.5 w-3.5 text-muted" aria-hidden="true" />
            Hướng dẫn Setup Lab &amp; Script .sh
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

                  <Link
                    href={`/thanh-vien/${member.member_number}`}
                    className="inline-flex items-center gap-1.5 rounded-md bg-ink px-3.5 py-2 text-xs font-semibold text-canvas transition-opacity hover:opacity-90"
                  >
                    <span>Vào kịch bản</span>
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </Link>
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
                  <span>Người {stage.owner_member}</span>
                  <ArrowRight className="h-3 w-3" aria-hidden="true" />
                </Link>
              </div>
            </div>
          ))}
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

      {/* 5. BANG CWE / CVSS & DOI CHIEU MA NGUON */}
      <section className="space-y-8">
        <div>
          <h2 className="mb-3 text-lg font-bold text-ink">
            Bảng Định lượng Rủi ro Chuẩn Quốc tế (CWE &amp; CVSS v3.1)
          </h2>
          <div className="overflow-x-auto rounded-lg border border-hairline bg-surface">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-hairline bg-subtle text-muted">
                  <th className="px-4 py-2.5 font-semibold">Mã CWE</th>
                  <th className="px-4 py-2.5 font-semibold">Lỗ hổng / Điểm yếu</th>
                  <th className="px-4 py-2.5 font-semibold">CVSS v3.1</th>
                  <th className="px-4 py-2.5 font-semibold">Mức độ</th>
                  <th className="px-4 py-2.5 font-semibold">Hướng khắc phục</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline">
                {snapshot.vulnerabilities.map((v) => (
                  <tr key={v.id}>
                    <td className="px-4 py-3 font-mono font-bold text-ink">
                      {v.cwe_id}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-ink">{v.title}</div>
                      <div className="mt-0.5 font-mono text-[11px] text-muted">
                        {v.poc_ref}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-muted">
                      <div className="font-bold text-ink">{v.cvss_score}</div>
                      <div className="text-[11px]">{v.cvss_vector}</div>
                    </td>
                    <td className="px-4 py-3">
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
                    <td className="px-4 py-3 text-xs leading-relaxed text-secondary">
                      {v.remediation}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <h2 className="mb-3 text-lg font-bold text-ink">
            Đối chiếu Kỹ thuật: low.php vs impossible.php
          </h2>
          <div className="overflow-x-auto rounded-lg border border-hairline bg-surface">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-hairline bg-subtle text-muted">
                  <th className="px-4 py-2.5 font-semibold">Tiêu chí Đánh giá</th>
                  <th className="px-4 py-2.5 font-semibold text-rose-700 dark:text-rose-300">
                    Cấp độ Low (low.php)
                  </th>
                  <th className="px-4 py-2.5 font-semibold text-emerald-700 dark:text-emerald-300">
                    Cấp độ Impossible (impossible.php)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline">
                {CODE_COMPARISON_TABLE.map((row) => (
                  <tr key={row.criterion}>
                    <td className="px-4 py-3 font-semibold text-ink">{row.criterion}</td>
                    <td className="px-4 py-3 text-secondary">{row.low}</td>
                    <td className="px-4 py-3 text-secondary">{row.impossible}</td>
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
