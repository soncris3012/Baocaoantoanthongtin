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
    <div className="rounded-2xl border border-cyan-500/30 bg-[#0b1120] p-4 shadow-xl sm:p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div>
          <h3 className="flex items-center gap-2 text-sm font-bold text-cyan-300 sm:text-base">
            <Terminal className="h-4 w-4" />
            Trình Mô phỏng Thực tế — Thành viên 1 (macOS / Docker)
          </h3>
          <p className="text-xs text-slate-400">
            Bấm từng lệnh bên dưới để xem phản hồi thực tế và kiểm chứng hiệu quả vá Apache Banner.
          </p>
        </div>
        <div className="flex rounded-lg border border-slate-800 bg-slate-950 p-1 text-xs">
          <button
            type="button"
            onClick={() => setTab("recon")}
            className={`rounded-md px-3 py-1.5 font-medium transition ${
              tab === "recon"
                ? "bg-cyan-500/20 text-cyan-200"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            1. Terminal Trinh sát (PoC 1)
          </button>
          <button
            type="button"
            onClick={() => setTab("patch")}
            className={`rounded-md px-3 py-1.5 font-medium transition ${
              tab === "patch"
                ? "bg-emerald-500/20 text-emerald-200"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            2. Live Patching Apache
          </button>
        </div>
      </div>

      {tab === "recon" ? (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setReconCmd("docker")}
              className={`rounded-lg border px-3 py-1.5 font-mono text-xs transition ${
                reconCmd === "docker"
                  ? "border-cyan-400 bg-cyan-500/15 text-cyan-200"
                  : "border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-500"
              }`}
            >
              $ docker ps
            </button>
            <button
              type="button"
              onClick={() => setReconCmd("nmap")}
              className={`rounded-lg border px-3 py-1.5 font-mono text-xs transition ${
                reconCmd === "nmap"
                  ? "border-cyan-400 bg-cyan-500/15 text-cyan-200"
                  : "border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-500"
              }`}
            >
              $ nmap -sV -p 8080 127.0.0.1
            </button>
            <button
              type="button"
              onClick={() => setReconCmd("curl")}
              className={`rounded-lg border px-3 py-1.5 font-mono text-xs transition ${
                reconCmd === "curl"
                  ? "border-cyan-400 bg-cyan-500/15 text-cyan-200"
                  : "border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-500"
              }`}
            >
              $ curl -is .../login.php | head -n 15
            </button>
          </div>

          <div className="rounded-xl border border-slate-800 bg-[#050811] p-4 font-mono text-xs leading-relaxed">
            <div className="mb-2 text-slate-400">
              soncris@MacBook-Pro-cua-Nguyen ~ %{" "}
              <span className="text-cyan-300">
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
              <pre className="overflow-x-auto text-slate-200">
{`Starting Nmap 7.95 ( https://nmap.org )
Nmap scan report for localhost (127.0.0.1)
Host is up (0.00021s latency).

PORT     STATE SERVICE VERSION
8080/tcp open  http    ${apachePatched ? "Apache httpd" : "Apache httpd 2.4.25 ((Debian))"}

Service detection performed.`}
              </pre>
            )}

            {reconCmd === "curl" && (
              <div className="space-y-0.5 overflow-x-auto text-slate-300">
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

          <div className="grid gap-2 sm:grid-cols-2">
            <div className="flex items-start gap-2 rounded-lg border border-rose-500/30 bg-rose-950/20 p-3 text-xs">
              {apachePatched ? (
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
              ) : (
                <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
              )}
              <div>
                <div className="font-semibold text-slate-200">
                  CWE-200 • CVSS 5.3 (Server Banner)
                </div>
                <p className="mt-0.5 text-slate-400">
                  {apachePatched
                    ? "Đã vá xong: Chỉ còn hiển thị 'Server: Apache', ẩn phiên bản 2.4.25 và OS Debian."
                    : "Đang lộ rõ 'Apache/2.4.25 (Debian)', tạo điều kiện tra cứu CVE tấn công."}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-950/20 p-3 text-xs">
              <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
              <div>
                <div className="font-semibold text-slate-200">
                  CWE-614 • CVSS 4.2 (Cookie Flags)
                </div>
                <p className="mt-0.5 text-slate-400">
                  PHPSESSID và security=low thiếu HttpOnly & SameSite=Strict; mức bảo mật lưu ngay tại Client.
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900/60 p-3.5">
            <div>
              <div className="text-sm font-semibold text-slate-100">
                Trạng thái Cấu hình Apache Security ({containerName})
              </div>
              <div className="text-xs text-slate-400">
                File: <code className="text-cyan-300">/etc/apache2/conf-available/security.conf</code>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setApachePatched(!apachePatched)}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition ${
                apachePatched
                  ? "border border-slate-600 bg-slate-800 text-slate-200 hover:bg-slate-700"
                  : "bg-emerald-500 text-slate-950 hover:bg-emerald-400"
              }`}
            >
              <CheckCircle2 className="h-4 w-4" />
              {apachePatched ? "Hoàn tác về cấu hình lỗi gốc" : "Chạy Live Patching Apache ngay"}
            </button>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-xl border border-rose-500/30 bg-[#050811] p-3.5 font-mono text-xs">
              <div className="mb-2 text-[11px] font-bold uppercase tracking-wider text-rose-400">
                Trước khi vá (Mặc định DVWA)
              </div>
              <div className="text-slate-400">$ curl -Is http://127.0.0.1:8080/login.php | grep -i &quot;Server:&quot;</div>
              <div className="mt-2 rounded bg-rose-500/15 px-2 py-1 text-rose-300">
                Server: Apache/2.4.25 (Debian)
              </div>
            </div>

            <div
              className={`rounded-xl border p-3.5 font-mono text-xs transition ${
                apachePatched
                  ? "border-emerald-500/50 bg-emerald-950/20"
                  : "border-slate-800 bg-[#050811] opacity-60"
              }`}
            >
              <div className="mb-2 text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                Sau khi vá (ServerTokens Prod + ServerSignature Off)
              </div>
              <div className="text-slate-400">
                $ docker exec -it {containerName} bash -c &quot;... a2enconf security && service apache2 reload&quot;
              </div>
              <div className="mt-2 rounded bg-emerald-500/20 px-2 py-1 text-emerald-300">
                {apachePatched
                  ? "Server: Apache   [Đã ẩn 2.4.25 & Debian]"
                  : "(Bấm nút 'Chạy Live Patching Apache ngay' để kiểm chứng)"}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
