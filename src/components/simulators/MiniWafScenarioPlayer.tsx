"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bell,
  ChevronLeft,
  ChevronRight,
  Gauge,
  Globe,
  Pause,
  Play,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  Terminal,
  Unlock,
} from "lucide-react";
import {
  type PortalDriverCommand,
  StudentPortalEmulator,
} from "@/components/simulators/StudentPortalEmulator";
import { WindowControls } from "@/components/WindowBar";
import type { PortalSecurityMode, WafMode } from "@/lib/miniWafEngine";

export interface ScenarioStageSpec {
  id: string;
  beatNumber: 1 | 2 | 3 | 4;
  stageCode: string;
  ownerMember: "Sơn" | "Hùng" | "Quyết" | "Khánh";
  phaseTitle: string;
  stageTitle: string;
  topologySummary: string;
  wafMode: WafMode;
  portalMode: PortalSecurityMode;
  ipBanned?: boolean;
  prompt: string;
  command: string;
  outputLines: string[];
  talkingPoint: string;
  codeReference: string;
  portalDriver?: {
    page: "search" | "login" | "comments" | "download";
    input: string;
  };
  adminEvent: {
    time: string;
    ip: string;
    action: "ALLOWED" | "BLOCKED" | "RATE_LIMITED" | "BANNED" | "INFO";
    detail: string;
  };
  telegramAlert?: string;
}

export const MINI_WAF_SCENARIO_STAGES: ScenarioStageSpec[] = [
  // ===================== NHIP 1: SON =====================
  {
    id: "1A",
    beatNumber: 1,
    stageCode: "1A",
    ownerMember: "Sơn",
    phaseTitle: "Nhịp 1 — Sơn: Kiến trúc Proxy & Web 2 chế độ",
    stageTitle: "Khởi chạy Stack & Cô lập mạng Web :8000",
    topologySummary: "Client -> Reverse Proxy :8080 (server_header=False) -> internal:8000",
    wafMode: "OFF",
    portalMode: "VULNERABLE",
    prompt: "son@mini-waf:~/mini-waf-project$",
    command:
      "docker compose up -d && curl -sI http://127.0.0.1:8080/search?q=SV001 | grep -iE 'HTTP|server'",
    outputLines: [
      "[+] Network mini-waf-internal (internal: true)   Created",
      "[+] Container target-student-portal (172.28.0.10:8000) Started",
      "[+] Container mini-waf-proxy (:8080) & admin (:8888)   Started",
      "HTTP/1.1 200 OK",
      "# Header Server đã được proxy/server.py stripping (server_header=False)",
      "$ curl --connect-timeout 2 http://172.28.0.10:8000/  # Thử nối tắt bỏ qua WAF",
      "curl: (28) Connection timed out — Docker internal: true đã cô lập hoàn toàn!",
    ],
    talkingPoint:
      "Mở đầu trên Website Quản lý Điểm Sinh viên thực: cổng 8000 bị khóa trong Docker internal: true để kẻ tấn công không thể đi đường tắt vượt WAF, đồng thời Proxy xóa header Server để chống Fingerprint.",
    codeReference: "docker-compose.yml, waf/main.py (server_header=False), waf/proxy/forward.py",
    portalDriver: { page: "search", input: "SV001" },
    adminEvent: {
      time: "14:00:08",
      ip: "198.51.100.77",
      action: "ALLOWED",
      detail: "GET /search?q=SV001 -> 200 OK (WAF=OFF Baseline)",
    },
  },
  {
    id: "1B",
    beatNumber: 1,
    stageCode: "1B",
    ownerMember: "Sơn",
    phaseTitle: "Nhịp 1 — Sơn: Kiến trúc Proxy & Web 2 chế độ",
    stageTitle: "Khai thác Web chế độ VULNERABLE khi WAF OFF",
    topologySummary: "WAF OFF -> Web VULNERABLE (nối chuỗi SQL f-string) -> Lộ dữ liệu",
    wafMode: "OFF",
    portalMode: "VULNERABLE",
    prompt: "son@mini-waf:~/mini-waf-project$",
    command: "curl -s \"http://127.0.0.1:8080/search?q=%27%20OR%20%271%27%3D%271--\"",
    outputLines: [
      "[Target APP_SECURITY_MODE=VULNERABLE | SQL executed:]",
      "SELECT masv, fullname, class_name, gpa FROM students WHERE fullname LIKE '%' OR '1'='1--%'",
      "[!] HTTP 200 OK — Trả về toàn bộ 5 hồ sơ điểm + dump bảng accounts:",
      "    - SV001 | Nguyen Van An   | GPA 8.6",
      "    - SV002 | Patrick O'Brien | GPA 9.1",
      "    - leaked_table accounts: admin | portal_admin_2026 | role=lecturer",
    ],
    talkingPoint:
      "Quan sát trên trình duyệt bên trái: khi WAF OFF và Web chạy nhánh VULNERABLE (nối chuỗi trực tiếp), chỉ 1 chuỗi ' OR '1'='1-- đã kéo toàn bộ bảng điểm và mật khẩu giảng viên ra màn hình.",
    codeReference: "target_web/app.py (APP_SECURITY_MODE=VULNERABLE)",
    portalDriver: { page: "search", input: "' OR '1'='1--" },
    adminEvent: {
      time: "14:00:26",
      ip: "198.51.100.77",
      action: "INFO",
      detail: "WAF=OFF: Payload SQLi đi thẳng tới Target VULNERABLE (Lộ DB!)",
    },
  },
  {
    id: "1C",
    beatNumber: 1,
    stageCode: "1C",
    ownerMember: "Sơn",
    phaseTitle: "Nhịp 1 — Sơn: Kiến trúc Proxy & Web 2 chế độ",
    stageTitle: "Bật Secure Coding HARDENED (Prepared Statement)",
    topologySummary: "WAF OFF -> Web HARDENED (SELECT ... WHERE username = ?) -> 401",
    wafMode: "OFF",
    portalMode: "HARDENED",
    prompt: "son@mini-waf:~/mini-waf-project$",
    command:
      "APP_SECURITY_MODE=HARDENED curl -s -X POST http://127.0.0.1:8080/login -d \"user=admin' OR '1'='1--&pass=wrong\"",
    outputLines: [
      "[Target APP_SECURITY_MODE=HARDENED]",
      "SQL: SELECT id, username, role FROM accounts WHERE username = ? AND password = ?",
      "Params bound safely as literal strings: (\"admin' OR '1'='1--\", \"wrong\")",
      "HTTP/1.1 401 Unauthorized — Khẳng định phòng thủ chiều sâu (Defense-in-Depth) ngay tại ứng dụng!",
      "# Ngoài ra HTML Escape & realpath() cũng khóa Stored XSS và Path Traversal tại tầng Web.",
    ],
    talkingPoint:
      "Nhờ Web tự code có 2 chế độ, ta chứng minh được gốc rễ lỗ hổng: cùng payload đó, chuyển Target sang HARDENED là câu lệnh SQL tham số hóa (Prepared Statement) vô hiệu hóa ngay dù WAF đang OFF.",
    codeReference: "target_web/app.py (HARDENED: Parameterized SQLite + html.escape + realpath)",
    portalDriver: { page: "login", input: "admin' OR '1'='1--" },
    adminEvent: {
      time: "14:00:44",
      ip: "198.51.100.77",
      action: "INFO",
      detail: "POST /login -> Web HARDENED chặn SQLi Login bằng Prepared Statement (401)",
    },
  },

  // ===================== NHIP 2: HUNG =====================
  {
    id: "2A",
    beatNumber: 2,
    stageCode: "2A",
    ownerMember: "Hùng",
    phaseTitle: "Nhịp 2 — Hùng: Chuẩn hóa & Bộ não Inspection Engine",
    stageTitle: "Bật WAF BLOCKING: Lột trần Comment Inline UN/**/ION",
    topologySummary: "WAF BLOCKING (:8080) che chắn cho Web VULNERABLE (:8000)",
    wafMode: "BLOCKING",
    portalMode: "VULNERABLE",
    prompt: "hung@mini-waf:~/mini-waf-project$",
    command:
      "curl -i \"http://127.0.0.1:8080/search?q=1%27%20UN/**/ION%20SEL/**/ECT%201,2--\"",
    outputLines: [
      "[waf/inspection/normalizer.py] Dual-track Normalization:",
      "  - Track 1 (spaced)   : 1' un ion sel ect 1,2--",
      "  - Track 2 (collapsed): 1' union select 1,2--",
      "[waf/inspection/sqli.py] SQL Lexical Token Fingerprint: [k=UNION, k=SELECT, c=--]",
      "  -> Matched: SQL-01 (+2), SQL-03 (+6), SQL-05 (+6) | Total Score = 14 >= 5",
      "HTTP/1.1 403 Forbidden — Blocked by Mini-WAF (Upstream :8000 không hề nhận request!)",
    ],
    talkingPoint:
      "Chuyển lại Web về VULNERABLE nhưng bật WAF=BLOCKING. Kẻ tấn công chèn comment /**/ giữa từ khóa UNION SELECT để qua mặt regex thô, nhưng Track 2 (collapsed) của Mini-WAF nối liền lại và chấm 14 điểm -> chặn 403.",
    codeReference: "waf/inspection/normalizer.py, waf/inspection/sqli.py (Dual-Track + Lexer)",
    portalDriver: { page: "search", input: "1' UN/**/ION SEL/**/ECT 1,2--" },
    adminEvent: {
      time: "14:01:10",
      ip: "198.51.100.77",
      action: "BLOCKED",
      detail: "[SQL-01, SQL-03, SQL-05] Score=14 -> GET /search?q=1' UN/**/ION...",
    },
    telegramAlert: "[Mini-WAF ALERT] Chặn SQLi Comment Bypass từ 198.51.100.77 (Score 14)",
  },
  {
    id: "2B",
    beatNumber: 2,
    stageCode: "2B",
    ownerMember: "Hùng",
    phaseTitle: "Nhịp 2 — Hùng: Chuẩn hóa & Bộ não Inspection Engine",
    stageTitle: "Chặn Double URL Encoding & Stored XSS <img onerror>",
    topologySummary: "3-Pass unquote_plus + HTML Entity Decode -> Bắt XSS & SQLi mã hóa kép",
    wafMode: "BLOCKING",
    portalMode: "VULNERABLE",
    prompt: "hung@mini-waf:~/mini-waf-project$",
    command:
      "curl -i \"http://127.0.0.1:8080/comments?msg=%26lt%3Bimg%20src%3Dx%20onerror%3Dalert(1)%26gt%3B\"",
    outputLines: [
      "[waf/inspection/normalizer.py] Pass 1 URL decode -> &lt;img src=x onerror=alert(1)&gt;",
      "[waf/inspection/normalizer.py] HTML Entity unescape -> <img src=x onerror=alert(1)>",
      "[waf/inspection/xss.py] Triggered Rule XSS-01 (+5): HTML event handler 'onerror='",
      "HTTP/1.1 403 Forbidden — Chặn Stored XSS ngay tại cổng :8080 trước khi ghi DB!",
    ],
    talkingPoint:
      "Nếu kẻ tấn công bọc payload bằng mã hóa URL nhiều lớp (%2527) hoặc HTML Entity (&lt;img...), vòng lặp giải mã tối đa 3 pass + html.unescape sẽ đưa mọi biến thể về dạng nguyên thủy trước khi quét.",
    codeReference: "waf/inspection/normalizer.py, waf/inspection/xss.py (XSS-01)",
    portalDriver: { page: "comments", input: "<img src=x onerror=alert(1)>" },
    adminEvent: {
      time: "14:01:32",
      ip: "198.51.100.77",
      action: "BLOCKED",
      detail: "[XSS-01] Score=5 -> /comments (onerror=alert(1))",
    },
  },
  {
    id: "2C",
    beatNumber: 2,
    stageCode: "2C",
    ownerMember: "Hùng",
    phaseTitle: "Nhịp 2 — Hùng: Chuẩn hóa & Bộ não Inspection Engine",
    stageTitle: "Chặn Path Traversal (....//) & Kiểm tra HPP (?q=SV001&q=...)",
    topologySummary: "Parser hợp nhất mảng tham số HPP + Rút gọn ....// -> ../../",
    wafMode: "BLOCKING",
    portalMode: "VULNERABLE",
    prompt: "hung@mini-waf:~/mini-waf-project$",
    command:
      "curl -i \"http://127.0.0.1:8080/download?file=....//....//etc/passwd\"",
    outputLines: [
      "[waf/inspection/parser.py] Extracted URI + Query array + JSON keys + Headers",
      "[waf/inspection/traversal.py] Collapsed '....//' -> '../../etc/passwd'",
      "  -> Matched LFI-01 (+5): Path Traversal / Nhóm tệp hệ thống nhạy cảm",
      "HTTP/1.1 403 Forbidden — Tránh rò rỉ tệp /etc/passwd ngay khi Web ở chế độ VULNERABLE.",
    ],
    talkingPoint:
      "Với kỹ thuật chèn lồng ....// (khi app xóa ../ một lần vẫn còn ../) hoặc HTTP Parameter Pollution (?q=SV001&q=' OR 1=1), Parser tách đủ toàn bộ giá trị khóa lặp để Rule Engine bắt trọn không sót.",
    codeReference: "waf/inspection/parser.py, waf/inspection/traversal.py (LFI-01)",
    portalDriver: { page: "download", input: "....//....//etc/passwd" },
    adminEvent: {
      time: "14:01:55",
      ip: "198.51.100.77",
      action: "BLOCKED",
      detail: "[LFI-01] Score=5 -> /download?file=....//etc/passwd",
    },
  },

  // ===================== NHIP 3: QUYET =====================
  {
    id: "3A",
    beatNumber: 3,
    stageCode: "3A",
    ownerMember: "Quyết",
    phaseTitle: "Nhịp 3 — Quyết: Phòng thủ Hành vi, Anti-Spoof & Dashboard",
    stageTitle: "Sliding Window Rate Limit & Chống giả mạo X-Forwarded-For",
    topologySummary: "Peer 203.0.113.9 ngoài trusted_proxies -> Bỏ qua XFF giả -> Đếm deque 60s",
    wafMode: "BLOCKING",
    portalMode: "VULNERABLE",
    prompt: "quyet@mini-waf:~/mini-waf-project$",
    command:
      "for i in $(seq 1 32); do curl -s -o /dev/null -w \"%{http_code} \" -H \"X-Forwarded-For: 10.0.0.$i\" http://127.0.0.1:8080/search?q=SV001; done",
    outputLines: [
      "[waf/protection/rate_limit.py] Peer IP = 203.0.113.9 (KHÔNG nằm trong trusted_proxies)",
      "[Anti-Spoof] Bỏ qua 32 header X-Forwarded-For giả mạo 10.0.0.1 .. 10.0.0.32!",
      "Req #01..#30 -> 200 OK (Sliding Window 60s: 30/30)",
      "Req #31     -> HTTP 429 Too Many Requests | Retry-After: 59s",
      "Req #32     -> HTTP 429 Too Many Requests (Chống tràn ranh giới phút Fixed Window!)",
    ],
    talkingPoint:
      "Nếu dùng Fixed Window đơn thuần hoặc tin tưởng mù quáng X-Forwarded-For, kẻ tấn công dễ dàng đổi IP giả mỗi request hoặc đánh vào giây 59–01. Mini-WAF chỉ tin XFF từ trusted proxy và đo trượt chính xác bằng deque.",
    codeReference: "waf/protection/rate_limit.py (SlidingWindowLimiter + Anti-Spoof)",
    portalDriver: { page: "search", input: "SV001" },
    adminEvent: {
      time: "14:02:18",
      ip: "203.0.113.9",
      action: "RATE_LIMITED",
      detail: "Sliding Window 31/30 trong 60s -> HTTP 429 (Đã bỏ qua XFF giả mạo)",
    },
    telegramAlert: "[Mini-WAF ALERT] Vượt ngưỡng Sliding Window: 203.0.113.9 -> HTTP 429",
  },
  {
    id: "3B",
    beatNumber: 3,
    stageCode: "3B",
    ownerMember: "Quyết",
    phaseTitle: "Nhịp 3 — Quyết: Phòng thủ Hành vi, Anti-Spoof & Dashboard",
    stageTitle: "Auto-Ban TTL 300s & Masking Dữ liệu Nhạy cảm trong Log",
    topologySummary: "3 vi phạm / 120s -> Khóa IP 300s + Che password/token -> Gửi Telegram",
    wafMode: "BLOCKING",
    portalMode: "VULNERABLE",
    ipBanned: true,
    prompt: "quyet@mini-waf:~/mini-waf-project$",
    command:
      "curl -i -X POST http://127.0.0.1:8080/login -H \"Authorization: Bearer eyJhbGci...\" -d \"user=admin'--&pass=SuperSecret99\"",
    outputLines: [
      "[waf/protection/blacklist.py] Vi phạm lần 3/3 -> Kích hoạt AUTO-BAN IP 203.0.113.9 (TTL: 300s)",
      "[waf/monitoring/logger.py] Che dữ liệu nhạy cảm trước khi INSERT INTO waf_events (SQLite WAL):",
      "  snippet: \"Bearer ***MASKED*** | user=admin'--&pass=***MASKED***\"",
      "HTTP/1.1 403 Forbidden [BAN-403] — Toàn bộ truy cập tiếp theo bị ngắt tức thì (< 0.2ms)!",
    ],
    talkingPoint:
      "Kẻ tấn công thử dò mật khẩu kèm SQLi đủ 3 lần sẽ bị khóa IP tự động 300s ngay trước proxy (< 0.2ms). Đặc biệt mọi Bearer token hay password đều được mask thành ***MASKED*** trước khi ghi vào SQLite để chính log WAF không làm lộ mật khẩu.",
    codeReference: "waf/protection/blacklist.py, waf/monitoring/logger.py (mask_sensitive_text)",
    portalDriver: { page: "login", input: "admin'--" },
    adminEvent: {
      time: "14:02:40",
      ip: "203.0.113.9",
      action: "BANNED",
      detail: "AUTO-BAN TTL 300s | Logged: Bearer ***MASKED*** | pass=***MASKED***",
    },
    telegramAlert: "[Mini-WAF BAN] Khóa IP 203.0.113.9 trong 300s (3/3 vi phạm) — Xem Admin :8888",
  },
  {
    id: "3C",
    beatNumber: 3,
    stageCode: "3C",
    ownerMember: "Quyết",
    phaseTitle: "Nhịp 3 — Quyết: Phòng thủ Hành vi, Anti-Spoof & Dashboard",
    stageTitle: "Mở khóa từ Admin :8888 & Xác minh O'Brien không False Positive",
    topologySummary: "Operator Unban trên :8888 -> Sinh viên hợp lệ O'Brien truy cập 200 OK",
    wafMode: "BLOCKING",
    portalMode: "VULNERABLE",
    ipBanned: false,
    prompt: "quyet@mini-waf:~/mini-waf-project$",
    command:
      "curl -s -X POST http://127.0.0.1:8888/api/unban/203.0.113.9 && curl -i \"http://127.0.0.1:8080/search?q=O%27Brien\"",
    outputLines: [
      "[Admin :8888] Xác thực cookie miniwaf_session (HttpOnly) -> Đã Unban IP 203.0.113.9",
      "[waf/inspection/sqli.py] Inspect q=\"O'Brien\":",
      "  - SQL-01 (+2): Phát hiện 1 dấu nháy đơn hợp lệ",
      "  - SQL Lexical Check: KHÔNG có UNION / OR / Tautology / Comment -> Score = 2 < Threshold 5",
      "HTTP/1.1 200 OK -> Trả về hồ sơ: SV002 | Patrick O'Brien | D22CQCN01 | GPA 9.1!",
    ],
    talkingPoint:
      "WAF tồi sẽ chặn nhầm tên họ O'Brien hoặc phép so sánh 5 < 10. Nhờ cơ chế chấm điểm ngữ nghĩa (Risk Scoring +2 < ngưỡng 5), tên O'Brien đi qua mượt mà hiển thị đúng trên Web, còn người quản trị vẫn mở khóa khẩn cấp ngay từ :8888.",
    codeReference: "waf/monitoring/dashboard.py (Admin :8888), waf/inspection/engine.py (Score Threshold)",
    portalDriver: { page: "search", input: "O'Brien" },
    adminEvent: {
      time: "14:03:02",
      ip: "203.0.113.9",
      action: "ALLOWED",
      detail: "Operator Unban OK | GET /search?q=O'Brien -> Score=2 (<5) -> 200 OK (0 FP)",
    },
  },

  // ===================== NHIP 4: KHANH =====================
  {
    id: "4A",
    beatNumber: 4,
    stageCode: "4A",
    ownerMember: "Khánh",
    phaseTitle: "Nhịp 4 — Khánh: Kiểm thử Xâm nhập & Benchmark Khoa học",
    stageTitle: "Đối chứng công cụ rà quét tự động (SQLMap / Nmap) bị chặn 100%",
    topologySummary: "SQLMap Probe -> Kết hợp SCN-01 (+3) + SQL-03 (+6) -> Chặn đứng mọi payload",
    wafMode: "BLOCKING",
    portalMode: "VULNERABLE",
    prompt: "khanh@mini-waf:~/mini-waf-project$",
    command:
      "sqlmap -u \"http://127.0.0.1:8080/search?q=SV001\" --batch --dbs",
    outputLines: [
      "[*] starting SQLMap against http://127.0.0.1:8080/search?q=SV001",
      "[WAF Hit] User-Agent: sqlmap/* (SCN-01 +3) + UNION/Boolean probes (SQL-02/03/05 +6)",
      "[WARNING] HTTP error codes detected during run: 403 (Forbidden) - 18/18 payloads",
      "[CRITICAL] all tested parameters do not appear to be injectable (Mini-WAF blocked all probes).",
    ],
    talkingPoint:
      "Kiểm chứng bằng chính SQLMap như kịch bản Red-Team ban đầu: thay vì kéo được hash mật khẩu như lúc WAF OFF, 100% probe bị WAF cắt ngay với HTTP 403 mà không chạm được tới SQLite.",
    codeReference: "tests/test_proxy.py, Ground Truth SQLMap verification",
    portalDriver: { page: "search", input: "' UNION SELECT sql,2,3,4 FROM sqlite_master--" },
    adminEvent: {
      time: "14:03:25",
      ip: "198.51.100.77",
      action: "BLOCKED",
      detail: "[SCN-01, SQL-03, SQL-05] Chặn toàn bộ lượt dò quét SQLMap (18/18 -> 403)",
    },
  },
  {
    id: "4B",
    beatNumber: 4,
    stageCode: "4B",
    ownerMember: "Khánh",
    phaseTitle: "Nhịp 4 — Khánh: Kiểm thử Xâm nhập & Benchmark Khoa học",
    stageTitle: "Chạy bộ Kiểm thử Hồi quy Tự động Pytest (13/13 Test Cases)",
    topologySummary: "FastAPI ASGITransport E2E Verification across 4 Test Suites",
    wafMode: "BLOCKING",
    portalMode: "HARDENED",
    prompt: "khanh@mini-waf:~/mini-waf-project$",
    command: ".venv/bin/pytest -v tests/",
    outputLines: [
      "tests/test_defense.py::test_sliding_window_rate_limit_and_spoof_protection PASSED",
      "tests/test_defense.py::test_auto_ban_and_log_masking                     PASSED",
      "tests/test_proxy.py::test_dual_target_vulnerable_vs_hardened_and_monitor   PASSED",
      "tests/test_sqli.py::test_sqli_evasion_and_benign_obrien_passes             PASSED",
      "tests/test_xss.py::test_xss_and_path_traversal_blocked_vs_benign_math      PASSED",
      "========================= 13 passed in 0.39s =========================",
    ],
    talkingPoint:
      "Toàn bộ logic proxy, 2 chế độ Web, các ca né lọc SQLi/XSS/LFI và phòng thủ hành vi đều có unit + integration test tự động chạy sạch 13/13 bằng pytest, không kiểm thử thủ công cảm tính.",
    codeReference: "tests/ (test_proxy.py, test_sqli.py, test_xss.py, test_defense.py)",
    portalDriver: { page: "comments", input: "5 < 10 va gpa > 8.0" },
    adminEvent: {
      time: "14:03:48",
      ip: "127.0.0.1",
      action: "INFO",
      detail: "Pytest Suite completed: 13 passed in 0.39s (0 failed)",
    },
  },
  {
    id: "4C",
    beatNumber: 4,
    stageCode: "4C",
    ownerMember: "Khánh",
    phaseTitle: "Nhịp 4 — Khánh: Kiểm thử Xâm nhập & Benchmark Khoa học",
    stageTitle: "Đo kiểm Khoa học 100 Mẫu (Precision / Recall / Latency p95)",
    topologySummary: "50 Attack + 50 Benign Edge Cases × 3 Loops = 300 Requests",
    wafMode: "BLOCKING",
    portalMode: "HARDENED",
    prompt: "khanh@mini-waf:~/mini-waf-project$",
    command: "python3 -m tests.benchmark",
    outputLines: [
      "[Ground Truth: 100 samples (50 Attack + 50 Benign Edge Cases) x 3 iterations]",
      "-------------------------------------------------------------------------",
      "Confusion Matrix  | TP = 50 | FP = 0 | TN = 50 | FN = 0",
      "Quality Metrics   | Precision = 100.00% | Recall = 100.00% | FPR = 0.00% | F1 = 100.00%",
      "OFF Baseline      | Backend Hits = 300 | Mean = 0.928 ms | p95 = 1.404 ms",
      "BLOCKING Mode     | Backend Hits = 150 | Mean = 1.637 ms (+0.709 ms) | p95 = 2.160 ms",
      "=========================================================================",
    ],
    talkingPoint:
      "Kết thúc thuyết trình bằng số liệu thực nghiệm đo bằng script trên 100 mẫu thật: TP=50, FP=0, F1=100%, và chi phí phụ trội của toàn bộ Proxy + Inspection Engine chỉ tốn +0.709 ms trung bình (p95 = 2.160 ms).",
    codeReference: "tests/benchmark.py (Real AsyncClient Benchmark on FastAPI App)",
    adminEvent: {
      time: "14:04:10",
      ip: "127.0.0.1",
      action: "INFO",
      detail: "Benchmark 100x3 done: F1=100.00%, FPR=0.00%, p95=2.160ms",
    },
  },
];

interface MiniWafScenarioPlayerProps {
  initialBeat?: number;
  onSyncTopology?: (state: { wafMode: WafMode; portalMode: PortalSecurityMode }) => void;
}

export function MiniWafScenarioPlayer({
  initialBeat,
  onSyncTopology,
}: MiniWafScenarioPlayerProps) {
  const [memberFilter, setMemberFilter] = useState<"ALL" | "Sơn" | "Hùng" | "Quyết" | "Khánh">("ALL");
  const [paceMode, setPaceMode] = useState<"slow" | "normal">("slow");
  const [activeIdx, setActiveIdx] = useState<number>(0);

  // Playback state starts completely clean until explicitly clicked
  const [status, setStatus] = useState<"idle" | "typing" | "streaming" | "paused" | "done">("idle");
  const [autoSequence, setAutoSequence] = useState(false);
  const [typedChars, setTypedChars] = useState(0);
  const [shownLines, setShownLines] = useState(0);
  const [portalCommand, setPortalCommand] = useState<PortalDriverCommand | null>(null);
  const cmdCounterRef = useRef(0);

  const visibleStages = useMemo(() => {
    if (memberFilter === "ALL") return MINI_WAF_SCENARIO_STAGES;
    return MINI_WAF_SCENARIO_STAGES.filter((s) => s.ownerMember === memberFilter);
  }, [memberFilter]);

  const currentStage = visibleStages[activeIdx] ?? MINI_WAF_SCENARIO_STAGES[0];
  const latestSyncRef = useRef(onSyncTopology);
  useEffect(() => {
    latestSyncRef.current = onSyncTopology;
  });

  // Sync deep-link ?beat=1..4 cleanly to the first stage of that beat (1A, 2A, 3A, 4A)
  useEffect(() => {
    if (!initialBeat || initialBeat < 1 || initialBeat > 4) return;
    setMemberFilter("ALL");
    const targetIdx = MINI_WAF_SCENARIO_STAGES.findIndex((s) => s.beatNumber === initialBeat);
    if (targetIdx >= 0) {
      setActiveIdx(targetIdx);
      setStatus("idle");
      setAutoSequence(false);
      setTypedChars(0);
      setShownLines(0);
    }
  }, [initialBeat]);

  const triggerPortalDriver = (stage: ScenarioStageSpec) => {
    if (!stage.portalDriver) return;
    cmdCounterRef.current += 1;
    setPortalCommand({
      id: cmdCounterRef.current,
      page: stage.portalDriver.page,
      input: stage.portalDriver.input,
    });
  };

  // Trigger topology + portal synchronization right when command execution finishes typing and starts streaming
  useEffect(() => {
    if (status === "streaming" && shownLines === 0) {
      latestSyncRef.current?.({
        wafMode: currentStage.wafMode,
        portalMode: currentStage.portalMode,
      });
      triggerPortalDriver(currentStage);
    }
  }, [status, shownLines, currentStage]);

  // Real character-by-character typing timer
  useEffect(() => {
    if (status !== "typing") return;
    const cmdLen = currentStage.command.length;
    if (typedChars >= cmdLen) {
      const waitMs = paceMode === "slow" ? 280 : 120;
      const t = setTimeout(() => setStatus("streaming"), waitMs);
      return () => clearTimeout(t);
    }
    const charMs = paceMode === "slow" ? 40 : 18;
    const t = setTimeout(() => setTypedChars((n) => n + 1), charMs);
    return () => clearTimeout(t);
  }, [status, typedChars, currentStage.command.length, paceMode]);

  // Line-by-line streaming timer
  useEffect(() => {
    if (status !== "streaming") return;
    const total = currentStage.outputLines.length;
    if (shownLines >= total) {
      setStatus("done");
      return;
    }
    const lineMs = paceMode === "slow" ? 260 : 110;
    const t = setTimeout(() => setShownLines((n) => n + 1), lineMs);
    return () => clearTimeout(t);
  }, [status, shownLines, currentStage.outputLines.length, paceMode]);

  // Optional auto-sequence advance with generous pause for presenter narration
  useEffect(() => {
    if (status !== "done" || !autoSequence) return;
    if (activeIdx + 1 >= visibleStages.length) {
      setAutoSequence(false);
      return;
    }
    const dwellMs = paceMode === "slow" ? 2400 : 1300;
    const t = setTimeout(() => {
      const next = activeIdx + 1;
      setActiveIdx(next);
      setTypedChars(0);
      setShownLines(0);
      setStatus("typing");
    }, dwellMs);
    return () => clearTimeout(t);
  }, [status, autoSequence, activeIdx, visibleStages.length, paceMode]);

  const startStage = (idx: number, withAutoSeq: boolean) => {
    const safeIdx = Math.max(0, Math.min(idx, visibleStages.length - 1));
    const stage = visibleStages[safeIdx];
    latestSyncRef.current?.({ wafMode: stage.wafMode, portalMode: stage.portalMode });
    setActiveIdx(safeIdx);
    setTypedChars(0);
    setShownLines(0);
    setAutoSequence(withAutoSeq);
    setStatus("typing");
  };

  const selectStageQuietly = (idx: number) => {
    const safeIdx = Math.max(0, Math.min(idx, visibleStages.length - 1));
    const stage = visibleStages[safeIdx];
    latestSyncRef.current?.({ wafMode: stage.wafMode, portalMode: stage.portalMode });
    setActiveIdx(safeIdx);
    setTypedChars(0);
    setShownLines(0);
    setAutoSequence(false);
    setStatus("idle");
  };

  const togglePause = () => {
    if (status === "typing" || status === "streaming") {
      setAutoSequence(false);
      setStatus("paused");
    } else if (status === "paused") {
      setStatus(typedChars < currentStage.command.length ? "typing" : "streaming");
    }
  };

  const resetAll = () => {
    setAutoSequence(false);
    setStatus("idle");
    setTypedChars(0);
    setShownLines(0);
    setPortalCommand(null);
  };

  const visibleCmd =
    status === "idle" && typedChars === 0
      ? ""
      : currentStage.command.slice(0, typedChars);
  const renderedLines = currentStage.outputLines.slice(0, shownLines);
  const completedCount = status === "done" ? activeIdx + 1 : activeIdx;
  const pct = Math.round((completedCount / visibleStages.length) * 100);

  return (
    <div className="space-y-4">
      {/* Control Header */}
      <div className="rounded-lg border border-hairline bg-subtle p-3.5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="font-mono text-[11px] font-semibold uppercase tracking-wider text-accent">
              Kịch bản 12 Bước Có Hướng Dẫn (Web Trực tiếp + Terminal + Admin :8888)
            </div>
            <p className="text-xs text-secondary mt-0.5">
              Đi từng bước hoặc bật chạy tuần tự: mỗi bước tự đồng bộ chế độ WAF/Web, điều khiển thẳng <strong className="text-ink">Website Quản lý Điểm Sinh viên</strong> bên trái và stream lệnh trên Terminal bên phải.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Speed toggle */}
            <div className="inline-flex items-center rounded border border-hairline bg-surface p-0.5 font-mono text-[11px]">
              <span className="inline-flex items-center gap-1 px-2 text-muted">
                <Gauge className="h-3 w-3" aria-hidden="true" />
                Nhịp:
              </span>
              {[
                { id: "slow" as const, label: "Chậm 1x" },
                { id: "normal" as const, label: "Chuẩn 2x" },
              ].map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPaceMode(p.id)}
                  className={`cursor-pointer rounded px-2 py-0.5 font-semibold ${
                    paceMode === p.id ? "bg-accent text-white" : "text-muted hover:text-ink"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Filter by member & step pills */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-hairline pt-2.5">
          <div className="flex flex-wrap items-center gap-1.5">
            {(["ALL", "Sơn", "Hùng", "Quyết", "Khánh"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => {
                  setMemberFilter(m);
                  setActiveIdx(0);
                  setAutoSequence(false);
                  setStatus("idle");
                  setTypedChars(0);
                  setShownLines(0);
                }}
                className={`cursor-pointer rounded-md border px-2.5 py-1 font-mono text-[11px] font-semibold transition-colors ${
                  memberFilter === m
                    ? "border-accent bg-accent text-white"
                    : "border-hairline bg-surface text-muted hover:text-ink"
                }`}
              >
                {m === "ALL" ? "Tất cả (12 bước)" : `Phần ${m} (3 bước)`}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => startStage(activeIdx, false)}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-md bg-ink px-3 py-1.5 font-mono text-xs font-semibold text-canvas hover:opacity-90"
            >
              <Play className="h-3.5 w-3.5" aria-hidden="true" />
              Chạy bước {currentStage.stageCode}
            </button>
            <button
              type="button"
              onClick={() => startStage(status === "done" ? Math.min(activeIdx + 1, visibleStages.length - 1) : activeIdx, true)}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-accent bg-accent/10 px-2.5 py-1.5 font-mono text-xs font-semibold text-accent hover:bg-accent/20"
            >
              <Play className="h-3.5 w-3.5" aria-hidden="true" />
              Chạy tự động
            </button>
            {(status === "typing" || status === "streaming" || status === "paused") && (
              <button
                type="button"
                onClick={togglePause}
                className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-amber-500/40 bg-amber-500/10 px-2.5 py-1.5 font-mono text-xs font-semibold text-amber-400 hover:bg-amber-500/20"
              >
                {status === "paused" ? (
                  <>
                    <Play className="h-3.5 w-3.5" aria-hidden="true" />
                    Tiếp tục
                  </>
                ) : (
                  <>
                    <Pause className="h-3.5 w-3.5" aria-hidden="true" />
                    Tạm dừng (Giải thích)
                  </>
                )}
              </button>
            )}
            <button
              type="button"
              onClick={resetAll}
              className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-hairline bg-surface px-2.5 py-1.5 font-mono text-xs font-semibold text-muted hover:text-ink"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              Đặt lại
            </button>
          </div>
        </div>

        {/* 12 Step Timeline Pills + Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex flex-wrap gap-1.5">
            {visibleStages.map((s, idx) => {
              const isCurrent = idx === activeIdx;
              const isDone = idx < activeIdx || (isCurrent && status === "done");
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => selectStageQuietly(idx)}
                  className={`cursor-pointer rounded border px-2 py-1 font-mono text-[11px] font-semibold transition-colors ${
                    isCurrent
                      ? "border-accent bg-accent text-white"
                      : isDone
                      ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-500"
                      : "border-hairline bg-surface text-muted hover:text-ink"
                  }`}
                  title={`${s.ownerMember}: ${s.stageTitle}`}
                >
                  {s.stageCode} · {s.ownerMember}
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-2 font-mono text-[10px] text-muted">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-hairline">
              <div
                className="h-full bg-accent transition-all duration-300"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span>
              Bước {activeIdx + 1}/{visibleStages.length}
            </span>
          </div>
        </div>
      </div>

      {/* Active Stage Summary & Navigation Banner */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-hairline bg-surface px-3.5 py-2.5 text-xs">
        <div className="space-y-0.5">
          <div className="font-mono text-[11px] font-semibold text-accent">
            {currentStage.phaseTitle} — [{currentStage.stageCode}]
          </div>
          <div className="font-semibold text-ink text-sm">
            {currentStage.stageTitle}
          </div>
          <div className="font-mono text-[11px] text-muted">
            {currentStage.topologySummary}
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            disabled={activeIdx <= 0}
            onClick={() => selectStageQuietly(activeIdx - 1)}
            className="inline-flex cursor-pointer items-center gap-1 rounded border border-hairline bg-subtle px-2.5 py-1.5 font-mono text-[11px] font-semibold text-ink disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" />
            Bước trước
          </button>
          <button
            type="button"
            disabled={activeIdx >= visibleStages.length - 1}
            onClick={() => startStage(activeIdx + 1, false)}
            className="inline-flex cursor-pointer items-center gap-1 rounded bg-accent px-2.5 py-1.5 font-mono text-[11px] font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            Chạy bước tiếp theo
            <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Dual Stage: LEFT = Live Student Portal Browser, RIGHT = Terminal + Admin Telemetry */}
      <div className="grid gap-4 lg:grid-cols-12">
        {/* LEFT (7 cols on lg): VISIBLE LIVE WEB PORTAL */}
        <div className="lg:col-span-7 space-y-2">
          <div className="flex items-center justify-between px-1">
            <span className="inline-flex items-center gap-1.5 font-mono text-[11px] font-semibold text-ink">
              <Globe className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
              Màn hình Trình duyệt Thực tế — Website Quản lý Điểm Sinh viên
            </span>
            <span className="font-mono text-[10px] text-muted">
              {currentStage.portalDriver
                ? `Đồng bộ bước ${currentStage.stageCode}: /${currentStage.portalDriver.page}`
                : "Bạn vẫn có thể bấm thử trực tiếp trên Web"}
            </span>
          </div>

          <StudentPortalEmulator
            wafMode={currentStage.wafMode}
            portalMode={currentStage.portalMode}
            ipBanned={Boolean(currentStage.ipBanned)}
            externalCommand={portalCommand}
          />
        </div>

        {/* RIGHT (5 cols on lg): TERMINAL + ADMIN TELEMETRY + DEFENSE TALKING POINT */}
        <div className="lg:col-span-5 space-y-3">
          {/* CLI Terminal */}
          <div className="rounded-lg border border-zinc-800 bg-[#0d1117] p-3.5 font-mono text-xs text-zinc-200">
            <div className="mb-2.5 flex items-center justify-between border-b border-zinc-800 pb-2">
              <div className="flex items-center gap-2">
                <WindowControls
                  onClose={resetAll}
                  closeTitle="Đặt lại Terminal"
                />
                <span className="inline-flex items-center gap-1 font-semibold text-zinc-300">
                  <Terminal className="h-3 w-3 text-sky-400" aria-hidden="true" />
                  Terminal ({currentStage.ownerMember})
                </span>
              </div>
              <span
                className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                  status === "idle"
                    ? "bg-zinc-800 text-zinc-400"
                    : status === "paused"
                    ? "bg-amber-500/20 text-amber-300"
                    : status === "done"
                    ? "bg-emerald-500/20 text-emerald-300"
                    : "bg-sky-500/20 text-sky-300"
                }`}
              >
                {status === "idle"
                  ? "CHỜ BẤM CHẠY"
                  : status === "typing"
                  ? "ĐANG GÕ LỆNH..."
                  : status === "streaming"
                  ? "ĐANG NHẬN PHẢN HỒI..."
                  : status === "paused"
                  ? "TẠM DỪNG GIẢI THÍCH"
                  : "HOÀN TẤT BƯỚC"}
              </span>
            </div>

            <div className="min-h-[210px] space-y-2 leading-relaxed">
              <div>
                <span className="text-emerald-400">{currentStage.prompt}</span>{" "}
                <span className="text-white break-all">{visibleCmd}</span>
                {(status === "idle" || status === "typing" || status === "paused") && (
                  <span className="ml-0.5 inline-block h-3.5 w-1.5 animate-pulse bg-zinc-200 align-middle" />
                )}
              </div>

              {renderedLines.length > 0 && (
                <div className="space-y-1 border-l-2 border-zinc-700 pl-2.5 text-[11px]">
                  {renderedLines.map((line, i) => (
                    <div
                      key={i}
                      className={
                        line.includes("403") || line.includes("CRITICAL") || line.includes("AUTO-BAN")
                          ? "text-rose-400"
                          : line.includes("429") || line.includes("WARNING") || line.includes("VULNERABLE")
                          ? "text-amber-300"
                          : line.includes("PASSED") || line.includes("200 OK") || line.includes("100.00%")
                          ? "text-emerald-400"
                          : "text-zinc-300"
                      }
                    >
                      {line}
                    </div>
                  ))}
                </div>
              )}

              {status === "idle" && (
                <div className="pt-2 text-[11px] text-zinc-500">
                  Bấm <span className="text-zinc-300">Chạy bước {currentStage.stageCode}</span> để xem lệnh gõ từng ký tự và quan sát phản ứng đồng thời trên Website bên trái.
                </div>
              )}
            </div>
          </div>

          {/* Admin :8888 + Telegram Panel */}
          <div className="rounded-lg border border-hairline bg-surface p-3 text-xs space-y-2">
            <div className="flex items-center justify-between border-b border-hairline pb-1.5 font-mono text-[11px]">
              <span className="font-semibold text-ink">
                Admin Monitor (127.0.0.1:8888)
              </span>
              <span
                className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                  currentStage.wafMode === "BLOCKING"
                    ? "bg-emerald-500/15 text-emerald-500"
                    : currentStage.wafMode === "OFF"
                    ? "bg-rose-500/15 text-rose-500"
                    : "bg-amber-500/15 text-amber-500"
                }`}
              >
                WAF: {currentStage.wafMode}
              </span>
            </div>

            {status === "streaming" || status === "done" ? (
              <div className="space-y-2 font-mono text-[11px]">
                <div className="rounded border border-hairline bg-subtle p-2">
                  <div className="flex items-center justify-between">
                    <span className="text-muted">
                      [{currentStage.adminEvent.time}] {currentStage.adminEvent.ip}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 font-bold ${
                        currentStage.adminEvent.action === "BLOCKED" ||
                        currentStage.adminEvent.action === "BANNED"
                          ? "text-rose-500"
                          : currentStage.adminEvent.action === "RATE_LIMITED"
                          ? "text-amber-500"
                          : "text-emerald-500"
                      }`}
                    >
                      {currentStage.adminEvent.action === "ALLOWED" ? (
                        <ShieldCheck className="h-3 w-3" aria-hidden="true" />
                      ) : (
                        <ShieldAlert className="h-3 w-3" aria-hidden="true" />
                      )}
                      {currentStage.adminEvent.action}
                    </span>
                  </div>
                  <div className="mt-1 text-secondary break-all">
                    {currentStage.adminEvent.detail}
                  </div>
                </div>

                {currentStage.ipBanned && (
                  <div className="flex items-center justify-between rounded border border-rose-500/30 bg-rose-500/10 px-2.5 py-1.5 text-rose-500">
                    <span>Blacklist đang khóa IP 203.0.113.9 (300s)</span>
                    <span className="inline-flex items-center gap-1 font-semibold">
                      <Unlock className="h-3 w-3" aria-hidden="true" />
                      Bước 3C sẽ Unban
                    </span>
                  </div>
                )}

                {currentStage.telegramAlert && (
                  <div className="flex items-start gap-1.5 rounded border border-sky-500/30 bg-sky-500/10 p-2 text-sky-400">
                    <Bell className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    <span>{currentStage.telegramAlert}</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-2 font-mono text-[11px] text-muted">
                Nhật ký :8888 và cảnh báo Telegram sẽ cập nhật ngay khi request được gửi đi.
              </div>
            )}
          </div>

          {/* Member Defense Talking Point */}
          <div className="rounded-lg border border-accent/30 bg-accent/5 p-3 text-xs space-y-1.5">
            <div className="font-mono text-[11px] font-bold uppercase tracking-wider text-accent">
              Điểm kỹ thuật ({currentStage.ownerMember})
            </div>
            <p className="leading-relaxed text-secondary">
              {currentStage.talkingPoint}
            </p>
            <div className="font-mono text-[10px] text-muted">
              Mã nguồn: <code className="text-ink">{currentStage.codeReference}</code>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
