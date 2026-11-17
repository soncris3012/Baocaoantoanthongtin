"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Check,
  Copy,
  FileText,
  Search,
  ShieldAlert,
  Terminal,
  X,
} from "lucide-react";
import { interpolateCommand } from "@/components/CodeBlock";
import { useWorkspace } from "@/components/WorkspaceProvider";

interface QuickSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function normalizeVi(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d");
}

export function QuickSearchModal({ isOpen, onClose }: QuickSearchModalProps) {
  const { snapshot } = useWorkspace();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setQuery("");
      return;
    }
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 30);

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen, onClose]);

  const memberNameByNum = useMemo(() => {
    const map: Record<number, string> = {};
    for (const m of snapshot.members) {
      map[m.member_number] = m.display_name;
    }
    return map;
  }, [snapshot.members]);

  const results = useMemo(() => {
    const q = normalizeVi(query.trim());

    const matchingSims = snapshot.members.filter((m) => {
      if (!q) return true;
      return normalizeVi(
        `${m.display_name} ${m.role_title} ${m.device} ${m.tools.join(" ")}`
      ).includes(q);
    });

    const matchingSteps = snapshot.steps.filter((s) => {
      if (!q) return false;
      const mName = memberNameByNum[s.member_number] ?? "";
      return normalizeVi(
        `${s.title} ${s.poc_ref} ${s.goal} ${s.phase_tag} ${mName}`
      ).includes(q);
    });

    const matchingCommands: {
      id: string;
      memberNumber: number;
      stepId: string;
      label: string;
      command: string;
    }[] = [];

    for (const s of snapshot.steps) {
      const ws = snapshot.workspaceStates[s.member_number];
      s.commands.forEach((cmd, idx) => {
        const rendered = interpolateCommand(cmd.template, {
          container: ws?.container_ref,
          phpsessid: ws?.phpsessid,
          userToken: ws?.user_token,
        });
        if (!q || normalizeVi(`${cmd.label} ${rendered}`).includes(q)) {
          matchingCommands.push({
            id: `${s.id}-cmd-${idx}`,
            memberNumber: s.member_number,
            stepId: s.id,
            label: cmd.label,
            command: rendered,
          });
        }
      });
    }

    const matchingVulns = snapshot.vulnerabilities.filter((v) => {
      if (!q) return true;
      return normalizeVi(
        `${v.cwe_id} ${v.title} ${v.poc_ref} ${v.remediation}`
      ).includes(q);
    });

    return {
      sims: matchingSims.slice(0, 4),
      steps: (q ? matchingSteps : snapshot.steps.slice(0, 4)).slice(0, 6),
      commands: matchingCommands.slice(0, q ? 6 : 3),
      vulns: matchingVulns.slice(0, q ? 6 : 3),
    };
  }, [query, snapshot, memberNameByNum]);

  if (!isOpen) return null;

  const navigate = (href: string) => {
    onClose();
    router.push(href);
  };

  const handleCopyCmd = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId((cur) => (cur === id ? null : cur)), 1500);
    } catch {
      // ignore
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 p-4 pt-16 backdrop-blur-sm sm:pt-24"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Tìm kiếm nhanh trong hệ thống"
    >
      <div className="w-full max-w-2xl overflow-hidden rounded-xl border border-hairline bg-surface shadow-2xl">
        {/* Search Input */}
        <div className="flex items-center gap-2.5 border-b border-hairline px-4 py-3">
          <Search className="h-4 w-4 shrink-0 text-muted" aria-hidden="true" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm lệnh (sqlmap, nmap, curl, bcrypt), mã CWE-89, hoặc bước của Sơn / Hùng / Quyết / Khánh..."
            className="w-full bg-transparent text-sm text-ink placeholder:text-muted focus:outline-none"
          />
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng tìm kiếm"
            className="cursor-pointer rounded border border-hairline bg-subtle p-1 text-muted hover:text-ink"
          >
            <X className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-[65vh] space-y-5 overflow-y-auto p-4 text-xs">
          {/* Simulators */}
          {results.sims.length > 0 && (
            <div>
              <div className="mb-2 font-mono text-[11px] font-semibold uppercase tracking-wider text-muted">
                Phòng Mô phỏng Tương tác
              </div>
              <div className="grid gap-1.5 sm:grid-cols-2">
                {results.sims.map((m) => (
                  <button
                    key={m.member_number}
                    type="button"
                    onClick={() => navigate(`/mo-phong?member=${m.member_number}`)}
                    className="flex cursor-pointer items-center justify-between gap-2 rounded-md border border-hairline bg-subtle px-3 py-2 text-left transition-colors hover:border-accent hover:bg-canvas"
                  >
                    <div className="min-w-0">
                      <div className="font-semibold text-ink">
                        0{m.member_number} · {m.display_name}
                      </div>
                      <div className="truncate text-[11px] text-muted">{m.device}</div>
                    </div>
                    <Terminal className="h-3.5 w-3.5 shrink-0 text-accent" aria-hidden="true" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Commands */}
          {results.commands.length > 0 && (
            <div>
              <div className="mb-2 font-mono text-[11px] font-semibold uppercase tracking-wider text-muted">
                Câu lệnh CLI (Tự động điền biến môi trường)
              </div>
              <div className="space-y-1.5">
                {results.commands.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between gap-2 rounded-md border border-hairline bg-canvas p-2.5"
                  >
                    <button
                      type="button"
                      onClick={() =>
                        navigate(`/thanh-vien/${c.memberNumber}#step-${c.stepId}`)
                      }
                      className="min-w-0 flex-1 cursor-pointer text-left"
                    >
                      <div className="font-semibold text-ink">
                        [{memberNameByNum[c.memberNumber]}] {c.label}
                      </div>
                      <div className="mt-0.5 truncate font-mono text-[11px] text-muted">
                        {c.command.split("\n")[0]}
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCopyCmd(c.id, c.command)}
                      className="inline-flex shrink-0 cursor-pointer items-center gap-1 rounded border border-hairline bg-subtle px-2 py-1 font-mono text-[11px] font-medium text-ink hover:bg-surface"
                    >
                      {copiedId === c.id ? (
                        <>
                          <Check className="h-3 w-3 text-emerald-600" aria-hidden="true" />
                          <span>Đã copy</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3" aria-hidden="true" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Steps */}
          {results.steps.length > 0 && (
            <div>
              <div className="mb-2 font-mono text-[11px] font-semibold uppercase tracking-wider text-muted">
                Các Bước Thực hành Kịch bản
              </div>
              <div className="space-y-1">
                {results.steps.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => navigate(`/thanh-vien/${s.member_number}#step-${s.id}`)}
                    className="flex w-full cursor-pointer items-center justify-between gap-2 rounded-md px-2.5 py-2 text-left transition-colors hover:bg-subtle"
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <FileText className="h-3.5 w-3.5 shrink-0 text-muted" aria-hidden="true" />
                      <div className="min-w-0">
                        <div className="truncate font-medium text-ink">{s.title}</div>
                        <div className="font-mono text-[11px] text-muted">
                          {memberNameByNum[s.member_number]} · Bước 0{s.step_order} · {s.poc_ref}
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted" aria-hidden="true" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Vulnerabilities */}
          {results.vulns.length > 0 && (
            <div>
              <div className="mb-2 font-mono text-[11px] font-semibold uppercase tracking-wider text-muted">
                Danh mục CWE &amp; CVSS v3.1
              </div>
              <div className="space-y-1">
                {results.vulns.map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => navigate("/#cwe-matrix")}
                    className="flex w-full cursor-pointer items-center justify-between gap-2 rounded-md px-2.5 py-2 text-left transition-colors hover:bg-subtle"
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <ShieldAlert className="h-3.5 w-3.5 shrink-0 text-rose-500" aria-hidden="true" />
                      <div className="min-w-0">
                        <div className="truncate font-medium text-ink">
                          <span className="font-mono font-bold">{v.cwe_id}</span> · {v.title}
                        </div>
                        <div className="font-mono text-[11px] text-muted">
                          CVSS {v.cvss_score} ({v.severity}) · {v.poc_ref}
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted" aria-hidden="true" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {results.sims.length === 0 &&
            results.steps.length === 0 &&
            results.commands.length === 0 &&
            results.vulns.length === 0 && (
              <div className="py-8 text-center text-muted">
                Không tìm thấy kết quả phù hợp cho &quot;{query}&quot;.
              </div>
            )}
        </div>

        {/* Footer Hints */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-hairline bg-subtle px-4 py-2 font-mono text-[11px] text-muted">
          <span>Gợi ý: thử gõ &quot;sqlmap&quot;, &quot;localtest.me&quot;, &quot;CWE-89&quot;, &quot;bcrypt&quot;</span>
          <span>ESC để đóng</span>
        </div>
      </div>
    </div>
  );
}
