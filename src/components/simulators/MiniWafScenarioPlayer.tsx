"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Pause,
  Play,
  RotateCcw,
  Shield,
  ShieldAlert,
  ShieldCheck,
  SkipForward,
  Terminal,
  UserCheck,
} from "lucide-react";
import { WindowControls } from "@/components/WindowBar";

export interface ScenarioBeatSpec {
  id: string;
  beatNumber: 1 | 2 | 3 | 4;
  ownerLabel: string;
  ownerMember: 1 | 2 | 3 | 4;
  title: string;
  filesOwned: string;
  initialState: {
    wafMode: "OFF" | "MONITOR" | "BLOCKING";
    portalMode: "VULNERABLE" | "HARDENED";
    backendExposed: boolean;
    bannedIp: string | null;
    telegramCount: number;
    backendHitsDelta: number;
  };
  afterState: {
    wafMode: "OFF" | "MONITOR" | "BLOCKING";
    portalMode: "VULNERABLE" | "HARDENED";
    backendExposed: boolean;
    bannedIp: string | null;
    telegramCount: number;
    backendHitsDelta: number;
  };
  terminalOs: "macOS (zsh)" | "Ubuntu VM (bash)";
  prompt: string;
  command: string;
  streamOutput: string[];
  httpResponsePreview: string;
  defenseTalkingPoint: string;
}

export const MINI_WAF_SCENARIO_BEATS: ScenarioBeatSpec[] = [
  {
    id: "beat-1",
    beatNumber: 1,
    ownerLabel: "Nhịp 1 · Sơn & Khánh",
    ownerMember: 1,
    title: "Cô lập Cổng 8000, Chứng minh Lỗ hổng Gốc (WAF OFF · VULNERABLE) & Đối chứng HARDENED",
    filesOwned: "target_web/, waf/main.py, proxy/server.py, proxy/forward.py, docker-compose.yml",
    initialState: {
      wafMode: "OFF",
      portalMode: "VULNERABLE",
      backendExposed: false,
      bannedIp: null,
      telegramCount: 0,
      backendHitsDelta: 0,
    },
    afterState: {
      wafMode: "OFF",
      portalMode: "VULNERABLE",
      backendExposed: false,
      bannedIp: null,
      telegramCount: 0,
      backendHitsDelta: 14,
    },
    terminalOs: "macOS (zsh)",
    prompt: "son@macbook:~/mini-waf-project$",
    command:
      "docker ps --format '{{.Names}}\\t{{.Ports}}' && nmap -sV -p 8080,8000 127.0.0.1 && sqlmap -u \"http://127.0.0.1:8080/grades?masv=SV001\" --dump --batch",
    streamOutput: [
      "miniwaf-proxy       0.0.0.0:8080->8080/tcp, 127.0.0.1:8888->8888/tcp",
      "miniwaf-target-web  8000/tcp   (Mạng nội bộ backend_net: internal=true — KHÔNG lộ port ra Host)",
      "",
      "PORT     STATE    SERVICE",
      "8080/tcp open     http    Mini-WAF Reverse Proxy",
      "8000/tcp closed   irdmi   (Không thể truy cập trực tiếp từ bên ngoài!)",
      "",
      "[INFO] Testing GET parameter 'masv' via Proxy (WAF_MODE=OFF | target_web=VULNERABLE)...",
      "[INFO] Backend SQLite payload confirmed: masv=SV001' UNION SELECT username,password,role,1 FROM accounts--",
      "Table: accounts | Records dumped: 2",
      "| admin | portal_admin_2026 | lecturer |",
      "| sv001 | student123        | student  |",
      "",
      "[Đối chứng HARDENED] Khi bật APP_SECURITY_MODE=HARDENED (Prepared Statement ?):",
      "curl -s \"http://127.0.0.1:8080/grades?masv=1'\" -> {\"query\":\"1'\",\"count\":0,\"students\":[]} (0 lỗi SQL)",
    ],
    httpResponsePreview: `HTTP/1.1 200 OK (WAF=OFF · target_web=VULNERABLE)
Server: StudentPortal-Apache-Dev/2.4.25 (Debian)
X-Powered-By: Python-Legacy/3.11
Set-Cookie: portal_session=demo-session-token   <-- Chưa có HttpOnly; SameSite=Lax

[{"masv":"SV001","fullname":"Nguyen Van An",...}, ("admin","portal_admin_2026")]`,
    defenseTalkingPoint:
      "Sơn giải thích 2 lớp: (1) Container target_web (:8000) nằm trong backend_net: internal=true nên không mở cổng ra Host; (2) Web demo có 2 chế độ VULNERABLE vs HARDENED giúp chứng minh khi WAF tắt, code nối chuỗi bị SQLMap trích xuất dữ liệu ngay, còn bật HARDENED (Prepared Statements + Output Escaping + Path Sandbox) sẽ chặn được ngay trong lõi ứng dụng.",
  },
  {
    id: "beat-2",
    beatNumber: 2,
    ownerLabel: "Nhịp 2 · Sơn & Quyết",
    ownerMember: 3,
    title: "Bật Mini-WAF BLOCKING, Chặn SQLMap, Sliding Window 429 & Auto-Ban + Telegram",
    filesOwned: "protection/rate_limit.py, blacklist.py, decision.py, database/, monitoring/",
    initialState: {
      wafMode: "BLOCKING",
      portalMode: "VULNERABLE",
      backendExposed: false,
      bannedIp: null,
      telegramCount: 0,
      backendHitsDelta: 0,
    },
    afterState: {
      wafMode: "BLOCKING",
      portalMode: "VULNERABLE",
      backendExposed: false,
      bannedIp: "198.51.100.77",
      telegramCount: 3,
      backendHitsDelta: 0,
    },
    terminalOs: "Ubuntu VM (bash)",
    prompt: "quyet@ubuntu-vm2:~/mini-waf-project$",
    command:
      "curl -s -X POST http://127.0.0.1:8888/api/mode -H 'X-Admin-Token: miniwaf-admin-2026' -d '{\"mode\":\"BLOCKING\"}' && sqlmap -u \"http://127.0.0.1:8080/grades?masv=SV001\" --dump --batch && curl -i \"http://127.0.0.1:8080/search?q=SV001\"",
    streamOutput: [
      "{\"ok\":true,\"mode\":\"BLOCKING\"}",
      "",
      "[Mini-WAF Inspection] Triggered SCN-01 (+3 UA sqlmap) + SQL-01 (+2) + SQL-03 (+6) => Score 11 >= 5 -> 403 BLOCKED",
      "[CRITICAL] HTTP error 403 Forbidden detected — all tested parameters do not appear injectable.",
      "[!] 0 gói tin độc hại chạm tới target_web (:8000)! Server headers bị xóa tự động.",
      "",
      "[Sliding Window Burst Test] > 30 req/10s (collections.deque):",
      "HTTP/1.1 429 Too Many Requests | Retry-After: 10 | Action: RATE_LIMITED",
      "",
      "[Auto-Ban Tracker] IP 198.51.100.77 chạm ngưỡng 3 lần BLOCKED trong 60s -> Khóa O(1) TTL=300s!",
      "[SQLite WAL] INSERT masked log: masv=***MASKED*** (không lưu password/Cookie thô)",
      "[Telegram Async Task] Đã gửi cảnh báo rút gọn (chỉ gửi Loại, IP, Rule ID, Action).",
    ],
    httpResponsePreview: `HTTP/1.1 403 Forbidden
X-WAF-Protected-By: Mini-WAF-v2
Content-Type: application/json

{"action":"BLOCK","rule_id":"SQL-03","rule_ids":["SCN-01","SQL-01","SQL-03"],"anomaly_score":11,"client_ip":"198.51.100.77"}`,
    defenseTalkingPoint:
      "Quyết giải thích: (1) Sliding Window (deque) vá lỗi đột biến gấp đôi ở ranh giới khung giờ của Fixed Window; (2) Chỉ tin X-Forwarded-For từ proxy tin cậy (TRUSTED_PROXIES) chống giả mạo IP; (3) Log SQLite chế độ WAL che toàn bộ password/Cookie/Bearer (***MASKED***), và Telegram chạy asyncio.create_task chỉ báo siêu dữ liệu để không tăng độ trễ proxy và không làm rò PII.",
  },
  {
    id: "beat-3",
    beatNumber: 3,
    ownerLabel: "Nhịp 3 · Quyết & Hùng",
    ownerMember: 2,
    title: "Unban trên Dashboard :8888, Chặn Bypass (Double Encode / /**/) & Cho qua Tên O'Brien",
    filesOwned: "inspection/parser.py, normalizer.py, sqli.py, xss.py, traversal.py, engine.py",
    initialState: {
      wafMode: "BLOCKING",
      portalMode: "VULNERABLE",
      backendExposed: false,
      bannedIp: "198.51.100.77",
      telegramCount: 3,
      backendHitsDelta: 0,
    },
    afterState: {
      wafMode: "BLOCKING",
      portalMode: "VULNERABLE",
      backendExposed: false,
      bannedIp: null,
      telegramCount: 5,
      backendHitsDelta: 1,
    },
    terminalOs: "Ubuntu VM (bash)",
    prompt: "hung@ubuntu-vm1:~/mini-waf-project$",
    command:
      "curl -s -X POST http://127.0.0.1:8888/api/unban -H 'X-Admin-Token: miniwaf-admin-2026' -d '{\"ip\":\"198.51.100.77\"}' && curl -s -o /dev/null -w \"DoubleEncode:%{http_code} \" \"http://127.0.0.1:8080/search?q=1%2527%2520OR%25201%253D1--\" && curl -s -o /dev/null -w \"CommentSplit:%{http_code} \" \"http://127.0.0.1:8080/search?q=1'%20UN/**/ION%20SEL/**/ECT%201,2--\" && curl -s \"http://127.0.0.1:8080/search?q=O'Brien\"",
    streamOutput: [
      "[Dashboard :8888 Unban] {\"ok\":true,\"ip\":\"198.51.100.77\",\"removed\":true}",
      "",
      "[Probe 1: Double-URL Encoding %2527%2520OR%25201%253D1--]",
      "  normalizer.py pass 1 -> %27%20OR%201%3D1-- | pass 2 -> ' OR 1=1--",
      "  sqli.py -> SQL-01(+2), SQL-02(+5), SQL-05(+6) => Score=13 >= 5 => DoubleEncode:403 BLOCKED",
      "",
      "[Probe 2: SQL Comment Split UN/**/ION SEL/**/ECT]",
      "  normalizer.py collapsed -> 1' union select 1,2--",
      "  sqli.py -> SQL-01(+2), SQL-03(+6), SQL-05(+6) => Score=14 >= 5 => CommentSplit:403 BLOCKED",
      "",
      "[Probe 3: Benign Name Input q=O'Brien]",
      "  sqli.py -> Chi khop SQL-01 (+2) | SQL Lexical Grammar [w'w] => No SQL syntax! (Score=2 < 5)",
      "  => Forward 200 OK tới target_web (:8000) & Hardened Response Headers!",
      "  Body: {\"query\":\"O'Brien\",\"count\":1,\"students\":[{\"masv\":\"SV002\",\"fullname\":\"Patrick O'Brien\",\"gpa\":9.1}]}",
    ],
    httpResponsePreview: `HTTP/1.1 200 OK (q=O'Brien Allowed Cleanly!)
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: no-referrer
X-WAF-Protected-By: Mini-WAF-v2
(Đã xóa Server & X-Powered-By từ máy chủ đích)

{"query":"O'Brien","count":1,"students":[{"masv":"SV002","fullname":"Patrick O'Brien","class_name":"AT19A","gpa":9.1}]}`,
    defenseTalkingPoint:
      "Hùng giải thích cơ chế chống bypass & tránh chặn nhầm: (1) normalizer.py tạo đồng thời bản spaced (tránh SELECT/**/FROM dính chữ) và collapsed (bắt UN/**/ION), giải mã URL tối đa 3 vòng, HTML entity và \u0027 trong JSON; (2) Kết hợp Anomaly Scoring + SQL Lexical Tokenizer giúp phân biệt chính xác tên sinh viên O'Brien (+2 < ngưỡng 5 -> cho qua) với câu SQLi thực thụ (' OR 1=1 -> +7 -> BLOCK).",
  },
  {
    id: "beat-4",
    beatNumber: 4,
    ownerLabel: "Nhịp 4 · Khánh & Sơn",
    ownerMember: 4,
    title: "Chạy 13 Pytest Tự động & Benchmark 100 Mẫu (Precision / Recall / F1 / Mean-Median-p95)",
    filesOwned: "tests/test_sqli.py, tests/test_xss.py, tests/test_proxy.py, tests/benchmark.py, dataset.json",
    initialState: {
      wafMode: "BLOCKING",
      portalMode: "VULNERABLE",
      backendExposed: false,
      bannedIp: null,
      telegramCount: 5,
      backendHitsDelta: 0,
    },
    afterState: {
      wafMode: "BLOCKING",
      portalMode: "HARDENED",
      backendExposed: false,
      bannedIp: null,
      telegramCount: 5,
      backendHitsDelta: 0,
    },
    terminalOs: "Ubuntu VM (bash)",
    prompt: "khanh@ubuntu-vm3:~/mini-waf-project$",
    command:
      ".venv/bin/pytest -v tests/test_sqli.py tests/test_xss.py tests/test_proxy.py tests/test_defense.py && PYTHONPATH=. .venv/bin/python -m tests.benchmark --iterations 3",
    streamOutput: [
      "tests/test_defense.py (4/4)  PASSED · Sliding Window, Auto-Ban TTL, XFF Guard, Masking, Headers",
      "tests/test_proxy.py   (2/2)  PASSED · VULNERABLE vs HARDENED, :8080/:8888 Auth, Unban E2E",
      "tests/test_sqli.py    (4/4)  PASSED · Evasion, HPP, Nested JSON, O'Brien Allow, Soft UA",
      "tests/test_xss.py     (3/3)  PASSED · XSS Tags/Events, Traversal ....//, Math 5 < 10 Allow",
      "============================== 13 passed in 0.38s ==============================",
      "",
      "=== Mini-WAF Benchmark Report (100 samples x 3 iters = 300 req/mode) ===",
      "WAF OFF      : Backend Hits=300 | Mean=0.928ms | Median=0.859ms | p95=1.404ms",
      "WAF MONITOR  : Detected=50/50   | Backend Hits=100 (Detection-only baseline)",
      "WAF BLOCKING : TP=50  FP=0  TN=50  FN=0",
      "               Precision=100.0% | Recall(TPR)=100.0% | FPR=0.0% | F1=100.0%",
      "               Mean=1.637ms | Median=1.693ms | p95=2.160ms | Overhead Delta=+0.709ms",
      "Backend Shielding: Chỉ 150 request hợp lệ đi tới target_web (0 payload độc hại lọt qua!)",
    ],
    httpResponsePreview: `Bảng Kết luận Thực nghiệm & Defense-in-Depth:
1. WAF OFF + VULNERABLE  -> 300/300 chạm backend (Lộ dữ liệu SQLi / XSS / Traversal)
2. WAF BLOCKING (:8080)  -> TPR=100.0% | FPR=0.0% | Precision=100% | F1=100% | Δt=+0.709ms
3. Kết hợp HARDENED code -> Vá ảo tầng biên + Prepared Statements ở DB = Bảo vệ toàn vẹn`,
    defenseTalkingPoint:
      "Khánh chốt phần phản biện khoa học: Không khẳng định WAF bảo vệ 100% tuyệt đối thay cho lập trình an toàn. Nhóm đo độc lập khả năng phát hiện (MONITOR) và ngăn chặn (BLOCKING), chứng minh trên 100 mẫu có nhãn (gồm ca khó O'Brien, D'Angelo, 5 < 10) với đầy đủ TP/FP/TN/FN, Precision/Recall/F1 và mean/median/p95 latency, đồng thời đối chứng trực tiếp khi bật Web target sang chế độ HARDENED.",
  },
];

interface MiniWafScenarioPlayerProps {
  initialBeat?: number;
  onSyncTopology?: (state: {
    wafMode: "OFF" | "MONITOR" | "BLOCKING";
    portalMode: "VULNERABLE" | "HARDENED";
  }) => void;
}

export function MiniWafScenarioPlayer({
  initialBeat,
  onSyncTopology,
}: MiniWafScenarioPlayerProps) {
  const [viewMode, setViewMode] = useState<"beats" | "member">("beats");
  const [memberFilter, setMemberFilter] = useState<1 | 2 | 3 | 4>(1);
  const [selectedBeatIdx, setSelectedBeatIdx] = useState(() => {
    if (initialBeat && initialBeat >= 1 && initialBeat <= 4) return initialBeat - 1;
    return 0;
  });

  const [runPhase, setRunPhase] = useState<"idle" | "typing" | "streaming" | "done">("idle");
  const [isPaused, setIsPaused] = useState(false);
  const [typedChars, setTypedChars] = useState(0);
  const [visibleLines, setVisibleLines] = useState(0);
  const [autoAdvanceQueue, setAutoAdvanceQueue] = useState(false);
  const [completedBeats, setCompletedBeats] = useState<Record<string, boolean>>({});
  const [explainOpen, setExplainOpen] = useState(false);

  const visibleBeats = useMemo(() => {
    if (viewMode === "beats") return MINI_WAF_SCENARIO_BEATS;
    return MINI_WAF_SCENARIO_BEATS.filter((b) => b.ownerMember === memberFilter);
  }, [viewMode, memberFilter]);

  const currentBeat = visibleBeats[selectedBeatIdx] ?? visibleBeats[0];

  const liveTopology =
    runPhase === "done" || runPhase === "streaming"
      ? currentBeat.afterState
      : currentBeat.initialState;

  useEffect(() => {
    if (!initialBeat || initialBeat < 1 || initialBeat > 4) return;
    setSelectedBeatIdx(initialBeat - 1);
  }, [initialBeat]);

  useEffect(() => {
    if (runPhase !== "typing" && runPhase !== "streaming") return;
    if (isPaused) return;

    if (runPhase === "typing") {
      if (typedChars >= currentBeat.command.length) {
        const t = setTimeout(() => setRunPhase("streaming"), 140);
        return () => clearTimeout(t);
      }
      const step = currentBeat.command.length > 130 ? 4 : 2;
      const t = setTimeout(() => {
        const next = Math.min(currentBeat.command.length, typedChars + step);
        setTypedChars(next);
        if (next >= currentBeat.command.length) {
          setRunPhase("streaming");
        }
      }, 24);
      return () => clearTimeout(t);
    }

    if (runPhase === "streaming") {
      if (visibleLines >= currentBeat.streamOutput.length) {
        setRunPhase("done");
        setCompletedBeats((prev) => ({ ...prev, [currentBeat.id]: true }));
        onSyncTopology?.({
          wafMode: currentBeat.afterState.wafMode,
          portalMode: currentBeat.afterState.portalMode,
        });
        return;
      }
      const t = setTimeout(() => {
        const nextLines = Math.min(currentBeat.streamOutput.length, visibleLines + 1);
        setVisibleLines(nextLines);
        if (nextLines >= currentBeat.streamOutput.length) {
          setRunPhase("done");
          setCompletedBeats((prev) => ({ ...prev, [currentBeat.id]: true }));
          onSyncTopology?.({
            wafMode: currentBeat.afterState.wafMode,
            portalMode: currentBeat.afterState.portalMode,
          });
        }
      }, 95);
      return () => clearTimeout(t);
    }
  }, [
    runPhase,
    isPaused,
    typedChars,
    visibleLines,
    currentBeat,
    onSyncTopology,
  ]);

  // Auto-advance between beats when playing full 4-beat continuous demo
  useEffect(() => {
    if (!autoAdvanceQueue || runPhase !== "done" || isPaused) return;
    if (selectedBeatIdx + 1 >= visibleBeats.length) {
      setAutoAdvanceQueue(false);
      return;
    }
    const t = setTimeout(() => {
      const nextIdx = selectedBeatIdx + 1;
      setSelectedBeatIdx(nextIdx);
      setTypedChars(0);
      setVisibleLines(0);
      setRunPhase("typing");
    }, 850);
    return () => clearTimeout(t);
  }, [autoAdvanceQueue, runPhase, isPaused, selectedBeatIdx, visibleBeats.length]);

  const startSingleBeat = (idx: number, continuous = false) => {
    setSelectedBeatIdx(idx);
    setAutoAdvanceQueue(continuous);
    setIsPaused(false);
    setTypedChars(0);
    setVisibleLines(0);
    setRunPhase("typing");
    const target = visibleBeats[idx] ?? visibleBeats[0];
    onSyncTopology?.({
      wafMode: target.initialState.wafMode,
      portalMode: target.initialState.portalMode,
    });
  };

  const progressPct = useMemo(() => {
    if (runPhase === "idle") return 0;
    if (runPhase === "done") return 100;
    if (runPhase === "typing") {
      return Math.min(45, Math.round((typedChars / Math.max(1, currentBeat.command.length)) * 45));
    }
    return Math.min(99, 45 + Math.round((visibleLines / Math.max(1, currentBeat.streamOutput.length)) * 54));
  }, [runPhase, typedChars, currentBeat.command.length, visibleLines, currentBeat.streamOutput.length]);

  return (
    <div className="space-y-4">
      {/* Perspective Switcher: Full 4 Beats vs Individual Member */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-hairline bg-subtle p-3.5">
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded border border-hairline bg-surface p-0.5 text-xs">
            <button
              type="button"
              onClick={() => {
                setViewMode("beats");
                setSelectedBeatIdx(0);
                setRunPhase("idle");
                setTypedChars(0);
                setVisibleLines(0);
                setAutoAdvanceQueue(false);
              }}
              className={`cursor-pointer rounded px-2.5 py-1 font-semibold ${
                viewMode === "beats" ? "bg-ink text-canvas" : "text-muted hover:text-ink"
              }`}
            >
              4 Nhịp Demo Liên hoàn
            </button>
            <button
              type="button"
              onClick={() => {
                setViewMode("member");
                setSelectedBeatIdx(0);
                setRunPhase("idle");
                setTypedChars(0);
                setVisibleLines(0);
                setAutoAdvanceQueue(false);
              }}
              className={`inline-flex cursor-pointer items-center gap-1 rounded px-2.5 py-1 font-semibold ${
                viewMode === "member" ? "bg-accent text-white" : "text-muted hover:text-ink"
              }`}
            >
              <UserCheck className="h-3.5 w-3.5" aria-hidden="true" />
              Theo Thành viên Cá nhân
            </button>
          </div>

          {viewMode === "member" && (
            <div className="inline-flex rounded border border-hairline bg-surface p-0.5 font-mono text-xs">
              {[
                { num: 1 as const, name: "1. Sơn" },
                { num: 2 as const, name: "2. Hùng" },
                { num: 3 as const, name: "3. Quyết" },
                { num: 4 as const, name: "4. Khánh" },
              ].map((m) => (
                <button
                  key={m.num}
                  type="button"
                  onClick={() => {
                    setMemberFilter(m.num);
                    setSelectedBeatIdx(0);
                    setRunPhase("idle");
                    setTypedChars(0);
                    setVisibleLines(0);
                    setAutoAdvanceQueue(false);
                  }}
                  className={`cursor-pointer rounded px-2.5 py-1 font-semibold ${
                    memberFilter === m.num
                      ? "bg-emerald-600 text-white"
                      : "text-muted hover:text-ink"
                  }`}
                >
                  {m.name}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => startSingleBeat(selectedBeatIdx, false)}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
          >
            <Play className="h-3.5 w-3.5" aria-hidden="true" />
            {runPhase === "done" ? "Chạy lại bước này" : "Chạy trực tiếp Nhịp này"}
          </button>

          {viewMode === "beats" && (
            <button
              type="button"
              onClick={() => startSingleBeat(0, true)}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded bg-accent px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90"
            >
              <Play className="h-3.5 w-3.5" aria-hidden="true" />
              Chạy Liên hoàn Cả 4 Nhịp
            </button>
          )}

          {(runPhase === "typing" || runPhase === "streaming") && (
            <>
              <button
                type="button"
                onClick={() => setIsPaused((v) => !v)}
                className="inline-flex cursor-pointer items-center gap-1 rounded border border-amber-500/50 bg-amber-500/15 px-3 py-1.5 text-xs font-semibold text-amber-700 dark:text-amber-300"
              >
                {isPaused ? (
                  <>
                    <Play className="h-3.5 w-3.5" aria-hidden="true" />
                    Tiếp tục chạy
                  </>
                ) : (
                  <>
                    <Pause className="h-3.5 w-3.5" aria-hidden="true" />
                    Tạm dừng (Giải thích)
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsPaused(false);
                  setTypedChars(currentBeat.command.length);
                  setVisibleLines(currentBeat.streamOutput.length);
                  setRunPhase("done");
                  setCompletedBeats((prev) => ({ ...prev, [currentBeat.id]: true }));
                }}
                className="inline-flex cursor-pointer items-center gap-1 rounded border border-hairline bg-surface px-2.5 py-1.5 text-xs text-ink hover:bg-canvas"
              >
                <SkipForward className="h-3.5 w-3.5" aria-hidden="true" />
                Hiện hết
              </button>
            </>
          )}

          {runPhase !== "idle" && (
            <button
              type="button"
              onClick={() => {
                setAutoAdvanceQueue(false);
                setIsPaused(false);
                setRunPhase("idle");
                setTypedChars(0);
                setVisibleLines(0);
              }}
              className="inline-flex cursor-pointer items-center gap-1 rounded border border-hairline bg-surface px-2.5 py-1.5 text-xs text-muted hover:text-ink"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Beat Selector Cards */}
      <div className={`grid gap-2 ${visibleBeats.length > 1 ? "sm:grid-cols-2 lg:grid-cols-4" : "grid-cols-1"}`}>
        {visibleBeats.map((b, idx) => {
          const isCurrent = idx === selectedBeatIdx;
          const isDone = Boolean(completedBeats[b.id]);
          return (
            <button
              key={b.id}
              type="button"
              onClick={() => {
                setSelectedBeatIdx(idx);
                setAutoAdvanceQueue(false);
                setIsPaused(false);
                setRunPhase("idle");
                setTypedChars(0);
                setVisibleLines(0);
              }}
              className={`flex cursor-pointer flex-col justify-between rounded-md border p-3 text-left text-xs transition-colors ${
                isCurrent
                  ? "border-accent bg-accent/10"
                  : isDone
                  ? "border-emerald-600/40 bg-emerald-500/5"
                  : "border-hairline bg-subtle hover:bg-canvas"
              }`}
            >
              <div className="flex items-center justify-between gap-2 font-mono text-[11px] font-bold">
                <span className={isCurrent ? "text-accent" : "text-muted"}>{b.ownerLabel}</span>
                {isDone && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />}
              </div>
              <div className="mt-1 font-semibold text-ink line-clamp-2">{b.title}</div>
            </button>
          );
        })}
      </div>

      {/* Live Synchronized Topology Telemetry Bar */}
      <div className="grid gap-2.5 rounded-lg border border-zinc-800 bg-[#0b1120] p-3.5 font-mono text-[11px] text-zinc-200 sm:grid-cols-4">
        <div className="rounded border border-zinc-800 bg-[#111827] px-3 py-2">
          <div className="text-zinc-400">Mini-WAF Proxy (:8080)</div>
          <div
            className={`mt-1 font-bold ${
              liveTopology.wafMode === "BLOCKING"
                ? "text-emerald-300"
                : liveTopology.wafMode === "MONITOR"
                ? "text-amber-300"
                : "text-rose-400"
            }`}
          >
            MODE: {liveTopology.wafMode}
          </div>
        </div>

        <div className="rounded border border-zinc-800 bg-[#111827] px-3 py-2">
          <div className="text-zinc-400">Target Web (:8000 internal)</div>
          <div className="mt-1 flex items-center gap-1.5 font-bold text-sky-300">
            <Shield className="h-3.5 w-3.5" aria-hidden="true" />
            {liveTopology.portalMode} · Hits: +{liveTopology.backendHitsDelta}
          </div>
        </div>

        <div className="rounded border border-zinc-800 bg-[#111827] px-3 py-2">
          <div className="text-zinc-400">Blacklist Auto-Ban (:8888)</div>
          <div className={`mt-1 flex items-center gap-1.5 font-bold ${liveTopology.bannedIp ? "text-rose-400" : "text-emerald-300"}`}>
            {liveTopology.bannedIp ? (
              <>
                <ShieldAlert className="h-3.5 w-3.5" aria-hidden="true" />
                BANNED: {liveTopology.bannedIp}
              </>
            ) : (
              <>
                <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                0 IP bị khóa
              </>
            )}
          </div>
        </div>

        <div className="rounded border border-zinc-800 bg-[#111827] px-3 py-2">
          <div className="text-zinc-400">Telegram Alerts (Redacted)</div>
          <div className="mt-1 font-bold text-amber-300">
            {liveTopology.telegramCount} cảnh báo đã gửi
          </div>
        </div>
      </div>

      {/* Main Split Execution Console: Live Terminal Typing + HTTP / Defense Panel */}
      <div className="grid gap-4 lg:grid-cols-12">
        <div className="lg:col-span-7 overflow-hidden rounded-lg border border-zinc-800 bg-[#0d1117] font-mono text-xs text-zinc-200">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 bg-[#161b22] px-3.5 py-2">
            <div className="flex items-center gap-2.5">
              <WindowControls />
              <Terminal className="h-3.5 w-3.5 text-zinc-400" aria-hidden="true" />
              <span className="font-semibold text-zinc-200">
                {currentBeat.terminalOs} — {currentBeat.ownerLabel}
              </span>
            </div>
            {runPhase !== "idle" && (
              <span className="text-[11px] font-bold text-emerald-300">
                {isPaused ? "ĐÃ TẠM DỪNG" : `${progressPct}%`}
              </span>
            )}
          </div>

          {runPhase !== "idle" && (
            <div className="h-1 w-full bg-zinc-900">
              <div
                className="h-full bg-emerald-500 transition-all duration-100"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          )}

          <div className="space-y-3 p-4">
            <div className="text-[11px] text-zinc-400">
              Tệp sở hữu: <span className="text-sky-300">{currentBeat.filesOwned}</span>
            </div>

            {runPhase === "idle" ? (
              <div className="rounded border border-zinc-800 bg-[#05070a] p-5 text-zinc-400">
                <div className="flex flex-wrap items-center gap-1.5 text-zinc-200">
                  <span className="text-emerald-400">{currentBeat.prompt}</span>
                  <span className="inline-block h-4 w-2 animate-pulse bg-emerald-400" />
                </div>
                <p className="mt-3 font-sans text-xs text-zinc-500">
                  Chưa chạy kịch bản. Bấm &quot;Chạy trực tiếp Nhịp này&quot; để mô phỏng gõ từng chữ và quan sát phản ứng hệ thống theo thời gian thực.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5 rounded border border-zinc-800 bg-[#05070a] p-3.5">
                <div className="break-all leading-relaxed">
                  <span className="text-emerald-400">{currentBeat.prompt} </span>
                  <span className="text-zinc-100">{currentBeat.command.slice(0, typedChars)}</span>
                  {runPhase === "typing" && (
                    <span className="ml-0.5 inline-block h-3.5 w-2 animate-pulse bg-emerald-400 align-middle" />
                  )}
                </div>

                {visibleLines > 0 && (
                  <pre className="whitespace-pre-wrap border-t border-zinc-800/80 pt-2.5 text-[11px] leading-relaxed text-emerald-300">
                    {currentBeat.streamOutput.slice(0, visibleLines).join("\n")}
                  </pre>
                )}
              </div>
            )}
          </div>
        </div>

        {/* HTTP Response & Instructor Q&A Explanation Pane */}
        <div className="lg:col-span-5 flex flex-col justify-between gap-3 rounded-lg border border-hairline bg-subtle p-4 text-xs">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-hairline pb-2">
              <span className="font-bold text-ink">Phản hồi HTTP &amp; Đối chứng Bảo mật</span>
              <button
                type="button"
                onClick={() => setExplainOpen((v) => !v)}
                className="cursor-pointer rounded border border-hairline bg-surface px-2 py-0.5 font-mono text-[11px] font-semibold text-accent hover:bg-canvas"
              >
                {explainOpen || isPaused ? "Ẩn điểm vấn đáp" : "Điểm ăn tiền ATTT"}
              </button>
            </div>

            {runPhase === "idle" ? (
              <div className="rounded border border-hairline bg-surface p-4 text-center text-muted">
                Kết quả HTTP Header / Response từ <code className="font-mono text-ink">Mini-WAF :8080</code> sẽ cập nhật tại đây khi kịch bản chạy.
              </div>
            ) : (
              <pre className="whitespace-pre-wrap rounded border border-zinc-800 bg-[#0d1117] p-3 font-mono text-[11px] leading-relaxed text-amber-200">
                {currentBeat.httpResponsePreview}
              </pre>
            )}
          </div>

          {(explainOpen || isPaused || runPhase === "done") && (
            <div className="rounded-md border border-emerald-600/35 bg-emerald-500/10 p-3 leading-relaxed text-secondary">
              <div className="mb-1 font-mono text-[11px] font-bold uppercase text-emerald-700 dark:text-emerald-300">
                Điểm trọng tâm trình bày trước Hội đồng ({currentBeat.ownerLabel}):
              </div>
              {currentBeat.defenseTalkingPoint}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
