"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Circle,
  Edit3,
  Laptop,
  MessageSquareQuote,
  Play,
  Save,
  Sliders,
  Sparkles,
} from "lucide-react";
import { CodeBlock } from "@/components/CodeBlock";
import { RoleSimulator } from "@/components/RoleSimulator";
import { useWorkspace } from "@/components/WorkspaceProvider";

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

  const filteredSteps = memberSteps.filter((s) => {
    if (filterMode === "main") return !s.is_defense;
    if (filterMode === "defense") return s.is_defense;
    return true;
  });

  const completedCount = memberSteps.filter((s) =>
    currentState.completed_step_ids.includes(s.id)
  ).length;

  const handleSaveVars = async () => {
    await updateMemberState(memberNumber, {
      container_ref: containerInput,
      phpsessid: phpsessidInput,
      user_token: userTokenInput,
      notes: notesInput,
    });
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

  const liveVars = {
    container: containerInput,
    phpsessid: phpsessidInput,
    userToken: userTokenInput,
  };

  return (
    <div className="space-y-8">
      {/* Top Breadcrumb + Quick Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 transition hover:text-cyan-300 sm:text-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lại Trang tổng quan BTL
        </Link>

        <div className="flex flex-wrap items-center gap-1.5">
          {[1, 2, 3, 4].map((num) => (
            <Link
              key={num}
              href={`/thanh-vien/${num}`}
              className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                num === memberNumber
                  ? "border-cyan-400 bg-cyan-500/20 text-white"
                  : "border-slate-800 bg-slate-900 text-slate-300 hover:border-slate-600"
              }`}
            >
              Người {num}
            </Link>
          ))}
        </div>
      </div>

      {/* Member Hero Summary Card */}
      <section className="rounded-3xl border border-slate-800 bg-gradient-to-br from-[#0d152a] to-[#080d1b] p-5 shadow-xl sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-bold text-cyan-300">
              <Laptop className="h-3.5 w-3.5" />
              {member.device}
            </span>
            <span className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 font-mono text-xs text-slate-300">
              {member.stage_label}
            </span>
          </div>

          <div className="text-xs font-semibold text-emerald-300">
            Hoàn thành: {completedCount} / {memberSteps.length} bước
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          {editingName ? (
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="text"
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
                aria-label="Tên thành viên"
                className="rounded-lg border border-cyan-500/50 bg-slate-950 px-3 py-1.5 text-lg font-bold text-white focus:outline-none"
              />
              <button
                type="button"
                onClick={async () => {
                  await renameMember(memberNumber, nameDraft);
                  setEditingName(false);
                }}
                className="rounded-lg bg-cyan-500 px-3 py-1.5 text-xs font-bold text-slate-950 hover:bg-cyan-400"
              >
                Lưu tên
              </button>
              <button
                type="button"
                onClick={() => {
                  setNameDraft(member.display_name);
                  setEditingName(false);
                }}
                className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-300"
              >
                Hủy
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-extrabold text-white sm:text-3xl">
                {member.display_name}
              </h1>
              <button
                type="button"
                onClick={() => setEditingName(true)}
                title="Đổi sang tên thật của thành viên trong nhóm"
                className="rounded-lg border border-slate-800 bg-slate-900 p-1.5 text-slate-400 transition hover:border-cyan-500/50 hover:text-cyan-300"
              >
                <Edit3 className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>

        <p className="mt-1 text-base font-semibold text-cyan-300">{member.role_title}</p>
        <p className="mt-2 max-w-4xl text-sm leading-relaxed text-slate-300">
          {member.overview_summary}
        </p>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3.5 text-xs">
            <div className="font-bold uppercase tracking-wider text-slate-400">
              Phần Thực hành Chính
            </div>
            <p className="mt-1 text-sm text-slate-100">{member.main_practice}</p>
          </div>
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/15 p-3.5 text-xs">
            <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-emerald-300">
              <Sparkles className="h-3.5 w-3.5" /> Gia cố &amp; Phòng thủ Chiều sâu
            </div>
            <p className="mt-1 text-sm text-emerald-100">{member.defense_scope}</p>
          </div>
        </div>
      </section>

      {/* Dynamic Variable Configurator */}
      <section className="rounded-2xl border border-slate-800 bg-[#0b1120] p-4 sm:p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="flex items-center gap-2 text-sm font-bold text-white sm:text-base">
              <Sliders className="h-4 w-4 text-cyan-400" />
              Tham số Thực hành Động (Tự điền vào mọi câu lệnh bên dưới)
            </h2>
            <p className="text-xs text-slate-400">
              Nhập Container / PHPSESSID / user_token thật từ máy của bạn — mọi câu lệnh phía dưới sẽ tự động cập nhật để copy 1 chạm.
            </p>
          </div>
          <button
            type="button"
            onClick={handleSaveVars}
            disabled={savingMember === memberNumber}
            className="flex items-center gap-1.5 rounded-lg bg-cyan-500 px-3.5 py-2 text-xs font-bold text-slate-950 transition hover:bg-cyan-400 disabled:opacity-60"
          >
            <Save className="h-3.5 w-3.5" />
            {savingMember === memberNumber
              ? "Đang lưu..."
              : snapshot.supabaseConfigured
              ? "Lưu lên Supabase"
              : "Lưu tham số"}
          </button>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-300">
              Container ID / Name
            </label>
            <input
              type="text"
              value={containerInput}
              onChange={(e) => setContainerInput(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-xs text-cyan-200 focus:border-cyan-400 focus:outline-none"
              placeholder="215d3a734374 hoặc dvwa"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-300">
              PHPSESSID (Cookie phiên)
            </label>
            <input
              type="text"
              value={phpsessidInput}
              onChange={(e) => setPhpsessidInput(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-xs text-amber-200 focus:border-cyan-400 focus:outline-none"
              placeholder="7nst0hrqrfmv744a5ouj7663b0"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-300">
              user_token (Cho PoC 5 tinh chỉnh)
            </label>
            <input
              type="text"
              value={userTokenInput}
              onChange={(e) => setUserTokenInput(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-xs text-violet-200 focus:border-cyan-400 focus:outline-none"
              placeholder="d41d8cd98f00b204e9800998ecf8427e"
            />
          </div>
        </div>
      </section>

      {/* Step Filter & Walkthrough Header */}
      <section className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-white">
              Kịch bản Thực hành Từng bước Chi tiết
            </h2>
            <p className="text-xs text-slate-400 sm:text-sm">
              Làm tuần tự từ Bước 1 đến hết; tick xác nhận sau khi chạy thành công trên máy của bạn.
            </p>
          </div>

          <div className="flex rounded-xl border border-slate-800 bg-slate-950 p-1 text-xs">
            {[
              { id: "all" as const, label: `Tất cả (${memberSteps.length})` },
              {
                id: "main" as const,
                label: `Khai thác & Kiểm toán (${memberSteps.filter((s) => !s.is_defense).length})`,
              },
              {
                id: "defense" as const,
                label: `Gia cố & Phòng thủ (${memberSteps.filter((s) => s.is_defense).length})`,
              },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilterMode(f.id)}
                className={`rounded-lg px-3 py-1.5 font-medium transition ${
                  filterMode === f.id
                    ? "bg-slate-800 text-white"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Step-by-Step Cards */}
        <div className="space-y-6">
          {filteredSteps.map((step) => {
            const isDone = currentState.completed_step_ids.includes(step.id);

            return (
              <article
                key={step.id}
                className={`rounded-2xl border bg-[#0b1120] p-5 shadow-lg transition sm:p-6 ${
                  isDone
                    ? "border-emerald-500/45"
                    : step.is_defense
                    ? "border-violet-500/35"
                    : "border-slate-800"
                }`}
              >
                {/* Step Header */}
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-800/80 pb-4">
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-md bg-slate-800 px-2.5 py-0.5 font-mono text-xs font-bold text-white">
                        BƯỚC {step.step_order}
                      </span>
                      <span
                        className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${
                          step.is_defense
                            ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-300"
                            : "border-cyan-500/30 bg-cyan-500/10 text-cyan-300"
                        }`}
                      >
                        {step.phase_tag}
                      </span>
                      <span className="text-xs text-slate-400">{step.poc_ref}</span>
                    </div>
                    <h3 className="text-lg font-bold text-white sm:text-xl">
                      {step.title}
                    </h3>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {step.simulator_key && (
                      <button
                        type="button"
                        onClick={() => handleJumpToSimulator(step.simulator_key)}
                        className="flex items-center gap-1.5 rounded-lg border border-cyan-500/40 bg-cyan-500/10 px-3 py-1.5 text-xs font-semibold text-cyan-200 transition hover:bg-cyan-500/20"
                      >
                        <Play className="h-3.5 w-3.5" />
                        Chạy thử trên Mô phỏng
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => toggleStepCompletion(memberNumber, step.id)}
                      className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-bold transition ${
                        isDone
                          ? "border-emerald-400 bg-emerald-500/20 text-emerald-200"
                          : "border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-500"
                      }`}
                    >
                      {isDone ? (
                        <>
                          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                          <span>Đã xong bước này</span>
                        </>
                      ) : (
                        <>
                          <Circle className="h-4 w-4 text-slate-400" />
                          <span>Đánh dấu hoàn thành</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Goal + Detailed Numbered Actions */}
                <div className="mt-4 space-y-4">
                  <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-3.5 text-sm text-slate-200">
                    <span className="font-bold text-cyan-300">Mục tiêu: </span>
                    {step.goal}
                  </div>

                  <div>
                    <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                      Các thao tác chi tiết cần làm:
                    </h4>
                    <ol className="space-y-2">
                      {step.action_steps.map((act, idx) => (
                        <li
                          key={idx}
                          className="flex items-start gap-2.5 text-sm leading-relaxed text-slate-200"
                        >
                          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-800 font-mono text-[11px] font-bold text-cyan-300">
                            {idx + 1}
                          </span>
                          <span>{act}</span>
                        </li>
                      ))}
                    </ol>
                  </div>

                  {/* Commands */}
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

                  {/* Expected Output */}
                  <div>
                    <div className="mb-1.5 text-xs font-bold uppercase tracking-wider text-emerald-400">
                      Kết quả Thực tế Kỳ vọng (Dùng làm bằng chứng PoC):
                    </div>
                    <pre className="overflow-x-auto rounded-xl border border-emerald-500/25 bg-[#050811] p-3.5 font-mono text-xs leading-relaxed text-emerald-200">
                      <code>{step.expected_output}</code>
                    </pre>
                  </div>

                  {/* Presenter Script + Academic Explanation */}
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="rounded-xl border border-amber-500/25 bg-amber-950/15 p-3.5">
                      <div className="mb-1 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-300">
                        <MessageSquareQuote className="h-3.5 w-3.5" />
                        Tóm tắt Diễn giải Bước Thực hành
                      </div>
                      <p className="text-xs leading-relaxed text-slate-200 sm:text-sm">
                        {step.presenter_script}
                      </p>
                    </div>

                    <div className="rounded-xl border border-violet-500/25 bg-violet-950/15 p-3.5">
                      <div className="mb-1 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-violet-300">
                        <BookOpen className="h-3.5 w-3.5" />
                        Phân tích Kỹ thuật &amp; Cơ chế Bảo mật
                      </div>
                      <p className="text-xs leading-relaxed text-slate-200 sm:text-sm">
                        {step.academic_explanation}
                      </p>
                    </div>
                  </div>
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
      <section className="rounded-2xl border border-slate-800 bg-[#0b1120] p-5">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="text-base font-bold text-white">
            Ghi chú Thực nghiệm Cá nhân
          </h2>
          <button
            type="button"
            onClick={handleSaveVars}
            className="flex items-center gap-1 rounded-lg border border-cyan-500/40 bg-cyan-500/15 px-3 py-1.5 text-xs font-semibold text-cyan-200 hover:bg-cyan-500/25"
          >
            <Save className="h-3.5 w-3.5" /> Lưu ghi chú
          </button>
        </div>
        <textarea
          rows={4}
          value={notesInput}
          onChange={(e) => setNotesInput(e.target.value)}
          className="w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-xs leading-relaxed text-slate-200 focus:border-cyan-400 focus:outline-none sm:text-sm"
          placeholder="Ghi lại IP máy ảo, ảnh chụp PoC hoặc lưu ý riêng khi thực hành..."
        />
      </section>

      {/* Next / Prev Member Footer Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 pt-6">
        {memberNumber > 1 ? (
          <Link
            href={`/thanh-vien/${memberNumber - 1}`}
            className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-xs font-semibold text-slate-200 hover:border-cyan-400"
          >
            <ArrowLeft className="h-4 w-4" />
            Xem Thành viên {memberNumber - 1}
          </Link>
        ) : (
          <div />
        )}

        {memberNumber < 4 ? (
          <Link
            href={`/thanh-vien/${memberNumber + 1}`}
            className="flex items-center gap-2 rounded-xl bg-cyan-500 px-4 py-2.5 text-xs font-bold text-slate-950 hover:bg-cyan-400"
          >
            Chuyển tiếp sang Thành viên {memberNumber + 1}
            <ArrowRight className="h-4 w-4" />
          </Link>
        ) : (
          <Link
            href="/"
            className="flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-xs font-bold text-slate-950 hover:bg-emerald-400"
          >
            Về Trang tổng quan (Hoàn tất 4 phần)
            <ArrowRight className="h-4 w-4" />
          </Link>
        )}
      </div>
    </div>
  );
}
