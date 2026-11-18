"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Play,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  Terminal,
} from "lucide-react";
import { interpolateCommand } from "@/components/CodeBlock";
import { WindowControls } from "@/components/WindowBar";
import { ScenarioStep } from "@/types/scenario";

interface StepInlineRunnerProps {
  step: ScenarioStep;
  memberNumber: 1 | 2 | 3 | 4;
  variables: {
    container: string;
    phpsessid: string;
    userToken: string;
  };
  isCompleted: boolean;
  onToggleComplete: () => void;
  onOpenAdvancedSim?: (simKey?: string) => void;
}

export function StepInlineRunner({
  step,
  memberNumber,
  variables,
  isCompleted,
  onToggleComplete,
  onOpenAdvancedSim,
}: StepInlineRunnerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedCmdIdx, setSelectedCmdIdx] = useState<number | "all">(
    step.commands.length > 1 ? "all" : 0
  );
  const [isRunning, setIsRunning] = useState(false);
  const [hasRun, setHasRun] = useState(false);
  const [visibleLineCount, setVisibleLineCount] = useState(0);
  const [copied, setCopied] = useState(false);
  const [quickCmd, setQuickCmd] = useState("");
  const [quickEntries, setQuickEntries] = useState<
    Array<{ id: number; cmd: string; out: string }>
  >([]);
  const streamTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const container =
    variables.container.trim() || (memberNumber === 1 ? "215d3a734374" : "dvwa");
  const sess = variables.phpsessid.trim() || "7nst0hrqrfmv744a5ouj7663b0";
  const token = variables.userToken.trim() || "d41d8cd98f00b204e9800998ecf8427e";

  const hostPrompt =
    memberNumber === 1
      ? "soncris@macbook-pro ~ %"
      : memberNumber === 2
      ? "hung@ubuntu-vm:~$"
      : memberNumber === 3
      ? "quyet@ubuntu-vm:~$"
      : "khanh@ubuntu-vm:~$";

  const interpolatedCommands = useMemo(() => {
    return step.commands.map((c) => ({
      ...c,
      rendered: interpolateCommand(c.template, {
        container,
        phpsessid: sess,
        userToken: token,
      }),
    }));
  }, [step.commands, container, sess, token]);

  const activeCommandText = useMemo(() => {
    if (interpolatedCommands.length === 0) return "";
    if (selectedCmdIdx === "all") {
      return interpolatedCommands.map((c) => c.rendered).join("\n");
    }
    return interpolatedCommands[selectedCmdIdx]?.rendered ?? interpolatedCommands[0].rendered;
  }, [interpolatedCommands, selectedCmdIdx]);

  const getSimulatedStream = (cmdChoice: number | "all"): string => {
    switch (step.id) {
      case "m1-s1":
        return `[+] Kết nối Docker daemon (/var/run/docker.sock)... OK
[+] Thực thi: docker ps

CONTAINER ID   IMAGE                  COMMAND      STATUS       PORTS                    NAMES
${container.padEnd(14, " ")} vulnerables/web-dvwa   "/main.sh"   Up 2 hours   0.0.0.0:8080->80/tcp     epic_dijkstra

[+] Thực thi: nmap -sV -p 8080 127.0.0.1
Starting Nmap 7.95 ( https://nmap.org )
Nmap scan report for localhost (127.0.0.1)
Host is up (0.00021s latency).

PORT     STATE SERVICE VERSION
8080/tcp open  http    Apache httpd 2.4.25 ((Debian))

Service detection performed. 1 service detected.
[✓] Xác nhận container DVWA mở cổng 8080 và lộ dịch vụ Apache httpd 2.4.25 ((Debian)).`;

      case "m1-s2":
        return `[+] Gửi HTTP GET request tới http://127.0.0.1:8080/login.php...

HTTP/1.1 200 OK
Date: Wed, 04 Nov 2026 02:09:19 GMT
Server: Apache/2.4.25 (Debian)   <-- [CWE-200: Lộ phiên bản & hệ điều hành]
Set-Cookie: PHPSESSID=${sess}; path=/   <-- [CWE-614: Thiếu HttpOnly, SameSite=Strict]
Expires: Tue, 23 Jun 2009 12:00:00 GMT
Cache-Control: no-cache, must-revalidate
Pragma: no-cache
Set-Cookie: security=low   <-- [Lưu mức bảo mật ngay phía Client]
Content-Type: text/html;charset=utf-8

[!] Kết quả PoC 1: Phát hiện CWE-200 (CVSS 5.3 Medium) & CWE-614 (CVSS 4.2 Medium).`;

      case "m1-s3": {
        const patchPart = `[+] Kết nối bash container ${container}...
[+] Nối ServerTokens Prod & ServerSignature Off vào /etc/apache2/conf-available/security.conf
[+] Chạy: a2enconf security && service apache2 reload
Enabling conf security.
To activate the new configuration, you need to run:
  service apache2 reload
Reloading Apache httpd web server: apache2.`;

        const checkPart = `[+] Kiểm chứng lại HTTP Header sau khi vá:
$ curl -Is http://127.0.0.1:8080/login.php | grep -i "Server:"

Server: Apache

[✓] Live Patching thành công! Đã ẩn hoàn toàn chuỗi '2.4.25 (Debian)'.`;

        if (cmdChoice === 0) return patchPart;
        if (cmdChoice === 1) return checkPart;
        return `${patchPart}\n\n${checkPart}`;
      }

      case "m1-s4": {
        const modHeadersPart = `[+] Kết nối container ${container} & bật module Apache headers...
$ docker exec -it ${container} bash -c "a2enmod headers && ... && service apache2 reload"
Enabling module headers.
To activate the new configuration, you need to run:
  service apache2 reload
[+] Nối Header edit Set-Cookie (HttpOnly; SameSite=Strict), X-Content-Type-Options, X-Frame-Options -> security.conf
Reloading Apache httpd web server: apache2.`;

        const verifyAllPart = `[+] Kiểm chứng tổng thể HTTP Header sau 2 bản vá (CWE-200 & CWE-614):
$ curl -Is http://127.0.0.1:8080/login.php | grep -iE "(Server:|Set-Cookie:|X-Content-Type|X-Frame)"

Server: Apache
Set-Cookie: PHPSESSID=${sess}; path=/; HttpOnly; SameSite=Strict
Set-Cookie: security=low; HttpOnly; SameSite=Strict
X-Content-Type-Options: nosniff
X-Frame-Options: SAMEORIGIN

[✓] Hoàn tất Vá lỗi 4: Cookie đã khóa HttpOnly + SameSite=Strict & bật đủ Security Headers!`;

        if (cmdChoice === 0) return modHeadersPart;
        if (cmdChoice === 1) return verifyAllPart;
        return `${modHeadersPart}\n\n${verifyAllPart}`;
      }

      case "m2-s1":
        return `[+] Kiểm tra Burp Proxy Listener tại 127.0.0.1:8081: ACTIVE (không xung đột cổng 8080)
[+] Phân giải DNS nội bộ localtest.me -> 127.0.0.1 (vượt cơ chế Loopback Bypass của Chromium)
[+] Chuyển mức bảo mật DVWA Security -> low

GET /vulnerabilities/sqli/ HTTP/1.1
Host: localtest.me:8080
User-Agent: Mozilla/5.0 (Burp Suite Chromium)
Cookie: security=low; PHPSESSID=${sess}

[✓] Proxy Burp 8081 đã bắt trọn lưu lượng tới localtest.me:8080.`;

      case "m2-s2":
        return `[+] Burp Repeater gửi payload id=1' tới http://localtest.me:8080/vulnerabilities/sqli/
[+] Phản hồi từ máy chủ (HTTP/1.1 200 OK · 18ms · 1,842 bytes):

HTTP/1.1 200 OK
Server: Apache/2.4.25 (Debian)
Content-Type: text/html;charset=utf-8

<pre>You have an error in your SQL syntax; check the manual that corresponds
to your MariaDB server version for the right syntax to use near '''1''' at line 1</pre>

[!] Xác nhận Error-based SQL Injection (CWE-89, CVSS 8.8 High) & lộ lỗi CSDL (CWE-209).`;

      case "m2-s3":
        return `[+] Gửi cURL kèm Cookie phiên PHPSESSID=${sess} & lọc regex:
$ curl -s -b "security=low; PHPSESSID=${sess}" \\
  "http://127.0.0.1:8080/vulnerabilities/sqli/?id=1&Submit=Submit" | grep -o "First name: [^<]*"

First name: admin

[✓] Bóc tách tự động thành công dữ liệu người dùng từ HTML bằng dòng lệnh CLI.`;

      case "m2-s4":
        return `[+] Phân tích nhật ký Apache trong container ${container}:
$ docker exec ${container} grep -E "(\\%27|\\'|UNION|SELECT)" /var/log/apache2/access.log | tail -n 5

172.17.0.1 - - [04/Nov/2026:02:14:08 +0000] "GET /vulnerabilities/sqli/?id=1%27&Submit=Submit HTTP/1.1" 200 1842 "-" "Mozilla/5.0 (Burp Chromium)"
172.17.0.1 - - [04/Nov/2026:02:15:21 +0000] "GET /vulnerabilities/sqli/?id=%27%20OR%20%271%27%3D%271&Submit=Submit HTTP/1.1" 200 2195 "-" "curl/8.5.0"
172.17.0.1 - - [04/Nov/2026:02:16:03 +0000] "GET /vulnerabilities/sqli/?id=1%20UNION%20SELECT%20user,password%20FROM%20users&Submit=Submit HTTP/1.1" 200 2340 "-" "sqlmap/1.8.4"

[✓] Blue Team IoC Forensics: Đọc rõ IP nguồn (172.17.0.1), payload (%27, OR, UNION) và User-Agent công cụ.`;

      case "m3-s1": {
        const dbsPart = `[+] [Lệnh 1] Khởi chạy SQLMap --dbs --batch...
[INFO] testing connection to the target URL
[INFO] heuristic (basic) test shows that GET parameter 'id' might be injectable (DBMS: 'MySQL')
[INFO] the back-end DBMS is MySQL (MariaDB fork)
available databases [2]:
[*] dvwa
[*] information_schema`;

        const tablesPart = `[+] [Lệnh 2] Liệt kê bảng trong CSDL dvwa (-D dvwa --tables --batch)...
[INFO] fetching tables for database: 'dvwa'
Database: dvwa
[2 tables]
+-----------+
| guestbook |
| users     |
+-----------+`;

        const dumpPart = `[+] [Lệnh 3] Dump bảng users & Dictionary Crack MD5 (-D dvwa -T users --dump --batch)...
[INFO] recognized possible password hashes in column 'password'
[INFO] using dictionary '/usr/share/sqlmap/data/txt/wordlist.txt'
[100%] [================================] 5/5 hashes parsed
Database: dvwa | Table: users [5 entries]
+---------+---------+--------------------------------------------+
| user_id | user    | password                                   |
+---------+---------+--------------------------------------------+
| 1       | admin   | 5f4dcc3b5aa765d61d8327deb882cf99 (password) |
| 2       | gordonb | e99a18c428cb38d5f260853678922e03 (abc123)   |
| 3       | 1337    | 8d3533d75ae2c3966d7e0d4fcc69216b (charley)  |
| 4       | pablo   | 0d107d09f5bbe40cade3de5c71e9e9b7 (letmein)  |
| 5       | smithy  | 5f4dcc3b5aa765d61d8327deb882cf99 (password) |
+---------+---------+--------------------------------------------+
[✓] Trích xuất và bẻ khóa thành công 100% bảng users qua SQLMap.`;

        if (cmdChoice === 0) return dbsPart;
        if (cmdChoice === 1) return tablesPart;
        if (cmdChoice === 2) return dumpPart;
        return `${dbsPart}\n\n${tablesPart}\n\n${dumpPart}`;
      }

      case "m3-s2":
        return `[+] Kiểm toán hộp trắng MariaDB CLI trong container ${container}:
$ docker exec -it ${container} mysql -u root -e "USE dvwa; SELECT user_id, user, password FROM users;"

+---------+---------+----------------------------------+
| user_id | user    | password                         |
+---------+---------+----------------------------------+
|       1 | admin   | 5f4dcc3b5aa765d61d8327deb882cf99 |
|       2 | gordonb | e99a18c428cb38d5f260853678922e03 |
|       3 | 1337    | 8d3533d75ae2c3966d7e0d4fcc69216b |
|       4 | pablo   | 0d107d09f5bbe40cade3de5c71e9e9b7 |
|       5 | smithy  | 5f4dcc3b5aa765d61d8327deb882cf99 |
+---------+---------+----------------------------------+

[!] PoC 3: admin (ID 1) và smithy (ID 5) dùng CHUNG hash MD5 32-hex không Salt (CWE-759, CVSS 4.9).
[!] Đồng thời phát hiện kết nối trực tiếp mysql -u root không mật khẩu (CWE-250, CVSS 7.2).`;

      case "m3-s3": {
        const genPart = `[+] Kiểm tra hỗ trợ Argon2id / Bcrypt trong container ${container}:
Use BCRYPT
[+] Sinh mã băm Bcrypt (cost = 12) kèm Salt ngẫu nhiên 22 ký tự:
$2y$12$K9p8Q3vT2xL7wR4mN6zA1eH8cB5vD0fG2jK4lM6nP8qR0sT2uV4wX`;

        const updatePart = `[+] Cập nhật chuỗi băm Bcrypt mới cho admin (user_id = 1) trong MariaDB:
+---------+-------+--------------------------------------------------------------+
| user_id | user  | password                                                     |
+---------+-------+--------------------------------------------------------------+
|       1 | admin | $2y$12$K9p8Q3vT2xL7wR4mN6zA1eH8cB5vD0fG2jK4lM6nP8qR0sT2uV4wX |
+---------+-------+--------------------------------------------------------------+
[✓] Vá lỗi 1 hoàn tất: Mật khẩu đã được bảo vệ bằng Bcrypt + Salt tự động (chống Rainbow Table).`;

        if (cmdChoice === 0) return genPart;
        if (cmdChoice === 1) return updatePart;
        return `${genPart}\n\n${updatePart}`;
      }

      case "m3-s4":
        return `[+] Thực thi Vá lỗi 2 (Least Privilege) trên MariaDB container ${container}:
Query OK, 0 rows affected (CREATE USER IF NOT EXISTS 'dvwa_svc'@'localhost')
Query OK, 0 rows affected (GRANT SELECT, INSERT, UPDATE ON dvwa.users)
Query OK, 0 rows affected (FLUSH PRIVILEGES)

+--------------------------------------------------------------------------------+
| Grants for dvwa_svc@localhost                                                  |
+--------------------------------------------------------------------------------+
| GRANT USAGE ON *.* TO 'dvwa_svc'@'localhost' IDENTIFIED BY PASSWORD ...        |
| GRANT SELECT, INSERT, UPDATE ON \`dvwa\`.\`users\` TO 'dvwa_svc'@'localhost'       |
+--------------------------------------------------------------------------------+

[✓] Vá lỗi 2 hoàn tất: Tài khoản dvwa_svc KHÔNG có quyền DROP, ALTER, FILE hay SUPER.`;

      case "m4-s1":
        return `[+] Kiểm toán hộp trắng 4 file PHP trong container ${container}:
=== [1] low.php (0% An toàn - CWE-89) ===
  5: $id = $_REQUEST[ 'id' ];
  8: $query  = "SELECT first_name, last_name FROM users WHERE user_id = '$id';";
  9: $result = mysqli_query(...) or die( '<pre>' . mysqli_error(...) . '</pre>' );

=== [2] medium.php (Bypass qua biểu thức số học) ===
  $id = mysqli_real_escape_string(..., $_POST['id']);
  $query = "SELECT first_name, last_name FROM users WHERE user_id = $id;"; // Thiếu dấu nháy đơn!

=== [3] high.php (Vi phạm Trust Boundary + cắt LIMIT 1) ===
  $id = $_SESSION['id'];
  $query = "SELECT first_name, last_name FROM users WHERE user_id = '$id' LIMIT 1;";

=== [4] impossible.php (100% An toàn - Phòng thủ 3 lớp) ===
  5:  checkToken( $_REQUEST[ 'user_token' ], $_SESSION[ 'session_token' ], 'index.php' );
  11: if(is_numeric( $id )) {
  13:   $data = $db->prepare( 'SELECT first_name, last_name FROM users WHERE user_id = (:id) LIMIT 1;' );
  14:   $data->bindParam( ':id', $id, PDO::PARAM_INT );
  15:   $data->execute();

[✓] Xác định rõ nguyên nhân gốc rễ (nối chuỗi SQL) và kiến trúc 3 lớp của impossible.php.`;

      case "m4-s2":
        return `[+] PoC 5 Gốc: Gửi GET /vulnerabilities/sqli/?id=1'&Submit=Submit (KHÔNG có user_token)
[+] Cookie: security=impossible; PHPSESSID=${sess}

HTTP/1.1 302 Found
Date: Wed, 04 Nov 2026 02:07:32 GMT
Server: Apache/2.4.25 (Debian)
Location: index.php
Content-Length: 0
Content-Type: text/html; charset=UTF-8

[✓] Lớp 1 Anti-CSRF (checkToken dòng 5) đã chặn ngay yêu cầu thiếu user_token trước khi chạm DB.`;

      case "m4-s3":
        return `[+] PoC 5 Tinh chỉnh: Gửi GET /vulnerabilities/sqli/?id=1'&Submit=Submit&user_token=${token}
[+] Cookie: security=impossible; PHPSESSID=${sess}

HTTP/1.1 200 OK
Content-Type: text/html;charset=utf-8

<!-- Trang web hiển thị form bình thường, KHÔNG trả về bản ghi nào và KHÔNG lộ bất kỳ thông báo lỗi MariaDB nào -->

[✓] Phân tích 3 lớp:
  1. checkToken() (Dòng 5): ĐÃ QUA nhờ user_token hợp lệ.
  2. is_numeric("1'") (Dòng 11): TRẢ VỀ FALSE -> Không gọi truy vấn SQL.
  3. PDO prepare + PDO::PARAM_INT (Dòng 13-15): Khóa chặt tham số nếu có dữ liệu đi vào.`;

      case "m4-s4":
        return `[+] Kích hoạt Luật WAF ModSecurity ID 100001 kiểm tra ARGS:id...
SecRule ARGS:id "@rx (\\'|--|#|/\\*|UNION|SELECT|OR\\s+\\d+=\\d+)" \\
  "id:100001,phase:2,deny,status:403,log,msg:'Phat hien dau hieu bat thuong trong tham so id - Ngan chan boi ModSecurity'"

[+] Thử gửi payload SQLi tại tầng biên: ?id=1' OR 1=1
HTTP/1.1 403 Forbidden
[ModSecurity Audit Log] id "100001" | phase "2" | severity "CRITICAL"
msg "Phat hien dau hieu bat thuong trong tham so id - Ngan chan boi ModSecurity"

[✓] Hoàn thiện mô hình Phòng thủ Chiều sâu (Defense-in-Depth) theo OWASP A03:2021.`;

      default:
        return step.expected_output || "[✓] Đã hoàn tất mô phỏng lệnh.";
    }
  };

  const fullStreamText = useMemo(
    () => getSimulatedStream(selectedCmdIdx),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [step.id, selectedCmdIdx, container, sess, token]
  );
  const fullLines = useMemo(() => fullStreamText.split("\n"), [fullStreamText]);

  useEffect(() => {
    return () => {
      if (streamTimerRef.current) clearInterval(streamTimerRef.current);
    };
  }, []);

  const startStreaming = (linesCount: number) => {
    if (streamTimerRef.current) clearInterval(streamTimerRef.current);
    setIsRunning(true);
    setHasRun(true);
    setVisibleLineCount(0);

    let current = 0;
    streamTimerRef.current = setInterval(() => {
      current += 2;
      if (current >= linesCount) {
        setVisibleLineCount(linesCount);
        setIsRunning(false);
        if (streamTimerRef.current) clearInterval(streamTimerRef.current);
      } else {
        setVisibleLineCount(current);
      }
    }, 65);
  };

  const handleRun = () => {
    setIsMinimized(false);
    startStreaming(fullLines.length);
  };

  const handleInstantShow = () => {
    if (streamTimerRef.current) clearInterval(streamTimerRef.current);
    setVisibleLineCount(fullLines.length);
    setIsRunning(false);
    setHasRun(true);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(activeCommandText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // ignore clipboard errors
    }
  };

  const handleRunQuickCmd = () => {
    const trimmed = quickCmd.trim();
    if (!trimmed) return;
    const lower = trimmed.toLowerCase();
    if (lower === "clear") {
      setQuickEntries([]);
      setQuickCmd("");
      return;
    }

    let out = `shell: '${trimmed}'. Hỗ trợ nhanh: docker ps, docker ps -a, docker images, whoami, pwd, id, hostname, curl -Is http://127.0.0.1:8080/login.php, clear`;
    if (lower === "help" || lower === "?") {
      out = "Lệnh nhanh: docker ps | docker ps -a | docker images | whoami | id | pwd | hostname | curl -Is http://127.0.0.1:8080/login.php | clear";
    } else if (lower.startsWith("docker ps")) {
      out = `CONTAINER ID   IMAGE                  STATUS       PORTS                    NAMES\n${container.padEnd(14, " ")} vulnerables/web-dvwa   Up 2 hours   0.0.0.0:8080->80/tcp     ${memberNumber === 1 ? "epic_dijkstra" : "dvwa"}`;
    } else if (lower === "docker images") {
      out = `REPOSITORY             TAG       IMAGE ID       SIZE\nvulnerables/web-dvwa   latest    715061c61096   712MB`;
    } else if (lower === "whoami") {
      out = memberNumber === 1 ? "soncris" : memberNumber === 2 ? "hung" : memberNumber === 3 ? "quyet" : "khanh";
    } else if (lower === "id") {
      out = memberNumber === 1 ? "uid=501(soncris) gid=20(staff)" : "uid=1000(ubuntu) groups=27(sudo),999(docker)";
    } else if (lower === "pwd") {
      out = memberNumber === 1 ? "/Users/soncris" : `/home/${memberNumber === 2 ? "hung" : memberNumber === 3 ? "quyet" : "khanh"}`;
    } else if (lower === "hostname") {
      out = memberNumber === 1 ? "MacBook-Pro" : "ubuntu-vm";
    } else if (lower.startsWith("curl")) {
      out = `HTTP/1.1 200 OK\nServer: Apache/2.4.25 (Debian)\nSet-Cookie: PHPSESSID=${sess}; path=/\nContent-Type: text/html;charset=utf-8`;
    }

    setQuickEntries((prev) => [...prev, { id: Date.now(), cmd: trimmed, out }]);
    setQuickCmd("");
  };

  const displayedOutput = fullLines.slice(0, visibleLineCount).join("\n");

  return (
    <div className="mt-3 overflow-hidden rounded-lg border border-hairline bg-surface">
      {/* Toggle Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-subtle/70 px-3.5 py-2.5">
        <button
          type="button"
          onClick={() => setIsOpen((v) => !v)}
          className="inline-flex cursor-pointer items-center gap-2 text-xs font-semibold text-ink transition-colors hover:text-accent"
        >
          <Terminal className="h-4 w-4 text-accent" aria-hidden="true" />
          <span>Mô phỏng Trực quan Bước 0{step.step_order}</span>
          {hasRun && !isRunning && (
            <span className="rounded bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
              ĐÃ CHẠY
            </span>
          )}
          {isRunning && (
            <span className="rounded bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-300">
              ĐANG CHẠY...
            </span>
          )}
          {isOpen ? (
            <ChevronUp className="h-3.5 w-3.5 text-muted" aria-hidden="true" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5 text-muted" aria-hidden="true" />
          )}
        </button>

        <div className="flex items-center gap-2">
          {!isOpen && (
            <button
              type="button"
              onClick={() => {
                setIsOpen(true);
                setIsMinimized(false);
                startStreaming(fullLines.length);
              }}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded bg-ink px-2.5 py-1 text-xs font-semibold text-canvas transition-opacity hover:opacity-90"
            >
              <Play className="h-3 w-3" aria-hidden="true" />
              Chạy thử ngay
            </button>
          )}

          {step.simulator_key && onOpenAdvancedSim && (
            <button
              type="button"
              onClick={() => onOpenAdvancedSim(step.simulator_key)}
              className="inline-flex cursor-pointer items-center gap-1 text-[11px] font-medium text-muted hover:text-ink"
              title="Mở bảng điều khiển tương tác đầy đủ ở cuối trang"
            >
              Bảng điều khiển ↗
            </button>
          )}
        </div>
      </div>

      {/* Terminal Body */}
      {isOpen && (
        <div className="space-y-3 border-t border-hairline bg-[#0a0d12] p-3.5 font-mono text-xs text-zinc-200">
          {/* Interactive Terminal Window Header */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 pb-2">
            <div className="flex items-center gap-2.5">
              <WindowControls
                onClose={() => {
                  if (streamTimerRef.current) clearInterval(streamTimerRef.current);
                  setIsRunning(false);
                  setIsOpen(false);
                }}
                closeTitle="Đóng cửa sổ mô phỏng"
                onMinimize={() => setIsMinimized((v) => !v)}
                isMinimized={isMinimized}
                onMaximize={() => {
                  setIsMinimized(false);
                  setIsExpanded((v) => !v);
                }}
                isMaximized={isExpanded}
              />
              <span className="font-mono text-[11px] text-zinc-300">{hostPrompt}</span>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {isRunning && (
                <button
                  type="button"
                  onClick={handleInstantShow}
                  className="cursor-pointer rounded border border-zinc-700 bg-zinc-800 px-2 py-0.5 text-[11px] text-amber-300 hover:bg-zinc-700"
                >
                  Hiện toàn bộ
                </button>
              )}
              <button
                type="button"
                onClick={handleCopy}
                className="cursor-pointer rounded border border-zinc-700 bg-zinc-800 px-2 py-0.5 text-[11px] text-zinc-300 transition-colors hover:bg-zinc-700"
              >
                {copied ? "Đã copy" : "Copy lệnh"}
              </button>
              <button
                type="button"
                onClick={handleRun}
                className="inline-flex cursor-pointer items-center gap-1 rounded bg-emerald-600 px-2.5 py-0.5 text-[11px] font-bold text-white transition-opacity hover:opacity-90"
              >
                <Play className="h-3 w-3" aria-hidden="true" />
                {isRunning ? "Đang chạy..." : hasRun ? "Chạy lại" : "Chạy lệnh"}
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Multi-command selector when step has >1 command */}
              {interpolatedCommands.length > 1 && (
                <div className="flex flex-wrap items-center gap-1.5 font-sans">
                  <span className="text-[11px] text-zinc-400">Chọn lệnh chạy:</span>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCmdIdx("all");
                      setHasRun(false);
                      setVisibleLineCount(0);
                    }}
                    className={`cursor-pointer rounded border px-2 py-0.5 text-[11px] font-medium transition-colors ${
                      selectedCmdIdx === "all"
                        ? "border-emerald-500/60 bg-emerald-500/20 text-emerald-300"
                        : "border-zinc-700 bg-zinc-900 text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    Tất cả ({interpolatedCommands.length})
                  </button>
                  {interpolatedCommands.map((_, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setSelectedCmdIdx(idx);
                        setHasRun(false);
                        setVisibleLineCount(0);
                      }}
                      className={`cursor-pointer rounded border px-2 py-0.5 text-[11px] font-medium transition-colors ${
                        selectedCmdIdx === idx
                          ? "border-emerald-500/60 bg-emerald-500/20 text-emerald-300"
                          : "border-zinc-700 bg-zinc-900 text-zinc-400 hover:text-zinc-200"
                      }`}
                    >
                      Lệnh {idx + 1}
                    </button>
                  ))}
                </div>
              )}

              {/* Executed Command Preview */}
              <div className="rounded border border-zinc-800/80 bg-[#0d1117] px-3 py-2 text-zinc-400">
                <span className="text-emerald-400">{hostPrompt}</span>{" "}
                <span className="font-semibold text-zinc-100">
                  {activeCommandText.split("\n")[0]}
                </span>
                {activeCommandText.split("\n").length > 1 && (
                  <span className="text-zinc-500">
                    {" "}
                    (+{activeCommandText.split("\n").length - 1} dòng lệnh nối tiếp)
                  </span>
                )}
              </div>

              {/* Terminal Stream Output */}
              <div
                className={`overflow-y-auto rounded border border-zinc-800/80 bg-[#05070a] p-3 text-zinc-300 transition-all ${
                  isExpanded ? "max-h-[520px] min-h-[220px]" : "max-h-[300px] min-h-[140px]"
                }`}
              >
                {hasRun ? (
                  <pre className="whitespace-pre-wrap leading-relaxed text-emerald-300/90 selection:bg-emerald-800 selection:text-white">
                    {displayedOutput}
                    {isRunning && (
                      <span className="ml-1 inline-block h-3.5 w-1.5 animate-pulse bg-emerald-400 align-middle" />
                    )}
                  </pre>
                ) : (
                  <div className="flex flex-col items-center justify-center py-6 text-center text-zinc-500">
                    <Terminal className="mb-1.5 h-6 w-6 opacity-50" aria-hidden="true" />
                    <span>
                      Bấm nút <strong className="text-zinc-300">&quot;Chạy lệnh&quot;</strong> để xem
                      quá trình mô phỏng từng dòng.
                    </span>
                    <span className="mt-1 text-[11px] text-zinc-600">
                      Biến môi trường đang nạp: {container} · PHPSESSID={sess.slice(0, 8)}...
                    </span>
                  </div>
                )}
              </div>

              {/* Compact interactive manual input bar */}
              {quickEntries.length > 0 && (
                <div className="space-y-1.5 rounded border border-zinc-800/80 bg-[#05070a] p-2.5">
                  {quickEntries.map((qe) => (
                    <div key={qe.id} className="space-y-0.5">
                      <div className="text-zinc-300">
                        <span className="text-emerald-400">{hostPrompt}</span> {qe.cmd}
                      </div>
                      <pre className="whitespace-pre-wrap text-[11px] text-emerald-300">
                        {qe.out}
                      </pre>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex flex-wrap items-center gap-2 rounded border border-zinc-800/80 bg-[#0d1117] px-3 py-1.5">
                <span className="text-emerald-400">{hostPrompt}</span>
                <input
                  type="text"
                  value={quickCmd}
                  onChange={(e) => setQuickCmd(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleRunQuickCmd();
                    }
                  }}
                  aria-label="Gõ thêm lệnh nhanh"
                  placeholder="Gõ thêm lệnh tại đây: docker ps, whoami, pwd, clear..."
                  className="min-w-[180px] flex-1 bg-transparent font-mono text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleRunQuickCmd}
                  className="cursor-pointer rounded border border-zinc-700 bg-zinc-800 px-2 py-0.5 text-[11px] font-semibold text-zinc-200 hover:bg-zinc-700"
                >
                  Enter ↵
                </button>
              </div>

              {/* Bottom Action Footer */}
              {hasRun && !isRunning && (
                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-zinc-800/80 pt-2.5 font-sans">
                  <div className="flex items-center gap-2 text-xs">
                    {step.is_defense ? (
                      <ShieldCheck className="h-4 w-4 text-emerald-400" aria-hidden="true" />
                    ) : (
                      <ShieldAlert className="h-4 w-4 text-amber-400" aria-hidden="true" />
                    )}
                    <span className="text-zinc-300">
                      {step.is_defense
                        ? "Gia cố phòng thủ / kiểm toán thành công."
                        : "Đã xác nhận kết quả kiểm thử."}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleRun}
                      className="inline-flex cursor-pointer items-center gap-1 rounded border border-zinc-700 bg-zinc-800 px-2.5 py-1 text-xs text-zinc-300 hover:bg-zinc-700"
                    >
                      <RotateCcw className="h-3 w-3" aria-hidden="true" /> Chạy lại
                    </button>

                    <button
                      type="button"
                      onClick={onToggleComplete}
                      className={`inline-flex cursor-pointer items-center gap-1.5 rounded px-3 py-1 text-xs font-semibold transition-colors ${
                        isCompleted
                          ? "border border-emerald-500/30 bg-zinc-800 text-emerald-400"
                          : "bg-emerald-600 text-white hover:bg-emerald-700"
                      }`}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                      {isCompleted ? "Đã đánh dấu xong" : "Đánh dấu hoàn thành bước"}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
