"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bell,
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  Terminal,
  Unlock,
} from "lucide-react";
import {
  type PortalDriverCommand,
  StudentPortalEmulator,
} from "@/components/simulators/StudentPortalEmulator";
import { WindowControls } from "@/components/WindowBar";
import type { PortalSecurityMode, WafMode } from "@/lib/miniWafEngine";

export interface ScenarioStageSpec {
  id: string;
  beatNumber: 1 | 2 | 3 | 4;
  stageCode: string;
  ownerMember: "Sơn" | "Hùng" | "Quyết" | "Khánh";
  stageTitle: string;
  toastText: string;
  wafMode: WafMode;
  portalMode: PortalSecurityMode;
  ipBanned?: boolean;
  prompt: string;
  command: string;
  outputLines: string[];
  portalDriver?: {
    page: "search" | "login" | "comments" | "download";
    input: string;
  };
  adminEvent: {
    time: string;
    ip: string;
    action: "ALLOWED" | "BLOCKED" | "RATE_LIMITED" | "BANNED" | "INFO";
    detail: string;
  };
  telegramAlert?: string;
}

export const MINI_WAF_SCENARIO_STAGES: ScenarioStageSpec[] = [
  {
    id: "1A",
    beatNumber: 1,
    stageCode: "1A",
    ownerMember: "Sơn",
    stageTitle: "Khởi chạy Proxy & Cô lập mạng Web",
    toastText: "Proxy :8080 hoạt động bình thường",
    wafMode: "OFF",
    portalMode: "VULNERABLE",
    prompt: "son@mini-waf:~/mini-waf-project$",
    command:
      "docker compose up -d && curl -sI http://127.0.0.1:8080/search?q=SV001 | grep -iE 'HTTP|server'",
    outputLines: [
      "[+] Network mini-waf-internal   Created",
      "[+] Container target-student-portal (172.28.0.10:8000) Started",
      "[+] Container mini-waf-proxy (:8080) Started",
      "HTTP/1.1 200 OK",
      "$ curl --connect-timeout 2 http://172.28.0.10:8000/",
      "curl: (28) Connection timed out",
    ],
    portalDriver: { page: "search", input: "SV001" },
    adminEvent: {
      time: "14:00:08",
      ip: "198.51.100.77",
      action: "ALLOWED",
      detail: "GET /search?q=SV001 -> 200 OK",
    },
  },
  {
    id: "1B",
    beatNumber: 1,
    stageCode: "1B",
    ownerMember: "Sơn",
    stageTitle: "SQLi trên nhánh Web chưa vá (WAF OFF)",
    toastText: "CSDL bị khai thác qua SQLi",
    wafMode: "OFF",
    portalMode: "VULNERABLE",
    prompt: "son@mini-waf:~/mini-waf-project$",
    command: "curl -s \"http://127.0.0.1:8080/search?q=%27%20OR%20%271%27%3D%271--\"",
    outputLines: [
      "HTTP/1.1 200 OK",
      "SELECT masv, fullname, class_name, gpa FROM students WHERE fullname LIKE '%' OR '1'='1--%'",
      "SV001 | Nguyen Van An   | GPA 8.8",
      "SV002 | Patrick O'Brien | GPA 9.1",
      "accounts: admin | portal_admin_2026 | role=lecturer",
    ],
    portalDriver: { page: "search", input: "' OR '1'='1--" },
    adminEvent: {
      time: "14:00:26",
      ip: "198.51.100.77",
      action: "INFO",
      detail: "GET /search?q=' OR '1'='1-- -> 200 OK",
    },
  },
  {
    id: "1C",
    beatNumber: 1,
    stageCode: "1C",
    ownerMember: "Sơn",
    stageTitle: "Chuyển Web sang chế độ HARDENED",
    toastText: "Đã chặn đăng nhập bằng Prepared Statement",
    wafMode: "OFF",
    portalMode: "HARDENED",
    prompt: "son@mini-waf:~/mini-waf-project$",
    command:
      "APP_SECURITY_MODE=HARDENED curl -s -X POST http://127.0.0.1:8080/login -d \"user=admin' OR '1'='1--&pass=wrong\"",
    outputLines: [
      "SQL: SELECT id, username, role FROM accounts WHERE username = ? AND password = ?",
      "HTTP/1.1 401 Unauthorized",
    ],
    portalDriver: { page: "login", input: "admin' OR '1'='1--" },
    adminEvent: {
      time: "14:00:44",
      ip: "198.51.100.77",
      action: "INFO",
      detail: "POST /login -> 401 Unauthorized",
    },
  },
  {
    id: "2A",
    beatNumber: 2,
    stageCode: "2A",
    ownerMember: "Hùng",
    stageTitle: "WAF BLOCKING: Chặn SQLi Comment UN/**/ION",
    toastText: "Đã chặn 403 payload SQLi Comment",
    wafMode: "BLOCKING",
    portalMode: "VULNERABLE",
    prompt: "hung@mini-waf:~/mini-waf-project$",
    command:
      "curl -i \"http://127.0.0.1:8080/search?q=1%27%20UN/**/ION%20SEL/**/ECT%201,2--\"",
    outputLines: [
      "[normalizer] collapsed: 1' union select 1,2--",
      "[sqli] Matched SQL-01 (+2), SQL-03 (+6), SQL-05 (+6) | Score = 14",
      "HTTP/1.1 403 Forbidden",
    ],
    portalDriver: { page: "search", input: "1' UN/**/ION SEL/**/ECT 1,2--" },
    adminEvent: {
      time: "14:01:10",
      ip: "198.51.100.77",
      action: "BLOCKED",
      detail: "[SQL-01, SQL-03, SQL-05] Score=14 -> /search",
    },
    telegramAlert: "[ALERT] Blocked SQLi 198.51.100.77 (Score 14)",
  },
  {
    id: "2B",
    beatNumber: 2,
    stageCode: "2B",
    ownerMember: "Hùng",
    stageTitle: "Chặn Double URL & Stored XSS",
    toastText: "Đã chặn 403 mã hóa XSS",
    wafMode: "BLOCKING",
    portalMode: "VULNERABLE",
    prompt: "hung@mini-waf:~/mini-waf-project$",
    command:
      "curl -i \"http://127.0.0.1:8080/comments?msg=%26lt%3Bimg%20src%3Dx%20onerror%3Dalert(1)%26gt%3B\"",
    outputLines: [
      "[normalizer] decoded: <img src=x onerror=alert(1)>",
      "[xss] Matched XSS-01 (+5)",
      "HTTP/1.1 403 Forbidden",
    ],
    portalDriver: { page: "comments", input: "<img src=x onerror=alert(1)>" },
    adminEvent: {
      time: "14:01:32",
      ip: "198.51.100.77",
      action: "BLOCKED",
      detail: "[XSS-01] Score=5 -> /comments",
    },
  },
  {
    id: "2C",
    beatNumber: 2,
    stageCode: "2C",
    ownerMember: "Hùng",
    stageTitle: "Chặn Path Traversal ....//etc/passwd",
    toastText: "Đã chặn 403 truy cập tệp hệ thống",
    wafMode: "BLOCKING",
    portalMode: "VULNERABLE",
    prompt: "hung@mini-waf:~/mini-waf-project$",
    command:
      "curl -i \"http://127.0.0.1:8080/download?file=....//....//etc/passwd\"",
    outputLines: [
      "[traversal] collapsed: ../../etc/passwd",
      "[traversal] Matched LFI-01 (+5)",
      "HTTP/1.1 403 Forbidden",
    ],
    portalDriver: { page: "download", input: "....//....//etc/passwd" },
    adminEvent: {
      time: "14:01:55",
      ip: "198.51.100.77",
      action: "BLOCKED",
      detail: "[LFI-01] Score=5 -> /download",
    },
  },
  {
    id: "3A",
    beatNumber: 3,
    stageCode: "3A",
    ownerMember: "Quyết",
    stageTitle: "Sliding Window Rate Limit & Anti-Spoof XFF",
    toastText: "Giới hạn tần suất 429 Too Many Requests",
    wafMode: "BLOCKING",
    portalMode: "VULNERABLE",
    prompt: "quyet@mini-waf:~/mini-waf-project$",
    command:
      "for i in $(seq 1 32); do curl -s -o /dev/null -w \"%{http_code} \" -H \"X-Forwarded-For: 10.0.0.$i\" http://127.0.0.1:8080/search?q=SV001; done",
    outputLines: [
      "[client_ip] Peer 203.0.113.9 (ignored untrusted XFF)",
      "Req #01..#30 -> 200 OK (30/30)",
      "Req #31..#32 -> HTTP 429 Too Many Requests | Retry-After: 59s",
    ],
    portalDriver: { page: "search", input: "SV001" },
    adminEvent: {
      time: "14:02:18",
      ip: "203.0.113.9",
      action: "RATE_LIMITED",
      detail: "31/30 req/60s -> HTTP 429",
    },
    telegramAlert: "[ALERT] Rate Limit 203.0.113.9 -> HTTP 429",
  },
  {
    id: "3B",
    beatNumber: 3,
    stageCode: "3B",
    ownerMember: "Quyết",
    stageTitle: "Auto-Ban 300s & Che dữ liệu nhạy cảm",
    toastText: "Đã khóa IP 203.0.113.9 trong 300s",
    wafMode: "BLOCKING",
    portalMode: "VULNERABLE",
    ipBanned: true,
    prompt: "quyet@mini-waf:~/mini-waf-project$",
    command:
      "curl -i -X POST http://127.0.0.1:8080/login -H \"Authorization: Bearer eyJhbGci...\" -d \"user=admin'--&pass=SuperSecret99\"",
    outputLines: [
      "[blacklist] Auto-Ban 203.0.113.9 (TTL 300s)",
      "[logger] Bearer ***MASKED*** | pass=***MASKED***",
      "HTTP/1.1 403 Forbidden [BAN-403]",
    ],
    portalDriver: { page: "login", input: "admin'--" },
    adminEvent: {
      time: "14:02:40",
      ip: "203.0.113.9",
      action: "BANNED",
      detail: "TTL 300s | pass=***MASKED***",
    },
    telegramAlert: "[BAN] IP 203.0.113.9 blocked 300s",
  },
  {
    id: "3C",
    beatNumber: 3,
    stageCode: "3C",
    ownerMember: "Quyết",
    stageTitle: "Mở khóa IP & Kiểm tra họ tên O'Brien",
    toastText: "Đã mở khóa IP và cho qua O'Brien",
    wafMode: "BLOCKING",
    portalMode: "VULNERABLE",
    ipBanned: false,
    prompt: "quyet@mini-waf:~/mini-waf-project$",
    command:
      "curl -s -X POST http://127.0.0.1:8888/api/unban/203.0.113.9 && curl -i \"http://127.0.0.1:8080/search?q=O%27Brien\"",
    outputLines: [
      "Unbanned 203.0.113.9",
      "[sqli] q=\"O'Brien\" -> SQL-01 (+2) < Threshold 5 -> ALLOWED",
      "HTTP/1.1 200 OK -> SV002 | Patrick O'Brien | GPA 9.1",
    ],
    portalDriver: { page: "search", input: "O'Brien" },
    adminEvent: {
      time: "14:03:02",
      ip: "203.0.113.9",
      action: "ALLOWED",
      detail: "GET /search?q=O'Brien -> Score=2 -> 200 OK",
    },
  },
  {
    id: "4A",
    beatNumber: 4,
    stageCode: "4A",
    ownerMember: "Khánh",
    stageTitle: "Kiểm thử SQLMap qua Reverse Proxy",
    toastText: "SQLMap bị chặn toàn bộ (403)",
    wafMode: "BLOCKING",
    portalMode: "VULNERABLE",
    prompt: "khanh@mini-waf:~/mini-waf-project$",
    command:
      "sqlmap -u \"http://127.0.0.1:8080/search?q=SV001\" --batch --dbs",
    outputLines: [
      "[*] starting SQLMap against http://127.0.0.1:8080/search?q=SV001",
      "[WARNING] HTTP 403 (Forbidden) - 18/18 payloads",
      "[CRITICAL] all tested parameters do not appear to be injectable.",
    ],
    portalDriver: { page: "search", input: "' UNION SELECT sql,2,3,4 FROM sqlite_master--" },
    adminEvent: {
      time: "14:03:25",
      ip: "198.51.100.77",
      action: "BLOCKED",
      detail: "[SCN-01, SQL-03, SQL-05] SQLMap blocked (18/18)",
    },
  },
  {
    id: "4B",
    beatNumber: 4,
    stageCode: "4B",
    ownerMember: "Khánh",
    stageTitle: "Bộ kiểm thử tự động Pytest (13/13)",
    toastText: "13/13 Pytest đạt chuẩn",
    wafMode: "BLOCKING",
    portalMode: "HARDENED",
    prompt: "khanh@mini-waf:~/mini-waf-project$",
    command: ".venv/bin/pytest -v tests/",
    outputLines: [
      "tests/test_defense.py (4/4)  PASSED",
      "tests/test_proxy.py   (2/2)  PASSED",
      "tests/test_sqli.py    (4/4)  PASSED",
      "tests/test_xss.py     (3/3)  PASSED",
      "=== 13 passed in 0.40s ===",
    ],
    portalDriver: { page: "comments", input: "5 < 10 va gpa > 8.0" },
    adminEvent: {
      time: "14:03:48",
      ip: "127.0.0.1",
      action: "INFO",
      detail: "pytest: 13 passed in 0.40s",
    },
  },
  {
    id: "4C",
    beatNumber: 4,
    stageCode: "4C",
    ownerMember: "Khánh",
    stageTitle: "Benchmark 100 mẫu (Precision / Recall / Latency)",
    toastText: "F1 100%, p95 latency 2.16ms",
    wafMode: "BLOCKING",
    portalMode: "HARDENED",
    prompt: "khanh@mini-waf:~/mini-waf-project$",
    command: "python3 -m tests.benchmark",
    outputLines: [
      "Dataset: 100 samples x 3 iterations (300 requests)",
      "TP = 50 | FP = 0 | TN = 50 | FN = 0",
      "Precision = 100.00% | Recall = 100.00% | FPR = 0.00% | F1 = 100.00%",
      "OFF Mean = 0.928 ms | BLOCKING Mean = 1.637 ms (+0.709 ms) | p95 = 2.160 ms",
    ],
    adminEvent: {
      time: "14:04:10",
      ip: "127.0.0.1",
      action: "INFO",
      detail: "F1=100.00% | FPR=0.00% | p95=2.160ms",
    },
  },
];

interface MiniWafScenarioPlayerProps {
  initialBeat?: number;
  onSyncTopology?: (state: { wafMode: WafMode; portalMode: PortalSecurityMode }) => void;
}

export function MiniWafScenarioPlayer({
  initialBeat,
  onSyncTopology,
}: MiniWafScenarioPlayerProps) {
  const [memberFilter, setMemberFilter] = useState<"ALL" | "Sơn" | "Hùng" | "Quyết" | "Khánh">("ALL");
  const [paceMode, setPaceMode] = useState<"slow" | "normal">("slow");
  const [activeIdx, setActiveIdx] = useState<number>(0);

  const [status, setStatus] = useState<"idle" | "typing" | "streaming" | "paused" | "done">("idle");
  const [autoSequence, setAutoSequence] = useState(false);
  const [typedChars, setTypedChars] = useState(0);
  const [shownLines, setShownLines] = useState(0);
  const [portalCommand, setPortalCommand] = useState<PortalDriverCommand | null>(null);
  const cmdCounterRef = useRef(0);

  const visibleStages = useMemo(() => {
    if (memberFilter === "ALL") return MINI_WAF_SCENARIO_STAGES;
    return MINI_WAF_SCENARIO_STAGES.filter((s) => s.ownerMember === memberFilter);
  }, [memberFilter]);

  const currentStage = visibleStages[activeIdx] ?? MINI_WAF_SCENARIO_STAGES[0];
  const latestSyncRef = useRef(onSyncTopology);
  useEffect(() => {
    latestSyncRef.current = onSyncTopology;
  });

  useEffect(() => {
    if (!initialBeat || initialBeat < 1 || initialBeat > 4) return;
    setMemberFilter("ALL");
    const targetIdx = MINI_WAF_SCENARIO_STAGES.findIndex((s) => s.beatNumber === initialBeat);
    if (targetIdx >= 0) {
      setActiveIdx(targetIdx);
      setStatus("idle");
      setAutoSequence(false);
      setTypedChars(0);
      setShownLines(0);
    }
  }, [initialBeat]);

  const triggerPortalDriver = (stage: ScenarioStageSpec) => {
    if (!stage.portalDriver) return;
    cmdCounterRef.current += 1;
    setPortalCommand({
      id: cmdCounterRef.current,
      page: stage.portalDriver.page,
      input: stage.portalDriver.input,
    });
  };

  useEffect(() => {
    if (status === "streaming" && shownLines === 0) {
      latestSyncRef.current?.({
        wafMode: currentStage.wafMode,
        portalMode: currentStage.portalMode,
      });
      triggerPortalDriver(currentStage);
    }
  }, [status, shownLines, currentStage]);

  useEffect(() => {
    if (status !== "typing") return;
    const cmdLen = currentStage.command.length;
    if (typedChars >= cmdLen) {
      const waitMs = paceMode === "slow" ? 260 : 110;
      const t = setTimeout(() => setStatus("streaming"), waitMs);
      return () => clearTimeout(t);
    }
    const charMs = paceMode === "slow" ? 36 : 16;
    const t = setTimeout(() => setTypedChars((n) => n + 1), charMs);
    return () => clearTimeout(t);
  }, [status, typedChars, currentStage.command.length, paceMode]);

  useEffect(() => {
    if (status !== "streaming") return;
    const total = currentStage.outputLines.length;
    if (shownLines >= total) {
      setStatus("done");
      return;
    }
    const lineMs = paceMode === "slow" ? 240 : 100;
    const t = setTimeout(() => setShownLines((n) => n + 1), lineMs);
    return () => clearTimeout(t);
  }, [status, shownLines, currentStage.outputLines.length, paceMode]);

  useEffect(() => {
    if (status !== "done" || !autoSequence) return;
    if (activeIdx + 1 >= visibleStages.length) {
      setAutoSequence(false);
      return;
    }
    const dwellMs = paceMode === "slow" ? 2200 : 1200;
    const t = setTimeout(() => {
      const next = activeIdx + 1;
      setActiveIdx(next);
      setTypedChars(0);
      setShownLines(0);
      setStatus("typing");
    }, dwellMs);
    return () => clearTimeout(t);
  }, [status, autoSequence, activeIdx, visibleStages.length, paceMode]);

  const startStage = (idx: number, withAutoSeq: boolean) => {
    const safeIdx = Math.max(0, Math.min(idx, visibleStages.length - 1));
    const stage = visibleStages[safeIdx];
    latestSyncRef.current?.({ wafMode: stage.wafMode, portalMode: stage.portalMode });
    setActiveIdx(safeIdx);
    setTypedChars(0);
    setShownLines(0);
    setAutoSequence(withAutoSeq);
    setStatus("typing");
  };

  const selectStageQuietly = (idx: number) => {
    const safeIdx = Math.max(0, Math.min(idx, visibleStages.length - 1));
    const stage = visibleStages[safeIdx];
    latestSyncRef.current?.({ wafMode: stage.wafMode, portalMode: stage.portalMode });
    setActiveIdx(safeIdx);
    setTypedChars(0);
    setShownLines(0);
    setAutoSequence(false);
    setStatus("idle");
  };

  const togglePause = () => {
    if (status === "typing" || status === "streaming") {
      setAutoSequence(false);
      setStatus("paused");
    } else if (status === "paused") {
      setStatus(typedChars < currentStage.command.length ? "typing" : "streaming");
    }
  };

  const resetAll = () => {
    setAutoSequence(false);
    setStatus("idle");
    setTypedChars(0);
    setShownLines(0);
    setPortalCommand(null);
  };

  const visibleCmd =
    status === "idle" && typedChars === 0
      ? ""
      : currentStage.command.slice(0, typedChars);
  const renderedLines = currentStage.outputLines.slice(0, shownLines);

  return (
    <div className="space-y-3">
      {/* Compact Execution Controls */}
      <div className="rounded-lg border border-hairline bg-subtle p-3 space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            {(["ALL", "Sơn", "Hùng", "Quyết", "Khánh"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => {
                  setMemberFilter(m);
                  setActiveIdx(0);
                  setAutoSequence(false);
                  setStatus("idle");
                  setTypedChars(0);
                  setShownLines(0);
                }}
                className={`cursor-pointer rounded border px-2.5 py-1 font-mono text-[11px] font-semibold transition-colors ${
                  memberFilter === m
                    ? "border-accent bg-accent text-white"
                    : "border-hairline bg-surface text-muted hover:text-ink"
                }`}
              >
                {m === "ALL" ? "Tất cả" : m}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <div className="inline-flex rounded border border-hairline bg-surface p-0.5 font-mono text-[11px]">
              {(["slow", "normal"] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPaceMode(p)}
                  className={`cursor-pointer rounded px-2 py-0.5 font-semibold ${
                    paceMode === p ? "bg-accent text-white" : "text-muted hover:text-ink"
                  }`}
                >
                  {p === "slow" ? "1x" : "2x"}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => startStage(activeIdx, false)}
              className="inline-flex cursor-pointer items-center gap-1 rounded bg-ink px-3 py-1.5 font-mono text-xs font-semibold text-canvas hover:opacity-90"
            >
              <Play className="h-3.5 w-3.5" aria-hidden="true" />
              Chạy {currentStage.stageCode}
            </button>
            <button
              type="button"
              onClick={() =>
                startStage(
                  status === "done" ? Math.min(activeIdx + 1, visibleStages.length - 1) : activeIdx,
                  true
                )
              }
              className="inline-flex cursor-pointer items-center gap-1 rounded border border-accent bg-accent/10 px-2.5 py-1.5 font-mono text-xs font-semibold text-accent hover:bg-accent/20"
            >
              <Play className="h-3.5 w-3.5" aria-hidden="true" />
              Tự động
            </button>
            {(status === "typing" || status === "streaming" || status === "paused") && (
              <button
                type="button"
                onClick={togglePause}
                className="inline-flex cursor-pointer items-center gap-1 rounded border border-amber-500/40 bg-amber-500/10 px-2.5 py-1.5 font-mono text-xs font-semibold text-amber-400 hover:bg-amber-500/20"
              >
                {status === "paused" ? (
                  <>
                    <Play className="h-3.5 w-3.5" aria-hidden="true" />
                    Tiếp tục
                  </>
                ) : (
                  <>
                    <Pause className="h-3.5 w-3.5" aria-hidden="true" />
                    Tạm dừng
                  </>
                )}
              </button>
            )}
            <button
              type="button"
              onClick={resetAll}
              className="inline-flex cursor-pointer items-center gap-1 rounded border border-hairline bg-surface px-2.5 py-1.5 font-mono text-xs font-semibold text-muted hover:text-ink"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              Đặt lại
            </button>
          </div>
        </div>

        {/* Step Pills */}
        <div className="flex flex-wrap gap-1.5 border-t border-hairline pt-2">
          {visibleStages.map((s, idx) => {
            const isCurrent = idx === activeIdx;
            const isDone = idx < activeIdx || (isCurrent && status === "done");
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => selectStageQuietly(idx)}
                className={`cursor-pointer rounded border px-2 py-0.5 font-mono text-[11px] font-semibold transition-colors ${
                  isCurrent
                    ? "border-accent bg-accent text-white"
                    : isDone
                    ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-500"
                    : "border-hairline bg-surface text-muted hover:text-ink"
                }`}
                title={s.stageTitle}
              >
                {s.stageCode}
              </button>
            );
          })}
        </div>
      </div>

      {/* Compact Current Operation Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-hairline bg-surface px-3.5 py-2 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono font-bold text-accent">[{currentStage.stageCode}]</span>
          <span className="font-semibold text-ink">{currentStage.stageTitle}</span>
          {status === "done" && (
            <span className="rounded bg-emerald-500/15 px-2 py-0.5 font-mono text-[11px] font-medium text-emerald-600 dark:text-emerald-300">
              {currentStage.toastText}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            disabled={activeIdx <= 0}
            onClick={() => selectStageQuietly(activeIdx - 1)}
            className="inline-flex cursor-pointer items-center gap-1 rounded border border-hairline bg-subtle px-2.5 py-1 font-mono text-[11px] font-semibold text-ink disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" />
            Trước
          </button>
          <button
            type="button"
            disabled={activeIdx >= visibleStages.length - 1}
            onClick={() => startStage(activeIdx + 1, false)}
            className="inline-flex cursor-pointer items-center gap-1 rounded bg-accent px-2.5 py-1 font-mono text-[11px] font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            Tiếp
            <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Dual Stage: Live Web UI + Terminal & Admin Monitor */}
      <div className="grid gap-4 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <StudentPortalEmulator
            wafMode={currentStage.wafMode}
            portalMode={currentStage.portalMode}
            ipBanned={Boolean(currentStage.ipBanned)}
            externalCommand={portalCommand}
          />
        </div>

        <div className="lg:col-span-5 space-y-3">
          {/* CLI Terminal */}
          <div className="rounded-lg border border-zinc-800 bg-[#0d1117] p-3.5 font-mono text-xs text-zinc-200">
            <div className="mb-2.5 flex items-center justify-between border-b border-zinc-800 pb-2">
              <div className="flex items-center gap-2">
                <WindowControls onClose={resetAll} closeTitle="Xóa phiên Terminal" />
                <span className="inline-flex items-center gap-1 font-semibold text-zinc-300">
                  <Terminal className="h-3 w-3 text-sky-400" aria-hidden="true" />
                  Terminal
                </span>
              </div>
              {status !== "idle" && (
                <span
                  className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                    status === "paused"
                      ? "bg-amber-500/20 text-amber-300"
                      : status === "done"
                      ? "bg-emerald-500/20 text-emerald-300"
                      : "bg-sky-500/20 text-sky-300"
                  }`}
                >
                  {status === "paused" ? "Tạm dừng" : status === "done" ? "Xong" : "Đang chạy"}
                </span>
              )}
            </div>

            <div className="min-h-[190px] space-y-2 leading-relaxed">
              <div>
                <span className="text-emerald-400">{currentStage.prompt}</span>{" "}
                <span className="text-white break-all">{visibleCmd}</span>
                {(status === "idle" || status === "typing" || status === "paused") && (
                  <span className="ml-0.5 inline-block h-3.5 w-1.5 animate-pulse bg-zinc-200 align-middle" />
                )}
              </div>

              {renderedLines.length > 0 && (
                <div className="space-y-1 border-l-2 border-zinc-700 pl-2.5 text-[11px]">
                  {renderedLines.map((line, i) => (
                    <div
                      key={i}
                      className={
                        line.includes("403") || line.includes("CRITICAL") || line.includes("Auto-Ban")
                          ? "text-rose-400"
                          : line.includes("429") || line.includes("WARNING")
                          ? "text-amber-300"
                          : line.includes("PASSED") || line.includes("200 OK") || line.includes("100.00%")
                          ? "text-emerald-400"
                          : "text-zinc-300"
                      }
                    >
                      {line}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Admin :8888 Monitor */}
          <div className="rounded-lg border border-hairline bg-surface p-3 text-xs space-y-2">
            <div className="flex items-center justify-between border-b border-hairline pb-1.5 font-mono text-[11px]">
              <span className="font-semibold text-ink">Admin :8888</span>
              <span
                className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                  currentStage.wafMode === "BLOCKING"
                    ? "bg-emerald-500/15 text-emerald-500"
                    : currentStage.wafMode === "OFF"
                    ? "bg-rose-500/15 text-rose-500"
                    : "bg-amber-500/15 text-amber-500"
                }`}
              >
                WAF: {currentStage.wafMode}
              </span>
            </div>

            {status === "streaming" || status === "done" ? (
              <div className="space-y-2 font-mono text-[11px]">
                <div className="rounded border border-hairline bg-subtle p-2">
                  <div className="flex items-center justify-between">
                    <span className="text-muted">
                      [{currentStage.adminEvent.time}] {currentStage.adminEvent.ip}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 font-bold ${
                        currentStage.adminEvent.action === "BLOCKED" ||
                        currentStage.adminEvent.action === "BANNED"
                          ? "text-rose-500"
                          : currentStage.adminEvent.action === "RATE_LIMITED"
                          ? "text-amber-500"
                          : "text-emerald-500"
                      }`}
                    >
                      {currentStage.adminEvent.action === "ALLOWED" ? (
                        <ShieldCheck className="h-3 w-3" aria-hidden="true" />
                      ) : (
                        <ShieldAlert className="h-3 w-3" aria-hidden="true" />
                      )}
                      {currentStage.adminEvent.action}
                    </span>
                  </div>
                  <div className="mt-1 text-secondary break-all">
                    {currentStage.adminEvent.detail}
                  </div>
                </div>

                {currentStage.ipBanned && (
                  <div className="flex items-center justify-between rounded border border-rose-500/30 bg-rose-500/10 px-2.5 py-1.5 text-rose-500">
                    <span>Blacklist: 203.0.113.9 (300s)</span>
                    <span className="inline-flex items-center gap-1 font-semibold">
                      <Unlock className="h-3 w-3" aria-hidden="true" />
                      Locked
                    </span>
                  </div>
                )}

                {currentStage.telegramAlert && (
                  <div className="flex items-start gap-1.5 rounded border border-sky-500/30 bg-sky-500/10 p-2 text-sky-400">
                    <Bell className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    <span>{currentStage.telegramAlert}</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-2 font-mono text-[11px] text-muted">
                Chưa có sự kiện.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
