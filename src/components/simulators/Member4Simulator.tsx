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

  const [cookieSecurity, setCookieSecurity] = useState<"low" | "impossible">("impossible");
  const [includeToken, setIncludeToken] = useState<"missing" | "valid">("valid");
  const [poc5Payload, setPoc5Payload] = useState<"1" | "1'">("1'");
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
        badge: "302 Found · CHẶN BỞI checkToken() (Dòng 5)",
        badgeClass: "bg-amber-500/20 text-amber-300",
        body: `HTTP/1.1 302 Found\nDate: Wed, 04 Nov 2026 02:07:32 GMT\nServer: Apache/2.4.25 (Debian)\nLocation: index.php\nContent-Length: 0\nContent-Type: text/html; charset=UTF-8\n\n# Phân tích PoC 5 gốc: Thiếu user_token -> bị chặn ngay tại lớp Anti-CSRF (dòng 5).`,
      };
    }

    if (poc5Payload === "1'") {
      return {
        badge: "200 OK RỖNG · CHẶN BỞI is_numeric() & PDO (Dòng 11–15)",
        badgeClass: "bg-emerald-500/20 text-emerald-300",
        body: `HTTP/1.1 200 OK\nContent-Type: text/html;charset=utf-8\n\n<!-- Trang HTML hợp lệ, KHÔNG có bản ghi, KHÔNG lộ lỗi MariaDB -->\n# Phân tích PoC 5 tinh chỉnh:\n# 1) Đã vượt qua checkToken() ở dòng 5 nhờ có user_token hợp lệ.\n# 2) Hàm is_numeric("1'") ở dòng 11 trả về FALSE -> bỏ qua khối truy vấn SQL.\n# 3) PDO prepare() + bindParam(':id', $id, PDO::PARAM_INT) khóa chặt cấu trúc lệnh.`,
      };
    }

    return {
      badge: "200 OK HỢP LỆ · PDO Prepared Statements",
      badgeClass: "bg-emerald-500/20 text-emerald-300",
      body: `HTTP/1.1 200 OK\nContent-Type: text/html;charset=utf-8\n\nID: 1\nFirst name: admin\nSurname: admin`,
    };
  };

  const poc5Res = renderPoc5Response();

  return (
    <div className="rounded-lg border border-hairline bg-surface p-4 sm:p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-hairline pb-3">
        <div>
          <h3 className="flex items-center gap-2 text-sm font-bold text-ink sm:text-base">
            <Code2 className="h-4 w-4 text-muted" aria-hidden="true" />
            Interactive Console — Thành viên 4 (Code 4 Cấp, PoC 5 &amp; WAF)
          </h3>
          <p className="text-xs text-muted">
            Đối chiếu 4 file PHP, kiểm chứng PoC 5 gốc vs tinh chỉnh và thử nghiệm luật ModSecurity WAF.
          </p>
        </div>

        <div className="inline-flex flex-wrap rounded-md border border-hairline bg-subtle p-0.5 text-xs">
          {[
            { id: "php" as const, label: "1. PHP 4 Cấp độ" },
            { id: "poc5" as const, label: "2. PoC 5 Đối chứng" },
            { id: "waf" as const, label: "3. WAF ModSecurity" },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`cursor-pointer rounded px-3 py-1 font-medium transition-colors ${
                tab === t.id
                  ? "bg-surface text-ink font-semibold"
                  : "text-muted hover:text-ink"
              }`}
            >
              {t.label}
            </button>
          ))}
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
                  className={`cursor-pointer rounded-md border px-3 py-2 text-left text-xs transition-colors ${
                    active
                      ? "border-ink bg-ink text-canvas"
                      : "border-hairline bg-subtle text-secondary hover:text-ink"
                  }`}
                >
                  <div className="font-mono font-bold uppercase">{item.level}.php</div>
                  <div className={`mt-0.5 text-[11px] ${active ? "opacity-80" : "text-muted"}`}>
                    {item.badge}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="rounded-lg border border-hairline bg-subtle p-4">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <div className="text-sm font-bold text-ink">{currentPhp.title}</div>
              <span
                className={`rounded px-2 py-0.5 font-mono text-[11px] font-semibold ${
                  currentPhp.severity === "safe"
                    ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                    : currentPhp.severity === "critical"
                    ? "bg-rose-500/15 text-rose-700 dark:text-rose-300"
                    : "bg-amber-500/15 text-amber-800 dark:text-amber-300"
                }`}
              >
                {currentPhp.badge}
              </span>
            </div>
            <p className="mb-3 text-xs leading-relaxed text-secondary">{currentPhp.summary}</p>
            <pre className="overflow-x-auto rounded-lg border border-zinc-800 bg-[#0d1117] p-3.5 font-mono text-xs leading-relaxed text-zinc-100">
              <code>{currentPhp.code}</code>
            </pre>
            <div className="mt-3 rounded-md border border-hairline bg-surface px-3 py-2 font-mono text-xs text-ink">
              {currentPhp.bypassDemo}
            </div>
          </div>
        </div>
      )}

      {tab === "poc5" && (
        <div className="space-y-3">
          <div className="grid gap-3 rounded-md border border-hairline bg-subtle p-3.5 sm:grid-cols-3">
            <div>
              <div className="mb-1.5 font-mono text-[11px] font-semibold uppercase text-muted">
                Cookie security
              </div>
              <div className="flex gap-1.5">
                {(["low", "impossible"] as const).map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setCookieSecurity(lvl)}
                    className={`flex-1 cursor-pointer rounded border px-2 py-1 font-mono text-xs ${
                      cookieSecurity === lvl
                        ? "border-ink bg-ink text-canvas font-semibold"
                        : "border-hairline bg-surface text-secondary"
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="mb-1.5 font-mono text-[11px] font-semibold uppercase text-muted">
                Anti-CSRF user_token
              </div>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => setIncludeToken("missing")}
                  className={`flex-1 cursor-pointer rounded border px-2 py-1 text-xs ${
                    includeToken === "missing"
                      ? "border-ink bg-ink text-canvas font-semibold"
                      : "border-hairline bg-surface text-secondary"
                  }`}
                >
                  Thiếu (Gốc)
                </button>
                <button
                  type="button"
                  onClick={() => setIncludeToken("valid")}
                  className={`flex-1 cursor-pointer rounded border px-2 py-1 text-xs ${
                    includeToken === "valid"
                      ? "border-ink bg-ink text-canvas font-semibold"
                      : "border-hairline bg-surface text-secondary"
                  }`}
                >
                  Đủ Token
                </button>
              </div>
            </div>

            <div>
              <div className="mb-1.5 font-mono text-[11px] font-semibold uppercase text-muted">
                Tham số id
              </div>
              <div className="flex gap-1.5">
                {(["1", "1'"] as const).map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setPoc5Payload(val)}
                    className={`flex-1 cursor-pointer rounded border px-2 py-1 font-mono text-xs ${
                      poc5Payload === val
                        ? "border-ink bg-ink text-canvas font-semibold"
                        : "border-hairline bg-surface text-secondary"
                    }`}
                  >
                    id={val}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-3 lg:grid-cols-2">
            <div className="rounded-lg border border-zinc-800 bg-[#0d1117] p-3.5 font-mono text-xs">
              <div className="mb-2 border-b border-zinc-800 pb-1.5 font-bold text-zinc-200">
                KHUNG REQUEST (Burp Repeater)
              </div>
              <pre className="overflow-x-auto text-zinc-200">
{`GET /vulnerabilities/sqli/?id=${poc5Payload}&Submit=Submit${
  includeToken === "valid" ? `&user_token=${token}` : ""
} HTTP/1.1
Host: localtest.me:8080
Cookie: security=${cookieSecurity}; PHPSESSID=${session}`}
              </pre>
            </div>

            <div className="rounded-lg border border-zinc-800 bg-[#0d1117] p-3.5 font-mono text-xs">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 pb-1.5">
                <span className="font-bold text-zinc-200">KHUNG RESPONSE</span>
                <span className={`rounded px-2 py-0.5 text-[10px] font-bold ${poc5Res.badgeClass}`}>
                  {poc5Res.badge}
                </span>
              </div>
              <pre className="overflow-x-auto whitespace-pre-wrap leading-relaxed text-zinc-200">
                {poc5Res.body}
              </pre>
            </div>
          </div>
        </div>
      )}

      {tab === "waf" && (
        <div className="space-y-3">
          <div className="rounded-md border border-hairline bg-subtle p-3.5">
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-ink">
              <Flame className="h-4 w-4 text-amber-600" aria-hidden="true" />
              Kiểm thử Quy tắc ModSecurity SecRule (id:100001)
            </div>
            <div className="mb-3 flex flex-wrap gap-1.5">
              {["1", "1'", "1 OR 1=1", "1 UNION SELECT 1,2", "admin' --", "5"].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setWafInput(preset)}
                  className={`cursor-pointer rounded border px-2 py-1 font-mono text-xs ${
                    wafInput === preset
                      ? "border-ink bg-ink text-canvas font-semibold"
                      : "border-hairline bg-surface text-secondary"
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
              className="w-full rounded-md border border-hairline bg-surface px-3 py-2 font-mono text-xs text-ink focus:border-accent focus:outline-none"
              placeholder="Nhập giá trị tham số ARGS:id để test regex WAF..."
            />
          </div>

          <div className="rounded-lg border border-zinc-800 bg-[#0d1117] p-4 font-mono text-xs">
            <div
              className={`mb-2 flex items-center gap-2 font-sans text-sm font-bold ${
                isWafBlocked ? "text-rose-300" : "text-emerald-300"
              }`}
            >
              {isWafBlocked ? (
                <>
                  <ShieldOff className="h-4 w-4" aria-hidden="true" />
                  <span>HTTP/1.1 403 Forbidden — Chặn ngay tại tầng biên WAF</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                  <span>HTTP/1.1 200 Allowed — Chuỗi sạch, chuyển tiếp tới PHP</span>
                </>
              )}
            </div>
            {isWafBlocked ? (
              <pre className="overflow-x-auto whitespace-pre-wrap text-[11px] text-rose-200">
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
