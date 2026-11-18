"use client";

import { useEffect, useRef, useState } from "react";
import {
  CheckCircle2,
  Download,
  Play,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  Terminal,
} from "lucide-react";
import { WindowControls } from "@/components/WindowBar";
import { DockerDesktopEmulator } from "@/components/simulators/DockerDesktopEmulator";
import { DvwaWebEmulator } from "@/components/simulators/DvwaWebEmulator";
import {
  buildStepTerminalCommands,
  type ExternalTerminalCommand,
  TerminalEmulator,
} from "@/components/simulators/TerminalEmulator";

interface Props {
  containerRef: string;
  activeTab?: string;
  terminalAutoplay?: ExternalTerminalCommand | null;
}

export function Member1Simulator({ containerRef, activeTab, terminalAutoplay }: Props) {
  const [tab, setTab] = useState<"recon" | "docker" | "patch" | "dvwa" | "eng">(
    activeTab === "m1-patch"
      ? "patch"
      : activeTab === "m1-eng"
      ? "eng"
      : "recon"
  );
  const [containerRunning, setContainerRunning] = useState(true);
  const [isRunning, setIsRunning] = useState(false);

  const [apachePatched, setApachePatched] = useState(false);
  const [cookiePatched, setCookiePatched] = useState(false);
  const [readonlyRootfs, setReadonlyRootfs] = useState(false);
  const [capDropAll, setCapDropAll] = useState(false);
  const [noNewPrivs, setNoNewPrivs] = useState(false);
  const [pidsLimited, setPidsLimited] = useState(false);
  const [traceDisabled, setTraceDisabled] = useState(false);
  const [webshellAttemptResult, setWebshellAttemptResult] = useState<{
    blocked: boolean;
    output: string;
  } | null>(null);
  const [gateReport, setGateReport] = useState<{
    score: number;
    verdict: "PASS" | "FAIL";
    exitCode: number;
    checks: { name: string; weight: number; passed: boolean; observed: string }[];
  } | null>(null);
  const lastTermAutoplayIdRef = useRef(0);

  useEffect(() => {
    if (!terminalAutoplay || terminalAutoplay.id === lastTermAutoplayIdRef.current) return;
    lastTermAutoplayIdRef.current = terminalAutoplay.id;
    setTab("recon");
  }, [terminalAutoplay]);

  const containerName = containerRef.trim() || "215d3a734374";
  const remainingFindings = (apachePatched ? 0 : 1) + (cookiePatched ? 0 : 1);
  const vars = { container: containerName, phpsessid: "7nst0hrqrfmv744a5ouj7663b0" };
  const s1 = buildStepTerminalCommands("m1-s1", vars) ?? [];
  const s2 = buildStepTerminalCommands("m1-s2", vars) ?? [];
  const s3 = buildStepTerminalCommands("m1-s3", vars) ?? [];
  const s4 = buildStepTerminalCommands("m1-s4", vars) ?? [];
  const s5 = buildStepTerminalCommands("m1-s5", vars) ?? [];
  const s6 = buildStepTerminalCommands("m1-s6", vars) ?? [];

  const handleRunWebshellProbe = () => {
    if (readonlyRootfs) {
      setWebshellAttemptResult({
        blocked: true,
        output: `mysql> SELECT '<?php system($_GET[0]); ?>' INTO OUTFILE '/var/www/html/shell.php';\nERROR 1 (HY000): Can't create/write to file '/var/www/html/shell.php' (Errcode: 30 "Read-only file system")\n[✓] Kernel Namespace chặn đứng ghi webshell nhờ ReadonlyRootfs = true`,
      });
    } else {
      setWebshellAttemptResult({
        blocked: false,
        output: `mysql> SELECT '<?php system($_GET[0]); ?>' INTO OUTFILE '/var/www/html/shell.php';\nQuery OK, 1 row affected (0.01 sec)\n$ curl "http://127.0.0.1:8080/shell.php?0=id" -> uid=33(www-data) gid=33(www-data)\n[!] RCE THÀNH CÔNG vì Container không bật --read-only!`,
      });
    }
  };

  const handleRunSecurityGate = () => {
    const checks = [
      {
        name: "Server Tokens & Signature Hidden",
        weight: 10,
        passed: apachePatched,
        observed: apachePatched ? "Server: Apache" : "Server: Apache/2.4.25 (Debian)",
      },
      {
        name: "Cookie HttpOnly & Security Headers (XFO/nosniff/CSP)",
        weight: 28,
        passed: cookiePatched,
        observed: cookiePatched ? "HttpOnly; SameSite=Strict; SAMEORIGIN; nosniff" : "Missing security headers",
      },
      {
        name: "HTTP TRACE Method Disabled (XST Prevention)",
        weight: 7,
        passed: traceDisabled,
        observed: traceDisabled ? "HTTP 405 Method Not Allowed" : "HTTP 200 OK (TraceEnable on)",
      },
      {
        name: "ReadonlyRootfs Enabled (--read-only)",
        weight: 18,
        passed: readonlyRootfs,
        observed: `ReadonlyRootfs=${readonlyRootfs}`,
      },
      {
        name: "Linux Capabilities Dropped (--cap-drop=ALL)",
        weight: 14,
        passed: capDropAll,
        observed: capDropAll ? "CapDrop=['ALL']" : "CapDrop=['none']",
      },
      {
        name: "no-new-privileges SecurityOpt",
        weight: 10,
        passed: noNewPrivs,
        observed: noNewPrivs ? "no-new-privileges:true" : "default",
      },
      {
        name: "Resource Quotas (Memory & PidsLimit)",
        weight: 13,
        passed: pidsLimited,
        observed: pidsLimited ? "Memory=512m, PidsLimit=128" : "Unlimited",
      },
    ];
    const total = checks.reduce((acc, c) => acc + c.weight, 0);
    const earned = checks.filter((c) => c.passed).reduce((acc, c) => acc + c.weight, 0);
    const score = Math.round((earned / total) * 100);
    setGateReport({
      score,
      verdict: score >= 85 ? "PASS" : "FAIL",
      exitCode: score >= 85 ? 0 : 1,
      checks,
    });
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

          <div className="inline-flex flex-wrap rounded-md border border-hairline bg-subtle p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setTab("recon")}
              className={`cursor-pointer rounded px-3 py-1 font-medium transition-colors ${
                tab === "recon"
                  ? "bg-surface font-semibold text-ink shadow-sm"
                  : "text-muted hover:text-ink"
              }`}
            >
              1. Terminal macOS (PoC 1)
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
              2. Docker Desktop (Container)
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
              3. Live Patching Apache &amp; Cookie
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
              5. Kỹ sư DevSecOps &amp; Gate
            </button>
          </div>
        </div>
      </div>

      {tab === "recon" && (
        <div className="space-y-4">
          <TerminalEmulator
            os="macos"
            username="soncris"
            hostname="MacBook-Pro"
            containerRef={containerName}
            containerRunning={containerRunning}
            onContainerRunningChange={setContainerRunning}
            apachePatched={apachePatched}
            cookiePatched={cookiePatched}
            onApachePatchedChange={setApachePatched}
            onCookiePatchedChange={setCookiePatched}
            externalCommand={terminalAutoplay}
            stepGroups={[
              { id: "m1-s1", label: "Bước 01: docker ps & nmap", commands: s1 },
              { id: "m1-s2", label: "Bước 02: curl HTTP Headers", commands: s2 },
              { id: "m1-s3", label: "Bước 03: ServerTokens Prod", commands: s3 },
              { id: "m1-s4", label: "Bước 04: Cookie & Security Headers", commands: s4 },
              { id: "m1-s5", label: "Bước 05: Container --read-only", commands: s5 },
              { id: "m1-s6", label: "Bước 06: son_sec_gate.py", commands: s6 },
              { id: "m1-all", label: "Chạy trọn bộ 6 bước", commands: [...s1, ...s2, ...s3, ...s4, ...s5, ...s6] },
            ]}
            presets={[
              { label: "docker ps", command: "docker ps" },
              { label: "nmap -sV -p 8080 127.0.0.1", command: "nmap -sV -p 8080 127.0.0.1" },
              {
                label: "curl -is http://127.0.0.1:8080/login.php | head -n 15",
                command: "curl -is http://127.0.0.1:8080/login.php | head -n 15",
              },
              {
                label: 'curl -Is .../login.php | grep -i "Server:"',
                command: 'curl -Is http://127.0.0.1:8080/login.php | grep -i "Server:"',
              },
              {
                label: `docker exec -it ${containerName} bash`,
                command: `docker exec -it ${containerName} bash`,
              },
            ]}
          />

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
      )}

      {tab === "docker" && (
        <DockerDesktopEmulator
          platform="macos"
          containerId={containerName}
          containerName="epic_dijkstra"
          running={containerRunning}
          onRunningChange={setContainerRunning}
          apachePatched={apachePatched}
          cookiePatched={cookiePatched}
          onOpenExternalTerminal={() => setTab("recon")}
        />
      )}

      {tab === "patch" && (
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

      {tab === "dvwa" && (
        <DvwaWebEmulator
          defaultPage="home"
          containerRunning={containerRunning}
          apachePatched={apachePatched}
          cookiePatched={cookiePatched}
        />
      )}

      {tab === "eng" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-hairline bg-subtle p-4">
            <div>
              <div className="text-sm font-bold text-ink">
                DevSecOps Workbench — Cô lập Kernel Container &amp; Security Gate (son_sec_gate.py)
              </div>
              <p className="mt-1 text-xs text-muted">
                Bật/tắt các cờ bảo vệ hạ tầng rồi bấm kiểm thử ghi Webshell hoặc chạy chốt chặn CI/CD để đánh giá điểm đạt chuẩn (&gt;= 85/100).
              </p>
            </div>
            <a
              href="/engineering/son_sec_gate.py"
              download="son_sec_gate.py"
              className="inline-flex items-center gap-1.5 rounded-md border border-hairline bg-surface px-3 py-1.5 font-mono text-xs font-semibold text-ink hover:bg-canvas"
            >
              <Download className="h-3.5 w-3.5" aria-hidden="true" />
              Tải son_sec_gate.py
            </a>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {/* Hardening Matrix Toggles */}
            <div className="space-y-3 rounded-lg border border-hairline bg-subtle p-4">
              <div className="text-xs font-bold uppercase tracking-wider text-ink">
                1. Cấu hình Container CIS &amp; HTTP Surface
              </div>
              <div className="space-y-2 text-xs">
                {[
                  {
                    id: "ro",
                    label: "--read-only + --tmpfs /tmp,/var/run/apache2 (Khóa ghi đĩa)",
                    checked: readonlyRootfs,
                    onToggle: () => {
                      setReadonlyRootfs((v) => !v);
                      setWebshellAttemptResult(null);
                      setGateReport(null);
                    },
                  },
                  {
                    id: "cap",
                    label: "--cap-drop=ALL (Thu hồi đặc quyền nhân Linux)",
                    checked: capDropAll,
                    onToggle: () => {
                      setCapDropAll((v) => !v);
                      setGateReport(null);
                    },
                  },
                  {
                    id: "nnp",
                    label: "--security-opt=no-new-privileges:true",
                    checked: noNewPrivs,
                    onToggle: () => {
                      setNoNewPrivs((v) => !v);
                      setGateReport(null);
                    },
                  },
                  {
                    id: "pids",
                    label: "--memory=512m --pids-limit=128 (Chống Fork-bomb DoS)",
                    checked: pidsLimited,
                    onToggle: () => {
                      setPidsLimited((v) => !v);
                      setGateReport(null);
                    },
                  },
                  {
                    id: "apache",
                    label: "ServerTokens Prod & ServerSignature Off (Apache)",
                    checked: apachePatched,
                    onToggle: () => {
                      setApachePatched((v) => !v);
                      setGateReport(null);
                    },
                  },
                  {
                    id: "headers",
                    label: "Cookie HttpOnly; SameSite=Strict + XFO + nosniff + CSP",
                    checked: cookiePatched,
                    onToggle: () => {
                      setCookiePatched((v) => !v);
                      setGateReport(null);
                    },
                  },
                  {
                    id: "trace",
                    label: "TraceEnable off (Vô hiệu hóa HTTP TRACE / XST)",
                    checked: traceDisabled,
                    onToggle: () => {
                      setTraceDisabled((v) => !v);
                      setGateReport(null);
                    },
                  },
                ].map((item) => (
                  <label
                    key={item.id}
                    className="flex cursor-pointer items-center justify-between rounded-md border border-hairline bg-surface px-3 py-2 hover:bg-canvas"
                  >
                    <span className="font-mono text-[11px] text-ink">{item.label}</span>
                    <input
                      type="checkbox"
                      checked={item.checked}
                      onChange={item.onToggle}
                      className="h-4 w-4 accent-emerald-600"
                    />
                  </label>
                ))}
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleRunWebshellProbe}
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-rose-600/40 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-500/20 dark:text-rose-300"
                >
                  <Play className="h-3.5 w-3.5" aria-hidden="true" />
                  Thử ghi Webshell (INTO OUTFILE)
                </button>
                <button
                  type="button"
                  onClick={handleRunSecurityGate}
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
                >
                  <Play className="h-3.5 w-3.5" aria-hidden="true" />
                  Chạy son_sec_gate.py
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setReadonlyRootfs(true);
                    setCapDropAll(true);
                    setNoNewPrivs(true);
                    setPidsLimited(true);
                    setApachePatched(true);
                    setCookiePatched(true);
                    setTraceDisabled(true);
                    setWebshellAttemptResult(null);
                    setGateReport(null);
                  }}
                  className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-hairline bg-surface px-2.5 py-1.5 text-xs font-medium text-ink hover:bg-canvas"
                >
                  Bật Full Hardening
                </button>
              </div>
            </div>

            {/* Live Execution Output Column (Empty until Run clicked) */}
            <div className="space-y-3 rounded-lg border border-zinc-800 bg-[#0d1117] p-4 font-mono text-xs text-zinc-200">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                <div className="flex items-center gap-2">
                  <WindowControls />
                  <span className="font-semibold text-zinc-200">
                    2. Kết quả Kiểm chứng Kỹ sư ({containerName})
                  </span>
                </div>
                {gateReport && (
                  <span
                    className={`rounded px-2 py-0.5 text-[11px] font-bold ${
                      gateReport.verdict === "PASS"
                        ? "bg-emerald-500/20 text-emerald-300"
                        : "bg-rose-500/20 text-rose-300"
                    }`}
                  >
                    SCORE: {gateReport.score}/100 ({gateReport.verdict} · exit {gateReport.exitCode})
                  </span>
                )}
              </div>

              {!webshellAttemptResult && !gateReport ? (
                <div className="py-10 text-center text-zinc-500">
                  Chưa chạy kiểm thử. Bấm &quot;Thử ghi Webshell (INTO OUTFILE)&quot; hoặc &quot;Chạy son_sec_gate.py&quot; để quan sát kết quả thực thi.
                </div>
              ) : (
                <div className="space-y-3">
                  {webshellAttemptResult && (
                    <div
                      className={`rounded border p-2.5 ${
                        webshellAttemptResult.blocked
                          ? "border-emerald-500/40 bg-emerald-950/30 text-emerald-300"
                          : "border-rose-500/40 bg-rose-950/30 text-rose-300"
                      }`}
                    >
                      <div className="mb-1 text-[11px] font-bold uppercase">
                        {webshellAttemptResult.blocked
                          ? "[KERNEL DEFENSE] Read-Only RootFS Chặn Webshell"
                          : "[VULNERABLE] RootFS Cho phép Ghi shell.php"}
                      </div>
                      <pre className="whitespace-pre-wrap text-[11px]">
                        {webshellAttemptResult.output}
                      </pre>
                    </div>
                  )}

                  {gateReport && (
                    <div className="space-y-1.5 rounded border border-zinc-800 bg-[#05070a] p-3">
                      <div className="mb-2 text-[11px] font-bold text-zinc-300">
                        python3 public/engineering/son_sec_gate.py --container {containerName}
                      </div>
                      {gateReport.checks.map((chk) => (
                        <div
                          key={chk.name}
                          className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-900 py-1 text-[11px]"
                        >
                          <span className={chk.passed ? "text-emerald-300" : "text-rose-300"}>
                            [{chk.passed ? "PASS" : "FAIL"}] (+{chk.weight}w) {chk.name}
                          </span>
                          <span className="text-zinc-400">{chk.observed}</span>
                        </div>
                      ))}
                      <div className="pt-2 text-xs font-bold text-zinc-100">
                        VERDICT: {gateReport.verdict} (Score {gateReport.score}/100, Threshold 85, Exit {gateReport.exitCode})
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
