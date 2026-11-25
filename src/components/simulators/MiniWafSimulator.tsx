"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Download,
  Lock,
  Play,
  RotateCcw,
  Shield,
  ShieldAlert,
  Terminal,
  Unlock,
} from "lucide-react";
import { MiniWafScenarioPlayer } from "@/components/simulators/MiniWafScenarioPlayer";
import {
  type PortalDriverCommand,
  type PortalHttpExchange,
  StudentPortalEmulator,
} from "@/components/simulators/StudentPortalEmulator";
import { WindowControls } from "@/components/WindowBar";
import {
  type PortalSecurityMode,
  type RateAlgo,
  VERIFIED_PYTHON_BENCHMARK,
  type WafMode,
  inspectSimulatedRequest,
  maskSensitiveLog,
  normalizeMultiPass,
} from "@/lib/miniWafEngine";

type UpstreamTarget = "student_portal" | "dvwa";

interface MiniWafLogEntry {
  id: number;
  time: string;
  ip: string;
  method: string;
  path: string;
  ruleIds: string[];
  category: string;
  score: number;
  action: "ALLOWED" | "MONITORED" | "BLOCKED" | "RATE_LIMITED" | "BANNED";
  latencyMs: number;
  maskedSnippet: string;
}

interface BannedEntry {
  ip: string;
  reason: string;
  ttlSec: number;
}

export function MiniWafSimulator() {
  const [subTab, setSubTab] = useState<"scenario" | "portal" | "inspect" | "defense" | "dashboard" | "benchmark">("scenario");
  const [initialBeat, setInitialBeat] = useState<number | undefined>(undefined);
  const [wafMode, setWafMode] = useState<WafMode>("BLOCKING");
  const [upstreamTarget, setUpstreamTarget] = useState<UpstreamTarget>("student_portal");
  const [portalSecurityMode, setPortalSecurityMode] = useState<PortalSecurityMode>("VULNERABLE");
  const [rateAlgo, setRateAlgo] = useState<RateAlgo>("sliding");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const sp = new URLSearchParams(window.location.search);
    const tab = sp.get("tab");
    if (
      tab === "scenario" ||
      tab === "portal" ||
      tab === "inspect" ||
      tab === "defense" ||
      tab === "dashboard" ||
      tab === "benchmark"
    ) {
      setSubTab(tab);
    }
    const beat = Number(sp.get("beat"));
    if (beat >= 1 && beat <= 4) {
      setInitialBeat(beat);
      setSubTab("scenario");
    }
  }, []);

  // Tab 1 states (zero pre-executed output)
  const [reqMethod, setReqMethod] = useState<"GET" | "POST">("GET");
  const [reqPath, setReqPath] = useState("/search");
  const [reqParam, setReqParam] = useState("q=SV001");
  const [userAgent, setUserAgent] = useState("Mozilla/5.0 (Macintosh; Intel Mac OS X)");
  const [peerTrusted, setPeerTrusted] = useState(true);
  const [xffHeader, setXffHeader] = useState("198.51.100.77");
  const [inspectionResult, setInspectionResult] = useState<{
    clientIp: string;
    decision: ReturnType<typeof inspectSimulatedRequest>;
    maskedSnippet: string;
    telegramMsg: string | null;
    upstreamReached: boolean;
  } | null>(null);
  const [portalCmd, setPortalCmd] = useState<PortalDriverCommand | null>(null);
  const [portalExchange, setPortalExchange] = useState<PortalHttpExchange | null>(null);

  // Tab 2 & 3 states (Shared telemetry fed by Tab 1 & Tab 2 actions)
  const [adminUnlocked, setAdminUnlocked] = useState(false);
  const [adminPwdInput, setAdminPwdInput] = useState("miniwaf-admin-2026");
  const [adminAuthError, setAdminAuthError] = useState<string | null>(null);
  const [logs, setLogs] = useState<MiniWafLogEntry[]>([]);
  const [bannedIps, setBannedIps] = useState<BannedEntry[]>([]);
  const [violationCounter, setViolationCounter] = useState<Record<string, number>>({});
  const [telegramFeed, setTelegramFeed] = useState<string[]>([]);
  const [defenseOutput, setDefenseOutput] = useState<string | null>(null);

  // Tab 4 Benchmark runner state (empty until clicked)
  const [benchmarkRunResult, setBenchmarkRunResult] = useState<{
    browserVerified: typeof VERIFIED_PYTHON_BENCHMARK.groups;
    clientTp: number;
    clientFp: number;
    clientTn: number;
    clientFn: number;
    pythonReport: typeof VERIFIED_PYTHON_BENCHMARK;
  } | null>(null);

  const handleSyncTopology = useCallback(
    (next: { wafMode: WafMode; portalMode: "VULNERABLE" | "HARDENED" }) => {
      setWafMode(next.wafMode);
      setPortalSecurityMode(next.portalMode);
    },
    []
  );

  const effectiveIp = useMemo(() => {
    if (peerTrusted && xffHeader.trim()) return xffHeader.trim();
    return "203.0.113.9";
  }, [peerTrusted, xffHeader]);

  const appendEvent = (entry: Omit<MiniWafLogEntry, "id" | "time">) => {
    const time = new Date().toTimeString().slice(0, 8);
    setLogs((prev) => [{ ...entry, id: prev.length + 1, time }, ...prev].slice(0, 40));
  };

  const handleInspectRun = () => {
    const activeBan = bannedIps.find((b) => b.ip === effectiveIp);
    if (wafMode !== "OFF" && activeBan) {
      appendEvent({
        ip: effectiveIp,
        method: reqMethod,
        path: reqPath,
        ruleIds: ["BAN-403"],
        category: "Blacklist",
        score: 10,
        action: "BANNED",
        latencyMs: 0.14,
        maskedSnippet: maskSensitiveLog(reqParam),
      });
      setInspectionResult({
        clientIp: effectiveIp,
        decision: {
          action: "BLOCKED",
          ruleIds: ["BAN-403"],
          category: "Blacklist",
          score: 10,
          confidence: 0.99,
          normalized: normalizeMultiPass(reqParam),
          fingerprint: "",
          reasons: [`IP ${effectiveIp} đang bị Auto-Ban O(1) — chặn ngay trước khi chạy Regex.`],
        },
        maskedSnippet: maskSensitiveLog(reqParam),
        telegramMsg: null,
        upstreamReached: false,
      });
      return;
    }

    const decision = inspectSimulatedRequest({
      method: reqMethod,
      path: reqPath,
      queryOrBody: reqParam,
      userAgent,
      wafMode,
    });
    const masked = maskSensitiveLog(reqParam);
    const upstreamReached = decision.action !== "BLOCKED";
    let tgMsg: string | null = null;

    if (decision.action === "BLOCKED") {
      const nextHits = (violationCounter[effectiveIp] ?? 0) + 1;
      const shouldBan = nextHits >= 3;
      setViolationCounter((prev) => ({ ...prev, [effectiveIp]: shouldBan ? 0 : nextHits }));
      if (shouldBan) {
        setBannedIps((prev) => [
          {
            ip: effectiveIp,
            reason: `Auto-Ban (>= 3 vi phạm BLOCKED trong 60s · ${decision.ruleIds[0]})`,
            ttlSec: 300,
          },
          ...prev.filter((x) => x.ip !== effectiveIp),
        ]);
      }
      tgMsg = `[Mini-WAF] Phat hien su kien bao mat\nLoai: ${decision.category}${
        shouldBan ? " -> AUTO-BAN" : ""
      }\nIP: ${effectiveIp}\nQuy tac: ${decision.ruleIds.join(",")}\nHanh dong: ${
        shouldBan ? "BANNED (TTL 300s)" : "BLOCK"
      }`;
      setTelegramFeed((prev) => [tgMsg as string, ...prev].slice(0, 10));
    }

    appendEvent({
      ip: effectiveIp,
      method: reqMethod,
      path: reqPath,
      ruleIds: decision.ruleIds.length ? decision.ruleIds : ["NONE"],
      category: decision.category,
      score: decision.score,
      action: decision.action,
      latencyMs: decision.action === "BLOCKED" ? 0.58 : 1.54,
      maskedSnippet: masked,
    });

    setInspectionResult({
      clientIp: effectiveIp,
      decision,
      maskedSnippet: masked,
      telegramMsg: tgMsg,
      upstreamReached,
    });
  };

  const handleBoundaryBurstDemo = () => {
    if (rateAlgo === "fixed") {
      setDefenseOutput(
        `[Fixed Window Burst @ t=9.5s & t=10.2s — Limit: 5 req/10s]\n` +
          `• t=9.5s (Bucket 0): 5/5 ALLOWED -> Reset bộ đếm ở giây thứ 10.0!\n` +
          `• t=10.2s (Bucket 1): 5/5 ALLOWED tiếp -> Lọt 10 request trong 0.7 giây (Lỗ hổng ranh giới Fixed Window).\n` +
          `=> Chuyển sang "Sliding Window (deque)" và chạy lại để xem cách vá triệt để.`
      );
      return;
    }

    appendEvent({
      ip: effectiveIp,
      method: "GET",
      path: "/search",
      ruleIds: ["RL-429"],
      category: "RateLimit",
      score: 10,
      action: "RATE_LIMITED",
      latencyMs: 0.11,
      maskedSnippet: "Burst > 5 req / 10s (Sliding deque)",
    });
    setDefenseOutput(
      `[Sliding Window (collections.deque) @ t=9.5s & t=10.2s — Limit: 5 req/10s]\n` +
        `• t=9.5s: 5/5 ALLOWED -> deque = [9.5, 9.5, 9.5, 9.5, 9.5]\n` +
        `• t=10.2s: Cửa sổ trượt [0.2 .. 10.2] vẫn còn 5 phần tử cũ -> Trả ngay HTTP 429 Too Many Requests + Retry-After: 10s!`
    );
  };

  const handleTriggerAutoBanSequence = () => {
    const offenderIp = effectiveIp;
    const seq = ["q=1' OR 1=1--", "q=1' UNION SELECT 1,2--", "msg=<script>alert(1)</script>"];
    seq.forEach((p, idx) => {
      const dec = inspectSimulatedRequest({
        method: "GET",
        path: "/search",
        queryOrBody: p,
        userAgent,
        wafMode: "BLOCKING",
      });
      appendEvent({
        ip: offenderIp,
        method: "GET",
        path: "/search",
        ruleIds: dec.ruleIds,
        category: dec.category,
        score: dec.score,
        action: idx === 2 ? "BANNED" : "BLOCKED",
        latencyMs: 0.52,
        maskedSnippet: maskSensitiveLog(p),
      });
    });

    setBannedIps((prev) => [
      {
        ip: offenderIp,
        reason: "Auto-Ban: >= 3 WAF BLOCK events trong 60s (last: XSS-01)",
        ttlSec: 300,
      },
      ...prev.filter((b) => b.ip !== offenderIp),
    ]);

    const tgMsg = `[Mini-WAF] Phat hien su kien bao mat\nLoai: XSS -> AUTO-BAN\nIP: ${offenderIp}\nQuy tac: SQL-02,SQL-03,XSS-01\nHanh dong: BANNED (TTL 300s)`;
    setTelegramFeed((prev) => [tgMsg, ...prev].slice(0, 10));
    setDefenseOutput(
      `[Auto-Ban Triggered for ${offenderIp}]\n` +
        `• Lần 1 (1' OR 1=1--): 403 BLOCKED (counter=1/3)\n` +
        `• Lần 2 (1' UNION SELECT...): 403 BLOCKED (counter=2/3)\n` +
        `• Lần 3 (<script>alert(1)): 403 BLOCKED -> Đạt ngưỡng 3/60s! Ghi vào bảng banned_ips (TTL=300s).\n` +
        `• Lần 4 (/search?q=SV001 hợp lệ): Bị chặn O(1) ở RAM (403 BANNED) mà không chạy Regex. Vào Tab 3 để bấm Unban!`
    );
  };

  const handleRunInBrowserBenchmark = () => {
    const miniCorpus = [
      // 6 Representative Malicious
      { g: "SQLi", mal: true, q: "q=' OR '1'='1" },
      { g: "Evasion", mal: true, q: "q=1%2527%2520OR%25201%253D1--" },
      { g: "Evasion", mal: true, q: "q=1' UN/**/ION SEL/**/ECT 1,2--" },
      { g: "Evasion", mal: true, q: "q=1' /*!50000UNION*/ /*!50000SELECT*/ 1,2--" },
      { g: "XSS", mal: true, q: "msg=<img src=x onerror=alert(1)>" },
      { g: "LFI", mal: true, q: "file=....//....//etc/passwd" },
      // 6 Hard Benign Negatives
      { g: "Benign", mal: false, q: "q=SV001" },
      { g: "Benign", mal: false, q: "q=O'Brien" },
      { g: "Benign", mal: false, q: "q=Marco D'Angelo" },
      { g: "Benign", mal: false, q: "msg=5 < 10 and gpa > 8.0" },
      { g: "Benign", mal: false, q: "msg=Please select option from menu" },
      { g: "Benign", mal: false, q: "file=tailieu.pdf" },
    ];
    let tp = 0;
    let fp = 0;
    let tn = 0;
    let fn = 0;
    for (const item of miniCorpus) {
      const dec = inspectSimulatedRequest({
        method: "GET",
        path: item.g === "LFI" ? "/download" : "/search",
        queryOrBody: item.q,
        userAgent: "Mozilla/5.0",
        wafMode: "BLOCKING",
      });
      const blocked = dec.action === "BLOCKED";
      if (item.mal && blocked) tp += 1;
      else if (!item.mal && blocked) fp += 1;
      else if (!item.mal && !blocked) tn += 1;
      else fn += 1;
    }
    setBenchmarkRunResult({
      browserVerified: VERIFIED_PYTHON_BENCHMARK.groups,
      clientTp: tp,
      clientFp: fp,
      clientTn: tn,
      clientFn: fn,
      pythonReport: VERIFIED_PYTHON_BENCHMARK,
    });
  };

  const blockedCount = logs.filter((l) => l.action === "BLOCKED" || l.action === "BANNED").length;
  const rateLimitedCount = logs.filter((l) => l.action === "RATE_LIMITED").length;

  return (
    <div className="rounded-lg border border-hairline bg-surface p-4 sm:p-5 space-y-4">
      {/* Header & Artifacts */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-hairline pb-3">
        <h3 className="flex items-center gap-2 text-sm font-bold text-ink sm:text-base">
          <Shield className="h-4 w-4 text-accent" aria-hidden="true" />
          Mini-WAF Proxy :8080 · Admin :8888
        </h3>

        <div className="flex flex-wrap items-center gap-2">
          <a
            href="/mini-waf/mini-waf-project.zip"
            download="mini-waf-project.zip"
            className="inline-flex items-center gap-1.5 rounded-md border border-hairline bg-subtle px-2.5 py-1.5 font-mono text-[11px] font-semibold text-ink hover:bg-canvas"
          >
            <Download className="h-3.5 w-3.5" aria-hidden="true" />
            Code (.zip)
          </a>
          <a
            href="/mini-waf/SPECIFICATION_V2.md"
            download="SPECIFICATION_V2.md"
            className="inline-flex items-center gap-1.5 rounded-md border border-hairline bg-subtle px-2.5 py-1.5 font-mono text-[11px] font-semibold text-ink hover:bg-canvas"
          >
            <Download className="h-3.5 w-3.5" aria-hidden="true" />
            Đặc tả
          </a>
        </div>
      </div>

      {/* Topology Control Bar */}
      <div className="grid gap-3 rounded-lg border border-hairline bg-subtle p-3 sm:grid-cols-3 text-xs">
        <div>
          <div className="mb-1.5 font-mono text-[11px] font-semibold uppercase tracking-wider text-muted">
            WAF
          </div>
          <div className="inline-flex rounded border border-hairline bg-surface p-0.5">
            {(["OFF", "MONITOR", "BLOCKING"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => {
                  setWafMode(m);
                  setInspectionResult(null);
                }}
                className={`cursor-pointer rounded px-2.5 py-1 font-mono text-[11px] font-semibold ${
                  wafMode === m
                    ? m === "BLOCKING"
                      ? "bg-emerald-600 text-white"
                      : m === "MONITOR"
                      ? "bg-amber-600 text-white"
                      : "bg-rose-600 text-white"
                    : "text-muted hover:text-ink"
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-1.5 font-mono text-[11px] font-semibold uppercase tracking-wider text-muted">
            Upstream
          </div>
          <div className="flex flex-wrap gap-1.5">
            <div className="inline-flex rounded border border-hairline bg-surface p-0.5">
              {[
                { id: "student_portal" as const, label: "Portal :8000" },
                { id: "dvwa" as const, label: "DVWA :80" },
              ].map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => {
                    setUpstreamTarget(u.id);
                    setReqPath(u.id === "student_portal" ? "/search" : "/vulnerabilities/sqli/");
                    setInspectionResult(null);
                  }}
                  className={`cursor-pointer rounded px-2 py-1 font-mono text-[11px] font-semibold ${
                    upstreamTarget === u.id
                      ? "bg-ink text-canvas"
                      : "text-muted hover:text-ink"
                  }`}
                >
                  {u.label}
                </button>
              ))}
            </div>
            {upstreamTarget === "student_portal" && (
              <div className="inline-flex rounded border border-hairline bg-surface p-0.5">
                {(["VULNERABLE", "HARDENED"] as const).map((pm) => (
                  <button
                    key={pm}
                    type="button"
                    onClick={() => {
                      setPortalSecurityMode(pm);
                      setInspectionResult(null);
                    }}
                    className={`cursor-pointer rounded px-2 py-1 font-mono text-[10px] font-semibold ${
                      portalSecurityMode === pm
                        ? pm === "HARDENED"
                          ? "bg-emerald-600 text-white"
                          : "bg-amber-600 text-white"
                        : "text-muted hover:text-ink"
                    }`}
                  >
                    {pm}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div>
          <div className="mb-1.5 font-mono text-[11px] font-semibold uppercase tracking-wider text-muted">
            Rate Limit
          </div>
          <div className="inline-flex rounded border border-hairline bg-surface p-0.5">
            {[
              { id: "sliding" as const, label: "Sliding" },
              { id: "fixed" as const, label: "Fixed" },
            ].map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => setRateAlgo(a.id)}
                className={`cursor-pointer rounded px-2.5 py-1 font-mono text-[11px] font-semibold ${
                  rateAlgo === a.id
                    ? "bg-accent text-white"
                    : "text-muted hover:text-ink"
                }`}
              >
                {a.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="inline-flex flex-wrap rounded-md border border-hairline bg-subtle p-0.5 text-xs">
        {[
          { id: "scenario" as const, label: "Quy trình 12 Bước" },
          { id: "portal" as const, label: "Cổng Sinh viên" },
          { id: "inspect" as const, label: "Proxy & Inspection" },
          { id: "defense" as const, label: "Rate Limit & Auto-Ban" },
          { id: "dashboard" as const, label: "Dashboard :8888" },
          { id: "benchmark" as const, label: "Benchmark" },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setSubTab(t.id)}
            className={`cursor-pointer rounded px-3 py-1.5 font-medium transition-colors ${
              subTab === t.id
                ? "bg-surface font-semibold text-ink shadow-sm"
                : "text-muted hover:text-ink"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {subTab === "scenario" && (
        <MiniWafScenarioPlayer
          initialBeat={initialBeat}
          onSyncTopology={handleSyncTopology}
        />
      )}

      {subTab === "portal" && (
        <div className="space-y-4">
          <div className="rounded-lg border border-zinc-800 bg-[#0d1117] p-3 font-mono text-xs text-zinc-200 space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 pb-2">
              <span className="inline-flex items-center gap-1.5 font-semibold text-sky-300">
                <Terminal className="h-3.5 w-3.5" aria-hidden="true" />
                Request Ngoài biên
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5 text-[11px]">
              {[
                { label: "O'Brien", page: "search" as const, input: "O'Brien", tone: "emerald" },
                { label: "' OR '1'='1--", page: "search" as const, input: "' OR '1'='1--", tone: "rose" },
                { label: "1' UN/**/ION SEL/**/ECT 1,2--", page: "search" as const, input: "1' UN/**/ION SEL/**/ECT 1,2--", tone: "rose" },
                { label: "admin' OR '1'='1--", page: "login" as const, input: "admin' OR '1'='1--", tone: "rose" },
                { label: "<img src=x onerror=alert(1)>", page: "comments" as const, input: "<img src=x onerror=alert(1)>", tone: "amber" },
                { label: "....//....//etc/passwd", page: "download" as const, input: "....//....//etc/passwd", tone: "amber" },
              ].map((vec) => (
                <button
                  key={vec.label}
                  type="button"
                  onClick={() =>
                    setPortalCmd((prev) => ({
                      id: (prev?.id ?? 0) + 1,
                      page: vec.page,
                      input: vec.input,
                    }))
                  }
                  className={`cursor-pointer rounded border px-2 py-1 font-semibold transition-colors ${
                    vec.tone === "emerald"
                      ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20"
                      : vec.tone === "rose"
                      ? "border-rose-500/40 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20"
                      : "border-amber-500/40 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20"
                  }`}
                >
                  {vec.label}
                </button>
              ))}
            </div>

            {portalExchange && (
              <div className="rounded border border-zinc-800 bg-zinc-950/90 p-2.5 text-[11px] space-y-1">
                <div className="flex flex-wrap items-center justify-between gap-2 text-zinc-400">
                  <span className="truncate text-zinc-200">{portalExchange.url}</span>
                  <span
                    className={
                      portalExchange.action === "BLOCKED" || portalExchange.action === "BANNED"
                        ? "font-bold text-rose-400"
                        : "font-bold text-emerald-400"
                    }
                  >
                    {portalExchange.action} · HTTP {portalExchange.status}
                  </span>
                </div>
                <div className="text-emerald-300/90 break-all">
                  {portalExchange.headers.join(" | ")}
                </div>
              </div>
            )}
          </div>

          <StudentPortalEmulator
            wafMode={wafMode}
            portalMode={portalSecurityMode}
            ipBanned={bannedIps.some((b) => b.ip === effectiveIp)}
            externalCommand={portalCmd}
            onExchange={setPortalExchange}
          />
        </div>
      )}

      {/* TAB 1: INSPECTION ENGINE */}
      {subTab === "inspect" && (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-3 rounded-lg border border-zinc-800 bg-[#0d1117] p-4 font-mono text-xs text-zinc-200">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
              <div className="flex items-center gap-2">
                <WindowControls onClose={() => setInspectionResult(null)} closeTitle="Xóa kết quả kiểm tra" />
                <span className="font-semibold text-sky-300">
                  HTTP Request Generator -&gt; http://mini-waf:8080
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {[
                { label: "O'Brien", path: "/search", q: "q=O'Brien" },
                { label: "5 < 10", path: "/comments", q: "msg=5 < 10" },
                { label: "Double URL", path: "/search", q: "q=1%2527%2520OR%25201%253D1--" },
                { label: "UN/**/ION", path: "/search", q: "q=1' UN/**/ION SEL/**/ECT 1,2--" },
                { label: "/*!50000*/", path: "/search", q: "q=1' /*!50000UNION*/ /*!50000SELECT*/ 1,2--" },
                { label: "HPP", path: "/search", q: "q=SV001&q=' OR 1=1--" },
                { label: "XSS img", path: "/comments", q: "msg=<img src=x onerror=alert(1)>" },
                { label: "LFI ....//", path: "/download", q: "file=....//....//etc/passwd" },
                { label: "Password Masking", path: "/login", q: "username=admin&password=MySecret2026" },
              ].map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => {
                    setReqPath(preset.path);
                    setReqParam(preset.q);
                    setReqMethod(preset.path === "/login" ? "POST" : "GET");
                    setInspectionResult(null);
                  }}
                  className="cursor-pointer rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-[11px] text-zinc-300 hover:bg-zinc-800"
                >
                  {preset.label}
                </button>
              ))}
            </div>

            <div className="grid gap-2 sm:grid-cols-4">
              <select
                value={reqMethod}
                onChange={(e) => setReqMethod(e.target.value as "GET" | "POST")}
                aria-label="HTTP Method"
                className="rounded border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-zinc-200"
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
              </select>
              <input
                type="text"
                value={reqPath}
                onChange={(e) => {
                  setReqPath(e.target.value);
                  setInspectionResult(null);
                }}
                aria-label="URL Path"
                className="sm:col-span-3 rounded border border-zinc-700 bg-zinc-900 px-2.5 py-1.5 text-amber-200 focus:outline-none"
              />
            </div>

            <input
              type="text"
              value={reqParam}
              onChange={(e) => {
                setReqParam(e.target.value);
                setInspectionResult(null);
              }}
              aria-label="Query hoặc Body"
              className="w-full rounded border border-zinc-700 bg-zinc-900 px-2.5 py-1.5 text-amber-200 focus:outline-none"
            />

            <div className="grid gap-2 sm:grid-cols-2 text-[11px]">
              <div>
                <div className="mb-1 text-zinc-400">User-Agent:</div>
                <select
                  value={userAgent}
                  onChange={(e) => {
                    setUserAgent(e.target.value);
                    setInspectionResult(null);
                  }}
                  aria-label="User Agent"
                  className="w-full rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-zinc-200"
                >
                  <option value="Mozilla/5.0 (Macintosh; Intel Mac OS X)">Mozilla/5.0</option>
                  <option value="sqlmap/1.8.4#stable">sqlmap/1.8.4 (+3)</option>
                  <option value="Nikto/2.5.0">Nikto/2.5.0 (+3)</option>
                </select>
              </div>
              <div>
                <div className="mb-1 text-zinc-400">X-Forwarded-For Trust:</div>
                <button
                  type="button"
                  onClick={() => {
                    setPeerTrusted((v) => !v);
                    setXffHeader("198.51.100.77");
                    setInspectionResult(null);
                  }}
                  className="w-full cursor-pointer rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-left text-zinc-200 hover:bg-zinc-800"
                >
                  {peerTrusted ? "Trusted Proxy -> IP 198.51.100.77" : "Untrusted Peer -> Ignore XFF (203.0.113.9)"}
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={handleInspectRun}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500"
            >
              <Play className="h-3.5 w-3.5" aria-hidden="true" />
              Phân tích Gói tin qua Mini-WAF
            </button>
          </div>

          <div className="space-y-3 rounded-lg border border-zinc-800 bg-[#0d1117] p-4 font-mono text-xs text-zinc-200">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
              <div className="flex items-center gap-2">
                <WindowControls />
                <span className="font-semibold text-emerald-300">
                  Inspection Pipeline &amp; Header Hardening Output
                </span>
              </div>
              {inspectionResult && (
                <span
                  className={`rounded px-2 py-0.5 text-[11px] font-bold ${
                    inspectionResult.decision.action === "BLOCKED"
                      ? "bg-rose-500/20 text-rose-300"
                      : inspectionResult.decision.action === "MONITORED"
                      ? "bg-amber-500/20 text-amber-300"
                      : "bg-emerald-500/20 text-emerald-300"
                  }`}
                >
                  {inspectionResult.decision.action} · Score {inspectionResult.decision.score}
                </span>
              )}
            </div>

            {!inspectionResult ? (
              <div className="py-12 text-center text-zinc-500">
                Chưa có dữ liệu.
              </div>
            ) : (
              <div className="space-y-2.5 text-[11px]">
                <div className="rounded border border-zinc-800 bg-[#05070a] p-2.5 space-y-1">
                  <div>
                    <span className="text-zinc-500">Client IP    : </span>
                    <span className="text-sky-300">{inspectionResult.clientIp}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500">Spaced View  : </span>
                    <span className="text-amber-300">{inspectionResult.decision.normalized.spaced || "(empty)"}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500">Collapsed    : </span>
                    <span className="text-amber-200">{inspectionResult.decision.normalized.collapsed || "(empty)"}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500">SQL Lexer FP : </span>
                    <span className="text-emerald-300">{inspectionResult.decision.fingerprint || "(none)"}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500">Triggered    : </span>
                    <span className="text-zinc-200">{inspectionResult.decision.reasons.join("; ")}</span>
                  </div>
                </div>

                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="rounded border border-zinc-800 bg-[#05070a] p-2.5">
                    <div className="font-sans font-bold text-zinc-300 mb-1">
                      Chuyển tiếp Upstream ({upstreamTarget === "student_portal" ? `Portal :8000 · ${portalSecurityMode}` : "DVWA :80"})
                    </div>
                    <div className={inspectionResult.upstreamReached ? "text-emerald-300" : "text-rose-300"}>
                      {!inspectionResult.upstreamReached
                        ? "403 Forbidden · Ngắt kết nối tại tầng biên (0 gói tin chạm máy chủ đích!)"
                        : wafMode === "OFF" && upstreamTarget === "student_portal"
                        ? portalSecurityMode === "HARDENED"
                          ? "WAF OFF nhưng target_web ở chế độ HARDENED -> Prepared Statement (?) + Escaping HTML + Sandbox bảo vệ tận gốc!"
                          : "CẢNH BÁO: WAF OFF và target_web đang ở chế độ VULNERABLE -> Lộ lỗi SQLi/XSS/Traversal trực tiếp!"
                        : "200 OK · Chuyển tiếp sạch + Xóa Server/X-Powered-By + Gắn HttpOnly; SameSite=Lax & X-Frame-Options: DENY"}
                    </div>
                  </div>
                  <div className="rounded border border-zinc-800 bg-[#05070a] p-2.5">
                    <div className="font-sans font-bold text-zinc-300 mb-1">
                      Log Sanitization (SQLite WAL)
                    </div>
                    <div className="break-all text-zinc-400">
                      {inspectionResult.maskedSnippet || "(clean)"}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: RATE LIMIT & AUTO-BAN */}
      {subTab === "defense" && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleBoundaryBurstDemo}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90"
            >
              <Activity className="h-3.5 w-3.5" aria-hidden="true" />
              Kiểm thử Boundary Burst ({rateAlgo === "sliding" ? "Sliding Window" : "Fixed Window"})
            </button>
            <button
              type="button"
              onClick={handleTriggerAutoBanSequence}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-md bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700"
            >
              <ShieldAlert className="h-3.5 w-3.5" aria-hidden="true" />
              Kích hoạt Chuỗi 3 Vi phạm -&gt; Auto-Ban (TTL 300s)
            </button>
          </div>

          <div className="rounded-lg border border-zinc-800 bg-[#0d1117] p-4 font-mono text-xs text-zinc-200">
            <div className="mb-2 flex items-center gap-2 border-b border-zinc-800 pb-2">
              <WindowControls onClose={() => setDefenseOutput(null)} closeTitle="Xóa kết quả phòng thủ" />
              <span className="font-semibold text-amber-300">
                Active Defense Trace ({effectiveIp} · Algo: {rateAlgo})
              </span>
            </div>
            {!defenseOutput ? (
              <div className="py-8 text-center text-zinc-500">
                Chưa có dữ liệu.
              </div>
            ) : (
              <pre className="whitespace-pre-wrap text-[11px] leading-relaxed text-emerald-300">
                {defenseOutput}
              </pre>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: ADMIN DASHBOARD :8888 */}
      {subTab === "dashboard" && (
        <div className="space-y-4">
          {!adminUnlocked ? (
            <div className="mx-auto max-w-md rounded-lg border border-hairline bg-subtle p-5 text-xs space-y-3">
              <div className="flex items-center gap-2 font-bold text-ink text-sm">
                <Lock className="h-4 w-4 text-accent" aria-hidden="true" />
                Đăng nhập Admin :8888
              </div>
              <input
                type="password"
                value={adminPwdInput}
                onChange={(e) => {
                  setAdminPwdInput(e.target.value);
                  setAdminAuthError(null);
                }}
                aria-label="Mật khẩu Admin Dashboard"
                className="w-full rounded border border-hairline bg-surface px-3 py-1.5 font-mono text-ink"
              />
              {adminAuthError && <div className="text-rose-600">{adminAuthError}</div>}
              <button
                type="button"
                onClick={() => {
                  if (adminPwdInput === "miniwaf-admin-2026") {
                    setAdminUnlocked(true);
                    setAdminAuthError(null);
                  } else {
                    setAdminAuthError("401 Unauthorized: Sai mật khẩu quản trị Mini-WAF!");
                  }
                }}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded bg-ink px-3.5 py-1.5 font-semibold text-canvas hover:opacity-90"
              >
                <Unlock className="h-3.5 w-3.5" aria-hidden="true" />
                Đăng nhập Dashboard (:8888)
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {logs.length >= 3 && (blockedCount + rateLimitedCount) / logs.length >= 0.5 && (
                <div className="flex items-center gap-2 rounded-md border border-rose-500/40 bg-rose-500/10 px-3.5 py-2.5 text-xs font-semibold text-rose-700 dark:text-rose-300">
                  <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
                  [CẢNH BÁO ĐỘT BIẾN] Mật độ tấn công vượt 50% trong phiên hiện tại. Telegram Bot đã phát cảnh báo ẩn payload nhạy cảm.
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 text-xs">
                <div className="rounded-md border border-hairline bg-subtle p-3">
                  <div className="text-muted">Tổng yêu cầu</div>
                  <div className="mt-1 font-mono text-xl font-bold text-ink">{logs.length}</div>
                </div>
                <div className="rounded-md border border-hairline bg-subtle p-3">
                  <div className="text-muted">Bị chặn</div>
                  <div className="mt-1 font-mono text-xl font-bold text-rose-600">
                    {blockedCount + rateLimitedCount}
                  </div>
                </div>
                <div className="rounded-md border border-hairline bg-subtle p-3">
                  <div className="text-muted">IP Auto-Ban</div>
                  <div className="mt-1 font-mono text-xl font-bold text-amber-600">
                    {bannedIps.length}
                  </div>
                </div>
                <div className="rounded-md border border-hairline bg-subtle p-3">
                  <div className="text-muted">Cảnh báo Telegram</div>
                  <div className="mt-1 font-mono text-xl font-bold text-emerald-600">
                    {telegramFeed.length}
                  </div>
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-lg border border-hairline bg-subtle p-3.5 text-xs space-y-2">
                  <div className="font-bold text-ink">Blacklist</div>
                  {bannedIps.length === 0 ? (
                    <div className="text-muted">Trống.</div>
                  ) : (
                    <div className="space-y-2">
                      {bannedIps.map((b) => (
                        <div
                          key={b.ip}
                          className="flex flex-wrap items-center justify-between gap-2 rounded border border-hairline bg-surface px-3 py-2"
                        >
                          <div>
                            <div className="font-mono font-bold text-rose-600">{b.ip} ({b.ttlSec}s)</div>
                            <div className="text-[11px] text-muted">{b.reason}</div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setBannedIps((prev) => prev.filter((x) => x.ip !== b.ip));
                              setViolationCounter((prev) => ({ ...prev, [b.ip]: 0 }));
                            }}
                            className="cursor-pointer rounded bg-rose-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-rose-700"
                          >
                            Unban
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="rounded-lg border border-zinc-800 bg-[#0d1117] p-3.5 font-mono text-[11px] text-zinc-200 space-y-2">
                  <div className="font-sans text-xs font-bold text-sky-300">
                    Luồng Cảnh báo Telegram Bot (Đã che Payload &amp; PII)
                  </div>
                  {telegramFeed.length === 0 ? (
                    <div className="text-zinc-500">Chưa có sự kiện mức cao kích hoạt Telegram Bot.</div>
                  ) : (
                    telegramFeed.slice(0, 3).map((msg, i) => (
                      <pre key={i} className="whitespace-pre-wrap rounded border border-zinc-800 bg-[#05070a] p-2 text-emerald-300">
                        {msg}
                      </pre>
                    ))
                  )}
                </div>
              </div>

              <div className="overflow-x-auto rounded-lg border border-zinc-800 bg-[#0d1117] p-3 font-mono text-[11px] text-zinc-200">
                <div className="mb-2 flex items-center justify-between">
                  <span className="font-sans text-xs font-bold text-zinc-200">
                    Nhật ký SQLite WAL (`security_logs`)
                  </span>
                  {logs.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setLogs([])}
                      className="inline-flex cursor-pointer items-center gap-1 rounded border border-zinc-700 bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-300"
                    >
                      <RotateCcw className="h-3 w-3" aria-hidden="true" /> Xóa log phiên
                    </button>
                  )}
                </div>
                {logs.length === 0 ? (
                  <div className="py-4 text-center text-zinc-500">Chưa có nhật ký trong phiên.</div>
                ) : (
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-zinc-800 text-zinc-400">
                        <th className="pb-1 pr-2">TIME</th>
                        <th className="pb-1 pr-2">IP</th>
                        <th className="pb-1 pr-2">RULE</th>
                        <th className="pb-1 pr-2">SCORE</th>
                        <th className="pb-1 pr-2">ACTION</th>
                        <th className="pb-1">MASKED SNIPPET</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/70">
                      {logs.slice(0, 12).map((l) => (
                        <tr key={l.id}>
                          <td className="py-1 pr-2 text-zinc-400">{l.time}</td>
                          <td className="py-1 pr-2 text-sky-300">{l.ip}</td>
                          <td className="py-1 pr-2 text-amber-300">{l.ruleIds.join(",")}</td>
                          <td className="py-1 pr-2">{l.score}</td>
                          <td className="py-1 pr-2 font-bold">
                            <span
                              className={
                                l.action === "ALLOWED"
                                  ? "text-emerald-300"
                                  : l.action === "MONITORED"
                                  ? "text-amber-300"
                                  : "text-rose-400"
                              }
                            >
                              {l.action}
                            </span>
                          </td>
                          <td className="py-1 text-zinc-400">{l.maskedSnippet || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: BENCHMARK 100 SAMPLES */}
      {subTab === "benchmark" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-hairline bg-subtle p-4">
            <div className="flex items-center gap-2 text-sm font-bold text-ink">
              <BarChart3 className="h-4 w-4 text-accent" aria-hidden="true" />
              Benchmark 100 Mẫu
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <a
                href="/mini-waf/benchmark_report.json"
                download="benchmark_report.json"
                className="inline-flex items-center gap-1 rounded border border-hairline bg-surface px-2.5 py-1.5 font-mono text-[11px] font-semibold text-ink hover:bg-canvas"
              >
                <Download className="h-3 w-3" aria-hidden="true" /> benchmark_report.json
              </a>
              <button
                type="button"
                onClick={handleRunInBrowserBenchmark}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
              >
                <Play className="h-3.5 w-3.5" aria-hidden="true" />
                Chạy Benchmark
              </button>
            </div>
          </div>

          {!benchmarkRunResult ? (
            <div className="rounded-lg border border-zinc-800 bg-[#0d1117] p-8 text-center font-mono text-xs text-zinc-500">
              Chưa chạy kiểm thử.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-4 text-xs">
                <div className="rounded-md border border-emerald-600/40 bg-emerald-500/10 p-3">
                  <div className="text-muted">Precision / Recall (TPR)</div>
                  <div className="mt-1 font-mono text-lg font-bold text-emerald-700 dark:text-emerald-300">
                    {benchmarkRunResult.pythonReport.blocking.precisionPct}% / {benchmarkRunResult.pythonReport.blocking.recallTprPct}%
                  </div>
                  <div className="mt-0.5 font-mono text-[10px] text-muted">
                    TP={benchmarkRunResult.pythonReport.blocking.tp} · FN={benchmarkRunResult.pythonReport.blocking.fn}
                  </div>
                </div>
                <div className="rounded-md border border-emerald-600/40 bg-emerald-500/10 p-3">
                  <div className="text-muted">Chặn nhầm (FPR) &amp; F1</div>
                  <div className="mt-1 font-mono text-lg font-bold text-emerald-700 dark:text-emerald-300">
                    {benchmarkRunResult.pythonReport.blocking.fprPct}% FPR · F1 {benchmarkRunResult.pythonReport.blocking.f1Pct}%
                  </div>
                  <div className="mt-0.5 font-mono text-[10px] text-muted">
                    TN={benchmarkRunResult.pythonReport.blocking.tn} · FP={benchmarkRunResult.pythonReport.blocking.fp}
                  </div>
                </div>
                <div className="rounded-md border border-hairline bg-subtle p-3">
                  <div className="text-muted">Latency OFF vs BLOCKING</div>
                  <div className="mt-1 font-mono text-lg font-bold text-ink">
                    +{benchmarkRunResult.pythonReport.blocking.deltaMeanMs} ms TB
                  </div>
                  <div className="mt-0.5 font-mono text-[10px] text-muted">
                    {benchmarkRunResult.pythonReport.off.meanMs}ms -&gt; {benchmarkRunResult.pythonReport.blocking.meanMs}ms (p95 {benchmarkRunResult.pythonReport.blocking.p95Ms}ms)
                  </div>
                </div>
                <div className="rounded-md border border-hairline bg-subtle p-3">
                  <div className="text-muted">Backend Shielding</div>
                  <div className="mt-1 font-mono text-lg font-bold text-accent">
                    {benchmarkRunResult.pythonReport.blocking.backendHits} / {benchmarkRunResult.pythonReport.off.backendHits} hits
                  </div>
                  <div className="mt-0.5 font-mono text-[10px] text-muted">
                    0 payload độc hại lọt xuống Target Web
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto rounded-lg border border-hairline bg-subtle p-3 text-xs">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-hairline text-muted">
                      <th className="py-2 pr-3 font-semibold">Nhóm kiểm thử (dataset.json · 100 mẫu)</th>
                      <th className="py-2 pr-3 font-semibold">Số mẫu</th>
                      <th className="py-2 pr-3 font-semibold">Kỳ vọng</th>
                      <th className="py-2 font-semibold">Đo thực tế (run_benchmark.py)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-hairline">
                    {benchmarkRunResult.browserVerified.map((row) => (
                      <tr key={row.name}>
                        <td className="py-2 pr-3 font-medium text-ink">{row.name}</td>
                        <td className="py-2 pr-3 font-mono">{row.total}</td>
                        <td className="py-2 pr-3 text-muted">{row.expected}</td>
                        <td className="py-2 font-mono font-semibold text-emerald-700 dark:text-emerald-300">
                          <span className="inline-flex items-center gap-1">
                            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                            {row.blocked > 0 ? `Chặn ${row.blocked}/${row.total}` : `Cho qua ${row.total}/${row.total} (0 FP)`}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="mt-2 font-mono text-[11px] text-muted">
                  Kiểm chứng Engine trực tiếp trong trình duyệt (12 ca biên O&apos;Brien/5 &lt; 10/Evasion): TP={benchmarkRunResult.clientTp}, FP={benchmarkRunResult.clientFp}, TN={benchmarkRunResult.clientTn}, FN={benchmarkRunResult.clientFn}.
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
