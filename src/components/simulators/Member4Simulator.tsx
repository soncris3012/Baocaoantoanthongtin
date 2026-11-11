"use client";

import { useState } from "react";
import { Code2, Flame, ShieldCheck, ShieldOff } from "lucide-react";
import { PHP_LEVEL_SOURCES } from "@/data/scenarioData";

interface Props {
  phpsessid: string;
  userToken: string;
  activeTab?: string;
}

const WAF_REGEX = /('|--|#|\/\*|UNION|SELECT|OR\s+\d+=\d+)/i;

export function Member4Simulator({ phpsessid, userToken, activeTab }: Props) {
  const [tab, setTab] = useState<"php" | "poc5" | "waf">(
    activeTab === "m4-poc5-waf" ? "poc5" : "php"
  );
  const [selectedPhp, setSelectedPhp] = useState<"low" | "medium" | "high" | "impossible">("low");

  // PoC 5 interactive states
  const [cookieSecurity, setCookieSecurity] = useState<"low" | "impossible">("impossible");
  const [includeToken, setIncludeToken] = useState<"missing" | "valid">("valid");
  const [poc5Payload, setPoc5Payload] = useState<"1" | "1'">("1'");

  // WAF interactive states
  const [wafInput, setWafInput] = useState("1' OR 1=1");

  const session = phpsessid.trim() || "7nst0hrqrfmv744a5ouj7663b0";
  const token = userToken.trim() || "d41d8cd98f00b204e9800998ecf8427e";
  const currentPhp = PHP_LEVEL_SOURCES.find((p) => p.level === selectedPhp) ?? PHP_LEVEL_SOURCES[0];

  const wafMatch = wafInput.match(WAF_REGEX);
  const isWafBlocked = Boolean(wafMatch);

  const renderPoc5Response = () => {
    if (cookieSecurity === "low") {
      if (poc5Payload === "1'") {
        return {
          badge: "LỖ HỔNG SQLi (CWE-89)",
          badgeClass: "bg-rose-500/20 text-rose-300",
          body: `HTTP/1.1 200 OK\nServer: Apache/2.4.25 (Debian)\n\n<pre>You have an error in your SQL syntax; check the manual that corresponds\nto your MariaDB server version for the right syntax to use near '''1''' at line 1</pre>`,
        };
      }
      return {
        badge: "200 OK (low.php)",
        badgeClass: "bg-amber-500/20 text-amber-300",
        body: `HTTP/1.1 200 OK\n\nID: 1 | First name: admin | Surname: admin`,
      };
    }

    if (includeToken === "missing") {
      return {
        badge: "302 Found • CHẶN BỞI checkToken() (Dòng 5)",
        badgeClass: "bg-amber-500/20 text-amber-300",
        body: `HTTP/1.1 302 Found\nDate: Wed, 04 Nov 2026 02:07:32 GMT\nServer: Apache/2.4.25 (Debian)\nLocation: index.php\nContent-Length: 0\nContent-Type: text/html; charset=UTF-8\n\n# Phân tích PoC 5 gốc: Thiếu user_token -> bị chặn ngay tại lớp Anti-CSRF (dòng 5).`,
      };
    }

    if (poc5Payload === "1'") {
      return {
        badge: "200 OK RỖNG • CHẶN BỞI is_numeric() & PDO (Dòng 11–15)",
        badgeClass: "bg-emerald-500/20 text-emerald-300",
        body: `HTTP/1.1 200 OK\nContent-Type: text/html;charset=utf-8\n\n<!-- Trang HTML hợp lệ, KHÔNG có bản ghi, KHÔNG lộ lỗi MariaDB -->\n# Phân tích PoC 5 tinh chỉnh (Band 9.5):\n# 1) Đã vượt qua checkToken() ở dòng 5 nhờ có user_token hợp lệ.\n# 2) Hàm is_numeric("1'") ở dòng 11 trả về FALSE -> bỏ qua khối truy vấn SQL!\n# 3) PDO prepare() + bindParam(':id', $id, PDO::PARAM_INT) khóa chặt cấu trúc lệnh.`,
      };
    }

    return {
      badge: "200 OK HỢP LỆ • PDO Prepared Statements",
      badgeClass: "bg-emerald-500/20 text-emerald-300",
      body: `HTTP/1.1 200 OK\nContent-Type: text/html;charset=utf-8\n\nID: 1\nFirst name: admin\nSurname: admin`,
    };
  };

  const poc5Res = renderPoc5Response();

  return (
    <div className="rounded-2xl border border-violet-500/30 bg-[#0b1120] p-4 shadow-xl sm:p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div>
          <h3 className="flex items-center gap-2 text-sm font-bold text-violet-300 sm:text-base">
            <Code2 className="h-4 w-4" />
            Trình Mô phỏng Thực tế — Thành viên 4 (Code 4 Cấp, PoC 5 & WAF)
          </h3>
          <p className="text-xs text-slate-400">
            Đối chiếu 4 file PHP, kiểm chứng PoC 5 gốc vs tinh chỉnh và thử nghiệm luật ModSecurity WAF.
          </p>
        </div>

        <div className="flex flex-wrap rounded-lg border border-slate-800 bg-slate-950 p-1 text-xs">
          <button
            type="button"
            onClick={() => setTab("php")}
            className={`rounded-md px-3 py-1.5 font-medium transition ${
              tab === "php"
                ? "bg-violet-500/20 text-violet-200"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            1. Code PHP 4 Cấp độ
          </button>
          <button
            type="button"
            onClick={() => setTab("poc5")}
            className={`rounded-md px-3 py-1.5 font-medium transition ${
              tab === "poc5"
                ? "bg-emerald-500/20 text-emerald-200"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            2. PoC 5 Gốc vs Tinh chỉnh
          </button>
          <button
            type="button"
            onClick={() => setTab("waf")}
            className={`rounded-md px-3 py-1.5 font-medium transition ${
              tab === "waf"
                ? "bg-cyan-500/20 text-cyan-200"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            3. WAF ModSecurity Tester
          </button>
        </div>
      </div>

      {tab === "php" && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {PHP_LEVEL_SOURCES.map((item) => {
              const active = selectedPhp === item.level;
              return (
                <button
                  key={item.level}
                  type="button"
                  onClick={() => setSelectedPhp(item.level as typeof selectedPhp)}
                  className={`rounded-lg border px-3 py-2 text-left text-xs transition ${
                    active
                      ? "border-violet-400 bg-violet-500/20 text-white"
                      : "border-slate-800 bg-slate-900/70 text-slate-300 hover:border-slate-600"
                  }`}
                >
                  <div className="font-mono font-bold uppercase">{item.level}.php</div>
                  <div className="mt-0.5 text-[11px] text-slate-400">{item.badge}</div>
                </button>
              );
            })}
          </div>

          <div className="rounded-xl border border-slate-800 bg-[#050811] p-4">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <div className="text-sm font-bold text-slate-100">{currentPhp.title}</div>
              <span
                className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                  currentPhp.severity === "safe"
                    ? "bg-emerald-500/20 text-emerald-300"
                    : currentPhp.severity === "critical"
                    ? "bg-rose-500/20 text-rose-300"
                    : "bg-amber-500/20 text-amber-300"
                }`}
              >
                {currentPhp.badge}
              </span>
            </div>
            <p className="mb-3 text-xs leading-relaxed text-slate-300">{currentPhp.summary}</p>
            <pre className="overflow-x-auto rounded-lg border border-slate-800 bg-slate-950 p-3 font-mono text-xs leading-relaxed text-cyan-100">
              <code>{currentPhp.code}</code>
            </pre>
            <div className="mt-3 rounded-lg border border-slate-800 bg-slate-900/70 px-3 py-2 font-mono text-xs text-amber-200">
              {currentPhp.bypassDemo}
            </div>
          </div>
        </div>
      )}

      {tab === "poc5" && (
        <div className="space-y-3">
          <div className="grid gap-3 rounded-xl border border-slate-800 bg-slate-900/60 p-3.5 sm:grid-cols-3">
            <div>
              <div className="mb-1.5 text-[11px] font-semibold uppercase text-slate-400">
                Cookie security
              </div>
              <div className="flex gap-1.5">
                {(["low", "impossible"] as const).map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setCookieSecurity(lvl)}
                    className={`flex-1 rounded-md border px-2 py-1 font-mono text-xs ${
                      cookieSecurity === lvl
                        ? "border-violet-400 bg-violet-500/20 text-white"
                        : "border-slate-700 bg-slate-950 text-slate-400"
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="mb-1.5 text-[11px] font-semibold uppercase text-slate-400">
                Anti-CSRF user_token
              </div>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => setIncludeToken("missing")}
                  className={`flex-1 rounded-md border px-2 py-1 text-xs ${
                    includeToken === "missing"
                      ? "border-amber-400 bg-amber-500/20 text-amber-200"
                      : "border-slate-700 bg-slate-950 text-slate-400"
                  }`}
                >
                  Thiếu (PoC 5 cũ)
                </button>
                <button
                  type="button"
                  onClick={() => setIncludeToken("valid")}
                  className={`flex-1 rounded-md border px-2 py-1 text-xs ${
                    includeToken === "valid"
                      ? "border-emerald-400 bg-emerald-500/20 text-emerald-200"
                      : "border-slate-700 bg-slate-950 text-slate-400"
                  }`}
                >
                  Đủ Token (9.5)
                </button>
              </div>
            </div>

            <div>
              <div className="mb-1.5 text-[11px] font-semibold uppercase text-slate-400">
                Tham số id
              </div>
              <div className="flex gap-1.5">
                {(["1", "1'"] as const).map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setPoc5Payload(val)}
                    className={`flex-1 rounded-md border px-2 py-1 font-mono text-xs ${
                      poc5Payload === val
                        ? "border-cyan-400 bg-cyan-500/20 text-cyan-200"
                        : "border-slate-700 bg-slate-950 text-slate-400"
                    }`}
                  >
                    id={val}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-3 lg:grid-cols-2">
            <div className="rounded-xl border border-slate-800 bg-[#050811] p-3.5 font-mono text-xs">
              <div className="mb-2 border-b border-slate-800 pb-1.5 font-bold text-violet-300">
                KHUNG REQUEST (Burp Repeater)
              </div>
              <pre className="overflow-x-auto text-slate-200">
{`GET /vulnerabilities/sqli/?id=${poc5Payload}&Submit=Submit${
  includeToken === "valid" ? `&user_token=${token}` : ""
} HTTP/1.1
Host: localtest.me:8080
Cookie: security=${cookieSecurity}; PHPSESSID=${session}`}
              </pre>
            </div>

            <div className="rounded-xl border border-slate-800 bg-[#050811] p-3.5 font-mono text-xs">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-1.5">
                <span className="font-bold text-cyan-300">KHUNG RESPONSE</span>
                <span className={`rounded px-2 py-0.5 text-[10px] font-bold ${poc5Res.badgeClass}`}>
                  {poc5Res.badge}
                </span>
              </div>
              <pre className="overflow-x-auto whitespace-pre-wrap leading-relaxed text-slate-200">
                {poc5Res.body}
              </pre>
            </div>
          </div>
        </div>
      )}

      {tab === "waf" && (
        <div className="space-y-3">
          <div className="rounded-xl border border-slate-800 bg-[#050811] p-3.5">
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-cyan-300">
              <Flame className="h-4 w-4 text-orange-400" />
              Kiểm thử trực tiếp Quy tắc ModSecurity SecRule (id:100001)
            </div>
            <div className="mb-3 flex flex-wrap gap-1.5">
              {["1", "1'", "1 OR 1=1", "1 UNION SELECT 1,2", "admin' --", "5"].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setWafInput(preset)}
                  className={`rounded border px-2 py-1 font-mono text-xs ${
                    wafInput === preset
                      ? "border-cyan-400 bg-cyan-500/20 text-cyan-200"
                      : "border-slate-700 bg-slate-900 text-slate-300"
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={wafInput}
              onChange={(e) => setWafInput(e.target.value)}
              aria-label="Kiểm thử tham số ARGS:id với WAF"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-xs text-cyan-100 focus:border-cyan-400 focus:outline-none"
              placeholder="Nhập giá trị tham số ARGS:id để test regex WAF..."
            />
          </div>

          <div
            className={`rounded-xl border p-4 font-mono text-xs ${
              isWafBlocked
                ? "border-rose-500/50 bg-rose-950/25 text-rose-200"
                : "border-emerald-500/50 bg-emerald-950/20 text-emerald-200"
            }`}
          >
            <div className="mb-2 flex items-center gap-2 font-sans text-sm font-bold">
              {isWafBlocked ? (
                <>
                  <ShieldOff className="h-4 w-4 text-rose-400" />
                  <span>HTTP/1.1 403 Forbidden — Bị chặn ngay tại tầng biên WAF!</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="h-4 w-4 text-emerald-400" />
                  <span>HTTP/1.1 200 Allowed — Chuỗi sạch, chuyển tiếp tới impossible.php</span>
                </>
              )}
            </div>
            {isWafBlocked ? (
              <pre className="overflow-x-auto whitespace-pre-wrap text-[11px]">
{`ModSecurity: Access denied with code 403 (phase 2).
Matched phrase "${wafMatch?.[0]}" at ARGS:id.
[id "100001"] [msg "Phat hien dau hieu bat thuong trong tham so id - Ngan chan boi ModSecurity"] [severity "CRITICAL"]`}
              </pre>
            ) : (
              <div className="text-xs text-emerald-300">
                Tham số &quot;{wafInput}&quot; không khớp mẫu tấn công trong @rx; yêu cầu hợp lệ được phép đi qua tầng ứng dụng PHP.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
