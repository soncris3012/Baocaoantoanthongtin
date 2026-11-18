"use client";

import { KeyboardEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  Box,
  Check,
  Copy,
  FileCode2,
  FolderTree,
  HardDrive,
  Layers,
  Maximize2,
  Minimize2,
  Network,
  Play,
  RotateCw,
  Search,
  Square,
  Terminal,
} from "lucide-react";
import { WindowControls } from "@/components/WindowBar";
import type {
  AccessLogRecord,
  WafLogRecord,
} from "@/components/simulators/TerminalEmulator";
import { PHP_LEVEL_SOURCES } from "@/data/scenarioData";

type SidebarSection = "containers" | "images" | "volumes" | "network";
type ContainerSubTab = "logs" | "inspect" | "files" | "exec" | "stats";

interface ExecLine {
  id: number;
  command: string;
  output: string;
  isError?: boolean;
}

interface DockerDesktopEmulatorProps {
  platform: "macos" | "ubuntu";
  containerId: string;
  containerName: string;
  running?: boolean;
  onRunningChange?: (running: boolean) => void;
  apachePatched?: boolean;
  cookiePatched?: boolean;
  bcryptApplied?: boolean;
  leastPrivApplied?: boolean;
  accessLogs?: AccessLogRecord[];
  wafLogs?: WafLogRecord[];
  onOpenExternalTerminal?: () => void;
}

const DEFAULT_ACCESS_LOGS: AccessLogRecord[] = [
  {
    ip: "172.17.0.1",
    timestamp: "04/Nov/2026:02:14:08 +0000",
    method: "GET",
    uri: "/vulnerabilities/sqli/?id=1%27&Submit=Submit",
    status: "200",
    bytes: "1842",
    ua: "Mozilla/5.0 (Burp Chromium)",
  },
  {
    ip: "172.17.0.1",
    timestamp: "04/Nov/2026:02:16:03 +0000",
    method: "GET",
    uri: "/vulnerabilities/sqli/?id=1%20UNION%20SELECT%20user,password%20FROM%20users",
    status: "200",
    bytes: "2340",
    ua: "sqlmap/1.8.4",
  },
];

const DEFAULT_WAF_LOGS: WafLogRecord[] = [
  {
    time: "02:18:10",
    payload: "1' OR 1=1",
    blocked: true,
    matchedRuleToken: "'",
  },
];

export function DockerDesktopEmulator({
  platform,
  containerId,
  containerName,
  running,
  onRunningChange,
  apachePatched = false,
  cookiePatched = false,
  bcryptApplied = false,
  leastPrivApplied = false,
  accessLogs = DEFAULT_ACCESS_LOGS,
  wafLogs = DEFAULT_WAF_LOGS,
  onOpenExternalTerminal,
}: DockerDesktopEmulatorProps) {
  const shortId = (containerId.trim() || "215d3a734374").slice(0, 12);
  const fullHashId = `${shortId}c94f82e109b4a7d1e8a5c3f0218e94b7d51a9c2e30948a72bc901e34`;

  const [internalRunning, setInternalRunning] = useState(true);
  const isRunning = running ?? internalRunning;
  const setContainerRunning = (val: boolean) => {
    setInternalRunning(val);
    onRunningChange?.(val);
  };

  const [sidebar, setSidebar] = useState<SidebarSection>("containers");
  const [subTab, setSubTab] = useState<ContainerSubTab>("logs");
  const [searchQuery, setSearchQuery] = useState("");
  const [logSearch, setLogSearch] = useState("");
  const [portNotice, setPortNotice] = useState(false);
  const [restarting, setRestarting] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [inspectMode, setInspectMode] = useState<"table" | "json">("table");
  const [selectedFile, setSelectedFile] = useState<string>(
    "/etc/apache2/conf-available/security.conf"
  );

  const [isMinimized, setIsMinimized] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Built-in Exec tab shell state
  const [execInput, setExecInput] = useState("");
  const [execHistory, setExecHistory] = useState<string[]>([
    "ps aux",
    "apache2 -v",
    "cat /etc/debian_version",
  ]);
  const [execHistIdx, setExecHistIdx] = useState(-1);
  const [execLines, setExecLines] = useState<ExecLine[]>([
    {
      id: 1,
      command: "cat /etc/debian_version && apache2 -v | head -n 1",
      output: "9.13\nServer version: Apache/2.4.25 (Debian)",
    },
  ]);

  const execScrollRef = useRef<HTMLDivElement | null>(null);
  const execInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const el = execScrollRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [execLines.length]);

  useEffect(() => {
    if (!isFullscreen) return;
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") setIsFullscreen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isFullscreen]);

  const handleRestart = () => {
    setRestarting(true);
    setTimeout(() => {
      setContainerRunning(true);
      setRestarting(false);
    }, 360);
  };

  const handleCopyId = async () => {
    try {
      await navigator.clipboard.writeText(shortId);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 1500);
    } catch {
      // ignore clipboard error
    }
  };

  const containerFiles = useMemo(() => {
    const accessText = accessLogs
      .map(
        (l) =>
          `${l.ip} - - [${l.timestamp}] "${l.method} ${l.uri} HTTP/1.1" ${l.status} ${l.bytes} "-" "${l.ua}"`
      )
      .join("\n");

    const wafText = wafLogs
      .map(
        (w) =>
          `[${w.time}] [client 172.17.0.1] ModSecurity: ${
            w.blocked ? "Access denied with code 403" : "Allowed (200)"
          }. Matched "${w.matchedRuleToken}" on ARGS:id="${w.payload}" [id "100001"]`
      )
      .join("\n");

    return [
      {
        path: "/etc/apache2/conf-available/security.conf",
        description: "Cấu hình Server Banner & Security Headers Apache",
        content: `# /etc/apache2/conf-available/security.conf
ServerTokens ${apachePatched ? "Prod" : "OS"}
ServerSignature ${apachePatched ? "Off" : "On"}
TraceEnable Off
${
  cookiePatched
    ? `
# Gia co co Cookie phien & HTTP Security Headers (CWE-614)
Header edit Set-Cookie ^(.*)$ $1;HttpOnly;SameSite=Strict
Header always set X-Content-Type-Options "nosniff"
Header always set X-Frame-Options "SAMEORIGIN"`
    : `
# [Canh bao] Chua cau hinh HttpOnly & SameSite=Strict cho Cookie`
}`,
      },
      {
        path: "/var/www/html/config/config.inc.php",
        description: "Kết nối MariaDB của ứng dụng DVWA",
        content: `<?php
$_DVWA = array();
$_DVWA[ 'db_server' ]   = '127.0.0.1';
$_DVWA[ 'db_database' ] = 'dvwa';
$_DVWA[ 'db_user' ]     = '${leastPrivApplied ? "dvwa_svc" : "root"}';
$_DVWA[ 'db_password' ] = '${leastPrivApplied ? "StrongSvc@Pass2026!" : ""}';
$_DVWA[ 'default_security_level' ] = 'low';
// Trang thai mat khau CSDL: ${
          bcryptApplied ? "Bcrypt Salted ($2y$12$...)" : "MD5 Unsalted (Mac dinh)"
        }
?>`,
      },
      {
        path: "/var/www/html/vulnerabilities/sqli/source/low.php",
        description: "Mã nguồn dễ tổn thương SQL Injection (CWE-89)",
        content: PHP_LEVEL_SOURCES[0]?.code ?? "",
      },
      {
        path: "/var/www/html/vulnerabilities/sqli/source/impossible.php",
        description: "Mã nguồn phòng thủ 3 lớp & PDO::PARAM_INT",
        content: PHP_LEVEL_SOURCES[3]?.code ?? "",
      },
      {
        path: "/var/log/apache2/access.log",
        description: "Nhật ký truy cập HTTP bên trong container",
        content: accessText || "(Chưa có log truy cập mới)",
      },
      {
        path: "/var/log/apache2/modsec_audit.log",
        description: "Nhật ký kiểm tra WAF ModSecurity",
        content: wafText || "(Chưa có sự kiện ModSecurity)",
      },
    ];
  }, [apachePatched, cookiePatched, bcryptApplied, leastPrivApplied, accessLogs, wafLogs]);

  const activeFile =
    containerFiles.find((f) => f.path === selectedFile) ?? containerFiles[0];

  const logEntries = useMemo(() => {
    const lines = [
      `2026-11-18T02:00:01Z [main.sh] Starting MySQL database server: mysqld... OK`,
      `2026-11-18T02:00:02Z [main.sh] Starting Apache httpd: Apache/2.4.25 (Debian)`,
      `2026-11-18T02:00:03Z [apache2] Listening on 0.0.0.0:80 (mapped -> host 0.0.0.0:8080)`,
      `2026-11-18T02:04:10Z [config] ServerTokens=${apachePatched ? "Prod" : "OS"} | CookieFlags=${
        cookiePatched ? "HttpOnly;SameSite=Strict" : "None"
      } | DBUser=${leastPrivApplied ? "dvwa_svc" : "root"} | Hash=${
        bcryptApplied ? "Bcrypt-12" : "MD5"
      }`,
      ...accessLogs.map(
        (l) =>
          `${l.ip} - - [${l.timestamp}] "${l.method} ${l.uri} HTTP/1.1" ${l.status} ${l.bytes} "${l.ua}"`
      ),
      ...wafLogs.map(
        (w) =>
          `[${w.time}] [modsecurity:100001] ${
            w.blocked ? "403 DENIED" : "200 PASSED"
          } ARGS:id="${w.payload}" match="${w.matchedRuleToken}"`
      ),
    ];

    if (!isRunning) {
      lines.push(`2026-11-18T02:20:00Z [dockerd] Container ${shortId} stopped (SIGTERM -> Exit 0).`);
    }

    return lines.filter(
      (line) => !logSearch || line.toLowerCase().includes(logSearch.toLowerCase())
    );
  }, [
    apachePatched,
    cookiePatched,
    leastPrivApplied,
    bcryptApplied,
    accessLogs,
    wafLogs,
    isRunning,
    shortId,
    logSearch,
  ]);

  const inspectJson = useMemo(
    () =>
      JSON.stringify(
        {
          Id: fullHashId,
          Name: `/${containerName}`,
          Platform: "linux",
          Image: "vulnerables/web-dvwa:latest",
          State: {
            Status: isRunning ? "running" : "exited",
            Running: isRunning,
            Pid: isRunning ? 89 : 0,
            ExitCode: 0,
          },
          NetworkSettings: {
            Bridge: "docker0",
            Gateway: "172.17.0.1",
            IPAddress: isRunning ? "172.17.0.2" : "",
            Ports: isRunning
              ? { "80/tcp": [{ HostIp: "0.0.0.0", HostPort: "8080" }] }
              : {},
          },
          HardeningState: {
            ApacheServerTokens: apachePatched ? "Prod" : "OS",
            CookieHttpOnlySameSite: cookiePatched,
            DbHashAlgorithm: bcryptApplied ? "Bcrypt ($2y$12$)" : "MD5 Unsalted",
            DbLeastPrivilegeUser: leastPrivApplied ? "dvwa_svc@localhost" : "root@localhost",
          },
        },
        null,
        2
      ),
    [
      fullHashId,
      containerName,
      isRunning,
      apachePatched,
      cookiePatched,
      bcryptApplied,
      leastPrivApplied,
    ]
  );

  const runExecCommand = (raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed) return;
    if (trimmed.toLowerCase() === "clear") {
      setExecLines([]);
      setExecInput("");
      return;
    }

    setExecHistory((prev) => [trimmed, ...prev.filter((c) => c !== trimmed)].slice(0, 20));
    setExecHistIdx(-1);
    setExecInput("");

    if (!isRunning) {
      setExecLines((prev) => [
        ...prev,
        {
          id: Date.now(),
          command: trimmed,
          output: `Error: Container ${shortId} đang Stopped. Bấm nút Start phía trên để mở shell.`,
          isError: true,
        },
      ]);
      return;
    }

    const lower = trimmed.toLowerCase();
    let output = `bash: ${trimmed.split(/\s+/)[0]}: hỗ trợ ls, pwd, whoami, ps aux, apache2 -v, mysql -V, cat ..., ip a, clear`;
    let isError = false;

    if (lower === "help" || lower === "?") {
      output =
        "Các lệnh Exec nội bộ container: ls, ls -la, pwd, whoami, ps aux, apache2 -v, mysql -V, cat /etc/debian_version, cat /etc/apache2/conf-available/security.conf, ip a, clear";
    } else if (lower === "whoami") {
      output = "root";
    } else if (lower === "pwd") {
      output = "/var/www/html";
    } else if (lower.startsWith("ls")) {
      output = "config/  dvwa/  external/  favicon.ico  index.php  login.php  setup.php  vulnerabilities/";
    } else if (lower === "ps aux" || lower === "ps") {
      output = `PID   USER     COMMAND\n1     root     /bin/sh /main.sh\n47    mysql    /usr/sbin/mysqld\n89    root     /usr/sbin/apache2 -DFOREGROUND\n92    www-data /usr/sbin/apache2 -DFOREGROUND`;
    } else if (lower.includes("apache2 -v")) {
      output = `Server version: Apache/2.4.25 (Debian)\nServerTokens: ${apachePatched ? "Prod" : "OS"}`;
    } else if (lower.includes("mysql -v")) {
      output = `mysql  Ver 15.1 Distrib 10.1.26-MariaDB, for debian-linux-gnu (x86_64)`;
    } else if (lower.includes("debian_version")) {
      output = "9.13";
    } else if (lower.includes("security.conf")) {
      output = containerFiles[0].content;
    } else if (lower.startsWith("ip a")) {
      output = `eth0: inet 172.17.0.2/16 brd 172.17.255.255 scope global eth0`;
    } else {
      isError = true;
    }

    setExecLines((prev) => [...prev, { id: Date.now(), command: trimmed, output, isError }]);
  };

  const handleExecKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      runExecCommand(execInput);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (execHistory.length === 0) return;
      const next = Math.min(execHistIdx + 1, execHistory.length - 1);
      setExecHistIdx(next);
      setExecInput(execHistory[next]);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (execHistIdx <= 0) {
        setExecHistIdx(-1);
        setExecInput("");
      } else {
        const next = execHistIdx - 1;
        setExecHistIdx(next);
        setExecInput(execHistory[next]);
      }
    }
  };

  const matchesGlobalSearch = (text: string) =>
    !searchQuery.trim() || text.toLowerCase().includes(searchQuery.trim().toLowerCase());

  const renderWindow = (fullscreenMode: boolean) => (
    <div
      className={`flex flex-col overflow-hidden rounded-xl border border-[#2a3447] bg-[#0f141c] text-xs text-zinc-200 ${
        fullscreenMode ? "h-[90vh] w-full max-w-6xl shadow-2xl" : "w-full shadow-lg"
      }`}
    >
      {/* Top Docker Desktop Title Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1f293d] bg-[#0b1933] px-3.5 py-2">
        <div className="flex items-center gap-3">
          <WindowControls
            onClose={() => setSidebar("containers")}
            closeTitle="Về màn hình Containers"
            onMinimize={() => setIsMinimized((v) => !v)}
            isMinimized={isMinimized}
            onMaximize={() => {
              setIsMinimized(false);
              setIsFullscreen((v) => !v);
            }}
            isMaximized={fullscreenMode}
          />
          <div className="flex items-center gap-2">
            <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-[#1d63ed] text-white">
              <Box className="h-3.5 w-3.5" aria-hidden="true" />
            </span>
            <span className="font-semibold tracking-tight text-white">
              Docker Desktop 4.36.0
            </span>
            <span className="hidden rounded border border-white/15 bg-white/5 px-1.5 py-0.5 font-mono text-[10px] text-sky-200 sm:inline">
              {platform === "macos" ? "macOS Apple Silicon" : "Ubuntu Engine"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-zinc-400"
              aria-hidden="true"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter containers, images..."
              aria-label="Lọc container hoặc image"
              className="w-40 rounded border border-[#2d3b55] bg-[#091224] py-1 pl-7 pr-2 text-[11px] text-zinc-200 placeholder:text-zinc-500 focus:border-[#1d63ed] focus:outline-none sm:w-52"
            />
          </div>

          <button
            type="button"
            onClick={() => {
              setIsMinimized(false);
              setIsFullscreen((v) => !v);
            }}
            className="inline-flex cursor-pointer items-center gap-1 rounded border border-[#2d3b55] bg-[#131b2b] px-2 py-1 text-[11px] text-zinc-200 hover:bg-[#1b273e]"
          >
            {fullscreenMode ? (
              <>
                <Minimize2 className="h-3 w-3" aria-hidden="true" />
                <span className="hidden sm:inline">Thu nhỏ</span>
              </>
            ) : (
              <>
                <Maximize2 className="h-3 w-3" aria-hidden="true" />
                <span className="hidden sm:inline">Toàn màn hình</span>
              </>
            )}
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          <div
            className={`grid grid-cols-1 md:grid-cols-[190px_minmax(0,1fr)] ${
              fullscreenMode ? "flex-1 overflow-hidden" : ""
            }`}
          >
            {/* Left Sidebar */}
            <aside className="flex flex-row gap-1 overflow-x-auto border-b border-[#1f293d] bg-[#131b2b] p-2 md:flex-col md:border-b-0 md:border-r">
              {[
                { id: "containers" as const, label: "Containers (1)", icon: Box },
                { id: "images" as const, label: "Images (1)", icon: Layers },
                { id: "volumes" as const, label: "Volumes (1)", icon: HardDrive },
                { id: "network" as const, label: "Bridge Network", icon: Network },
              ].map((item) => {
                const Icon = item.icon;
                const active = sidebar === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSidebar(item.id)}
                    className={`flex shrink-0 cursor-pointer items-center gap-2 rounded-md px-2.5 py-2 text-left font-medium transition-colors ${
                      active
                        ? "bg-[#1d63ed] text-white"
                        : "text-zinc-300 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    <span>{item.label}</span>
                  </button>
                );
              })}

              <div className="mt-auto hidden rounded-md border border-[#1f293d] bg-[#0b111c] p-2.5 text-[10.5px] text-zinc-400 md:block">
                <div className="font-semibold text-zinc-200">Lab Topology</div>
                <div className="mt-1 font-mono text-[10px]">
                  Host: 127.0.0.1:8080
                  <br />
                  Container: 172.17.0.2:80
                </div>
              </div>
            </aside>

            {/* Main Panel */}
            <div className="flex min-w-0 flex-col overflow-y-auto p-3.5 space-y-3">
              {sidebar === "containers" && (
                <>
                  {/* Container Summary Card */}
                  {matchesGlobalSearch(`${containerName} ${shortId} vulnerables/web-dvwa 8080`) ? (
                    <div className="rounded-lg border border-[#243047] bg-[#131b2b] p-3">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-start gap-2.5">
                          <span
                            className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${
                              isRunning ? "bg-emerald-400" : "bg-zinc-500"
                            }`}
                          />
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-mono text-sm font-bold text-white">
                                {containerName}
                              </span>
                              <button
                                type="button"
                                onClick={handleCopyId}
                                className="inline-flex cursor-pointer items-center gap-1 rounded border border-[#2d3b55] bg-[#0f141c] px-1.5 py-0.5 font-mono text-[10.5px] text-sky-300 hover:border-sky-400"
                                title="Copy Container ID"
                              >
                                <span>{shortId}</span>
                                {copiedId ? (
                                  <Check className="h-2.5 w-2.5 text-emerald-400" />
                                ) : (
                                  <Copy className="h-2.5 w-2.5" />
                                )}
                              </button>
                              <span
                                className={`rounded px-1.5 py-0.5 font-mono text-[10px] font-bold ${
                                  restarting
                                    ? "bg-amber-500/20 text-amber-300"
                                    : isRunning
                                    ? "bg-emerald-500/20 text-emerald-300"
                                    : "bg-zinc-700 text-zinc-300"
                                }`}
                              >
                                {restarting ? "RESTARTING..." : isRunning ? "RUNNING" : "EXITED (0)"}
                              </span>
                            </div>

                            <div className="mt-1 flex flex-wrap items-center gap-3 font-mono text-[11px] text-zinc-400">
                              <span>Image: vulnerables/web-dvwa:latest</span>
                              <button
                                type="button"
                                onClick={() => setPortNotice((v) => !v)}
                                className="cursor-pointer rounded bg-[#1d63ed]/20 px-1.5 py-0.5 font-semibold text-sky-300 hover:bg-[#1d63ed]/30"
                                title="Xem ánh xạ cổng Host -> Container"
                              >
                                {isRunning ? "8080:80 (0.0.0.0:8080 -> 80/tcp)" : "Ports: —"}
                              </button>
                              <span>CPU: {isRunning ? "0.42%" : "0.00%"}</span>
                              <span>RAM: {isRunning ? "68.4 MB" : "0 MB"}</span>
                            </div>
                          </div>
                        </div>

                        {/* Container Actions */}
                        <div className="flex flex-wrap items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setContainerRunning(!isRunning)}
                            className={`inline-flex cursor-pointer items-center gap-1 rounded px-2.5 py-1 text-[11px] font-semibold text-white ${
                              isRunning
                                ? "bg-rose-600 hover:bg-rose-500"
                                : "bg-emerald-600 hover:bg-emerald-500"
                            }`}
                          >
                            {isRunning ? (
                              <>
                                <Square className="h-3 w-3" aria-hidden="true" /> Stop
                              </>
                            ) : (
                              <>
                                <Play className="h-3 w-3" aria-hidden="true" /> Start
                              </>
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={handleRestart}
                            disabled={restarting}
                            className="inline-flex cursor-pointer items-center gap-1 rounded border border-[#2d3b55] bg-[#1a2438] px-2.5 py-1 text-[11px] text-zinc-200 hover:bg-[#23314c] disabled:opacity-50"
                          >
                            <RotateCw
                              className={`h-3 w-3 ${restarting ? "animate-spin" : ""}`}
                              aria-hidden="true"
                            />
                            Restart
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setSubTab("exec");
                              onOpenExternalTerminal?.();
                            }}
                            className="inline-flex cursor-pointer items-center gap-1 rounded border border-[#2d3b55] bg-[#0f141c] px-2.5 py-1 text-[11px] font-semibold text-sky-300 hover:border-sky-400"
                          >
                            <Terminal className="h-3 w-3" aria-hidden="true" /> Open in Terminal
                          </button>
                        </div>
                      </div>

                      {portNotice && (
                        <div className="mt-2.5 rounded border border-sky-500/30 bg-sky-500/10 px-2.5 py-1.5 font-mono text-[11px] text-sky-200">
                          Cổng <strong>127.0.0.1:8080</strong> (hoặc <strong>localtest.me:8080</strong>) trên máy thật đang chuyển tiếp vào cổng <strong>80/tcp</strong> của container <strong>172.17.0.2</strong>. Vì vậy Burp Suite phải đổi sang cổng <strong>8081</strong> để tránh trùng cổng 8080!
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="rounded border border-zinc-800 p-4 text-center text-zinc-400">
                      Không có container nào khớp từ khóa &quot;{searchQuery}&quot;.
                    </div>
                  )}

                  {/* Container Sub-Tabs */}
                  <div className="flex flex-wrap items-center gap-1 border-b border-[#1f293d]">
                    {[
                      { id: "logs" as const, label: "Logs" },
                      { id: "inspect" as const, label: "Inspect" },
                      { id: "files" as const, label: "Files" },
                      { id: "exec" as const, label: "Exec" },
                      { id: "stats" as const, label: "Stats" },
                    ].map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setSubTab(t.id)}
                        className={`cursor-pointer border-b-2 px-3 py-1.5 font-medium transition-colors ${
                          subTab === t.id
                            ? "border-[#1d63ed] text-white"
                            : "border-transparent text-zinc-400 hover:text-zinc-200"
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>

                  {/* Subtab 1: Logs */}
                  {subTab === "logs" && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] text-zinc-400">
                          Stdout stream từ container <strong className="text-zinc-200">{shortId}</strong>
                        </span>
                        <input
                          type="text"
                          value={logSearch}
                          onChange={(e) => setLogSearch(e.target.value)}
                          placeholder="Tìm trong Logs..."
                          className="w-44 rounded border border-[#243047] bg-[#0b111c] px-2 py-1 font-mono text-[11px] text-zinc-200 focus:border-[#1d63ed] focus:outline-none"
                        />
                      </div>
                      <pre className="max-h-[260px] overflow-auto rounded border border-[#1f293d] bg-[#090d14] p-3 font-mono text-[11px] leading-relaxed text-zinc-300">
                        {logEntries.join("\n") || "(Không có dòng log khớp)"}
                      </pre>
                    </div>
                  )}

                  {/* Subtab 2: Inspect */}
                  {subTab === "inspect" && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-zinc-400">
                          Metadata Container &amp; Trạng thái Vá lỗi
                        </span>
                        <div className="inline-flex rounded border border-[#243047] bg-[#0b111c] p-0.5 text-[11px]">
                          <button
                            type="button"
                            onClick={() => setInspectMode("table")}
                            className={`cursor-pointer rounded px-2 py-0.5 ${
                              inspectMode === "table" ? "bg-[#1d63ed] text-white" : "text-zinc-400"
                            }`}
                          >
                            Bảng tóm tắt
                          </button>
                          <button
                            type="button"
                            onClick={() => setInspectMode("json")}
                            className={`cursor-pointer rounded px-2 py-0.5 ${
                              inspectMode === "json" ? "bg-[#1d63ed] text-white" : "text-zinc-400"
                            }`}
                          >
                            JSON gốc
                          </button>
                        </div>
                      </div>

                      {inspectMode === "table" ? (
                        <div className="grid gap-2 sm:grid-cols-2">
                          {[
                            ["CONTAINER ID", fullHashId.slice(0, 24) + "..."],
                            ["NAME", `/${containerName}`],
                            ["STATUS", isRunning ? "running (Pid 89)" : "exited (0)"],
                            ["NETWORK BRIDGE", "docker0 (Gateway 172.17.0.1)"],
                            ["CONTAINER IP", isRunning ? "172.17.0.2/16" : "—"],
                            ["PORT MAPPING", isRunning ? "0.0.0.0:8080 -> 80/tcp" : "Stopped"],
                            ["APACHE SERVERTOKENS", apachePatched ? "Prod (Đã vá CWE-200)" : "OS (Lộ Apache/2.4.25)"],
                            ["COOKIE FLAGS", cookiePatched ? "HttpOnly; SameSite=Strict" : "Không (Lộ CWE-614)"],
                            ["DB PASSWORD HASH", bcryptApplied ? "Bcrypt ($2y$12$)" : "MD5 Unsalted"],
                            ["DB ACCOUNT", leastPrivApplied ? "dvwa_svc@localhost" : "root@localhost"],
                          ].map(([k, v]) => (
                            <div
                              key={k}
                              className="flex items-center justify-between rounded border border-[#1f293d] bg-[#090d14] px-2.5 py-1.5 font-mono text-[11px]"
                            >
                              <span className="text-zinc-400">{k}</span>
                              <span className="font-semibold text-sky-200">{v}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <pre className="max-h-[260px] overflow-auto rounded border border-[#1f293d] bg-[#090d14] p-3 font-mono text-[11px] text-emerald-300">
                          {inspectJson}
                        </pre>
                      )}
                    </div>
                  )}

                  {/* Subtab 3: Files */}
                  {subTab === "files" && (
                    <div className="grid gap-3 md:grid-cols-[240px_minmax(0,1fr)]">
                      <div className="space-y-1 rounded border border-[#1f293d] bg-[#090d14] p-2">
                        <div className="mb-1 flex items-center gap-1.5 px-1 text-[10.5px] font-semibold uppercase text-zinc-400">
                          <FolderTree className="h-3 w-3" aria-hidden="true" /> Cây Tệp Container
                        </div>
                        {containerFiles.map((f) => (
                          <button
                            key={f.path}
                            type="button"
                            onClick={() => setSelectedFile(f.path)}
                            className={`flex w-full cursor-pointer items-center gap-1.5 rounded px-2 py-1 text-left font-mono text-[10.5px] ${
                              selectedFile === f.path
                                ? "bg-[#1d63ed] font-semibold text-white"
                                : "text-zinc-300 hover:bg-white/5"
                            }`}
                          >
                            <FileCode2 className="h-3 w-3 shrink-0" aria-hidden="true" />
                            <span className="truncate">{f.path}</span>
                          </button>
                        ))}
                      </div>

                      <div className="rounded border border-[#1f293d] bg-[#090d14] p-3">
                        <div className="mb-2 flex items-center justify-between border-b border-[#1f293d] pb-1.5">
                          <span className="font-mono text-[11px] font-bold text-sky-300">
                            {activeFile.path}
                          </span>
                          <span className="text-[10.5px] text-zinc-400">{activeFile.description}</span>
                        </div>
                        <pre className="max-h-[220px] overflow-auto font-mono text-[11px] leading-relaxed text-zinc-200">
                          {activeFile.content}
                        </pre>
                      </div>
                    </div>
                  )}

                  {/* Subtab 4: Exec */}
                  {subTab === "exec" && (
                    <div
                      ref={execScrollRef}
                      onClick={() => {
                        if (!window.getSelection()?.toString()) {
                          execInputRef.current?.focus();
                        }
                      }}
                      className="max-h-[260px] min-h-[200px] cursor-text overflow-y-auto rounded border border-[#1f293d] bg-[#090d14] p-3 font-mono text-[11px] leading-relaxed"
                    >
                      <div className="mb-2 text-zinc-400">
                        Docker Container Exec Shell — <span className="text-sky-300">{shortId}</span> (Gõ{" "}
                        <code>ps aux</code>, <code>apache2 -v</code>, <code>ls</code>, <code>help</code>, <code>clear</code>)
                      </div>

                      <div className="space-y-2">
                        {execLines.map((line) => (
                          <div key={line.id}>
                            <div className="text-zinc-300">
                              <span className="font-bold text-amber-300">
                                root@{shortId}:/var/www/html#
                              </span>{" "}
                              {line.command}
                            </div>
                            <pre
                              className={`mt-0.5 whitespace-pre-wrap ${
                                line.isError ? "text-rose-300" : "text-emerald-300"
                              }`}
                            >
                              {line.output}
                            </pre>
                          </div>
                        ))}
                      </div>

                      <div className="mt-2.5 flex items-center gap-1.5 border-t border-[#1f293d] pt-2">
                        <span className="font-bold text-amber-300">root@{shortId}:/var/www/html#</span>
                        <input
                          ref={execInputRef}
                          type="text"
                          value={execInput}
                          onChange={(e) => setExecInput(e.target.value)}
                          onKeyDown={handleExecKey}
                          placeholder="Gõ lệnh bên trong container..."
                          aria-label="Lệnh Docker Exec"
                          className="min-w-[160px] flex-1 bg-transparent font-mono text-[11px] text-zinc-100 placeholder:text-zinc-600 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => runExecCommand(execInput)}
                          className="cursor-pointer rounded bg-[#1d63ed] px-2 py-0.5 font-sans text-[10px] font-semibold text-white"
                        >
                          Run
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Subtab 5: Stats */}
                  {subTab === "stats" && (
                    <div className="space-y-3">
                      <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
                        {[
                          { label: "CPU Usage", value: isRunning ? "0.42%" : "0.00%", pct: isRunning ? 8 : 0, color: "bg-sky-400" },
                          { label: "Memory", value: isRunning ? "68.4 MB / 4 GB" : "0 MB", pct: isRunning ? 14 : 0, color: "bg-emerald-400" },
                          { label: "Network I/O", value: isRunning ? "142 kB / 198 kB" : "0 B", pct: isRunning ? 22 : 0, color: "bg-amber-400" },
                          { label: "Disk Read/Write", value: isRunning ? "12.4 MB / 4.2 MB" : "0 B", pct: isRunning ? 18 : 0, color: "bg-purple-400" },
                        ].map((m) => (
                          <div key={m.label} className="rounded border border-[#1f293d] bg-[#090d14] p-2.5">
                            <div className="flex items-center gap-1.5 text-[10.5px] text-zinc-400">
                              <Activity className="h-3 w-3" aria-hidden="true" />
                              <span>{m.label}</span>
                            </div>
                            <div className="mt-1 font-mono text-xs font-bold text-white">{m.value}</div>
                            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded bg-[#1a2438]">
                              <div className={`h-full ${m.color}`} style={{ width: `${m.pct}%` }} />
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="rounded border border-[#1f293d] bg-[#090d14] p-2.5 font-mono text-[11px]">
                        <div className="mb-1.5 font-sans text-[11px] font-bold text-zinc-200">
                          Tiến trình đang chạy (docker top {containerName})
                        </div>
                        {isRunning ? (
                          <table className="w-full text-left">
                            <thead>
                              <tr className="border-b border-[#1f293d] text-zinc-400">
                                <th className="py-1 pr-3">PID</th>
                                <th className="py-1 pr-3">USER</th>
                                <th className="py-1">COMMAND</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[#151e2e] text-zinc-300">
                              <tr><td className="py-1 pr-3">1</td><td className="py-1 pr-3">root</td><td>/bin/sh /main.sh</td></tr>
                              <tr><td className="py-1 pr-3">47</td><td className="py-1 pr-3">mysql</td><td>/usr/sbin/mysqld</td></tr>
                              <tr><td className="py-1 pr-3">89</td><td className="py-1 pr-3">root</td><td>/usr/sbin/apache2 -DFOREGROUND</td></tr>
                              <tr><td className="py-1 pr-3">92</td><td className="py-1 pr-3">www-data</td><td>/usr/sbin/apache2 -DFOREGROUND</td></tr>
                            </tbody>
                          </table>
                        ) : (
                          <div className="py-2 text-zinc-500">(Không có tiến trình khi container dừng)</div>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}

              {sidebar === "images" && (
                <div className="space-y-3">
                  <div className="rounded-lg border border-[#243047] bg-[#131b2b] p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <div className="font-mono text-sm font-bold text-white">
                          vulnerables/web-dvwa:latest
                        </div>
                        <div className="mt-0.5 font-mono text-[11px] text-zinc-400">
                          ID: 715061c61096 · Size: 712.4 MB · Platform: linux/amd64
                        </div>
                      </div>
                      <span
                        className={`rounded px-2 py-0.5 font-mono text-[11px] font-bold ${
                          isRunning
                            ? "bg-emerald-500/20 text-emerald-300"
                            : "bg-zinc-700 text-zinc-300"
                        }`}
                      >
                        {isRunning ? "IN USE" : "READY"}
                      </span>
                    </div>
                  </div>

                  <div className="rounded border border-[#1f293d] bg-[#090d14] p-3 font-mono text-[11px] text-zinc-300">
                    <div className="mb-2 font-sans font-bold text-white">Các lớp Image (Dockerfile Layers)</div>
                    <ul className="space-y-1">
                      <li><span className="text-sky-300">FROM</span> debian:9.13 (Base OS Debian Stretch)</li>
                      <li><span className="text-sky-300">RUN</span> apt-get install apache2 (2.4.25) php7.0 mariadb-server</li>
                      <li><span className="text-sky-300">COPY</span> dvwa /var/www/html (Low / Medium / High / Impossible PHP)</li>
                      <li><span className="text-sky-300">EXPOSE</span> 80/tcp · <span className="text-sky-300">CMD</span> [&quot;/main.sh&quot;]</li>
                    </ul>
                  </div>
                </div>
              )}

              {sidebar === "volumes" && (
                <div className="space-y-3">
                  <div className="rounded-lg border border-[#243047] bg-[#131b2b] p-3">
                    <div className="font-mono text-sm font-bold text-white">dvwa_mariadb_data</div>
                    <div className="mt-1 font-mono text-[11px] text-zinc-400">
                      Mount point: /var/lib/mysql · Size: 24.6 MB
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
                      <span
                        className={`rounded border px-2 py-1 font-mono font-semibold ${
                          bcryptApplied
                            ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                            : "border-rose-500/40 bg-rose-500/10 text-rose-300"
                        }`}
                      >
                        Hash Bảng users: {bcryptApplied ? "Bcrypt ($2y$12$)" : "MD5 Không Salt"}
                      </span>
                      <span
                        className={`rounded border px-2 py-1 font-mono font-semibold ${
                          leastPrivApplied
                            ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                            : "border-amber-500/40 bg-amber-500/10 text-amber-300"
                        }`}
                      >
                        DB User: {leastPrivApplied ? "dvwa_svc@localhost (Least Privilege)" : "root@localhost"}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {sidebar === "network" && (
                <div className="space-y-3">
                  <div className="rounded-lg border border-[#243047] bg-[#131b2b] p-3">
                    <div className="mb-2 text-xs font-bold text-white">
                      Kiến trúc Mạng Cầu nối Docker (Bridge `docker0` · Giải thích IP 172.17.0.1 trong Log)
                    </div>
                    <div className="grid gap-2 font-mono text-[11px] md:grid-cols-3">
                      <div className="rounded border border-[#2d3b55] bg-[#090d14] p-2.5">
                        <div className="font-bold text-sky-300">1. Host ({platform === "macos" ? "macOS" : "Ubuntu VM"})</div>
                        <div className="mt-1 text-zinc-300">127.0.0.1:8080</div>
                        <div className="text-zinc-400">localtest.me:8080</div>
                        <div className="mt-1 text-amber-300">Burp Proxy: 127.0.0.1:8081</div>
                      </div>
                      <div className="rounded border border-[#2d3b55] bg-[#090d14] p-2.5">
                        <div className="font-bold text-amber-300">2. Docker Bridge (docker0)</div>
                        <div className="mt-1 text-zinc-300">Gateway IP: 172.17.0.1</div>
                        <div className="text-zinc-400">docker-proxy NAT: 8080 → 80</div>
                        <div className="mt-1 text-[10px] text-zinc-400">
                          Mọi kết nối từ Host đi qua gateway này → Apache log ghi IP 172.17.0.1
                        </div>
                      </div>
                      <div className="rounded border border-[#2d3b55] bg-[#090d14] p-2.5">
                        <div className="font-bold text-emerald-300">3. Container ({containerName})</div>
                        <div className="mt-1 text-zinc-300">eth0: {isRunning ? "172.17.0.2/16" : "Offline"}</div>
                        <div className="text-zinc-400">Apache: 80/tcp · MariaDB: 3306</div>
                        <div className="mt-1 text-[10px] text-zinc-400">
                          Trạng thái: {isRunning ? "Listening" : "Stopped"}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Engine Status Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#1f293d] bg-[#0b1933] px-3.5 py-1.5 font-mono text-[10.5px] text-zinc-400">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              <span className="font-semibold text-zinc-200">Engine running</span>
              <span>· Docker Engine v27.3.1</span>
            </div>
            <div>
              {platform === "macos" ? "macOS Virtualization" : "Ubuntu Linux Engine"} · Container RAM{" "}
              {isRunning ? "68.4 MB" : "0 MB"}
            </div>
          </div>
        </>
      )}
    </div>
  );

  return (
    <>
      {renderWindow(false)}
      {isFullscreen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 backdrop-blur-sm sm:p-5"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsFullscreen(false);
          }}
        >
          {renderWindow(true)}
        </div>
      )}
    </>
  );
}
