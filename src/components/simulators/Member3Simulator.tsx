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
import { DockerDesktopEmulator } from "@/components/simulators/DockerDesktopEmulator";
import { DvwaWebEmulator } from "@/components/simulators/DvwaWebEmulator";
import {
  buildStepTerminalCommands,
  type ExternalTerminalCommand,
  TerminalEmulator,
} from "@/components/simulators/TerminalEmulator";

interface Props {
  containerRef: string;
  phpsessid: string;
  activeTab?: string;
  terminalAutoplay?: ExternalTerminalCommand | null;
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

export function Member3Simulator({
  containerRef,
  phpsessid,
  activeTab,
  terminalAutoplay,
}: Props) {
  const [tab, setTab] = useState<"sqlmap" | "mariadb" | "docker" | "dvwa">(
    activeTab === "m3-mariadb-patch" ? "mariadb" : "sqlmap"
  );
  const [sqlmapStage, setSqlmapStage] = useState<1 | 2 | 3>(1);
  const [containerRunning, setContainerRunning] = useState(true);
  const [terminalCmd, setTerminalCmd] = useState<ExternalTerminalCommand | null>(null);
  const cmdSeqRef = useRef(1);
  const lastTermAutoplayIdRef = useRef(0);

  useEffect(() => {
    if (!terminalAutoplay || terminalAutoplay.id === lastTermAutoplayIdRef.current) return;
    lastTermAutoplayIdRef.current = terminalAutoplay.id;
    setTab("sqlmap");
    setTerminalCmd(terminalAutoplay);
  }, [terminalAutoplay]);

  const [bcryptApplied, setBcryptApplied] = useState(false);
  const [leastPrivApplied, setLeastPrivApplied] = useState(false);

  // Bcrypt Salt & Cost Lab
  const [labPassword, setLabPassword] = useState("password");
  const [bcryptCost, setBcryptCost] = useState<10 | 12 | 14>(12);
  const [saltNonce, setSaltNonce] = useState(1);

  // MariaDB Interactive Console
  const [sqlInput, setSqlInput] = useState("");
  const [sqlOutput, setSqlOutput] = useState<string | null>(null);
  const sqlTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (sqlTimerRef.current) clearInterval(sqlTimerRef.current);
    };
  }, []);

  const container = containerRef.trim() || "dvwa";
  const session = phpsessid.trim() || "7nst0hrqrfmv744a5ouj7663b0";

  const buildSqlmapCmd = (stage: 1 | 2 | 3) => {
    const flag =
      stage === 1
        ? "--dbs --batch"
        : stage === 2
        ? "-D dvwa --tables --batch"
        : "-D dvwa -T users --dump --batch";
    return `sqlmap -u "http://127.0.0.1:8080/vulnerabilities/sqli/?id=1&Submit=Submit" --cookie="security=low; PHPSESSID=${session}" ${flag}`;
  };

  const handleStageSelect = (stage: 1 | 2 | 3) => {
    setSqlmapStage(stage);
    setTerminalCmd({
      id: cmdSeqRef.current++,
      context: "host",
      commands: [buildSqlmapCmd(stage)],
    });
  };

  const handleRunSequence = () => {
    setSqlmapStage(1);
    setTerminalCmd({
      id: cmdSeqRef.current++,
      context: "host",
      commands: [buildSqlmapCmd(1), buildSqlmapCmd(2), buildSqlmapCmd(3)],
    });
  };

  const runSqlCommand = (rawSql?: string) => {
    const query = (rawSql ?? sqlInput).trim();
    if (!query) return;
    const lower = query.toLowerCase();

    if (lower.includes("grants")) {
      if (!leastPrivApplied) {
        setSqlOutput(
          "ERROR 1141 (42000): There is no such grant defined for user 'dvwa_svc' on host 'localhost'"
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

  const animateSqlPreset = (query: string) => {
    if (sqlTimerRef.current) clearInterval(sqlTimerRef.current);
    setSqlOutput(null);
    setSqlInput("");
    let idx = 0;
    sqlTimerRef.current = setInterval(() => {
      idx += 1;
      setSqlInput(query.slice(0, idx));
      if (idx >= query.length) {
        if (sqlTimerRef.current) clearInterval(sqlTimerRef.current);
        setTimeout(() => runSqlCommand(query), 180);
      }
    }, 28);
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

        <div className="inline-flex flex-wrap rounded-md border border-hairline bg-subtle p-0.5 text-xs">
          <button
            type="button"
            onClick={() => setTab("sqlmap")}
            className={`cursor-pointer rounded px-3 py-1 font-medium transition-colors ${
              tab === "sqlmap"
                ? "bg-surface font-semibold text-ink shadow-sm"
                : "text-muted hover:text-ink"
            }`}
          >
            1. Ubuntu Terminal &amp; SQLMap
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
          <button
            type="button"
            onClick={() => setTab("docker")}
            className={`cursor-pointer rounded px-3 py-1 font-medium transition-colors ${
              tab === "docker"
                ? "bg-surface font-semibold text-ink shadow-sm"
                : "text-muted hover:text-ink"
            }`}
          >
            3. Docker Container (dvwa)
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
        </div>
      </div>

      {tab === "sqlmap" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: 1 as const, label: "sqlmap --dbs" },
              { id: 2 as const, label: "sqlmap -D dvwa --tables" },
              { id: 3 as const, label: "sqlmap -T users --dump" },
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
              className="ml-auto inline-flex cursor-pointer items-center gap-1.5 rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90"
            >
              <Play className="h-3 w-3" aria-hidden="true" />
              Chạy 3 lệnh SQLMap
            </button>
          </div>

          <TerminalEmulator
            os="ubuntu"
            username="quyet"
            hostname="ubuntu-vm"
            containerRef={container}
            phpsessid={session}
            containerRunning={containerRunning}
            onContainerRunningChange={setContainerRunning}
            bcryptApplied={bcryptApplied}
            leastPrivApplied={leastPrivApplied}
            onBcryptAppliedChange={setBcryptApplied}
            onLeastPrivAppliedChange={setLeastPrivApplied}
            externalCommand={terminalCmd}
            stepGroups={[
              {
                id: "m3-s1",
                label: "Bước 01: SQLMap 3 pha",
                commands: buildStepTerminalCommands("m3-s1", { container, phpsessid: session }) ?? [],
              },
              {
                id: "m3-s2",
                label: "Bước 02: Audit users MD5",
                commands: buildStepTerminalCommands("m3-s2", { container, phpsessid: session }) ?? [],
              },
              {
                id: "m3-s3",
                label: "Bước 03: PHP Bcrypt UPDATE",
                commands: buildStepTerminalCommands("m3-s3", { container, phpsessid: session }) ?? [],
              },
              {
                id: "m3-s4",
                label: "Bước 04: GRANT dvwa_svc",
                commands: buildStepTerminalCommands("m3-s4", { container, phpsessid: session }) ?? [],
              },
            ]}
            presets={[
              { label: "sqlmap ... --dbs --batch", command: buildSqlmapCmd(1) },
              { label: "sqlmap ... -D dvwa --tables --batch", command: buildSqlmapCmd(2) },
              { label: "sqlmap ... -D dvwa -T users --dump --batch", command: buildSqlmapCmd(3) },
              {
                label: `docker exec -it ${container} mysql -u root dvwa`,
                command: `docker exec -it ${container} mysql -u root dvwa`,
              },
              {
                label: "SELECT user_id, user, password FROM users;",
                command: "SELECT user_id, user, password FROM users;",
                context: "mariadb",
              },
            ]}
          />
        </div>
      )}

      {tab === "docker" && (
        <DockerDesktopEmulator
          platform="ubuntu"
          containerId="215d3a734374"
          containerName={container}
          running={containerRunning}
          onRunningChange={setContainerRunning}
          bcryptApplied={bcryptApplied}
          leastPrivApplied={leastPrivApplied}
          onOpenExternalTerminal={() => setTab("sqlmap")}
        />
      )}

      {tab === "mariadb" && (
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
                    onClick={() => animateSqlPreset(preset)}
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

      {tab === "dvwa" && (
        <DvwaWebEmulator
          defaultPage="sqli"
          phpsessid={session}
          containerRunning={containerRunning}
          bcryptApplied={bcryptApplied}
          leastPrivApplied={leastPrivApplied}
        />
      )}
    </div>
  );
}
