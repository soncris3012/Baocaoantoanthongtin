"use client";

import { useEffect, useRef, useState } from "react";
import {
  CheckCircle2,
  Code2,
  Columns2,
  Download,
  Flame,
  Play,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import {
  type BurpAutoplayRequest,
  type BurpPacketEvent,
  BurpSuiteEmulator,
} from "@/components/simulators/BurpSuiteEmulator";
import { DockerDesktopEmulator } from "@/components/simulators/DockerDesktopEmulator";
import { DvwaWebEmulator } from "@/components/simulators/DvwaWebEmulator";
import {
  buildStepTerminalCommands,
  type ExternalTerminalCommand,
  TerminalEmulator,
} from "@/components/simulators/TerminalEmulator";
import { WindowControls } from "@/components/WindowBar";
import { PHP_LEVEL_SOURCES } from "@/data/scenarioData";

interface Props {
  containerRef?: string;
  phpsessid: string;
  userToken: string;
  activeTab?: string;
  burpAutoplay?: BurpAutoplayRequest | null;
  terminalAutoplay?: ExternalTerminalCommand | null;
}

interface WafAuditItem {
  id: string;
  time: string;
  payload: string;
  blocked: boolean;
  matchedRuleToken: string;
}

const WAF_REGEX = /('|--|#|\/\*|UNION|SELECT|OR\s+\d+=\d+)/i;
const LEXER_KEYWORDS = new Set([
  "SELECT",
  "UNION",
  "FROM",
  "WHERE",
  "AND",
  "OR",
  "ORDER",
  "BY",
  "SLEEP",
  "BENCHMARK",
  "CONCAT",
  "ASCII",
  "SUBSTRING",
  "INFORMATION_SCHEMA",
  "OUTFILE",
  "DUMPFILE",
  "INTO",
  "NULL",
  "XOR",
]);

interface LexicalToken {
  kind: "n" | "s" | "o" | "k" | "w" | "c";
  lexeme: string;
}

function normalizeSqlWafInput(raw: string): string {
  let curr = raw;
  for (let pass = 0; pass < 3; pass++) {
    try {
      const next = decodeURIComponent(curr.replace(/\+/g, " "));
      if (next === curr) break;
      curr = next;
    } catch {
      break;
    }
  }
  curr = curr.replace(/\/\*!\d*\s*([\s\S]*?)\s*\*\//g, " $1 ");
  curr = curr.replace(/\/\*[\s\S]*?\*\//g, " ");
  return curr.replace(/\s+/g, " ").trim();
}

function tokenizeSqlWafInput(text: string): LexicalToken[] {
  const tokens: LexicalToken[] = [];
  let i = 0;
  while (i < text.length) {
    const ch = text[i];
    if (/\s/.test(ch)) {
      i += 1;
      continue;
    }
    if (ch === "#" || text.slice(i, i + 2) === "--") {
      tokens.push({ kind: "c", lexeme: text.slice(i) });
      break;
    }
    if (ch === "'" || ch === '"') {
      let j = i + 1;
      while (j < text.length && text[j] !== ch) j += 1;
      if (j < text.length) {
        tokens.push({ kind: "s", lexeme: text.slice(i, j + 1) });
        i = j + 1;
      } else {
        tokens.push({ kind: "o", lexeme: ch });
        i += 1;
      }
      continue;
    }
    const two = text.slice(i, i + 2);
    if (two === "<=" || two === ">=" || two === "<>" || two === "!=" || two === "||" || two === "&&") {
      tokens.push({ kind: "o", lexeme: two });
      i += 2;
      continue;
    }
    if ("=<>(),;+-*/".includes(ch)) {
      tokens.push({ kind: "o", lexeme: ch });
      i += 1;
      continue;
    }
    const numMatch = text.slice(i).match(/^(?:0x[0-9a-fA-F]+|\d+(?:\.\d+)?)/);
    if (numMatch) {
      tokens.push({ kind: "n", lexeme: numMatch[0] });
      i += numMatch[0].length;
      continue;
    }
    const wordMatch = text.slice(i).match(/^[A-Za-z_@.][A-Za-z0-9_@.$]*/);
    if (wordMatch) {
      const lex = wordMatch[0];
      tokens.push({
        kind: LEXER_KEYWORDS.has(lex.toUpperCase()) ? "k" : "w",
        lexeme: lex,
      });
      i += lex.length;
      continue;
    }
    tokens.push({ kind: "o", lexeme: ch });
    i += 1;
  }
  return tokens;
}

function evaluateAdversarialPayload(rawInput: string) {
  const regexBlocked =
    /(union\s+select|\b(or|and)\s+1\s*=\s*1|')/i.test(rawInput);
  const normalized = normalizeSqlWafInput(rawInput);
  const tokens = tokenizeSqlWafInput(normalized);
  const fingerprint = tokens
    .slice(0, 7)
    .map((t) => t.kind)
    .join("");
  const kws = tokens.filter((t) => t.kind === "k").map((t) => t.lexeme.toUpperCase());
  const hasComment = tokens.some((t) => t.kind === "c");
  const hasQuote = tokens.some((t) => t.kind === "o" && (t.lexeme === "'" || t.lexeme === '"'));
  const ops = tokens.map((t) => t.lexeme);

  const unionGrammar = kws.includes("UNION") && kws.includes("SELECT");
  const tautologyGrammar =
    hasQuote && kws.some((k) => k === "OR" || k === "AND" || k === "XOR") && (ops.includes("=") || hasComment);
  const blindOrFileGrammar =
    kws.some((k) =>
      ["SLEEP", "BENCHMARK", "INFORMATION_SCHEMA", "OUTFILE", "DUMPFILE"].includes(k)
    ) && (ops.includes("(") || hasQuote || kws.includes("INTO"));

  const lexerBlocked = unionGrammar || tautologyGrammar || blindOrFileGrammar;
  let reason = "Cấu trúc từ vựng sạch (không chứa ngữ pháp SQL Injection).";
  if (unionGrammar) {
    reason = "Phát hiện cặp từ khóa UNION + SELECT sau bước giải mã URL và chuẩn hóa bình luận MySQL.";
  } else if (tautologyGrammar) {
    reason = "Phát hiện nháy đơn phá chuỗi kết hợp toán tử logic SQL OR/AND và ký hiệu kết thúc.";
  } else if (blindOrFileGrammar) {
    reason = "Phát hiện hàm định thời / lệnh ghi tệp OUTFILE trong ngữ cảnh thực thi SQL.";
  }

  return {
    rawInput,
    normalized,
    tokens,
    fingerprint,
    regexBlocked,
    lexerBlocked,
    reason,
  };
}

function renderHighlightedCode(
  code: string,
  highlightLines: number[],
  tone: "vuln" | "safe"
) {
  const lines = code.split("\n");
  return lines.map((line, idx) => {
    const trimmedMatch = line.match(/^\s*(\d+)\s/);
    const lineNum = trimmedMatch ? Number(trimmedMatch[1]) : idx + 1;
    const isHighlighted = highlightLines.includes(lineNum);

    return (
      <div
        key={idx}
        className={`px-2 ${
          isHighlighted
            ? tone === "safe"
              ? "border-l-2 border-emerald-400 bg-emerald-500/15 text-emerald-200"
              : "border-l-2 border-rose-400 bg-rose-500/15 text-rose-200"
            : "text-zinc-200"
        }`}
      >
        {line || " "}
      </div>
    );
  });
}

export function Member4Simulator({
  containerRef = "dvwa",
  phpsessid,
  userToken,
  activeTab,
  burpAutoplay,
  terminalAutoplay,
}: Props) {
  const [tab, setTab] = useState<"php" | "poc5" | "waf" | "terminal" | "dvwa" | "eng">(
    activeTab === "m4-poc5-waf"
      ? "poc5"
      : activeTab === "m4-terminal"
      ? "terminal"
      : activeTab === "m4-eng"
      ? "eng"
      : "php"
  );
  const [containerRunning, setContainerRunning] = useState(true);
  const [wafEnabledInDvwa, setWafEnabledInDvwa] = useState(false);
  const [terminalSubView, setTerminalSubView] = useState<"terminal" | "docker">("terminal");
  const [lexerPayloadInput, setLexerPayloadInput] = useState("O'Connor");
  const [lexerResult, setLexerResult] = useState<ReturnType<
    typeof evaluateAdversarialPayload
  > | null>(null);
  const [showSafePdo, setShowSafePdo] = useState(false);
  const lastAutoplayIdRef = useRef(0);
  const lastTermAutoplayIdRef = useRef(0);

  useEffect(() => {
    if (!burpAutoplay || burpAutoplay.id === lastAutoplayIdRef.current) return;
    lastAutoplayIdRef.current = burpAutoplay.id;
    setTab("poc5");
  }, [burpAutoplay]);

  useEffect(() => {
    if (!terminalAutoplay || terminalAutoplay.id === lastTermAutoplayIdRef.current) return;
    lastTermAutoplayIdRef.current = terminalAutoplay.id;
    setTab("terminal");
    setTerminalSubView("terminal");
  }, [terminalAutoplay]);
  const [selectedPhp, setSelectedPhp] = useState<
    "low" | "medium" | "high" | "impossible"
  >("low");
  const [sideBySide, setSideBySide] = useState(false);

  const [cookieSecurity, setCookieSecurity] = useState<"low" | "impossible">("impossible");
  const [includeToken, setIncludeToken] = useState<"missing" | "valid">("valid");
  const [poc5Payload, setPoc5Payload] = useState<string>("1'");
  const [activeToken, setActiveToken] = useState(
    userToken.trim() || "d41d8cd98f00b204e9800998ecf8427e"
  );
  const [syncKey, setSyncKey] = useState(0);
  const [isSendingPoc5, setIsSendingPoc5] = useState(false);

  const [wafInput, setWafInput] = useState("1' OR 1=1");
  const [isTestingWaf, setIsTestingWaf] = useState(false);
  const [wafAuditLogs, setWafAuditLogs] = useState<WafAuditItem[]>([
    {
      id: "waf-seed-1",
      time: "02:18:10",
      payload: "1' OR 1=1",
      blocked: true,
      matchedRuleToken: "'",
    },
  ]);

  const container = containerRef.trim() || "dvwa";
  const session = phpsessid.trim() || "7nst0hrqrfmv744a5ouj7663b0";
  const currentPhp =
    PHP_LEVEL_SOURCES.find((p) => p.level === selectedPhp) ?? PHP_LEVEL_SOURCES[0];
  const compareTarget =
    selectedPhp === "impossible"
      ? PHP_LEVEL_SOURCES[0]
      : PHP_LEVEL_SOURCES.find((p) => p.level === selectedPhp) ?? PHP_LEVEL_SOURCES[0];
  const impossiblePhp = PHP_LEVEL_SOURCES[3];

  const wafMatch = wafInput.match(WAF_REGEX);
  const isWafBlocked = Boolean(wafMatch);

  const rotateToken = () => {
    const chars = "0123456789abcdef";
    let next = "";
    for (let i = 0; i < 32; i++) {
      next += chars[Math.floor(Math.random() * chars.length)];
    }
    setActiveToken(next);
    setSyncKey((k) => k + 1);
  };

  const handleSendPoc5 = () => {
    setIsSendingPoc5(true);
    setSyncKey((k) => k + 1);
    setTimeout(() => {
      setIsSendingPoc5(false);
    }, 260);
  };

  const handleBurpSync = (evt: BurpPacketEvent) => {
    setCookieSecurity(evt.securityLevel);
    setIncludeToken(evt.includeToken ? "valid" : "missing");
    setPoc5Payload(evt.idParam);
    if (evt.userToken) {
      setActiveToken(evt.userToken);
    }
  };

  const recordWafAudit = (val: string) => {
    const m = val.match(WAF_REGEX);
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    const timeStr = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

    setWafAuditLogs((prev) =>
      [
        {
          id: `waf-${Date.now()}-${Math.random()}`,
          time: timeStr,
          payload: val || "(rỗng)",
          blocked: Boolean(m),
          matchedRuleToken: m ? m[0] : "—",
        },
        ...prev,
      ].slice(0, 8)
    );
  };

  const handleTestWaf = (overrideVal?: string) => {
    const targetVal = overrideVal ?? wafInput;
    setIsTestingWaf(true);
    setTimeout(() => {
      setIsTestingWaf(false);
      recordWafAudit(targetVal);
    }, 240);
  };

  const getCheckpointStates = () => {
    if (cookieSecurity === "low") {
      return [
        {
          name: "1. checkToken() · Dòng 5",
          status: "skipped" as const,
          note: "Không tồn tại trong low.php",
        },
        {
          name: "2. is_numeric($id) · Dòng 11",
          status: "skipped" as const,
          note: "Không kiểm tra kiểu dữ liệu",
        },
        {
          name: "3. PDO::PARAM_INT · Dòng 13–15",
          status: "failed" as const,
          note: "Nối chuỗi mysqli trực tiếp -> Dính SQLi!",
        },
      ];
    }

    const tokenPassed = includeToken === "valid";
    const isNumPassed = tokenPassed && /^\d+$/.test(poc5Payload.trim());

    return [
      {
        name: "1. checkToken() · Dòng 5",
        status: tokenPassed ? ("passed" as const) : ("blocked" as const),
        note: tokenPassed
          ? "user_token khớp phiên -> Cho đi tiếp"
          : "Thiếu user_token -> Chặn ngay bằng 302 Found",
      },
      {
        name: "2. is_numeric($id) · Dòng 11",
        status: !tokenPassed
          ? ("unreached" as const)
          : isNumPassed
          ? ("passed" as const)
          : ("blocked" as const),
        note: !tokenPassed
          ? "Chưa chạy tới bước này"
          : isNumPassed
          ? `is_numeric('${poc5Payload}') === true`
          : `is_numeric("${poc5Payload}") === false -> Hủy truy vấn!`,
      },
      {
        name: "3. PDO::PARAM_INT · Dòng 13–15",
        status: !tokenPassed || !isNumPassed ? ("unreached" as const) : ("passed" as const),
        note:
          !tokenPassed || !isNumPassed
            ? "An toàn — CSDL không bị chạm tới"
            : "Biên dịch SQL tách biệt dữ liệu -> 200 OK an toàn",
      },
    ];
  };

  const checkpoints = getCheckpointStates();

  return (
    <div className="rounded-lg border border-hairline bg-surface p-4 sm:p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-hairline pb-3">
        <div>
          <h3 className="flex items-center gap-2 text-sm font-bold text-ink sm:text-base">
            <Code2 className="h-4 w-4 text-accent" aria-hidden="true" />
            Interactive Console — Khánh (Laptop Ubuntu VM 3 · Code 4 Cấp, PoC 5 &amp; WAF)
          </h3>
          <p className="text-xs text-muted">
            Đối chiếu song song mã nguồn PHP 4 cấp độ, theo dõi 3 chốt kiểm soát PoC 5 và kiểm thử nhật ký WAF ModSecurity.
          </p>
        </div>

        <div className="inline-flex flex-wrap rounded-md border border-hairline bg-subtle p-0.5 text-xs">
          {[
            { id: "php" as const, label: "1. PHP 4 Cấp độ" },
            { id: "poc5" as const, label: "2. PoC 5 Đối chứng" },
            { id: "waf" as const, label: "3. WAF ModSecurity" },
            { id: "terminal" as const, label: "4. Terminal & Docker (dvwa)" },
            { id: "dvwa" as const, label: "5. DVWA Web (:8080)" },
            { id: "eng" as const, label: "6. Kỹ sư RASP Lexer WAF" },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`cursor-pointer rounded px-3 py-1 font-medium transition-colors ${
                tab === t.id
                  ? "bg-surface font-semibold text-ink shadow-sm"
                  : "text-muted hover:text-ink"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {tab === "php" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="grid flex-1 grid-cols-2 gap-2 sm:grid-cols-4">
              {PHP_LEVEL_SOURCES.map((item) => {
                const active = selectedPhp === item.level;
                return (
                  <button
                    key={item.level}
                    type="button"
                    onClick={() => setSelectedPhp(item.level as typeof selectedPhp)}
                    className={`cursor-pointer rounded-md border px-3 py-2 text-left text-xs transition-colors ${
                      active
                        ? "border-ink bg-ink font-bold text-canvas"
                        : "border-hairline bg-subtle text-secondary hover:text-ink"
                    }`}
                  >
                    <div className="font-mono font-bold uppercase">{item.level}.php</div>
                    <div className={`mt-0.5 text-[11px] ${active ? "opacity-80" : "text-muted"}`}>
                      {item.badge}
                    </div>
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => setSideBySide((v) => !v)}
              className={`inline-flex cursor-pointer items-center gap-1.5 rounded-md border px-3 py-2 text-xs font-semibold transition-colors ${
                sideBySide
                  ? "border-accent bg-accent text-white"
                  : "border-hairline bg-subtle text-ink hover:bg-canvas"
              }`}
            >
              <Columns2 className="h-3.5 w-3.5" aria-hidden="true" />
              {sideBySide ? "Đang đối chiếu Song song" : "So sánh với impossible.php"}
            </button>
          </div>

          {!sideBySide ? (
            <div className="rounded-lg border border-hairline bg-subtle p-4">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <div className="text-sm font-bold text-ink">{currentPhp.title}</div>
                <span
                  className={`rounded px-2 py-0.5 font-mono text-[11px] font-semibold ${
                    currentPhp.severity === "safe"
                      ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                      : currentPhp.severity === "critical"
                      ? "bg-rose-500/15 text-rose-700 dark:text-rose-300"
                      : "bg-amber-500/15 text-amber-800 dark:text-amber-300"
                  }`}
                >
                  {currentPhp.badge}
                </span>
              </div>
              <p className="mb-3 text-xs leading-relaxed text-secondary">{currentPhp.summary}</p>
              <div className="overflow-hidden rounded-lg border border-zinc-800 bg-[#0d1117]">
                <div className="flex items-center justify-between border-b border-zinc-800 bg-[#161b22] px-3.5 py-2">
                  <div className="flex items-center gap-2.5">
                    <WindowControls />
                    <span className="font-mono text-xs font-semibold text-zinc-200">
                      /var/www/html/vulnerabilities/sqli/source/{selectedPhp}.php
                    </span>
                  </div>
                  <span className="font-mono text-[11px] text-zinc-400">PHP 7.0</span>
                </div>
                <pre className="overflow-x-auto py-3 font-mono text-xs leading-relaxed">
                  <code>
                    {renderHighlightedCode(
                      currentPhp.code,
                      currentPhp.highlightLines,
                      currentPhp.severity === "safe" ? "safe" : "vuln"
                    )}
                  </code>
                </pre>
              </div>
              <div className="mt-3 rounded-md border border-hairline bg-surface px-3 py-2 font-mono text-xs text-ink">
                <strong>Phân tích cơ chế: </strong>
                {currentPhp.bypassDemo}
              </div>
            </div>
          ) : (
            <div className="grid gap-3 lg:grid-cols-2">
              <div className="overflow-hidden rounded-lg border border-zinc-800 bg-[#0d1117]">
                <div className="flex items-center justify-between border-b border-zinc-800 bg-[#161b22] px-3.5 py-2">
                  <div className="flex items-center gap-2.5">
                    <WindowControls />
                    <span className="font-mono text-xs font-semibold text-rose-300">
                      Bị lỗi: {compareTarget.level}.php
                    </span>
                  </div>
                  <span className="font-mono text-[10px] text-rose-400">{compareTarget.badge}</span>
                </div>
                <pre className="overflow-x-auto py-3 font-mono text-xs leading-relaxed">
                  <code>
                    {renderHighlightedCode(
                      compareTarget.code,
                      compareTarget.highlightLines,
                      "vuln"
                    )}
                  </code>
                </pre>
                <div className="border-t border-zinc-800 bg-[#090d13] px-3 py-2 font-mono text-[11px] text-rose-300">
                  {compareTarget.bypassDemo}
                </div>
              </div>

              <div className="overflow-hidden rounded-lg border border-zinc-800 bg-[#0d1117]">
                <div className="flex items-center justify-between border-b border-zinc-800 bg-[#161b22] px-3.5 py-2">
                  <div className="flex items-center gap-2.5">
                    <WindowControls />
                    <span className="font-mono text-xs font-semibold text-emerald-300">
                      Bản vá chuẩn: impossible.php
                    </span>
                  </div>
                  <span className="font-mono text-[10px] text-emerald-400">
                    {impossiblePhp.badge}
                  </span>
                </div>
                <pre className="overflow-x-auto py-3 font-mono text-xs leading-relaxed">
                  <code>
                    {renderHighlightedCode(
                      impossiblePhp.code,
                      impossiblePhp.highlightLines,
                      "safe"
                    )}
                  </code>
                </pre>
                <div className="border-t border-zinc-800 bg-[#090d13] px-3 py-2 font-mono text-[11px] text-emerald-300">
                  {impossiblePhp.bypassDemo}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === "poc5" && (
        <div className="space-y-4">
          <div className="grid gap-3 rounded-md border border-hairline bg-subtle p-3.5 sm:grid-cols-4 items-end">
            <div>
              <div className="mb-1.5 font-mono text-[11px] font-semibold uppercase text-muted">
                Cookie security
              </div>
              <div className="flex gap-1.5">
                {(["low", "impossible"] as const).map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => {
                      setCookieSecurity(lvl);
                      setSyncKey((k) => k + 1);
                    }}
                    className={`flex-1 cursor-pointer rounded border px-2 py-1 font-mono text-xs ${
                      cookieSecurity === lvl
                        ? "border-ink bg-ink font-semibold text-canvas"
                        : "border-hairline bg-surface text-secondary"
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between font-mono text-[11px] font-semibold uppercase text-muted">
                <span>Anti-CSRF token</span>
                <button
                  type="button"
                  onClick={rotateToken}
                  title="Sinh token vòng mới giống DVWA impossible"
                  className="inline-flex cursor-pointer items-center gap-0.5 text-[10px] font-normal text-accent hover:underline"
                >
                  <RotateCcw className="h-2.5 w-2.5" aria-hidden="true" /> Xoay token
                </button>
              </div>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setIncludeToken("missing");
                    setSyncKey((k) => k + 1);
                  }}
                  className={`flex-1 cursor-pointer rounded border px-2 py-1 text-xs ${
                    includeToken === "missing"
                      ? "border-ink bg-ink font-semibold text-canvas"
                      : "border-hairline bg-surface text-secondary"
                  }`}
                >
                  Không đính kèm
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIncludeToken("valid");
                    setSyncKey((k) => k + 1);
                  }}
                  className={`flex-1 cursor-pointer rounded border px-2 py-1 text-xs ${
                    includeToken === "valid"
                      ? "border-ink bg-ink font-semibold text-canvas"
                      : "border-hairline bg-surface text-secondary"
                  }`}
                >
                  Đính kèm user_token
                </button>
              </div>
            </div>

            <div>
              <div className="mb-1.5 font-mono text-[11px] font-semibold uppercase text-muted">
                Tham số id
              </div>
              <div className="flex gap-1.5">
                {(["1", "1'"] as const).map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => {
                      setPoc5Payload(val);
                      setSyncKey((k) => k + 1);
                    }}
                    className={`flex-1 cursor-pointer rounded border px-2 py-1 font-mono text-xs ${
                      poc5Payload === val
                        ? "border-ink bg-ink font-semibold text-canvas"
                        : "border-hairline bg-surface text-secondary"
                    }`}
                  >
                    id={val}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <button
                type="button"
                onClick={handleSendPoc5}
                disabled={isSendingPoc5}
                className="inline-flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50"
              >
                <Play className="h-3.5 w-3.5" aria-hidden="true" />
                {isSendingPoc5 ? "Sending..." : "Gửi Request"}
              </button>
            </div>
          </div>

          {/* 3-Layer Checkpoint Pipeline Visualizer */}
          <div className="grid gap-2.5 sm:grid-cols-3">
            {checkpoints.map((cp) => (
              <div
                key={cp.name}
                className={`rounded-md border p-3 text-xs ${
                  cp.status === "passed"
                    ? "border-emerald-600/40 bg-emerald-500/5"
                    : cp.status === "blocked"
                    ? "border-amber-600/40 bg-amber-500/10"
                    : cp.status === "failed"
                    ? "border-rose-600/50 bg-rose-500/10"
                    : "border-hairline bg-subtle opacity-80"
                }`}
              >
                <div className="flex items-center justify-between gap-2 font-mono font-bold text-ink">
                  <span>{cp.name}</span>
                  {cp.status === "passed" && (
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
                  )}
                  {cp.status === "blocked" && (
                    <ShieldCheck className="h-3.5 w-3.5 text-amber-600" aria-hidden="true" />
                  )}
                  {cp.status === "failed" && (
                    <XCircle className="h-3.5 w-3.5 text-rose-600" aria-hidden="true" />
                  )}
                </div>
                <p className="mt-1 text-[11px] text-secondary">{cp.note}</p>
              </div>
            ))}
          </div>

          <BurpSuiteEmulator
            mode="poc5"
            defaultModule="repeater"
            phpsessid={session}
            userToken={activeToken}
            externalSecurity={cookieSecurity}
            externalIncludeToken={includeToken === "valid"}
            externalId={poc5Payload}
            externalSyncKey={syncKey}
            autoplayRequest={burpAutoplay}
            onActiveTabChange={handleBurpSync}
            onPacketSent={handleBurpSync}
          />
        </div>
      )}

      {tab === "waf" && (
        <div className="space-y-4">
          <div className="rounded-lg border border-hairline bg-subtle p-3.5">
            <div className="mb-2 flex items-center justify-between border-b border-hairline/80 pb-2">
              <div className="flex items-center gap-2.5">
                <WindowControls />
                <Flame className="h-4 w-4 text-accent" aria-hidden="true" />
                <span className="text-xs font-bold text-ink">
                  Mô phỏng Bộ lọc WAF ModSecurity CRS (OWASP A03:2021)
                </span>
              </div>
              <span className="font-mono text-[11px] text-muted">SecRule 100001</span>
            </div>

            <pre className="overflow-x-auto rounded border border-zinc-800 bg-[#0d1117] p-2.5 font-mono text-[11px] text-zinc-300">
{`SecRule ARGS:id "@rx ('|--|#|\\/\\*|UNION|SELECT|OR\\s+\\d+=\\d+)" \\
  "id:100001,phase:2,deny,status:403,log,msg:'Phat hien dau hieu bat thuong trong tham so id - Ngan chan boi ModSecurity',severity:'CRITICAL'"`}
            </pre>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-ink">Payload kiểm thử:</span>
              {[
                "1' OR 1=1",
                "1' UNION SELECT 1,2 #",
                "admin'--",
                "100",
              ].map((txt) => (
                <button
                  key={txt}
                  type="button"
                  onClick={() => {
                    setWafInput(txt);
                    handleTestWaf(txt);
                  }}
                  className={`cursor-pointer rounded border px-2 py-0.5 font-mono text-xs transition-colors ${
                    wafInput === txt
                      ? "border-ink bg-ink font-semibold text-canvas"
                      : "border-hairline bg-surface text-secondary"
                  }`}
                >
                  {txt}
                </button>
              ))}
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <input
                type="text"
                value={wafInput}
                onChange={(e) => setWafInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleTestWaf();
                }}
                placeholder="Nhập chuỗi kiểm tra..."
                className="min-w-[200px] flex-1 rounded-md border border-hairline bg-surface px-3 py-1.5 font-mono text-xs text-ink focus:border-accent focus:outline-none"
              />
              <button
                type="button"
                onClick={() => handleTestWaf()}
                disabled={isTestingWaf}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-md bg-ink px-3 py-1.5 text-xs font-semibold text-canvas hover:opacity-90 disabled:opacity-50"
              >
                <Play className="h-3 w-3" aria-hidden="true" />
                {isTestingWaf ? "Checking..." : "Kiểm tra WAF"}
              </button>
            </div>
          </div>

          <div
            className={`rounded-lg border p-4 ${
              isWafBlocked
                ? "border-rose-500/40 bg-rose-500/5 text-rose-800 dark:text-rose-200"
                : "border-emerald-500/40 bg-emerald-500/5 text-emerald-800 dark:text-emerald-200"
            }`}
          >
            <div className="flex items-start gap-3">
              {isWafBlocked ? (
                <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-rose-600 dark:text-rose-400" />
              ) : (
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
              )}
              <div className="space-y-1">
                <div className="text-sm font-bold">
                  {isWafBlocked
                    ? "403 Forbidden · ĐÃ BỊ WAF CHẶN ĐỨNG"
                    : "200 OK · CHO PHÉP ĐI QUA TẦNG BIÊN WAF"}
                </div>
                <div className="text-xs leading-relaxed opacity-90">
                  {isWafBlocked ? (
                    <>
                      Phát hiện mẫu độc hại:{" "}
                      <code className="font-mono font-bold">{wafMatch?.[0]}</code> trùng khớp luật
                      SecRule 100001. Gói tin bị ngắt ngay tại pha 2 Reverse Proxy, bảo vệ MariaDB phía sau.
                    </>
                  ) : (
                    <>
                      Chuỗi tham số hợp lệ, không chứa ký tự ngắt lệnh hoặc từ khóa SQLi. Gói tin được chuyển tiếp an toàn vào PHP xử lý.
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ModSecurity Audit Log Table */}
          <div className="rounded-lg border border-zinc-800 bg-[#0d1117] p-3.5 font-mono text-xs text-zinc-200">
            <div className="mb-2 flex items-center justify-between border-b border-zinc-800 pb-2">
              <div className="flex items-center gap-2.5">
                <WindowControls
                  onClose={() => setWafAuditLogs([])}
                  closeTitle="Xóa nhật ký WAF"
                />
                <span className="font-bold text-zinc-200">
                  Nhật ký Chặn Tầng biên (/var/log/apache2/modsec_audit.log)
                </span>
              </div>
              <span className="text-[11px] text-zinc-400">
                {wafAuditLogs.length} sự kiện gần nhất
              </span>
            </div>

            {wafAuditLogs.length === 0 ? (
              <div className="py-4 text-center text-zinc-500">
                Chưa có bản ghi kiểm tra nào. Bấm &quot;Kiểm tra WAF&quot; ở trên để ghi log.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[11px]">
                  <thead>
                    <tr className="border-b border-zinc-800 text-zinc-400">
                      <th className="pb-1.5 pr-3">THỜI GIAN</th>
                      <th className="pb-1.5 pr-3">THAM SỐ ARGS:id</th>
                      <th className="pb-1.5 pr-3">TRẠNG THÁI</th>
                      <th className="pb-1.5">MẪU REGEX KHỚP</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60">
                    {wafAuditLogs.map((row) => (
                      <tr key={row.id}>
                        <td className="py-1.5 pr-3 text-zinc-400">{row.time}</td>
                        <td className="py-1.5 pr-3 font-semibold text-zinc-200">{row.payload}</td>
                        <td className="py-1.5 pr-3">
                          <span
                            className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                              row.blocked
                                ? "bg-rose-500/20 text-rose-300"
                                : "bg-emerald-500/20 text-emerald-300"
                            }`}
                          >
                            {row.blocked ? "403 BLOCKED" : "200 PASSED"}
                          </span>
                        </td>
                        <td className="py-1.5 text-amber-300">{row.matchedRuleToken}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {tab === "terminal" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-hairline bg-subtle p-2.5">
            <span className="text-xs font-semibold text-ink">
              Kiểm toán mã nguồn &amp; ModSecurity trên máy Khánh (Ubuntu VM 3 · {container})
            </span>
            <div className="inline-flex rounded border border-hairline bg-surface p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setTerminalSubView("terminal")}
                className={`cursor-pointer rounded px-2.5 py-1 font-medium ${
                  terminalSubView === "terminal"
                    ? "bg-ink font-semibold text-canvas"
                    : "text-muted hover:text-ink"
                }`}
              >
                Ubuntu Terminal (bash)
              </button>
              <button
                type="button"
                onClick={() => setTerminalSubView("docker")}
                className={`cursor-pointer rounded px-2.5 py-1 font-medium ${
                  terminalSubView === "docker"
                    ? "bg-ink font-semibold text-canvas"
                    : "text-muted hover:text-ink"
                }`}
              >
                Docker Container ({container})
              </button>
            </div>
          </div>

          {terminalSubView === "terminal" ? (
            <TerminalEmulator
              os="ubuntu"
              username="khanh"
              hostname="ubuntu-vm"
              containerRef={container}
              phpsessid={session}
              userToken={activeToken}
              containerRunning={containerRunning}
              onContainerRunningChange={setContainerRunning}
              externalWafLogs={wafAuditLogs}
              onWafTested={(val) => recordWafAudit(val)}
              externalCommand={terminalAutoplay}
              stepGroups={[
                {
                  id: "m4-s1",
                  label: "Bước 01: cat -n 4 mức PHP",
                  commands:
                    buildStepTerminalCommands("m4-s1", { container, phpsessid: session }) ?? [],
                },
                {
                  id: "m4-s4",
                  label: "Bước 04: ModSecurity WAF",
                  commands:
                    buildStepTerminalCommands("m4-s4", { container, phpsessid: session }) ?? [],
                },
                {
                  id: "m4-s5",
                  label: "Bước 05: Adversarial Benchmark",
                  commands:
                    buildStepTerminalCommands("m4-s5", { container, phpsessid: session }) ?? [],
                },
                {
                  id: "m4-s6",
                  label: "Bước 06: SQL Lexer & SafePDO",
                  commands:
                    buildStepTerminalCommands("m4-s6", { container, phpsessid: session }) ?? [],
                },
              ]}
              presets={[
                {
                  label: "cat -n /var/www/html/vulnerabilities/sqli/source/impossible.php",
                  command: `docker exec ${container} cat -n /var/www/html/vulnerabilities/sqli/source/impossible.php`,
                },
                {
                  label: "diff -u low.php impossible.php",
                  command:
                    "diff -u /var/www/html/vulnerabilities/sqli/source/low.php /var/www/html/vulnerabilities/sqli/source/impossible.php",
                },
                {
                  label: `docker exec ${container} apache2ctl -M | grep security2`,
                  command: `docker exec ${container} apache2ctl -M | grep security2`,
                },
                {
                  label: 'curl -i "http://127.0.0.1:8080/vulnerabilities/sqli/?id=1\'%20OR%201=1"',
                  command: `curl -i "http://127.0.0.1:8080/vulnerabilities/sqli/?id=1'%20OR%201=1"`,
                },
                {
                  label: `docker exec ${container} tail -n 10 /var/log/apache2/modsec_audit.log`,
                  command: `docker exec ${container} tail -n 10 /var/log/apache2/modsec_audit.log`,
                },
              ]}
            />
          ) : (
            <DockerDesktopEmulator
              platform="ubuntu"
              containerId="215d3a734374"
              containerName={container}
              running={containerRunning}
              onRunningChange={setContainerRunning}
              wafLogs={wafAuditLogs}
              onOpenExternalTerminal={() => setTerminalSubView("terminal")}
            />
          )}
        </div>
      )}

      {tab === "dvwa" && (
        <DvwaWebEmulator
          defaultPage="sqli"
          phpsessid={session}
          userToken={activeToken}
          containerRunning={containerRunning}
          externalSecurityLevel={cookieSecurity}
          onSecurityLevelChange={(lvl) => {
            if (lvl === "low" || lvl === "impossible") {
              setCookieSecurity(lvl);
            }
          }}
          wafEnabled={wafEnabledInDvwa}
          onWafEnabledChange={setWafEnabledInDvwa}
          onWafLogged={(val) => recordWafAudit(val)}
        />
      )}

      {tab === "eng" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-hairline bg-subtle p-4">
            <div>
              <div className="text-sm font-bold text-ink">
                RASP Lexical Tokenizer WAF &amp; Kiến trúc SafePDO (khanh_sql_lexer_waf.py)
              </div>
              <p className="mt-1 text-xs text-muted">
                Đối chiếu Naive Regex (chặn nhầm họ tên &quot;O&apos;Connor&quot; &amp; bỏ lọt bình luận /*!50000UNION*/ / %2527) với Bộ phân tích từ vựng SQL Lexical Tokenizer chuẩn libinjection.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setShowSafePdo((v) => !v)}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-hairline bg-surface px-3 py-1.5 text-xs font-semibold text-ink hover:bg-canvas"
              >
                <Code2 className="h-3.5 w-3.5" aria-hidden="true" />
                {showSafePdo ? "Ẩn mẫu SafePDO" : "Xem mã PHP SafePDO"}
              </button>
              <a
                href="/engineering/khanh_sql_lexer_waf.py"
                download="khanh_sql_lexer_waf.py"
                className="inline-flex items-center gap-1.5 rounded-md border border-hairline bg-surface px-3 py-1.5 font-mono text-xs font-semibold text-ink hover:bg-canvas"
              >
                <Download className="h-3.5 w-3.5" aria-hidden="true" />
                Tải khanh_sql_lexer_waf.py
              </a>
            </div>
          </div>

          {showSafePdo && (
            <div className="rounded-lg border border-zinc-800 bg-[#0d1117] p-4 font-mono text-[11px] text-emerald-300">
              <div className="mb-2 flex items-center gap-2 border-b border-zinc-800 pb-2 text-zinc-300">
                <WindowControls onClose={() => setShowSafePdo(false)} closeTitle="Đóng SafePDO" />
                <span>khanh_safe_pdo.php — FILTER_VALIDATE_INT + PDO::ATTR_EMULATE_PREPARES =&gt; false</span>
              </div>
              <pre className="overflow-x-auto">
{`$id = filter_var($_GET['id'] ?? '', FILTER_VALIDATE_INT, [
    'options' => ['min_range' => 1, 'max_range' => 999999]
]);
if ($id === false) { http_response_code(400); exit('Invalid ID'); }

$pdo = new PDO($dsn, $dbUser, $dbPass, [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_EMULATE_PREPARES => false, // Native MySQL binary prepare protocol
]);
$stmt = $pdo->prepare('SELECT first_name, last_name FROM v_user_public_profile WHERE user_id = :id LIMIT 1');
$stmt->bindValue(':id', $id, PDO::PARAM_INT);
$stmt->execute();`}
              </pre>
            </div>
          )}

          <div className="rounded-lg border border-zinc-800 bg-[#0d1117] p-4 font-mono text-xs text-zinc-200 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 pb-2">
              <div className="flex items-center gap-2">
                <WindowControls onClose={() => setLexerResult(null)} closeTitle="Xóa kết quả Tokenizer" />
                <span className="font-semibold text-violet-300">
                  Kiểm thử Đối nghịch: Naive Regex vs SQL Lexical Tokenizer
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {[
                "1",
                "O'Connor",
                "1' /*!50000UNION*/ /*!50000SELECT*/ user,password FROM users#",
                "1%2527%20OR%201%3D1--%20-",
                "1' AND SLEEP(3)#",
              ].map((sample) => (
                <button
                  key={sample}
                  type="button"
                  onClick={() => {
                    setLexerPayloadInput(sample);
                    setLexerResult(null);
                  }}
                  className="cursor-pointer rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-[11px] text-zinc-300 hover:bg-zinc-800"
                >
                  {sample}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <input
                type="text"
                value={lexerPayloadInput}
                onChange={(e) => {
                  setLexerPayloadInput(e.target.value);
                  setLexerResult(null);
                }}
                aria-label="Chuỗi kiểm thử SQL Lexical Tokenizer"
                className="min-w-[240px] flex-1 rounded border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs text-amber-200 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setLexerResult(evaluateAdversarialPayload(lexerPayloadInput))}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded bg-violet-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-violet-500"
              >
                <Play className="h-3.5 w-3.5" aria-hidden="true" />
                Phân tích Lexical &amp; Đối chiếu Regex
              </button>
            </div>

            {!lexerResult ? (
              <div className="rounded border border-zinc-800 bg-[#05070a] p-6 text-center text-zinc-500">
                Chưa chạy bộ phân tích. Chọn một chuỗi ở trên hoặc nhập payload bất kỳ rồi bấm &quot;Phân tích Lexical &amp; Đối chiếu Regex&quot;.
              </div>
            ) : (
              <div className="space-y-3 rounded border border-zinc-800 bg-[#05070a] p-3.5 text-[11px]">
                <div className="space-y-1">
                  <div>
                    <span className="text-zinc-500">1. Raw Input  : </span>
                    <span className="text-zinc-200">{lexerResult.rawInput}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500">2. Normalized : </span>
                    <span className="text-sky-300">{lexerResult.normalized}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-zinc-500">3. Tokens     :</span>
                    {lexerResult.tokens.map((tok, idx) => (
                      <span
                        key={`${tok.kind}-${idx}`}
                        className={`rounded border px-1.5 py-0.5 text-[10px] font-bold ${
                          tok.kind === "k"
                            ? "border-rose-500/40 bg-rose-500/15 text-rose-300"
                            : tok.kind === "o"
                            ? "border-amber-500/40 bg-amber-500/15 text-amber-300"
                            : tok.kind === "c"
                            ? "border-violet-500/40 bg-violet-500/15 text-violet-300"
                            : "border-zinc-700 bg-zinc-900 text-zinc-300"
                        }`}
                      >
                        {tok.kind}:{tok.lexeme}
                      </span>
                    ))}
                    <span className="ml-2 text-zinc-400">
                      Fingerprint: <strong className="text-emerald-300">{lexerResult.fingerprint || "(empty)"}</strong>
                    </span>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div
                    className={`rounded border p-3 ${
                      lexerResult.regexBlocked
                        ? "border-amber-500/40 bg-amber-950/20"
                        : "border-zinc-700 bg-zinc-900/50"
                    }`}
                  >
                    <div className="font-sans text-xs font-bold text-zinc-300">
                      Naive Regex WAF
                    </div>
                    <div
                      className={`mt-1 font-bold ${
                        lexerResult.regexBlocked ? "text-amber-300" : "text-rose-300"
                      }`}
                    >
                      {lexerResult.regexBlocked ? "BLOCK (Regex khớp ký tự/mẫu tĩnh)" : "ALLOW"}
                    </div>
                    <div className="mt-1 font-sans text-zinc-400">
                      {!lexerResult.regexBlocked && lexerResult.lexerBlocked
                        ? "Âm tính giả (Bypass): Bị lách do mã hóa URL 2 tầng hoặc bình luận /*!50000...*/."
                        : lexerResult.regexBlocked && !lexerResult.lexerBlocked
                        ? "Dương tính giả (False Positive): Chặn nhầm dữ liệu người dùng hợp lệ!"
                        : "Kiểm tra dựa trên khớp chuỗi cơ học."}
                    </div>
                  </div>

                  <div
                    className={`rounded border p-3 ${
                      lexerResult.lexerBlocked
                        ? "border-rose-500/40 bg-rose-950/25"
                        : "border-emerald-500/40 bg-emerald-950/25"
                    }`}
                  >
                    <div className="font-sans text-xs font-bold text-zinc-200">
                      Context-Aware SQL Lexer (RASP)
                    </div>
                    <div
                      className={`mt-1 font-bold ${
                        lexerResult.lexerBlocked ? "text-rose-300" : "text-emerald-300"
                      }`}
                    >
                      {lexerResult.lexerBlocked ? "BLOCK (403 · Ngữ pháp SQLi)" : "ALLOW (200 OK)"}
                    </div>
                    <div className="mt-1 font-sans text-zinc-300">{lexerResult.reason}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
