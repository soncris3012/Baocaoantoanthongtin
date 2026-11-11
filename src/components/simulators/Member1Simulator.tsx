"use client";

import { useState } from "react";
import { CheckCircle2, ShieldAlert, ShieldCheck, Terminal } from "lucide-react";

interface Props {
  containerRef: string;
  activeTab?: string;
}

export function Member1Simulator({ containerRef, activeTab }: Props) {
  const [tab, setTab] = useState<"recon" | "patch">(
    activeTab === "m1-patch" ? "patch" : "recon"
  );
  const [reconCmd, setReconCmd] = useState<"docker" | "nmap" | "curl">("curl");
  const [apachePatched, setApachePatched] = useState(false);

  const containerName = containerRef.trim() || "215d3a734374";
  const serverHeader = apachePatched
    ? "Server: Apache"
    : "Server: Apache/2.4.25 (Debian)";

  return (
    <div className="rounded-lg border border-hairline bg-surface p-4 sm:p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-hairline pb-3">
        <div>
          <h3 className="flex items-center gap-2 text-sm font-bold text-ink sm:text-base">
            <Terminal className="h-4 w-4 text-muted" aria-hidden="true" />
            Interactive Console — Thành viên 1 (Docker / Nmap / Apache)
          </h3>
          <p className="text-xs text-muted">
            Chạy thử từng lệnh trinh sát và kiểm chứng hiệu quả vá Apache Banner.
          </p>
        </div>

        <div className="inline-flex rounded-md border border-hairline bg-subtle p-0.5 text-xs">
          <button
            type="button"
            onClick={() => setTab("recon")}
            className={`cursor-pointer rounded px-3 py-1 font-medium transition-colors ${
              tab === "recon"
                ? "bg-surface text-ink font-semibold"
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
                ? "bg-surface text-ink font-semibold"
                : "text-muted hover:text-ink"
            }`}
          >
            2. Live Patching Apache
          </button>
        </div>
      </div>

      {tab === "recon" ? (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {[
              { id: "docker" as const, label: "$ docker ps" },
              { id: "nmap" as const, label: "$ nmap -sV -p 8080 127.0.0.1" },
              { id: "curl" as const, label: "$ curl -is .../login.php | head -n 15" },
            ].map((btn) => (
              <button
                key={btn.id}
                type="button"
                onClick={() => setReconCmd(btn.id)}
                className={`cursor-pointer rounded-md border px-3 py-1.5 font-mono text-xs transition-colors ${
                  reconCmd === btn.id
                    ? "border-ink bg-ink text-canvas font-semibold"
                    : "border-hairline bg-subtle text-secondary hover:text-ink"
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>

          <div className="rounded-lg border border-zinc-800 bg-[#0d1117] p-4 font-mono text-xs leading-relaxed text-zinc-200">
            <div className="mb-2 text-zinc-400">
              soncris@MacBook-Pro-cua-Nguyen ~ %{" "}
              <span className="text-emerald-300">
                {reconCmd === "docker" && "docker ps"}
                {reconCmd === "nmap" && "nmap -sV -p 8080 127.0.0.1"}
                {reconCmd === "curl" &&
                  "curl -is http://127.0.0.1:8080/login.php | head -n 15"}
              </span>
            </div>

            {reconCmd === "docker" && (
              <pre className="overflow-x-auto text-emerald-300">
{`CONTAINER ID   IMAGE                  COMMAND      STATUS       PORTS                    NAMES
${containerName.padEnd(14, " ")} vulnerables/web-dvwa   "/main.sh"   Up 2 hours   0.0.0.0:8080->80/tcp     epic_dijkstra`}
              </pre>
            )}

            {reconCmd === "nmap" && (
              <pre className="overflow-x-auto text-zinc-200">
{`Starting Nmap 7.95 ( https://nmap.org )
Nmap scan report for localhost (127.0.0.1)
Host is up (0.00021s latency).

PORT     STATE SERVICE VERSION
8080/tcp open  http    ${apachePatched ? "Apache httpd" : "Apache httpd 2.4.25 ((Debian))"}

Service detection performed.`}
              </pre>
            )}

            {reconCmd === "curl" && (
              <div className="space-y-0.5 overflow-x-auto text-zinc-300">
                <div>HTTP/1.1 200 OK</div>
                <div>Date: Wed, 04 Nov 2026 02:09:19 GMT</div>
                <div
                  className={`inline-block rounded px-1 ${
                    apachePatched
                      ? "bg-emerald-500/20 text-emerald-300"
                      : "bg-rose-500/20 text-rose-300"
                  }`}
                >
                  {serverHeader}
                </div>
                <div className="rounded bg-amber-500/15 px-1 text-amber-200">
                  Set-Cookie: PHPSESSID=2d0vvd715drf3nv8mgq7vderg6; path=/
                </div>
                <div>Expires: Tue, 23 Jun 2009 12:00:00 GMT</div>
                <div>Cache-Control: no-cache, must-revalidate</div>
                <div>Pragma: no-cache</div>
                <div className="rounded bg-amber-500/15 px-1 text-amber-200">
                  Set-Cookie: security=low
                </div>
                <div>Content-Type: text/html;charset=utf-8</div>
              </div>
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
                    ? "Đã vá: Chỉ còn hiển thị 'Server: Apache', ẩn phiên bản 2.4.25 và OS Debian."
                    : "Lộ 'Apache/2.4.25 (Debian)', tạo điều kiện tra cứu CVE tương ứng."}
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
                  PHPSESSID và security=low thiếu HttpOnly &amp; SameSite=Strict; mức bảo mật lưu ở Client.
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
                Cấu hình Apache Security ({containerName})
              </div>
              <div className="text-xs text-muted">
                File: <code className="font-mono text-ink">/etc/apache2/conf-available/security.conf</code>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setApachePatched(!apachePatched)}
              className={`inline-flex cursor-pointer items-center gap-2 rounded-md px-3.5 py-2 text-xs font-semibold transition-colors ${
                apachePatched
                  ? "border border-hairline bg-surface text-ink hover:bg-canvas"
                  : "bg-emerald-600 text-white hover:bg-emerald-700"
              }`}
            >
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              {apachePatched ? "Hoàn tác về cấu hình gốc" : "Chạy Live Patching Apache"}
            </button>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-lg border border-zinc-800 bg-[#0d1117] p-3.5 font-mono text-xs">
              <div className="mb-2 text-[11px] font-bold uppercase tracking-wider text-rose-400">
                Trước khi vá (Mặc định DVWA)
              </div>
              <div className="text-zinc-400">
                $ curl -Is http://127.0.0.1:8080/login.php | grep -i &quot;Server:&quot;
              </div>
              <div className="mt-2 rounded bg-rose-500/15 px-2 py-1 text-rose-300">
                Server: Apache/2.4.25 (Debian)
              </div>
            </div>

            <div className="rounded-lg border border-zinc-800 bg-[#0d1117] p-3.5 font-mono text-xs">
              <div className="mb-2 text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                Sau khi vá (ServerTokens Prod + ServerSignature Off)
              </div>
              <div className="text-zinc-400">
                $ docker exec -it {containerName} bash -c &quot;... a2enconf security &amp;&amp; service apache2 reload&quot;
              </div>
              <div
                className={`mt-2 rounded px-2 py-1 ${
                  apachePatched
                    ? "bg-emerald-500/20 text-emerald-300"
                    : "bg-zinc-900 text-zinc-500"
                }`}
              >
                {apachePatched
                  ? "Server: Apache   [Đã ẩn 2.4.25 & Debian]"
                  : "(Bấm nút 'Chạy Live Patching Apache' để kiểm chứng)"}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
