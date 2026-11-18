"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Code2,
  Cookie,
  HelpCircle,
  Lock,
  Maximize2,
  Minimize2,
  Pause,
  Play,
  Plus,
  RotateCcw,
  RotateCw,
  ShieldAlert,
  ShieldCheck,
  SkipForward,
  Square,
  X,
} from "lucide-react";
import { WindowControls } from "@/components/WindowBar";
import { PHP_LEVEL_SOURCES } from "@/data/scenarioData";

export type DvwaPageId =
  | "home"
  | "instructions"
  | "setup"
  | "brute"
  | "exec"
  | "csrf"
  | "fi"
  | "upload"
  | "captcha"
  | "sqli"
  | "sqli_blind"
  | "weak_id"
  | "xss_d"
  | "xss_r"
  | "xss_s"
  | "csp"
  | "javascript"
  | "security"
  | "phpinfo"
  | "about"
  | "login";

export type DvwaSecurityLevel = "low" | "medium" | "high" | "impossible";

interface DvwaWebEmulatorProps {
  defaultPage?: DvwaPageId;
  defaultHost?: string;
  phpsessid?: string;
  userToken?: string;
  containerRunning?: boolean;
  apachePatched?: boolean;
  cookiePatched?: boolean;
  bcryptApplied?: boolean;
  leastPrivApplied?: boolean;
  wafEnabled?: boolean;
  onWafEnabledChange?: (v: boolean) => void;
  externalSecurityLevel?: DvwaSecurityLevel;
  onSecurityLevelChange?: (level: DvwaSecurityLevel) => void;
  onSqlRequestLogged?: (idParam: string, ua: string) => void;
  onWafLogged?: (payload: string) => void;
}

interface SidebarMenuItem {
  id: DvwaPageId;
  label: string;
  tabTitle: string;
  urlPath: string;
}

const SIDEBAR_GROUPS: SidebarMenuItem[][] = [
  [
    {
      id: "home",
      label: "Home",
      tabTitle: "Welcome :: Damn Vulnerable Web Application (DVWA)",
      urlPath: "/index.php",
    },
    {
      id: "instructions",
      label: "Instructions",
      tabTitle: "Instructions :: Damn Vulnerable Web Application",
      urlPath: "/instructions.php",
    },
    {
      id: "setup",
      label: "Setup / Reset DB",
      tabTitle: "Setup :: Damn Vulnerable Web Application",
      urlPath: "/setup.php",
    },
  ],
  [
    {
      id: "brute",
      label: "Brute Force",
      tabTitle: "Vulnerability: Brute Force :: DVWA",
      urlPath: "/vulnerabilities/brute/",
    },
    {
      id: "exec",
      label: "Command Injection",
      tabTitle: "Vulnerability: Command Injection :: DVWA",
      urlPath: "/vulnerabilities/exec/",
    },
    {
      id: "csrf",
      label: "CSRF",
      tabTitle: "Vulnerability: CSRF :: DVWA",
      urlPath: "/vulnerabilities/csrf/",
    },
    {
      id: "fi",
      label: "File Inclusion",
      tabTitle: "Vulnerability: File Inclusion :: DVWA",
      urlPath: "/vulnerabilities/fi/?page=include.php",
    },
    {
      id: "upload",
      label: "File Upload",
      tabTitle: "Vulnerability: File Upload :: DVWA",
      urlPath: "/vulnerabilities/upload/",
    },
    {
      id: "captcha",
      label: "Insecure CAPTCHA",
      tabTitle: "Vulnerability: Insecure CAPTCHA :: DVWA",
      urlPath: "/vulnerabilities/captcha/",
    },
    {
      id: "sqli",
      label: "SQL Injection",
      tabTitle: "Vulnerability: SQL Injection :: DVWA",
      urlPath: "/vulnerabilities/sqli/",
    },
    {
      id: "sqli_blind",
      label: "SQL Injection (Blind)",
      tabTitle: "Vulnerability: SQL Injection (Blind) :: DVWA",
      urlPath: "/vulnerabilities/sqli_blind/",
    },
    {
      id: "weak_id",
      label: "Weak Session IDs",
      tabTitle: "Vulnerability: Weak Session IDs :: DVWA",
      urlPath: "/vulnerabilities/weak_id/",
    },
    {
      id: "xss_d",
      label: "XSS (DOM)",
      tabTitle: "Vulnerability: DOM Based XSS :: DVWA",
      urlPath: "/vulnerabilities/xss_d/",
    },
    {
      id: "xss_r",
      label: "XSS (Reflected)",
      tabTitle: "Vulnerability: Reflected XSS :: DVWA",
      urlPath: "/vulnerabilities/xss_r/",
    },
    {
      id: "xss_s",
      label: "XSS (Stored)",
      tabTitle: "Vulnerability: Stored XSS :: DVWA",
      urlPath: "/vulnerabilities/xss_s/",
    },
    {
      id: "csp",
      label: "CSP Bypass",
      tabTitle: "Vulnerability: Content Security Policy (CSP) Bypass :: DVWA",
      urlPath: "/vulnerabilities/csp/",
    },
    {
      id: "javascript",
      label: "JavaScript",
      tabTitle: "Vulnerability: JavaScript Attacks :: DVWA",
      urlPath: "/vulnerabilities/javascript/",
    },
  ],
  [
    {
      id: "security",
      label: "DVWA Security",
      tabTitle: "DVWA Security :: Damn Vulnerable Web Application",
      urlPath: "/security.php",
    },
    {
      id: "phpinfo",
      label: "PHP Info",
      tabTitle: "phpinfo() :: Damn Vulnerable Web Application",
      urlPath: "/phpinfo.php",
    },
    {
      id: "about",
      label: "About",
      tabTitle: "About :: Damn Vulnerable Web Application",
      urlPath: "/about.php",
    },
  ],
  [
    {
      id: "login",
      label: "Logout",
      tabTitle: "Login :: Damn Vulnerable Web Application",
      urlPath: "/login.php",
    },
  ],
];

const PAGE_MAP: Record<DvwaPageId, SidebarMenuItem> = SIDEBAR_GROUPS.flat().reduce(
  (acc, item) => {
    acc[item.id] = item;
    return acc;
  },
  {} as Record<DvwaPageId, SidebarMenuItem>
);

interface DvwaUserRecord {
  user_id: number;
  first_name: string;
  last_name: string;
  user: string;
  plain: string;
  md5: string;
  bcrypt: string;
}

const DEFAULT_DVWA_USERS: DvwaUserRecord[] = [
  {
    user_id: 1,
    first_name: "admin",
    last_name: "admin",
    user: "admin",
    plain: "password",
    md5: "5f4dcc3b5aa765d61d8327deb882cf99",
    bcrypt: "$2y$12$K9p8Q3vT2xL7wR4mN6zA1eH8cB5vD0fG2jK4lM6nP8qR0sT2uV4wX",
  },
  {
    user_id: 2,
    first_name: "Gordon",
    last_name: "Brown",
    user: "gordonb",
    plain: "abc123",
    md5: "e99a18c428cb38d5f260853678922e03",
    bcrypt: "$2y$12$A8mK2qP9rS4tV6xZ1cE3gI5jL7nO0qU2wY4bD6fH8kM1nP3rT5vX",
  },
  {
    user_id: 3,
    first_name: "Hack",
    last_name: "Me",
    user: "1337",
    plain: "charley",
    md5: "8d3533d75ae2c3966d7e0d4fcc69216b",
    bcrypt: "$2y$12$P3qS9mN7vK5xR2wT4zB6cE8gH0jL1nQ3uW5yA7dF9hJ2kM4oP6rS",
  },
  {
    user_id: 4,
    first_name: "Pablo",
    last_name: "Picasso",
    user: "pablo",
    plain: "letmein",
    md5: "0d107d09f5bbe40cade3de5c71e9e9b7",
    bcrypt: "$2y$12$X9zA1cE3gI5jL7nP9rT2vX4bD6fH8kM0oQ2sU4wY6zB8dF1hJ3lN",
  },
  {
    user_id: 5,
    first_name: "Bob",
    last_name: "Smith",
    user: "smithy",
    plain: "password",
    md5: "5f4dcc3b5aa765d61d8327deb882cf99",
    bcrypt: "$2y$12$zQ7mL1vN8pR3tX5wK2cF9uB6dG4hJ0kM2nP8qS5tV1yZ7aC3eI9oU",
  },
];

interface GuestbookEntry {
  id: number;
  name: string;
  message: string;
}

const DEFAULT_GUESTBOOK: GuestbookEntry[] = [
  {
    id: 1,
    name: "test",
    message: "This is a test comment.",
  },
];

type DvwaWalkId = "setup-login" | "sqli-low" | "sqli-impossible";
type DvwaWalkPhase = "idle" | "gliding" | "typing" | "acting" | "observing" | "done";
type DvwaWalkSpeed = "slow" | "normal" | "fast";

interface DvwaWalkStep {
  target: string;
  label: string;
  purpose: string;
  action:
    | "nav-setup"
    | "reset-db"
    | "nav-login"
    | "focus-target"
    | "submit-login"
    | "nav-security"
    | "set-sec-low"
    | "set-sec-impossible"
    | "save-security"
    | "nav-sqli"
    | "submit-sqli"
    | "open-source";
  typeField?: "login-user" | "login-pass" | "sqli-id";
  typeValue?: string;
}

const WALK_TIMINGS: Record<DvwaWalkSpeed, { glide: number; act: number; observe: number }> = {
  slow: { glide: 1200, act: 500, observe: 1000 },
  normal: { glide: 850, act: 380, observe: 750 },
  fast: { glide: 500, act: 240, observe: 420 },
};

const DVWA_WALKTHROUGHS: Record<DvwaWalkId, { label: string; steps: DvwaWalkStep[] }> = {
  "setup-login": {
    label: "Demo Setup & Login",
    steps: [
      {
        target: "nav-setup",
        label: "Mở Setup / Reset DB",
        purpose: "Truy cập /setup.php để khởi tạo schema dvwa, bảng users và bảng guestbook lần đầu trong MariaDB.",
        action: "nav-setup",
      },
      {
        target: "btn-reset-db",
        label: "Bấm Create / Reset Database",
        purpose: "Chạy script SQL nạp 5 tài khoản mẫu (admin, gordonb, 1337, pablo, smithy) với mật khẩu băm MD5.",
        action: "reset-db",
      },
      {
        target: "nav-login",
        label: "Mở trang Login",
        purpose: "Chuyển sang /login.php để đăng nhập phiên làm việc và nhận cookie PHPSESSID mới.",
        action: "nav-login",
      },
      {
        target: "input-login-user",
        label: "Gõ Username: admin",
        purpose: "Nhập tên tài khoản quản trị của DVWA là admin.",
        action: "focus-target",
        typeField: "login-user",
        typeValue: "admin",
      },
      {
        target: "input-login-pass",
        label: "Gõ Password: password",
        purpose: "Nhập mật khẩu gốc của tài khoản admin trong DVWA.",
        action: "focus-target",
        typeField: "login-pass",
        typeValue: "password",
      },
      {
        target: "btn-login-submit",
        label: "Bấm Login",
        purpose: "Xác thực thành công và chuyển về trang Home :: Damn Vulnerable Web Application!",
        action: "submit-login",
      },
    ],
  },
  "sqli-low": {
    label: "Demo Khai thác SQLi (Low)",
    steps: [
      {
        target: "nav-security",
        label: "Mở DVWA Security",
        purpose: "Mở trang /security.php để chọn mức bảo mật trước khi kiểm thử lỗ hổng.",
        action: "nav-security",
      },
      {
        target: "select-security",
        label: "Chọn mức Low",
        purpose: "Đưa DVWA về chế độ Low (low.php nối chuỗi $_REQUEST['id'] trực tiếp vào câu SELECT).",
        action: "set-sec-low",
      },
      {
        target: "btn-security-submit",
        label: "Bấm Submit lưu mức Low",
        purpose: "Ghi Cookie security=low vào trình duyệt để backend chạy nhánh low.php.",
        action: "save-security",
      },
      {
        target: "nav-sqli",
        label: "Mở module SQL Injection",
        purpose: "Chuyển sang /vulnerabilities/sqli/ chứa biểu mẫu nhập User ID.",
        action: "nav-sqli",
      },
      {
        target: "input-sqli-id",
        label: "Gõ payload id = 1'",
        purpose: "Chèn dấu nháy đơn (') nhằm kiểm chứng lỗ hổng bằng thông báo lỗi cú pháp SQL từ MariaDB.",
        action: "focus-target",
        typeField: "sqli-id",
        typeValue: "1'",
      },
      {
        target: "btn-sqli-submit",
        label: "Bấm Submit (id=1')",
        purpose: "Backend báo lỗi SQL syntax (CWE-89 & CWE-209), xác nhận tham số id không được lọc.",
        action: "submit-sqli",
      },
      {
        target: "input-sqli-id",
        label: "Gõ payload ' OR '1'='1",
        purpose: "Chuyển câu WHERE thành biểu thức luôn đúng để ép MariaDB trả về toàn bộ 5 dòng bảng users.",
        action: "focus-target",
        typeField: "sqli-id",
        typeValue: "' OR '1'='1",
      },
      {
        target: "btn-sqli-submit",
        label: "Bấm Submit (Dump 5 users)",
        purpose: "Trình duyệt hiển thị danh sách toàn bộ 5 người dùng admin, Gordon, 1337, Pablo, Bob.",
        action: "submit-sqli",
      },
      {
        target: "input-sqli-id",
        label: "Gõ 1' UNION SELECT user, password FROM users #",
        purpose: "Dùng UNION SELECT nối thẳng cột user và password (hash) của bảng users ra HTML.",
        action: "focus-target",
        typeField: "sqli-id",
        typeValue: "1' UNION SELECT user, password FROM users #",
      },
      {
        target: "btn-sqli-submit",
        label: "Bấm Submit (Dump Hash)",
        purpose: "Trích xuất thành công chuỗi băm mật khẩu của cả 5 tài khoản ngay trên giao diện web DVWA.",
        action: "submit-sqli",
      },
    ],
  },
  "sqli-impossible": {
    label: "Demo Phòng thủ Impossible",
    steps: [
      {
        target: "nav-security",
        label: "Mở DVWA Security",
        purpose: "Mở /security.php để chuyển sang mức phòng thủ chuẩn 3 lớp.",
        action: "nav-security",
      },
      {
        target: "select-security",
        label: "Chọn mức Impossible",
        purpose: "Kích hoạt mã nguồn impossible.php (checkToken + is_numeric + PDO Prepared Statements).",
        action: "set-sec-impossible",
      },
      {
        target: "btn-security-submit",
        label: "Bấm Submit lưu Impossible",
        purpose: "Cập nhật Cookie security=impossible cho toàn phiên làm việc.",
        action: "save-security",
      },
      {
        target: "nav-sqli",
        label: "Mở module SQL Injection",
        purpose: "Mở /vulnerabilities/sqli/ để kiểm thử lại cùng payload tấn công lúc trước.",
        action: "nav-sqli",
      },
      {
        target: "input-sqli-id",
        label: "Gõ payload id = 1'",
        purpose: "Nhập chuỗi độc hại 1' vào ô User ID (kèm user_token hợp lệ của biểu mẫu).",
        action: "focus-target",
        typeField: "sqli-id",
        typeValue: "1'",
      },
      {
        target: "btn-sqli-submit",
        label: "Bấm Submit kiểm chứng",
        purpose: "Hàm is_numeric(\"1'\") trả về false ở dòng 11 nên không gọi SQL, đồng thời PDO::PARAM_INT khóa chặt kiểu số nguyên.",
        action: "submit-sqli",
      },
      {
        target: "btn-view-source",
        label: "Mở View Source",
        purpose: "Mở trực tiếp mã nguồn impossible.php ngay trên DVWA để đối chiếu 3 lớp phòng thủ.",
        action: "open-source",
      },
    ],
  },
};

function makePseudoHash(input: string): string {
  let h1 = 0x5f4dcc3b;
  let h2 = 0x5aa765d6;
  for (let i = 0; i < input.length; i++) {
    const ch = input.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 0x45d9f3b) >>> 0;
    h2 = Math.imul(h2 + ch * 17, 0x27d4eb2f) >>> 0;
  }
  const seg1 = h1.toString(16).padStart(8, "0");
  const seg2 = h2.toString(16).padStart(8, "0");
  const seg3 = ((h1 ^ h2) >>> 0).toString(16).padStart(8, "0");
  const seg4 = ((h1 + h2) >>> 0).toString(16).padStart(8, "0");
  return `${seg1}${seg2}${seg3}${seg4}`;
}

function getHelpAndSource(page: DvwaPageId, secLevel: DvwaSecurityLevel): { help: string; source: string } {
  if (page === "sqli") {
    const php = PHP_LEVEL_SOURCES.find((p) => p.level === secLevel) ?? PHP_LEVEL_SOURCES[0];
    return {
      help: "SQL Injection xảy ra khi đầu vào người dùng được ghép trực tiếp vào câu truy vấn SQL mà không phân tách lệnh và dữ liệu bằng Prepared Statements.",
      source: `// ${php.title}\n${php.code}`,
    };
  }
  if (page === "exec") {
    return {
      help: "Command Injection cho phép nối thêm lệnh hệ điều hành (; && | ||) khi ứng dụng gọi shell_exec('ping ... ' . $target).",
      source:
        secLevel === "low"
          ? `$target = $_REQUEST['ip'];\n$cmd = shell_exec( 'ping -c 4 ' . $target );`
          : secLevel === "medium"
          ? `$substitutions = array( '&&' => '', ';' => '' );\n$target = str_replace( array_keys($substitutions), $substitutions, $target ); // Con sot |, ||, &`
          : secLevel === "high"
          ? `$substitutions = array( '&'=>'', ';'=>'', '| '=>'', '-'=>'', '$'=>'' ); // Con sot | khong co dau cach`
          : `checkToken(...);\n$octet = explode('.', $target);\nif (is_numeric($octet[0]) && count($octet) === 4) { shell_exec(...); }`,
    };
  }
  if (page === "xss_r" || page === "xss_s" || page === "xss_d") {
    return {
      help: "Cross-Site Scripting (XSS) phát sinh khi dữ liệu không an toàn được phản hồi ra DOM/HTML mà chưa htmlspecialchars(). Khi cookie bật HttpOnly, JavaScript không thể đọc được PHPSESSID.",
      source:
        secLevel === "low"
          ? `$html .= '<pre>Hello ' . $_GET['name'] . '</pre>'; // Khong loc HTML`
          : secLevel === "medium"
          ? `$name = str_replace('<script>', '', $_GET['name']); // Bypass bang <ScRiPt> hoac <img onerror=...>`
          : secLevel === "high"
          ? `$name = preg_replace('/<(.*)s(.*)c(.*)r(.*)i(.*)p(.*)t/i', '', $_GET['name']); // Bypass bang <img src=x onerror=alert(1)>`
          : `checkToken(...);\n$name = htmlspecialchars($_GET['name'], ENT_QUOTES, 'UTF-8');`,
    };
  }
  if (page === "fi") {
    return {
      help: "File Inclusion (LFI/RFI) cho phép đọc tệp nhạy cảm (/etc/passwd) hoặc thực thi tệp từ xa khi truyền thẳng $_GET['page'] vào hàm include($file).",
      source:
        secLevel === "low"
          ? `$file = $_GET['page'];\ninclude($file);`
          : secLevel === "medium"
          ? `$file = str_replace(array("http://", "https://", "../"), "", $_GET['page']); // Bypass bang ....// hoac /etc/passwd`
          : secLevel === "high"
          ? `if (!fnmatch("file*", $file) && $file != "include.php") { die("ERROR: File not found!"); }`
          : `if (!in_array($file, ["include.php","file1.php","file2.php","file3.php"], true)) { die("ERROR"); }`,
    };
  }
  return {
    help: "Sử dụng DVWA Security ở thanh menu bên trái để chuyển đổi qua lại giữa 4 cấp độ Low -> Medium -> High -> Impossible và đối chiếu hành vi bảo mật.",
    source: `// Module: ${page} (Security Level: ${secLevel})\n<?php\nrequire_once DVWA_WEB_PAGE_TO_ROOT . 'dvwa/includes/dvwaPage.inc.php';\ndvwaPageStartup( array( 'authenticated', 'phpids' ) );\n?>`,
  };
}

export function DvwaWebEmulator({
  defaultPage = "home",
  defaultHost = "127.0.0.1:8080",
  phpsessid = "7nst0hrqrfmv744a5ouj7663b0",
  userToken = "d41d8cd98f00b204e9800998ecf8427e",
  containerRunning = true,
  apachePatched = false,
  cookiePatched = false,
  bcryptApplied = false,
  leastPrivApplied = false,
  wafEnabled,
  onWafEnabledChange,
  externalSecurityLevel,
  onSecurityLevelChange,
  onSqlRequestLogged,
  onWafLogged,
}: DvwaWebEmulatorProps) {
  const cleanSess = phpsessid.trim() || "7nst0hrqrfmv744a5ouj7663b0";
  const [activePage, setActivePage] = useState<DvwaPageId>(defaultPage);
  const [hostLabel, setHostLabel] = useState(defaultHost);
  const [securityLevel, setSecurityLevel] = useState<DvwaSecurityLevel>(
    externalSecurityLevel ?? "low"
  );
  const [securityDraft, setSecurityDraft] = useState<DvwaSecurityLevel>(
    externalSecurityLevel ?? "low"
  );
  const [securityNotice, setSecurityNotice] = useState<string | null>(null);

  const [isMinimized, setIsMinimized] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState<string | null>("admin");
  const [activeToken, setActiveToken] = useState(userToken);

  // Sync external security level if updated by parent simulator
  useEffect(() => {
    if (externalSecurityLevel) {
      setSecurityLevel(externalSecurityLevel);
      setSecurityDraft(externalSecurityLevel);
    }
  }, [externalSecurityLevel]);

  // Internal WAF state fallback when parent doesn't manage it
  const [internalWaf, setInternalWaf] = useState(false);
  const isWafActive = wafEnabled ?? internalWaf;
  const toggleWaf = () => {
    const next = !isWafActive;
    setInternalWaf(next);
    onWafEnabledChange?.(next);
  };

  // Browser history stack & address bar
  const [historyStack, setHistoryStack] = useState<DvwaPageId[]>([defaultPage]);
  const [historyIdx, setHistoryIdx] = useState(0);
  const [urlInput, setUrlInput] = useState(
    `http://${defaultHost}${PAGE_MAP[defaultPage]?.urlPath ?? "/index.php"}`
  );
  const [showCookiePopover, setShowCookiePopover] = useState(false);
  const [modalMode, setModalMode] = useState<"source" | "help" | null>(null);
  const [compareAllSources, setCompareAllSources] = useState(false);

  // Users DB & Setup/Login/Brute/CSRF state
  const [usersDb, setUsersDb] = useState<DvwaUserRecord[]>(DEFAULT_DVWA_USERS);
  const [setupLogs, setSetupLogs] = useState<string[] | null>(null);
  const [loginUser, setLoginUser] = useState("");
  const [loginPass, setLoginPass] = useState("");
  const [loginMsg, setLoginMsg] = useState<string | null>(null);

  // Brute Force
  const [bruteUser, setBruteUser] = useState("");
  const [brutePass, setBrutePass] = useState("");
  const [bruteFails, setBruteFails] = useState(0);
  const [bruteResult, setBruteResult] = useState<{ ok: boolean; msg: string } | null>(null);

  // Command Injection
  const [execInput, setExecInput] = useState("");
  const [execOutput, setExecOutput] = useState<string | null>(null);

  // CSRF
  const [csrfCurrent, setCsrfCurrent] = useState("");
  const [csrfPass1, setCsrfPass1] = useState("");
  const [csrfPass2, setCsrfPass2] = useState("");
  const [csrfMsg, setCsrfMsg] = useState<string | null>(null);

  // File Inclusion
  const [fiPage, setFiPage] = useState("include.php");

  // File Upload
  const [uploadPreset, setUploadPreset] = useState<"avatar.png" | "shell.php" | "shell.php.jpeg">(
    "shell.php"
  );
  const [uploadMsg, setUploadMsg] = useState<{ ok: boolean; text: string; shellReady?: boolean } | null>(
    null
  );
  const [webshellCmd, setWebshellCmd] = useState("id");
  const [webshellOut, setWebshellOut] = useState<string | null>(null);

  // Insecure CAPTCHA
  const [captchaStepParam, setCaptchaStepParam] = useState<"1" | "2">("1");
  const [captchaChecked, setCaptchaChecked] = useState(false);
  const [captchaP1, setCaptchaP1] = useState("");
  const [captchaP2, setCaptchaP2] = useState("");
  const [captchaMsg, setCaptchaMsg] = useState<string | null>(null);

  // SQL Injection & Blind SQLi
  const [sqliInput, setSqliInput] = useState("");
  const [sqliMediumSelect, setSqliMediumSelect] = useState("1");
  const [sqliUseMediumOverride, setSqliUseMediumOverride] = useState(false);
  const [sqliHighSessionId, setSqliHighSessionId] = useState("1");
  const [sqliHighModalOpen, setSqliHighModalOpen] = useState(false);
  const [sqliIncludeToken, setSqliIncludeToken] = useState(true);
  const [sqliOutput, setSqliOutput] = useState<{
    kind: "rows" | "error" | "waf" | "redirect" | "empty";
    submittedId: string;
    rows?: { id: string; first: string; surname: string }[];
    message?: string;
  } | null>(null);

  const [blindInput, setBlindInput] = useState("");
  const [blindOutput, setBlindOutput] = useState<string | null>(null);

  // Weak Session IDs
  const [weakIdCounter, setWeakIdCounter] = useState(0);
  const [dvwaSessionCookie, setDvwaSessionCookie] = useState<string>("(chưa sinh)");

  // XSS (DOM, Reflected, Stored)
  const [xssDomLang, setXssDomLang] = useState("English");
  const [xssReflectedInput, setXssReflectedInput] = useState("");
  const [xssReflectedRendered, setXssReflectedRendered] = useState<string | null>(null);
  const [xssAlertPreview, setXssAlertPreview] = useState<string | null>(null);
  const [guestbook, setGuestbook] = useState<GuestbookEntry[]>(DEFAULT_GUESTBOOK);
  const [xssStoredName, setXssStoredName] = useState("");
  const [xssStoredMessage, setXssStoredMessage] = useState("");

  // CSP Bypass & JavaScript
  const [cspIncludeUrl, setCspIncludeUrl] = useState("");
  const [cspResult, setCspResult] = useState<string | null>(null);
  const [jsPhrase, setJsPhrase] = useState("ChangeMe");
  const [jsTokenInput, setJsTokenInput] = useState("6f9e3a81e7f93a4765656c35a0f08b55");
  const [jsMsg, setJsMsg] = useState<string | null>(null);

  // Guided Autopilot State
  const inlineRootRef = useRef<HTMLDivElement | null>(null);
  const fullscreenRootRef = useRef<HTMLDivElement | null>(null);
  const [walkId, setWalkId] = useState<DvwaWalkId | null>(null);
  const [stepIdx, setStepIdx] = useState(0);
  const [typedChars, setTypedChars] = useState(0);
  const [walkPhase, setWalkPhase] = useState<DvwaWalkPhase>("idle");
  const [isWalkPaused, setIsWalkPaused] = useState(false);
  const [walkSpeed, setWalkSpeed] = useState<DvwaWalkSpeed>("normal");
  const [cursorPos, setCursorPos] = useState({ x: 100, y: 120 });

  const navigateTo = useCallback(
    (page: DvwaPageId, customPath?: string) => {
      setActivePage(page);
      if (page === "login") {
        setLoggedInUser(null);
      }
      const nextPath = customPath ?? PAGE_MAP[page]?.urlPath ?? "/index.php";
      setUrlInput(`http://${hostLabel}${nextPath}`);
      setHistoryStack((prev) => {
        const sliced = prev.slice(0, historyIdx + 1);
        if (sliced[sliced.length - 1] === page) return sliced;
        const updated = [...sliced, page];
        setHistoryIdx(updated.length - 1);
        return updated;
      });
    },
    [hostLabel, historyIdx]
  );

  // Esc closes fullscreen or modal
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (modalMode) setModalMode(null);
        else if (sqliHighModalOpen) setSqliHighModalOpen(false);
        else if (showCookiePopover) setShowCookiePopover(false);
        else if (isFullscreen) setIsFullscreen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [modalMode, sqliHighModalOpen, showCookiePopover, isFullscreen]);

  const checkWafTriggered = useCallback(
    (val: string): string | null => {
      if (!isWafActive) return null;
      const m = val.match(/('|--|#|\/\*|union|select|or\s+\d+=\d+|<script|onerror=|;\s*id|&&)/i);
      if (m) {
        onWafLogged?.(val);
        return m[0];
      }
      return null;
    },
    [isWafActive, onWafLogged]
  );

  const rotateToken = () => {
    const hex = makePseudoHash(`${Date.now()}-${Math.random()}`);
    setActiveToken(hex);
    return hex;
  };

  const executeSqliQuery = useCallback(
    (rawId: string, withToken: boolean) => {
      if (!containerRunning) return;
      onSqlRequestLogged?.(rawId, "Mozilla/5.0 (DVWA Browser)");

      const wafHit = checkWafTriggered(rawId);
      if (wafHit) {
        setSqliOutput({
          kind: "waf",
          submittedId: rawId,
          message: `403 Forbidden — ModSecurity SecRule 100001 blocked token "${wafHit}"`,
        });
        return;
      }

      const nextPath = `/vulnerabilities/sqli/?id=${encodeURIComponent(rawId)}&Submit=Submit`;
      setUrlInput(`http://${hostLabel}${nextPath}`);

      if (securityLevel === "impossible") {
        if (!withToken) {
          setSqliOutput({
            kind: "redirect",
            submittedId: rawId,
            message: "HTTP/1.1 302 Found -> Location: index.php (checkToken() failed: CSRF token missing or invalid)",
          });
          rotateToken();
          return;
        }
        rotateToken();
        if (/^\d+$/.test(rawId.trim())) {
          const matched = usersDb.filter((u) => String(u.user_id) === rawId.trim());
          setSqliOutput({
            kind: matched.length > 0 ? "rows" : "empty",
            submittedId: rawId,
            rows: matched.map((u) => ({
              id: rawId.trim(),
              first: u.first_name,
              surname: u.last_name,
            })),
          });
        } else {
          setSqliOutput({
            kind: "empty",
            submittedId: rawId,
            rows: [],
          });
        }
        return;
      }

      const trimmed = rawId.trim();
      const lower = trimmed.toLowerCase();

      // Medium uses mysqli_real_escape_string around unquoted $id
      if (securityLevel === "medium") {
        if (lower.includes("union") && lower.includes("select")) {
          if (leastPrivApplied && lower.includes("mysql.user")) {
            setSqliOutput({
              kind: "error",
              submittedId: trimmed,
              message: "SELECT command denied to user 'dvwa_svc'@'localhost' for table 'user'",
            });
            return;
          }
          setSqliOutput({
            kind: "rows",
            submittedId: trimmed,
            rows: usersDb.map((u) => ({
              id: trimmed,
              first: u.user,
              surname: bcryptApplied ? u.bcrypt : u.md5,
            })),
          });
          return;
        }
        if (/\bor\s+1\s*=\s*1/i.test(trimmed)) {
          setSqliOutput({
            kind: "rows",
            submittedId: trimmed,
            rows: usersDb.map((u) => ({
              id: trimmed,
              first: u.first_name,
              surname: u.last_name,
            })),
          });
          return;
        }
        if (/^\d+$/.test(trimmed)) {
          const matched = usersDb.filter((u) => String(u.user_id) === trimmed);
          setSqliOutput({
            kind: matched.length > 0 ? "rows" : "empty",
            submittedId: trimmed,
            rows: matched.map((u) => ({
              id: trimmed,
              first: u.first_name,
              surname: u.last_name,
            })),
          });
          return;
        }
        if (trimmed.includes("'")) {
          setSqliOutput({
            kind: "error",
            submittedId: trimmed,
            message: `You have an error in your SQL syntax; check the manual that corresponds to your MariaDB server version for the right syntax to use near '\\'' at line 1`,
          });
          return;
        }
      }

      // Low / High
      if (lower.includes("union") && lower.includes("select")) {
        if (leastPrivApplied && lower.includes("mysql.user")) {
          setSqliOutput({
            kind: "error",
            submittedId: trimmed,
            message: "SELECT command denied to user 'dvwa_svc'@'localhost' for table 'user'",
          });
          return;
        }
        setSqliOutput({
          kind: "rows",
          submittedId: trimmed,
          rows: usersDb.map((u) => ({
            id: trimmed,
            first: u.user,
            surname: bcryptApplied ? u.bcrypt : u.md5,
          })),
        });
        return;
      }

      if (/('\s*or\s*'1'\s*=\s*'1|\bor\s+1\s*=\s*1)/i.test(trimmed)) {
        setSqliOutput({
          kind: "rows",
          submittedId: trimmed,
          rows: usersDb.map((u) => ({
            id: trimmed,
            first: u.first_name,
            surname: u.last_name,
          })),
        });
        return;
      }

      if (trimmed.includes("'")) {
        setSqliOutput({
          kind: "error",
          submittedId: trimmed,
          message: `You have an error in your SQL syntax; check the manual that corresponds to your MariaDB server version for the right syntax to use near '''${trimmed}''' at line 1`,
        });
        return;
      }

      const matched = usersDb.filter((u) => String(u.user_id) === trimmed);
      setSqliOutput({
        kind: matched.length > 0 ? "rows" : "empty",
        submittedId: trimmed,
        rows: matched.map((u) => ({
          id: trimmed,
          first: u.first_name,
          surname: u.last_name,
        })),
      });
    },
    [
      containerRunning,
      securityLevel,
      usersDb,
      bcryptApplied,
      leastPrivApplied,
      hostLabel,
      checkWafTriggered,
      onSqlRequestLogged,
    ]
  );

  // Address bar submit parses real paths & GET params
  const handleUrlSubmit = () => {
    const cleaned = urlInput.trim();
    const afterHost = cleaned.replace(/^https?:\/\/[^/]+/i, "") || "/index.php";
    const hostMatch = cleaned.match(/^https?:\/\/([^/]+)/i);
    if (hostMatch?.[1]) setHostLabel(hostMatch[1]);

    const [pathOnly, queryStr = ""] = afterHost.split("?");
    const params = new URLSearchParams(queryStr);

    if (pathOnly.includes("setup.php")) {
      navigateTo("setup");
    } else if (pathOnly.includes("instructions.php")) {
      navigateTo("instructions");
    } else if (pathOnly.includes("security.php")) {
      navigateTo("security");
    } else if (pathOnly.includes("phpinfo.php")) {
      navigateTo("phpinfo");
    } else if (pathOnly.includes("about.php")) {
      navigateTo("about");
    } else if (pathOnly.includes("login.php")) {
      navigateTo("login");
    } else if (pathOnly.includes("/vulnerabilities/sqli_blind")) {
      navigateTo("sqli_blind", afterHost);
      const qid = params.get("id");
      if (qid !== null) {
        setBlindInput(qid);
        handleRunBlind(qid);
      }
    } else if (pathOnly.includes("/vulnerabilities/sqli")) {
      navigateTo("sqli", afterHost);
      const qid = params.get("id");
      if (qid !== null) {
        setSqliInput(qid);
        executeSqliQuery(qid, sqliIncludeToken);
      }
    } else if (pathOnly.includes("/vulnerabilities/fi")) {
      navigateTo("fi", afterHost);
      const qp = params.get("page");
      if (qp !== null) setFiPage(qp);
    } else if (pathOnly.includes("/vulnerabilities/xss_r")) {
      navigateTo("xss_r", afterHost);
      const qn = params.get("name");
      if (qn !== null) {
        setXssReflectedInput(qn);
        runReflectedXss(qn);
      }
    } else if (pathOnly.includes("/vulnerabilities/xss_d")) {
      navigateTo("xss_d", afterHost);
      const qd = params.get("default");
      if (qd !== null) setXssDomLang(qd);
    } else if (pathOnly.includes("/vulnerabilities/xss_s")) {
      navigateTo("xss_s");
    } else if (pathOnly.includes("/vulnerabilities/brute")) {
      navigateTo("brute");
    } else if (pathOnly.includes("/vulnerabilities/exec")) {
      navigateTo("exec");
    } else if (pathOnly.includes("/vulnerabilities/csrf")) {
      navigateTo("csrf");
    } else if (pathOnly.includes("/vulnerabilities/upload")) {
      navigateTo("upload");
    } else if (pathOnly.includes("/vulnerabilities/captcha")) {
      navigateTo("captcha");
    } else if (pathOnly.includes("/vulnerabilities/weak_id")) {
      navigateTo("weak_id");
    } else if (pathOnly.includes("/vulnerabilities/csp")) {
      navigateTo("csp");
    } else if (pathOnly.includes("/vulnerabilities/javascript")) {
      navigateTo("javascript");
    } else {
      navigateTo("home");
    }
  };

  const handleLoginSubmit = useCallback(
    (uOverride?: string, pOverride?: string) => {
      const u = (uOverride ?? loginUser).trim();
      const p = pOverride ?? loginPass;
      const found = usersDb.find((row) => row.user === u && row.plain === p);
      if (found) {
        setLoggedInUser(found.user);
        setLoginMsg(null);
        navigateTo("home");
      } else {
        setLoginMsg("Login failed");
      }
    },
    [loginUser, loginPass, usersDb, navigateTo]
  );

  const handleResetDb = useCallback(() => {
    setUsersDb(DEFAULT_DVWA_USERS);
    setGuestbook(DEFAULT_GUESTBOOK);
    setBruteFails(0);
    setSetupLogs([
      "Database has been created.",
      "'users' table was created.",
      "Data inserted into 'users' table.",
      "'guestbook' table was created.",
      "Data inserted into 'guestbook' table.",
      `Database backend user: ${leastPrivApplied ? "dvwa_svc@localhost" : "root@localhost"}`,
      "Setup successful!",
    ]);
  }, [leastPrivApplied]);

  const handleBruteSubmit = () => {
    if (securityLevel === "impossible" && bruteFails >= 3) {
      setBruteResult({
        ok: false,
        msg: "This account has been locked due to too many failed logins.",
      });
      return;
    }
    const found = usersDb.find((u) => u.user === bruteUser.trim() && u.plain === brutePass);
    if (found) {
      setBruteFails(0);
      setBruteResult({ ok: true, msg: `Welcome to the password protected area ${found.user}` });
    } else {
      setBruteFails((c) => c + 1);
      setBruteResult({ ok: false, msg: "Username and/or password incorrect." });
    }
  };

  const handleExecSubmit = () => {
    const waf = checkWafTriggered(execInput);
    if (waf) {
      setExecOutput(`HTTP 403 Forbidden (ModSecurity blocked '${waf}')`);
      return;
    }
    const raw = execInput.trim();
    if (securityLevel === "impossible") {
      if (!/^\d{1,3}(\.\d{1,3}){3}$/.test(raw)) {
        setExecOutput("ERROR: You have entered an invalid IP.");
        return;
      }
    }

    const pingOut = `PING ${raw.split(/[;&|]/)[0].trim() || "127.0.0.1"} (127.0.0.1) 56(84) bytes of data.
64 bytes from 127.0.0.1: icmp_seq=1 ttl=64 time=0.041 ms
64 bytes from 127.0.0.1: icmp_seq=2 ttl=64 time=0.048 ms
--- ping statistics ---
2 packets transmitted, 2 received, 0% packet loss`;

    let extraCmd = "";
    const sepMatch = raw.match(/(?:&&|\|\||;|\|)\s*(.+)$/);
    if (sepMatch) {
      const sepUsed = raw.includes("&&")
        ? "&&"
        : raw.includes("||")
        ? "||"
        : raw.includes(";")
        ? ";"
        : "|";
      const isBlockedByMedium = securityLevel === "medium" && (sepUsed === "&&" || sepUsed === ";");
      const isBlockedByHigh = securityLevel === "high" && (sepUsed === "&&" || sepUsed === ";" || sepUsed === "||");
      if (!isBlockedByMedium && !isBlockedByHigh) {
        const sub = sepMatch[1].trim().toLowerCase();
        if (sub.startsWith("id")) extraCmd = "\nuid=33(www-data) gid=33(www-data) groups=33(www-data)";
        else if (sub.startsWith("whoami")) extraCmd = "\nwww-data";
        else if (sub.startsWith("pwd")) extraCmd = "\n/var/www/html/vulnerabilities/exec";
        else if (sub.startsWith("uname")) extraCmd = "\nLinux 215d3a734374 6.8.0-48-generic #48-Ubuntu x86_64 GNU/Linux";
        else if (sub.startsWith("ls")) extraCmd = "\nhelp  index.php  source";
        else if (sub.includes("/etc/passwd"))
          extraCmd = "\nroot:x:0:0:root:/root:/bin/bash\nwww-data:x:33:33:www-data:/var/www:/usr/sbin/nologin\nmysql:x:106:111:MySQL Server:/nonexistent:/bin/false";
        else extraCmd = `\n[exec]: ${sepMatch[1].trim()} executed`;
      }
    }
    setExecOutput(`${pingOut}${extraCmd}`);
  };

  const handleCsrfSubmit = () => {
    if (securityLevel === "high" || securityLevel === "impossible") {
      const adminRow = usersDb.find((u) => u.user === "admin");
      if (!csrfCurrent || csrfCurrent !== adminRow?.plain) {
        setCsrfMsg("Current password incorrect.");
        return;
      }
    }
    if (!csrfPass1 || csrfPass1 !== csrfPass2) {
      setCsrfMsg("Passwords did not match.");
      return;
    }
    setUsersDb((prev) =>
      prev.map((u) =>
        u.user === "admin"
          ? { ...u, plain: csrfPass1, md5: makePseudoHash(csrfPass1) }
          : u
      )
    );
    setLoginPass(csrfPass1);
    setCsrfMsg("Password Changed.");
    setCsrfCurrent("");
    setCsrfPass1("");
    setCsrfPass2("");
  };

  const handleRunBlind = (overrideVal?: string) => {
    const val = (overrideVal ?? blindInput).trim();
    const waf = checkWafTriggered(val);
    if (waf) {
      setBlindOutput(`403 Forbidden — ModSecurity SecRule 100001 blocked "${waf}"`);
      return;
    }
    if (securityLevel === "impossible") {
      setBlindOutput(
        /^\d+$/.test(val) && usersDb.some((u) => String(u.user_id) === val)
          ? "User ID exists in the database."
          : "User ID is MISSING from the database."
      );
      return;
    }
    if (/1\s*=\s*2|substring\([^)]+\)\s*=\s*'x'/i.test(val)) {
      setBlindOutput("User ID is MISSING from the database.");
    } else if (
      /^\d+$/.test(val)
        ? usersDb.some((u) => String(u.user_id) === val)
        : /'1'\s*=\s*'1'|1\s*=\s*1|'d'/i.test(val)
    ) {
      setBlindOutput("User ID exists in the database.");
    } else {
      setBlindOutput("User ID is MISSING from the database.");
    }
  };

  const evaluateXssCookieHint = (raw: string): string | null => {
    const lower = raw.toLowerCase();
    const isScriptTag = /<\s*script/i.test(raw);
    const isUpperScript = isScriptTag && raw !== raw.toLowerCase();
    const isEventHandler = /on(?:error|load|focus|mouseover)\s*=/i.test(raw);
    const matchesPattern = isScriptTag || isEventHandler;
    if (!matchesPattern) return null;
    if (securityLevel === "impossible") return null;
    if (securityLevel === "high" && isScriptTag && !isEventHandler) return null;
    if (securityLevel === "medium" && isScriptTag && !isUpperScript && !isEventHandler) return null;

    if (lower.includes("document.cookie")) {
      return cookiePatched
        ? `security=${securityLevel}; dvwaSession=${dvwaSessionCookie} (PHPSESSID da bi an do bat HttpOnly!)`
        : `PHPSESSID=${cleanSess}; security=${securityLevel}`;
    }
    const alertArg = raw.match(/alert\(([^)]+)\)/i)?.[1];
    return alertArg ? alertArg.replace(/^['"]|['"]$/g, "") : "1";
  };

  const runReflectedXss = (overrideVal?: string) => {
    const val = overrideVal ?? xssReflectedInput;
    const waf = checkWafTriggered(val);
    if (waf) {
      setXssReflectedRendered(`403 Forbidden — ModSecurity SecRule 100001`);
      return;
    }
    const alertText = evaluateXssCookieHint(val);
    if (alertText) setXssAlertPreview(alertText);
    if (securityLevel === "impossible") {
      setXssReflectedRendered(`Hello ${val} (da encode htmlspecialchars)`);
    } else {
      setXssReflectedRendered(val ? `Hello ${val}` : null);
    }
  };

  // Guided Autopilot helpers & timer
  const currentSteps = walkId ? DVWA_WALKTHROUGHS[walkId].steps : [];
  const currentWalkStep = currentSteps[stepIdx];
  const progressPct = useMemo(() => {
    if (!walkId || walkPhase === "idle" || currentSteps.length === 0) return 0;
    if (walkPhase === "done") return 100;
    let sub = 0.25;
    if (walkPhase === "typing" && currentWalkStep?.typeValue) {
      sub = 0.25 + 0.5 * (typedChars / Math.max(1, currentWalkStep.typeValue.length));
    } else if (walkPhase === "acting") sub = 0.8;
    else if (walkPhase === "observing") sub = 0.95;
    return Math.min(99, Math.round(((stepIdx + sub) / currentSteps.length) * 100));
  }, [walkId, walkPhase, currentSteps.length, currentWalkStep, stepIdx, typedChars]);

  const applyWalkField = useCallback(
    (field: NonNullable<DvwaWalkStep["typeField"]>, val: string) => {
      if (field === "login-user") setLoginUser(val);
      if (field === "login-pass") setLoginPass(val);
      if (field === "sqli-id") setSqliInput(val);
    },
    []
  );

  const executeWalkStepAction = useCallback(
    (step: DvwaWalkStep) => {
      switch (step.action) {
        case "nav-setup":
          setLoggedInUser("admin");
          navigateTo("setup");
          break;
        case "reset-db":
          handleResetDb();
          break;
        case "nav-login":
          navigateTo("login");
          setLoginUser("");
          setLoginPass("");
          break;
        case "submit-login":
          handleLoginSubmit(step.typeValue ?? undefined);
          break;
        case "nav-security":
          setLoggedInUser("admin");
          navigateTo("security");
          break;
        case "set-sec-low":
          setSecurityDraft("low");
          break;
        case "set-sec-impossible":
          setSecurityDraft("impossible");
          break;
        case "save-security":
          setSecurityLevel(securityDraft);
          onSecurityLevelChange?.(securityDraft);
          setSecurityNotice(`Security level set to ${securityDraft}`);
          break;
        case "nav-sqli":
          setLoggedInUser("admin");
          navigateTo("sqli");
          setSqliInput("");
          setSqliOutput(null);
          break;
        case "submit-sqli":
          executeSqliQuery(sqliInput, sqliIncludeToken);
          break;
        case "open-source":
          setModalMode("source");
          break;
        case "focus-target":
          break;
      }
    },
    [
      navigateTo,
      securityDraft,
      sqliInput,
      sqliIncludeToken,
      executeSqliQuery,
      handleResetDb,
      handleLoginSubmit,
      onSecurityLevelChange,
    ]
  );

  const startWalkthrough = (id: DvwaWalkId) => {
    setIsMinimized(false);
    setModalMode(null);
    setLoggedInUser("admin");
    const first = DVWA_WALKTHROUGHS[id].steps[0];
    if (first?.typeField) {
      applyWalkField(first.typeField, "");
    }
    setWalkId(id);
    setStepIdx(0);
    setTypedChars(0);
    setIsWalkPaused(false);
    setWalkPhase("gliding");
  };

  const stopWalkthrough = () => {
    setWalkId(null);
    setStepIdx(0);
    setTypedChars(0);
    setWalkPhase("idle");
    setIsWalkPaused(false);
  };

  const completeWalkStepAndPause = () => {
    if (!currentWalkStep) return;
    if (currentWalkStep.typeField && currentWalkStep.typeValue) {
      applyWalkField(currentWalkStep.typeField, currentWalkStep.typeValue);
      setTypedChars(currentWalkStep.typeValue.length);
    }
    executeWalkStepAction(currentWalkStep);
    if (stepIdx + 1 < currentSteps.length) {
      const nextStep = currentSteps[stepIdx + 1];
      if (nextStep?.typeField) {
        applyWalkField(nextStep.typeField, "");
      }
      setStepIdx((i) => i + 1);
      setTypedChars(0);
      setWalkPhase("gliding");
      setIsWalkPaused(true);
    } else {
      setIsWalkPaused(false);
      setWalkPhase("done");
    }
  };

  const walkHandlersRef = useRef({
    applyWalkField,
    executeWalkStepAction,
    isFullscreen,
  });
  walkHandlersRef.current = { applyWalkField, executeWalkStepAction, isFullscreen };

  // Cursor bounding-box tracking
  useEffect(() => {
    if (!walkId || walkPhase === "idle" || walkPhase === "done" || !currentWalkStep) return;
    const raf = requestAnimationFrame(() => {
      const root = walkHandlersRef.current.isFullscreen
        ? fullscreenRootRef.current
        : inlineRootRef.current;
      if (!root) return;
      const el = root.querySelector(`[data-dvwa-target="${currentWalkStep.target}"]`) as HTMLElement | null;
      if (!el) return;
      const rootRect = root.getBoundingClientRect();
      const elRect = el.getBoundingClientRect();
      setCursorPos({
        x: Math.max(18, Math.min(rootRect.width - 24, elRect.left - rootRect.left + Math.min(elRect.width * 0.65, 92))),
        y: Math.max(18, Math.min(rootRect.height - 24, elRect.top - rootRect.top + elRect.height * 0.55)),
      });
    });
    return () => cancelAnimationFrame(raf);
  }, [walkId, walkPhase, stepIdx, activePage, isFullscreen, currentWalkStep]);

  // Phase driving effect for glide -> typing -> acting -> observing
  useEffect(() => {
    if (!walkId || isWalkPaused || walkPhase === "idle" || walkPhase === "done") return;
    const steps = DVWA_WALKTHROUGHS[walkId].steps;
    const step = steps[stepIdx];
    if (!step) {
      setWalkPhase("done");
      return;
    }

    if (walkPhase === "typing") {
      const str = step.typeValue ?? "";
      const field = step.typeField;
      if (!field || typedChars >= str.length) {
        setWalkPhase("acting");
        return;
      }
      const delay = walkSpeed === "slow" ? 65 : walkSpeed === "fast" ? 18 : 36;
      const t = setTimeout(() => {
        const next = typedChars + 1;
        walkHandlersRef.current.applyWalkField(field, str.slice(0, next));
        setTypedChars(next);
        if (next >= str.length) setWalkPhase("acting");
      }, delay);
      return () => clearTimeout(t);
    }

    const timing = WALK_TIMINGS[walkSpeed];
    const wait =
      walkPhase === "acting" ? timing.act : walkPhase === "observing" ? timing.observe : timing.glide;

    const t = setTimeout(() => {
      if (walkPhase === "gliding") {
        if (step.typeField && step.typeValue) {
          setTypedChars(0);
          walkHandlersRef.current.applyWalkField(step.typeField, "");
          setWalkPhase("typing");
        } else {
          setWalkPhase("acting");
        }
      } else if (walkPhase === "acting") {
        walkHandlersRef.current.executeWalkStepAction(step);
        setWalkPhase("observing");
      } else if (walkPhase === "observing") {
        if (stepIdx + 1 < steps.length) {
          const nextStep = steps[stepIdx + 1];
          if (nextStep?.typeField) {
            walkHandlersRef.current.applyWalkField(nextStep.typeField, "");
          }
          setStepIdx((i) => i + 1);
          setTypedChars(0);
          setWalkPhase("gliding");
        } else {
          setWalkPhase("done");
        }
      }
    }, wait);
    return () => clearTimeout(t);
  }, [walkId, walkPhase, stepIdx, typedChars, isWalkPaused, walkSpeed]);

  const currentItem = PAGE_MAP[activePage] ?? PAGE_MAP.home;
  const cursorGlideMs = walkSpeed === "slow" ? 1100 : walkSpeed === "fast" ? 420 : 800;
  const helpSource = getHelpAndSource(activePage, securityLevel);

  const renderBrowserWindow = (fullscreenMode: boolean) => (
    <div
      ref={fullscreenMode ? fullscreenRootRef : inlineRootRef}
      className={`relative flex flex-col overflow-hidden rounded-lg border border-zinc-400/70 bg-[#dee1e6] text-zinc-900 shadow-lg ${
        fullscreenMode ? "h-full w-full" : ""
      }`}
    >
      {/* Virtual Pointer Overlay (No % text on cursor) */}
      {walkId && walkPhase !== "idle" && walkPhase !== "done" && (
        <div
          aria-hidden="true"
          style={{
            left: `${cursorPos.x}px`,
            top: `${cursorPos.y}px`,
            transitionProperty: "left, top",
            transitionDuration: `${cursorGlideMs}ms`,
            transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
          }}
          className="pointer-events-none absolute z-40"
        >
          {walkPhase === "acting" && (
            <span className="absolute -left-3 -top-3 h-7 w-7 rounded-full border-2 border-[#6dc200] bg-[#9be817]/30 animate-ping" />
          )}
          <svg width="22" height="22" viewBox="0 0 24 24" className="drop-shadow-[0_2px_6px_rgba(0,0,0,0.65)]">
            <path
              d="M4 3L19 11.5L11.8 13.6L8.8 20.5L4 3Z"
              fill="#ffffff"
              stroke="#111827"
              strokeWidth="1.8"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      )}

      {/* 1. Browser Tab & Window Title Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-300 bg-[#dee1e6] px-3 pt-2 text-xs">
        <div className="flex min-w-0 items-center gap-2.5 pb-1">
          <WindowControls
            onClose={() => {
              if (fullscreenMode) setIsFullscreen(false);
              else navigateTo("home");
            }}
            closeTitle={fullscreenMode ? "Thoát toàn màn hình" : "Về trang Home DVWA"}
            onMinimize={() => setIsMinimized((v) => !v)}
            isMinimized={isMinimized}
            onMaximize={() => {
              setIsMinimized(false);
              setIsFullscreen((v) => !v);
            }}
            isMaximized={fullscreenMode}
          />

          <div className="inline-flex max-w-[260px] items-center gap-2 rounded-t-md border border-b-0 border-zinc-300 bg-[#f3f4f6] px-3 py-1 text-[11px] font-medium text-zinc-800">
            <span className="inline-flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-sm bg-[#2d3436] text-[8px] font-black text-[#9be817]">
              D
            </span>
            <span className="truncate">{currentItem.tabTitle}</span>
          </div>
          <Plus className="h-3.5 w-3.5 text-zinc-500" aria-hidden="true" />
        </div>

        <div className="flex flex-wrap items-center gap-2 pb-1">
          {walkId && walkPhase !== "idle" && (
            <div className="flex items-center gap-2 rounded border border-zinc-300 bg-white px-2 py-0.5">
              <div className="h-2 w-20 overflow-hidden rounded-full border border-zinc-300 bg-zinc-200 sm:w-28">
                <div
                  className={`h-full transition-all duration-300 ${
                    walkPhase === "done"
                      ? "bg-emerald-500"
                      : isWalkPaused
                      ? "bg-amber-500"
                      : "bg-[#6dc200]"
                  }`}
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <span className="font-mono text-[11px] font-bold text-zinc-800">{progressPct}%</span>
              <span className="font-mono text-[10px] text-zinc-500">
                {Math.min(stepIdx + 1, currentSteps.length)}/{currentSteps.length}
              </span>
              {walkPhase !== "done" && (
                <button
                  type="button"
                  onClick={() => setIsWalkPaused((p) => !p)}
                  className={`inline-flex cursor-pointer items-center gap-1 rounded px-2 py-0.5 text-[10.5px] font-semibold ${
                    isWalkPaused
                      ? "bg-emerald-600 text-white hover:bg-emerald-500"
                      : "bg-amber-100 text-amber-900 hover:bg-amber-200"
                  }`}
                >
                  {isWalkPaused ? (
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

          <button
            type="button"
            onClick={() => {
              setIsMinimized(false);
              setIsFullscreen((v) => !v);
            }}
            className="inline-flex cursor-pointer items-center gap-1 rounded border border-zinc-300 bg-white px-2 py-0.5 text-[11px] font-medium text-zinc-700 hover:bg-zinc-50"
          >
            {fullscreenMode ? (
              <>
                <Minimize2 className="h-3 w-3" aria-hidden="true" />
                <span>Thu nhỏ</span>
              </>
            ) : (
              <>
                <Maximize2 className="h-3 w-3" aria-hidden="true" />
                <span>Toàn màn hình</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Thin top progress line */}
      {walkId && walkPhase !== "idle" && (
        <div className="h-[2px] w-full bg-zinc-300">
          <div
            className={`h-full transition-all duration-300 ${
              walkPhase === "done"
                ? "bg-emerald-500"
                : isWalkPaused
                ? "bg-amber-500"
                : "bg-[#6dc200]"
            }`}
            style={{ width: `${progressPct}%` }}
          />
        </div>
      )}

      {!isMinimized && (
        <>
          {/* 2. Browser Navigation & URL Address Bar */}
          <div className="flex flex-wrap items-center gap-2 border-b border-zinc-300 bg-[#f3f4f6] px-3 py-1.5 text-xs">
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={historyIdx <= 0}
                onClick={() => {
                  const prevIdx = Math.max(0, historyIdx - 1);
                  const target = historyStack[prevIdx];
                  if (target) {
                    setHistoryIdx(prevIdx);
                    setActivePage(target);
                    setUrlInput(`http://${hostLabel}${PAGE_MAP[target].urlPath}`);
                  }
                }}
                aria-label="Quay lại"
                className="cursor-pointer rounded p-1 text-zinc-600 hover:bg-zinc-200 disabled:opacity-35"
              >
                <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
              <button
                type="button"
                disabled={historyIdx >= historyStack.length - 1}
                onClick={() => {
                  const nextIdx = Math.min(historyStack.length - 1, historyIdx + 1);
                  const target = historyStack[nextIdx];
                  if (target) {
                    setHistoryIdx(nextIdx);
                    setActivePage(target);
                    setUrlInput(`http://${hostLabel}${PAGE_MAP[target].urlPath}`);
                  }
                }}
                aria-label="Đi tới"
                className="cursor-pointer rounded p-1 text-zinc-600 hover:bg-zinc-200 disabled:opacity-35"
              >
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={handleUrlSubmit}
                aria-label="Tải lại trang"
                className="cursor-pointer rounded p-1 text-zinc-600 hover:bg-zinc-200"
              >
                <RotateCw className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>

            <div className="flex min-w-[220px] flex-1 items-center gap-2 rounded-full border border-zinc-300 bg-white px-3 py-1">
              <span className="inline-flex shrink-0 items-center gap-1 text-[11px] font-medium text-zinc-500">
                <AlertTriangle className="h-3 w-3 text-amber-600" aria-hidden="true" />
                Not secure
              </span>
              <span className="text-zinc-300">|</span>
              <input
                type="text"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleUrlSubmit();
                }}
                aria-label="Thanh địa chỉ trình duyệt DVWA"
                className="w-full bg-transparent font-mono text-[11.5px] text-zinc-800 focus:outline-none"
              />
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={toggleWaf}
                className={`inline-flex cursor-pointer items-center gap-1 rounded border px-2 py-1 text-[11px] font-semibold ${
                  isWafActive
                    ? "border-emerald-600 bg-emerald-50 text-emerald-800"
                    : "border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50"
                }`}
              >
                {isWafActive ? (
                  <ShieldCheck className="h-3 w-3 text-emerald-600" aria-hidden="true" />
                ) : (
                  <ShieldAlert className="h-3 w-3 text-zinc-400" aria-hidden="true" />
                )}
                <span>WAF ModSecurity: {isWafActive ? "ON" : "OFF"}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowCookiePopover((v) => !v)}
                className="inline-flex cursor-pointer items-center gap-1 rounded border border-zinc-300 bg-white px-2 py-1 text-[11px] font-medium text-zinc-700 hover:bg-zinc-50"
              >
                <Cookie className="h-3 w-3" aria-hidden="true" />
                <span>Headers &amp; Cookie</span>
              </button>
            </div>
          </div>

          {/* 2b. Compact Guided Demo Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-300 bg-[#e9ecef] px-3 py-1.5 text-[11px] text-zinc-700">
            <div className="flex flex-wrap items-center gap-1.5">
              {(["setup-login", "sqli-low", "sqli-impossible"] as const).map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => startWalkthrough(id)}
                  className={`inline-flex cursor-pointer items-center gap-1 rounded border px-2 py-0.5 font-medium transition-colors ${
                    walkId === id && walkPhase !== "idle"
                      ? "border-[#5aa300] bg-[#7ed321] font-semibold text-zinc-950"
                      : "border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50"
                  }`}
                >
                  <Play className="h-2.5 w-2.5" aria-hidden="true" />
                  <span>{DVWA_WALKTHROUGHS[id].label}</span>
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <div className="inline-flex rounded border border-zinc-300 bg-white p-0.5 font-mono text-[10px]">
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
                    onClick={() => setWalkSpeed(sp.id)}
                    className={`cursor-pointer rounded px-1.5 py-0.5 ${
                      walkSpeed === sp.id
                        ? "bg-zinc-800 font-bold text-white"
                        : "text-zinc-500 hover:text-zinc-900"
                    }`}
                  >
                    {sp.label}
                  </button>
                ))}
              </div>

              {walkId && walkPhase !== "idle" && (
                <>
                  {walkPhase !== "done" ? (
                    <>
                      <button
                        type="button"
                        onClick={() => setIsWalkPaused((p) => !p)}
                        className={`inline-flex cursor-pointer items-center gap-1 rounded px-2 py-0.5 font-semibold ${
                          isWalkPaused
                            ? "bg-emerald-600 text-white"
                            : "bg-amber-200 text-amber-950"
                        }`}
                      >
                        {isWalkPaused ? "Tiếp tục" : "Tạm dừng"}
                      </button>
                      {isWalkPaused && (
                        <button
                          type="button"
                          onClick={completeWalkStepAndPause}
                          className="inline-flex cursor-pointer items-center gap-1 rounded border border-zinc-300 bg-white px-2 py-0.5 text-zinc-800 hover:bg-zinc-50"
                        >
                          <SkipForward className="h-2.5 w-2.5" aria-hidden="true" />
                          <span>Xong bước này</span>
                        </button>
                      )}
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => startWalkthrough(walkId)}
                      className="inline-flex cursor-pointer items-center gap-1 rounded bg-emerald-600 px-2 py-0.5 font-semibold text-white"
                    >
                      <RotateCcw className="h-2.5 w-2.5" aria-hidden="true" />
                      <span>Chạy lại</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={stopWalkthrough}
                    className="inline-flex cursor-pointer items-center gap-1 rounded border border-zinc-300 bg-white px-2 py-0.5 text-zinc-600 hover:text-rose-700"
                  >
                    <Square className="h-2.5 w-2.5" aria-hidden="true" />
                    <span>Dừng</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Pause-to-Explain Banner */}
          {isWalkPaused && walkId && walkPhase !== "idle" && walkPhase !== "done" && currentWalkStep && (
            <div className="space-y-1 border-b border-amber-300 bg-amber-50 px-3.5 py-2 text-xs text-amber-950">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-mono text-[11px] font-bold">
                  ĐANG TẠM DỪNG ĐỂ GIẢI THÍCH · Bước {Math.min(stepIdx + 1, currentSteps.length)}/
                  {currentSteps.length}: {currentWalkStep.label}
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={completeWalkStepAndPause}
                    className="inline-flex cursor-pointer items-center gap-1 rounded border border-amber-400 bg-white px-2 py-0.5 text-[11px] font-medium hover:bg-amber-100"
                  >
                    <SkipForward className="h-3 w-3" aria-hidden="true" />
                    Xong bước này &amp; giữ dừng
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsWalkPaused(false)}
                    className="inline-flex cursor-pointer items-center gap-1 rounded bg-emerald-600 px-2.5 py-0.5 text-[11px] font-semibold text-white hover:bg-emerald-500"
                  >
                    <Play className="h-3 w-3" aria-hidden="true" />
                    Tiếp tục chạy
                  </button>
                </div>
              </div>
              <div>
                <strong>Tác dụng: </strong>
                {currentWalkStep.purpose}
              </div>
            </div>
          )}

          {/* HTTP Headers & Cookie Popover Bar */}
          {showCookiePopover && (
            <div className="border-b border-zinc-300 bg-zinc-900 px-4 py-2.5 font-mono text-[11px] text-zinc-200">
              <div className="flex items-center justify-between text-emerald-400">
                <span>HTTP Response Headers &amp; Cookie State ({hostLabel})</span>
                <button
                  type="button"
                  onClick={() => setShowCookiePopover(false)}
                  className="cursor-pointer text-zinc-400 hover:text-white"
                >
                  <X className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </div>
              <div className="mt-1.5 space-y-0.5">
                <div>
                  Server:{" "}
                  <span className={apachePatched ? "text-emerald-300" : "text-rose-300"}>
                    {apachePatched ? "Apache" : "Apache/2.4.25 (Debian)"}
                  </span>
                </div>
                <div>
                  Set-Cookie:{" "}
                  <span className={cookiePatched ? "text-emerald-300" : "text-amber-300"}>
                    PHPSESSID={cleanSess}; path=/
                    {cookiePatched ? "; HttpOnly; SameSite=Strict" : ""}
                  </span>
                </div>
                <div>
                  Set-Cookie: security={securityLevel}
                  {cookiePatched ? "; HttpOnly; SameSite=Strict" : ""}
                </div>
                {cookiePatched && (
                  <div className="text-emerald-300">
                    X-Content-Type-Options: nosniff · X-Frame-Options: SAMEORIGIN
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 3. Web Content Viewport */}
          <div
            className={`overflow-y-auto bg-[#f4f4f4] ${
              fullscreenMode ? "flex-1" : "max-h-[640px]"
            }`}
          >
            {!containerRunning ? (
              <div className="flex min-h-[380px] flex-col items-center justify-center bg-white p-8 text-center text-zinc-700">
                <AlertTriangle className="mb-3 h-10 w-10 text-zinc-400" aria-hidden="true" />
                <h3 className="text-lg font-bold text-zinc-900">This site can&apos;t be reached</h3>
                <p className="mt-1 text-sm text-zinc-600">
                  <strong className="font-mono">{hostLabel}</strong> refused to connect.
                </p>
                <div className="mt-3 font-mono text-xs text-zinc-500">ERR_CONNECTION_REFUSED</div>
                <p className="mt-4 max-w-md text-xs text-zinc-500">
                  Container DVWA đang ở trạng thái Stopped. Khởi động lại container bằng lệnh{" "}
                  <code className="font-mono text-zinc-800">docker start dvwa</code> hoặc nút Start trên Docker Desktop.
                </p>
              </div>
            ) : activePage === "login" || !loggedInUser ? (
              /* DVWA AUTHENTIC LOGIN PAGE */
              <div className="flex min-h-[430px] flex-col items-center justify-center bg-[#f4f4f4] p-6 font-sans text-[#333333]">
                <div className="w-full max-w-sm rounded border border-[#c8c8c8] bg-white p-6 shadow-sm">
                  <div className="mb-5 flex flex-col items-center">
                    <div className="flex items-center gap-2 rounded bg-[#2d3436] px-4 py-2 text-white">
                      <Lock className="h-5 w-5 text-[#9be817]" aria-hidden="true" />
                      <span className="text-base font-extrabold tracking-wide">
                        Damn Vulnerable Web App
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="mb-1 block font-bold text-[#333333]">Username</label>
                      <input
                        data-dvwa-target="input-login-user"
                        type="text"
                        value={loginUser}
                        onChange={(e) => setLoginUser(e.target.value)}
                        className="w-full border border-[#a9a9a9] bg-white px-2.5 py-1.5 text-xs text-[#111111] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block font-bold text-[#333333]">Password</label>
                      <input
                        data-dvwa-target="input-login-pass"
                        type="password"
                        value={loginPass}
                        onChange={(e) => setLoginPass(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleLoginSubmit();
                        }}
                        className="w-full border border-[#a9a9a9] bg-white px-2.5 py-1.5 text-xs text-[#111111] focus:outline-none"
                      />
                    </div>

                    {loginMsg && (
                      <div className="border border-rose-300 bg-rose-50 px-2.5 py-1.5 text-xs font-semibold text-rose-700">
                        {loginMsg}
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2">
                      <button
                        data-dvwa-target="btn-login-submit"
                        type="button"
                        onClick={() => handleLoginSubmit()}
                        className="cursor-pointer border border-[#8e8e8e] bg-gradient-to-b from-[#eeeeee] to-[#cccccc] px-4 py-1.5 text-xs font-bold text-[#111111] hover:from-[#f6f6f6]"
                      >
                        Login
                      </button>
                      <button
                        type="button"
                        onClick={() => navigateTo("setup")}
                        className="cursor-pointer text-[11px] font-semibold text-[#4c8c00] underline"
                      >
                        Setup / Reset DB
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* AUTHENTIC DVWA AUTHENTICATED LAYOUT */
              <div className="flex flex-col gap-3 bg-[#f4f4f4] p-3 font-sans text-[#222222] md:flex-row">
                {/* Classic 4-Group Left Sidebar */}
                <aside className="w-full shrink-0 space-y-2.5 md:w-[192px]">
                  {SIDEBAR_GROUPS.map((group, gIdx) => (
                    <div key={gIdx} className="flex flex-col gap-[2px]">
                      {group.map((item) => {
                        const isActive = activePage === item.id;
                        const targetAttr =
                          item.id === "setup"
                            ? "nav-setup"
                            : item.id === "login"
                            ? "nav-login"
                            : item.id === "security"
                            ? "nav-security"
                            : item.id === "sqli"
                            ? "nav-sqli"
                            : undefined;
                        return (
                          <button
                            key={item.id}
                            data-dvwa-target={targetAttr}
                            type="button"
                            onClick={() => navigateTo(item.id)}
                            className={`cursor-pointer border px-2.5 py-[5px] text-left text-[12px] font-bold transition-colors ${
                              isActive
                                ? "border-[#5ca300] bg-gradient-to-b from-[#9ce818] to-[#6ec300] text-white"
                                : "border-[#a6a6a6] bg-gradient-to-b from-[#e4e4e4] to-[#c4c4c4] text-[#111111] hover:from-[#efefef] hover:to-[#d4d4d4]"
                            }`}
                          >
                            {item.label}
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </aside>

                {/* Main White DVWA Content Column */}
                <main className="flex min-w-0 flex-1 flex-col justify-between border border-[#d4d4d4] bg-white p-5 sm:p-6">
                  <div>
                    {/* HOME PAGE — Exact replica of screenshot */}
                    {activePage === "home" && (
                      <div className="space-y-4 text-[13px] leading-relaxed text-[#262626]">
                        <h2 className="text-2xl font-bold text-[#111111]">
                          Welcome to Damn Vulnerable Web Application!
                        </h2>
                        <p>
                          Damn Vulnerable Web Application (DVWA) is a PHP/MySQL web application that is damn
                          vulnerable. Its main goal is to be an aid for security professionals to test their
                          skills and tools in a legal environment, help web developers better understand the
                          processes of securing web applications and to aid both students &amp; teachers to learn
                          about web application security in a controlled class room environment.
                        </p>
                        <p>
                          The aim of DVWA is to <strong>practice some of the most common web vulnerabilities</strong>
                          , with <strong>various levels of difficultly</strong>, with a simple straightforward
                          interface.
                        </p>

                        <h3 className="pt-2 text-xl font-bold text-[#111111]">General Instructions</h3>
                        <p>
                          It is up to the user how they approach DVWA. Either by working through every module at
                          a fixed level, or selecting any module and working up to reach the highest level they
                          can before moving onto the next one. There is not a fixed object to complete a module;
                          however users should feel that they have successfully exploited the system as best as
                          they possible could by using that particular vulnerability.
                        </p>
                        <p>
                          Please note, there are <strong>both documented and undocumented vulnerability</strong>{" "}
                          with this software. This is intentional. You are encouraged to try and discover as many
                          issues as possible.
                        </p>
                        <p>
                          DVWA also includes a Web Application Firewall (WAF), PHPIDS, which can be enabled at any
                          stage to further increase the difficulty. This will demonstrate how adding another layer
                          of security may block certain malicious actions. Note, there are also various public
                          methods at bypassing these protections (so this can be seen as an extension for more
                          advanced users)!
                        </p>
                        <p>
                          There is a help button at the bottom of each page, which allows you to view hints &amp;
                          tips for that vulnerability. There are also additional links for further background
                          reading, which relates to that security issue.
                        </p>

                        <h3 className="pt-2 text-xl font-bold text-[#111111]">WARNING!</h3>
                        <p>
                          Damn Vulnerable Web Application is damn vulnerable!{" "}
                          <strong>
                            Do not upload it to your hosting provider&apos;s public html folder or any Internet
                            facing servers
                          </strong>
                          , as they will be compromised. It is recommend using a virtual machine (such as{" "}
                          <span className="font-semibold text-[#55a600] underline">VirtualBox</span> or{" "}
                          <span className="font-semibold text-[#55a600] underline">VMware</span>), which is set to
                          NAT networking mode. Inside a guest machine, you can downloading and install{" "}
                          <span className="font-semibold text-[#55a600] underline">XAMPP</span> for the web
                          server and database.
                        </p>

                        <h3 className="pt-2 text-xl font-bold text-[#111111]">Disclaimer</h3>
                        <p className="text-[12.5px] text-[#333333]">
                          We do not take responsibility for the way in which any one uses this application (DVWA).
                          We have made the purposes of the application clear and it should not be used
                          maliciously.
                        </p>
                      </div>
                    )}

                    {/* INSTRUCTIONS */}
                    {activePage === "instructions" && (
                      <div className="space-y-3 text-[13px] leading-relaxed">
                        <h2 className="text-2xl font-bold text-[#111111]">Instructions</h2>
                        <p>
                          Default Credentials: <code className="bg-[#f0f0f0] px-1.5 py-0.5 font-mono">admin</code> /{" "}
                          <code className="bg-[#f0f0f0] px-1.5 py-0.5 font-mono">password</code>. Other test accounts:{" "}
                          <code className="bg-[#f0f0f0] px-1 py-0.5 font-mono">gordonb / abc123</code>,{" "}
                          <code className="bg-[#f0f0f0] px-1 py-0.5 font-mono">1337 / charley</code>,{" "}
                          <code className="bg-[#f0f0f0] px-1 py-0.5 font-mono">pablo / letmein</code>,{" "}
                          <code className="bg-[#f0f0f0] px-1 py-0.5 font-mono">smithy / password</code>.
                        </p>
                        <div className="border border-[#cccccc] bg-[#eeeeee] p-3 text-xs">
                          <div className="font-bold">Security Levels:</div>
                          <ul className="mt-1 list-inside list-disc space-y-1">
                            <li><strong>Low:</strong> Không kiểm tra đầu vào — kiểm thử cơ bản và khai thác trực tiếp.</li>
                            <li><strong>Medium:</strong> Có lọc sơ sài hoặc kiểm tra ở mức yếu, có thể bypass bằng kỹ thuật phù hợp.</li>
                            <li><strong>High:</strong> Bộ lọc nâng cao hoặc tách popup phiên, vẫn còn điểm vượt qua đặc thù.</li>
                            <li><strong>Impossible:</strong> Mã nguồn an toàn chuẩn OWASP (Prepared Statements, htmlspecialchars, CSRF tokens).</li>
                          </ul>
                        </div>
                      </div>
                    )}

                    {/* SETUP / RESET DB */}
                    {activePage === "setup" && (
                      <div className="space-y-4 text-[13px]">
                        <h2 className="text-2xl font-bold text-[#111111]">Database Setup</h2>
                        <div className="space-y-1 border border-[#cccccc] bg-[#eeeeee] p-3.5 font-mono text-xs">
                          <div>Backend / Server: {apachePatched ? "Apache" : "Apache/2.4.25 (Debian)"}</div>
                          <div>PHP version: 7.0.33-0+deb9u6</div>
                          <div>
                            Database account:{" "}
                            <span className="font-bold text-[#4c8c00]">
                              {leastPrivApplied ? "dvwa_svc@localhost" : "root@localhost"}
                            </span>
                          </div>
                          <div>PHP function allow_url_fopen: <span className="text-[#4c8c00]">Enabled</span></div>
                          <div>PHP function allow_url_include: <span className="text-[#4c8c00]">Enabled</span></div>
                          <div>PHP module gd: <span className="text-[#4c8c00]">Installed</span></div>
                          <div>reCAPTCHA key: <span className="text-amber-700">Missing (using local verification)</span></div>
                        </div>

                        <button
                          data-dvwa-target="btn-reset-db"
                          type="button"
                          onClick={handleResetDb}
                          className="cursor-pointer border border-[#8e8e8e] bg-gradient-to-b from-[#eeeeee] to-[#cccccc] px-3.5 py-1.5 text-xs font-bold text-[#111111] hover:from-[#f6f6f6]"
                        >
                          Create / Reset Database
                        </button>

                        {setupLogs && (
                          <div className="space-y-1 border border-[#72b520] bg-[#f4fbe9] p-3 font-mono text-xs text-[#2d5a00]">
                            {setupLogs.map((l, i) => (
                              <div key={i}>{l}</div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* BRUTE FORCE */}
                    {activePage === "brute" && (
                      <div className="space-y-4 text-[13px]">
                        <h2 className="text-2xl font-bold text-[#111111]">Vulnerability: Brute Force</h2>
                        <div className="space-y-2.5 border border-[#cccccc] bg-[#eeeeee] p-4">
                          <h3 className="font-bold">Login</h3>
                          <div className="flex flex-wrap items-center gap-2 text-xs">
                            <span className="w-24">Username:</span>
                            <input
                              type="text"
                              value={bruteUser}
                              onChange={(e) => setBruteUser(e.target.value)}
                              className="border border-[#a9a9a9] bg-white px-2 py-1 text-xs"
                            />
                          </div>
                          <div className="flex flex-wrap items-center gap-2 text-xs">
                            <span className="w-24">Password:</span>
                            <input
                              type="password"
                              value={brutePass}
                              onChange={(e) => setBrutePass(e.target.value)}
                              className="border border-[#a9a9a9] bg-white px-2 py-1 text-xs"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={handleBruteSubmit}
                            className="cursor-pointer border border-[#8e8e8e] bg-gradient-to-b from-[#eeeeee] to-[#cccccc] px-3 py-1 text-xs font-bold text-[#111111]"
                          >
                            Login
                          </button>
                        </div>

                        {bruteResult && (
                          <pre
                            className={`border p-3 font-mono text-xs ${
                              bruteResult.ok
                                ? "border-emerald-400 bg-emerald-50 text-emerald-900"
                                : "border-rose-300 bg-rose-50 text-rose-800"
                            }`}
                          >
                            {bruteResult.msg}
                          </pre>
                        )}
                      </div>
                    )}

                    {/* COMMAND INJECTION */}
                    {activePage === "exec" && (
                      <div className="space-y-4 text-[13px]">
                        <h2 className="text-2xl font-bold text-[#111111]">
                          Vulnerability: Command Injection
                        </h2>
                        <div className="space-y-3 border border-[#cccccc] bg-[#eeeeee] p-4">
                          <div className="font-bold">Ping a device</div>
                          <div className="flex flex-wrap items-center gap-2 text-xs">
                            <label htmlFor="dvwa-exec-ip">Enter an IP address:</label>
                            <input
                              id="dvwa-exec-ip"
                              type="text"
                              value={execInput}
                              onChange={(e) => setExecInput(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") handleExecSubmit();
                              }}
                              className="w-64 border border-[#a9a9a9] bg-white px-2 py-1 font-mono text-xs"
                            />
                            <button
                              type="button"
                              onClick={handleExecSubmit}
                              className="cursor-pointer border border-[#8e8e8e] bg-gradient-to-b from-[#eeeeee] to-[#cccccc] px-3 py-1 text-xs font-bold text-[#111111]"
                            >
                              Submit
                            </button>
                          </div>
                        </div>

                        {execOutput && (
                          <pre className="overflow-x-auto border border-[#cccccc] bg-[#fafafa] p-3 font-mono text-xs text-[#111111]">
                            {execOutput}
                          </pre>
                        )}
                      </div>
                    )}

                    {/* CSRF */}
                    {activePage === "csrf" && (
                      <div className="space-y-4 text-[13px]">
                        <h2 className="text-2xl font-bold text-[#111111]">
                          Vulnerability: Cross Site Request Forgery (CSRF)
                        </h2>
                        <div className="space-y-2.5 border border-[#cccccc] bg-[#eeeeee] p-4 text-xs">
                          <div className="font-bold">Change your admin password:</div>
                          {(securityLevel === "high" || securityLevel === "impossible") && (
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="w-36">Current password:</span>
                              <input
                                type="password"
                                value={csrfCurrent}
                                onChange={(e) => setCsrfCurrent(e.target.value)}
                                className="border border-[#a9a9a9] bg-white px-2 py-1"
                              />
                            </div>
                          )}
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="w-36">New password:</span>
                            <input
                              type="password"
                              value={csrfPass1}
                              onChange={(e) => setCsrfPass1(e.target.value)}
                              className="border border-[#a9a9a9] bg-white px-2 py-1"
                            />
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="w-36">Confirm new password:</span>
                            <input
                              type="password"
                              value={csrfPass2}
                              onChange={(e) => setCsrfPass2(e.target.value)}
                              className="border border-[#a9a9a9] bg-white px-2 py-1"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={handleCsrfSubmit}
                            className="cursor-pointer border border-[#8e8e8e] bg-gradient-to-b from-[#eeeeee] to-[#cccccc] px-3 py-1 font-bold text-[#111111]"
                          >
                            Change
                          </button>
                        </div>
                        {csrfMsg && (
                          <pre className="border border-[#cccccc] bg-[#fafafa] p-3 font-mono text-xs">
                            {csrfMsg}
                          </pre>
                        )}
                      </div>
                    )}

                    {/* FILE INCLUSION */}
                    {activePage === "fi" && (
                      <div className="space-y-4 text-[13px]">
                        <h2 className="text-2xl font-bold text-[#111111]">
                          Vulnerability: File Inclusion
                        </h2>
                        <div className="flex flex-wrap items-center gap-2 border border-[#cccccc] bg-[#eeeeee] p-3 text-xs">
                          <span>?page=</span>
                          <input
                            type="text"
                            value={fiPage}
                            onChange={(e) => {
                              setFiPage(e.target.value);
                              setUrlInput(`http://${hostLabel}/vulnerabilities/fi/?page=${e.target.value}`);
                            }}
                            className="min-w-[220px] flex-1 border border-[#a9a9a9] bg-white px-2 py-1 font-mono"
                          />
                          <div className="flex items-center gap-1.5">
                            {["include.php", "file1.php", "file2.php", "file3.php"].map((f) => (
                              <button
                                key={f}
                                type="button"
                                onClick={() => {
                                  setFiPage(f);
                                  setUrlInput(`http://${hostLabel}/vulnerabilities/fi/?page=${f}`);
                                }}
                                className="cursor-pointer border border-[#8e8e8e] bg-white px-2 py-0.5 font-mono text-[11px] hover:bg-zinc-100"
                              >
                                {f}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="border border-[#cccccc] bg-[#fafafa] p-3 font-mono text-xs">
                          {(() => {
                            const f = fiPage.trim();
                            if (
                              securityLevel === "impossible" &&
                              !["include.php", "file1.php", "file2.php", "file3.php"].includes(f)
                            ) {
                              return "ERROR: File not found!";
                            }
                            if (f === "file1.php") return "Hello admin — Your IP address is: 127.0.0.1";
                            if (f === "file2.php") return "\"I needed a password eight characters long so I picked Snow White and the Seven Dwarves.\"";
                            if (f === "file3.php") return "Welcome back admin! Your user agent is Mozilla/5.0";
                            if (
                              (securityLevel === "low" && f.includes("passwd")) ||
                              (securityLevel === "medium" && (f === "/etc/passwd" || f.includes("....//"))) ||
                              (securityLevel === "high" && f.startsWith("file://"))
                            ) {
                              return `root:x:0:0:root:/root:/bin/bash\nwww-data:x:33:33:www-data:/var/www:/usr/sbin/nologin\nmysql:x:106:111:MySQL Server:/nonexistent:/bin/false`;
                            }
                            return `Included: ${f || "include.php"} (Security: ${securityLevel})`;
                          })()}
                        </div>
                      </div>
                    )}

                    {/* FILE UPLOAD */}
                    {activePage === "upload" && (
                      <div className="space-y-4 text-[13px]">
                        <h2 className="text-2xl font-bold text-[#111111]">
                          Vulnerability: File Upload
                        </h2>
                        <div className="space-y-3 border border-[#cccccc] bg-[#eeeeee] p-4 text-xs">
                          <div>Choose an image to upload:</div>
                          <div className="flex flex-wrap items-center gap-2">
                            <select
                              value={uploadPreset}
                              onChange={(e) =>
                                setUploadPreset(
                                  e.target.value as "avatar.png" | "shell.php" | "shell.php.jpeg"
                                )
                              }
                              className="border border-[#a9a9a9] bg-white px-2.5 py-1 font-mono"
                            >
                              <option value="avatar.png">avatar.png (image/png)</option>
                              <option value="shell.php">shell.php (application/x-php)</option>
                              <option value="shell.php.jpeg">shell.php.jpeg (image/jpeg)</option>
                            </select>
                            <button
                              type="button"
                              onClick={() => {
                                if (securityLevel === "low") {
                                  setUploadMsg({
                                    ok: true,
                                    text: `../../hackable/uploads/${uploadPreset} succesfully uploaded!`,
                                    shellReady: uploadPreset.endsWith(".php"),
                                  });
                                } else if (securityLevel === "medium") {
                                  const ok = uploadPreset !== "shell.php";
                                  setUploadMsg({
                                    ok,
                                    text: ok
                                      ? `../../hackable/uploads/${uploadPreset} succesfully uploaded!`
                                      : "Your image was not uploaded. We can only accept JPEG or PNG images.",
                                  });
                                } else if (securityLevel === "high") {
                                  const ok = uploadPreset === "avatar.png" || uploadPreset === "shell.php.jpeg";
                                  setUploadMsg({
                                    ok,
                                    text: ok
                                      ? `../../hackable/uploads/${uploadPreset} succesfully uploaded!`
                                      : "Your image was not uploaded.",
                                  });
                                } else {
                                  const ok = uploadPreset === "avatar.png";
                                  setUploadMsg({
                                    ok,
                                    text: ok
                                      ? `../../hackable/uploads/9b3f2e11.png succesfully uploaded (re-encoded with GD)!`
                                      : "Your image was not uploaded.",
                                  });
                                }
                              }}
                              className="cursor-pointer border border-[#8e8e8e] bg-gradient-to-b from-[#eeeeee] to-[#cccccc] px-3 py-1 font-bold text-[#111111]"
                            >
                              Upload
                            </button>
                          </div>
                        </div>

                        {uploadMsg && (
                          <div className="space-y-2 border border-[#cccccc] bg-[#fafafa] p-3 font-mono text-xs">
                            <pre className={uploadMsg.ok ? "text-emerald-800" : "text-rose-700"}>
                              {uploadMsg.text}
                            </pre>
                            {uploadMsg.shellReady && (
                              <div className="flex flex-wrap items-center gap-2 border-t border-zinc-200 pt-2">
                                <span>/hackable/uploads/shell.php?cmd=</span>
                                <input
                                  type="text"
                                  value={webshellCmd}
                                  onChange={(e) => setWebshellCmd(e.target.value)}
                                  className="w-36 border border-zinc-400 bg-white px-2 py-0.5"
                                />
                                <button
                                  type="button"
                                  onClick={() =>
                                    setWebshellOut(
                                      webshellCmd.includes("id")
                                        ? "uid=33(www-data) gid=33(www-data) groups=33(www-data)"
                                        : "www-data"
                                    )
                                  }
                                  className="cursor-pointer border border-zinc-400 bg-zinc-100 px-2 py-0.5 font-bold"
                                >
                                  Execute
                                </button>
                                {webshellOut && <span className="text-rose-700">{webshellOut}</span>}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* INSECURE CAPTCHA */}
                    {activePage === "captcha" && (
                      <div className="space-y-4 text-[13px]">
                        <h2 className="text-2xl font-bold text-[#111111]">
                          Vulnerability: Insecure CAPTCHA
                        </h2>
                        <div className="space-y-2.5 border border-[#cccccc] bg-[#eeeeee] p-4 text-xs">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-semibold">Hidden POST step=</span>
                            {(["1", "2"] as const).map((s) => (
                              <button
                                key={s}
                                type="button"
                                onClick={() => setCaptchaStepParam(s)}
                                className={`cursor-pointer border px-2 py-0.5 font-mono ${
                                  captchaStepParam === s
                                    ? "border-zinc-900 bg-zinc-800 font-bold text-white"
                                    : "border-zinc-400 bg-white text-zinc-800"
                                }`}
                              >
                                step={s}
                              </button>
                            ))}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="w-32">New password:</span>
                            <input
                              type="password"
                              value={captchaP1}
                              onChange={(e) => setCaptchaP1(e.target.value)}
                              className="border border-[#a9a9a9] bg-white px-2 py-1"
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="w-32">Confirm password:</span>
                            <input
                              type="password"
                              value={captchaP2}
                              onChange={(e) => setCaptchaP2(e.target.value)}
                              className="border border-[#a9a9a9] bg-white px-2 py-1"
                            />
                          </div>
                          <label className="inline-flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={captchaChecked}
                              onChange={(e) => setCaptchaChecked(e.target.checked)}
                            />
                            <span>I&apos;m not a robot (reCAPTCHA)</span>
                          </label>
                          <div>
                            <button
                              type="button"
                              onClick={() => {
                                if (!captchaP1 || captchaP1 !== captchaP2) {
                                  setCaptchaMsg("Passwords did not match.");
                                  return;
                                }
                                if (
                                  (securityLevel === "low" || securityLevel === "medium") &&
                                  captchaStepParam === "2"
                                ) {
                                  setCaptchaMsg("Password Changed! (Bypassed step=1 reCAPTCHA check via step=2)");
                                  return;
                                }
                                if (!captchaChecked) {
                                  setCaptchaMsg("The CAPTCHA was incorrect. Please try again.");
                                  return;
                                }
                                setCaptchaMsg("Password Changed!");
                              }}
                              className="cursor-pointer border border-[#8e8e8e] bg-gradient-to-b from-[#eeeeee] to-[#cccccc] px-3 py-1 font-bold text-[#111111]"
                            >
                              Change
                            </button>
                          </div>
                        </div>
                        {captchaMsg && (
                          <pre className="border border-[#cccccc] bg-[#fafafa] p-3 font-mono text-xs">
                            {captchaMsg}
                          </pre>
                        )}
                      </div>
                    )}

                    {/* SQL INJECTION */}
                    {activePage === "sqli" && (
                      <div className="space-y-4 text-[13px]">
                        <h2 className="text-2xl font-bold text-[#111111]">
                          Vulnerability: SQL Injection
                        </h2>

                        <div className="space-y-3 border border-[#cccccc] bg-[#eeeeee] p-4">
                          {securityLevel === "low" && (
                            <div className="flex flex-wrap items-center gap-2 text-xs">
                              <label htmlFor="dvwa-sqli-id">User ID:</label>
                              <input
                                id="dvwa-sqli-id"
                                data-dvwa-target="input-sqli-id"
                                type="text"
                                value={sqliInput}
                                onChange={(e) => setSqliInput(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") executeSqliQuery(sqliInput, true);
                                }}
                                className="w-64 border border-[#a9a9a9] bg-white px-2 py-1 font-mono text-xs"
                              />
                              <button
                                data-dvwa-target="btn-sqli-submit"
                                type="button"
                                onClick={() => executeSqliQuery(sqliInput, true)}
                                className="cursor-pointer border border-[#8e8e8e] bg-gradient-to-b from-[#eeeeee] to-[#cccccc] px-3 py-1 font-bold text-[#111111]"
                              >
                                Submit
                              </button>
                            </div>
                          )}

                          {securityLevel === "medium" && (
                            <div className="space-y-2 text-xs">
                              <div className="flex flex-wrap items-center gap-2">
                                <label htmlFor="dvwa-sqli-sel">User ID:</label>
                                <select
                                  id="dvwa-sqli-sel"
                                  value={sqliMediumSelect}
                                  onChange={(e) => setSqliMediumSelect(e.target.value)}
                                  className="border border-[#a9a9a9] bg-white px-2 py-1 font-mono text-xs"
                                >
                                  {["1", "2", "3", "4", "5"].map((id) => (
                                    <option key={id} value={id}>
                                      {id}
                                    </option>
                                  ))}
                                </select>
                                <button
                                  type="button"
                                  onClick={() =>
                                    executeSqliQuery(
                                      sqliUseMediumOverride ? sqliInput : sqliMediumSelect,
                                      true
                                    )
                                  }
                                  className="cursor-pointer border border-[#8e8e8e] bg-gradient-to-b from-[#eeeeee] to-[#cccccc] px-3 py-1 font-bold text-[#111111]"
                                >
                                  Submit
                                </button>
                                <label className="ml-2 inline-flex cursor-pointer items-center gap-1.5 text-[11px]">
                                  <input
                                    type="checkbox"
                                    checked={sqliUseMediumOverride}
                                    onChange={(e) => setSqliUseMediumOverride(e.target.checked)}
                                  />
                                  <span>POST Raw Tamper</span>
                                </label>
                              </div>
                              {sqliUseMediumOverride && (
                                <div className="flex items-center gap-2 font-mono text-[11px]">
                                  <span>POST body id=</span>
                                  <input
                                    type="text"
                                    value={sqliInput}
                                    onChange={(e) => setSqliInput(e.target.value)}
                                    className="w-72 border border-[#a9a9a9] bg-white px-2 py-0.5"
                                  />
                                </div>
                              )}
                            </div>
                          )}

                          {securityLevel === "high" && (
                            <div className="space-y-2 text-xs">
                              <button
                                type="button"
                                onClick={() => setSqliHighModalOpen(true)}
                                className="cursor-pointer font-semibold text-[#4c8c00] underline"
                              >
                                Click here to change your ID.
                              </button>
                              <div className="font-mono text-[11px] text-zinc-600">
                                Current $_SESSION[&apos;id&apos;]: {sqliHighSessionId}
                              </div>
                            </div>
                          )}

                          {securityLevel === "impossible" && (
                            <div className="space-y-2 text-xs">
                              <div className="flex flex-wrap items-center gap-2">
                                <label htmlFor="dvwa-sqli-imp">User ID:</label>
                                <input
                                  id="dvwa-sqli-imp"
                                  data-dvwa-target="input-sqli-id"
                                  type="text"
                                  value={sqliInput}
                                  onChange={(e) => setSqliInput(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") executeSqliQuery(sqliInput, sqliIncludeToken);
                                  }}
                                  className="w-64 border border-[#a9a9a9] bg-white px-2 py-1 font-mono text-xs"
                                />
                                <button
                                  data-dvwa-target="btn-sqli-submit"
                                  type="button"
                                  onClick={() => executeSqliQuery(sqliInput, sqliIncludeToken)}
                                  className="cursor-pointer border border-[#8e8e8e] bg-gradient-to-b from-[#eeeeee] to-[#cccccc] px-3 py-1 font-bold text-[#111111]"
                                >
                                  Submit
                                </button>
                              </div>
                              <div className="flex flex-wrap items-center gap-3 font-mono text-[11px] text-zinc-600">
                                <label className="inline-flex cursor-pointer items-center gap-1.5">
                                  <input
                                    type="checkbox"
                                    checked={sqliIncludeToken}
                                    onChange={(e) => setSqliIncludeToken(e.target.checked)}
                                  />
                                  <span>user_token={activeToken.slice(0, 12)}...</span>
                                </label>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* SQLi High Popup Modal */}
                        {sqliHighModalOpen && (
                          <div className="border border-zinc-400 bg-white p-3.5 shadow">
                            <div className="mb-2 flex items-center justify-between text-xs font-bold">
                              <span>Change session $_SESSION[&apos;id&apos;]</span>
                              <button
                                type="button"
                                onClick={() => setSqliHighModalOpen(false)}
                                className="cursor-pointer text-zinc-500"
                              >
                                <X className="h-3.5 w-3.5" aria-hidden="true" />
                              </button>
                            </div>
                            <div className="flex items-center gap-2 text-xs">
                              <span>User ID:</span>
                              <input
                                type="text"
                                value={sqliHighSessionId}
                                onChange={(e) => setSqliHighSessionId(e.target.value)}
                                className="w-56 border border-[#a9a9a9] px-2 py-1 font-mono"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  setSqliHighModalOpen(false);
                                  executeSqliQuery(sqliHighSessionId, true);
                                }}
                                className="cursor-pointer border border-[#8e8e8e] bg-[#eeeeee] px-3 py-1 font-bold"
                              >
                                Submit
                              </button>
                            </div>
                          </div>
                        )}

                        {sqliOutput && (
                          <div className="space-y-1.5 font-mono text-xs">
                            {sqliOutput.kind === "rows" &&
                              sqliOutput.rows?.map((r, i) => (
                                <pre
                                  key={i}
                                  className="overflow-x-auto border border-[#cccccc] bg-[#fafafa] px-3 py-2 text-[#111111]"
                                >
                                  {`ID: ${r.id}\nFirst name: ${r.first}\nSurname: ${r.surname}`}
                                </pre>
                              ))}
                            {sqliOutput.kind === "error" && (
                              <pre className="overflow-x-auto border border-rose-300 bg-rose-50 px-3 py-2 text-rose-800">
                                {sqliOutput.message}
                              </pre>
                            )}
                            {sqliOutput.kind === "waf" && (
                              <pre className="overflow-x-auto border border-rose-400 bg-rose-100 px-3 py-2 font-bold text-rose-900">
                                {sqliOutput.message}
                              </pre>
                            )}
                            {sqliOutput.kind === "redirect" && (
                              <pre className="overflow-x-auto border border-amber-300 bg-amber-50 px-3 py-2 text-amber-900">
                                {sqliOutput.message}
                              </pre>
                            )}
                            {sqliOutput.kind === "empty" && (
                              <pre className="border border-[#cccccc] bg-[#fafafa] px-3 py-2 text-zinc-500">
                                (0 records matched — query skipped by is_numeric() / empty result)
                              </pre>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* SQLI BLIND */}
                    {activePage === "sqli_blind" && (
                      <div className="space-y-4 text-[13px]">
                        <h2 className="text-2xl font-bold text-[#111111]">
                          Vulnerability: SQL Injection (Blind)
                        </h2>
                        <div className="flex flex-wrap items-center gap-2 border border-[#cccccc] bg-[#eeeeee] p-4 text-xs">
                          <label htmlFor="dvwa-blind-id">User ID:</label>
                          <input
                            id="dvwa-blind-id"
                            type="text"
                            value={blindInput}
                            onChange={(e) => setBlindInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleRunBlind();
                            }}
                            className="w-64 border border-[#a9a9a9] bg-white px-2 py-1 font-mono"
                          />
                          <button
                            type="button"
                            onClick={() => handleRunBlind()}
                            className="cursor-pointer border border-[#8e8e8e] bg-gradient-to-b from-[#eeeeee] to-[#cccccc] px-3 py-1 font-bold text-[#111111]"
                          >
                            Submit
                          </button>
                        </div>
                        {blindOutput && (
                          <pre className="border border-[#cccccc] bg-[#fafafa] p-3 font-mono text-xs">
                            {blindOutput}
                          </pre>
                        )}
                      </div>
                    )}

                    {/* WEAK SESSION IDS */}
                    {activePage === "weak_id" && (
                      <div className="space-y-4 text-[13px]">
                        <h2 className="text-2xl font-bold text-[#111111]">
                          Vulnerability: Weak Session IDs
                        </h2>
                        <p className="text-xs text-zinc-600">
                          This page will set a new cookie called <code className="font-mono">dvwaSession</code>{" "}
                          each time the button is clicked.
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            const nextCount = weakIdCounter + 1;
                            setWeakIdCounter(nextCount);
                            const val =
                              securityLevel === "low"
                                ? String(nextCount)
                                : securityLevel === "medium"
                                ? String(Math.floor(Date.now() / 1000))
                                : securityLevel === "high"
                                ? makePseudoHash(String(nextCount))
                                : makePseudoHash(`${Date.now()}-${Math.random()}`);
                            setDvwaSessionCookie(val);
                          }}
                          className="cursor-pointer border border-[#8e8e8e] bg-gradient-to-b from-[#eeeeee] to-[#cccccc] px-3 py-1 text-xs font-bold text-[#111111]"
                        >
                          Generate
                        </button>
                        <div className="border border-[#cccccc] bg-[#fafafa] p-3 font-mono text-xs">
                          Set-Cookie: dvwaSession={dvwaSessionCookie}
                        </div>
                      </div>
                    )}

                    {/* XSS DOM */}
                    {activePage === "xss_d" && (
                      <div className="space-y-4 text-[13px]">
                        <h2 className="text-2xl font-bold text-[#111111]">
                          Vulnerability: DOM Based Cross Site Scripting (XSS)
                        </h2>
                        <div className="flex flex-wrap items-center gap-2 border border-[#cccccc] bg-[#eeeeee] p-4 text-xs">
                          <span>Please choose a language:</span>
                          <select
                            value={xssDomLang}
                            onChange={(e) => setXssDomLang(e.target.value)}
                            className="border border-[#a9a9a9] bg-white px-2 py-1"
                          >
                            <option value="English">English</option>
                            <option value="French">French</option>
                            <option value="Spanish">Spanish</option>
                            <option value="German">German</option>
                          </select>
                          <button
                            type="button"
                            onClick={() => {
                              setUrlInput(
                                `http://${hostLabel}/vulnerabilities/xss_d/?default=${encodeURIComponent(xssDomLang)}`
                              );
                            }}
                            className="cursor-pointer border border-[#8e8e8e] bg-gradient-to-b from-[#eeeeee] to-[#cccccc] px-3 py-1 font-bold"
                          >
                            Select
                          </button>
                        </div>
                        <div className="border border-[#cccccc] bg-[#fafafa] p-3 font-mono text-xs">
                          Rendered selection: {xssDomLang}
                          {evaluateXssCookieHint(xssDomLang) && (
                            <div className="mt-2 border border-amber-400 bg-amber-50 p-2 text-amber-900">
                              [JavaScript Alert]: {evaluateXssCookieHint(xssDomLang)}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* XSS REFLECTED */}
                    {activePage === "xss_r" && (
                      <div className="space-y-4 text-[13px]">
                        <h2 className="text-2xl font-bold text-[#111111]">
                          Vulnerability: Reflected Cross Site Scripting (XSS)
                        </h2>
                        <div className="flex flex-wrap items-center gap-2 border border-[#cccccc] bg-[#eeeeee] p-4 text-xs">
                          <label htmlFor="dvwa-xss-r">What&apos;s your name?</label>
                          <input
                            id="dvwa-xss-r"
                            type="text"
                            value={xssReflectedInput}
                            onChange={(e) => setXssReflectedInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") runReflectedXss();
                            }}
                            className="w-64 border border-[#a9a9a9] bg-white px-2 py-1 font-mono"
                          />
                          <button
                            type="button"
                            onClick={() => runReflectedXss()}
                            className="cursor-pointer border border-[#8e8e8e] bg-gradient-to-b from-[#eeeeee] to-[#cccccc] px-3 py-1 font-bold"
                          >
                            Submit
                          </button>
                        </div>
                        {xssReflectedRendered && (
                          <pre className="border border-[#cccccc] bg-[#fafafa] p-3 font-mono text-xs">
                            {xssReflectedRendered}
                          </pre>
                        )}
                      </div>
                    )}

                    {/* XSS STORED */}
                    {activePage === "xss_s" && (
                      <div className="space-y-4 text-[13px]">
                        <h2 className="text-2xl font-bold text-[#111111]">
                          Vulnerability: Stored Cross Site Scripting (XSS)
                        </h2>
                        <div className="space-y-2.5 border border-[#cccccc] bg-[#eeeeee] p-4 text-xs">
                          <div className="flex items-center gap-2">
                            <span className="w-20">Name *</span>
                            <input
                              type="text"
                              value={xssStoredName}
                              onChange={(e) => setXssStoredName(e.target.value)}
                              className="w-56 border border-[#a9a9a9] bg-white px-2 py-1"
                            />
                          </div>
                          <div className="flex items-start gap-2">
                            <span className="w-20 pt-1">Message *</span>
                            <textarea
                              rows={3}
                              value={xssStoredMessage}
                              onChange={(e) => setXssStoredMessage(e.target.value)}
                              className="w-72 border border-[#a9a9a9] bg-white px-2 py-1 font-mono"
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                if (!xssStoredName.trim() && !xssStoredMessage.trim()) return;
                                const alertHit = evaluateXssCookieHint(
                                  `${xssStoredName} ${xssStoredMessage}`
                                );
                                if (alertHit) setXssAlertPreview(alertHit);
                                setGuestbook((prev) => [
                                  ...prev,
                                  {
                                    id: Date.now(),
                                    name: xssStoredName.trim() || "anon",
                                    message: xssStoredMessage,
                                  },
                                ]);
                                setXssStoredName("");
                                setXssStoredMessage("");
                              }}
                              className="cursor-pointer border border-[#8e8e8e] bg-gradient-to-b from-[#eeeeee] to-[#cccccc] px-3 py-1 font-bold"
                            >
                              Sign Guestbook
                            </button>
                            <button
                              type="button"
                              onClick={() => setGuestbook([])}
                              className="cursor-pointer border border-[#8e8e8e] bg-white px-3 py-1"
                            >
                              Clear Guestbook
                            </button>
                          </div>
                        </div>

                        <div className="space-y-2">
                          {guestbook.map((g) => (
                            <div key={g.id} className="border border-[#cccccc] bg-[#fafafa] p-2.5 text-xs">
                              <div>
                                <strong>Name:</strong> {g.name}
                              </div>
                              <div className="font-mono">
                                <strong>Message:</strong> {g.message}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* CSP BYPASS */}
                    {activePage === "csp" && (
                      <div className="space-y-4 text-[13px]">
                        <h2 className="text-2xl font-bold text-[#111111]">
                          Vulnerability: Content Security Policy (CSP) Bypass
                        </h2>
                        <div className="flex flex-wrap items-center gap-2 border border-[#cccccc] bg-[#eeeeee] p-4 text-xs">
                          <span>Script URL to include:</span>
                          <input
                            type="text"
                            value={cspIncludeUrl}
                            onChange={(e) => setCspIncludeUrl(e.target.value)}
                            className="w-72 border border-[#a9a9a9] bg-white px-2 py-1 font-mono"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const allowedLow =
                                /pastebin\.com|hastebin\.com|code\.jquery\.com/i.test(cspIncludeUrl);
                              setCspResult(
                                securityLevel === "impossible"
                                  ? "Refused to load script: strict-dynamic / valid SHA-256 or nonce required."
                                  : allowedLow
                                  ? `Executed external script from ${cspIncludeUrl}`
                                  : `Refused to load script '${cspIncludeUrl}' because it violates CSP directive: script-src 'self'`
                              );
                            }}
                            className="cursor-pointer border border-[#8e8e8e] bg-gradient-to-b from-[#eeeeee] to-[#cccccc] px-3 py-1 font-bold"
                          >
                            Include
                          </button>
                        </div>
                        {cspResult && (
                          <pre className="border border-[#cccccc] bg-[#fafafa] p-3 font-mono text-xs">
                            {cspResult}
                          </pre>
                        )}
                      </div>
                    )}

                    {/* JAVASCRIPT */}
                    {activePage === "javascript" && (
                      <div className="space-y-4 text-[13px]">
                        <h2 className="text-2xl font-bold text-[#111111]">
                          Vulnerability: JavaScript
                        </h2>
                        <div className="space-y-2 border border-[#cccccc] bg-[#eeeeee] p-4 text-xs">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="w-24">Phrase:</span>
                            <input
                              type="text"
                              value={jsPhrase}
                              onChange={(e) => setJsPhrase(e.target.value)}
                              className="w-48 border border-[#a9a9a9] bg-white px-2 py-1 font-mono"
                            />
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="w-24">token:</span>
                            <input
                              type="text"
                              value={jsTokenInput}
                              onChange={(e) => setJsTokenInput(e.target.value)}
                              className="w-72 border border-[#a9a9a9] bg-white px-2 py-1 font-mono"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              if (jsPhrase.trim().toLowerCase() === "success") {
                                setJsMsg("Well done!");
                              } else {
                                setJsMsg("Invalid token / phrase must be 'success'.");
                              }
                            }}
                            className="cursor-pointer border border-[#8e8e8e] bg-gradient-to-b from-[#eeeeee] to-[#cccccc] px-3 py-1 font-bold"
                          >
                            Submit
                          </button>
                        </div>
                        {jsMsg && (
                          <pre className="border border-[#cccccc] bg-[#fafafa] p-3 font-mono text-xs">
                            {jsMsg}
                          </pre>
                        )}
                      </div>
                    )}

                    {/* DVWA SECURITY */}
                    {activePage === "security" && (
                      <div className="space-y-4 text-[13px]">
                        <h2 className="text-2xl font-bold text-[#111111]">DVWA Security</h2>
                        <div className="space-y-3 border border-[#cccccc] bg-[#eeeeee] p-4 text-xs">
                          <p>
                            Security level is currently: <strong className="uppercase">{securityLevel}</strong>.
                          </p>
                          <div className="flex flex-wrap items-center gap-2">
                            <select
                              data-dvwa-target="select-security"
                              value={securityDraft}
                              onChange={(e) => setSecurityDraft(e.target.value as DvwaSecurityLevel)}
                              className="border border-[#a9a9a9] bg-white px-3 py-1 font-mono text-xs"
                            >
                              <option value="low">Low</option>
                              <option value="medium">Medium</option>
                              <option value="high">High</option>
                              <option value="impossible">Impossible</option>
                            </select>
                            <button
                              data-dvwa-target="btn-security-submit"
                              type="button"
                              onClick={() => {
                                setSecurityLevel(securityDraft);
                                onSecurityLevelChange?.(securityDraft);
                                setSecurityNotice(`Security level set to ${securityDraft}`);
                              }}
                              className="cursor-pointer border border-[#8e8e8e] bg-gradient-to-b from-[#eeeeee] to-[#cccccc] px-3 py-1 font-bold"
                            >
                              Submit
                            </button>
                          </div>
                        </div>
                        {securityNotice && (
                          <div className="flex items-center gap-2 border border-[#72b520] bg-[#f4fbe9] p-2.5 text-xs font-semibold text-[#2d5a00]">
                            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                            <span>{securityNotice}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* PHP INFO */}
                    {activePage === "phpinfo" && (
                      <div className="space-y-3 text-[12px]">
                        <h2 className="text-xl font-bold text-[#111111]">PHP Version 7.0.33-0+deb9u6</h2>
                        <table className="w-full border-collapse border border-[#9999cc] font-mono text-[11px]">
                          <tbody>
                            <tr className="bg-[#9999cc] font-bold text-white">
                              <td className="border border-[#666699] px-2.5 py-1">Directive</td>
                              <td className="border border-[#666699] px-2.5 py-1">Value</td>
                            </tr>
                            <tr className="bg-[#ccccff]">
                              <td className="border border-[#9999cc] px-2.5 py-1">SERVER_SOFTWARE</td>
                              <td className="border border-[#9999cc] px-2.5 py-1">
                                {apachePatched ? "Apache" : "Apache/2.4.25 (Debian)"}
                              </td>
                            </tr>
                            <tr className="bg-[#eeeeee]">
                              <td className="border border-[#9999cc] px-2.5 py-1">session.cookie_httponly</td>
                              <td className="border border-[#9999cc] px-2.5 py-1">
                                {cookiePatched ? "On (HttpOnly; SameSite=Strict)" : "Off"}
                              </td>
                            </tr>
                            <tr className="bg-[#ccccff]">
                              <td className="border border-[#9999cc] px-2.5 py-1">mysqli.default_user</td>
                              <td className="border border-[#9999cc] px-2.5 py-1">
                                {leastPrivApplied ? "dvwa_svc@localhost" : "root@localhost"}
                              </td>
                            </tr>
                            <tr className="bg-[#eeeeee]">
                              <td className="border border-[#9999cc] px-2.5 py-1">password_hash()</td>
                              <td className="border border-[#9999cc] px-2.5 py-1">
                                {bcryptApplied ? "PASSWORD_BCRYPT (cost=12 active)" : "MD5 legacy hashes"}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* ABOUT */}
                    {activePage === "about" && (
                      <div className="space-y-3 text-[13px] leading-relaxed">
                        <h2 className="text-2xl font-bold text-[#111111]">About</h2>
                        <p>
                          Damn Vulnerable Web Application (DVWA) v1.10 · Môi trường kiểm thử thực hành nhóm:{" "}
                          <strong>Sơn, Hùng, Quyết, Khánh</strong>.
                        </p>
                        <p className="text-xs text-zinc-600">
                          Licensed under GPLv3 — tích hợp đồng bộ trạng thái Apache/Cookie (Sơn), SQLi &amp;
                          access.log (Hùng), Bcrypt &amp; MariaDB Least Privilege (Quyết), Impossible &amp; ModSecurity
                          WAF (Khánh).
                        </p>
                      </div>
                    )}

                    {/* Safe Inline JavaScript Alert Banner when XSS fires */}
                    {xssAlertPreview && (
                      <div className="mt-4 flex items-center justify-between gap-3 rounded border border-amber-400 bg-amber-50 p-3 font-mono text-xs text-amber-950">
                        <div>
                          <strong>[JavaScript Alert]:</strong> {xssAlertPreview}
                        </div>
                        <button
                          type="button"
                          onClick={() => setXssAlertPreview(null)}
                          className="cursor-pointer rounded border border-amber-400 bg-white px-2.5 py-0.5 font-sans text-[11px] font-bold"
                        >
                          OK
                        </button>
                      </div>
                    )}
                  </div>

                  {/* DVWA Page Status Footer + View Source / View Help */}
                  <div className="mt-8 flex flex-wrap items-center justify-between gap-2 border-t border-[#d8d8d8] pt-3 text-[11.5px] text-[#444444]">
                    <div className="font-mono">
                      Username: <strong>{loggedInUser}</strong> · Security Level:{" "}
                      <strong>{securityLevel}</strong> · PHPIDS:{" "}
                      <strong>{isWafActive ? "ModSecurity ON" : "disabled"}</strong>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setModalMode("help")}
                        className="inline-flex cursor-pointer items-center gap-1 border border-[#9e9e9e] bg-gradient-to-b from-[#eeeeee] to-[#cccccc] px-2.5 py-1 text-[11px] font-bold text-[#111111]"
                      >
                        <HelpCircle className="h-3 w-3" aria-hidden="true" />
                        View Help
                      </button>
                      <button
                        data-dvwa-target="btn-view-source"
                        type="button"
                        onClick={() => setModalMode("source")}
                        className="inline-flex cursor-pointer items-center gap-1 border border-[#9e9e9e] bg-gradient-to-b from-[#eeeeee] to-[#cccccc] px-2.5 py-1 text-[11px] font-bold text-[#111111]"
                      >
                        <Code2 className="h-3 w-3" aria-hidden="true" />
                        View Source
                      </button>
                    </div>
                  </div>
                </main>
              </div>
            )}
          </div>

          {/* View Source / View Help Modal */}
          {modalMode && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
              <div className="max-h-[85vh] w-full max-w-3xl overflow-y-auto rounded-lg border border-zinc-600 bg-[#1e1f22] p-5 text-zinc-100 shadow-2xl">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-zinc-700 pb-2.5">
                  <div className="font-mono text-xs font-bold text-[#9be817]">
                    {modalMode === "source"
                      ? `DVWA Source — ${currentItem.label} (${securityLevel})`
                      : `DVWA Help — ${currentItem.label}`}
                  </div>
                  <div className="flex items-center gap-2">
                    {modalMode === "source" && activePage === "sqli" && (
                      <button
                        type="button"
                        onClick={() => setCompareAllSources((v) => !v)}
                        className="cursor-pointer rounded border border-zinc-600 bg-zinc-800 px-2.5 py-1 text-[11px] text-zinc-200 hover:bg-zinc-700"
                      >
                        {compareAllSources ? "Chỉ xem mức hiện tại" : "Compare All Levels"}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setModalMode(null)}
                      className="cursor-pointer rounded border border-zinc-600 bg-zinc-800 px-2 py-1 text-zinc-300 hover:text-white"
                    >
                      <X className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  </div>
                </div>

                {modalMode === "help" ? (
                  <p className="text-xs leading-relaxed text-zinc-200">{helpSource.help}</p>
                ) : compareAllSources && activePage === "sqli" ? (
                  <div className="space-y-3">
                    {PHP_LEVEL_SOURCES.map((src) => (
                      <div key={src.level} className="rounded border border-zinc-700 bg-black/40 p-3">
                        <div className="mb-1.5 font-mono text-xs font-bold text-amber-300">
                          {src.title}
                        </div>
                        <pre className="overflow-x-auto whitespace-pre-wrap font-mono text-[11px] text-zinc-200">
                          {src.code}
                        </pre>
                      </div>
                    ))}
                  </div>
                ) : (
                  <pre className="overflow-x-auto whitespace-pre-wrap rounded border border-zinc-700 bg-black/50 p-3.5 font-mono text-[11.5px] leading-relaxed text-emerald-300">
                    {helpSource.source}
                  </pre>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );

  return (
    <>
      {renderBrowserWindow(false)}
      {isFullscreen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 backdrop-blur-sm sm:p-5"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsFullscreen(false);
          }}
        >
          {renderBrowserWindow(true)}
        </div>
      )}
    </>
  );
}
