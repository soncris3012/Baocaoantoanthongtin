"use client";

import { KeyboardEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  Maximize2,
  Minimize2,
  Pause,
  Play,
  Plus,
  RotateCcw,
  SkipForward,
  Square,
  Terminal as TerminalIcon,
  X,
} from "lucide-react";
import { WindowControls } from "@/components/WindowBar";
import { PHP_LEVEL_SOURCES } from "@/data/scenarioData";

export type ShellContext = "host" | "container" | "mariadb";

export interface TerminalPreset {
  id?: string;
  label: string;
  command: string;
  context?: ShellContext;
}

export interface TerminalStepGroup {
  id: string;
  label: string;
  commands: string[];
  context?: ShellContext;
}

export interface ExternalTerminalCommand {
  id: number;
  command?: string;
  commands?: string[];
  context?: ShellContext;
}

export function buildStepTerminalCommands(
  stepId: string,
  vars: { container: string; phpsessid: string }
): string[] | null {
  const c = vars.container.trim() || (stepId.startsWith("m1-") ? "215d3a734374" : "dvwa");
  const s = vars.phpsessid.trim() || "7nst0hrqrfmv744a5ouj7663b0";

  switch (stepId) {
    case "m1-s1":
      return ["docker ps", "nmap -sV -p 8080 127.0.0.1"];
    case "m1-s2":
      return ["curl -is http://127.0.0.1:8080/login.php | head -n 15"];
    case "m1-s3":
      return [
        `docker exec ${c} bash -c "printf 'ServerTokens Prod\\nServerSignature Off\\n' >> /etc/apache2/conf-available/security.conf && a2enconf security && service apache2 reload"`,
        'curl -Is http://127.0.0.1:8080/login.php | grep -i "Server:"',
      ];
    case "m1-s4":
      return [
        `docker exec ${c} bash -c "a2enmod headers && printf 'Header edit Set-Cookie ^(.*)\\$ \\"\\$1; HttpOnly; SameSite=Strict\\"\\nHeader always set X-Content-Type-Options \\"nosniff\\"\\nHeader always set X-Frame-Options \\"SAMEORIGIN\\"\\n' >> /etc/apache2/conf-available/security.conf && service apache2 reload"`,
        'curl -Is http://127.0.0.1:8080/login.php | grep -iE "(Server:|Set-Cookie:|X-Content-Type|X-Frame)"',
      ];
    case "m2-s3":
      return [
        `curl -s -b "security=low; PHPSESSID=${s}" "http://127.0.0.1:8080/vulnerabilities/sqli/?id=1&Submit=Submit" | grep -o "First name: [^<]*"`,
      ];
    case "m2-s4":
      return [
        `docker exec ${c} grep -E "(%27|'|UNION|SELECT)" /var/log/apache2/access.log | tail -n 5`,
      ];
    case "m3-s1":
      return [
        `sqlmap -u "http://127.0.0.1:8080/vulnerabilities/sqli/?id=1&Submit=Submit" --cookie="security=low; PHPSESSID=${s}" --dbs --batch`,
        `sqlmap -u "http://127.0.0.1:8080/vulnerabilities/sqli/?id=1&Submit=Submit" --cookie="security=low; PHPSESSID=${s}" -D dvwa --tables --batch`,
        `sqlmap -u "http://127.0.0.1:8080/vulnerabilities/sqli/?id=1&Submit=Submit" --cookie="security=low; PHPSESSID=${s}" -D dvwa -T users --dump --batch`,
      ];
    case "m3-s2":
      return [
        `docker exec -it ${c} mysql -u root -e "USE dvwa; SELECT user_id, user, password FROM users;"`,
      ];
    case "m3-s3":
      return [
        `docker exec -it ${c} php -r "echo defined('PASSWORD_ARGON2ID') ? 'Supported' : 'Use BCRYPT'; echo PHP_EOL;"`,
        `docker exec -it ${c} php -r 'echo password_hash("password", PASSWORD_BCRYPT, ["cost" => 12]) . PHP_EOL;'`,
        `docker exec -it ${c} mysql -u root -e "USE dvwa; UPDATE users SET password = '\\$2y\\$12\\$K9p8Q3vT2xL7wR4mN6zA1eH8cB5vD0fG2jK4lM6nP8qR0sT2uV4wX' WHERE user_id = 1; SELECT user_id, user, password FROM users WHERE user_id = 1;"`,
      ];
    case "m3-s4":
      return [
        `docker exec -it ${c} mysql -u root -e "CREATE USER IF NOT EXISTS 'dvwa_svc'@'localhost' IDENTIFIED BY 'SecureSvcPass2026!'; GRANT SELECT, INSERT, UPDATE ON dvwa.users TO 'dvwa_svc'@'localhost'; FLUSH PRIVILEGES; SHOW GRANTS FOR 'dvwa_svc'@'localhost';"`,
      ];
    case "m4-s1":
      return [
        `docker exec ${c} cat -n /var/www/html/vulnerabilities/sqli/source/low.php`,
        `docker exec ${c} cat -n /var/www/html/vulnerabilities/sqli/source/medium.php`,
        `docker exec ${c} cat -n /var/www/html/vulnerabilities/sqli/source/high.php`,
        `docker exec ${c} cat -n /var/www/html/vulnerabilities/sqli/source/impossible.php`,
      ];
    case "m4-s4":
      return [
        `docker exec ${c} apache2ctl -M | grep security2`,
        `curl -i "http://127.0.0.1:8080/vulnerabilities/sqli/?id=1'%20OR%201=1"`,
        `docker exec ${c} tail -n 10 /var/log/apache2/modsec_audit.log`,
      ];
    default:
      return null;
  }
}

export function describeTerminalCommand(rawCmd: string): { title: string; effect: string } {
  const c = rawCmd.trim();
  const lower = c.toLowerCase();

  if (lower.startsWith("docker --version")) {
    return {
      title: "Kiểm tra phiên bản Docker Engine",
      effect: "Xác nhận Docker CLI và daemon đang hoạt động bình thường trên máy trước khi kéo image và dựng lab DVWA.",
    };
  }
  if (lower.startsWith("docker pull")) {
    return {
      title: "Tải image vulnerables/web-dvwa",
      effect: "Kéo toàn bộ gói máy chủ Apache + PHP + MariaDB chứa ứng dụng DVWA từ Docker Registry về máy cục bộ.",
    };
  }
  if (lower.startsWith("docker run")) {
    return {
      title: "Khởi tạo container DVWA",
      effect: "Chạy container ở chế độ nền (-d), gán tên 'dvwa' và ánh xạ cổng 8080 ngoài máy thật vào cổng 80 Apache bên trong container.",
    };
  }
  if (lower.startsWith("docker ps")) {
    return {
      title: "Liệt kê các container Docker",
      effect: "Hiển thị Container ID, Image, trạng thái Up/Exited và quy tắc ánh xạ cổng (0.0.0.0:8080->80/tcp) để xác định đúng mục tiêu kiểm thử.",
    };
  }
  if (lower.startsWith("docker stop") || lower.startsWith("docker start") || lower.startsWith("docker restart")) {
    return {
      title: "Điều khiển vòng đời Container",
      effect: "Dừng, khởi động lại hoặc bật dịch vụ DVWA trên cổng 8080 — đồng bộ trực tiếp với giao diện Docker Desktop.",
    };
  }
  if (lower.includes("a2enconf security") || lower.includes("servertokens prod")) {
    return {
      title: "Vá lỗi CWE-200: Ẩn Apache Server Banner",
      effect: "Cấu hình ServerTokens Prod & ServerSignature Off trong /etc/apache2/conf-available/security.conf rồi reload Apache để chỉ trả về 'Server: Apache' thay vì lộ 2.4.25 (Debian).",
    };
  }
  if (lower.includes("a2enmod headers") || lower.includes("set-cookie")) {
    return {
      title: "Vá lỗi CWE-614: Gia cố Cookie & Security Headers",
      effect: "Bật mod_headers và chèn HttpOnly; SameSite=Strict vào Set-Cookie cùng X-Content-Type-Options: nosniff, X-Frame-Options: SAMEORIGIN chống đánh cắp phiên qua XSS/CSRF.",
    };
  }
  if (lower.includes("php -r") && lower.includes("argon2id")) {
    return {
      title: "Kiểm tra thuật toán băm được PHP hỗ trợ",
      effect: "Kiểm tra xem phiên bản PHP trong container đã biên dịch với PASSWORD_ARGON2ID hay cần dùng PASSWORD_BCRYPT.",
    };
  }
  if (lower.includes("php -r") && lower.includes("password_hash")) {
    return {
      title: "Sinh chuỗi băm Bcrypt (cost=12) + Salt ngẫu nhiên",
      effect: "Tạo chuỗi băm Bcrypt 60 ký tự có Salt 22 ký tự ngẫu nhiên mỗi lần gọi, chống giải mã bằng Rainbow Table so với MD5 thuần.",
    };
  }
  if (lower.includes("mysql") && lower.includes("update users")) {
    return {
      title: "Cập nhật mật khẩu sang Bcrypt trong MariaDB",
      effect: "Ghi đè chuỗi MD5 cũ của tài khoản admin bằng mã băm Bcrypt mới và truy vấn lại bảng users để kiểm chứng kết quả.",
    };
  }
  if (lower.includes("mysql") && (lower.includes("create user") || lower.includes("grant "))) {
    return {
      title: "Áp dụng nguyên tắc Đặc quyền tối thiểu (Least Privilege)",
      effect: "Tạo tài khoản riêng dvwa_svc@localhost chỉ có quyền SELECT, INSERT, UPDATE trên dvwa.users; thu hồi quyền DROP, ALTER, FILE, SUPER so với dùng root.",
    };
  }
  if (lower.includes("mysql") || lower.includes("select ") || lower.includes("show grants") || lower.includes("show tables")) {
    return {
      title: "Kiểm toán dữ liệu & phân quyền MariaDB CLI",
      effect: "Truy vấn trực tiếp bảng users hoặc danh sách GRANT trong cơ sở dữ liệu DVWA để đối chiếu thuật toán lưu trữ mật khẩu và đặc quyền user.",
    };
  }
  if (lower.includes("cat ") && lower.includes(".php")) {
    return {
      title: "Kiểm toán mã nguồn PHP hộp trắng (White-box)",
      effect: "Đọc mã nguồn backend DVWA có đánh số dòng (-n) để chỉ ra điểm nối chuỗi SQL gây lỗ hổng và 3 lớp phòng thủ ở file impossible.php.",
    };
  }
  if (lower.includes("diff -u")) {
    return {
      title: "So sánh khác biệt mã nguồn (Diff)",
      effect: "Đối chiếu trực tiếp từng dòng giữa low.php (lỗ hổng) và impossible.php (checkToken + is_numeric + PDO::PARAM_INT).",
    };
  }
  if (lower.includes("apache2ctl") || lower.includes("security2")) {
    return {
      title: "Kiểm tra module WAF ModSecurity trong Apache",
      effect: "Xác nhận module security2_module (shared) đã được nạp để thực thi bộ lọc tường lửa ứng dụng Web (OWASP CRS).",
    };
  }
  if (lower.includes("modsec_audit.log")) {
    return {
      title: "Đọc nhật ký chặn tầng biên ModSecurity Audit Log",
      effect: "Truy xuất các sự kiện HTTP 403 Denied gần nhất kèm quy tắc SecRule 100001 đã chặn chuỗi tấn công SQL Injection.",
    };
  }
  if (lower.includes("access.log")) {
    return {
      title: "Blue Team Log Forensics trên Apache access.log",
      effect: "Lọc các dấu hiệu tấn công IoC (%27, nháy đơn, UNION, SELECT) kèm IP nguồn, mã phản hồi HTTP và User-Agent công cụ khai thác.",
    };
  }
  if (lower.startsWith("docker exec") && (lower.includes("bash") || lower.includes(" sh"))) {
    return {
      title: "Mở shell tương tác bên trong Container",
      effect: "Đi thẳng vào môi trường root bash của container để chỉnh cấu hình Apache, kiểm tra file mã nguồn PHP hoặc đọc log hệ thống.",
    };
  }
  if (lower.startsWith("nmap")) {
    return {
      title: "Quét cổng và dò phiên bản dịch vụ (Nmap -sV)",
      effect: "Xác định cổng 8080 đang mở HTTP và bóc tách phiên bản phần mềm máy chủ web (Apache httpd 2.4.25 Debian) phục vụ đánh giá bề mặt tấn công.",
    };
  }
  if (lower.startsWith("sqlmap") && lower.includes("--dbs")) {
    return {
      title: "SQLMap Pha 1: Dò điểm tiêm & liệt kê Database (--dbs)",
      effect: "Tự động kiểm thử tham số ?id= bằng cookie phiên (--cookie), nhận diện MariaDB/MySQL bị SQLi và liệt kê tên các cơ sở dữ liệu.",
    };
  }
  if (lower.startsWith("sqlmap") && lower.includes("--tables")) {
    return {
      title: "SQLMap Pha 2: Liệt kê bảng trong CSDL dvwa (--tables)",
      effect: "Khui danh sách toàn bộ bảng dữ liệu thuộc schema 'dvwa' (gồm bảng guestbook và users) để chuẩn bị trích xuất.",
    };
  }
  if (lower.startsWith("sqlmap") && lower.includes("--dump")) {
    return {
      title: "SQLMap Pha 3: Dump bảng users & Dictionary Crack MD5 (--dump)",
      effect: "Trích xuất toàn bộ bản ghi user/password và tự động đối chiếu từ điển để giải mã chuỗi MD5 không Salt thành mật khẩu rõ.",
    };
  }
  if (lower.startsWith("curl") && lower.includes("login.php") && lower.includes("grep")) {
    return {
      title: "Kiểm chứng HTTP Security Headers bằng cURL + grep",
      effect: "Chỉ lấy HTTP response header (-Is) và lọc dòng Server, Set-Cookie, X-Content-Type-Options, X-Frame-Options để chứng minh bản vá đã có hiệu lực.",
    };
  }
  if (lower.startsWith("curl") && lower.includes("login.php")) {
    return {
      title: "Thu thập HTTP Header trang login.php (CWE-200 & CWE-614)",
      effect: "Đọc phản hồi đầu trang (-is | head -n 15) để lấy bằng chứng lộ Server Banner Apache/Debian và Cookie thiếu HttpOnly/SameSite.",
    };
  }
  if (lower.startsWith("curl") && lower.includes("grep -o")) {
    return {
      title: "Khai thác tự động bằng cURL kết hợp lọc Regex (grep -o)",
      effect: "Đính kèm cookie phiên (-b) gửi request tới /vulnerabilities/sqli/ và trích xuất chính xác dòng 'First name: ...' từ mã HTML trả về.",
    };
  }
  if (lower.startsWith("curl") && (lower.includes("1'") || lower.includes("or%20") || lower.includes("union"))) {
    return {
      title: "Gửi payload SQL Injection kiểm thử từ dòng lệnh cURL",
      effect: "Kiểm tra phản ứng thực tế của DVWA hoặc bộ lọc ModSecurity WAF (403 Forbidden vs 200 OK) khi nhận tham số id độc hại.",
    };
  }

  return {
    title: "Thực thi lệnh kiểm thử / quản trị hệ thống",
    effect: "Gửi câu lệnh trực tiếp vào shell hiện tại và quan sát kết quả trả về từ hệ thống/container.",
  };
}

export interface TerminalEntryInput {
  command: string;
  output: string;
  tone?: "normal" | "ok" | "warn" | "error";
  context?: ShellContext;
}

export interface AccessLogRecord {
  ip: string;
  timestamp: string;
  method: string;
  uri: string;
  status: string;
  bytes: string;
  ua: string;
}

export interface WafLogRecord {
  time: string;
  payload: string;
  blocked: boolean;
  matchedRuleToken: string;
}

interface TerminalLineEntry {
  id: number;
  promptPrefix: string;
  promptCwd: string;
  promptSymbol: string;
  context: ShellContext;
  command: string;
  output: string;
  tone: "normal" | "ok" | "warn" | "error";
}

interface TerminalTab {
  id: number;
  title: string;
  context: ShellContext;
  cwd: string;
  entries: TerminalLineEntry[];
  history: string[];
  historyIdx: number;
  input: string;
}

interface TerminalEmulatorProps {
  os: "macos" | "ubuntu";
  username: string;
  hostname: string;
  containerRef: string;
  phpsessid?: string;
  userToken?: string;
  containerRunning?: boolean;
  onContainerRunningChange?: (running: boolean) => void;
  apachePatched?: boolean;
  cookiePatched?: boolean;
  bcryptApplied?: boolean;
  leastPrivApplied?: boolean;
  onApachePatchedChange?: (v: boolean) => void;
  onCookiePatchedChange?: (v: boolean) => void;
  onBcryptAppliedChange?: (v: boolean) => void;
  onLeastPrivAppliedChange?: (v: boolean) => void;
  onCurlLogged?: (idParam: string, ua: string) => void;
  onWafTested?: (payload: string) => void;
  externalAccessLogs?: AccessLogRecord[];
  externalWafLogs?: WafLogRecord[];
  presets?: TerminalPreset[];
  stepGroups?: TerminalStepGroup[];
  initialEntries?: TerminalEntryInput[];
  externalCommand?: ExternalTerminalCommand | null;
}

function getPromptParts(
  os: "macos" | "ubuntu",
  username: string,
  hostname: string,
  containerId: string,
  context: ShellContext,
  cwd: string
): { prefix: string; cwdLabel: string; symbol: string } {
  if (context === "mariadb") {
    return { prefix: "MariaDB [dvwa]", cwdLabel: "", symbol: ">" };
  }
  if (context === "container") {
    return {
      prefix: `root@${containerId.slice(0, 12)}`,
      cwdLabel: cwd,
      symbol: "#",
    };
  }
  if (os === "macos") {
    return { prefix: `${username}@${hostname}`, cwdLabel: cwd, symbol: "%" };
  }
  return { prefix: `${username}@${hostname}`, cwdLabel: cwd, symbol: "$" };
}

function resolveContainerPath(currentCwd: string, targetArg: string): string {
  if (!targetArg || targetArg === "~") return "/root";
  if (targetArg.startsWith("/")) return targetArg.replace(/\/+$/, "") || "/";
  if (targetArg === "..") {
    const parts = currentCwd.split("/").filter(Boolean);
    parts.pop();
    return "/" + parts.join("/");
  }
  const base = currentCwd === "/" ? "" : currentCwd;
  return `${base}/${targetArg}`.replace(/\/+/g, "/");
}

function renderUnifiedPhpDiff(): string {
  const low = PHP_LEVEL_SOURCES[0]?.code ?? "";
  const imp = PHP_LEVEL_SOURCES[3]?.code ?? "";
  const lines = [
    "--- /var/www/html/vulnerabilities/sqli/source/low.php",
    "+++ /var/www/html/vulnerabilities/sqli/source/impossible.php",
    "@@ -3,12 +3,16 @@",
    "-if( isset( $_REQUEST[ 'Submit' ] ) ) {",
    "-    $id = $_REQUEST[ 'id' ];",
    "-    $query  = \"SELECT first_name, last_name FROM users WHERE user_id = '$id';\";",
    "-    $result = mysqli_query($GLOBALS[\"___mysqli_ston\"], $query) or die(mysqli_error(...));",
    "+if( isset( $_GET[ 'Submit' ] ) ) {",
    "+    // Layer 1: Anti-CSRF checkToken()",
    "+    checkToken( $_REQUEST[ 'user_token' ], $_SESSION[ 'session_token' ], 'index.php' );",
    "+    $id = $_GET[ 'id' ];",
    "+    // Layer 2: Strict numeric type validation",
    "+    if(is_numeric( $id )) {",
    "+        // Layer 3: PDO Prepared Statements + PDO::PARAM_INT",
    "+        $data = $db->prepare( 'SELECT first_name, last_name FROM users WHERE user_id = (:id) LIMIT 1;' );",
    "+        $data->bindParam( ':id', $id, PDO::PARAM_INT );",
    "+        $data->execute();",
    "+    }",
    " }",
    `# low.php lines=${low.split("\n").length} vs impossible.php lines=${imp.split("\n").length}`,
  ];
  return lines.join("\n");
}

export function TerminalEmulator({
  os,
  username,
  hostname,
  containerRef,
  phpsessid = "7nst0hrqrfmv744a5ouj7663b0",
  userToken = "d41d8cd98f00b204e9800998ecf8427e",
  containerRunning,
  onContainerRunningChange,
  apachePatched,
  cookiePatched,
  bcryptApplied,
  leastPrivApplied,
  onApachePatchedChange,
  onCookiePatchedChange,
  onBcryptAppliedChange,
  onLeastPrivAppliedChange,
  onCurlLogged,
  onWafTested,
  externalAccessLogs,
  externalWafLogs,
  presets = [],
  stepGroups = [],
  initialEntries = [],
  externalCommand,
}: TerminalEmulatorProps) {
  const cleanContainer = containerRef.trim() || (os === "macos" ? "215d3a734374" : "dvwa");
  const cleanSess = phpsessid.trim() || "7nst0hrqrfmv744a5ouj7663b0";
  const cleanToken = userToken.trim() || "d41d8cd98f00b204e9800998ecf8427e";
  const shortContainerId = cleanContainer === "dvwa" ? "215d3a734374" : cleanContainer.slice(0, 12);
  const containerDisplayName = os === "macos" ? "epic_dijkstra" : "dvwa";

  const [internalRunning, setInternalRunning] = useState(true);
  const [internalApachePatched, setInternalApachePatched] = useState(false);
  const [internalCookiePatched, setInternalCookiePatched] = useState(false);
  const [internalBcryptApplied, setInternalBcryptApplied] = useState(false);
  const [internalLeastPrivApplied, setInternalLeastPrivApplied] = useState(false);

  const isRunning = containerRunning ?? internalRunning;
  const isApachePatched = apachePatched ?? internalApachePatched;
  const isCookiePatched = cookiePatched ?? internalCookiePatched;
  const isBcrypt = bcryptApplied ?? internalBcryptApplied;
  const isLeastPriv = leastPrivApplied ?? internalLeastPrivApplied;

  const updateRunning = (v: boolean) => {
    setInternalRunning(v);
    onContainerRunningChange?.(v);
  };
  const updateApache = (v: boolean) => {
    setInternalApachePatched(v);
    onApachePatchedChange?.(v);
  };
  const updateCookie = (v: boolean) => {
    setInternalCookiePatched(v);
    onCookiePatchedChange?.(v);
  };
  const updateBcrypt = (v: boolean) => {
    setInternalBcryptApplied(v);
    onBcryptAppliedChange?.(v);
  };
  const updateLeastPriv = (v: boolean) => {
    setInternalLeastPrivApplied(v);
    onLeastPrivAppliedChange?.(v);
  };

  const [ubuntuTheme, setUbuntuTheme] = useState<"aubergine" | "slate">("aubergine");
  const [isMinimized, setIsMinimized] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Typewriter Queue Engine State
  const [typeQueue, setTypeQueue] = useState<string[]>([]);
  const [typeContext, setTypeContext] = useState<ShellContext | undefined>(undefined);
  const [typeActiveLabel, setTypeActiveLabel] = useState<string | null>(null);
  const [queueIdx, setQueueIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [typePhase, setTypePhase] = useState<
    "idle" | "typing" | "enter_pause" | "streaming_out" | "between_cmds" | "done"
  >("idle");
  const [typeSpeed, setTypeSpeed] = useState<"slow" | "normal" | "fast">("normal");
  const [isTypePaused, setIsTypePaused] = useState(false);
  const [streamOutLines, setStreamOutLines] = useState<string[]>([]);
  const [streamOutIdx, setStreamOutIdx] = useState(0);

  const viewportRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const lastExternalCmdIdRef = useRef<number>(0);
  const streamingEntryIdRef = useRef<number | null>(null);

  const makeInitialTabs = (): TerminalTab[] => {
    const mappedEntries: TerminalLineEntry[] = initialEntries.map((item, idx) => {
      const ctx = item.context ?? "host";
      const cwdVal = ctx === "container" ? "/var/www/html" : ctx === "mariadb" ? "dvwa" : "~";
      const p = getPromptParts(os, username, hostname, cleanContainer, ctx, cwdVal);
      return {
        id: idx + 1,
        promptPrefix: p.prefix,
        promptCwd: p.cwdLabel,
        promptSymbol: p.symbol,
        context: ctx,
        command: item.command,
        output: item.output,
        tone: item.tone ?? "normal",
      };
    });

    const hostTab: TerminalTab = {
      id: 1,
      title: os === "macos" ? `zsh — ${hostname}` : `1: ${username}@${hostname}: ~`,
      context: "host",
      cwd: "~",
      entries: mappedEntries,
      history: mappedEntries.map((e) => e.command).reverse(),
      historyIdx: -1,
      input: "",
    };

    const containerTab: TerminalTab = {
      id: 2,
      title:
        os === "macos"
          ? `docker exec — root@${cleanContainer}`
          : `2: root@${cleanContainer}: /var/www/html`,
      context: "container",
      cwd: "/var/www/html",
      entries: [],
      history: [],
      historyIdx: -1,
      input: "",
    };

    const base = [hostTab, containerTab];
    if (username === "quyet") {
      base.push({
        id: 3,
        title: "3: MariaDB [dvwa]>",
        context: "mariadb",
        cwd: "dvwa",
        entries: [],
        history: [],
        historyIdx: -1,
        input: "",
      });
    }
    return base;
  };

  const [tabs, setTabs] = useState<TerminalTab[]>(makeInitialTabs);
  const [activeTabId, setActiveTabId] = useState<number>(1);
  const activeTab = tabs.find((t) => t.id === activeTabId) ?? tabs[0];

  const autocompletePool = useMemo(
    () => [
      "help",
      "clear",
      "history",
      "whoami",
      "id",
      "hostname",
      "uname -a",
      "pwd",
      "ls -la",
      "ip a",
      "ss -tulpn",
      "ps aux",
      "exit",
      "docker --version",
      "docker ps",
      "docker ps -a",
      "docker images",
      "docker pull vulnerables/web-dvwa",
      "docker run -d --name dvwa -p 8080:80 vulnerables/web-dvwa",
      `docker start ${cleanContainer}`,
      `docker stop ${cleanContainer}`,
      `docker restart ${cleanContainer}`,
      "docker stats --no-stream",
      `docker top ${cleanContainer}`,
      `docker port ${cleanContainer}`,
      `docker logs --tail 20 ${cleanContainer}`,
      `docker inspect ${cleanContainer}`,
      `docker exec -it ${cleanContainer} bash`,
      `docker exec -it ${cleanContainer} mysql -u root dvwa`,
      "nmap -sV -p 8080 127.0.0.1",
      "curl -is http://127.0.0.1:8080/login.php | head -n 15",
      'curl -Is http://127.0.0.1:8080/login.php | grep -i "Server:"',
      'curl -Is http://127.0.0.1:8080/login.php | grep -iE "(Server:|Set-Cookie:|X-Content-Type|X-Frame)"',
      `curl -s -b "security=low; PHPSESSID=${cleanSess}" "http://127.0.0.1:8080/vulnerabilities/sqli/?id=1&Submit=Submit" | grep -o "First name: [^<]*"`,
      `curl -is -b "security=impossible; PHPSESSID=${cleanSess}" "http://127.0.0.1:8080/vulnerabilities/sqli/?id=1'&Submit=Submit&user_token=${cleanToken}"`,
      `sqlmap -u "http://127.0.0.1:8080/vulnerabilities/sqli/?id=1&Submit=Submit" --cookie="security=low; PHPSESSID=${cleanSess}" --dbs --batch`,
      `sqlmap -u "http://127.0.0.1:8080/vulnerabilities/sqli/?id=1&Submit=Submit" --cookie="security=low; PHPSESSID=${cleanSess}" -D dvwa --tables --batch`,
      `sqlmap -u "http://127.0.0.1:8080/vulnerabilities/sqli/?id=1&Submit=Submit" --cookie="security=low; PHPSESSID=${cleanSess}" -D dvwa -T users --dump --batch`,
      "cat /etc/apache2/conf-available/security.conf",
      "cat /var/www/html/vulnerabilities/sqli/source/low.php",
      "cat /var/www/html/vulnerabilities/sqli/source/impossible.php",
      "diff -u /var/www/html/vulnerabilities/sqli/source/low.php /var/www/html/vulnerabilities/sqli/source/impossible.php",
      "apache2ctl -M | grep security2",
      "tail -n 10 /var/log/apache2/access.log",
      "tail -n 10 /var/log/apache2/modsec_audit.log",
      "a2enconf security && service apache2 reload",
      "a2enmod headers && service apache2 reload",
      "SHOW DATABASES;",
      "SHOW TABLES;",
      "DESCRIBE users;",
      "SELECT user_id, user, password FROM users;",
      "SELECT USER();",
      "SHOW GRANTS FOR 'dvwa_svc'@'localhost';",
    ],
    [cleanContainer, cleanSess, cleanToken]
  );

  // Keep viewport pinned to bottom ONLY inside the internal scroll box (never page scroll)
  useEffect(() => {
    const el = viewportRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [activeTab.entries.length, activeTab.id, activeTab.input, streamOutIdx]);

  useEffect(() => {
    if (!isFullscreen) return;
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") setIsFullscreen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isFullscreen]);

  const executeSingleCommand = (
    rawCmd: string,
    tabContext: ShellContext,
    tabCwd: string,
    tabHistory: string[]
  ): {
    output: string;
    tone: "normal" | "ok" | "warn" | "error";
    nextContext: ShellContext;
    nextCwd: string;
    clearTab?: boolean;
  } => {
    const trimmed = rawCmd.trim();
    const lower = trimmed.toLowerCase();

    if (lower === "clear" || lower === "cls") {
      return { output: "", tone: "normal", nextContext: tabContext, nextCwd: tabCwd, clearTab: true };
    }

    // Subshell exit
    if ((lower === "exit" || lower === "quit" || lower === "\\q") && tabContext !== "host") {
      return {
        output: tabContext === "mariadb" ? "Bye" : "exit",
        tone: "normal",
        nextContext: "host",
        nextCwd: "~",
      };
    }

    // MariaDB Shell Mode OR inline SQL
    const isSqlQuery =
      tabContext === "mariadb" ||
      /^(show\s+(databases|tables|grants)|describe\s+|select\s+|update\s+|alter\s+|create\s+user|grant\s+)/i.test(
        trimmed
      );

    if (isSqlQuery && !lower.startsWith("docker ") && !lower.startsWith("curl ") && !lower.startsWith("sqlmap ")) {
      if (!isRunning) {
        return {
          output: `ERROR 2002 (HY000): Can't connect to local MySQL server through socket '/var/run/mysqld/mysqld.sock' (2) — Container ${cleanContainer} đang Stopped!`,
          tone: "error",
          nextContext: tabContext,
          nextCwd: tabCwd,
        };
      }
      if (lower.includes("show databases")) {
        return {
          output: `+--------------------+\n| Database           |\n+--------------------+\n| dvwa               |\n| information_schema |\n| mysql              |\n+--------------------+\n3 rows in set (0.00 sec)`,
          tone: "ok",
          nextContext: tabContext,
          nextCwd: tabCwd,
        };
      }
      if (lower.includes("show tables")) {
        return {
          output: `+----------------+\n| Tables_in_dvwa |\n+----------------+\n| guestbook      |\n| users          |\n+----------------+\n2 rows in set (0.00 sec)`,
          tone: "ok",
          nextContext: tabContext,
          nextCwd: tabCwd,
        };
      }
      if (lower.includes("describe users")) {
        return {
          output: `+---------------+--------------+------+-----+---------+-------+\n| Field         | Type         | Null | Key | Default | Extra |\n+---------------+--------------+------+-----+---------+-------+\n| user_id       | int(6)       | NO   | PRI | 0       |       |\n| first_name    | varchar(15)  | YES  |     | NULL    |       |\n| last_name     | varchar(15)  | YES  |     | NULL    |       |\n| user          | varchar(15)  | YES  |     | NULL    |       |\n| password      | varchar(255) | YES  |     | NULL    |       |\n+---------------+--------------+------+-----+---------+-------+`,
          tone: "normal",
          nextContext: tabContext,
          nextCwd: tabCwd,
        };
      }
      if (lower.includes("select user()")) {
        return {
          output: `+--------------------+\n| USER()             |\n+--------------------+\n| ${isLeastPriv ? "dvwa_svc@localhost" : "root@localhost    "} |\n+--------------------+\n1 row in set (0.00 sec)`,
          tone: isLeastPriv ? "ok" : "warn",
          nextContext: tabContext,
          nextCwd: tabCwd,
        };
      }
      if (lower.includes("show grants")) {
        if (!isLeastPriv) {
          return {
            output: `ERROR 1141 (42000): There is no such grant defined for user 'dvwa_svc' on host 'localhost'\n(Gõ: CREATE USER 'dvwa_svc'@'localhost' ...; GRANT SELECT, INSERT, UPDATE ON dvwa.users TO 'dvwa_svc'@'localhost';)`,
            tone: "error",
            nextContext: tabContext,
            nextCwd: tabCwd,
          };
        }
        return {
          output: `+--------------------------------------------------------------------------+\n| Grants for dvwa_svc@localhost                                            |\n+--------------------------------------------------------------------------+\n| GRANT USAGE ON *.* TO 'dvwa_svc'@'localhost'                             |\n| GRANT SELECT, INSERT, UPDATE ON \`dvwa\`.\`users\` TO 'dvwa_svc'@'localhost' |\n+--------------------------------------------------------------------------+\n2 rows in set (0.00 sec)`,
          tone: "ok",
          nextContext: tabContext,
          nextCwd: tabCwd,
        };
      }
      if (lower.includes("create user") || lower.includes("grant ")) {
        updateLeastPriv(true);
        return {
          output: `Query OK, 0 rows affected (0.01 sec)\n[✓] Đã khởi tạo tài khoản ứng dụng 'dvwa_svc'@'localhost' theo nguyên tắc Least Privilege (chỉ SELECT, INSERT, UPDATE trên dvwa.users).`,
          tone: "ok",
          nextContext: tabContext,
          nextCwd: tabCwd,
        };
      }
      if (lower.includes("alter table") || (lower.includes("update users") && lower.includes("password"))) {
        updateBcrypt(true);
        return {
          output: `Query OK, 5 rows affected (0.02 sec)\nRecords: 5  Duplicates: 0  Warnings: 0\n[✓] Đã mở rộng cột password lên VARCHAR(255) & băm toàn bộ 5 tài khoản bằng Bcrypt ($2y$12$...).`,
          tone: "ok",
          nextContext: tabContext,
          nextCwd: tabCwd,
        };
      }
      if (lower.includes("from users")) {
        const h1 = isBcrypt
          ? "$2y$12$K9p8Q3vT2xL7wR4mN6zA1eH8cB5vD0fG2jK4lM6nP8qR0sT2uV4wX"
          : "5f4dcc3b5aa765d61d8327deb882cf99                     ";
        const h5 = isBcrypt
          ? "$2y$12$zQ7mL1vN8pR3tX5wK2cF9uB6dG4hJ0kM2nP8qS5tV1yZ7aC3eI9oU"
          : "5f4dcc3b5aa765d61d8327deb882cf99                     ";
        return {
          output: `+---------+---------+--------------------------------------------------------------+\n| user_id | user    | password                                                     |\n+---------+---------+--------------------------------------------------------------+\n|       1 | admin   | ${h1} |\n|       2 | gordonb | ${isBcrypt ? "$2y$12$A8mK2qP9rS4tV6xZ1cE3gI5jL7nO0qU2wY4bD6fH8kM1nP3rT5vX" : "e99a18c428cb38d5f260853678922e03                            "} |\n|       3 | 1337    | ${isBcrypt ? "$2y$12$B9nL3rQ0sT5uW7yA2dF4hJ6kM8oP1rV3xZ5cE7gI9lN2oQ4sU6wY" : "8d3533d75ae2c3966d7e0d4fcc69216b                            "} |\n|       4 | pablo   | ${isBcrypt ? "$2y$12$C0oM4sR1tU6vX8zB3eG5iK7lN9pQ2sW4yA6dF8hJ0mO3pR5tV7xZ" : "0d107d09f5bbe40cade3de5c71e9e9b7                            "} |\n|       5 | smithy  | ${h5} |\n+---------+---------+--------------------------------------------------------------+\n5 rows in set (0.00 sec)`,
          tone: isBcrypt ? "ok" : "warn",
          nextContext: tabContext,
          nextCwd: tabCwd,
        };
      }
      if (tabContext === "mariadb") {
        return {
          output: `ERROR 1064 (42000): Lệnh SQL mô phỏng không khớp. Thử: SHOW DATABASES; | SHOW TABLES; | SELECT user_id, user, password FROM users; | SHOW GRANTS FOR 'dvwa_svc'@'localhost'; | exit`,
          tone: "error",
          nextContext: tabContext,
          nextCwd: tabCwd,
        };
      }
    }

    // Help
    if (lower === "help" || lower === "?") {
      return {
        tone: "normal",
        nextContext: tabContext,
        nextCwd: tabCwd,
        output: `Danh sách lệnh (${tabContext === "container" ? "Container Bash" : `${os.toUpperCase()} Shell`}):
  Docker CLI:
    docker ps [-a] | docker images | docker stats --no-stream | docker top ${cleanContainer}
    docker stop ${cleanContainer} | docker start ${cleanContainer} | docker restart ${cleanContainer}
    docker logs --tail 20 ${cleanContainer} | docker inspect ${cleanContainer}
    docker exec -it ${cleanContainer} bash
    docker exec -it ${cleanContainer} mysql
  Lệnh thực thi trên Lab:
    nmap -sV -p 8080 127.0.0.1
    curl -is http://127.0.0.1:8080/login.php | head -n 15
    curl -s -b "security=low; PHPSESSID=${cleanSess}" "http://127.0.0.1:8080/vulnerabilities/sqli/?id=1&Submit=Submit" | grep -o "First name: [^<]*"
    sqlmap -u "http://127.0.0.1:8080/vulnerabilities/sqli/?id=1&Submit=Submit" --cookie="..." --dbs|--tables|--dump
    a2enconf security && service apache2 reload
    a2enmod headers && service apache2 reload
    cat -n /var/www/html/vulnerabilities/sqli/source/{low,medium,high,impossible}.php
    diff -u low.php impossible.php | apache2ctl -M | grep security2
    tail -n 10 /var/log/apache2/{access.log,modsec_audit.log}
  Hệ thống: ls -la | cd <dir> | pwd | whoami | ip a | ss -tulpn | ps aux | history | clear | exit`,
      };
    }

    // Standard Unix / Container OS commands
    if (lower === "whoami") {
      return {
        output: tabContext === "container" ? "root" : username,
        tone: "normal",
        nextContext: tabContext,
        nextCwd: tabCwd,
      };
    }
    if (lower === "id") {
      return {
        output:
          tabContext === "container"
            ? "uid=0(root) gid=0(root) groups=0(root)"
            : os === "macos"
            ? `uid=501(${username}) gid=20(staff) groups=20(staff),12(everyone),80(admin)`
            : `uid=1000(${username}) gid=1000(${username}) groups=1000(${username}),27(sudo),999(docker)`,
        tone: "normal",
        nextContext: tabContext,
        nextCwd: tabCwd,
      };
    }
    if (lower === "hostname") {
      return {
        output: tabContext === "container" ? shortContainerId : hostname,
        tone: "normal",
        nextContext: tabContext,
        nextCwd: tabCwd,
      };
    }
    if (lower === "uname" || lower === "uname -a") {
      return {
        output:
          tabContext === "container"
            ? `Linux ${shortContainerId} 6.6.32-linuxkit #1 SMP x86_64 GNU/Linux`
            : os === "macos"
            ? `Darwin ${hostname}.local 24.1.0 Darwin Kernel Version 24.1.0: arm64`
            : `Linux ${hostname} 6.8.0-45-generic #45-Ubuntu SMP PREEMPT_DYNAMIC x86_64 GNU/Linux`,
        tone: "normal",
        nextContext: tabContext,
        nextCwd: tabCwd,
      };
    }
    if (lower === "pwd") {
      return {
        output: tabContext === "container" ? tabCwd : os === "macos" ? `/Users/${username}` : `/home/${username}`,
        tone: "normal",
        nextContext: tabContext,
        nextCwd: tabCwd,
      };
    }
    if (lower === "history") {
      const list = [...tabHistory].reverse().map((h, i) => `  ${String(i + 1).padStart(3, " ")}  ${h}`).join("\n");
      return {
        output: list || "(Chưa có lịch sử lệnh)",
        tone: "normal",
        nextContext: tabContext,
        nextCwd: tabCwd,
      };
    }
    if (lower.startsWith("cd ")) {
      const arg = trimmed.slice(3).trim();
      const next = tabContext === "container" ? resolveContainerPath(tabCwd, arg) : "~";
      return { output: "", tone: "normal", nextContext: tabContext, nextCwd: next };
    }
    if (lower === "ls" || lower === "ls -la" || lower === "ls -l") {
      if (tabContext === "container") {
        if (tabCwd.includes("sqli/source")) {
          return {
            output: `total 16\n-rw-r--r-- 1 root root  680 Nov 04 02:00 high.php\n-rw-r--r-- 1 root root  942 Nov 04 02:00 impossible.php\n-rw-r--r-- 1 root root  612 Nov 04 02:00 low.php\n-rw-r--r-- 1 root root  650 Nov 04 02:00 medium.php`,
            tone: "normal",
            nextContext: tabContext,
            nextCwd: tabCwd,
          };
        }
        if (tabCwd.includes("/etc/apache2")) {
          return {
            output: `total 12\n-rw-r--r-- 1 root root 1840 Nov 04 02:10 security.conf\n-rw-r--r-- 1 root root  640 Nov 04 01:00 charset.conf\n-rw-r--r-- 1 root root 1420 Nov 04 01:00 modsecurity.conf`,
            tone: "normal",
            nextContext: tabContext,
            nextCwd: tabCwd,
          };
        }
        return {
          output: `total 68\ndrwxr-xr-x 1 www-data www-data  4096 Nov 04 02:00 .\ndrwxr-xr-x 1 root     root      4096 Nov 04 01:00 ..\n-rw-r--r-- 1 www-data www-data  2140 Nov 04 02:00 config/config.inc.php\n-rw-r--r-- 1 www-data www-data  4620 Nov 04 02:00 index.php\n-rw-r--r-- 1 www-data www-data  3910 Nov 04 02:00 login.php\ndrwxr-xr-x 1 www-data www-data  4096 Nov 04 02:00 vulnerabilities/`,
          tone: "normal",
          nextContext: tabContext,
          nextCwd: tabCwd,
        };
      }
      return {
        output:
          os === "macos"
            ? `total 24\ndrwxr-xr-x@ 5 ${username} staff  160 Nov 18 07:40 .\n-rw-r--r--  1 ${username} staff 1204 Nov 18 07:10 poc1_recon.txt\n-rwxr-xr-x  1 ${username} staff 2410 Nov 18 07:15 setup_dvwa.sh`
            : `total 28\ndrwxr-x--- 4 ${username} ${username} 4096 Nov 18 07:40 .\n-rwxr-xr-x 1 ${username} ${username} 2410 Nov 18 07:10 setup_dvwa_ubuntu.sh\ndrwxr-xr-x 2 ${username} ${username} 4096 Nov 18 07:20 burp_logs`,
        tone: "normal",
        nextContext: tabContext,
        nextCwd: tabCwd,
      };
    }
    if (lower.startsWith("ip a") || lower.startsWith("ifconfig")) {
      return {
        output:
          tabContext === "container"
            ? `1: lo: <LOOPBACK,UP> mtu 65536 inet 127.0.0.1/8\n7: eth0@if8: <BROADCAST,MULTICAST,UP> mtu 1500 inet 172.17.0.2/16 brd 172.17.255.255 scope global eth0`
            : `1: lo: <LOOPBACK,UP> inet 127.0.0.1/8 (localtest.me -> 127.0.0.1)\n2: docker0: <BROADCAST,MULTICAST,UP> inet 172.17.0.1/16 scope global docker0`,
        tone: "normal",
        nextContext: tabContext,
        nextCwd: tabCwd,
      };
    }
    if (lower.startsWith("ss -") || lower.startsWith("netstat")) {
      return {
        output: isRunning
          ? `Netid  State   Recv-Q  Send-Q  Local Address:Port   Peer Address:Port  Process\ntcp    LISTEN  0       128     0.0.0.0:8080         0.0.0.0:*          docker-proxy -> 172.17.0.2:80\ntcp    LISTEN  0       128     127.0.0.1:8081       0.0.0.0:*          java (Burp Suite Proxy)`
          : `Netid  State   Recv-Q  Send-Q  Local Address:Port   Peer Address:Port  Process\ntcp    LISTEN  0       128     127.0.0.1:8081       0.0.0.0:*          java (Burp Suite Proxy)\n(Cổng 8080 đang trống — Container ${cleanContainer} đã dừng)`,
        tone: isRunning ? "ok" : "warn",
        nextContext: tabContext,
        nextCwd: tabCwd,
      };
    }
    if (lower.startsWith("ping ")) {
      return {
        output: `PING 127.0.0.1 (127.0.0.1): 56 data bytes\n64 bytes from 127.0.0.1: icmp_seq=0 ttl=64 time=0.048 ms\n64 bytes from 127.0.0.1: icmp_seq=1 ttl=64 time=0.052 ms\n--- 127.0.0.1 ping statistics ---\n2 packets transmitted, 2 received, 0.0% packet loss`,
        tone: "ok",
        nextContext: tabContext,
        nextCwd: tabCwd,
      };
    }
    if (lower === "ps aux" || lower === "ps") {
      return {
        output: isRunning
          ? `USER       PID %CPU %MEM    VSZ   RSS TTY      STAT START   TIME COMMAND\nroot         1  0.0  0.0   4512  1620 ?        Ss   02:00   0:00 /bin/sh /main.sh\nmysql       47  0.3  1.4 612480 56840 ?       Sl   02:00   0:04 /usr/sbin/mysqld\nroot        89  0.1  0.3 245120 11840 ?       Ss   02:00   0:01 /usr/sbin/apache2 -k start\nwww-data    92  0.0  0.2 245640  9420 ?       S    02:00   0:00 /usr/sbin/apache2 -k start`
          : `PID TTY          TIME CMD\n(Container ${cleanContainer} đang ở trạng thái Exited — chỉ host shell đang chạy)`,
        tone: "normal",
        nextContext: tabContext,
        nextCwd: tabCwd,
      };
    }

    // Docker CLI commands
    if (lower === "docker --version" || lower === "docker version") {
      return {
        output: "Docker version 27.3.1, build ce12230",
        tone: "ok",
        nextContext: tabContext,
        nextCwd: tabCwd,
      };
    }
    if (lower === "docker ps" || lower === "docker container ls") {
      if (!isRunning) {
        return {
          output: "CONTAINER ID   IMAGE     COMMAND   CREATED   STATUS    PORTS     NAMES\n(Trống — Container đang dừng. Gõ 'docker ps -a' để xem hoặc 'docker start " + cleanContainer + "')",
          tone: "warn",
          nextContext: tabContext,
          nextCwd: tabCwd,
        };
      }
      return {
        output: `CONTAINER ID   IMAGE                  COMMAND      CREATED       STATUS        PORTS                    NAMES\n${shortContainerId.padEnd(14, " ")} vulnerables/web-dvwa   "/main.sh"   2 hours ago   Up 2 hours    0.0.0.0:8080->80/tcp     ${containerDisplayName}`,
        tone: "ok",
        nextContext: tabContext,
        nextCwd: tabCwd,
      };
    }
    if (lower === "docker ps -a" || lower === "docker container ls -a") {
      return {
        output: `CONTAINER ID   IMAGE                  COMMAND      CREATED       STATUS                    PORTS                    NAMES\n${shortContainerId.padEnd(14, " ")} vulnerables/web-dvwa   "/main.sh"   2 hours ago   ${isRunning ? "Up 2 hours               " : "Exited (0) 4 seconds ago "} ${isRunning ? "0.0.0.0:8080->80/tcp    " : "                        "} ${containerDisplayName}`,
        tone: isRunning ? "ok" : "warn",
        nextContext: tabContext,
        nextCwd: tabCwd,
      };
    }
    if (lower === "docker images" || lower === "docker image ls") {
      return {
        output: `REPOSITORY             TAG       IMAGE ID       CREATED       SIZE\nvulnerables/web-dvwa   latest    715061c61096   3 years ago   712MB`,
        tone: "normal",
        nextContext: tabContext,
        nextCwd: tabCwd,
      };
    }
    if (lower.startsWith("docker pull")) {
      return {
        output: `Using default tag: latest\nlatest: Pulling from vulnerables/web-dvwa\nDigest: sha256:948a3a7b249f08be20...f41e\nStatus: Image is up to date for vulnerables/web-dvwa:latest\ndocker.io/vulnerables/web-dvwa:latest`,
        tone: "ok",
        nextContext: tabContext,
        nextCwd: tabCwd,
      };
    }
    if (lower.startsWith("docker run")) {
      updateRunning(true);
      return {
        output: `${shortContainerId}c94f82e109b4a7d1e8a5c3f0218e94b7d\n[✓] Container '${containerDisplayName}' (${shortContainerId}) đang lắng nghe tại http://127.0.0.1:8080 -> 80/tcp`,
        tone: "ok",
        nextContext: tabContext,
        nextCwd: tabCwd,
      };
    }
    if (lower.startsWith("docker stop")) {
      updateRunning(false);
      return {
        output: `${cleanContainer}\n[!] Container ${containerDisplayName} (${shortContainerId}) đã dừng (Exited 0). Cổng 127.0.0.1:8080 ngừng phản hồi.`,
        tone: "warn",
        nextContext: tabContext,
        nextCwd: tabCwd,
      };
    }
    if (lower.startsWith("docker start")) {
      updateRunning(true);
      return {
        output: `${cleanContainer}\n[✓] Container ${containerDisplayName} (${shortContainerId}) đã khởi động lại -> Up · 0.0.0.0:8080->80/tcp`,
        tone: "ok",
        nextContext: tabContext,
        nextCwd: tabCwd,
      };
    }
    if (lower.startsWith("docker restart")) {
      updateRunning(true);
      return {
        output: `${cleanContainer}\n[✓] Đã khởi động lại mysqld & apache2 bên trong ${containerDisplayName}.`,
        tone: "ok",
        nextContext: tabContext,
        nextCwd: tabCwd,
      };
    }
    if (lower.startsWith("docker stats")) {
      return {
        output: isRunning
          ? `CONTAINER ID   NAME            CPU %     MEM USAGE / LIMIT     MEM %     NET I/O           BLOCK I/O         PIDS\n${shortContainerId.padEnd(14, " ")} ${containerDisplayName.padEnd(15, " ")} 0.42%     68.4MiB / 4GiB        1.67%     142kB / 198kB     12.4MB / 4.2MB    9`
          : `CONTAINER ID   NAME            CPU %     MEM USAGE / LIMIT   MEM %     PIDS\n${shortContainerId.padEnd(14, " ")} ${containerDisplayName.padEnd(15, " ")} 0.00%     0B / 0B             0.00%     0`,
        tone: "normal",
        nextContext: tabContext,
        nextCwd: tabCwd,
      };
    }
    if (lower.startsWith("docker top")) {
      return {
        output: isRunning
          ? `UID        PID    PPID   CMD\nroot       1      0      /bin/sh /main.sh\nmysql      47     1      /usr/sbin/mysqld\nroot       89     1      /usr/sbin/apache2 -DFOREGROUND\nwww-data   92     89     /usr/sbin/apache2 -DFOREGROUND`
          : `Error response from daemon: Container ${cleanContainer} is not running`,
        tone: isRunning ? "normal" : "error",
        nextContext: tabContext,
        nextCwd: tabCwd,
      };
    }
    if (lower.startsWith("docker port")) {
      return {
        output: isRunning ? "80/tcp -> 0.0.0.0:8080" : "(Không có cổng chuyển tiếp khi container đang dừng)",
        tone: isRunning ? "ok" : "warn",
        nextContext: tabContext,
        nextCwd: tabCwd,
      };
    }
    if (lower.startsWith("docker logs")) {
      const recentAccess = (externalAccessLogs ?? []).slice(0, 3).map(
        (l) => `${l.ip} - - [${l.timestamp}] "${l.method} ${l.uri} HTTP/1.1" ${l.status} ${l.bytes} "${l.ua}"`
      );
      return {
        output: [
          `[+] Starting MySQL database server: mysqld... done`,
          `[+] Starting Apache httpd web server: apache2... [ServerTokens: ${isApachePatched ? "Prod" : "OS (Debian)"}]`,
          ...recentAccess,
        ].join("\n"),
        tone: "normal",
        nextContext: tabContext,
        nextCwd: tabCwd,
      };
    }
    if (lower.startsWith("docker inspect")) {
      return {
        output: JSON.stringify(
          [
            {
              Id: `${shortContainerId}c94f82e109b4a7d1e8a5c3f0218e94b7d`,
              Name: `/${containerDisplayName}`,
              State: {
                Status: isRunning ? "running" : "exited",
                Running: isRunning,
                Pid: isRunning ? 89 : 0,
              },
              Config: {
                Image: "vulnerables/web-dvwa",
                ExposedPorts: { "80/tcp": {} },
              },
              NetworkSettings: {
                Bridge: "docker0",
                Gateway: "172.17.0.1",
                IPAddress: isRunning ? "172.17.0.2" : "",
                Ports: isRunning ? { "80/tcp": [{ HostIp: "0.0.0.0", HostPort: "8080" }] } : {},
              },
            },
          ],
          null,
          2
        ),
        tone: "normal",
        nextContext: tabContext,
        nextCwd: tabCwd,
      };
    }

    // docker exec interactive or inline
    if (lower.startsWith("docker exec")) {
      if (!isRunning) {
        return {
          output: `Error response from daemon: container ${shortContainerId} is not running`,
          tone: "error",
          nextContext: tabContext,
          nextCwd: tabCwd,
        };
      }
      if (lower.includes("mysql") && !lower.includes(" -e ")) {
        return {
          output: `Welcome to the MariaDB monitor. Commands end with ; or \\g.\nServer version: 10.1.26-MariaDB Debian 9.1\nType 'SHOW TABLES;' or 'SELECT user_id, user, password FROM users;'. Type 'exit' to return.`,
          tone: "ok",
          nextContext: "mariadb",
          nextCwd: "dvwa",
        };
      }
      if (/docker\s+exec\s+(-it\s+|-i\s+|-t\s+)?\S+\s+(bash|sh)$/i.test(trimmed)) {
        return {
          output: `[✓] Đã mở phiên shell root bên trong container '${containerDisplayName}' (${shortContainerId}). Gõ 'exit' để thoát ra host.`,
          tone: "ok",
          nextContext: "container",
          nextCwd: "/var/www/html",
        };
      }
      if (lower.includes("a2enmod headers") || lower.includes("header edit set-cookie")) {
        updateCookie(true);
        return {
          output: `Enabling module headers.\nReloading Apache httpd web server: apache2.\n[✓] Đã kích hoạt Header edit Set-Cookie HttpOnly; SameSite=Strict & X-Content-Type-Options: nosniff, X-Frame-Options: SAMEORIGIN.`,
          tone: "ok",
          nextContext: tabContext,
          nextCwd: tabCwd,
        };
      }
      if (lower.includes("a2enconf security") || lower.includes("servertokens prod")) {
        updateApache(true);
        return {
          output: `Enabling conf security.\nReloading Apache httpd web server: apache2.\n[✓] Đã áp dụng ServerTokens Prod & ServerSignature Off trong ${containerDisplayName}.`,
          tone: "ok",
          nextContext: tabContext,
          nextCwd: tabCwd,
        };
      }
      if (lower.includes("php -r")) {
        if (lower.includes("argon2id")) {
          return {
            output: "Use BCRYPT",
            tone: "ok",
            nextContext: tabContext,
            nextCwd: tabCwd,
          };
        }
        return {
          output: "$2y$12$K9p8Q3vT2xL7wR4mN6zA1eH8cB5vD0fG2jK4lM6nP8qR0sT2uV4wX",
          tone: "ok",
          nextContext: tabContext,
          nextCwd: tabCwd,
        };
      }
      if (lower.includes("mysql") && lower.includes(" -e ")) {
        if (lower.includes("create user") || lower.includes("grant ")) {
          updateLeastPriv(true);
          return {
            output: `+--------------------------------------------------------------------------------+
| Grants for dvwa_svc@localhost                                                  |
+--------------------------------------------------------------------------------+
| GRANT USAGE ON *.* TO 'dvwa_svc'@'localhost' IDENTIFIED BY PASSWORD ...        |
| GRANT SELECT, INSERT, UPDATE ON \`dvwa\`.\`users\` TO 'dvwa_svc'@'localhost'       |
+--------------------------------------------------------------------------------+`,
            tone: "ok",
            nextContext: tabContext,
            nextCwd: tabCwd,
          };
        }
        if (lower.includes("update users")) {
          updateBcrypt(true);
          return {
            output: `+---------+-------+--------------------------------------------------------------+
| user_id | user  | password                                                     |
+---------+-------+--------------------------------------------------------------+
|       1 | admin | $2y$12$K9p8Q3vT2xL7wR4mN6zA1eH8cB5vD0fG2jK4lM6nP8qR0sT2uV4wX |
+---------+-------+--------------------------------------------------------------+`,
            tone: "ok",
            nextContext: tabContext,
            nextCwd: tabCwd,
          };
        }
        const adminHash = isBcrypt
          ? "$2y$12$K9p8Q3vT2xL7wR4mN6zA1eH8cB5vD0fG2jK4lM6nP8qR0sT2uV4wX"
          : "5f4dcc3b5aa765d61d8327deb882cf99";
        return {
          output: `+---------+---------+----------------------------------+
| user_id | user    | password                         |
+---------+---------+----------------------------------+
|       1 | admin   | ${adminHash} |
|       2 | gordonb | e99a18c428cb38d5f260853678922e03 |
|       3 | 1337    | 8d3533d75ae2c3966d7e0d4fcc69216b |
|       4 | pablo   | 0d107d09f5bbe40cade3de5c71e9e9b7 |
|       5 | smithy  | ${adminHash} |
+---------+---------+----------------------------------+`,
          tone: isBcrypt ? "ok" : "warn",
          nextContext: tabContext,
          nextCwd: tabCwd,
        };
      }
      if (lower.includes("cat ")) {
        const matchedPhp = PHP_LEVEL_SOURCES.find((p) => lower.includes(`${p.level}.php`));
        if (matchedPhp) {
          return {
            output: `// ${matchedPhp.title}\n${matchedPhp.code}`,
            tone: matchedPhp.severity === "safe" ? "ok" : "warn",
            nextContext: tabContext,
            nextCwd: tabCwd,
          };
        }
      }
      if (lower.includes("access.log")) {
        const lines = (externalAccessLogs ?? []).slice(0, 6).map(
          (l) => `${l.ip} - - [${l.timestamp}] "${l.method} ${l.uri} HTTP/1.1" ${l.status} ${l.bytes} "-" "${l.ua}"`
        );
        return {
          output: lines.length > 0 ? lines.join("\n") : "(Không có dòng log phù hợp)",
          tone: "warn",
          nextContext: tabContext,
          nextCwd: tabCwd,
        };
      }
      if (lower.includes("modsec_audit.log")) {
        const lines = (externalWafLogs ?? []).slice(0, 6).map(
          (w) => `[${w.time}] [id "100001"] [${w.blocked ? "403 DENIED" : "200 ALLOWED"}] ARGS:id="${w.payload}" match="${w.matchedRuleToken}"`
        );
        return {
          output: lines.length > 0 ? lines.join("\n") : "(Chưa có sự kiện ModSecurity mới)",
          tone: "normal",
          nextContext: tabContext,
          nextCwd: tabCwd,
        };
      }
      if (lower.includes("apache2ctl") || lower.includes("security2")) {
        return {
          output: `Loaded Modules:\n core_module (static)\n headers_module (${isCookiePatched ? "shared" : "disabled"})\n php7_module (shared)\n security2_module (shared)  <-- ModSecurity v2.9 CRS Active`,
          tone: "ok",
          nextContext: tabContext,
          nextCwd: tabCwd,
        };
      }
      return {
        output: `[docker exec -> ${shortContainerId}] Thực thi hoàn tất.`,
        tone: "ok",
        nextContext: tabContext,
        nextCwd: tabCwd,
      };
    }

    // Container Apache modules & config commands
    if (lower.includes("a2enconf security") || lower.includes("servertokens prod")) {
      if (!isRunning) {
        return {
          output: `Lỗi: Container ${cleanContainer} đang Stopped!`,
          tone: "error",
          nextContext: tabContext,
          nextCwd: tabCwd,
        };
      }
      updateApache(true);
      return {
        output: `Enabling conf security.\nReloading Apache httpd web server: apache2.\n[✓] Đã cấu hình ServerTokens Prod & ServerSignature Off trong /etc/apache2/conf-available/security.conf`,
        tone: "ok",
        nextContext: tabContext,
        nextCwd: tabCwd,
      };
    }

    if (lower.includes("a2enmod headers") || lower.includes("header edit set-cookie")) {
      if (!isRunning) {
        return {
          output: `Lỗi: Container ${cleanContainer} đang Stopped!`,
          tone: "error",
          nextContext: tabContext,
          nextCwd: tabCwd,
        };
      }
      updateCookie(true);
      return {
        output: `Enabling module headers.\nReloading Apache httpd web server: apache2.\n[✓] Đã gắn HttpOnly; SameSite=Strict cho Set-Cookie & bật X-Content-Type-Options: nosniff, X-Frame-Options: SAMEORIGIN`,
        tone: "ok",
        nextContext: tabContext,
        nextCwd: tabCwd,
      };
    }

    if (lower.includes("apache2ctl -m") || lower.includes("security2")) {
      return {
        output: `Loaded Modules:\n core_module (static)\n headers_module (${isCookiePatched ? "shared" : "disabled"})\n php7_module (shared)\n security2_module (shared)  <-- ModSecurity v2.9 CRS Active`,
        tone: "ok",
        nextContext: tabContext,
        nextCwd: tabCwd,
      };
    }

    if (lower.startsWith("cat ")) {
      const target = trimmed.slice(4).trim();
      if (target.includes("security.conf")) {
        return {
          output: `# /etc/apache2/conf-available/security.conf\nServerTokens ${isApachePatched ? "Prod" : "OS"}\nServerSignature ${isApachePatched ? "Off" : "On"}\n${
            isCookiePatched
              ? `Header edit Set-Cookie ^(.*)$ $1;HttpOnly;SameSite=Strict\nHeader always set X-Content-Type-Options "nosniff"\nHeader always set X-Frame-Options "SAMEORIGIN"`
              : `# (Chưa cấu hình Header edit Set-Cookie HttpOnly/SameSite)`
          }`,
          tone: isApachePatched ? "ok" : "warn",
          nextContext: tabContext,
          nextCwd: tabCwd,
        };
      }
      const matchedPhp = PHP_LEVEL_SOURCES.find((p) => target.includes(`${p.level}.php`));
      if (matchedPhp) {
        return {
          output: `<?php\n// ${matchedPhp.title}\n${matchedPhp.code}\n?>`,
          tone: matchedPhp.severity === "safe" ? "ok" : "warn",
          nextContext: tabContext,
          nextCwd: tabCwd,
        };
      }
      if (target.includes("access.log")) {
        const lines = (externalAccessLogs ?? []).slice(0, 6).map(
          (l) => `${l.ip} - - [${l.timestamp}] "${l.method} ${l.uri} HTTP/1.1" ${l.status} ${l.bytes} "-" "${l.ua}"`
        );
        return {
          output: lines.join("\n") || "(access.log rỗng)",
          tone: "normal",
          nextContext: tabContext,
          nextCwd: tabCwd,
        };
      }
      if (target.includes("modsec_audit.log")) {
        const lines = (externalWafLogs ?? []).slice(0, 6).map(
          (w) => `[${w.time}] [id "100001"] [${w.blocked ? "403 BLOCKED" : "200 PASSED"}] id="${w.payload}" matched="${w.matchedRuleToken}"`
        );
        return {
          output: lines.join("\n") || "(modsec_audit.log rỗng)",
          tone: "normal",
          nextContext: tabContext,
          nextCwd: tabCwd,
        };
      }
      return {
        output: `cat: ${target}: Không tìm thấy tệp mẫu trong lab (thử security.conf, low.php, impossible.php, access.log, modsec_audit.log)`,
        tone: "error",
        nextContext: tabContext,
        nextCwd: tabCwd,
      };
    }

    if (lower.startsWith("diff ")) {
      return {
        output: renderUnifiedPhpDiff(),
        tone: "ok",
        nextContext: tabContext,
        nextCwd: tabCwd,
      };
    }

    if (lower.startsWith("tail ") || lower.startsWith("grep ")) {
      if (lower.includes("modsec_audit")) {
        const lines = (externalWafLogs ?? []).slice(0, 6).map(
          (w) => `[${w.time}] [id "100001"] [${w.blocked ? "403 BLOCKED" : "200 PASSED"}] id="${w.payload}" match="${w.matchedRuleToken}"`
        );
        return {
          output: lines.join("\n") || "(Không có bản ghi modsec_audit.log)",
          tone: "normal",
          nextContext: tabContext,
          nextCwd: tabCwd,
        };
      }
      const lines = (externalAccessLogs ?? []).slice(0, 8).map(
        (l) => `${l.ip} - - [${l.timestamp}] "${l.method} ${l.uri} HTTP/1.1" ${l.status} ${l.bytes} "-" "${l.ua}"`
      );
      return {
        output: lines.join("\n") || "(Không có bản ghi access.log khớp bộ lọc)",
        tone: "warn",
        nextContext: tabContext,
        nextCwd: tabCwd,
      };
    }

    // Network reconnaissance & exploitation commands requiring running DVWA (:8080)
    if (lower.startsWith("nmap")) {
      if (!isRunning) {
        return {
          output: `Starting Nmap 7.95 ( https://nmap.org )\nNmap scan report for localhost (127.0.0.1)\nPORT     STATE  SERVICE\n8080/tcp closed http-proxy\n\n[!] Container DVWA đang dừng nên cổng 8080 không phản hồi.`,
          tone: "error",
          nextContext: tabContext,
          nextCwd: tabCwd,
        };
      }
      return {
        output: `Starting Nmap 7.95 ( https://nmap.org )\nNmap scan report for localhost (127.0.0.1)\nHost is up (0.00021s latency).\n\nPORT     STATE SERVICE VERSION\n8080/tcp open  http    ${isApachePatched ? "Apache httpd" : "Apache httpd 2.4.25 ((Debian))"}\n\nService detection performed. 1 service recognized.`,
        tone: isApachePatched ? "ok" : "warn",
        nextContext: tabContext,
        nextCwd: tabCwd,
      };
    }

    if (lower.startsWith("curl")) {
      if (!isRunning) {
        return {
          output: `curl: (7) Failed to connect to 127.0.0.1 port 8080 after 0 ms: Connection refused\n(Khởi động container bằng 'docker start ${cleanContainer}' hoặc nút Start trên Docker Desktop)`,
          tone: "error",
          nextContext: tabContext,
          nextCwd: tabCwd,
        };
      }
      const serverHdr = isApachePatched ? "Server: Apache" : "Server: Apache/2.4.25 (Debian)";
      if (lower.includes("vulnerabilities/sqli")) {
        const idMatch = trimmed.match(/id=([^&"\s]+)/);
        const decodedId = idMatch ? decodeURIComponent(idMatch[1].replace(/\+/g, " ")) : "1";
        onCurlLogged?.(decodedId, "curl/8.5.0");
        onWafTested?.(decodedId);

        const isUnion = /union\s+select/i.test(decodedId);
        const isOr = /'\s*or\s*'1'='1|or\s+1=1/i.test(decodedId);
        const isErr = decodedId.includes("'") && !isUnion && !isOr;
        const hasSqlMeta = /('|--|#|\/\*|union|select|or\s+\d+=\d+)/i.test(decodedId);

        if (username === "khanh" && hasSqlMeta) {
          return {
            output: `HTTP/1.1 403 Forbidden\nServer: Apache\nModSecurity: Access denied with code 403 (phase 2). Matched "SecRule 100001" on ARGS:id="${decodedId}"`,
            tone: "error",
            nextContext: tabContext,
            nextCwd: tabCwd,
          };
        }

        if (lower.includes("grep")) {
          if (isErr) {
            return {
              output: `(grep không khớp — máy chủ trả về lỗi MariaDB SQL syntax gần '${decodedId}')`,
              tone: "error",
              nextContext: tabContext,
              nextCwd: tabCwd,
            };
          }
          if (isUnion || isOr) {
            return {
              output: `First name: admin\nFirst name: Gordon\nFirst name: 1337\nFirst name: Pablo\nFirst name: Bob`,
              tone: "warn",
              nextContext: tabContext,
              nextCwd: tabCwd,
            };
          }
          return {
            output: `First name: admin`,
            tone: "ok",
            nextContext: tabContext,
            nextCwd: tabCwd,
          };
        }

        return {
          output: `HTTP/1.1 200 OK\n${serverHdr}\nContent-Type: text/html;charset=utf-8\n\n<pre>ID: ${decodedId}\nFirst name: admin<br />Surname: ${
            isUnion
              ? isBcrypt
                ? "$2y$12$K9p8Q3vT2xL7..."
                : "5f4dcc3b5aa765d61d8327deb882cf99"
              : isErr
              ? "SQL syntax error near '''"
              : "admin"
          }</pre>`,
          tone: isErr ? "error" : isUnion || isOr ? "warn" : "ok",
          nextContext: tabContext,
          nextCwd: tabCwd,
        };
      }

      if (lower.includes("grep") && lower.includes("server:") && !lower.includes("set-cookie")) {
        return {
          output: serverHdr,
          tone: isApachePatched ? "ok" : "warn",
          nextContext: tabContext,
          nextCwd: tabCwd,
        };
      }

      const secCookie1 = isCookiePatched
        ? `Set-Cookie: PHPSESSID=${cleanSess}; path=/; HttpOnly; SameSite=Strict`
        : `Set-Cookie: PHPSESSID=${cleanSess}; path=/`;
      const secCookie2 = isCookiePatched
        ? "Set-Cookie: security=low; HttpOnly; SameSite=Strict"
        : "Set-Cookie: security=low";
      const extraHdrs = isCookiePatched
        ? "\nX-Content-Type-Options: nosniff\nX-Frame-Options: SAMEORIGIN"
        : "";

      if (lower.includes("grep") && lower.includes("set-cookie")) {
        return {
          output: `${serverHdr}\n${secCookie1}\n${secCookie2}${extraHdrs}`,
          tone: isApachePatched && isCookiePatched ? "ok" : "warn",
          nextContext: tabContext,
          nextCwd: tabCwd,
        };
      }

      return {
        output: `HTTP/1.1 200 OK\nDate: Wed, 04 Nov 2026 02:09:19 GMT\n${serverHdr}\n${secCookie1}\nExpires: Tue, 23 Jun 2009 12:00:00 GMT\nCache-Control: no-cache, must-revalidate\nPragma: no-cache\n${secCookie2}${extraHdrs}\nContent-Type: text/html;charset=utf-8`,
        tone: isApachePatched && isCookiePatched ? "ok" : "warn",
        nextContext: tabContext,
        nextCwd: tabCwd,
      };
    }

    if (lower.startsWith("sqlmap")) {
      if (!isRunning) {
        return {
          output: `[CRITICAL] connection timed out / refused to 127.0.0.1:8080 — Container ${cleanContainer} đang Stopped!`,
          tone: "error",
          nextContext: tabContext,
          nextCwd: tabCwd,
        };
      }
      if (lower.includes("--dump")) {
        const dumpRows = isBcrypt
          ? `| 1       | admin   | $2y$12$K9p8Q3vT2xL7wR4mN6zA1eH8cB5vD0fG2jK4lM6nP8qR0sT2uV4wX (Khong the crack) |\n| 2       | gordonb | $2y$12$A8mK2qP9rS4tV6xZ1cE3gI5jL7nO0qU2wY4bD6fH8kM1nP3rT5vX (Khong the crack) |\n| 5       | smithy  | $2y$12$zQ7mL1vN8pR3tX5wK2cF9uB6dG4hJ0kM2nP8qS5tV1yZ7aC3eI9oU (Khong the crack) |`
          : `| 1       | admin   | 5f4dcc3b5aa765d61d8327deb882cf99 (password) |\n| 2       | gordonb | e99a18c428cb38d5f260853678922e03 (abc123)   |\n| 3       | 1337    | 8d3533d75ae2c3966d7e0d4fcc69216b (charley)  |\n| 4       | pablo   | 0d107d09f5bbe40cade3de5c71e9e9b7 (letmein)  |\n| 5       | smithy  | 5f4dcc3b5aa765d61d8327deb882cf99 (password) |`;
        return {
          output: `[INFO] fetching entries for table 'users' in database 'dvwa'\n[INFO] recognized possible password hashes in column 'password'\n[100%] [================================] parsed\nDatabase: dvwa | Table: users\n+---------+---------+-------------------------------------------------------------------------+\n| user_id | user    | password                                                                |\n+---------+---------+-------------------------------------------------------------------------+\n${dumpRows}\n+---------+---------+-------------------------------------------------------------------------+`,
          tone: isBcrypt ? "ok" : "warn",
          nextContext: tabContext,
          nextCwd: tabCwd,
        };
      }
      if (lower.includes("--tables")) {
        return {
          output: `[INFO] fetching tables for database: 'dvwa'\nDatabase: dvwa\n[2 tables]\n+-----------+\n| guestbook |\n| users     |\n+-----------+`,
          tone: "warn",
          nextContext: tabContext,
          nextCwd: tabCwd,
        };
      }
      return {
        output: `[INFO] testing connection to http://127.0.0.1:8080/vulnerabilities/sqli/\n[INFO] GET parameter 'id' is vulnerable (MySQL / MariaDB fork)\navailable databases [2]:\n[*] dvwa\n[*] information_schema`,
        tone: "warn",
        nextContext: tabContext,
        nextCwd: tabCwd,
      };
    }

    return {
      output: `${tabContext === "container" ? "bash" : os === "macos" ? "zsh" : "bash"}: ${trimmed.split(/\s+/)[0]}: không tìm thấy lệnh trong Lab. Gõ 'help' hoặc bấm Tab để gợi ý lệnh.`,
      tone: "error",
      nextContext: tabContext,
      nextCwd: tabCwd,
    };
  };

  const runCommandInTab = (rawCmd: string, preferredContext?: ShellContext) => {
    const trimmed = rawCmd.trim();
    if (!trimmed) return;

    let targetTabId = activeTab.id;
    if (preferredContext && preferredContext !== activeTab.context) {
      const matched = tabs.find((t) => t.context === preferredContext);
      if (matched) {
        targetTabId = matched.id;
        setActiveTabId(matched.id);
      }
    }

    setTabs((prev) =>
      prev.map((t) => {
        if (t.id !== targetTabId) return t;
        const effectiveCtx = preferredContext ?? t.context;
        const effectiveCwd =
          effectiveCtx === t.context
            ? t.cwd
            : effectiveCtx === "container"
            ? "/var/www/html"
            : effectiveCtx === "mariadb"
            ? "dvwa"
            : "~";

        const res = executeSingleCommand(trimmed, effectiveCtx, effectiveCwd, t.history);
        const nextHistory = [trimmed, ...t.history.filter((c) => c !== trimmed)].slice(0, 30);

        if (res.clearTab) {
          return {
            ...t,
            entries: [],
            history: nextHistory,
            historyIdx: -1,
            input: "",
          };
        }

        const prompt = getPromptParts(os, username, hostname, cleanContainer, effectiveCtx, effectiveCwd);
        const newEntry: TerminalLineEntry = {
          id: Date.now() + Math.floor(Math.random() * 1000),
          promptPrefix: prompt.prefix,
          promptCwd: prompt.cwdLabel,
          promptSymbol: prompt.symbol,
          context: effectiveCtx,
          command: trimmed,
          output: res.output,
          tone: res.tone,
        };

        const updatedTitle =
          res.nextContext !== t.context
            ? res.nextContext === "mariadb"
              ? "MariaDB [dvwa]>"
              : res.nextContext === "container"
              ? `root@${shortContainerId}: ${res.nextCwd}`
              : os === "macos"
              ? `zsh — ${hostname}`
              : `${username}@${hostname}: ~`
            : t.title;

        return {
          ...t,
          title: updatedTitle,
          context: res.nextContext,
          cwd: res.nextCwd,
          entries: [...t.entries, newEntry],
          history: nextHistory,
          historyIdx: -1,
          input: "",
        };
      })
    );
  };

  const beginStreamingCommandInTab = (
    rawCmd: string,
    preferredContext?: ShellContext
  ): { entryId: number | null; lines: string[] } => {
    const trimmed = rawCmd.trim();
    if (!trimmed) return { entryId: null, lines: [] };

    const targetTab =
      (preferredContext && preferredContext !== activeTab.context
        ? tabs.find((t) => t.context === preferredContext)
        : undefined) ?? activeTab;

    if (targetTab.id !== activeTab.id) {
      setActiveTabId(targetTab.id);
    }

    const effectiveCtx = preferredContext ?? targetTab.context;
    const effectiveCwd =
      effectiveCtx === targetTab.context
        ? targetTab.cwd
        : effectiveCtx === "container"
        ? "/var/www/html"
        : effectiveCtx === "mariadb"
        ? "dvwa"
        : "~";

    const res = executeSingleCommand(trimmed, effectiveCtx, effectiveCwd, targetTab.history);
    const nextHistory = [trimmed, ...targetTab.history.filter((c) => c !== trimmed)].slice(0, 30);

    if (res.clearTab) {
      setTabs((prev) =>
        prev.map((t) =>
          t.id === targetTab.id
            ? { ...t, entries: [], history: nextHistory, historyIdx: -1, input: "" }
            : t
        )
      );
      return { entryId: null, lines: [] };
    }

    const entryId = Date.now() + Math.floor(Math.random() * 1000);
    const prompt = getPromptParts(os, username, hostname, cleanContainer, effectiveCtx, effectiveCwd);
    const newEntry: TerminalLineEntry = {
      id: entryId,
      promptPrefix: prompt.prefix,
      promptCwd: prompt.cwdLabel,
      promptSymbol: prompt.symbol,
      context: effectiveCtx,
      command: trimmed,
      output: "",
      tone: res.tone,
    };

    const updatedTitle =
      res.nextContext !== targetTab.context
        ? res.nextContext === "mariadb"
          ? "MariaDB [dvwa]>"
          : res.nextContext === "container"
          ? `root@${shortContainerId}: ${res.nextCwd}`
          : os === "macos"
          ? `zsh — ${hostname}`
          : `${username}@${hostname}: ~`
        : targetTab.title;

    setTabs((prev) =>
      prev.map((t) =>
        t.id === targetTab.id
          ? {
              ...t,
              title: updatedTitle,
              context: res.nextContext,
              cwd: res.nextCwd,
              entries: [...t.entries, newEntry],
              history: nextHistory,
              historyIdx: -1,
              input: "",
            }
          : t
      )
    );

    return {
      entryId,
      lines: res.output ? res.output.split("\n") : [],
    };
  };

  const updateStreamingEntryOutput = (entryId: number, outputText: string) => {
    setTabs((prev) =>
      prev.map((t) => ({
        ...t,
        entries: t.entries.map((e) => (e.id === entryId ? { ...e, output: outputText } : e)),
      }))
    );
  };

  const startTypewriterQueue = (
    cmds: string[],
    preferredContext?: ShellContext,
    label?: string,
    clearEntries = false
  ) => {
    const cleanList = cmds.map((c) => c.trim()).filter(Boolean);
    if (cleanList.length === 0) return;

    setIsMinimized(false);
    const targetTab =
      (preferredContext && preferredContext !== activeTab.context
        ? tabs.find((t) => t.context === preferredContext)
        : undefined) ?? activeTab;

    if (targetTab.id !== activeTab.id) {
      setActiveTabId(targetTab.id);
    }

    setTabs((prev) =>
      prev.map((t) =>
        t.id === targetTab.id
          ? { ...t, input: "", entries: clearEntries ? [] : t.entries }
          : t
      )
    );

    streamingEntryIdRef.current = null;
    setStreamOutLines([]);
    setStreamOutIdx(0);
    setTypeQueue(cleanList);
    setTypeContext(preferredContext);
    setTypeActiveLabel(label ?? null);
    setQueueIdx(0);
    setCharIdx(0);
    setIsTypePaused(false);
    setTypePhase("typing");
  };

  const stopTypewriterQueue = () => {
    streamingEntryIdRef.current = null;
    setStreamOutLines([]);
    setStreamOutIdx(0);
    setTypeQueue([]);
    setTypeContext(undefined);
    setTypeActiveLabel(null);
    setQueueIdx(0);
    setCharIdx(0);
    setIsTypePaused(false);
    setTypePhase("idle");
  };

  const completeCurrentCommandAndPause = () => {
    const currentCmd = typeQueue[queueIdx];
    if (!currentCmd) return;
    if (typePhase === "streaming_out" && streamingEntryIdRef.current !== null) {
      updateStreamingEntryOutput(streamingEntryIdRef.current, streamOutLines.join("\n"));
      streamingEntryIdRef.current = null;
      setStreamOutLines([]);
      setStreamOutIdx(0);
    } else {
      runCommandInTab(currentCmd, typeContext);
    }
    if (queueIdx + 1 < typeQueue.length) {
      setQueueIdx((i) => i + 1);
      setCharIdx(0);
      setTypePhase("typing");
      setIsTypePaused(true);
    } else {
      setIsTypePaused(false);
      setTypePhase("done");
    }
  };

  const typingPct = useMemo(() => {
    if (typeQueue.length === 0 || typePhase === "idle") return 0;
    if (typePhase === "done") return 100;
    const cmdLen = Math.max(1, typeQueue[queueIdx]?.length ?? 1);
    let sub = 1;
    if (typePhase === "typing") {
      sub = (charIdx / cmdLen) * 0.65;
    } else if (typePhase === "enter_pause") {
      sub = 0.68;
    } else if (typePhase === "streaming_out") {
      sub = 0.68 + (streamOutIdx / Math.max(1, streamOutLines.length)) * 0.32;
    }
    return Math.min(99, Math.round(((queueIdx + sub) / typeQueue.length) * 100));
  }, [typeQueue, typePhase, queueIdx, charIdx, streamOutIdx, streamOutLines.length]);

  const setActiveInput = (val: string) => {
    setTabs((prev) => prev.map((t) => (t.id === activeTab.id ? { ...t, input: val } : t)));
  };

  const typeHandlersRef = useRef({
    beginStreamingCommandInTab,
    updateStreamingEntryOutput,
    setActiveInput,
    startTypewriterQueue,
  });
  typeHandlersRef.current = {
    beginStreamingCommandInTab,
    updateStreamingEntryOutput,
    setActiveInput,
    startTypewriterQueue,
  };

  // Drive character-by-character typing simulation inside active Terminal input
  useEffect(() => {
    if (typePhase === "idle" || typePhase === "done" || isTypePaused || typeQueue.length === 0) {
      return;
    }

    const currentCmd = typeQueue[queueIdx];
    if (!currentCmd) {
      setTypePhase("done");
      return;
    }

    if (typePhase === "typing") {
      const isLong = currentCmd.length > 80;
      const charMs =
        typeSpeed === "slow"
          ? isLong
            ? 38
            : 60
          : typeSpeed === "fast"
          ? isLong
            ? 9
            : 14
          : isLong
          ? 20
          : 32;

      const t = setTimeout(() => {
        const nextChar = charIdx + 1;
        typeHandlersRef.current.setActiveInput(currentCmd.slice(0, nextChar));
        if (nextChar >= currentCmd.length) {
          setCharIdx(nextChar);
          setTypePhase("enter_pause");
        } else {
          setCharIdx(nextChar);
        }
      }, charMs);

      return () => clearTimeout(t);
    }

    if (typePhase === "enter_pause") {
      const pauseMs = typeSpeed === "slow" ? 400 : typeSpeed === "fast" ? 140 : 260;
      const t = setTimeout(() => {
        const started = typeHandlersRef.current.beginStreamingCommandInTab(currentCmd, typeContext);
        if (started.entryId !== null && started.lines.length > 0) {
          streamingEntryIdRef.current = started.entryId;
          setStreamOutLines(started.lines);
          setStreamOutIdx(0);
          setTypePhase("streaming_out");
        } else if (queueIdx + 1 < typeQueue.length) {
          setTypePhase("between_cmds");
        } else {
          setTypePhase("done");
        }
      }, pauseMs);

      return () => clearTimeout(t);
    }

    if (typePhase === "streaming_out") {
      const streamMs = typeSpeed === "slow" ? 65 : typeSpeed === "fast" ? 16 : 36;
      const t = setTimeout(() => {
        const nextIdx = Math.min(streamOutLines.length, streamOutIdx + 2);
        if (streamingEntryIdRef.current !== null) {
          typeHandlersRef.current.updateStreamingEntryOutput(
            streamingEntryIdRef.current,
            streamOutLines.slice(0, nextIdx).join("\n")
          );
        }
        setStreamOutIdx(nextIdx);
        if (nextIdx >= streamOutLines.length) {
          streamingEntryIdRef.current = null;
          if (queueIdx + 1 < typeQueue.length) {
            setTypePhase("between_cmds");
          } else {
            setTypePhase("done");
          }
        }
      }, streamMs);

      return () => clearTimeout(t);
    }

    if (typePhase === "between_cmds") {
      const waitMs = typeSpeed === "slow" ? 1100 : typeSpeed === "fast" ? 350 : 700;
      const t = setTimeout(() => {
        setStreamOutLines([]);
        setStreamOutIdx(0);
        setQueueIdx((i) => i + 1);
        setCharIdx(0);
        setTypePhase("typing");
      }, waitMs);

      return () => clearTimeout(t);
    }
  }, [typePhase, queueIdx, charIdx, streamOutIdx, streamOutLines, typeQueue, typeContext, typeSpeed, isTypePaused]);

  // Trigger commands sent externally from parent controls via typewriter queue
  useEffect(() => {
    if (!externalCommand || externalCommand.id === lastExternalCmdIdRef.current) return;
    lastExternalCmdIdRef.current = externalCommand.id;
    const cmds =
      externalCommand.commands && externalCommand.commands.length > 0
        ? externalCommand.commands
        : externalCommand.command
        ? [externalCommand.command]
        : [];
    if (cmds.length > 0) {
      typeHandlersRef.current.startTypewriterQueue(cmds, externalCommand.context, undefined, true);
    }
  }, [externalCommand]);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      runCommandInTab(activeTab.input);
      return;
    }

    if (e.key === "Tab") {
      e.preventDefault();
      if (typePhase === "idle" || typePhase === "done") {
        const val = activeTab.input;
        if (val && !val.endsWith(" ")) {
          const match = autocompletePool.find(
            (c) => c.toLowerCase().startsWith(val.toLowerCase()) && c.length > val.length
          );
          if (match) {
            setActiveInput(match);
          }
        }
      }
      return;
    }

    if (e.ctrlKey && e.key.toLowerCase() === "l") {
      e.preventDefault();
      setTabs((prev) =>
        prev.map((t) => (t.id === activeTab.id ? { ...t, entries: [] } : t))
      );
      return;
    }

    if (e.ctrlKey && e.key.toLowerCase() === "c") {
      e.preventDefault();
      const p = getPromptParts(os, username, hostname, cleanContainer, activeTab.context, activeTab.cwd);
      const cancelEntry: TerminalLineEntry = {
        id: Date.now() + Math.floor(Math.random() * 1000),
        promptPrefix: p.prefix,
        promptCwd: p.cwdLabel,
        promptSymbol: p.symbol,
        context: activeTab.context,
        command: `${activeTab.input}^C`,
        output: "",
        tone: "normal",
      };
      setTabs((prev) =>
        prev.map((t) =>
          t.id === activeTab.id
            ? { ...t, entries: [...t.entries, cancelEntry], input: "", historyIdx: -1 }
            : t
        )
      );
      return;
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (activeTab.history.length === 0) return;
      const nextIdx = Math.min(activeTab.historyIdx + 1, activeTab.history.length - 1);
      const recalled = activeTab.history[nextIdx];
      setTabs((prev) =>
        prev.map((t) =>
          t.id === activeTab.id ? { ...t, historyIdx: nextIdx, input: recalled } : t
        )
      );
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (activeTab.historyIdx <= 0) {
        setTabs((prev) =>
          prev.map((t) => (t.id === activeTab.id ? { ...t, historyIdx: -1, input: "" } : t))
        );
      } else {
        const nextIdx = activeTab.historyIdx - 1;
        const recalled = activeTab.history[nextIdx];
        setTabs((prev) =>
          prev.map((t) =>
            t.id === activeTab.id ? { ...t, historyIdx: nextIdx, input: recalled } : t
          )
        );
      }
    }
  };

  const handleAddTab = () => {
    const nextId = tabs.reduce((m, t) => Math.max(m, t.id), 0) + 1;
    const newTab: TerminalTab = {
      id: nextId,
      title: os === "macos" ? `zsh (${nextId})` : `${nextId}: ${username}@${hostname}: ~`,
      context: "host",
      cwd: "~",
      entries: [],
      history: [],
      historyIdx: -1,
      input: "",
    };
    setTabs((prev) => [...prev, newTab]);
    setActiveTabId(nextId);
  };

  const currentPrompt = getPromptParts(
    os,
    username,
    hostname,
    cleanContainer,
    activeTab.context,
    activeTab.cwd
  );

  const renderTerminalBody = (fullscreenMode: boolean) => {
    const bgSurface =
      os === "macos"
        ? "bg-[#121316]"
        : ubuntuTheme === "aubergine"
        ? "bg-[#24081b]"
        : "bg-[#14161a]";

    return (
      <div
        className={`flex flex-col overflow-hidden rounded-xl border font-mono text-xs ${
          os === "macos" ? "border-zinc-700/80" : "border-[#3c3c3c]"
        } ${
          fullscreenMode
            ? "h-[88vh] w-full max-w-6xl shadow-2xl"
            : "w-full shadow-lg"
        }`}
      >
        {/* OS Headerbar */}
        <div
          className={`flex flex-wrap items-center justify-between gap-2 border-b px-3.5 py-2 ${
            os === "macos"
              ? "border-zinc-800 bg-[#282a2f] text-zinc-200"
              : "border-[#1c1c1c] bg-[#2c2c2c] text-zinc-100"
          }`}
        >
          <div className="flex items-center gap-3">
            <WindowControls
              onClose={() => {
                setTabs((prev) =>
                  prev.map((t) => (t.id === activeTab.id ? { ...t, entries: [] } : t))
                );
              }}
              closeTitle="Xóa màn hình tab hiện tại"
              onMinimize={() => setIsMinimized((v) => !v)}
              isMinimized={isMinimized}
              onMaximize={() => {
                setIsMinimized(false);
                setIsFullscreen((v) => !v);
              }}
              isMaximized={fullscreenMode}
            />
            <div className="flex items-center gap-1.5 text-[11px] font-semibold">
              <TerminalIcon className="h-3.5 w-3.5 text-zinc-400" aria-hidden="true" />
              <span>
                {activeTab.context === "mariadb"
                  ? `MariaDB [dvwa] — ${cleanContainer}`
                  : activeTab.context === "container"
                  ? `root@${shortContainerId} — bash`
                  : os === "macos"
                  ? `${username} — -zsh — 112×30`
                  : `${username}@${hostname}: ~`}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-[11px]">
            {typeQueue.length > 0 && typePhase !== "idle" && (
              <div className="flex flex-wrap items-center gap-1.5 rounded border border-white/15 bg-black/40 px-2 py-0.5 font-mono text-[10px]">
                <span className="max-w-[135px] truncate text-emerald-300">
                  {typeActiveLabel || `Lệnh ${Math.min(queueIdx + 1, typeQueue.length)}/${typeQueue.length}`}
                </span>
                <div className="h-1.5 w-16 overflow-hidden rounded-full bg-zinc-700">
                  <div
                    className={`h-full transition-all duration-150 ${
                      typePhase === "done"
                        ? "bg-emerald-400"
                        : isTypePaused
                        ? "bg-amber-400"
                        : "bg-sky-400"
                    }`}
                    style={{ width: `${typingPct}%` }}
                  />
                </div>
                <span className="font-bold text-white">{typingPct}%</span>
                {typePhase !== "done" && (
                  <button
                    type="button"
                    onClick={() => setIsTypePaused((p) => !p)}
                    className={`inline-flex cursor-pointer items-center gap-1 rounded px-1.5 py-0.5 font-sans text-[10px] font-semibold transition-colors ${
                      isTypePaused
                        ? "bg-emerald-600 text-white hover:bg-emerald-500"
                        : "bg-amber-500/20 text-amber-200 hover:bg-amber-500/35"
                    }`}
                    title={
                      isTypePaused
                        ? "Tiếp tục gõ lệnh"
                        : "Tạm dừng lại để giải thích đoạn đang chạy"
                    }
                  >
                    {isTypePaused ? (
                      <>
                        <Play className="h-2.5 w-2.5" aria-hidden="true" />
                        <span>Tiếp tục</span>
                      </>
                    ) : (
                      <>
                        <Pause className="h-2.5 w-2.5" aria-hidden="true" />
                        <span>Tạm dừng</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            )}

            <span
              className={`inline-flex items-center gap-1.5 rounded px-2 py-0.5 font-semibold ${
                isRunning
                  ? "bg-emerald-500/15 text-emerald-300"
                  : "bg-rose-500/15 text-rose-300"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  isRunning ? "bg-emerald-400" : "bg-rose-400"
                }`}
              />
              {shortContainerId}: {isRunning ? "Up :8080" : "Exited"}
            </span>

            {os === "ubuntu" && (
              <button
                type="button"
                onClick={() =>
                  setUbuntuTheme((t) => (t === "aubergine" ? "slate" : "aubergine"))
                }
                className="cursor-pointer rounded border border-zinc-600 bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-200 hover:bg-zinc-700"
                title="Đổi nền Ubuntu GNOME Terminal"
              >
                {ubuntuTheme === "aubergine" ? "Aubergine" : "Dark Slate"}
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                setIsMinimized(false);
                setIsFullscreen((v) => !v);
              }}
              className="inline-flex cursor-pointer items-center gap-1 rounded border border-zinc-600 bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-200 hover:bg-zinc-700"
            >
              {fullscreenMode ? (
                <>
                  <Minimize2 className="h-3 w-3" aria-hidden="true" />
                  <span>Thu nhỏ</span>
                </>
              ) : (
                <>
                  <Maximize2 className="h-3 w-3" aria-hidden="true" />
                  <span>Phóng to</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Title-adjacent Progress Line during Typewriter Execution */}
        {typeQueue.length > 0 && typePhase !== "idle" && (
          <div className="h-[2px] w-full bg-black/60">
            <div
              className={`h-full transition-all duration-150 ${
                typePhase === "done" ? "bg-emerald-400" : "bg-sky-400"
              }`}
              style={{ width: `${typingPct}%` }}
            />
          </div>
        )}

        {!isMinimized && (
          <>
            {/* Multi-tab strip */}
            <div
              className={`flex flex-wrap items-center gap-1 border-b px-2 pt-1.5 ${
                os === "macos"
                  ? "border-zinc-800 bg-[#1f2024]"
                  : "border-[#1b1b1b] bg-[#202020]"
              }`}
            >
              {tabs.map((tab) => {
                const isActive = tab.id === activeTab.id;
                return (
                  <div
                    key={tab.id}
                    className={`inline-flex items-center gap-1.5 rounded-t border-b-2 px-3 py-1 text-[11px] transition-colors ${
                      isActive
                        ? os === "ubuntu"
                          ? "border-[#e95420] bg-white/10 font-bold text-white"
                          : "border-sky-400 bg-white/10 font-bold text-white"
                        : "border-transparent text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setActiveTabId(tab.id)}
                      className="cursor-pointer"
                    >
                      {tab.title}
                    </button>
                    {tabs.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          const remaining = tabs.filter((x) => x.id !== tab.id);
                          setTabs(remaining);
                          if (isActive && remaining[0]) setActiveTabId(remaining[0].id);
                        }}
                        aria-label={`Đóng tab ${tab.title}`}
                        className="cursor-pointer text-zinc-500 hover:text-white"
                      >
                        <X className="h-3 w-3" aria-hidden="true" />
                      </button>
                    )}
                  </div>
                );
              })}

              <button
                type="button"
                onClick={handleAddTab}
                title="Mở tab Terminal mới"
                className="ml-0.5 inline-flex cursor-pointer items-center justify-center rounded px-1.5 py-1 text-zinc-400 hover:bg-white/10 hover:text-white"
              >
                <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>

            {/* Typewriter Step Simulation & Playback Strip */}
            {(stepGroups.length > 0 || typePhase !== "idle") && (
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 bg-[#18191e] px-3 py-1.5 font-sans">
                <div className="flex flex-wrap items-center gap-1.5">
                  {stepGroups.map((g) => (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => startTypewriterQueue(g.commands, g.context, g.label, true)}
                      className={`inline-flex cursor-pointer items-center gap-1 rounded border px-2 py-0.5 text-[11px] font-medium transition-colors ${
                        typeActiveLabel === g.label && typePhase !== "idle"
                          ? "border-emerald-500/60 bg-emerald-600 text-white"
                          : "border-white/15 bg-white/5 text-zinc-200 hover:bg-white/15"
                      }`}
                    >
                      <Play className="h-2.5 w-2.5" aria-hidden="true" />
                      {g.label}
                    </button>
                  ))}
                </div>

                <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                  <div className="inline-flex rounded border border-white/10 bg-black/40 p-0.5">
                    {(
                      [
                        { id: "slow", label: "Chậm" },
                        { id: "normal", label: "Từ từ" },
                        { id: "fast", label: "Nhanh" },
                      ] as const
                    ).map((sp) => (
                      <button
                        key={sp.id}
                        type="button"
                        onClick={() => setTypeSpeed(sp.id)}
                        className={`cursor-pointer rounded px-1.5 py-0.5 ${
                          typeSpeed === sp.id
                            ? "bg-zinc-600 font-semibold text-white"
                            : "text-zinc-400 hover:text-zinc-200"
                        }`}
                      >
                        {sp.label}
                      </button>
                    ))}
                  </div>

                  {typePhase !== "idle" &&
                    (typePhase === "done" ? (
                      <>
                        <button
                          type="button"
                          onClick={() =>
                            startTypewriterQueue(
                              typeQueue,
                              typeContext,
                              typeActiveLabel ?? undefined,
                              true
                            )
                          }
                          className="inline-flex cursor-pointer items-center gap-1 rounded border border-white/15 bg-white/10 px-2 py-0.5 text-zinc-200 hover:bg-white/20"
                        >
                          <RotateCcw className="h-2.5 w-2.5" aria-hidden="true" />
                          Chạy lại
                        </button>
                        <button
                          type="button"
                          onClick={stopTypewriterQueue}
                          aria-label="Đóng thanh tiến trình gõ lệnh"
                          className="inline-flex cursor-pointer items-center gap-1 rounded border border-white/10 bg-black/30 px-1.5 py-0.5 text-zinc-400 hover:text-white"
                        >
                          <X className="h-2.5 w-2.5" aria-hidden="true" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => setIsTypePaused((p) => !p)}
                          className={`inline-flex cursor-pointer items-center gap-1 rounded border px-2.5 py-0.5 font-semibold transition-colors ${
                            isTypePaused
                              ? "border-emerald-500 bg-emerald-600 text-white hover:bg-emerald-500"
                              : "border-amber-500/50 bg-amber-500/20 text-amber-200 hover:bg-amber-500/30"
                          }`}
                        >
                          {isTypePaused ? (
                            <>
                              <Play className="h-2.5 w-2.5" aria-hidden="true" />
                              Tiếp tục
                            </>
                          ) : (
                            <>
                              <Pause className="h-2.5 w-2.5" aria-hidden="true" />
                              Tạm dừng
                            </>
                          )}
                        </button>
                        {isTypePaused && (
                          <button
                            type="button"
                            onClick={completeCurrentCommandAndPause}
                            className="inline-flex cursor-pointer items-center gap-1 rounded border border-white/15 bg-white/10 px-2 py-0.5 text-zinc-100 hover:bg-white/20"
                            title="Thực thi xong lệnh đang gõ và giữ trạng thái tạm dừng trước lệnh kế tiếp"
                          >
                            <SkipForward className="h-2.5 w-2.5" aria-hidden="true" />
                            Xong lệnh này
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={stopTypewriterQueue}
                          className="inline-flex cursor-pointer items-center gap-1 rounded border border-rose-500/30 bg-rose-500/15 px-2 py-0.5 text-rose-200 hover:bg-rose-500/25"
                        >
                          <Square className="h-2.5 w-2.5" aria-hidden="true" />
                          Dừng
                        </button>
                      </>
                    ))}
                </div>
              </div>
            )}

            {/* Machine Command Bar */}
            {presets.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 border-b border-white/10 bg-black/40 px-3 py-1.5 font-sans">
                {presets.map((p) => (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => startTypewriterQueue([p.command], p.context, p.label, false)}
                    className="cursor-pointer rounded border border-white/15 bg-white/5 px-2 py-0.5 font-mono text-[11px] text-zinc-100 hover:bg-white/15"
                    title={p.command}
                  >
                    $ {p.label}
                  </button>
                ))}
              </div>
            )}

            {/* Pause-to-Explain Banner */}
            {isTypePaused && typeQueue.length > 0 && typePhase !== "idle" && typePhase !== "done" && (() => {
              const pausedCmd = typeQueue[queueIdx] ?? "";
              const info = describeTerminalCommand(pausedCmd);
              return (
                <div className="space-y-1.5 border-b border-amber-500/40 bg-[#241c11] px-3.5 py-2.5 font-sans text-xs text-zinc-200">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-mono text-[11px] font-bold text-amber-300">
                      ĐANG TẠM DỪNG ĐỂ GIẢI THÍCH · Lệnh {Math.min(queueIdx + 1, typeQueue.length)}/
                      {typeQueue.length} ({typingPct}%)
                    </span>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <button
                        type="button"
                        onClick={completeCurrentCommandAndPause}
                        className="inline-flex cursor-pointer items-center gap-1 rounded border border-amber-400/40 bg-amber-500/15 px-2 py-0.5 text-[11px] text-amber-200 hover:bg-amber-500/25"
                      >
                        <SkipForward className="h-3 w-3" aria-hidden="true" />
                        Chạy xong lệnh này &amp; giữ dừng
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsTypePaused(false)}
                        className="inline-flex cursor-pointer items-center gap-1 rounded bg-emerald-600 px-2.5 py-0.5 text-[11px] font-semibold text-white hover:bg-emerald-500"
                      >
                        <Play className="h-3 w-3" aria-hidden="true" />
                        Tiếp tục chạy
                      </button>
                    </div>
                  </div>
                  <div className="overflow-x-auto rounded border border-amber-500/25 bg-black/45 px-2.5 py-1 font-mono text-[11px] text-amber-200">
                    $ {pausedCmd}
                  </div>
                  <div className="text-[11.5px] leading-relaxed text-zinc-200">
                    <span className="font-semibold text-amber-300">Tác dụng — {info.title}: </span>
                    {info.effect}
                  </div>
                </div>
              );
            })()}

            {/* Terminal Output Viewport + Prompt */}
            <div
              ref={viewportRef}
              onClick={() => {
                const selection = window.getSelection()?.toString();
                if (!selection) {
                  inputRef.current?.focus();
                }
              }}
              className={`cursor-text overflow-y-auto p-3.5 leading-relaxed text-zinc-100 ${bgSurface} ${
                fullscreenMode ? "flex-1" : "h-[360px]"
              }`}
            >
              <div className="mb-3 font-mono text-[11px] text-zinc-500">
                {activeTab.context === "host"
                  ? os === "macos"
                    ? "Last login: Wed Nov 18 09:00:12 on ttys001"
                    : "Welcome to Ubuntu 24.04.1 LTS (GNU/Linux 6.8.0-48-generic x86_64)"
                  : activeTab.context === "container"
                  ? `root@${shortContainerId}:${activeTab.cwd}#`
                  : "Server version: 10.1.26-MariaDB-0+deb9u1 Debian 9.1"}
              </div>

              <div className="space-y-3">
                {activeTab.entries.map((entry) => (
                  <div key={entry.id} className="space-y-1">
                    <div className="flex flex-wrap items-baseline gap-1">
                      <span
                        className={
                          entry.context === "mariadb"
                            ? "font-bold text-sky-300"
                            : entry.context === "container"
                            ? "font-bold text-amber-300"
                            : os === "ubuntu"
                            ? "font-bold text-[#8ae234]"
                            : "font-semibold text-emerald-400"
                        }
                      >
                        {entry.promptPrefix}
                      </span>
                      {entry.promptCwd && (
                        <>
                          <span className="text-zinc-400">{os === "ubuntu" && entry.context === "host" ? ":" : " "}</span>
                          <span
                            className={
                              entry.context === "container"
                                ? "font-bold text-sky-300"
                                : os === "ubuntu"
                                ? "font-bold text-[#729fcf]"
                                : "text-sky-400"
                            }
                          >
                            {entry.promptCwd}
                          </span>
                        </>
                      )}
                      <span className="text-zinc-300">{entry.promptSymbol}</span>
                      <span className="ml-1 whitespace-pre-wrap text-zinc-100">
                        {entry.command}
                      </span>
                    </div>

                    {entry.output && (
                      <pre
                        className={`overflow-x-auto whitespace-pre-wrap rounded border border-white/10 bg-black/35 p-2.5 text-[11.5px] ${
                          entry.tone === "ok"
                            ? "text-emerald-300"
                            : entry.tone === "warn"
                            ? "text-amber-200"
                            : entry.tone === "error"
                            ? "text-rose-300"
                            : "text-zinc-200"
                        }`}
                      >
                        {entry.output}
                      </pre>
                    )}
                  </div>
                ))}
              </div>

              {/* Active Prompt Line */}
              <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-white/10 pt-2.5">
                <span
                  className={
                    activeTab.context === "mariadb"
                      ? "font-bold text-sky-300"
                      : activeTab.context === "container"
                      ? "font-bold text-amber-300"
                      : os === "ubuntu"
                      ? "font-bold text-[#8ae234]"
                      : "font-semibold text-emerald-400"
                  }
                >
                  {currentPrompt.prefix}
                </span>
                {currentPrompt.cwdLabel && (
                  <>
                    <span className="text-zinc-400">
                      {os === "ubuntu" && activeTab.context === "host" ? ":" : ""}
                    </span>
                    <span
                      className={
                        activeTab.context === "container"
                          ? "font-bold text-sky-300"
                          : os === "ubuntu"
                          ? "font-bold text-[#729fcf]"
                          : "text-sky-400"
                      }
                    >
                      {currentPrompt.cwdLabel}
                    </span>
                  </>
                )}
                <span className="text-zinc-300">{currentPrompt.symbol}</span>

                {typePhase !== "idle" && typePhase !== "done" ? (
                  <div className="min-w-[200px] flex-1 whitespace-pre-wrap break-all font-mono text-xs text-zinc-100">
                    {activeTab.input}
                    <span className="ml-0.5 inline-block h-3.5 w-2 animate-pulse bg-emerald-400 align-middle" />
                  </div>
                ) : (
                  <div className="relative min-w-[200px] flex-1">
                    <input
                      ref={inputRef}
                      type="text"
                      value={activeTab.input}
                      onChange={(e) => setActiveInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      spellCheck={false}
                      autoCapitalize="none"
                      autoComplete="off"
                      aria-label="Dòng lệnh Terminal"
                      placeholder=""
                      className="relative z-10 w-full bg-transparent font-mono text-xs text-zinc-100 focus:outline-none"
                    />
                  </div>
                )}

                <div className="flex items-center gap-1.5 font-sans">
                  <button
                    type="button"
                    onClick={() => runCommandInTab(activeTab.input)}
                    className="cursor-pointer rounded bg-emerald-600 px-2.5 py-0.5 text-[11px] font-semibold text-white hover:bg-emerald-500"
                  >
                    Enter ↵
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <>
      {renderTerminalBody(false)}
      {isFullscreen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 backdrop-blur-sm sm:p-5"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsFullscreen(false);
          }}
        >
          {renderTerminalBody(true)}
        </div>
      )}
    </>
  );
}
