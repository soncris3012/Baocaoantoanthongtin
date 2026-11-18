"use client";

import { KeyboardEvent, useState } from "react";
import {
  CheckCircle2,
  Play,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  Terminal,
} from "lucide-react";
import { WindowControls } from "@/components/WindowBar";

interface Props {
  containerRef: string;
  activeTab?: string;
}

interface ShellEntry {
  id: number;
  command: string;
  output: string;
  severity?: "normal" | "warn" | "ok";
}

export function Member1Simulator({ containerRef, activeTab }: Props) {
  const [tab, setTab] = useState<"recon" | "patch">(
    activeTab === "m1-patch" ? "patch" : "recon"
  );
  const [selectedCmd, setSelectedCmd] = useState<
    "docker" | "nmap" | "curl" | "curl_check"
  >("curl");
  const [shellInput, setShellInput] = useState("");
  const [cmdHistory, setCmdHistory] = useState<string[]>([
    "docker ps",
    "nmap -sV -p 8080 127.0.0.1",
    "curl -is http://127.0.0.1:8080/login.php | head -n 15",
  ]);
  const [historyIdx, setHistoryIdx] = useState<number>(-1);
  const [shellEntries, setShellEntries] = useState<ShellEntry[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const [apachePatched, setApachePatched] = useState(false);
  const [cookiePatched, setCookiePatched] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  const containerName = containerRef.trim() || "215d3a734374";
  const serverHeader = apachePatched
    ? "Server: Apache"
    : "Server: Apache/2.4.25 (Debian)";

  const remainingFindings = (apachePatched ? 0 : 1) + (cookiePatched ? 0 : 1);

  const getCommandOutput = (cmdStr: string): { output: string; severity: "normal" | "warn" | "ok" } => {
    const trimmed = cmdStr.trim();
    const lower = trimmed.toLowerCase();

    if (lower === "help" || lower === "?") {
      return {
        severity: "normal",
        output: `Các lệnh được hỗ trợ trong Terminal mô phỏng (Sơn · macOS zsh):
  docker ps                                              Kiểm tra container DVWA đang chạy
  nmap -sV -p 8080 127.0.0.1                             Quét phiên bản dịch vụ cổng 8080
  curl -is http://127.0.0.1:8080/login.php | head -n 15  Thu thập HTTP Response Header (PoC 1)
  curl -Is http://127.0.0.1:8080/login.php               Kiểm tra nhanh trường Server & Cookie
  patch apache                                           Áp dụng ServerTokens Prod & reload Apache
  patch cookie                                           Bật HttpOnly; Secure; SameSite=Strict
  clear                                                  Xóa lịch sử màn hình Terminal`,
      };
    }

    if (lower.startsWith("docker ps")) {
      return {
        severity: "ok",
        output: `CONTAINER ID   IMAGE                  COMMAND      STATUS       PORTS                    NAMES
${containerName.padEnd(14, " ")} vulnerables/web-dvwa   "/main.sh"   Up 2 hours   0.0.0.0:8080->80/tcp     epic_dijkstra`,
      };
    }

    if (lower.startsWith("nmap")) {
      return {
        severity: apachePatched ? "ok" : "warn",
        output: `Starting Nmap 7.95 ( https://nmap.org )
Nmap scan report for localhost (127.0.0.1)
Host is up (0.00021s latency).

PORT     STATE SERVICE VERSION
8080/tcp open  http    ${apachePatched ? "Apache httpd" : "Apache httpd 2.4.25 ((Debian))"}

Service detection performed. 1 service recognized.`,
      };
    }

    if (lower.startsWith("curl") && lower.includes("grep") && lower.includes("server")) {
      return {
        severity: apachePatched ? "ok" : "warn",
        output: serverHeader,
      };
    }

    if (lower.startsWith("curl")) {
      const cookieFlags = cookiePatched
        ? "; path=/; HttpOnly; SameSite=Strict"
        : "; path=/";
      const secCookie = cookiePatched
        ? "Set-Cookie: security=low; HttpOnly; SameSite=Strict"
        : "Set-Cookie: security=low";
      const extraHeaders = cookiePatched
        ? `\nX-Content-Type-Options: nosniff\nX-Frame-Options: SAMEORIGIN`
        : "";

      return {
        severity: apachePatched && cookiePatched ? "ok" : "warn",
        output: `HTTP/1.1 200 OK
Date: Wed, 04 Nov 2026 02:09:19 GMT
${serverHeader}
Set-Cookie: PHPSESSID=2d0vvd715drf3nv8mgq7vderg6${cookieFlags}
Expires: Tue, 23 Jun 2009 12:00:00 GMT
Cache-Control: no-cache, must-revalidate
Pragma: no-cache
${secCookie}${extraHeaders}
Content-Type: text/html;charset=utf-8`,
      };
    }

    if (lower === "patch apache" || lower.includes("a2enconf")) {
      setApachePatched(true);
      return {
        severity: "ok",
        output: `Enabling conf security.
Reloading Apache httpd web server: apache2.
[✓] Đã cấu hình ServerTokens Prod & ServerSignature Off trong /etc/apache2/conf-available/security.conf`,
      };
    }

    if (lower === "patch cookie") {
      setCookiePatched(true);
      return {
        severity: "ok",
        output: `Enabling module headers.
Reloading Apache httpd web server: apache2.
[✓] Đã gắn HttpOnly; SameSite=Strict cho Set-Cookie & bật X-Content-Type-Options: nosniff, X-Frame-Options: SAMEORIGIN`,
      };
    }

    return {
      severity: "normal",
      output: `zsh: không nhận diện lệnh '${trimmed}'. Gõ 'help' để xem danh sách lệnh Lab khả dụng.`,
    };
  };

  const runShellCommand = (cmdStr: string) => {
    const trimmed = cmdStr.trim();
    if (!trimmed) return;

    if (trimmed.toLowerCase() === "clear") {
      setShellEntries([]);
      setShellInput("");
      return;
    }

    setCmdHistory((prev) => [trimmed, ...prev.filter((c) => c !== trimmed)].slice(0, 15));
    setHistoryIdx(-1);
    setShellInput("");
    setIsRunning(true);

    setTimeout(() => {
      const res = getCommandOutput(trimmed);
      setShellEntries((prev) => [
        ...prev,
        {
          id: Date.now(),
          command: trimmed,
          output: res.output,
          severity: res.severity,
        },
      ]);
      setIsRunning(false);
    }, 260);
  };

  const handlePresetClick = (id: "docker" | "nmap" | "curl" | "curl_check") => {
    setSelectedCmd(id);
    setIsMinimized(false);
    setIsRunning(true);
    setTimeout(() => {
      setIsRunning(false);
    }, 320);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      runShellCommand(shellInput);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (cmdHistory.length === 0) return;
      const nextIdx = Math.min(historyIdx + 1, cmdHistory.length - 1);
      setHistoryIdx(nextIdx);
      setShellInput(cmdHistory[nextIdx]);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIdx <= 0) {
        setHistoryIdx(-1);
        setShellInput("");
      } else {
        const nextIdx = historyIdx - 1;
        setHistoryIdx(nextIdx);
        setShellInput(cmdHistory[nextIdx]);
      }
    }
  };

  const handleApplyApachePatch = () => {
    setIsRunning(true);
    setTimeout(() => {
      setApachePatched((v) => !v);
      setIsRunning(false);
    }, 350);
  };

  const handleApplyCookiePatch = () => {
    setIsRunning(true);
    setTimeout(() => {
      setCookiePatched((v) => !v);
      setIsRunning(false);
    }, 350);
  };

  return (
    <div className="rounded-lg border border-hairline bg-surface p-4 sm:p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-hairline pb-3">
        <div>
          <h3 className="flex items-center gap-2 text-sm font-bold text-ink sm:text-base">
            <Terminal className="h-4 w-4 text-accent" aria-hidden="true" />
            Interactive Console — Sơn (MacBook macOS · Docker / Nmap / Apache)
          </h3>
          <p className="text-xs text-muted">
            Gõ lệnh trực tiếp hoặc chọn lệnh mẫu trinh sát; kiểm chứng gia cố Apache Banner &amp; cờ Cookie theo thời gian thực.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`rounded border px-2 py-1 font-mono text-[11px] font-semibold ${
              remainingFindings === 0
                ? "border-emerald-600/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                : "border-amber-600/40 bg-amber-500/10 text-amber-800 dark:text-amber-300"
            }`}
          >
            Lỗ hổng bề mặt còn lại: {remainingFindings}/2
          </span>

          <div className="inline-flex rounded-md border border-hairline bg-subtle p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setTab("recon")}
              className={`cursor-pointer rounded px-3 py-1 font-medium transition-colors ${
                tab === "recon"
                  ? "bg-surface font-semibold text-ink shadow-sm"
                  : "text-muted hover:text-ink"
              }`}
            >
              1. Trinh sát &amp; Terminal (PoC 1)
            </button>
            <button
              type="button"
              onClick={() => setTab("patch")}
              className={`cursor-pointer rounded px-3 py-1 font-medium transition-colors ${
                tab === "patch"
                  ? "bg-surface font-semibold text-ink shadow-sm"
                  : "text-muted hover:text-ink"
              }`}
            >
              2. Live Patching Apache &amp; Cookie
            </button>
          </div>
        </div>
      </div>

      {tab === "recon" ? (
        <div className="space-y-4">
          {/* Preset Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-1 text-xs font-semibold text-ink">Lệnh mẫu:</span>
            {[
              { id: "docker" as const, label: "$ docker ps" },
              { id: "nmap" as const, label: "$ nmap -sV -p 8080 127.0.0.1" },
              { id: "curl" as const, label: "$ curl -is .../login.php | head -n 15" },
              { id: "curl_check" as const, label: "$ curl -Is ... | grep -i Server:" },
            ].map((btn) => (
              <button
                key={btn.id}
                type="button"
                onClick={() => handlePresetClick(btn.id)}
                className={`cursor-pointer rounded-md border px-3 py-1.5 font-mono text-xs transition-colors ${
                  selectedCmd === btn.id
                    ? "border-ink bg-ink font-semibold text-canvas"
                    : "border-hairline bg-subtle text-secondary hover:text-ink"
                }`}
              >
                {btn.label}
              </button>
            ))}

            <button
              type="button"
              onClick={() => handlePresetClick(selectedCmd)}
              disabled={isRunning}
              className="ml-auto inline-flex cursor-pointer items-center gap-1.5 rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              <Play className="h-3 w-3" aria-hidden="true" />
              {isRunning ? "Đang chạy..." : "Chạy lại"}
            </button>
          </div>

          {/* Terminal Box */}
          <div className="overflow-hidden rounded-lg border border-zinc-800 bg-[#0d1117] font-mono text-xs leading-relaxed text-zinc-200">
            <div className="flex items-center justify-between border-b border-zinc-800 bg-[#161b22] px-4 py-2 text-zinc-400">
              <div className="flex items-center gap-2.5">
                <WindowControls
                  onMinimize={() => setIsMinimized((v) => !v)}
                  isMinimized={isMinimized}
                  onClose={() => setShellEntries([])}
                  closeTitle="Xóa log tương tác"
                />
                <span className="text-zinc-400">soncris@MacBook-Pro ~ %</span>{" "}
                <span className="font-semibold text-emerald-300">
                  {selectedCmd === "docker" && "docker ps"}
                  {selectedCmd === "nmap" && "nmap -sV -p 8080 127.0.0.1"}
                  {selectedCmd === "curl" &&
                    "curl -is http://127.0.0.1:8080/login.php | head -n 15"}
                  {selectedCmd === "curl_check" &&
                    "curl -Is http://127.0.0.1:8080/login.php | grep -i 'Server:'"}
                </span>
              </div>
              <span className="text-[10px] uppercase tracking-widest text-zinc-500">
                macOS zsh
              </span>
            </div>

            {!isMinimized && (
              <div className="space-y-3 p-4">
                {isRunning ? (
                  <div className="py-4 text-center text-amber-400">
                    Đang gửi gói tin thăm dò tới 127.0.0.1:8080...
                  </div>
                ) : (
                  <>
                    {selectedCmd === "docker" && (
                      <pre className="overflow-x-auto text-emerald-300">
{`CONTAINER ID   IMAGE                  COMMAND      STATUS       PORTS                    NAMES
${containerName.padEnd(14, " ")} vulnerables/web-dvwa   "/main.sh"   Up 2 hours   0.0.0.0:8080->80/tcp     epic_dijkstra`}
                      </pre>
                    )}

                    {selectedCmd === "nmap" && (
                      <pre className="overflow-x-auto text-zinc-200">
{`Starting Nmap 7.95 ( https://nmap.org )
Nmap scan report for localhost (127.0.0.1)
Host is up (0.00021s latency).

PORT     STATE SERVICE VERSION
8080/tcp open  http    ${apachePatched ? "Apache httpd" : "Apache httpd 2.4.25 ((Debian))"}

Service detection performed. 1 service recognized.`}
                      </pre>
                    )}

                    {selectedCmd === "curl" && (
                      <div className="space-y-0.5 overflow-x-auto text-zinc-300">
                        <div>HTTP/1.1 200 OK</div>
                        <div>Date: Wed, 04 Nov 2026 02:09:19 GMT</div>
                        <div
                          className={`inline-block rounded px-1.5 py-0.5 font-bold ${
                            apachePatched
                              ? "bg-emerald-500/20 text-emerald-300"
                              : "bg-rose-500/20 text-rose-300"
                          }`}
                        >
                          {serverHeader}{" "}
                          {apachePatched
                            ? "[ĐÃ VÁ - ẨN PHIÊN BẢN]"
                            : "[CWE-200: LỘ BẢN 2.4.25]"}
                        </div>
                        <div
                          className={`rounded px-1.5 py-0.5 ${
                            cookiePatched
                              ? "bg-emerald-500/15 text-emerald-300"
                              : "bg-amber-500/15 text-amber-200"
                          }`}
                        >
                          Set-Cookie: PHPSESSID=2d0vvd715drf3nv8mgq7vderg6; path=/
                          {cookiePatched
                            ? "; HttpOnly; SameSite=Strict [ĐÃ GIA CỐ]"
                            : " [CWE-614: Thiếu HttpOnly]"}
                        </div>
                        <div>Expires: Tue, 23 Jun 2009 12:00:00 GMT</div>
                        <div>Cache-Control: no-cache, must-revalidate</div>
                        <div>Pragma: no-cache</div>
                        <div
                          className={`rounded px-1.5 py-0.5 ${
                            cookiePatched
                              ? "bg-emerald-500/15 text-emerald-300"
                              : "bg-amber-500/15 text-amber-200"
                          }`}
                        >
                          {cookiePatched
                            ? "Set-Cookie: security=low; HttpOnly; SameSite=Strict [ĐÃ KHÓA CỜ]"
                            : "Set-Cookie: security=low [Thiếu SameSite=Strict]"}
                        </div>
                        {cookiePatched && (
                          <>
                            <div className="rounded bg-emerald-500/15 px-1.5 py-0.5 text-emerald-300">
                              X-Content-Type-Options: nosniff
                            </div>
                            <div className="rounded bg-emerald-500/15 px-1.5 py-0.5 text-emerald-300">
                              X-Frame-Options: SAMEORIGIN
                            </div>
                          </>
                        )}
                        <div>Content-Type: text/html;charset=utf-8</div>
                      </div>
                    )}

                    {selectedCmd === "curl_check" && (
                      <div className="py-1">
                        <div
                          className={`inline-block rounded px-2.5 py-1 text-sm font-bold ${
                            apachePatched
                              ? "bg-emerald-500/20 text-emerald-300"
                              : "bg-rose-500/20 text-rose-300"
                          }`}
                        >
                          {serverHeader}
                        </div>
                        <div className="mt-2 text-xs text-zinc-400">
                          {apachePatched
                            ? "✓ Đã che giấu hoàn toàn số hiệu 2.4.25 và hệ điều hành Debian."
                            : "⚠ Phiên bản chi tiết đang hiển thị công khai trên HTTP Response."}
                        </div>
                      </div>
                    )}

                    {/* Custom interactive shell entries */}
                    {shellEntries.length > 0 && (
                      <div className="space-y-3 border-t border-zinc-800 pt-3">
                        {shellEntries.map((entry) => (
                          <div key={entry.id} className="space-y-1">
                            <div className="text-zinc-400">
                              <span className="text-emerald-400">soncris@MacBook-Pro ~ %</span>{" "}
                              <span className="text-zinc-100">{entry.command}</span>
                            </div>
                            <pre
                              className={`overflow-x-auto whitespace-pre-wrap rounded border border-zinc-800/80 bg-[#05070a] p-2.5 ${
                                entry.severity === "ok"
                                  ? "text-emerald-300"
                                  : entry.severity === "warn"
                                  ? "text-amber-200"
                                  : "text-zinc-300"
                              }`}
                            >
                              {entry.output}
                            </pre>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Interactive Shell Prompt Input */}
                    <div className="flex flex-wrap items-center gap-2 border-t border-zinc-800/80 pt-3">
                      <span className="text-emerald-400">soncris@MacBook-Pro ~ %</span>
                      <input
                        type="text"
                        value={shellInput}
                        onChange={(e) => setShellInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        aria-label="Nhập lệnh Terminal"
                        placeholder="Gõ lệnh (vd: docker ps, nmap -sV -p 8080 127.0.0.1, patch apache, help)..."
                        className="min-w-[200px] flex-1 bg-transparent font-mono text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => runShellCommand(shellInput)}
                        className="cursor-pointer rounded border border-zinc-700 bg-zinc-800 px-2.5 py-1 text-[11px] font-semibold text-zinc-200 hover:bg-zinc-700"
                      >
                        Enter ↵
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex items-start gap-2.5 rounded-md border border-hairline bg-subtle p-3 text-xs">
              {apachePatched ? (
                <ShieldCheck
                  className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600"
                  aria-hidden="true"
                />
              ) : (
                <ShieldAlert
                  className="mt-0.5 h-4 w-4 shrink-0 text-rose-600"
                  aria-hidden="true"
                />
              )}
              <div>
                <div className="font-semibold text-ink">
                  CWE-200 · CVSS 5.3 (Server Banner)
                </div>
                <p className="mt-0.5 text-muted">
                  {apachePatched
                    ? "Đã vá: Chỉ còn hiển thị 'Server: Apache', ẩn hoàn toàn 2.4.25 và Debian."
                    : "Lộ 'Apache/2.4.25 (Debian)', tạo điều kiện tra cứu CVE khai thác tự động."}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2.5 rounded-md border border-hairline bg-subtle p-3 text-xs">
              {cookiePatched ? (
                <ShieldCheck
                  className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600"
                  aria-hidden="true"
                />
              ) : (
                <ShieldAlert
                  className="mt-0.5 h-4 w-4 shrink-0 text-amber-600"
                  aria-hidden="true"
                />
              )}
              <div>
                <div className="font-semibold text-ink">
                  CWE-614 · CVSS 4.2 (Cookie Flags)
                </div>
                <p className="mt-0.5 text-muted">
                  {cookiePatched
                    ? "Đã bật HttpOnly, Secure và SameSite=Strict — chống đánh cắp cookie qua XSS & CSRF."
                    : "PHPSESSID và security=low thiếu HttpOnly & SameSite=Strict; cấu hình đặt tại Client."}
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-hairline bg-subtle p-3.5">
              <div>
                <div className="text-sm font-semibold text-ink">
                  1. Vá Apache Banner ({containerName})
                </div>
                <div className="text-xs text-muted">
                  <code className="font-mono text-ink">
                    /etc/apache2/conf-available/security.conf
                  </code>
                </div>
              </div>
              {apachePatched ? (
                <button
                  type="button"
                  onClick={handleApplyApachePatch}
                  disabled={isRunning}
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-hairline bg-surface px-3 py-1.5 text-xs font-semibold text-ink hover:bg-canvas"
                >
                  <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" /> Hoàn tác Banner
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleApplyApachePatch}
                  disabled={isRunning}
                  className="inline-flex cursor-pointer items-center gap-2 rounded-md bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
                >
                  <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                  Live Patching Apache
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-hairline bg-subtle p-3.5">
              <div>
                <div className="text-sm font-semibold text-ink">
                  2. Gia cố Cờ Cookie Phiên
                </div>
                <div className="text-xs text-muted">
                  <code className="font-mono text-ink">
                    HttpOnly; Secure; SameSite=Strict
                  </code>
                </div>
              </div>
              {cookiePatched ? (
                <button
                  type="button"
                  onClick={handleApplyCookiePatch}
                  disabled={isRunning}
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-hairline bg-surface px-3 py-1.5 text-xs font-semibold text-ink hover:bg-canvas"
                >
                  <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" /> Hoàn tác Cookie
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleApplyCookiePatch}
                  disabled={isRunning}
                  className="inline-flex cursor-pointer items-center gap-2 rounded-md bg-accent px-3.5 py-2 text-xs font-semibold text-white hover:opacity-90"
                >
                  <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                  Bật cờ HttpOnly &amp; SameSite
                </button>
              )}
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-lg border border-zinc-800 bg-[#0d1117] p-3.5 font-mono text-xs">
              <div className="mb-2 flex items-center justify-between border-b border-zinc-800/80 pb-2">
                <div className="flex items-center gap-2">
                  <WindowControls />
                  <span className="text-[11px] font-bold uppercase tracking-wider text-rose-400">
                    Trước khi vá (Mặc định DVWA)
                  </span>
                </div>
              </div>
              <div className="text-zinc-400">
                $ curl -Is http://127.0.0.1:8080/login.php
              </div>
              <div className="mt-2 space-y-1 rounded bg-rose-500/15 px-2 py-1.5 text-rose-300">
                <div className="font-bold">Server: Apache/2.4.25 (Debian)</div>
                <div>Set-Cookie: PHPSESSID=...; path=/</div>
                <div>Set-Cookie: security=low</div>
              </div>
              <div className="mt-2 text-[11px] text-zinc-500">
                Lộ phiên bản máy chủ để tra CVE và cookie dễ bị đọc qua JavaScript (XSS).
              </div>
            </div>

            <div className="rounded-lg border border-zinc-800 bg-[#0d1117] p-3.5 font-mono text-xs">
              <div className="mb-2 flex items-center justify-between border-b border-zinc-800/80 pb-2">
                <div className="flex items-center gap-2">
                  <WindowControls />
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                    Trạng thái sau khi gia cố
                  </span>
                </div>
              </div>
              <div className="text-zinc-400">
                $ docker exec -it {containerName} bash -c &quot;... service apache2 reload&quot;
              </div>
              <div
                className={`mt-2 space-y-1 rounded px-2 py-1.5 ${
                  apachePatched || cookiePatched
                    ? "bg-emerald-500/15 text-emerald-300"
                    : "bg-zinc-900 text-zinc-500"
                }`}
              >
                <div className="font-bold">
                  {apachePatched
                    ? "Server: Apache   [ĐÃ ẨN 2.4.25 & DEBIAN]"
                    : "Server: Apache/2.4.25 (Debian) [Chưa vá Banner]"}
                </div>
                <div>
                  {cookiePatched
                    ? "Set-Cookie: PHPSESSID=...; HttpOnly; SameSite=Strict"
                    : "Set-Cookie: PHPSESSID=...; path=/ [Chưa bật cờ Cookie]"}
                </div>
                {cookiePatched && (
                  <>
                    <div>X-Content-Type-Options: nosniff</div>
                    <div>X-Frame-Options: SAMEORIGIN</div>
                  </>
                )}
              </div>
              <div className="mt-2 text-[11px] text-zinc-500">
                Quay lại Tab 1 chạy thử <code className="text-zinc-300">nmap</code> hoặc{" "}
                <code className="text-zinc-300">curl</code> để kiểm chứng trực tiếp sự thay đổi.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
