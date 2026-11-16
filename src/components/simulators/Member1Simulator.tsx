"use client";

import { useState } from "react";
import { CheckCircle2, Play, RotateCcw, ShieldAlert, ShieldCheck, Terminal } from "lucide-react";
import { WindowControls } from "@/components/WindowBar";

interface Props {
  containerRef: string;
  activeTab?: string;
}

export function Member1Simulator({ containerRef, activeTab }: Props) {
  const [tab, setTab] = useState<"recon" | "patch">(
    activeTab === "m1-patch" ? "patch" : "recon"
  );
  const [selectedCmd, setSelectedCmd] = useState<"docker" | "nmap" | "curl" | "curl_check">("curl");
  const [isRunning, setIsRunning] = useState(false);
  const [apachePatched, setApachePatched] = useState(false);

  const containerName = containerRef.trim() || "215d3a734374";
  const serverHeader = apachePatched
    ? "Server: Apache"
    : "Server: Apache/2.4.25 (Debian)";

  const handleRun = () => {
    setIsRunning(true);
    setTimeout(() => {
      setIsRunning(false);
    }, 450);
  };

  const handleApplyPatch = () => {
    setIsRunning(true);
    setTimeout(() => {
      setApachePatched(true);
      setIsRunning(false);
    }, 550);
  };

  const handleRollback = () => {
    setIsRunning(true);
    setTimeout(() => {
      setApachePatched(false);
      setIsRunning(false);
    }, 400);
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
            Mô phỏng trinh sát cổng mục tiêu và kiểm chứng thực thi bản vá ServerTokens Prod trực tiếp.
          </p>
        </div>

        <div className="inline-flex rounded-md border border-hairline bg-subtle p-0.5 text-xs">
          <button
            type="button"
            onClick={() => setTab("recon")}
            className={`cursor-pointer rounded px-3 py-1 font-medium transition-colors ${
              tab === "recon"
                ? "bg-surface text-ink font-semibold shadow-sm"
                : "text-muted hover:text-ink"
            }`}
          >
            1. Trinh sát (PoC 1)
          </button>
          <button
            type="button"
            onClick={() => setTab("patch")}
            className={`cursor-pointer rounded px-3 py-1 font-medium transition-colors ${
              tab === "patch"
                ? "bg-surface text-ink font-semibold shadow-sm"
                : "text-muted hover:text-ink"
            }`}
          >
            2. Live Patching Apache
          </button>
        </div>
      </div>

      {tab === "recon" ? (
        <div className="space-y-4">
          {/* Preset Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-ink mr-1">Lệnh mẫu:</span>
            {[
              { id: "docker" as const, label: "$ docker ps" },
              { id: "nmap" as const, label: "$ nmap -sV -p 8080 127.0.0.1" },
              { id: "curl" as const, label: "$ curl -is .../login.php | head -n 15" },
              { id: "curl_check" as const, label: "$ curl -Is ... | grep -i Server:" },
            ].map((btn) => (
              <button
                key={btn.id}
                type="button"
                onClick={() => {
                  setSelectedCmd(btn.id);
                  handleRun();
                }}
                className={`cursor-pointer rounded-md border px-3 py-1.5 font-mono text-xs transition-colors ${
                  selectedCmd === btn.id
                    ? "border-ink bg-ink text-canvas font-semibold"
                    : "border-hairline bg-subtle text-secondary hover:text-ink"
                }`}
              >
                {btn.label}
              </button>
            ))}

            <button
              type="button"
              onClick={handleRun}
              disabled={isRunning}
              className="ml-auto inline-flex cursor-pointer items-center gap-1.5 rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              <Play className="h-3 w-3" />
              {isRunning ? "Đang chạy..." : "Chạy lại"}
            </button>
          </div>

          {/* Terminal Box */}
          <div className="rounded-lg border border-zinc-800 bg-[#0d1117] p-4 font-mono text-xs leading-relaxed text-zinc-200">
            <div className="mb-2 text-zinc-400 flex items-center justify-between border-b border-zinc-800 pb-2">
              <div className="flex items-center gap-2.5">
                <WindowControls />
                <span className="text-zinc-500">soncris@MacBook-Pro ~ %</span>{" "}
                <span className="text-emerald-300 font-semibold">
                  {selectedCmd === "docker" && "docker ps"}
                  {selectedCmd === "nmap" && "nmap -sV -p 8080 127.0.0.1"}
                  {selectedCmd === "curl" &&
                    "curl -is http://127.0.0.1:8080/login.php | head -n 15"}
                  {selectedCmd === "curl_check" &&
                    "curl -Is http://127.0.0.1:8080/login.php | grep -i 'Server:'"}
                </span>
              </div>
              <span className="text-[10px] text-zinc-500 uppercase tracking-widest">macOS zsh</span>
            </div>

            {isRunning ? (
              <div className="py-6 text-center text-amber-400">
                <span className="inline-block animate-spin mr-2">⚡</span>
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
                    <div>Date: Mon, 16 Nov 2026 09:20:19 GMT</div>
                    <div
                      className={`inline-block rounded px-1.5 py-0.5 font-bold ${
                        apachePatched
                          ? "bg-emerald-500/20 text-emerald-300"
                          : "bg-rose-500/20 text-rose-300"
                      }`}
                    >
                      {serverHeader} {apachePatched ? "[ĐÃ VÁ - ẨN PHIÊN BẢN]" : "[CWE-200: LỘ BẢN 2.4.25]"}
                    </div>
                    <div className="rounded bg-amber-500/15 px-1.5 py-0.5 text-amber-200">
                      Set-Cookie: PHPSESSID=2d0vvd715drf3nv8mgq7vderg6; path=/ [CWE-614: Thiếu HttpOnly]
                    </div>
                    <div>Expires: Tue, 23 Jun 2009 12:00:00 GMT</div>
                    <div>Cache-Control: no-cache, must-revalidate</div>
                    <div>Pragma: no-cache</div>
                    <div className="rounded bg-amber-500/15 px-1.5 py-0.5 text-amber-200">
                      Set-Cookie: security=low [Thiếu SameSite=Strict]
                    </div>
                    <div>Content-Type: text/html;charset=utf-8</div>
                  </div>
                )}

                {selectedCmd === "curl_check" && (
                  <div className="py-2">
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
                        : "⚠ Cảnh báo: Phiên bản chi tiết đang hiển thị công khai trên HTTP Response."}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex items-start gap-2.5 rounded-md border border-hairline bg-subtle p-3 text-xs">
              {apachePatched ? (
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />
              ) : (
                <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" aria-hidden="true" />
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
              <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" aria-hidden="true" />
              <div>
                <div className="font-semibold text-ink">
                  CWE-614 · CVSS 4.2 (Cookie Flags)
                </div>
                <p className="mt-0.5 text-muted">
                  PHPSESSID và security=low thiếu HttpOnly &amp; SameSite=Strict; cấu hình bảo mật bị đặt tại Client.
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-hairline bg-subtle p-3.5">
            <div>
              <div className="text-sm font-semibold text-ink">
                Gia cố Cấu hình Apache ({containerName})
              </div>
              <div className="text-xs text-muted">
                File mục tiêu: <code className="font-mono text-ink">/etc/apache2/conf-available/security.conf</code>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {apachePatched ? (
                <button
                  type="button"
                  onClick={handleRollback}
                  disabled={isRunning}
                  className="cursor-pointer inline-flex items-center gap-1.5 rounded-md border border-hairline bg-surface px-3 py-1.5 text-xs font-semibold text-ink hover:bg-canvas"
                >
                  <RotateCcw className="h-3.5 w-3.5" /> Hoàn tác cấu hình gốc
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleApplyPatch}
                  disabled={isRunning}
                  className="cursor-pointer inline-flex items-center gap-2 rounded-md bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
                >
                  <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                  {isRunning ? "Đang áp dụng..." : "Thực thi Live Patching"}
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
                $ curl -Is http://127.0.0.1:8080/login.php | grep -i &quot;Server:&quot;
              </div>
              <div className="mt-2 rounded bg-rose-500/15 px-2 py-1 text-rose-300 font-bold">
                Server: Apache/2.4.25 (Debian)
              </div>
              <div className="mt-2 text-[11px] text-zinc-500">
                Kẻ tấn công biết đích danh phiên bản để dò tìm CVE remote code execution.
              </div>
            </div>

            <div className="rounded-lg border border-zinc-800 bg-[#0d1117] p-3.5 font-mono text-xs">
              <div className="mb-2 flex items-center justify-between border-b border-zinc-800/80 pb-2">
                <div className="flex items-center gap-2">
                  <WindowControls />
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                    Sau khi vá (ServerTokens Prod)
                  </span>
                </div>
              </div>
              <div className="text-zinc-400">
                $ docker exec -it {containerName} bash -c &quot;... service apache2 reload&quot;
              </div>
              <div
                className={`mt-2 rounded px-2 py-1 font-bold ${
                  apachePatched
                    ? "bg-emerald-500/20 text-emerald-300"
                    : "bg-zinc-900 text-zinc-500"
                }`}
              >
                {apachePatched
                  ? "Server: Apache   [ĐÃ ẨN 2.4.25 & DEBIAN]"
                  : "(Bấm nút 'Thực thi Live Patching' để kích hoạt)"}
              </div>
              <div className="mt-2 text-[11px] text-zinc-500">
                {apachePatched
                  ? "✓ Banner được rút gọn chỉ còn từ khóa sản phẩm, tuân thủ nguyên tắc tối thiểu thông tin."
                  : "Chờ kích hoạt lệnh a2enconf security..."}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
