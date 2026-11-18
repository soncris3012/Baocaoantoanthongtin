"use client";

import { useEffect, useRef, useState } from "react";
import { Binary, Bug, Database, Download, FileSearch, Play, RotateCcw } from "lucide-react";
import {
  type BurpAutoplayRequest,
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

interface Props {
  containerRef: string;
  phpsessid: string;
  activeTab?: string;
  burpAutoplay?: BurpAutoplayRequest | null;
  terminalAutoplay?: ExternalTerminalCommand | null;
}

interface AccessLogItem {
  id: string;
  ip: string;
  timestamp: string;
  method: string;
  uri: string;
  status: string;
  bytes: string;
  ua: string;
  iocNote: string;
  isNew?: boolean;
}

const INITIAL_LOG_LINES: AccessLogItem[] = [
  {
    id: "seed-1",
    ip: "172.17.0.1",
    timestamp: "04/Nov/2026:02:14:08 +0000",
    method: "GET",
    uri: "/vulnerabilities/sqli/?id=1%27&Submit=Submit",
    status: "200",
    bytes: "1842",
    ua: "Mozilla/5.0 (Burp Chromium)",
    iocNote: "Ký tự %27 (nháy đơn) phá vỡ câu lệnh, kích hoạt lỗi cú pháp MariaDB",
  },
  {
    id: "seed-2",
    ip: "172.17.0.1",
    timestamp: "04/Nov/2026:02:15:21 +0000",
    method: "GET",
    uri: "/vulnerabilities/sqli/?id=%27%20OR%20%271%27%3D%271&Submit=Submit",
    status: "200",
    bytes: "2195",
    ua: "curl/8.5.0",
    iocNote: "User-Agent là curl + Payload OR '1'='1 trả về dung lượng lớn (2195B)",
  },
  {
    id: "seed-3",
    ip: "172.17.0.1",
    timestamp: "04/Nov/2026:02:16:03 +0000",
    method: "GET",
    uri: "/vulnerabilities/sqli/?id=1%20UNION%20SELECT%20user,password%20FROM%20users&Submit=Submit",
    status: "200",
    bytes: "2340",
    ua: "sqlmap/1.8.4#stable",
    iocNote: "Từ khóa UNION SELECT + User-Agent lộ rõ công cụ tự động sqlmap",
  },
];

export function Member2Simulator({
  containerRef,
  phpsessid,
  activeTab,
  burpAutoplay,
  terminalAutoplay,
}: Props) {
  const [tab, setTab] = useState<"burp" | "logs" | "docker" | "dvwa" | "eng">(
    activeTab === "m2-curl-log"
      ? "logs"
      : activeTab === "m2-eng"
      ? "eng"
      : "burp"
  );
  const [containerRunning, setContainerRunning] = useState(true);
  const [bisectSecret, setBisectSecret] = useState("dvwa");
  const [bisectTrace, setBisectTrace] = useState<{
    extracted: string;
    binaryRequests: number;
    linearBaseline: number;
    savingPct: string;
    steps: { pos: number; low: number; high: number; mid: number; ok: boolean }[];
  } | null>(null);
  const [entropyUriInput, setEntropyUriInput] = useState(
    "/vulnerabilities/sqli_blind/?id=1' AND ASCII(SUBSTRING(version(),1,1))>79#"
  );
  const [entropyResponseBytes, setEntropyResponseBytes] = useState("1791");
  const [entropyResult, setEntropyResult] = useState<{
    h: number;
    z: number;
    verdict: "NORMAL" | "ALERT";
    decodedQuery: string;
  } | null>(null);
  const lastAutoplayIdRef = useRef(0);
  const lastTermAutoplayIdRef = useRef(0);

  useEffect(() => {
    if (!burpAutoplay || burpAutoplay.id === lastAutoplayIdRef.current) return;
    lastAutoplayIdRef.current = burpAutoplay.id;
    setTab("burp");
  }, [burpAutoplay]);

  useEffect(() => {
    if (!terminalAutoplay || terminalAutoplay.id === lastTermAutoplayIdRef.current) return;
    lastTermAutoplayIdRef.current = terminalAutoplay.id;
    setTab("logs");
    setNewLogCount(0);
  }, [terminalAutoplay]);
  const [sentPayload, setSentPayload] = useState("1'");

  const [curlId, setCurlId] = useState("1");
  const [regexFilter, setRegexFilter] = useState("First name: [^<]*");
  const [showRawHtml, setShowRawHtml] = useState(false);
  const [curlExecuted, setCurlExecuted] = useState(false);

  const [logSearch, setLogSearch] = useState("");
  const [liveLogs, setLiveLogs] = useState<AccessLogItem[]>(INITIAL_LOG_LINES);
  const [newLogCount, setNewLogCount] = useState(0);

  const session = phpsessid.trim() || "7nst0hrqrfmv744a5ouj7663b0";
  const container = containerRef.trim() || "dvwa";

  const isUnion = /union\s+select/i.test(sentPayload);
  const isOrTrue = /'\s*or\s*'1'='1|or\s+1=1/i.test(sentPayload);
  const hasSyntaxError = sentPayload.includes("'") && !isOrTrue && !isUnion;

  const formatNowTimestamp = () => {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${pad(d.getDate())}/Nov/2026:${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())} +0700`;
  };

  const describePayloadIoc = (p: string) => {
    if (/union\s+select/i.test(p)) {
      return "Từ khóa UNION SELECT nối bảng users — nghi vấn trích xuất dữ liệu hàng loạt";
    }
    if (/'\s*or\s*'1'='1|or\s+1=1/i.test(p)) {
      return "Biểu thức logic luôn đúng (OR '1'='1) làm rò rỉ toàn bộ bản ghi users";
    }
    if (p.includes("'")) {
      return "Chứa ký tự nháy đơn %27 làm gãy chuỗi SQL, kích hoạt Error-based SQLi";
    }
    return "Truy vấn thông thường hợp lệ (không chứa ký tự điều khiển SQL)";
  };

  const recordLogEntry = (targetPayload: string, ua: string) => {
    const unionMatch = /union\s+select/i.test(targetPayload);
    const orMatch = /'\s*or\s*'1'='1|or\s+1=1/i.test(targetPayload);
    const errMatch = targetPayload.includes("'") && !unionMatch && !orMatch;
    const bytes = unionMatch ? "2340" : orMatch ? "2195" : errMatch ? "1842" : "1690";

    const newItem: AccessLogItem = {
      id: `live-${Date.now()}-${Math.random()}`,
      ip: "127.0.0.1",
      timestamp: formatNowTimestamp(),
      method: "GET",
      uri: `/vulnerabilities/sqli/?id=${encodeURIComponent(targetPayload)}&Submit=Submit`,
      status: "200",
      bytes,
      ua,
      iocNote: describePayloadIoc(targetPayload),
      isNew: true,
    };

    setLiveLogs((prev) => [newItem, ...prev].slice(0, 12));
    setNewLogCount((c) => c + 1);
  };

  const handleRunCurl = () => {
    setCurlExecuted(true);
    recordLogEntry(curlId, "curl/8.5.0");
  };

  const getBackendAnalysis = () => {
    if (isUnion) {
      return {
        statusText: "LỖI TRUY VẤN GHÉP BẢNG (UNION-BASED SQLi)",
        statusClass: "text-amber-300",
        detail:
          "Vế SELECT thứ hai ghép thêm kết quả đọc cột user và password từ bảng users vào chung kết quả hiển thị.",
      };
    }
    if (isOrTrue) {
      return {
        statusText: "ĐIỀU KIỆN WHERE LUÔN ĐÚNG (TAUTOLOGY)",
        statusClass: "text-amber-300",
        detail:
          "Mệnh đề điều kiện biến thành user_id = '' OR '1'='1' (luôn TRUE với mọi dòng) nên MariaDB trả ra toàn bộ 5 tài khoản.",
      };
    }
    if (hasSyntaxError) {
      return {
        statusText: "GÃY CẤU TRÚC CHUỖI SQL (ERROR-BASED SQLi)",
        statusClass: "text-rose-300",
        detail:
          "Dấu nháy đơn chưa đóng cặp khiến bộ phân tích cú pháp MariaDB dừng khẩn cấp và hàm die(mysqli_error()) in lỗi ra giao diện.",
      };
    }
    return {
      statusText: "TRUY VẤN ĐƠN HỢP LỆ",
      statusClass: "text-emerald-300",
      detail:
        "Tham số chỉ chứa giá trị ID bình thường, không làm thay đổi cây cú pháp câu lệnh SELECT.",
    };
  };

  const getCurlFilteredOutput = () => {
    const rawHtmlSnippet = `<div class="vulnerable_code_area">
  <form action="#" method="GET">
    <p>User ID: <input type="text" size="15" name="id"></p>
  </form>
  <pre>ID: ${curlId}<br />First name: admin<br />Surname: admin</pre>
</div>`;

    let matches: string[] = [];
    try {
      const re = new RegExp(regexFilter, "g");
      matches = rawHtmlSnippet.match(re) ?? [];
    } catch {
      matches = ["[Lỗi cú pháp Regex]"];
    }

    return { rawHtmlSnippet, matches };
  };

  const filteredLogs = liveLogs.filter(
    (l) =>
      !logSearch ||
      l.uri.toLowerCase().includes(logSearch.toLowerCase()) ||
      l.iocNote.toLowerCase().includes(logSearch.toLowerCase()) ||
      l.ua.toLowerCase().includes(logSearch.toLowerCase())
  );

  const handleRunBinarySearch = () => {
    const target = bisectSecret.trim().slice(0, 16) || "dvwa";
    const steps: { pos: number; low: number; high: number; mid: number; ok: boolean }[] = [];
    let binReqs = 0;
    const out: string[] = [];

    for (let i = 0; i < target.length; i++) {
      const code = target.charCodeAt(i);
      let low = 32;
      let high = 126;
      while (low < high) {
        const mid = Math.floor((low + high) / 2);
        const ok = code > mid;
        binReqs += 1;
        steps.push({ pos: i + 1, low, high, mid, ok });
        if (ok) {
          low = mid + 1;
        } else {
          high = mid;
        }
      }
      out.push(String.fromCharCode(low));
    }

    const linearBaseline = Math.max(out.length, 1) * 48;
    const savingPct = ((1 - binReqs / linearBaseline) * 100).toFixed(1);
    setBisectTrace({
      extracted: out.join(""),
      binaryRequests: binReqs,
      linearBaseline,
      savingPct,
      steps,
    });
  };

  const handleRunEntropyCheck = () => {
    let decoded = entropyUriInput;
    try {
      decoded = decodeURIComponent(entropyUriInput.replace(/\+/g, " "));
    } catch {
      decoded = entropyUriInput;
    }
    const query = decoded.includes("?") ? decoded.split("?").slice(1).join("?") : decoded;
    const counts = new Map<string, number>();
    for (const ch of query) {
      counts.set(ch, (counts.get(ch) ?? 0) + 1);
    }
    const len = query.length || 1;
    let h = 0;
    for (const cnt of counts.values()) {
      const p = cnt / len;
      h -= p * Math.log2(p);
    }
    const nbytes = Number(entropyResponseBytes) || 1842;
    const baselineMean = 2333.7;
    const baselineStd = 1162.8;
    const z = (nbytes - baselineMean) / baselineStd;
    const verdict = h >= 4.2 || Math.abs(z) >= 1.8 ? "ALERT" : "NORMAL";
    setEntropyResult({ h, z, verdict, decodedQuery: query });
  };

  const backendInfo = getBackendAnalysis();
  const curlResult = getCurlFilteredOutput();

  return (
    <div className="rounded-lg border border-hairline bg-surface p-4 sm:p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-hairline pb-3">
        <div>
          <h3 className="flex items-center gap-2 text-sm font-bold text-ink sm:text-base">
            <Bug className="h-4 w-4 text-accent" aria-hidden="true" />
            Interactive Console — Hùng (Laptop Ubuntu VM 1 · Burp Suite &amp; Log Forensics)
          </h3>
          <p className="font-mono text-xs text-muted">
            Proxy Listener: 127.0.0.1:8081 · Target Host: http://localtest.me:8080 (Loopback Bypass)
          </p>
        </div>

        <div className="inline-flex flex-wrap rounded-md border border-hairline bg-subtle p-0.5 text-xs">
          <button
            type="button"
            onClick={() => setTab("burp")}
            className={`cursor-pointer rounded px-3 py-1 font-medium transition-colors ${
              tab === "burp"
                ? "bg-surface font-semibold text-ink shadow-sm"
                : "text-muted hover:text-ink"
            }`}
          >
            1. Burp Suite v2026.10.1
          </button>
          <button
            type="button"
            onClick={() => {
              setTab("logs");
              setNewLogCount(0);
            }}
            className={`inline-flex cursor-pointer items-center gap-1.5 rounded px-3 py-1 font-medium transition-colors ${
              tab === "logs"
                ? "bg-surface font-semibold text-ink shadow-sm"
                : "text-muted hover:text-ink"
            }`}
          >
            <span>2. Ubuntu Terminal &amp; access.log</span>
            {newLogCount > 0 && (
              <span className="rounded bg-accent px-1.5 py-0.5 font-mono text-[10px] font-bold text-white">
                +{newLogCount}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setTab("docker")}
            className={`cursor-pointer rounded px-3 py-1 font-medium transition-colors ${
              tab === "docker"
                ? "bg-surface font-semibold text-ink shadow-sm"
                : "text-muted hover:text-ink"
            }`}
          >
            3. Docker Container (dvwa)
          </button>
          <button
            type="button"
            onClick={() => setTab("dvwa")}
            className={`cursor-pointer rounded px-3 py-1 font-medium transition-colors ${
              tab === "dvwa"
                ? "bg-surface font-semibold text-ink shadow-sm"
                : "text-muted hover:text-ink"
            }`}
          >
            4. DVWA Web (:8080)
          </button>
          <button
            type="button"
            onClick={() => setTab("eng")}
            className={`cursor-pointer rounded px-3 py-1 font-medium transition-colors ${
              tab === "eng"
                ? "bg-surface font-semibold text-ink shadow-sm"
                : "text-muted hover:text-ink"
            }`}
          >
            5. Kỹ sư Thuật toán &amp; IDS
          </button>
        </div>
      </div>

      {tab === "burp" && (
        <div className="space-y-4">
          <BurpSuiteEmulator
            mode="poc2"
            defaultModule="proxy"
            phpsessid={session}
            autoplayRequest={burpAutoplay}
            onPacketSent={(evt) => {
              setSentPayload(evt.idParam);
              recordLogEntry(
                evt.idParam,
                evt.source === "Proxy Intercept"
                  ? "Mozilla/5.0 (Burp Chromium)"
                  : "Mozilla/5.0 (Burp Repeater)"
              );
            }}
          />

          {/* Live Backend SQL Query Analyzer */}
          <div className="rounded-lg border border-zinc-800 bg-[#0d1117] p-3.5 font-mono text-xs">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 pb-2">
              <div className="flex items-center gap-2.5">
                <WindowControls />
                <Database className="h-3.5 w-3.5 text-zinc-400" aria-hidden="true" />
                <span className="font-bold text-zinc-200">
                  PHÂN TÍCH CÂU LỆNH SQL TẠI BACKEND (low.php dòng 8)
                </span>
              </div>
              <span className={`text-[11px] font-bold ${backendInfo.statusClass}`}>
                {backendInfo.statusText}
              </span>
            </div>

            <div className="overflow-x-auto rounded border border-zinc-800 bg-[#05070a] px-3 py-2 text-zinc-300">
              <span className="text-zinc-500">
                SELECT first_name, last_name FROM users WHERE user_id = &apos;
              </span>
              <span className={`font-bold ${backendInfo.statusClass}`}>{sentPayload}</span>
              <span className="text-zinc-500">&apos;;</span>
            </div>
            <p className="mt-2 font-sans text-xs text-zinc-400">
              {backendInfo.detail} Gói tin vừa gửi đã được ghi nhận vào{" "}
              <button
                type="button"
                onClick={() => {
                  setTab("logs");
                  setNewLogCount(0);
                }}
                className="cursor-pointer font-semibold text-accent underline underline-offset-2"
              >
                access.log ở Tab 2
              </button>
              .
            </p>
          </div>
        </div>
      )}

      {tab === "logs" && (
        <div className="space-y-4">
          <TerminalEmulator
            os="ubuntu"
            username="hung"
            hostname="ubuntu-vm"
            containerRef={container}
            phpsessid={session}
            containerRunning={containerRunning}
            onContainerRunningChange={setContainerRunning}
            externalAccessLogs={liveLogs}
            onCurlLogged={(idParam, ua) => recordLogEntry(idParam, ua)}
            externalCommand={terminalAutoplay}
            stepGroups={[
              {
                id: "m2-s3",
                label: "Bước 03: curl + grep",
                commands: buildStepTerminalCommands("m2-s3", { container, phpsessid: session }) ?? [],
              },
              {
                id: "m2-s4",
                label: "Bước 04: grep access.log",
                commands: buildStepTerminalCommands("m2-s4", { container, phpsessid: session }) ?? [],
              },
              {
                id: "m2-s5",
                label: "Bước 05: hung_blind_bisect.py",
                commands: buildStepTerminalCommands("m2-s5", { container, phpsessid: session }) ?? [],
              },
              {
                id: "m2-s6",
                label: "Bước 06: Entropy & Z-Score IDS",
                commands: buildStepTerminalCommands("m2-s6", { container, phpsessid: session }) ?? [],
              },
              {
                id: "m2-all",
                label: "Chạy trọn bộ Kịch bản",
                commands: [
                  ...(buildStepTerminalCommands("m2-s3", { container, phpsessid: session }) ?? []),
                  ...(buildStepTerminalCommands("m2-s4", { container, phpsessid: session }) ?? []),
                  ...(buildStepTerminalCommands("m2-s5", { container, phpsessid: session }) ?? []),
                  ...(buildStepTerminalCommands("m2-s6", { container, phpsessid: session }) ?? []),
                ],
              },
            ]}
            presets={[
              {
                label: 'curl -s ... | grep -o "First name: [^<]*"',
                command: `curl -s -b "security=low; PHPSESSID=${session}" "http://127.0.0.1:8080/vulnerabilities/sqli/?id=1&Submit=Submit" | grep -o "First name: [^<]*"`,
              },
              {
                label: "curl -s ... ?id=1'&Submit=Submit",
                command: `curl -s -b "security=low; PHPSESSID=${session}" "http://127.0.0.1:8080/vulnerabilities/sqli/?id=1'&Submit=Submit"`,
              },
              {
                label: `docker exec ${container} grep -E ... /var/log/apache2/access.log`,
                command: `docker exec ${container} grep -E "(%27|'|UNION|SELECT)" /var/log/apache2/access.log | tail -n 5`,
              },
              {
                label: "docker ps",
                command: "docker ps",
              },
            ]}
          />

          {/* cURL + grep section */}
          <div className="rounded-lg border border-zinc-800 bg-[#0d1117] p-3.5">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800/80 pb-2">
              <div className="flex items-center gap-2.5">
                <WindowControls />
                <span className="text-xs font-semibold text-zinc-200">
                  PoC 2 (Phần 2): Tự động bóc tách dữ liệu bằng cURL + grep regex
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowRawHtml((v) => !v)}
                  className="cursor-pointer rounded border border-zinc-700 bg-zinc-800 px-2.5 py-1 text-[11px] text-zinc-300 hover:bg-zinc-700"
                >
                  {showRawHtml ? "Ẩn HTML gốc" : "Đối chiếu HTML gốc"}
                </button>
                <button
                  type="button"
                  onClick={handleRunCurl}
                  className="inline-flex cursor-pointer items-center gap-1 rounded bg-emerald-600 px-3 py-1 text-xs font-semibold text-white hover:bg-emerald-500"
                >
                  <Play className="h-3 w-3" aria-hidden="true" /> Chạy cURL + grep
                </button>
              </div>
            </div>

            <div className="mb-2 flex flex-wrap items-center gap-3 font-mono text-xs">
              <div className="flex items-center gap-1.5">
                <span className="text-zinc-400">id=</span>
                <input
                  type="text"
                  value={curlId}
                  onChange={(e) => setCurlId(e.target.value)}
                  aria-label="Tham số id cho cURL"
                  className="w-24 rounded border border-zinc-700 bg-zinc-900 px-2 py-0.5 text-zinc-200 focus:outline-none"
                />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-zinc-400">Regex filter (-o):</span>
                <input
                  type="text"
                  value={regexFilter}
                  onChange={(e) => setRegexFilter(e.target.value)}
                  aria-label="Biểu thức chính quy grep"
                  className="w-48 rounded border border-zinc-700 bg-zinc-900 px-2 py-0.5 text-zinc-200 focus:outline-none"
                />
              </div>
            </div>

            <pre className="overflow-x-auto font-mono text-xs text-zinc-300">
{`hung@ubuntu-vm:~$ curl -s -b "security=low; PHPSESSID=${session}" \\
  "http://127.0.0.1:8080/vulnerabilities/sqli/?id=${encodeURIComponent(curlId)}&Submit=Submit" | grep -o "${regexFilter}"`}
            </pre>

            {showRawHtml && (
              <pre className="mt-2 overflow-x-auto rounded border border-zinc-800 bg-[#05070a] p-2.5 font-mono text-[11px] text-zinc-400">
                {curlResult.rawHtmlSnippet}
              </pre>
            )}

            {curlExecuted && (
              <div className="mt-2 rounded border border-emerald-500/40 bg-emerald-950/30 px-3 py-2 font-mono text-xs text-emerald-300">
                {curlResult.matches.length > 0
                  ? curlResult.matches.join("\n")
                  : "(Không có dòng nào khớp với biểu thức regex hiện tại)"}
              </div>
            )}
          </div>

          {/* access.log Forensics section */}
          <div className="rounded-lg border border-zinc-800 bg-[#0d1117] p-3.5">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800/80 pb-2">
              <div className="flex items-center gap-2.5">
                <WindowControls
                  onClose={() => setLiveLogs(INITIAL_LOG_LINES)}
                  closeTitle="Khôi phục access.log mẫu"
                />
                <FileSearch className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
                <span className="text-xs font-semibold text-zinc-200">
                  Blue Team Log Forensics (/var/log/apache2/access.log · {container})
                </span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Lọc ký tự (%27, UNION, curl)..."
                  value={logSearch}
                  onChange={(e) => setLogSearch(e.target.value)}
                  className="rounded border border-zinc-700 bg-zinc-900 px-2 py-1 font-mono text-xs text-zinc-200 focus:outline-none"
                />
                {logSearch && (
                  <button
                    type="button"
                    onClick={() => setLogSearch("")}
                    className="inline-flex cursor-pointer items-center gap-1 rounded bg-zinc-800 px-2.5 py-1 text-xs text-zinc-300 hover:bg-zinc-700"
                  >
                    Xóa lọc
                  </button>
                )}
                {liveLogs.length > INITIAL_LOG_LINES.length && (
                  <button
                    type="button"
                    onClick={() => setLiveLogs(INITIAL_LOG_LINES)}
                    title="Khôi phục về 3 dòng log chuẩn"
                    className="inline-flex cursor-pointer items-center gap-1 rounded border border-zinc-700 bg-zinc-800 px-2 py-1 text-xs text-zinc-300 hover:bg-zinc-700"
                  >
                    <RotateCcw className="h-3 w-3" aria-hidden="true" /> Reset log
                  </button>
                )}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-[11px] text-zinc-300">
                <thead>
                  <tr className="border-b border-zinc-800 text-zinc-400">
                    <th className="pb-1.5 pr-2">IP NGUỒN</th>
                    <th className="pb-1.5 pr-2">URI &amp; PAYLOAD</th>
                    <th className="pb-1.5 pr-2">BYTES</th>
                    <th className="pb-1.5 pr-2">USER-AGENT</th>
                    <th className="pb-1.5">DẤU HIỆU TẤN CÔNG (IoC)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {filteredLogs.map((log) => (
                    <tr
                      key={log.id}
                      className={`hover:bg-zinc-800/30 ${
                        log.isNew ? "bg-blue-950/20" : ""
                      }`}
                    >
                      <td className="py-2 pr-2 text-zinc-400 whitespace-nowrap">
                        {log.ip}
                        {log.isNew && (
                          <span className="ml-1.5 rounded bg-accent px-1 py-0.5 text-[9px] font-bold text-white">
                            MỚI
                          </span>
                        )}
                      </td>
                      <td className="py-2 pr-2 font-semibold text-amber-300">{log.uri}</td>
                      <td className="py-2 pr-2 text-emerald-400">{log.bytes}B</td>
                      <td className="py-2 pr-2 text-zinc-400">{log.ua}</td>
                      <td className="py-2 font-sans text-rose-300">{log.iocNote}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === "docker" && (
        <DockerDesktopEmulator
          platform="ubuntu"
          containerId="215d3a734374"
          containerName={container}
          running={containerRunning}
          onRunningChange={setContainerRunning}
          accessLogs={liveLogs}
          onOpenExternalTerminal={() => setTab("logs")}
        />
      )}

      {tab === "dvwa" && (
        <DvwaWebEmulator
          defaultPage="sqli"
          defaultHost="localtest.me:8080"
          phpsessid={session}
          containerRunning={containerRunning}
          onSqlRequestLogged={(idParam, ua) => {
            setSentPayload(idParam);
            recordLogEntry(idParam, ua);
          }}
        />
      )}

      {tab === "eng" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-hairline bg-subtle p-4">
            <div>
              <div className="flex items-center gap-2 text-sm font-bold text-ink">
                <Binary className="h-4 w-4 text-accent" aria-hidden="true" />
                Kỹ sư Thuật toán &amp; IDS Toán học (hung_blind_bisect.py)
              </div>
              <p className="mt-1 text-xs text-muted">
                Thực thi Tìm kiếm Nhị phân O(log2 N) bóc tách Blind SQLi giảm ~85% HTTP Request và tính Shannon Entropy H(X) + Z-Score phát hiện bất thường access.log.
              </p>
            </div>
            <a
              href="/engineering/hung_blind_bisect.py"
              download="hung_blind_bisect.py"
              className="inline-flex items-center gap-1.5 rounded-md border border-hairline bg-surface px-3 py-1.5 font-mono text-xs font-semibold text-ink hover:bg-canvas"
            >
              <Download className="h-3.5 w-3.5" aria-hidden="true" />
              Tải hung_blind_bisect.py
            </a>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {/* Binary Search Blind SQLi Tracer */}
            <div className="space-y-3 rounded-lg border border-zinc-800 bg-[#0d1117] p-4 font-mono text-xs text-zinc-200">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                <div className="flex items-center gap-2">
                  <WindowControls onClose={() => setBisectTrace(null)} closeTitle="Xóa trace nhị phân" />
                  <span className="font-semibold text-amber-300">
                    1. Binary Search O(log2 N) Blind SQLi Extractor
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <label className="text-[11px] text-zinc-400" htmlFor="bisect-secret-input">
                  Giá trị database() ẩn:
                </label>
                <input
                  id="bisect-secret-input"
                  type="text"
                  value={bisectSecret}
                  maxLength={16}
                  onChange={(e) => {
                    setBisectSecret(e.target.value);
                    setBisectTrace(null);
                  }}
                  className="w-32 rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs text-amber-200 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleRunBinarySearch}
                  className="inline-flex cursor-pointer items-center gap-1 rounded bg-amber-600 px-3 py-1 text-xs font-semibold text-white hover:bg-amber-500"
                >
                  <Play className="h-3 w-3" aria-hidden="true" />
                  Chạy Tìm kiếm Nhị phân
                </button>
              </div>

              {!bisectTrace ? (
                <div className="rounded border border-zinc-800 bg-[#05070a] p-6 text-center text-zinc-500">
                  Chưa chạy trích xuất. Nhập chuỗi mục tiêu rồi bấm &quot;Chạy Tìm kiếm Nhị phân&quot; để theo dõi từng bước chia đôi khoảng ASCII [32..126].
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="grid grid-cols-3 gap-2 rounded border border-emerald-600/30 bg-emerald-950/20 p-2.5 text-[11px]">
                    <div>
                      <div className="text-zinc-400">Trích xuất:</div>
                      <div className="font-bold text-emerald-300">{bisectTrace.extracted}</div>
                    </div>
                    <div>
                      <div className="text-zinc-400">Binary vs Linear:</div>
                      <div className="font-bold text-amber-300">
                        {bisectTrace.binaryRequests} vs ~{bisectTrace.linearBaseline} req
                      </div>
                    </div>
                    <div>
                      <div className="text-zinc-400">Tiết kiệm log:</div>
                      <div className="font-bold text-sky-300">{bisectTrace.savingPct}%</div>
                    </div>
                  </div>

                  <div className="max-h-56 overflow-y-auto rounded border border-zinc-800 bg-[#05070a] p-2.5 text-[11px] leading-relaxed">
                    {bisectTrace.steps.slice(0, 21).map((st, idx) => (
                      <div
                        key={`${st.pos}-${idx}`}
                        className={st.ok ? "text-emerald-300" : "text-zinc-400"}
                      >
                        Step {String(idx + 1).padStart(2, "0")} [pos={st.pos}] [{st.low}..{st.high}] mid={st.mid} (&apos;{String.fromCharCode(st.mid)}&apos;) |{" "}
                        {st.ok ? "TRUE -> low=mid+1" : "FALSE -> high=mid"}
                      </div>
                    ))}
                    {bisectTrace.steps.length > 21 && (
                      <div className="text-zinc-500">
                        ... ({bisectTrace.steps.length - 21} bước tiếp theo hội tụ hoàn tất)
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Shannon Entropy + Z-Score IDS Analyzer */}
            <div className="space-y-3 rounded-lg border border-zinc-800 bg-[#0d1117] p-4 font-mono text-xs text-zinc-200">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                <div className="flex items-center gap-2">
                  <WindowControls onClose={() => setEntropyResult(null)} closeTitle="Xóa phân tích IDS" />
                  <span className="font-semibold text-sky-300">
                    2. Shannon Entropy H(X) &amp; Response Z-Score IDS
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { label: "Sạch (?id=1)", uri: "/vulnerabilities/sqli/?id=1&Submit=Submit", bytes: "1842" },
                    {
                      label: "Blind Bisect",
                      uri: "/vulnerabilities/sqli_blind/?id=1' AND ASCII(SUBSTRING(version(),1,1))>79#",
                      bytes: "1791",
                    },
                    {
                      label: "UNION Dump",
                      uri: "/vulnerabilities/sqli/?id=1' UNION SELECT user,password FROM users#",
                      bytes: "4920",
                    },
                  ].map((p) => (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => {
                        setEntropyUriInput(p.uri);
                        setEntropyResponseBytes(p.bytes);
                        setEntropyResult(null);
                      }}
                      className="cursor-pointer rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-[10px] text-zinc-300 hover:bg-zinc-800"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>

                <input
                  type="text"
                  value={entropyUriInput}
                  onChange={(e) => {
                    setEntropyUriInput(e.target.value);
                    setEntropyResult(null);
                  }}
                  aria-label="URI log cần đo Entropy"
                  className="w-full rounded border border-zinc-700 bg-zinc-900 px-2.5 py-1.5 text-[11px] text-amber-200 focus:outline-none"
                />

                <div className="flex flex-wrap items-center gap-2">
                  <label className="text-[11px] text-zinc-400" htmlFor="entropy-bytes-input">
                    Response bytes:
                  </label>
                  <input
                    id="entropy-bytes-input"
                    type="number"
                    value={entropyResponseBytes}
                    onChange={(e) => {
                      setEntropyResponseBytes(e.target.value);
                      setEntropyResult(null);
                    }}
                    className="w-24 rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs text-emerald-300 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleRunEntropyCheck}
                    className="inline-flex cursor-pointer items-center gap-1 rounded bg-sky-600 px-3 py-1 text-xs font-semibold text-white hover:bg-sky-500"
                  >
                    <Play className="h-3 w-3" aria-hidden="true" />
                    Tính Entropy &amp; Z-Score
                  </button>
                </div>
              </div>

              {!entropyResult ? (
                <div className="rounded border border-zinc-800 bg-[#05070a] p-6 text-center text-zinc-500">
                  Chưa chạy tính toán IDS. Bấm &quot;Tính Entropy &amp; Z-Score&quot; để định lượng H(X) và phát hiện truy vấn xâm nhập.
                </div>
              ) : (
                <div
                  className={`space-y-2 rounded border p-3 text-[11px] ${
                    entropyResult.verdict === "ALERT"
                      ? "border-rose-500/40 bg-rose-950/30 text-rose-200"
                      : "border-emerald-500/40 bg-emerald-950/30 text-emerald-200"
                  }`}
                >
                  <div className="flex items-center justify-between font-bold">
                    <span>
                      VERDICT:{" "}
                      {entropyResult.verdict === "ALERT" ? "ALERT [SQLi Probe]" : "NORMAL TRAFFIC"}
                    </span>
                    <span>
                      H = {entropyResult.h.toFixed(2)} bits | Z ={" "}
                      {entropyResult.z >= 0 ? `+${entropyResult.z.toFixed(2)}` : entropyResult.z.toFixed(2)}
                    </span>
                  </div>
                  <div className="break-all text-zinc-300">
                    Decoded Query: {entropyResult.decodedQuery}
                  </div>
                  <div className="font-sans text-[11px] text-zinc-400">
                    Ngưỡng kỹ thuật: H(X) &gt;= 4.20 bits (tham số bất định cao) hoặc |Z-score| &gt;= 1.80 (phản hồi phình kích thước bất thường).
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
