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
    method: "GET",
    uri: "/vulnerabilities/sqli/?id=1%27&Submit=Submit",
    status: "200",
    bytes: "1842",
    ua: "Mozilla/5.0 (Burp Chromium)",
    iocNote: "Ký tự %27 (nháy đơn) kích hoạt lỗi cú pháp MariaDB",
  },
  {
    ip: "172.17.0.1",
    method: "GET",
    uri: "/vulnerabilities/sqli/?id=%27%20OR%20%271%27%3D%271&Submit=Submit",
    status: "200",
    bytes: "2195",
    ua: "curl/8.5.0",
    iocNote: "User-Agent là curl + Payload OR '1'='1 trả về dung lượng lớn (2195B)",
  },
  {
    ip: "172.17.0.1",
    method: "GET",
    uri: "/vulnerabilities/sqli/?id=1%20UNION%20SELECT%20user,password%20FROM%20users&Submit=Submit",
    status: "200",
    bytes: "2340",
    ua: "sqlmap/1.8.4#stable",
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
    <div className="rounded-lg border border-hairline bg-surface p-4 sm:p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-hairline pb-3">
        <div>
          <h3 className="flex items-center gap-2 text-sm font-bold text-ink sm:text-base">
            <Bug className="h-4 w-4 text-muted" aria-hidden="true" />
            Interactive Console — Thành viên 2 (Burp Repeater &amp; Log Forensics)
          </h3>
          <p className="font-mono text-xs text-muted">
            Proxy: 127.0.0.1:8081 · Target: http://localtest.me:8080
          </p>
        </div>

        <div className="inline-flex rounded-md border border-hairline bg-subtle p-0.5 text-xs">
          <button
            type="button"
            onClick={() => setTab("burp")}
            className={`cursor-pointer rounded px-3 py-1 font-medium transition-colors ${
              tab === "burp"
                ? "bg-surface text-ink font-semibold"
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
                ? "bg-surface text-ink font-semibold"
                : "text-muted hover:text-ink"
            }`}
          >
            2. cURL + grep &amp; access.log
          </button>
        </div>
      </div>

      {tab === "burp" ? (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2 rounded-md border border-hairline bg-subtle p-3">
            <span className="text-xs font-semibold text-ink">Payload:</span>
            {[
              { label: "id = 1 (Hợp lệ)", val: "1" },
              { label: "id = 1' (Gây lỗi)", val: "1'" },
              { label: "id = ' OR '1'='1 (Dump 5 users)", val: "' OR '1'='1" },
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
                className="w-full rounded-md border border-hairline bg-surface px-2.5 py-1 font-mono text-xs text-ink focus:border-accent focus:outline-none sm:w-44"
                placeholder="Nhập tham số id..."
              />
              <button
                type="button"
                onClick={() => setSentPayload(payload)}
                className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90"
              >
                <Send className="h-3.5 w-3.5" aria-hidden="true" />
                Send
              </button>
            </div>
          </div>

          <div className="grid gap-3 lg:grid-cols-2">
            <div className="rounded-lg border border-zinc-800 bg-[#0d1117] p-3.5 font-mono text-xs">
              <div className="mb-2 flex items-center justify-between border-b border-zinc-800 pb-2">
                <span className="font-bold text-zinc-200">REQUEST (Repeater)</span>
                <span className="text-[11px] text-zinc-400">localtest.me:8080</span>
              </div>
              <pre className="overflow-x-auto leading-relaxed text-zinc-200">
{`GET /vulnerabilities/sqli/?id=${encodedPayload}&Submit=Submit HTTP/1.1
Host: localtest.me:8080
User-Agent: Mozilla/5.0 (Burp Chromium)
Cookie: security=low; PHPSESSID=${session}
Connection: close`}
              </pre>
            </div>

            <div className="rounded-lg border border-zinc-800 bg-[#0d1117] p-3.5 font-mono text-xs">
              <div className="mb-2 flex items-center justify-between border-b border-zinc-800 pb-2">
                <span className="font-bold text-zinc-200">RESPONSE (MariaDB / DVWA)</span>
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
          <div className="rounded-lg border border-zinc-800 bg-[#0d1117] p-3.5">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-semibold text-zinc-200">
                PoC 2 (Phần 2): Tự động bóc tách dữ liệu bằng cURL + grep
              </span>
              <button
                type="button"
                onClick={() => setCurlExecuted(true)}
                className="inline-flex cursor-pointer items-center gap-1 rounded bg-emerald-600 px-3 py-1 text-xs font-semibold text-white hover:bg-emerald-500"
              >
                <Play className="h-3 w-3" aria-hidden="true" /> Chạy cURL + grep
              </button>
            </div>
            <pre className="overflow-x-auto font-mono text-xs text-zinc-300">
{`ubuntu@vm1:~$ curl -s -b "security=low; PHPSESSID=${session}" \\
  "http://127.0.0.1:8080/vulnerabilities/sqli/?id=1&Submit=Submit" | grep -o "First name: [^<]*"`}
            </pre>
            {curlExecuted && (
              <div className="mt-2 rounded border border-emerald-500/40 bg-emerald-950/30 px-3 py-2 font-mono text-xs text-emerald-300">
                First name: admin
              </div>
            )}
          </div>

          <div className="rounded-lg border border-zinc-800 bg-[#0d1117] p-3.5">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 text-xs font-semibold text-zinc-200">
                <FileSearch className="h-3.5 w-3.5 text-zinc-400" aria-hidden="true" />
                Blue Team Log Forensics (/var/log/apache2/access.log)
              </span>
              <button
                type="button"
                onClick={() => setLogsExecuted(true)}
                className="inline-flex cursor-pointer items-center gap-1 rounded bg-zinc-200 px-3 py-1 text-xs font-semibold text-zinc-900 hover:bg-white"
              >
                <Play className="h-3 w-3" aria-hidden="true" /> Quét dấu vết IoC
              </button>
            </div>
            <pre className="overflow-x-auto font-mono text-xs text-zinc-300">
{`ubuntu@vm1:~$ docker exec ${container} grep -E "(\\%27|\\'|UNION|SELECT)" /var/log/apache2/access.log | tail -n 5`}
            </pre>

            {logsExecuted && (
              <div className="mt-3 space-y-2">
                {LOG_LINES.map((log, i) => (
                  <div
                    key={i}
                    className="rounded border border-rose-500/30 bg-rose-950/20 p-2.5 font-mono text-[11px]"
                  >
                    <div className="flex flex-wrap items-center gap-2 text-zinc-200">
                      <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-zinc-200">
                        IP: {log.ip}
                      </span>
                      <span className="rounded bg-rose-500/20 px-1.5 py-0.5 text-rose-300">
                        HTTP {log.status} · {log.bytes} bytes
                      </span>
                      <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-amber-200">
                        UA: {log.ua}
                      </span>
                    </div>
                    <div className="mt-1.5 break-all text-zinc-300">
                      &quot;{log.method} {log.uri} HTTP/1.1&quot;
                    </div>
                    <div className="mt-1 font-sans text-xs text-amber-300">
                      IoC: {log.iocNote}
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
