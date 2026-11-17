"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Circle,
  Copy,
  Download,
  Edit3,
  ListChecks,
  Play,
  RotateCcw,
  Save,
  X,
} from "lucide-react";
import { CodeBlock, interpolateCommand } from "@/components/CodeBlock";
import { RoleSimulator } from "@/components/RoleSimulator";
import { StepInlineRunner } from "@/components/StepInlineRunner";
import { WindowControls } from "@/components/WindowBar";
import { useWorkspace } from "@/components/WorkspaceProvider";
import { STEP_ENRICHMENTS } from "@/data/scenarioData";

interface MemberPageClientProps {
  memberNumber: 1 | 2 | 3 | 4;
}

export function MemberPageClient({ memberNumber }: MemberPageClientProps) {
  const {
    snapshot,
    savingMember,
    updateMemberState,
    toggleStepCompletion,
    renameMember,
  } = useWorkspace();

  const member =
    snapshot.members.find((m) => m.member_number === memberNumber) ??
    snapshot.members[0];
  const prevMember = snapshot.members.find((m) => m.member_number === memberNumber - 1);
  const nextMember = snapshot.members.find((m) => m.member_number === memberNumber + 1);
  const memberSteps = snapshot.steps
    .filter((s) => s.member_number === memberNumber)
    .sort((a, b) => a.step_order - b.step_order);
  const currentState = snapshot.workspaceStates[memberNumber];

  const [filterMode, setFilterMode] = useState<"all" | "main" | "defense">("all");
  const [containerInput, setContainerInput] = useState(currentState.container_ref);
  const [phpsessidInput, setPhpsessidInput] = useState(currentState.phpsessid);
  const [userTokenInput, setUserTokenInput] = useState(currentState.user_token);
  const [notesInput, setNotesInput] = useState(currentState.notes);

  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(member.display_name);
  const [focusedSimKey, setFocusedSimKey] = useState<string | undefined>(undefined);
  const [copiedAllCmds, setCopiedAllCmds] = useState(false);
  const [openPitfalls, setOpenPitfalls] = useState<Record<string, boolean>>({});
  const [minimizedOutputs, setMinimizedOutputs] = useState<Record<string, boolean>>({});
  const [maximizedOutput, setMaximizedOutput] = useState<{
    title: string;
    output: string;
    pocRef: string;
  } | null>(null);

  useEffect(() => {
    setContainerInput(currentState.container_ref);
    setPhpsessidInput(currentState.phpsessid);
    setUserTokenInput(currentState.user_token);
    setNotesInput(currentState.notes);
  }, [
    memberNumber,
    currentState.container_ref,
    currentState.phpsessid,
    currentState.user_token,
    currentState.notes,
  ]);

  useEffect(() => {
    setNameDraft(member.display_name);
  }, [member.display_name]);

  useEffect(() => {
    if (!maximizedOutput) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMaximizedOutput(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [maximizedOutput]);

  const filteredSteps = memberSteps.filter((s) => {
    if (filterMode === "main") return !s.is_defense;
    if (filterMode === "defense") return s.is_defense;
    return true;
  });

  const completedCount = memberSteps.filter((s) =>
    currentState.completed_step_ids.includes(s.id)
  ).length;

  const liveVars = {
    container: containerInput,
    phpsessid: phpsessidInput,
    userToken: userTokenInput,
  };

  const handleSaveVars = async () => {
    await updateMemberState(memberNumber, {
      container_ref: containerInput,
      phpsessid: phpsessidInput,
      user_token: userTokenInput,
      notes: notesInput,
    });
  };

  const handleResetProgress = async () => {
    await updateMemberState(memberNumber, {
      completed_step_ids: [],
    });
  };

  const handleCopyAllCommands = async () => {
    const blocks: string[] = [];
    for (const s of memberSteps) {
      if (s.commands.length === 0) continue;
      blocks.push(`# === BƯỚC 0${s.step_order}: ${s.title} ===`);
      for (const cmd of s.commands) {
        blocks.push(`# ${cmd.label}`);
        blocks.push(interpolateCommand(cmd.template, liveVars));
      }
      blocks.push("");
    }
    try {
      await navigator.clipboard.writeText(blocks.join("\n"));
      setCopiedAllCmds(true);
      setTimeout(() => setCopiedAllCmds(false), 1800);
    } catch {
      // ignore
    }
  };

  const handleDownloadRunbook = () => {
    const lines: string[] = [
      `# Runbook Thực hành DVWA — ${member.display_name} (${member.device})`,
      `- **Vai trò**: ${member.role_title}`,
      `- **Môi trường**: ${member.os_env}`,
      `- **Biến phiên**: CONTAINER=${containerInput || "dvwa"} | PHPSESSID=${phpsessidInput} | USER_TOKEN=${userTokenInput}`,
      "",
    ];

    for (const s of memberSteps) {
      const enrichment = STEP_ENRICHMENTS[s.id];
      lines.push(`## Bước 0${s.step_order}: ${s.title} (${s.poc_ref})`);
      lines.push(`**Mục tiêu:** ${s.goal}`);
      lines.push("");
      lines.push("### Thao tác");
      s.action_steps.forEach((act, i) => lines.push(`${i + 1}. ${act}`));
      lines.push("");
      if (s.commands.length > 0) {
        lines.push("### Câu lệnh");
        for (const cmd of s.commands) {
          lines.push(`**${cmd.label}**`);
          lines.push("```" + (cmd.shell === "http" ? "http" : "bash"));
          lines.push(interpolateCommand(cmd.template, liveVars));
          lines.push("```");
        }
        lines.push("");
      }
      if (enrichment?.verification_checks?.length) {
        lines.push("### Checklist Kiểm chứng");
        enrichment.verification_checks.forEach((chk) => lines.push(`- [ ] ${chk}`));
        lines.push("");
      }
    }

    const blob = new Blob([lines.join("\n")], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `runbook-${member.member_number}-${member.display_name.toLowerCase()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleJumpToSimulator = (simKey?: string) => {
    if (simKey) {
      setFocusedSimKey(simKey);
    }
    const el = document.getElementById("simulator-section");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleScrollToStep = (stepId: string) => {
    const el = document.getElementById(`step-${stepId}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Breadcrumb + Segmented Member Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-hairline pb-4">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted transition-colors hover:text-ink sm:text-sm"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Trang tổng quan BTL
        </Link>

        <div className="inline-flex rounded-md border border-hairline bg-subtle p-0.5">
          {snapshot.members.map((m) => (
            <Link
              key={m.member_number}
              href={`/thanh-vien/${m.member_number}`}
              className={`rounded px-3 py-1 font-mono text-xs font-medium transition-colors ${
                m.member_number === memberNumber
                  ? "bg-surface text-ink font-bold shadow-sm"
                  : "text-muted hover:text-ink"
              }`}
            >
              0{m.member_number} · {m.display_name}
            </Link>
          ))}
        </div>
      </div>

      {/* Member Header */}
      <section className="space-y-4 border-b border-hairline pb-6">
        <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-xs text-muted">
          <span>
            {member.device} · {member.os_env}
          </span>
          <span>
            Tiến độ: <strong className="text-ink">{completedCount}/{memberSteps.length}</strong> bước
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {editingName ? (
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="text"
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
                aria-label="Tên thành viên"
                className="rounded-md border border-accent bg-surface px-3 py-1.5 text-lg font-bold text-ink focus:outline-none"
              />
              <button
                type="button"
                onClick={async () => {
                  await renameMember(memberNumber, nameDraft);
                  setEditingName(false);
                }}
                className="cursor-pointer rounded-md bg-ink px-3 py-1.5 text-xs font-semibold text-canvas"
              >
                Lưu tên
              </button>
              <button
                type="button"
                onClick={() => {
                  setNameDraft(member.display_name);
                  setEditingName(false);
                }}
                className="cursor-pointer rounded-md border border-hairline px-3 py-1.5 text-xs text-secondary"
              >
                Hủy
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">
                {member.display_name}
              </h1>
              <button
                type="button"
                onClick={() => setEditingName(true)}
                aria-label="Đổi tên thành viên"
                title="Đổi sang tên thật của thành viên trong nhóm"
                className="cursor-pointer rounded-md border border-hairline bg-surface p-1.5 text-muted transition-colors hover:bg-subtle hover:text-ink"
              >
                <Edit3 className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>
          )}
        </div>

        <p className="text-base font-semibold text-accent">{member.role_title}</p>
        <p className="max-w-3xl text-sm leading-relaxed text-secondary">
          {member.overview_summary}
        </p>

        <div className="grid gap-4 pt-2 sm:grid-cols-2">
          <div className="border-l-2 border-ink pl-3.5 text-xs sm:text-sm">
            <div className="font-semibold text-ink">Phần Thực hành Chính</div>
            <p className="mt-0.5 text-secondary">{member.main_practice}</p>
          </div>
          <div className="border-l-2 border-emerald-600 pl-3.5 text-xs sm:text-sm">
            <div className="font-semibold text-ink">Gia cố &amp; Phòng thủ Chiều sâu</div>
            <p className="mt-0.5 text-secondary">{member.defense_scope}</p>
          </div>
        </div>
      </section>

      {/* Environment Parameter Bar (Postman/Runbook Style) */}
      <section className="rounded-lg border border-hairline bg-surface p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-bold text-ink">
              Biến Môi trường Thực hành (Tự động điền vào mọi câu lệnh)
            </h2>
            <p className="text-xs text-muted">
              Cập nhật Container ID, PHPSESSID hoặc user_token thật trên máy bạn để copy lệnh chính xác.
            </p>
          </div>
          <button
            type="button"
            onClick={handleSaveVars}
            disabled={savingMember === memberNumber}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-md bg-ink px-3 py-1.5 text-xs font-semibold text-canvas transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            <Save className="h-3.5 w-3.5" aria-hidden="true" />
            {savingMember === memberNumber
              ? "Đang lưu..."
              : snapshot.supabaseConfigured
              ? "Lưu lên Supabase"
              : "Lưu tham số"}
          </button>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <label htmlFor="env-container" className="mb-1 block font-mono text-[11px] font-medium text-muted">
              CONTAINER_REF
            </label>
            <input
              id="env-container"
              type="text"
              value={containerInput}
              onChange={(e) => setContainerInput(e.target.value)}
              className="w-full rounded-md border border-hairline bg-canvas px-3 py-1.5 font-mono text-xs text-ink focus:border-accent focus:outline-none"
              placeholder="215d3a734374 hoặc dvwa"
            />
          </div>
          <div>
            <label htmlFor="env-phpsessid" className="mb-1 block font-mono text-[11px] font-medium text-muted">
              PHPSESSID
            </label>
            <input
              id="env-phpsessid"
              type="text"
              value={phpsessidInput}
              onChange={(e) => setPhpsessidInput(e.target.value)}
              className="w-full rounded-md border border-hairline bg-canvas px-3 py-1.5 font-mono text-xs text-ink focus:border-accent focus:outline-none"
              placeholder="7nst0hrqrfmv744a5ouj7663b0"
            />
          </div>
          <div>
            <label htmlFor="env-usertoken" className="mb-1 block font-mono text-[11px] font-medium text-muted">
              USER_TOKEN
            </label>
            <input
              id="env-usertoken"
              type="text"
              value={userTokenInput}
              onChange={(e) => setUserTokenInput(e.target.value)}
              className="w-full rounded-md border border-hairline bg-canvas px-3 py-1.5 font-mono text-xs text-ink focus:border-accent focus:outline-none"
              placeholder="d41d8cd98f00b204e9800998ecf8427e"
            />
          </div>
        </div>
      </section>

      {/* Step-by-Step Runbook */}
      <section className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-ink">
              Kịch bản Thực hành Từng bước
            </h2>
            <p className="text-xs text-muted sm:text-sm">
              Thực hiện lần lượt từ Bước 1 và đánh dấu sau khi kiểm chứng thành công trên máy thật.
            </p>
          </div>

          <div className="inline-flex rounded-md border border-hairline bg-subtle p-0.5 text-xs">
            {[
              { id: "all" as const, label: `Tất cả (${memberSteps.length})` },
              {
                id: "main" as const,
                label: `Khai thác (${memberSteps.filter((s) => !s.is_defense).length})`,
              },
              {
                id: "defense" as const,
                label: `Gia cố (${memberSteps.filter((s) => s.is_defense).length})`,
              },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilterMode(f.id)}
                className={`cursor-pointer rounded px-3 py-1 font-medium transition-colors ${
                  filterMode === f.id
                    ? "bg-surface font-semibold text-ink shadow-sm"
                    : "text-muted hover:text-ink"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Quick Step Navigation & Runbook Export Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-hairline bg-surface p-3.5">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="mr-1 font-mono text-[11px] font-semibold uppercase tracking-wider text-muted">
              Mục lục bước:
            </span>
            {memberSteps.map((s) => {
              const stepDone = currentState.completed_step_ids.includes(s.id);
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => handleScrollToStep(s.id)}
                  className={`inline-flex cursor-pointer items-center gap-1 rounded border px-2.5 py-1 font-mono text-xs transition-colors ${
                    stepDone
                      ? "border-emerald-600/40 bg-emerald-500/10 font-semibold text-emerald-700 dark:text-emerald-300"
                      : "border-hairline bg-subtle text-secondary hover:text-ink"
                  }`}
                >
                  {stepDone ? (
                    <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
                  ) : (
                    <Circle className="h-3 w-3 opacity-60" aria-hidden="true" />
                  )}
                  <span>Bước 0{s.step_order}</span>
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleCopyAllCommands}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-hairline bg-subtle px-3 py-1.5 text-xs font-semibold text-ink transition-colors hover:bg-canvas"
            >
              {copiedAllCmds ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
                  <span>Đã copy toàn bộ lệnh</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 text-muted" aria-hidden="true" />
                  <span>Copy toàn bộ lệnh</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleDownloadRunbook}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-hairline bg-subtle px-3 py-1.5 text-xs font-semibold text-ink transition-colors hover:bg-canvas"
            >
              <Download className="h-3.5 w-3.5 text-muted" aria-hidden="true" />
              <span>Tải Runbook (.md)</span>
            </button>

            {completedCount > 0 && (
              <button
                type="button"
                onClick={handleResetProgress}
                className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-hairline bg-surface px-2.5 py-1.5 text-xs text-secondary transition-colors hover:text-ink"
                title="Xóa toàn bộ trạng thái đã đánh dấu của thành viên này"
              >
                <RotateCcw className="h-3 w-3" aria-hidden="true" />
                <span>Đặt lại tiến độ</span>
              </button>
            )}
          </div>
        </div>

        <div className="space-y-8">
          {filteredSteps.map((step) => {
            const isDone = currentState.completed_step_ids.includes(step.id);
            const enrichment = STEP_ENRICHMENTS[step.id];
            const isPitfallOpen = Boolean(openPitfalls[step.id]);
            const isOutputMinimized = Boolean(minimizedOutputs[step.id]);

            return (
              <article
                id={`step-${step.id}`}
                key={step.id}
                className={`scroll-mt-24 rounded-lg border bg-surface p-5 sm:p-6 ${
                  isDone ? "border-emerald-600/60" : "border-hairline"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-hairline pb-4">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
                      <span className="font-bold text-accent">
                        BƯỚC 0{step.step_order}
                      </span>
                      <span className="text-muted">·</span>
                      <span className="text-muted">{step.phase_tag}</span>
                      <span className="text-muted">·</span>
                      <span className="text-muted">{step.poc_ref}</span>
                    </div>
                    <h3 className="text-lg font-bold text-ink sm:text-xl">
                      {step.title}
                    </h3>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {step.simulator_key && (
                      <button
                        type="button"
                        onClick={() => handleJumpToSimulator(step.simulator_key)}
                        className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-hairline bg-subtle px-3 py-1.5 text-xs font-semibold text-ink transition-colors hover:bg-canvas"
                      >
                        <Play className="h-3.5 w-3.5" aria-hidden="true" />
                        Mở Simulator
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => toggleStepCompletion(memberNumber, step.id)}
                      className={`inline-flex cursor-pointer items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors ${
                        isDone
                          ? "border-emerald-600 bg-emerald-600 text-white"
                          : "border-hairline bg-surface text-secondary hover:bg-subtle hover:text-ink"
                      }`}
                    >
                      {isDone ? (
                        <>
                          <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>Đã hoàn thành</span>
                        </>
                      ) : (
                        <>
                          <Circle className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>Đánh dấu xong</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="mt-4 space-y-5">
                  <p className="border-l-2 border-accent pl-3 text-sm text-secondary">
                    <strong className="text-ink">Mục tiêu: </strong>
                    {step.goal}
                  </p>

                  <div>
                    <h4 className="mb-2.5 font-mono text-xs font-semibold uppercase tracking-wider text-muted">
                      Trình tự thao tác chi tiết
                    </h4>
                    <ol className="space-y-2 text-sm leading-relaxed text-secondary">
                      {step.action_steps.map((act, idx) => (
                        <li key={idx} className="flex items-start gap-3">
                          <span className="mt-0.5 font-mono text-xs font-bold text-muted">
                            {idx + 1}.
                          </span>
                          <span>{act}</span>
                        </li>
                      ))}
                    </ol>
                  </div>

                  {step.commands.length > 0 && (
                    <div className="space-y-3">
                      {step.commands.map((cmd, idx) => (
                        <CodeBlock
                          key={idx}
                          label={cmd.label}
                          shell={cmd.shell}
                          code={cmd.template}
                          explanation={cmd.explanation}
                          variables={liveVars}
                        />
                      ))}
                    </div>
                  )}

                  <div className="overflow-hidden rounded-lg border border-zinc-800 bg-[#0d1117]">
                    <div className="flex items-center justify-between border-b border-zinc-800 bg-[#161b22] px-3.5 py-2">
                      <div className="flex items-center gap-2.5">
                        <WindowControls
                          onClose={() =>
                            setMinimizedOutputs((prev) => ({
                              ...prev,
                              [step.id]: !prev[step.id],
                            }))
                          }
                          closeTitle={isOutputMinimized ? "Mở lại stdout" : "Thu gọn stdout"}
                          onMinimize={() =>
                            setMinimizedOutputs((prev) => ({
                              ...prev,
                              [step.id]: !prev[step.id],
                            }))
                          }
                          isMinimized={isOutputMinimized}
                          onMaximize={() =>
                            setMaximizedOutput({
                              title: `Bước 0${step.step_order} · ${step.title}`,
                              output: step.expected_output,
                              pocRef: step.poc_ref,
                            })
                          }
                        />
                        <span className="font-mono text-xs font-semibold text-zinc-300">
                          stdout · Kết quả Thực tế Kỳ vọng
                        </span>
                      </div>
                      <span className="font-mono text-[11px] text-emerald-400">
                        {step.poc_ref}
                      </span>
                    </div>
                    {!isOutputMinimized && (
                      <pre className="overflow-x-auto p-3.5 font-mono text-xs leading-relaxed text-emerald-300">
                        <code>{step.expected_output}</code>
                      </pre>
                    )}
                  </div>

                  <StepInlineRunner
                    step={step}
                    memberNumber={memberNumber}
                    variables={liveVars}
                    isCompleted={isDone}
                    onToggleComplete={() => toggleStepCompletion(memberNumber, step.id)}
                    onOpenAdvancedSim={handleJumpToSimulator}
                  />

                  <div className="grid gap-4 border-t border-hairline pt-4 md:grid-cols-2">
                    <div className="border-l-2 border-hairline pl-3">
                      <div className="text-xs font-bold text-ink">
                        Diễn giải Thực hành
                      </div>
                      <p className="mt-1 text-xs leading-relaxed text-secondary sm:text-sm">
                        {step.presenter_script}
                      </p>
                    </div>

                    <div className="border-l-2 border-hairline pl-3">
                      <div className="text-xs font-bold text-ink">
                        Cơ chế Bảo mật Liên quan
                      </div>
                      <p className="mt-1 text-xs leading-relaxed text-secondary sm:text-sm">
                        {step.academic_explanation}
                      </p>
                    </div>
                  </div>

                  {/* Step Enrichment: Verification Checklist & Troubleshooting */}
                  {enrichment && (
                    <div className="space-y-3 border-t border-hairline pt-4">
                      {enrichment.verification_checks.length > 0 && (
                        <div className="rounded-md border border-hairline bg-subtle p-3.5">
                          <div className="mb-2 flex items-center gap-1.5 text-xs font-bold text-ink">
                            <ListChecks className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
                            <span>Checklist Kiểm chứng Kết quả trên Máy thật</span>
                          </div>
                          <ul className="space-y-1 text-xs text-secondary">
                            {enrichment.verification_checks.map((chk, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <span className="mt-0.5 font-mono text-[11px] font-bold text-emerald-600">
                                  ✓
                                </span>
                                <span>{chk}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {enrichment.pitfalls.length > 0 && (
                        <div className="overflow-hidden rounded-md border border-hairline bg-canvas">
                          <button
                            type="button"
                            onClick={() =>
                              setOpenPitfalls((prev) => ({
                                ...prev,
                                [step.id]: !prev[step.id],
                              }))
                            }
                            className="flex w-full cursor-pointer items-center justify-between gap-2 px-3.5 py-2.5 text-left text-xs font-semibold text-ink transition-colors hover:bg-subtle"
                          >
                            <span className="inline-flex items-center gap-1.5">
                              <AlertTriangle className="h-3.5 w-3.5 text-amber-600" aria-hidden="true" />
                              <span>
                                Sự cố thường gặp &amp; Cách khắc phục nhanh ({enrichment.pitfalls.length})
                              </span>
                            </span>
                            {isPitfallOpen ? (
                              <ChevronUp className="h-3.5 w-3.5 text-muted" aria-hidden="true" />
                            ) : (
                              <ChevronDown className="h-3.5 w-3.5 text-muted" aria-hidden="true" />
                            )}
                          </button>

                          {isPitfallOpen && (
                            <div className="divide-y divide-hairline border-t border-hairline bg-surface">
                              {enrichment.pitfalls.map((p, idx) => (
                                <div key={idx} className="space-y-1 p-3.5 text-xs">
                                  <div className="font-semibold text-rose-700 dark:text-rose-300">
                                    Lỗi: {p.symptom}
                                  </div>
                                  <div className="text-muted">
                                    <strong>Nguyên nhân:</strong> {p.cause}
                                  </div>
                                  <div className="text-secondary">
                                    <strong className="text-emerald-700 dark:text-emerald-300">
                                      Khắc phục:
                                    </strong>{" "}
                                    {p.fix}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* Interactive Simulator Section */}
      <section id="simulator-section" className="scroll-mt-20">
        <RoleSimulator
          memberNumber={memberNumber}
          workspaceState={{
            ...currentState,
            container_ref: containerInput,
            phpsessid: phpsessidInput,
            user_token: userTokenInput,
          }}
          focusedSimulatorKey={focusedSimKey}
        />
      </section>

      {/* Member Notes */}
      <section className="rounded-lg border border-hairline bg-surface p-5">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="text-sm font-bold text-ink sm:text-base">
            Ghi chú Thực nghiệm Cá nhân
          </h2>
          <button
            type="button"
            onClick={handleSaveVars}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-hairline bg-subtle px-3 py-1.5 text-xs font-semibold text-ink transition-colors hover:bg-canvas"
          >
            <Save className="h-3.5 w-3.5" aria-hidden="true" /> Lưu ghi chú
          </button>
        </div>
        <textarea
          rows={4}
          value={notesInput}
          onChange={(e) => setNotesInput(e.target.value)}
          className="w-full rounded-md border border-hairline bg-canvas p-3 text-xs leading-relaxed text-ink focus:border-accent focus:outline-none sm:text-sm"
          placeholder="Ghi lại IP máy ảo, ảnh chụp PoC hoặc lưu ý riêng khi thực hành..."
        />
      </section>

      {/* Footer Pagination */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-hairline pt-6">
        {memberNumber > 1 && prevMember ? (
          <Link
            href={`/thanh-vien/${memberNumber - 1}`}
            className="inline-flex items-center gap-2 rounded-md border border-hairline bg-surface px-4 py-2 text-xs font-semibold text-ink transition-colors hover:bg-subtle"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            {prevMember.display_name}
          </Link>
        ) : (
          <div />
        )}

        {memberNumber < 4 && nextMember ? (
          <Link
            href={`/thanh-vien/${memberNumber + 1}`}
            className="inline-flex items-center gap-2 rounded-md bg-ink px-4 py-2 text-xs font-semibold text-canvas transition-opacity hover:opacity-90"
          >
            Chuyển sang {nextMember.display_name}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        ) : (
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-md bg-ink px-4 py-2 text-xs font-semibold text-canvas transition-opacity hover:opacity-90"
          >
            Về Trang tổng quan
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        )}
      </div>

      {maximizedOutput && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) setMaximizedOutput(null);
          }}
        >
          <div className="flex max-h-[88vh] w-full max-w-4xl flex-col overflow-hidden rounded-lg border border-zinc-800 bg-[#0d1117] shadow-2xl">
            <div className="flex items-center justify-between gap-2 border-b border-zinc-800 bg-[#161b22] px-3.5 py-2.5">
              <div className="flex min-w-0 items-center gap-2.5">
                <WindowControls
                  onClose={() => setMaximizedOutput(null)}
                  closeTitle="Đóng phóng to (Esc)"
                  onMinimize={() => setMaximizedOutput(null)}
                  onMaximize={() => setMaximizedOutput(null)}
                  isMaximized
                />
                <span className="truncate font-mono text-xs font-semibold text-zinc-200">
                  stdout · {maximizedOutput.title}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[11px] text-emerald-400">
                  {maximizedOutput.pocRef}
                </span>
                <button
                  type="button"
                  onClick={() => setMaximizedOutput(null)}
                  aria-label="Đóng cửa sổ kết quả"
                  className="flex cursor-pointer items-center justify-center rounded border border-zinc-700 bg-zinc-800 p-1 text-zinc-300 hover:bg-zinc-700"
                >
                  <X className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </div>
            </div>
            <pre className="flex-1 overflow-auto p-5 font-mono text-sm leading-relaxed text-emerald-300">
              <code>{maximizedOutput.output}</code>
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
