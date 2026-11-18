"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Columns2,
  FolderOpen,
  Globe,
  Maximize2,
  Minimize2,
  PanelRightClose,
  PanelRightOpen,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Rows2,
  Search,
  Send,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Square,
  X,
} from "lucide-react";
import { WindowControls } from "@/components/WindowBar";

export type BurpWalkthroughId =
  | "m2-s1"
  | "m2-s2"
  | "m2-full"
  | "m4-s2"
  | "m4-s3"
  | "m4-full";

export interface BurpAutoplayRequest {
  id: number;
  walkthroughId: BurpWalkthroughId;
}

export interface BurpPacketEvent {
  idParam: string;
  securityLevel: "low" | "impossible";
  includeToken: boolean;
  userToken: string;
  phpsessid: string;
  statusCode: number;
  bytes: number;
  source: "Repeater" | "Proxy Intercept";
}

interface BurpSuiteEmulatorProps {
  mode: "poc2" | "poc5";
  defaultModule?: "proxy" | "repeater";
  phpsessid: string;
  userToken?: string;
  externalSecurity?: "low" | "impossible";
  externalIncludeToken?: boolean;
  externalId?: string;
  externalSyncKey?: number;
  autoplayRequest?: BurpAutoplayRequest | null;
  onPacketSent?: (evt: BurpPacketEvent) => void;
  onActiveTabChange?: (evt: BurpPacketEvent) => void;
}

type WalkSpeed = "slow" | "normal" | "fast";
type WalkPhase = "idle" | "gliding" | "typing" | "acting" | "observing" | "done";
type WalkTypeField = "port" | "browser-url" | "browser-id" | "inspector-id";

type WalkActionType =
  | "focus-proxy"
  | "open-proxy-settings"
  | "apply-port"
  | "open-proxy-intercept"
  | "focus-target"
  | "submit-loopback"
  | "submit-localtest"
  | "highlight-buffer"
  | "send-to-repeater"
  | "turn-off-intercept"
  | "focus-repeater"
  | "send-repeater"
  | "select-tab-1"
  | "select-tab-2"
  | "select-tab-3"
  | "set-sec-impossible"
  | "highlight-response"
  | "switch-res-render"
  | "rotate-token";

interface WalkStepSpec {
  target: string;
  label: string;
  detail: string;
  action: WalkActionType;
  typeField?: WalkTypeField;
  typeValue?: string;
}

const WALK_TIMINGS: Record<WalkSpeed, { glide: number; act: number; observe: number }> = {
  slow: { glide: 1350, act: 550, observe: 1100 },
  normal: { glide: 950, act: 420, observe: 800 },
  fast: { glide: 550, act: 280, observe: 450 },
};

const M2_S1_STEPS: WalkStepSpec[] = [
  {
    target: "tab-proxy",
    label: "Mở module Proxy",
    detail: "Chọn tab Proxy trên thanh công cụ chính của Burp Suite.",
    action: "focus-proxy",
  },
  {
    target: "subtab-settings",
    label: "Mở Proxy settings",
    detail: "Mở Proxy settings -> Proxy Listeners để đổi cổng tránh xung đột 8080 của Docker.",
    action: "open-proxy-settings",
  },
  {
    target: "port-input",
    label: "Gõ cổng 8081",
    detail: "Nhập cổng lắng nghe mới 8081 vào ô Bind to port.",
    action: "focus-target",
    typeField: "port",
    typeValue: "8081",
  },
  {
    target: "btn-port-apply",
    label: "Bấm OK áp dụng cổng 8081",
    detail: "Xác nhận kích hoạt Proxy Listener trên 127.0.0.1:8081.",
    action: "apply-port",
  },
  {
    target: "subtab-intercept",
    label: "Quay lại Intercept",
    detail: "Quay về Proxy -> Intercept kèm trình duyệt Burp Embedded Chromium.",
    action: "open-proxy-intercept",
  },
  {
    target: "browser-url-input",
    label: "Gõ http://127.0.0.1:8080/vulnerabilities/sqli/",
    detail: "Gõ địa chỉ 127.0.0.1:8080 trên thanh URL để kiểm chứng cơ chế Loopback Bypass.",
    action: "focus-target",
    typeField: "browser-url",
    typeValue: "http://127.0.0.1:8080/vulnerabilities/sqli/",
  },
  {
    target: "btn-browser-submit",
    label: "Bấm Submit",
    detail: "Submit thử: Chromium bỏ qua Proxy khi gọi 127.0.0.1, Proxy không thấy gói tin.",
    action: "submit-loopback",
  },
  {
    target: "browser-url-input",
    label: "Gõ http://localtest.me:8080/vulnerabilities/sqli/",
    detail: "Sửa địa chỉ thành http://localtest.me:8080/vulnerabilities/sqli/ để đi qua Proxy 8081.",
    action: "focus-target",
    typeField: "browser-url",
    typeValue: "http://localtest.me:8080/vulnerabilities/sqli/",
  },
  {
    target: "browser-id-input",
    label: "Gõ User ID = 1",
    detail: "Nhập User ID = 1 trên giao diện DVWA.",
    action: "focus-target",
    typeField: "browser-id",
    typeValue: "1",
  },
  {
    target: "btn-browser-submit",
    label: "Bấm Submit & Bắt gói tin",
    detail: "Proxy 8081 đánh chặn trọn vẹn gói tin HTTP GET tại Proxy -> Intercept.",
    action: "submit-localtest",
  },
];

const M2_S2_STEPS: WalkStepSpec[] = [
  {
    target: "intercept-buffer",
    label: "Đọc Cookie PHPSESSID",
    detail: "Đọc dòng Cookie: security=low; PHPSESSID=... ngay trong gói tin bị chặn.",
    action: "highlight-buffer",
  },
  {
    target: "btn-send-to-repeater",
    label: "Send to Repeater (Ctrl+R)",
    detail: "Chuyển bản sao gói tin sang công cụ Repeater để chỉnh sửa payload.",
    action: "send-to-repeater",
  },
  {
    target: "tab-proxy",
    label: "Quay lại Proxy",
    detail: "Mở lại tab Proxy để tắt chế độ chặn, tránh làm treo trình duyệt DVWA.",
    action: "focus-proxy",
  },
  {
    target: "btn-intercept-toggle",
    label: "Tắt Intercept is off",
    detail: "Tắt Intercept để lưu lượng trình duyệt không bị giữ lại.",
    action: "turn-off-intercept",
  },
  {
    target: "tab-repeater",
    label: "Mở tab Repeater",
    detail: "Chuyển sang tab Repeater vừa nhận gói tin PoC 2.",
    action: "focus-repeater",
  },
  {
    target: "inspector-id",
    label: "Gõ id = 1'",
    detail: "Gõ dấu nháy đơn (') vào tham số id trong Inspector.",
    action: "focus-target",
    typeField: "inspector-id",
    typeValue: "1'",
  },
  {
    target: "btn-repeater-send",
    label: "Bấm Send (id=1')",
    detail: "Gửi gói tin id=1' -> Response trả lỗi cú pháp MariaDB (CWE-89) & ghi access.log.",
    action: "send-repeater",
  },
  {
    target: "inspector-id",
    label: "Gõ id = ' OR '1'='1",
    detail: "Gõ payload ' OR '1'='1 vào tham số id trong Inspector để dump toàn bảng users.",
    action: "focus-target",
    typeField: "inspector-id",
    typeValue: "' OR '1'='1",
  },
  {
    target: "btn-repeater-send",
    label: "Bấm Send (Dump 5 users)",
    detail: "Gửi payload -> Response hiển thị cả 5 tài khoản DVWA.",
    action: "send-repeater",
  },
];

const M4_S2_STEPS: WalkStepSpec[] = [
  {
    target: "repeater-tab-1",
    label: "Xem Tab 1 (security=low)",
    detail: "Quan sát request cũ ở mức security=low đang dính lỗi SQL syntax MariaDB.",
    action: "select-tab-1",
  },
  {
    target: "repeater-tab-2",
    label: "Mở Tab 2 (PoC 5 Gốc)",
    detail: "Chuyển sang Tab 2 không chứa tham số user_token.",
    action: "select-tab-2",
  },
  {
    target: "inspector-id",
    label: "Gõ id = 1'",
    detail: "Giữ payload id=1' trên gói tin thiếu user_token.",
    action: "focus-target",
    typeField: "inspector-id",
    typeValue: "1'",
  },
  {
    target: "inspector-sec-impossible",
    label: "Đổi Cookie -> impossible",
    detail: "Đổi Cookie thành security=impossible trong Inspector.",
    action: "set-sec-impossible",
  },
  {
    target: "btn-repeater-send",
    label: "Bấm Send",
    detail: "Bấm Send -> Máy chủ gọi checkToken() ở dòng 5 trong impossible.php.",
    action: "send-repeater",
  },
  {
    target: "res-view-render",
    label: "Mở chế độ Render",
    detail: "Phản hồi HTTP 302 Found -> Location: index.php (chặn ngay tại Anti-CSRF).",
    action: "switch-res-render",
  },
];

const M4_S3_STEPS: WalkStepSpec[] = [
  {
    target: "repeater-tab-3",
    label: "Mở Tab 3 (Có user_token)",
    detail: "Chuyển sang Tab 3 có kèm tham số Anti-CSRF user_token.",
    action: "select-tab-3",
  },
  {
    target: "inspector-rotate-token",
    label: "Lấy user_token mới",
    detail: "Trích xuất mã user_token phiên hợp lệ mới nhất từ form DVWA.",
    action: "rotate-token",
  },
  {
    target: "inspector-id",
    label: "Gõ id = 1",
    detail: "Gõ id=1 kèm user_token hợp lệ để kiểm chứng truy vấn chuẩn qua PDO.",
    action: "focus-target",
    typeField: "inspector-id",
    typeValue: "1",
  },
  {
    target: "btn-repeater-send",
    label: "Bấm Send (id=1)",
    detail: "Qua đủ 3 chốt checkToken -> is_numeric('1') -> PDO::PARAM_INT (200 OK).",
    action: "send-repeater",
  },
  {
    target: "inspector-rotate-token",
    label: "Lấy user_token vòng kế",
    detail: "Lấy user_token mới cho lượt kiểm thử tấn công tiếp theo.",
    action: "rotate-token",
  },
  {
    target: "inspector-id",
    label: "Gõ id = 1'",
    detail: "Gõ payload SQLi id=1' kèm token hợp lệ để xuyên qua checkToken() dòng 5.",
    action: "focus-target",
    typeField: "inspector-id",
    typeValue: "1'",
  },
  {
    target: "btn-repeater-send",
    label: "Bấm Send (id=1' + Token)",
    detail: "Qua checkToken(), nhưng bị is_numeric(\"1'\") ở dòng 11 chặn trước khi gọi SQL.",
    action: "send-repeater",
  },
  {
    target: "res-view-render",
    label: "Mở chế độ Render",
    detail: "200 OK rỗng, hoàn toàn không lộ lỗi cú pháp MariaDB.",
    action: "switch-res-render",
  },
];

function getWalkthroughSteps(id: BurpWalkthroughId): WalkStepSpec[] {
  switch (id) {
    case "m2-s1":
      return M2_S1_STEPS;
    case "m2-s2":
      return M2_S2_STEPS;
    case "m2-full":
      return [...M2_S1_STEPS, ...M2_S2_STEPS];
    case "m4-s2":
      return M4_S2_STEPS;
    case "m4-s3":
      return M4_S3_STEPS;
    case "m4-full":
      return [...M4_S2_STEPS, ...M4_S3_STEPS];
  }
}

type ModuleTab =
  | "dashboard"
  | "target"
  | "proxy"
  | "intruder"
  | "repeater"
  | "decoder"
  | "logger";

interface RepeaterTabItem {
  id: number;
  title: string;
  rawRequest: string;
  rawResponse: string;
  statusCode: number;
  latencyMs: number;
  history: { request: string; response: string; statusCode: number; latencyMs: number }[];
  historyCursor: number;
}

interface HttpHistoryRow {
  idx: number;
  host: string;
  method: string;
  url: string;
  params: string;
  status: number;
  length: number;
  mime: string;
  ip: string;
  time: string;
  request: string;
  response: string;
}

// Pure RFC 1321 MD5 for authentic Decoder hash verification
function md5Hex(input: string): string {
  const bytes = new TextEncoder().encode(input);
  const k = [
    0xd76aa478, 0xe8c7b756, 0x242070db, 0xc1bdceee, 0xf57c0faf, 0x4787c62a, 0xa8304613, 0xfd469501,
    0x698098d8, 0x8b44f7af, 0xffff5bb1, 0x895cd7be, 0x6b901122, 0xfd987193, 0xa679438e, 0x49b40821,
    0xf61e2562, 0xc040b340, 0x265e5a51, 0xe9b6c7aa, 0xd62f105d, 0x02441453, 0xd8a1e681, 0xe7d3fbc8,
    0x21e1cde6, 0xc33707d6, 0xf4d50d87, 0x455a14ed, 0xa9e3e905, 0xfcefa3f8, 0x676f02d9, 0x8d2a4c8a,
    0xfffa3942, 0x8771f681, 0x6d9d6122, 0xfde5380c, 0xa4beea44, 0x4bdecfa9, 0xf6bb4b60, 0xbebfbc70,
    0x289b7ec6, 0xeaa127fa, 0xd4ef3085, 0x04881d05, 0xd9d4d039, 0xe6db99e5, 0x1fa27cf8, 0xc4ac5665,
    0xf4292244, 0x432aff97, 0xab9423a7, 0xfc93a039, 0x655b59c3, 0x8f0ccc92, 0xffeff47d, 0x85845dd1,
    0x6fa87e4f, 0xfe2ce6e0, 0xa3014314, 0x4e0811a1, 0xf7537e82, 0xbd3af235, 0x2ad7d2bb, 0xeb86d391,
  ];
  const s = [
    7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22,
    5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20,
    4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23,
    6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21,
  ];

  const origLenBits = bytes.length * 8;
  const padLen = ((56 - ((bytes.length + 1) % 64)) + 64) % 64;
  const padded = new Uint8Array(bytes.length + 1 + padLen + 8);
  padded.set(bytes);
  padded[bytes.length] = 0x80;
  const dv = new DataView(padded.buffer);
  dv.setUint32(padded.length - 8, origLenBits >>> 0, true);
  dv.setUint32(padded.length - 4, Math.floor(origLenBits / 0x100000000), true);

  let a0 = 0x67452301;
  let b0 = 0xefcdab89;
  let c0 = 0x98badcfe;
  let d0 = 0x10325476;

  for (let offset = 0; offset < padded.length; offset += 64) {
    const M = new Uint32Array(16);
    for (let j = 0; j < 16; j++) M[j] = dv.getUint32(offset + j * 4, true);

    let A = a0;
    let B = b0;
    let C = c0;
    let D = d0;

    for (let i = 0; i < 64; i++) {
      let F = 0;
      let g = 0;
      if (i < 16) {
        F = (B & C) | (~B & D);
        g = i;
      } else if (i < 32) {
        F = (D & B) | (~D & C);
        g = (5 * i + 1) % 16;
      } else if (i < 48) {
        F = B ^ C ^ D;
        g = (3 * i + 5) % 16;
      } else {
        F = C ^ (B | ~D);
        g = (7 * i) % 16;
      }
      const dTemp = D;
      D = C;
      C = B;
      const sum = (A + F + k[i] + M[g]) >>> 0;
      const rot = ((sum << s[i]) | (sum >>> (32 - s[i]))) >>> 0;
      B = (B + rot) >>> 0;
      A = dTemp;
    }

    a0 = (a0 + A) >>> 0;
    b0 = (b0 + B) >>> 0;
    c0 = (c0 + C) >>> 0;
    d0 = (d0 + D) >>> 0;
  }

  return [a0, b0, c0, d0]
    .map((n) => {
      const b = [n & 0xff, (n >> 8) & 0xff, (n >> 16) & 0xff, (n >> 24) & 0xff];
      return b.map((x) => x.toString(16).padStart(2, "0")).join("");
    })
    .join("");
}

function toHexDump(text: string): string {
  const bytes = new TextEncoder().encode(text.slice(0, 640));
  const rows: string[] = [];
  for (let i = 0; i < bytes.length; i += 16) {
    const slice = bytes.slice(i, i + 16);
    const offset = i.toString(16).padStart(8, "0");
    const hexPart = Array.from(slice)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join(" ")
      .padEnd(47, " ");
    const asciiPart = Array.from(slice)
      .map((b) => (b >= 32 && b <= 126 ? String.fromCharCode(b) : "."))
      .join("");
    rows.push(`${offset}  ${hexPart}  |${asciiPart}|`);
  }
  return rows.join("\n");
}

function buildHttpRequest({
  idVal,
  urlEncode = false,
  includeToken,
  userToken,
  securityLevel,
  phpsessid,
}: {
  idVal: string;
  urlEncode?: boolean;
  includeToken: boolean;
  userToken: string;
  securityLevel: "low" | "impossible";
  phpsessid: string;
}): string {
  const idStr = urlEncode ? encodeURIComponent(idVal) : idVal;
  const tokenPart = includeToken ? `&user_token=${userToken}` : "";
  return `GET /vulnerabilities/sqli/?id=${idStr}&Submit=Submit${tokenPart} HTTP/1.1
Host: localtest.me:8080
User-Agent: Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/130.0.0.0 Safari/537.36
Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8
Cookie: security=${securityLevel}; PHPSESSID=${phpsessid}
Connection: close`;
}

function parseHttpRequest(raw: string, fallbackSession: string, fallbackToken: string) {
  const firstLine = raw.split("\n")[0] || "GET /vulnerabilities/sqli/?id=1&Submit=Submit HTTP/1.1";
  const urlMatch = firstLine.match(/^(GET|POST)\s+(\S+)/i);
  const method = (urlMatch?.[1] ?? "GET").toUpperCase();
  const fullPath = urlMatch?.[2] ?? "/vulnerabilities/sqli/?id=1&Submit=Submit";
  const [pathOnly, queryString = ""] = fullPath.split("?");

  const idMatch = queryString.match(/(?:^|&)id=([^&]*)/);
  let idVal = idMatch ? idMatch[1] : "1";
  try {
    idVal = decodeURIComponent(idVal.replace(/\+/g, " "));
  } catch {
    // keep raw if malformed percent encoding
  }

  const tokenMatch = queryString.match(/(?:^|&)user_token=([^&]*)/);
  const includeToken = Boolean(tokenMatch);
  const userToken = tokenMatch?.[1] || fallbackToken;

  const secMatch = raw.match(/Cookie:[^\n]*security=(low|medium|high|impossible)/i);
  const securityLevel: "low" | "impossible" =
    secMatch?.[1]?.toLowerCase() === "impossible" ? "impossible" : "low";

  const sessMatch = raw.match(/Cookie:[^\n]*PHPSESSID=([a-zA-Z0-9]+)/i);
  const phpsessid = sessMatch?.[1] || fallbackSession;

  return {
    method,
    pathOnly,
    fullPath,
    idVal,
    includeToken,
    userToken,
    securityLevel,
    phpsessid,
  };
}

function simulateDvwaHttpResponse(
  rawReq: string,
  fallbackSession: string,
  fallbackToken: string
): {
  statusCode: number;
  rawResponse: string;
  latencyMs: number;
  bytes: number;
  parsed: ReturnType<typeof parseHttpRequest>;
  renderType: "normal" | "error" | "dump5" | "union" | "redirect302" | "impossible_safe" | "index";
} {
  const parsed = parseHttpRequest(rawReq, fallbackSession, fallbackToken);

  if (parsed.pathOnly.includes("index.php")) {
    const body = `<!DOCTYPE html>
<html><head><title>Welcome :: DVWA</title></head>
<body>
  <h1>Welcome to Damn Vulnerable Web Application!</h1>
  <p>Yêu cầu đã được chuyển hướng về trang chủ index.php (Redirect target).</p>
</body></html>`;
    const rawResponse = `HTTP/1.1 200 OK
Date: Wed, 04 Nov 2026 02:07:35 GMT
Server: Apache/2.4.25 (Debian)
Content-Length: ${body.length}
Content-Type: text/html;charset=utf-8

${body}`;
    return {
      statusCode: 200,
      rawResponse,
      latencyMs: 11,
      bytes: rawResponse.length,
      parsed,
      renderType: "index",
    };
  }

  if (parsed.securityLevel === "impossible") {
    if (!parsed.includeToken) {
      const rawResponse = `HTTP/1.1 302 Found
Date: Wed, 04 Nov 2026 02:07:32 GMT
Server: Apache/2.4.25 (Debian)
Location: index.php
Content-Length: 0
Content-Type: text/html; charset=UTF-8`;
      return {
        statusCode: 302,
        rawResponse,
        latencyMs: 9,
        bytes: rawResponse.length,
        parsed,
        renderType: "redirect302",
      };
    }

    if (parsed.idVal !== "1" && !/^\d+$/.test(parsed.idVal)) {
      const body = `<div class="vulnerable_code_area">
  <h3>Vulnerability: SQL Injection (Impossible)</h3>
  <form action="#" method="GET">
    <p>User ID: <input type="text" size="15" name="id"></p>
    <input type="submit" name="Submit" value="Submit">
    <input type="hidden" name="user_token" value="9f8e7d6c5b4a3210fedcba9876543210">
  </form>
  <!-- checkToken() đã xác thực xong -> is_numeric("${parsed.idVal}") === FALSE -> Bỏ qua truy vấn SQL, PDO không chạm DB -->
</div>`;
      const rawResponse = `HTTP/1.1 200 OK
Date: Wed, 04 Nov 2026 02:08:12 GMT
Server: Apache/2.4.25 (Debian)
Content-Length: ${body.length}
Content-Type: text/html;charset=utf-8

${body}`;
      return {
        statusCode: 200,
        rawResponse,
        latencyMs: 14,
        bytes: rawResponse.length,
        parsed,
        renderType: "impossible_safe",
      };
    }

    const body = `<div class="vulnerable_code_area">
  <h3>Vulnerability: SQL Injection (Impossible)</h3>
  <pre>ID: ${parsed.idVal}<br />First name: admin<br />Surname: admin</pre>
  <input type="hidden" name="user_token" value="9f8e7d6c5b4a3210fedcba9876543210">
</div>`;
    const rawResponse = `HTTP/1.1 200 OK
Date: Wed, 04 Nov 2026 02:08:20 GMT
Server: Apache/2.4.25 (Debian)
Content-Length: ${body.length}
Content-Type: text/html;charset=utf-8

${body}`;
    return {
      statusCode: 200,
      rawResponse,
      latencyMs: 15,
      bytes: rawResponse.length,
      parsed,
      renderType: "normal",
    };
  }

  // security=low
  const isUnion = /union\s+select/i.test(parsed.idVal);
  const isOrTrue = /'\s*or\s*'1'='1|or\s+1=1/i.test(parsed.idVal);
  const hasQuoteErr = parsed.idVal.includes("'") && !isUnion && !isOrTrue;

  if (isUnion) {
    const body = `<div class="vulnerable_code_area">
  <pre>ID: ${parsed.idVal}<br />First name: admin<br />Surname: 5f4dcc3b5aa765d61d8327deb882cf99</pre>
  <pre>First name: gordonb<br />Surname: e99a18c428cb38d5f260853678922e03</pre>
  <pre>First name: 1337<br />Surname: 8d3533d75ae2c3966d7e0d4fcc69216b</pre>
  <pre>First name: pablo<br />Surname: 0d107d09f5bbe40cade3de5c71e9e9b7</pre>
  <pre>First name: smithy<br />Surname: 5f4dcc3b5aa765d61d8327deb882cf99</pre>
</div>`;
    const rawResponse = `HTTP/1.1 200 OK
Date: Wed, 04 Nov 2026 02:14:50 GMT
Server: Apache/2.4.25 (Debian)
Content-Length: ${body.length}
Content-Type: text/html;charset=utf-8

${body}`;
    return {
      statusCode: 200,
      rawResponse,
      latencyMs: 22,
      bytes: rawResponse.length,
      parsed,
      renderType: "union",
    };
  }

  if (isOrTrue) {
    const body = `<div class="vulnerable_code_area">
  <pre>ID: ${parsed.idVal}<br />First name: admin<br />Surname: admin</pre>
  <pre>ID: ${parsed.idVal}<br />First name: Gordon<br />Surname: Brown</pre>
  <pre>ID: ${parsed.idVal}<br />First name: Hack<br />Surname: Me</pre>
  <pre>ID: ${parsed.idVal}<br />First name: Pablo<br />Surname: Picasso</pre>
  <pre>ID: ${parsed.idVal}<br />First name: Bob<br />Surname: Smith</pre>
</div>`;
    const rawResponse = `HTTP/1.1 200 OK
Date: Wed, 04 Nov 2026 02:14:30 GMT
Server: Apache/2.4.25 (Debian)
Content-Length: ${body.length}
Content-Type: text/html;charset=utf-8

${body}`;
    return {
      statusCode: 200,
      rawResponse,
      latencyMs: 20,
      bytes: rawResponse.length,
      parsed,
      renderType: "dump5",
    };
  }

  if (hasQuoteErr) {
    const body = `<pre>You have an error in your SQL syntax; check the manual that corresponds to your MariaDB server version for the right syntax to use near '''${parsed.idVal}''' at line 1</pre>`;
    const rawResponse = `HTTP/1.1 200 OK
Date: Wed, 04 Nov 2026 02:14:08 GMT
Server: Apache/2.4.25 (Debian)
Expires: Tue, 23 Jun 2009 12:00:00 GMT
Cache-Control: no-cache, must-revalidate
Content-Length: ${body.length}
Content-Type: text/html;charset=utf-8

${body}`;
    return {
      statusCode: 200,
      rawResponse,
      latencyMs: 18,
      bytes: rawResponse.length,
      parsed,
      renderType: "error",
    };
  }

  const body = `<div class="vulnerable_code_area">
  <pre>ID: ${parsed.idVal}<br />First name: admin<br />Surname: admin</pre>
</div>`;
  const rawResponse = `HTTP/1.1 200 OK
Date: Wed, 04 Nov 2026 02:13:55 GMT
Server: Apache/2.4.25 (Debian)
Content-Length: ${body.length}
Content-Type: text/html;charset=utf-8

${body}`;
  return {
    statusCode: 200,
    rawResponse,
    latencyMs: 13,
    bytes: rawResponse.length,
    parsed,
    renderType: "normal",
  };
}

function renderPrettyHttpText(raw: string, searchQuery: string) {
  const q = searchQuery.trim();
  const [headerPart, ...bodyParts] = raw.split("\n\n");
  const headerLines = (headerPart || "").split("\n");
  const bodyText = bodyParts.join("\n\n");

  const highlightMatch = (line: string) => {
    if (!q) return line;
    const lower = line.toLowerCase();
    const qLower = q.toLowerCase();
    const parts: React.ReactNode[] = [];
    let cursor = 0;
    let idx = lower.indexOf(qLower, cursor);
    let key = 0;
    while (idx !== -1) {
      if (idx > cursor) parts.push(line.slice(cursor, idx));
      parts.push(
        <mark key={key++} className="rounded bg-amber-400/90 px-0.5 text-black">
          {line.slice(idx, idx + q.length)}
        </mark>
      );
      cursor = idx + q.length;
      idx = lower.indexOf(qLower, cursor);
    }
    if (cursor < line.length) parts.push(line.slice(cursor));
    return parts;
  };

  return (
    <div className="space-y-2 font-mono text-[11.5px] leading-relaxed">
      <div>
        {headerLines.map((line, i) => {
          if (i === 0) {
            const is302 = line.includes("302");
            return (
              <div
                key={i}
                className={`font-bold ${
                  is302 ? "text-amber-300" : "text-emerald-400"
                }`}
              >
                {highlightMatch(line)}
              </div>
            );
          }
          const colonIdx = line.indexOf(":");
          if (colonIdx > 0) {
            const name = line.slice(0, colonIdx);
            const val = line.slice(colonIdx);
            return (
              <div key={i}>
                <span className="text-[#79c0ff]">{highlightMatch(name)}</span>
                <span className="text-zinc-300">{highlightMatch(val)}</span>
              </div>
            );
          }
          return (
            <div key={i} className="text-zinc-300">
              {highlightMatch(line)}
            </div>
          );
        })}
      </div>

      {bodyText && (
        <div className="border-t border-[#383a40] pt-2 text-[#e6edf3] whitespace-pre-wrap">
          {bodyText.split("\n").map((line, i) => (
            <div
              key={i}
              className={
                line.includes("SQL syntax")
                  ? "text-rose-300 font-semibold"
                  : line.includes("First name:")
                  ? "text-amber-200"
                  : undefined
              }
            >
              {highlightMatch(line)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function BurpSuiteEmulator({
  mode,
  defaultModule,
  phpsessid,
  userToken = "d41d8cd98f00b204e9800998ecf8427e",
  externalSecurity,
  externalIncludeToken,
  externalId,
  externalSyncKey,
  autoplayRequest,
  onPacketSent,
  onActiveTabChange,
}: BurpSuiteEmulatorProps) {
  const initialModule: ModuleTab = defaultModule ?? (mode === "poc2" ? "proxy" : "repeater");
  const [activeModule, setActiveModule] = useState<ModuleTab>(initialModule);
  const [proxySubTab, setProxySubTab] = useState<"intercept" | "history" | "settings">("intercept");

  const [isMinimized, setIsMinimized] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Guided Walkthrough Autopilot State & Virtual Cursor
  const inlineRootRef = useRef<HTMLDivElement | null>(null);
  const fullscreenRootRef = useRef<HTMLDivElement | null>(null);
  const lastAutoplayIdRef = useRef<number>(0);

  const [walkId, setWalkId] = useState<BurpWalkthroughId | null>(null);
  const [stepIdx, setStepIdx] = useState(0);
  const [typedChars, setTypedChars] = useState(0);
  const [phase, setPhase] = useState<WalkPhase>("idle");
  const [isPaused, setIsPaused] = useState(false);
  const [speed, setSpeed] = useState<WalkSpeed>("normal");
  const [cursorPos, setCursorPos] = useState<{
    x: number;
    y: number;
    containerWidth: number;
  }>({ x: 120, y: 120, containerWidth: 800 });

  // Proxy Listener Settings & Loopback Bypass
  const [listenerPort, setListenerPort] = useState<8080 | 8081>(8081);
  const [portInput, setPortInput] = useState("8081");
  const [interceptOn, setInterceptOn] = useState(true);
  const [browserOpen, setBrowserOpen] = useState(true);
  const [browserUrl, setBrowserUrl] = useState("http://localtest.me:8080/vulnerabilities/sqli/");
  const [browserIdInput, setBrowserIdInput] = useState("1'");
  const [browserBanner, setBrowserBanner] = useState<{
    type: "info" | "warn" | "err" | "ok";
    text: string;
  } | null>(null);
  const [interceptBuffer, setInterceptBuffer] = useState<string>(
    buildHttpRequest({
      idVal: "1'",
      includeToken: false,
      userToken,
      securityLevel: "low",
      phpsessid,
    })
  );

  // Repeater State
  const initialTabs: RepeaterTabItem[] = useMemo(() => {
    if (mode === "poc5") {
      const r1 = buildHttpRequest({
        idVal: "1'",
        includeToken: false,
        userToken,
        securityLevel: "low",
        phpsessid,
      });
      const res1 = simulateDvwaHttpResponse(r1, phpsessid, userToken);

      const r2 = buildHttpRequest({
        idVal: "1'",
        includeToken: false,
        userToken,
        securityLevel: "impossible",
        phpsessid,
      });
      const res2 = simulateDvwaHttpResponse(r2, phpsessid, userToken);

      const r3 = buildHttpRequest({
        idVal: "1'",
        includeToken: true,
        userToken,
        securityLevel: "impossible",
        phpsessid,
      });
      const res3 = simulateDvwaHttpResponse(r3, phpsessid, userToken);

      return [
        {
          id: 1,
          title: "1",
          rawRequest: r1,
          rawResponse: res1.rawResponse,
          statusCode: res1.statusCode,
          latencyMs: res1.latencyMs,
          history: [{ request: r1, response: res1.rawResponse, statusCode: res1.statusCode, latencyMs: res1.latencyMs }],
          historyCursor: 0,
        },
        {
          id: 2,
          title: "2",
          rawRequest: r2,
          rawResponse: res2.rawResponse,
          statusCode: res2.statusCode,
          latencyMs: res2.latencyMs,
          history: [{ request: r2, response: res2.rawResponse, statusCode: res2.statusCode, latencyMs: res2.latencyMs }],
          historyCursor: 0,
        },
        {
          id: 3,
          title: "3",
          rawRequest: r3,
          rawResponse: res3.rawResponse,
          statusCode: res3.statusCode,
          latencyMs: res3.latencyMs,
          history: [{ request: r3, response: res3.rawResponse, statusCode: res3.statusCode, latencyMs: res3.latencyMs }],
          historyCursor: 0,
        },
      ];
    }

    const req1 = buildHttpRequest({
      idVal: "1'",
      includeToken: false,
      userToken,
      securityLevel: "low",
      phpsessid,
    });
    const out1 = simulateDvwaHttpResponse(req1, phpsessid, userToken);

    const req2 = buildHttpRequest({
      idVal: "' OR '1'='1",
      includeToken: false,
      userToken,
      securityLevel: "low",
      phpsessid,
    });
    const out2 = simulateDvwaHttpResponse(req2, phpsessid, userToken);

    const req3 = buildHttpRequest({
      idVal: "1' UNION SELECT user, password FROM users -- -",
      includeToken: false,
      userToken,
      securityLevel: "low",
      phpsessid,
    });
    const out3 = simulateDvwaHttpResponse(req3, phpsessid, userToken);

    return [
      {
        id: 1,
        title: "1",
        rawRequest: req1,
        rawResponse: out1.rawResponse,
        statusCode: out1.statusCode,
        latencyMs: out1.latencyMs,
        history: [{ request: req1, response: out1.rawResponse, statusCode: out1.statusCode, latencyMs: out1.latencyMs }],
        historyCursor: 0,
      },
      {
        id: 2,
        title: "2",
        rawRequest: req2,
        rawResponse: out2.rawResponse,
        statusCode: out2.statusCode,
        latencyMs: out2.latencyMs,
        history: [{ request: req2, response: out2.rawResponse, statusCode: out2.statusCode, latencyMs: out2.latencyMs }],
        historyCursor: 0,
      },
      {
        id: 3,
        title: "3",
        rawRequest: req3,
        rawResponse: out3.rawResponse,
        statusCode: out3.statusCode,
        latencyMs: out3.latencyMs,
        history: [{ request: req3, response: out3.rawResponse, statusCode: out3.statusCode, latencyMs: out3.latencyMs }],
        historyCursor: 0,
      },
    ];
  }, [mode, phpsessid, userToken]);

  const [repeaterTabs, setRepeaterTabs] = useState<RepeaterTabItem[]>(initialTabs);
  const [activeTabId, setActiveTabId] = useState<number>(mode === "poc5" ? 3 : 1);
  const [repeaterPulse, setRepeaterPulse] = useState(false);
  const [reqViewMode, setReqViewMode] = useState<"pretty" | "raw" | "hex">("raw");
  const [resViewMode, setResViewMode] = useState<"pretty" | "raw" | "hex" | "render">("pretty");
  const [splitVertical, setSplitVertical] = useState(true);
  const [inspectorOpen, setInspectorOpen] = useState(true);
  const [urlEncodeParam, setUrlEncodeParam] = useState(false);
  const [responseSearch, setResponseSearch] = useState("");
  const [isSending, setIsSending] = useState(false);

  const lastSyncKeyRef = useRef(0);

  // Sync external controls from Member4Simulator (cookieSecurity / includeToken / id)
  useEffect(() => {
    if (
      mode !== "poc5" ||
      !externalSyncKey ||
      externalSyncKey === lastSyncKeyRef.current
    ) {
      return;
    }
    lastSyncKeyRef.current = externalSyncKey;

    setRepeaterTabs((prev) =>
      prev.map((t) => {
        if (t.id !== activeTabId) return t;
        const parsed = parseHttpRequest(t.rawRequest, phpsessid, userToken);
        const nextReq = buildHttpRequest({
          idVal: externalId ?? parsed.idVal,
          urlEncode: urlEncodeParam,
          includeToken: externalIncludeToken ?? parsed.includeToken,
          userToken: userToken || parsed.userToken,
          securityLevel: externalSecurity ?? parsed.securityLevel,
          phpsessid: parsed.phpsessid,
        });
        const nextSim = simulateDvwaHttpResponse(nextReq, phpsessid, userToken);
        return {
          ...t,
          rawRequest: nextReq,
          rawResponse: nextSim.rawResponse,
          statusCode: nextSim.statusCode,
          latencyMs: nextSim.latencyMs,
        };
      })
    );
  }, [
    mode,
    externalSyncKey,
    externalSecurity,
    externalIncludeToken,
    externalId,
    activeTabId,
    phpsessid,
    userToken,
    urlEncodeParam,
  ]);

  // HTTP History & Logger
  const [httpHistory, setHttpHistory] = useState<HttpHistoryRow[]>(() => {
    const r0 = buildHttpRequest({
      idVal: "1",
      includeToken: false,
      userToken,
      securityLevel: "low",
      phpsessid,
    });
    const s0 = simulateDvwaHttpResponse(r0, phpsessid, userToken);
    const r1 = buildHttpRequest({
      idVal: "1'",
      includeToken: false,
      userToken,
      securityLevel: "low",
      phpsessid,
    });
    const s1 = simulateDvwaHttpResponse(r1, phpsessid, userToken);
    return [
      {
        idx: 1,
        host: "http://localtest.me:8080",
        method: "GET",
        url: "/vulnerabilities/sqli/?id=1&Submit=Submit",
        params: "✓",
        status: s0.statusCode,
        length: s0.bytes,
        mime: "HTML",
        ip: "127.0.0.1",
        time: "02:13:55",
        request: r0,
        response: s0.rawResponse,
      },
      {
        idx: 2,
        host: "http://localtest.me:8080",
        method: "GET",
        url: "/vulnerabilities/sqli/?id=1%27&Submit=Submit",
        params: "✓",
        status: s1.statusCode,
        length: s1.bytes,
        mime: "HTML",
        ip: "127.0.0.1",
        time: "02:14:08",
        request: r1,
        response: s1.rawResponse,
      },
    ];
  });
  const [selectedHistoryIdx, setSelectedHistoryIdx] = useState<number>(2);

  // Decoder State
  const [decoderInput, setDecoderInput] = useState("' OR '1'='1");
  const [decoderOutput, setDecoderOutput] = useState("%27%20OR%20%271%27%3D%271");
  const [decoderOp, setDecoderOp] = useState("Encode as URL");

  // Fullscreen Escape shortcut
  useEffect(() => {
    if (!isFullscreen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsFullscreen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isFullscreen]);

  const currentTab =
    repeaterTabs.find((t) => t.id === activeTabId) ?? repeaterTabs[0];
  const parsedCurrentReq = useMemo(
    () => parseHttpRequest(currentTab.rawRequest, phpsessid, userToken),
    [currentTab.rawRequest, phpsessid, userToken]
  );
  const currentResSim = useMemo(
    () => simulateDvwaHttpResponse(currentTab.rawRequest, phpsessid, userToken),
    [currentTab.rawRequest, phpsessid, userToken]
  );

  const responseSearchCount = useMemo(() => {
    const q = responseSearch.trim().toLowerCase();
    if (!q) return 0;
    const text = currentTab.rawResponse.toLowerCase();
    let count = 0;
    let pos = text.indexOf(q);
    while (pos !== -1) {
      count++;
      pos = text.indexOf(q, pos + q.length);
    }
    return count;
  }, [currentTab.rawResponse, responseSearch]);

  const appendHistory = (rawReq: string, rawRes: string, status: number) => {
    const p = parseHttpRequest(rawReq, phpsessid, userToken);
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    const tStr = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

    setHttpHistory((prev) => {
      const nextIdx = prev.length + 1;
      setSelectedHistoryIdx(nextIdx);
      return [
        ...prev,
        {
          idx: nextIdx,
          host: "http://localtest.me:8080",
          method: p.method,
          url: p.fullPath,
          params: p.fullPath.includes("?") ? "✓" : "",
          status,
          length: rawRes.length,
          mime: "HTML",
          ip: "127.0.0.1",
          time: tStr,
          request: rawReq,
          response: rawRes,
        },
      ];
    });
  };

  const handleSendToRepeater = (rawReq: string, customTitle?: string) => {
    const sim = simulateDvwaHttpResponse(rawReq, phpsessid, userToken);
    const nextId = Math.max(...repeaterTabs.map((t) => t.id), 0) + 1;
    const labelId = sim.parsed.idVal.slice(0, 12);
    const newTab: RepeaterTabItem = {
      id: nextId,
      title: customTitle ?? `${nextId} · id=${labelId}`,
      rawRequest: rawReq,
      rawResponse: sim.rawResponse,
      statusCode: sim.statusCode,
      latencyMs: sim.latencyMs,
      history: [
        {
          request: rawReq,
          response: sim.rawResponse,
          statusCode: sim.statusCode,
          latencyMs: sim.latencyMs,
        },
      ],
      historyCursor: 0,
    };
    setRepeaterTabs((prev) => [...prev, newTab]);
    setActiveTabId(nextId);
    setRepeaterPulse(true);
    setActiveModule("repeater");
    setTimeout(() => setRepeaterPulse(false), 1200);
  };

  const handleRepeaterSend = (overrideReq?: string, sourceName: "Repeater" | "Proxy Intercept" = "Repeater") => {
    const reqToSend = overrideReq ?? currentTab.rawRequest;
    setIsSending(true);
    setTimeout(() => {
      const sim = simulateDvwaHttpResponse(reqToSend, phpsessid, userToken);
      setRepeaterTabs((prev) =>
        prev.map((t) => {
          if (t.id !== currentTab.id) return t;
          const nextHistory = [
            ...t.history.slice(0, t.historyCursor + 1),
            {
              request: reqToSend,
              response: sim.rawResponse,
              statusCode: sim.statusCode,
              latencyMs: sim.latencyMs,
            },
          ];
          return {
            ...t,
            rawRequest: reqToSend,
            rawResponse: sim.rawResponse,
            statusCode: sim.statusCode,
            latencyMs: sim.latencyMs,
            history: nextHistory,
            historyCursor: nextHistory.length - 1,
          };
        })
      );
      appendHistory(reqToSend, sim.rawResponse, sim.statusCode);
      onPacketSent?.({
        idParam: sim.parsed.idVal,
        securityLevel: sim.parsed.securityLevel,
        includeToken: sim.parsed.includeToken,
        userToken: sim.parsed.userToken,
        phpsessid: sim.parsed.phpsessid,
        statusCode: sim.statusCode,
        bytes: sim.bytes,
        source: sourceName,
      });
      setIsSending(false);
    }, 220);
  };

  const handleFollowRedirection = () => {
    const redirReq = `GET /index.php HTTP/1.1
Host: localtest.me:8080
User-Agent: Mozilla/5.0 (Burp Repeater)
Cookie: security=${parsedCurrentReq.securityLevel}; PHPSESSID=${parsedCurrentReq.phpsessid}
Connection: close`;
    handleRepeaterSend(redirReq);
  };

  const updateCurrentRawRequest = (nextRaw: string) => {
    setRepeaterTabs((prev) =>
      prev.map((t) => (t.id === currentTab.id ? { ...t, rawRequest: nextRaw } : t))
    );
  };

  const handleInspectorChange = (patch: {
    idVal?: string;
    urlEncode?: boolean;
    includeToken?: boolean;
    userToken?: string;
    securityLevel?: "low" | "impossible";
    phpsessid?: string;
  }) => {
    const nextEncode = patch.urlEncode ?? urlEncodeParam;
    if (patch.urlEncode !== undefined) setUrlEncodeParam(patch.urlEncode);
    const nextReq = buildHttpRequest({
      idVal: patch.idVal ?? parsedCurrentReq.idVal,
      urlEncode: nextEncode,
      includeToken: patch.includeToken ?? parsedCurrentReq.includeToken,
      userToken: patch.userToken ?? parsedCurrentReq.userToken,
      securityLevel: patch.securityLevel ?? parsedCurrentReq.securityLevel,
      phpsessid: patch.phpsessid ?? parsedCurrentReq.phpsessid,
    });
    updateCurrentRawRequest(nextReq);
  };

  const submitBrowserWith = (urlOverride?: string, idOverride?: string) => {
    const lowerUrl = (urlOverride ?? browserUrl).trim().toLowerCase();
    const targetId = idOverride ?? browserIdInput;
    if (listenerPort === 8080) {
      setBrowserBanner({
        type: "err",
        text: "Proxy Error: Cổng 127.0.0.1:8080 đang xung đột với Docker container DVWA! Hãy vào Proxy -> Proxy settings chuyển Listener sang 8081.",
      });
      return;
    }

    if (lowerUrl.includes("127.0.0.1") || lowerUrl.includes("localhost")) {
      setBrowserBanner({
        type: "warn",
        text: "Loopback Bypass: Trình duyệt Chromium bỏ qua Proxy với 127.0.0.1 / localhost! Proxy Intercept không nhận được gói tin. Hãy đổi sang http://localtest.me:8080/vulnerabilities/sqli/.",
      });
      return;
    }

    const capturedReq = buildHttpRequest({
      idVal: targetId,
      urlEncode: targetId.includes("'") || targetId.includes(" "),
      includeToken: false,
      userToken,
      securityLevel: "low",
      phpsessid,
    });

    if (interceptOn) {
      setInterceptBuffer(capturedReq);
      setBrowserBanner({
        type: "info",
        text: "Đã bắt giữ gói tin GET tại Proxy -> Intercept! Bạn có thể sửa payload bên dưới rồi bấm Forward hoặc Send to Repeater.",
      });
    } else {
      const sim = simulateDvwaHttpResponse(capturedReq, phpsessid, userToken);
      appendHistory(capturedReq, sim.rawResponse, sim.statusCode);
      onPacketSent?.({
        idParam: sim.parsed.idVal,
        securityLevel: sim.parsed.securityLevel,
        includeToken: sim.parsed.includeToken,
        userToken: sim.parsed.userToken,
        phpsessid: sim.parsed.phpsessid,
        statusCode: sim.statusCode,
        bytes: sim.bytes,
        source: "Proxy Intercept",
      });
      setBrowserBanner({
        type: "ok",
        text: `Intercept đang OFF: Gói tin đã đi thẳng qua Proxy 8081 tới DVWA và được lưu vào Proxy -> HTTP history (${sim.statusCode} OK).`,
      });
    }
  };

  const handleBrowserSubmit = () => submitBrowserWith();

  const walkSteps = useMemo(() => (walkId ? getWalkthroughSteps(walkId) : []), [walkId]);
  const currentWalkStep = walkSteps[stepIdx] ?? null;
  const activeTarget =
    walkId &&
    (phase === "gliding" || phase === "typing" || phase === "acting" || phase === "observing")
      ? currentWalkStep?.target ?? null
      : null;

  const progressPct = useMemo(() => {
    if (!walkId || walkSteps.length === 0 || phase === "idle") return 0;
    if (phase === "done") return 100;
    let sub = 0.25;
    if (phase === "typing") {
      const len = Math.max(1, currentWalkStep?.typeValue?.length ?? 1);
      sub = 0.25 + 0.45 * (typedChars / len);
    } else if (phase === "acting") {
      sub = 0.75;
    } else if (phase === "observing") {
      sub = 1;
    }
    return Math.min(99, Math.round(((stepIdx + sub) / walkSteps.length) * 100));
  }, [walkId, walkSteps.length, phase, stepIdx, typedChars, currentWalkStep]);

  const highlightRing = (targetKey: string) =>
    activeTarget === targetKey
      ? "ring-2 ring-[#ff6633] ring-offset-1 ring-offset-[#1e1f22]"
      : "";

  const syncTabSnapshotToParent = (tabObj: RepeaterTabItem) => {
    if (!onActiveTabChange) return;
    const parsedTab = parseHttpRequest(tabObj.rawRequest, phpsessid, userToken);
    onActiveTabChange({
      idParam: parsedTab.idVal,
      securityLevel: parsedTab.securityLevel,
      includeToken: parsedTab.includeToken,
      userToken: parsedTab.userToken,
      phpsessid: parsedTab.phpsessid,
      statusCode: tabObj.statusCode,
      bytes: tabObj.rawResponse.length,
      source: "Repeater",
    });
  };

  const applyWalkFieldValue = (field: WalkTypeField, nextValue: string) => {
    switch (field) {
      case "port":
        setPortInput(nextValue);
        break;
      case "browser-url":
        setBrowserUrl(nextValue);
        break;
      case "browser-id":
        setBrowserIdInput(nextValue);
        break;
      case "inspector-id": {
        const nextReq = buildHttpRequest({
          idVal: nextValue,
          urlEncode: urlEncodeParam,
          includeToken: parsedCurrentReq.includeToken,
          userToken: parsedCurrentReq.userToken,
          securityLevel: parsedCurrentReq.securityLevel,
          phpsessid: parsedCurrentReq.phpsessid,
        });
        updateCurrentRawRequest(nextReq);
        if (onActiveTabChange && nextValue.length > 0) {
          onActiveTabChange({
            idParam: nextValue,
            securityLevel: parsedCurrentReq.securityLevel,
            includeToken: parsedCurrentReq.includeToken,
            userToken: parsedCurrentReq.userToken,
            phpsessid: parsedCurrentReq.phpsessid,
            statusCode: currentTab.statusCode,
            bytes: currentTab.rawResponse.length,
            source: "Repeater",
          });
        }
        break;
      }
    }
  };

  const executeWalkAction = (action: WalkActionType) => {
    switch (action) {
      case "focus-target":
        break;
      case "focus-proxy":
        setActiveModule("proxy");
        setProxySubTab("intercept");
        break;
      case "open-proxy-settings":
        setActiveModule("proxy");
        setProxySubTab("settings");
        break;
      case "apply-port":
        setListenerPort(portInput.trim() === "8080" ? 8080 : 8081);
        break;
      case "open-proxy-intercept":
        setActiveModule("proxy");
        setProxySubTab("intercept");
        setBrowserOpen(true);
        break;
      case "submit-loopback":
        submitBrowserWith("http://127.0.0.1:8080/vulnerabilities/sqli/", "1");
        break;
      case "submit-localtest": {
        const captured = buildHttpRequest({
          idVal: "1",
          urlEncode: false,
          includeToken: false,
          userToken,
          securityLevel: "low",
          phpsessid,
        });
        setListenerPort(8081);
        setInterceptOn(true);
        setInterceptBuffer(captured);
        setBrowserBanner({
          type: "info",
          text: "Proxy 8081 đã bắt giữ GET /vulnerabilities/sqli/?id=1&Submit=Submit tại tab Intercept.",
        });
        break;
      }
      case "highlight-buffer":
        break;
      case "send-to-repeater":
        handleSendToRepeater(
          interceptBuffer ||
            buildHttpRequest({
              idVal: "1",
              includeToken: false,
              userToken,
              securityLevel: "low",
              phpsessid,
            }),
          `${repeaterTabs.length + 1}`
        );
        break;
      case "turn-off-intercept":
        setInterceptOn(false);
        break;
      case "focus-repeater":
        setActiveModule("repeater");
        break;
      case "send-repeater":
        handleRepeaterSend();
        break;
      case "select-tab-1": {
        const t1 = repeaterTabs.find((x) => x.id === 1) ?? repeaterTabs[0];
        if (t1) {
          setActiveTabId(t1.id);
          syncTabSnapshotToParent(t1);
        }
        break;
      }
      case "select-tab-2": {
        const t2 = repeaterTabs.find((x) => x.id === 2) ?? repeaterTabs[1] ?? repeaterTabs[0];
        if (t2) {
          setActiveTabId(t2.id);
          syncTabSnapshotToParent(t2);
        }
        break;
      }
      case "select-tab-3": {
        const t3 = repeaterTabs.find((x) => x.id === 3) ?? repeaterTabs[2] ?? repeaterTabs[0];
        if (t3) {
          setActiveTabId(t3.id);
          syncTabSnapshotToParent(t3);
        }
        break;
      }
      case "set-sec-impossible":
        handleInspectorChange({ securityLevel: "impossible", includeToken: false });
        break;
      case "highlight-response":
        setResViewMode("pretty");
        break;
      case "switch-res-render":
        setResViewMode("render");
        break;
      case "rotate-token": {
        const chars = "0123456789abcdef";
        let nextTok = "";
        for (let i = 0; i < 32; i++) {
          nextTok += chars[Math.floor(Math.random() * chars.length)];
        }
        handleInspectorChange({ includeToken: true, userToken: nextTok });
        if (onActiveTabChange) {
          onActiveTabChange({
            idParam: parsedCurrentReq.idVal,
            securityLevel: parsedCurrentReq.securityLevel,
            includeToken: true,
            userToken: nextTok,
            phpsessid: parsedCurrentReq.phpsessid,
            statusCode: currentTab.statusCode,
            bytes: currentTab.rawResponse.length,
            source: "Repeater",
          });
        }
        break;
      }
    }
  };

  const startWalkthrough = (id: BurpWalkthroughId) => {
    setIsMinimized(false);
    setTypedChars(0);

    if (id === "m2-s1" || id === "m2-full") {
      setActiveModule("proxy");
      setProxySubTab("intercept");
      setListenerPort(8080);
      setPortInput("8080");
      setInterceptOn(true);
      setBrowserOpen(true);
      setBrowserUrl("");
      setBrowserIdInput("");
      setBrowserBanner(null);
    } else if (id === "m2-s2") {
      setActiveModule("proxy");
      setProxySubTab("intercept");
      setListenerPort(8081);
      setPortInput("8081");
      setInterceptOn(true);
      setBrowserOpen(true);
      setInspectorOpen(true);
      setReqViewMode("raw");
      setResViewMode("pretty");
      setBrowserUrl("http://localtest.me:8080/vulnerabilities/sqli/");
      setBrowserIdInput("1");
      setInterceptBuffer(
        buildHttpRequest({
          idVal: "1",
          includeToken: false,
          userToken,
          securityLevel: "low",
          phpsessid,
        })
      );
      setBrowserBanner({
        type: "info",
        text: "Gói tin GET /vulnerabilities/sqli/?id=1 đang được giữ ở Proxy -> Intercept.",
      });
    } else if (id === "m4-s2" || id === "m4-full") {
      setActiveModule("repeater");
      setInspectorOpen(true);
      setReqViewMode("raw");
      setResViewMode("pretty");
      const t1 = repeaterTabs.find((x) => x.id === 1) ?? repeaterTabs[0];
      if (t1) {
        setActiveTabId(t1.id);
        syncTabSnapshotToParent(t1);
      }
    } else if (id === "m4-s3") {
      setActiveModule("repeater");
      setInspectorOpen(true);
      setReqViewMode("raw");
      setResViewMode("pretty");
      const t3 = repeaterTabs.find((x) => x.id === 3) ?? repeaterTabs[0];
      if (t3) {
        setActiveTabId(t3.id);
        syncTabSnapshotToParent(t3);
      }
    }

    setWalkId(id);
    setStepIdx(0);
    setIsPaused(false);
    setPhase("gliding");
  };

  const stopWalkthrough = () => {
    setWalkId(null);
    setStepIdx(0);
    setTypedChars(0);
    setPhase("idle");
    setIsPaused(false);
  };

  const handlersRef = useRef({
    executeWalkAction,
    applyWalkFieldValue,
    startWalkthrough,
    isFullscreen,
  });
  handlersRef.current = {
    executeWalkAction,
    applyWalkFieldValue,
    startWalkthrough,
    isFullscreen,
  };

  // Measure target button/panel bounding box inside active visible Burp window for cursor positioning
  useEffect(() => {
    if (!walkId || phase === "idle" || phase === "done") return;
    const step = walkSteps[stepIdx];
    if (!step) return;

    const raf = requestAnimationFrame(() => {
      const root = handlersRef.current.isFullscreen
        ? fullscreenRootRef.current
        : inlineRootRef.current;
      if (!root) return;
      const el = root.querySelector(`[data-burp-target="${step.target}"]`) as HTMLElement | null;
      if (!el) return;
      const rootRect = root.getBoundingClientRect();
      const elRect = el.getBoundingClientRect();
      const x = Math.max(
        18,
        Math.min(rootRect.width - 24, elRect.left - rootRect.left + Math.min(elRect.width * 0.65, 92))
      );
      const y = Math.max(
        18,
        Math.min(rootRect.height - 24, elRect.top - rootRect.top + elRect.height * 0.55)
      );
      setCursorPos({ x, y, containerWidth: rootRect.width });
    });

    return () => cancelAnimationFrame(raf);
  }, [walkId, stepIdx, phase, activeModule, proxySubTab, inspectorOpen, isFullscreen, walkSteps]);

  // Phase timer driving glide -> typing (per character) -> click -> observe -> next step
  useEffect(() => {
    if (!walkId || isPaused || phase === "idle" || phase === "done") return;
    const steps = getWalkthroughSteps(walkId);
    const current = steps[stepIdx];
    if (!current) {
      setPhase("done");
      return;
    }

    if (phase === "typing") {
      const str = current.typeValue ?? "";
      const field = current.typeField;
      if (!field || typedChars >= str.length) {
        setPhase("acting");
        return;
      }
      const isLong = str.length > 25;
      const charDelay =
        speed === "slow" ? (isLong ? 45 : 75) : speed === "fast" ? (isLong ? 14 : 22) : isLong ? 28 : 45;

      const timer = setTimeout(() => {
        const nextCount = typedChars + 1;
        handlersRef.current.applyWalkFieldValue(field, str.slice(0, nextCount));
        if (nextCount >= str.length) {
          setTypedChars(nextCount);
          setPhase("acting");
        } else {
          setTypedChars(nextCount);
        }
      }, charDelay);

      return () => clearTimeout(timer);
    }

    const timing = WALK_TIMINGS[speed];
    let delay = timing.glide;
    if (phase === "acting") delay = timing.act;
    if (phase === "observing") delay = timing.observe;

    const timer = setTimeout(() => {
      if (phase === "gliding") {
        if (current.typeField && current.typeValue) {
          setTypedChars(0);
          handlersRef.current.applyWalkFieldValue(current.typeField, "");
          setPhase("typing");
        } else {
          setPhase("acting");
        }
      } else if (phase === "acting") {
        handlersRef.current.executeWalkAction(current.action);
        setPhase("observing");
      } else if (phase === "observing") {
        if (stepIdx + 1 < steps.length) {
          setStepIdx((i) => i + 1);
          setTypedChars(0);
          setPhase("gliding");
        } else {
          setPhase("done");
        }
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [walkId, stepIdx, phase, isPaused, speed, typedChars]);

  // Trigger walkthrough automatically from parent page exercise step buttons
  useEffect(() => {
    if (!autoplayRequest || autoplayRequest.id === lastAutoplayIdRef.current) return;
    lastAutoplayIdRef.current = autoplayRequest.id;
    const t = setTimeout(() => {
      handlersRef.current.startWalkthrough(autoplayRequest.walkthroughId);
    }, 420);
    return () => clearTimeout(t);
  }, [autoplayRequest]);

  const selectedHistoryRow =
    httpHistory.find((h) => h.idx === selectedHistoryIdx) ?? httpHistory[httpHistory.length - 1];

  const topTabs: { id: ModuleTab; label: string }[] = [
    { id: "dashboard", label: "Dashboard" },
    { id: "target", label: "Target" },
    { id: "proxy", label: "Proxy" },
    { id: "intruder", label: "Intruder" },
    { id: "repeater", label: "Repeater" },
    { id: "decoder", label: "Decoder" },
    { id: "logger", label: "Logger" },
  ];

  const cursorGlideMs = speed === "slow" ? 1200 : speed === "fast" ? 450 : 850;

  const renderBurpWindow = (fullscreenMode: boolean) => (
    <div
      ref={fullscreenMode ? fullscreenRootRef : inlineRootRef}
      className={`relative flex flex-col overflow-hidden rounded-lg border border-[#383a40] bg-[#1e1f22] text-[#dfe1e5] shadow-xl ${
        fullscreenMode ? "h-full w-full" : ""
      }`}
    >
      {/* Virtual Animated Mouse Cursor Overlay (Pointer + Click Ripple only) */}
      {walkId && phase !== "idle" && phase !== "done" && (
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
          {phase === "acting" && (
            <span className="absolute -left-3 -top-3 h-7 w-7 rounded-full border-2 border-[#ff6633] bg-[#ff6633]/25 animate-ping" />
          )}

          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            className={`drop-shadow-[0_2px_6px_rgba(0,0,0,0.85)] transition-transform duration-150 ${
              phase === "acting" ? "scale-90" : "scale-100"
            }`}
          >
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

      {/* 1. Native Desktop Title Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#383a40] bg-[#2b2d31] px-3 py-2 text-xs">
        <div className="flex min-w-0 items-center gap-2.5">
          <WindowControls
            onClose={() => {
              if (fullscreenMode) {
                setIsFullscreen(false);
              } else {
                setActiveModule(initialModule);
                setIsMinimized(false);
              }
            }}
            closeTitle={fullscreenMode ? "Thoát toàn màn hình (Esc)" : "Đưa về tab mặc định"}
            onMinimize={() => {
              if (fullscreenMode) {
                setIsFullscreen(false);
              } else {
                setIsMinimized((v) => !v);
              }
            }}
            isMinimized={isMinimized}
            onMaximize={() => {
              setIsMinimized(false);
              setIsFullscreen((v) => !v);
            }}
            isMaximized={fullscreenMode}
          />
          <span className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded bg-[#ff6633] text-[10px] font-black text-white">
            B
          </span>
          <span className="truncate font-semibold text-zinc-100">
            Temporary project - Burp Suite Community Edition v2026.10.1
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 text-[11px] text-zinc-400">
          {walkId && phase !== "idle" && (
            <div className="flex items-center gap-2 rounded border border-[#3c3f47] bg-[#1e1f22] px-2 py-0.5">
              <div className="h-2 w-24 overflow-hidden rounded-full border border-[#3c3f47] bg-[#18191c] sm:w-32">
                <div
                  className={`h-full transition-all duration-300 ${
                    phase === "done"
                      ? "bg-emerald-400"
                      : "bg-gradient-to-r from-[#ff6633] to-amber-400"
                  }`}
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <span
                className={`font-mono text-[11px] font-bold ${
                  phase === "done" ? "text-emerald-300" : "text-[#ff885e]"
                }`}
              >
                {progressPct}%
              </span>
              <span className="font-mono text-[10.5px] text-zinc-400">
                {Math.min(stepIdx + 1, walkSteps.length)}/{walkSteps.length}
              </span>
            </div>
          )}

          <span className="hidden font-mono sm:inline">Memory: 384MB / 2.0GB</span>
          <button
            type="button"
            onClick={() => {
              setIsMinimized(false);
              setIsFullscreen((v) => !v);
            }}
            className="inline-flex cursor-pointer items-center gap-1 rounded border border-[#45474d] bg-[#313338] px-2 py-0.5 text-[11px] text-zinc-200 hover:bg-[#3c3f45]"
            title={fullscreenMode ? "Thu nhỏ (Esc)" : "Phóng to chuẩn phần mềm"}
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

      {/* Thin Full-Width Top Progress Line */}
      {walkId && phase !== "idle" && (
        <div className="h-[2px] w-full bg-[#18191c]">
          <div
            className={`h-full transition-all duration-300 ${
              phase === "done"
                ? "bg-emerald-400"
                : "bg-gradient-to-r from-[#ff6633] to-amber-400"
            }`}
            style={{ width: `${progressPct}%` }}
          />
        </div>
      )}

      {/* 2. Menu Bar + Compact Walkthrough Controls */}
      {!isMinimized && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#32343a] bg-[#25262a] px-3 py-1.5 text-[11px] text-zinc-300">
            <div className="flex min-w-0 items-center gap-4">
              <div className="flex shrink-0 items-center gap-3.5">
                {["Burp", "Project", "Intruder", "Repeater", "Window", "Help"].map((menu) => (
                  <span key={menu} className="cursor-default hover:text-white">
                    {menu}
                  </span>
                ))}
              </div>
              {walkId && phase !== "idle" && (
                <span className="hidden truncate border-l border-[#3c3f47] pl-3 text-zinc-200 lg:inline">
                  {phase === "done"
                    ? "Đã hoàn thành mô phỏng trên Burp Suite (100%)."
                    : currentWalkStep?.detail}
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {(mode === "poc2"
                ? ([
                    { id: "m2-s1", label: "Bước 01" },
                    { id: "m2-s2", label: "Bước 02" },
                    { id: "m2-full", label: "Trọn bộ" },
                  ] as const)
                : ([
                    { id: "m4-s2", label: "Bước 02" },
                    { id: "m4-s3", label: "Bước 03" },
                    { id: "m4-full", label: "Trọn bộ" },
                  ] as const)
              ).map((preset) => {
                const isSelected = walkId === preset.id && phase !== "idle";
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => startWalkthrough(preset.id)}
                    className={`inline-flex cursor-pointer items-center gap-1 rounded border px-2 py-0.5 text-[10.5px] font-medium transition-colors ${
                      isSelected
                        ? "border-[#ff6633] bg-[#ff6633]/20 font-semibold text-white"
                        : "border-[#3c3f47] bg-[#2b2d31] text-zinc-200 hover:border-[#ff6633]/60 hover:text-white"
                    }`}
                  >
                    <Play className="h-2.5 w-2.5 text-[#ff6633]" aria-hidden="true" />
                    <span>{preset.label}</span>
                  </button>
                );
              })}

              <div className="ml-1 inline-flex items-center gap-0.5 rounded border border-[#3c3f47] bg-[#1e1f22] p-0.5">
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
                    onClick={() => setSpeed(sp.id)}
                    className={`cursor-pointer rounded px-1.5 py-0.5 font-mono text-[10px] transition-colors ${
                      speed === sp.id
                        ? "bg-[#ff6633] font-bold text-white"
                        : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    {sp.label}
                  </button>
                ))}
              </div>

              {walkId && phase !== "idle" && (
                <>
                  {phase !== "done" ? (
                    <button
                      type="button"
                      onClick={() => setIsPaused((p) => !p)}
                      className="inline-flex cursor-pointer items-center gap-1 rounded border border-[#3c3f47] bg-[#2b2d31] px-2 py-0.5 text-[10.5px] text-zinc-200 hover:bg-[#383a40]"
                    >
                      {isPaused ? (
                        <>
                          <Play className="h-2.5 w-2.5 text-emerald-400" aria-hidden="true" />
                          <span>Tiếp tục</span>
                        </>
                      ) : (
                        <>
                          <Pause className="h-2.5 w-2.5 text-amber-300" aria-hidden="true" />
                          <span>Tạm dừng</span>
                        </>
                      )}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => startWalkthrough(walkId)}
                      className="inline-flex cursor-pointer items-center gap-1 rounded border border-emerald-500/50 bg-emerald-500/15 px-2 py-0.5 text-[10.5px] font-semibold text-emerald-300 hover:bg-emerald-500/25"
                    >
                      <RotateCcw className="h-2.5 w-2.5" aria-hidden="true" />
                      <span>Chạy lại</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={stopWalkthrough}
                    className="inline-flex cursor-pointer items-center gap-1 rounded border border-[#3c3f47] bg-[#2b2d31] px-2 py-0.5 text-[10.5px] text-zinc-300 hover:bg-rose-600/20 hover:text-rose-200"
                  >
                    <Square className="h-2.5 w-2.5" aria-hidden="true" />
                    <span>{phase === "done" ? "Đóng" : "Dừng"}</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* 3. Main Module Tab Bar */}
          <div className="flex flex-wrap items-center gap-0.5 border-b border-[#383a40] bg-[#2b2d31] px-2 pt-1 text-xs">
            {topTabs.map((t) => {
              const active = activeModule === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  data-burp-target={`tab-${t.id}`}
                  onClick={() => setActiveModule(t.id)}
                  className={`relative cursor-pointer px-3.5 py-2 font-medium transition-colors ${
                    active
                      ? "border-b-2 border-[#ff6633] bg-[#1e1f22] font-semibold text-white"
                      : "border-b-2 border-transparent text-zinc-400 hover:text-zinc-100"
                  } ${highlightRing(`tab-${t.id}`)}`}
                >
                  <span className="inline-flex items-center gap-1.5">
                    <span>{t.label}</span>
                    {t.id === "repeater" && repeaterPulse && (
                      <span className="h-2 w-2 rounded-full bg-[#ff6633] animate-ping" />
                    )}
                    {t.id === "proxy" && interceptOn && listenerPort === 8081 && (
                      <span className="h-1.5 w-1.5 rounded-full bg-[#ff6633]" />
                    )}
                  </span>
                </button>
              );
            })}
          </div>

          {/* 4. Active Module Content */}
          <div className={`flex-1 overflow-y-auto p-3 ${fullscreenMode ? "min-h-0" : ""}`}>
            {/* MODULE: PROXY */}
            {activeModule === "proxy" && (
              <div className="space-y-3">
                {/* Proxy Sub-tabs */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#383a40] pb-2">
                  <div className="flex items-center gap-1 text-xs">
                    {[
                      { id: "intercept" as const, label: "Intercept" },
                      { id: "history" as const, label: `HTTP history (${httpHistory.length})` },
                      { id: "settings" as const, label: "Proxy settings" },
                    ].map((st) => (
                      <button
                        key={st.id}
                        type="button"
                        data-burp-target={`subtab-${st.id}`}
                        onClick={() => setProxySubTab(st.id)}
                        className={`cursor-pointer rounded px-3 py-1 font-medium transition-colors ${
                          proxySubTab === st.id
                            ? "bg-[#383a40] font-semibold text-white"
                            : "text-zinc-400 hover:text-zinc-100"
                        } ${highlightRing(`subtab-${st.id}`)}`}
                      >
                        {st.label}
                      </button>
                    ))}
                  </div>

                  <span
                    className={`rounded px-2 py-0.5 font-mono text-[11px] font-semibold ${
                      listenerPort === 8081
                        ? "bg-emerald-500/15 text-emerald-300"
                        : "bg-rose-500/20 text-rose-300"
                    }`}
                  >
                    Listener: 127.0.0.1:{listenerPort}{" "}
                    {listenerPort === 8081 ? "(Running)" : "(Port Conflict!)"}
                  </span>
                </div>

                {/* PROXY -> INTERCEPT */}
                {proxySubTab === "intercept" && (
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        data-burp-target="btn-intercept-toggle"
                        onClick={() => setInterceptOn((v) => !v)}
                        className={`cursor-pointer rounded px-3 py-1.5 text-xs font-bold transition-colors ${
                          interceptOn
                            ? "bg-[#ff6633] text-white"
                            : "border border-[#45474d] bg-[#2b2d31] text-zinc-200 hover:bg-[#383a40]"
                        } ${highlightRing("btn-intercept-toggle")}`}
                      >
                        {interceptOn ? "Intercept is on" : "Intercept is off"}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          handleRepeaterSend(interceptBuffer, "Proxy Intercept");
                          setBrowserBanner({
                            type: "ok",
                            text: "Forward thành công! Đã chuyển tiếp gói tin qua DVWA và ghi vào HTTP history & access.log.",
                          });
                        }}
                        className="cursor-pointer rounded border border-[#45474d] bg-[#2b2d31] px-3 py-1.5 text-xs font-medium text-zinc-200 hover:bg-[#383a40]"
                      >
                        Forward
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setInterceptBuffer("");
                          setBrowserBanner({
                            type: "info",
                            text: "Đã Drop gói tin khỏi hàng đợi Proxy.",
                          });
                        }}
                        className="cursor-pointer rounded border border-[#45474d] bg-[#2b2d31] px-3 py-1.5 text-xs font-medium text-zinc-200 hover:bg-[#383a40]"
                      >
                        Drop
                      </button>

                      <button
                        type="button"
                        data-burp-target="btn-send-to-repeater"
                        onClick={() =>
                          handleSendToRepeater(
                            interceptBuffer ||
                              buildHttpRequest({
                                idVal: "1'",
                                includeToken: false,
                                userToken,
                                securityLevel: "low",
                                phpsessid,
                              }),
                            "Repeater (từ Proxy)"
                          )
                        }
                        className={`inline-flex cursor-pointer items-center gap-1.5 rounded border border-[#ff6633]/60 bg-[#ff6633]/15 px-3 py-1.5 text-xs font-semibold text-[#ff885e] hover:bg-[#ff6633]/25 ${highlightRing(
                          "btn-send-to-repeater"
                        )}`}
                      >
                        <Send className="h-3 w-3" aria-hidden="true" />
                        Send to Repeater (Ctrl+R)
                      </button>

                      <button
                        type="button"
                        onClick={() => setBrowserOpen((v) => !v)}
                        className="ml-auto inline-flex cursor-pointer items-center gap-1.5 rounded border border-[#45474d] bg-[#313338] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#3d4047]"
                      >
                        <Globe className="h-3.5 w-3.5 text-[#ff6633]" aria-hidden="true" />
                        {browserOpen ? "Ẩn Burp Browser" : "Open browser"}
                      </button>
                    </div>

                    {/* Built-in Burp Chromium Simulator */}
                    {browserOpen && (
                      <div className="rounded-md border border-[#383a40] bg-[#16171a] p-3 text-xs">
                        <div className="mb-2 flex items-center justify-between">
                          <span className="font-mono text-[11px] font-bold text-zinc-300">
                            Burp Embedded Chromium
                          </span>
                          <span className="font-mono text-[10.5px] text-zinc-400">
                            Proxy: 127.0.0.1:{listenerPort}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <input
                            type="text"
                            data-burp-target="browser-url-input"
                            value={browserUrl}
                            onChange={(e) => setBrowserUrl(e.target.value)}
                            placeholder="http://localtest.me:8080/vulnerabilities/sqli/"
                            aria-label="URL trình duyệt Burp"
                            className={`min-w-[220px] flex-1 rounded border border-[#383a40] bg-[#1e1f22] px-2.5 py-1 font-mono text-xs text-zinc-200 focus:border-[#ff6633] focus:outline-none ${highlightRing(
                              "browser-url-input"
                            )}`}
                          />
                          <span className="font-mono text-zinc-400">User ID:</span>
                          <input
                            type="text"
                            data-burp-target="browser-id-input"
                            value={browserIdInput}
                            onChange={(e) => setBrowserIdInput(e.target.value)}
                            aria-label="User ID DVWA"
                            className={`w-28 rounded border border-[#383a40] bg-[#1e1f22] px-2.5 py-1 font-mono text-xs text-zinc-200 focus:border-[#ff6633] focus:outline-none ${highlightRing(
                              "browser-id-input"
                            )}`}
                          />
                          <button
                            type="button"
                            data-burp-target="btn-browser-submit"
                            onClick={handleBrowserSubmit}
                            className={`cursor-pointer rounded bg-[#3b82f6] px-3 py-1 font-semibold text-white hover:bg-[#2563eb] ${highlightRing(
                              "btn-browser-submit"
                            )}`}
                          >
                            Submit
                          </button>
                        </div>

                        {browserBanner && (
                          <div
                            className={`mt-2 flex items-start gap-2 rounded border px-2.5 py-1.5 text-[11.5px] ${
                              browserBanner.type === "err"
                                ? "border-rose-500/50 bg-rose-500/15 text-rose-300"
                                : browserBanner.type === "warn"
                                ? "border-amber-500/50 bg-amber-500/15 text-amber-200"
                                : browserBanner.type === "ok"
                                ? "border-emerald-500/50 bg-emerald-500/15 text-emerald-300"
                                : "border-[#ff6633]/50 bg-[#ff6633]/10 text-[#ffab8f]"
                            }`}
                          >
                            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                            <span>{browserBanner.text}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Intercept Request Editor */}
                    <div
                      data-burp-target="intercept-buffer"
                      className={`rounded border border-[#383a40] bg-[#141518] p-2.5 ${highlightRing(
                        "intercept-buffer"
                      )}`}
                    >
                      <div className="mb-1.5 flex items-center justify-between font-mono text-[11px] text-zinc-400">
                        <span>Intercepted Request Buffer (Sửa trực tiếp hoặc bấm Ctrl+R gửi sang Repeater)</span>
                        <span>Raw</span>
                      </div>
                      <textarea
                        rows={7}
                        value={interceptBuffer}
                        onChange={(e) => setInterceptBuffer(e.target.value)}
                        aria-label="Burp Proxy Intercept Raw Editor"
                        className="w-full resize-y rounded border border-[#2b2d31] bg-[#1b1c20] p-2.5 font-mono text-xs leading-relaxed text-[#dfe1e5] focus:border-[#ff6633] focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                {/* PROXY -> HTTP HISTORY */}
                {proxySubTab === "history" && (
                  <div className="space-y-3">
                    <div className="max-h-48 overflow-auto rounded border border-[#383a40] bg-[#16171a]">
                      <table className="w-full text-left font-mono text-[11px]">
                        <thead className="sticky top-0 border-b border-[#383a40] bg-[#25262a] text-zinc-400">
                          <tr>
                            <th className="px-2 py-1.5">#</th>
                            <th className="px-2 py-1.5">Host</th>
                            <th className="px-2 py-1.5">Method</th>
                            <th className="px-2 py-1.5">URL</th>
                            <th className="px-2 py-1.5">Params</th>
                            <th className="px-2 py-1.5">Status</th>
                            <th className="px-2 py-1.5">Length</th>
                            <th className="px-2 py-1.5">MIME</th>
                            <th className="px-2 py-1.5">Time</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#2b2d31]">
                          {httpHistory.map((row) => (
                            <tr
                              key={row.idx}
                              onClick={() => setSelectedHistoryIdx(row.idx)}
                              className={`cursor-pointer ${
                                selectedHistoryRow?.idx === row.idx
                                  ? "bg-[#ff6633]/20 text-white"
                                  : "hover:bg-[#25262a]"
                              }`}
                            >
                              <td className="px-2 py-1">{row.idx}</td>
                              <td className="px-2 py-1 text-zinc-300">{row.host}</td>
                              <td className="px-2 py-1 font-bold text-[#79c0ff]">{row.method}</td>
                              <td className="px-2 py-1 text-amber-200">{row.url}</td>
                              <td className="px-2 py-1 text-center">{row.params}</td>
                              <td
                                className={`px-2 py-1 font-bold ${
                                  row.status === 302 ? "text-amber-300" : "text-emerald-400"
                                }`}
                              >
                                {row.status}
                              </td>
                              <td className="px-2 py-1">{row.length}</td>
                              <td className="px-2 py-1 text-zinc-400">{row.mime}</td>
                              <td className="px-2 py-1 text-zinc-400">{row.time}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {selectedHistoryRow && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-mono text-zinc-400">
                            Đang xem mục #{selectedHistoryRow.idx}: {selectedHistoryRow.url}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              handleSendToRepeater(
                                selectedHistoryRow.request,
                                `History #${selectedHistoryRow.idx}`
                              )
                            }
                            className="inline-flex cursor-pointer items-center gap-1.5 rounded bg-[#ff6633] px-3 py-1 text-xs font-semibold text-white hover:opacity-90"
                          >
                            <Send className="h-3 w-3" aria-hidden="true" />
                            Send to Repeater
                          </button>
                        </div>
                        <div className="grid gap-2 md:grid-cols-2">
                          <pre className="max-h-48 overflow-auto rounded border border-[#383a40] bg-[#141518] p-2.5 font-mono text-[11px] text-zinc-200">
                            {selectedHistoryRow.request}
                          </pre>
                          <pre className="max-h-48 overflow-auto rounded border border-[#383a40] bg-[#141518] p-2.5 font-mono text-[11px] text-emerald-300">
                            {selectedHistoryRow.response}
                          </pre>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* PROXY -> SETTINGS */}
                {proxySubTab === "settings" && (
                  <div className="space-y-3 rounded border border-[#383a40] bg-[#16171a] p-4 text-xs">
                    <div className="font-bold text-white">Proxy Listeners</div>

                    <div className="overflow-x-auto rounded border border-[#383a40] bg-[#1b1c20]">
                      <table className="w-full text-left font-mono text-[11px]">
                        <thead className="border-b border-[#383a40] bg-[#25262a] text-zinc-400">
                          <tr>
                            <th className="px-3 py-1.5">Running</th>
                            <th className="px-3 py-1.5">Interface</th>
                            <th className="px-3 py-1.5">Bind to port</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="text-zinc-200">
                            <td className="px-3 py-2">
                              <span
                                className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-bold ${
                                  listenerPort === 8081
                                    ? "bg-emerald-500/20 text-emerald-300"
                                    : "bg-rose-500/20 text-rose-300"
                                }`}
                              >
                                {listenerPort === 8081 ? "[✓] Active" : "[!] Error"}
                              </span>
                            </td>
                            <td className="px-3 py-2">127.0.0.1:{listenerPort}</td>
                            <td className="px-3 py-2">
                              <div className="flex flex-wrap items-center gap-2">
                                <input
                                  type="text"
                                  data-burp-target="port-input"
                                  value={portInput}
                                  onChange={(e) => setPortInput(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      setListenerPort(portInput.trim() === "8080" ? 8080 : 8081);
                                    }
                                  }}
                                  aria-label="Bind to port"
                                  className={`w-24 rounded border border-[#383a40] bg-[#141518] px-2 py-1 font-mono text-xs text-white focus:border-[#ff6633] focus:outline-none ${highlightRing(
                                    "port-input"
                                  )}`}
                                />
                                <button
                                  type="button"
                                  data-burp-target="btn-port-apply"
                                  onClick={() =>
                                    setListenerPort(portInput.trim() === "8080" ? 8080 : 8081)
                                  }
                                  className={`cursor-pointer rounded bg-[#ff6633] px-3 py-1 font-sans text-xs font-semibold text-white hover:opacity-90 ${highlightRing(
                                    "btn-port-apply"
                                  )}`}
                                >
                                  OK
                                </button>
                              </div>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    <div className="rounded border border-[#383a40] bg-[#1e1f22] p-2.5 font-mono text-[11px]">
                      {listenerPort === 8081 ? (
                        <span className="text-emerald-400">
                          Proxy listener active on 127.0.0.1:8081
                        </span>
                      ) : (
                        <span className="text-rose-400">
                          Failed to bind proxy listener to 127.0.0.1:8080 — Address already in use
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* MODULE: REPEATER */}
            {activeModule === "repeater" && (
              <div className="space-y-2.5">
                {/* Repeater Tab Strip */}
                <div className="flex flex-wrap items-center gap-1 border-b border-[#383a40] pb-2">
                  {repeaterTabs.map((tab) => {
                    const isActive = tab.id === currentTab.id;
                    return (
                      <div
                        key={tab.id}
                        data-burp-target={`repeater-tab-${tab.id}`}
                        className={`inline-flex items-center gap-1 rounded-t border px-2.5 py-1 font-mono text-[11px] ${
                          isActive
                            ? "border-[#ff6633] bg-[#2b2d31] font-bold text-white"
                            : "border-[#383a40] bg-[#25262a] text-zinc-400 hover:text-zinc-200"
                        } ${highlightRing(`repeater-tab-${tab.id}`)}`}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setActiveTabId(tab.id);
                            if (onActiveTabChange) {
                              const parsedTab = parseHttpRequest(
                                tab.rawRequest,
                                phpsessid,
                                userToken
                              );
                              onActiveTabChange({
                                idParam: parsedTab.idVal,
                                securityLevel: parsedTab.securityLevel,
                                includeToken: parsedTab.includeToken,
                                userToken: parsedTab.userToken,
                                phpsessid: parsedTab.phpsessid,
                                statusCode: tab.statusCode,
                                bytes: tab.rawResponse.length,
                                source: "Repeater",
                              });
                            }
                          }}
                          className="cursor-pointer"
                        >
                          {tab.title}
                        </button>
                        {repeaterTabs.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              const remaining = repeaterTabs.filter((x) => x.id !== tab.id);
                              setRepeaterTabs(remaining);
                              if (isActive && remaining[0]) setActiveTabId(remaining[0].id);
                            }}
                            aria-label={`Đóng tab ${tab.title}`}
                            className="cursor-pointer text-zinc-500 hover:text-zinc-200"
                          >
                            <X className="h-3 w-3" aria-hidden="true" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => handleSendToRepeater(currentTab.rawRequest, `Tab ${repeaterTabs.length + 1}`)}
                    title="Mở tab Repeater mới"
                    className="inline-flex cursor-pointer items-center justify-center rounded border border-[#383a40] bg-[#25262a] p-1 text-zinc-300 hover:bg-[#383a40]"
                  >
                    <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </div>

                {/* Repeater Toolbar: Send, Follow Redirection, History, Target, Layout & Inspector */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      data-burp-target="btn-repeater-send"
                      onClick={() => handleRepeaterSend()}
                      disabled={isSending}
                      className={`inline-flex cursor-pointer items-center gap-1.5 rounded bg-[#ff6633] px-4 py-1.5 text-xs font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-60 ${highlightRing(
                        "btn-repeater-send"
                      )}`}
                    >
                      <Send className="h-3.5 w-3.5" aria-hidden="true" />
                      {isSending ? "Sending..." : "Send"}
                    </button>

                    {currentTab.statusCode === 302 && (
                      <button
                        type="button"
                        onClick={handleFollowRedirection}
                        className="cursor-pointer rounded border border-amber-400/60 bg-amber-500/20 px-3 py-1.5 text-xs font-semibold text-amber-200 hover:bg-amber-500/30"
                      >
                        Follow redirection
                      </button>
                    )}

                    <div className="inline-flex rounded border border-[#383a40] bg-[#25262a]">
                      <button
                        type="button"
                        disabled={currentTab.historyCursor <= 0}
                        onClick={() => {
                          const prevIdx = currentTab.historyCursor - 1;
                          const item = currentTab.history[prevIdx];
                          if (!item) return;
                          setRepeaterTabs((prev) =>
                            prev.map((t) =>
                              t.id === currentTab.id
                                ? {
                                    ...t,
                                    rawRequest: item.request,
                                    rawResponse: item.response,
                                    statusCode: item.statusCode,
                                    latencyMs: item.latencyMs,
                                    historyCursor: prevIdx,
                                  }
                                : t
                            )
                          );
                        }}
                        title="Lùi lịch sử Repeater"
                        className="cursor-pointer p-1.5 text-zinc-300 hover:bg-[#383a40] disabled:opacity-40"
                      >
                        <ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        disabled={currentTab.historyCursor >= currentTab.history.length - 1}
                        onClick={() => {
                          const nextIdx = currentTab.historyCursor + 1;
                          const item = currentTab.history[nextIdx];
                          if (!item) return;
                          setRepeaterTabs((prev) =>
                            prev.map((t) =>
                              t.id === currentTab.id
                                ? {
                                    ...t,
                                    rawRequest: item.request,
                                    rawResponse: item.response,
                                    statusCode: item.statusCode,
                                    latencyMs: item.latencyMs,
                                    historyCursor: nextIdx,
                                  }
                                : t
                            )
                          );
                        }}
                        title="Tiến lịch sử Repeater"
                        className="cursor-pointer border-l border-[#383a40] p-1.5 text-zinc-300 hover:bg-[#383a40] disabled:opacity-40"
                      >
                        <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                    </div>

                    <span className="ml-1 rounded border border-[#383a40] bg-[#25262a] px-2.5 py-1 font-mono text-[11px] text-zinc-300">
                      Target: http://localtest.me:8080
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setSplitVertical((v) => !v)}
                      title="Đổi bố cục Dọc / Ngang"
                      className="inline-flex cursor-pointer items-center gap-1 rounded border border-[#383a40] bg-[#25262a] px-2 py-1 text-[11px] text-zinc-300 hover:bg-[#383a40]"
                    >
                      {splitVertical ? (
                        <Columns2 className="h-3.5 w-3.5" aria-hidden="true" />
                      ) : (
                        <Rows2 className="h-3.5 w-3.5" aria-hidden="true" />
                      )}
                      <span className="hidden sm:inline">{splitVertical ? "Chia dọc" : "Chia ngang"}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setInspectorOpen((v) => !v)}
                      className={`inline-flex cursor-pointer items-center gap-1 rounded border px-2 py-1 text-[11px] font-medium ${
                        inspectorOpen
                          ? "border-[#ff6633]/60 bg-[#ff6633]/15 text-[#ff885e]"
                          : "border-[#383a40] bg-[#25262a] text-zinc-300"
                      }`}
                    >
                      {inspectorOpen ? (
                        <PanelRightClose className="h-3.5 w-3.5" aria-hidden="true" />
                      ) : (
                        <PanelRightOpen className="h-3.5 w-3.5" aria-hidden="true" />
                      )}
                      <span>Inspector</span>
                    </button>
                  </div>
                </div>

                {/* Main Split Area: Request + Response + Inspector */}
                <div className="flex flex-col gap-2.5 lg:flex-row">
                  <div
                    className={`grid flex-1 gap-2.5 ${
                      splitVertical ? "md:grid-cols-2" : "grid-cols-1"
                    }`}
                  >
                    {/* Request Panel */}
                    <div className="flex flex-col overflow-hidden rounded border border-[#383a40] bg-[#16171a]">
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#383a40] bg-[#25262a] px-2.5 py-1.5">
                        <span className="text-xs font-bold text-white">Request</span>
                        <div className="inline-flex rounded border border-[#383a40] bg-[#1e1f22] p-0.5 text-[11px]">
                          {(["pretty", "raw", "hex"] as const).map((m) => (
                            <button
                              key={m}
                              type="button"
                              onClick={() => setReqViewMode(m)}
                              className={`cursor-pointer rounded px-2 py-0.5 capitalize ${
                                reqViewMode === m
                                  ? "bg-[#383a40] font-semibold text-white"
                                  : "text-zinc-400 hover:text-zinc-200"
                              }`}
                            >
                              {m}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="min-h-[220px] flex-1 p-2.5">
                        {reqViewMode === "raw" && (
                          <div className="flex gap-2">
                            <div className="select-none pt-1 text-right font-mono text-[11px] leading-relaxed text-zinc-600">
                              {currentTab.rawRequest.split("\n").map((_, i) => (
                                <div key={i}>{i + 1}</div>
                              ))}
                            </div>
                            <textarea
                              rows={9}
                              value={currentTab.rawRequest}
                              onChange={(e) => updateCurrentRawRequest(e.target.value)}
                              aria-label="Burp Repeater Raw Request"
                              className="w-full resize-none bg-transparent pt-1 font-mono text-[11.5px] leading-relaxed text-[#dfe1e5] focus:outline-none"
                            />
                          </div>
                        )}
                        {reqViewMode === "pretty" && (
                          <div className="overflow-auto">
                            {renderPrettyHttpText(currentTab.rawRequest, "")}
                          </div>
                        )}
                        {reqViewMode === "hex" && (
                          <pre className="overflow-auto font-mono text-[11px] leading-relaxed text-zinc-300">
                            {toHexDump(currentTab.rawRequest)}
                          </pre>
                        )}
                      </div>
                    </div>

                    {/* Response Panel */}
                    <div
                      data-burp-target="response-pane"
                      className={`flex flex-col overflow-hidden rounded border border-[#383a40] bg-[#16171a] ${highlightRing(
                        "response-pane"
                      )}`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#383a40] bg-[#25262a] px-2.5 py-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white">Response</span>
                          <span
                            className={`rounded px-1.5 py-0.5 font-mono text-[10px] font-bold ${
                              currentTab.statusCode === 302
                                ? "bg-amber-500/20 text-amber-300"
                                : "bg-emerald-500/20 text-emerald-300"
                            }`}
                          >
                            {currentTab.statusCode}
                          </span>
                        </div>
                        <div className="inline-flex rounded border border-[#383a40] bg-[#1e1f22] p-0.5 text-[11px]">
                          {(["pretty", "raw", "hex", "render"] as const).map((m) => (
                            <button
                              key={m}
                              type="button"
                              data-burp-target={`res-view-${m}`}
                              onClick={() => setResViewMode(m)}
                              className={`cursor-pointer rounded px-2 py-0.5 capitalize ${
                                resViewMode === m
                                  ? "bg-[#383a40] font-semibold text-white"
                                  : "text-zinc-400 hover:text-zinc-200"
                              } ${highlightRing(`res-view-${m}`)}`}
                            >
                              {m}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="min-h-[220px] max-h-[300px] flex-1 overflow-auto p-2.5">
                        {isSending ? (
                          <div className="py-12 text-center font-mono text-xs text-[#ff6633]">
                            Waiting for response from localtest.me:8080...
                          </div>
                        ) : (
                          <>
                            {resViewMode === "pretty" &&
                              renderPrettyHttpText(currentTab.rawResponse, responseSearch)}
                            {resViewMode === "raw" && (
                              <pre className="whitespace-pre-wrap font-mono text-[11.5px] leading-relaxed text-zinc-200">
                                {currentTab.rawResponse}
                              </pre>
                            )}
                            {resViewMode === "hex" && (
                              <pre className="font-mono text-[11px] leading-relaxed text-zinc-300">
                                {toHexDump(currentTab.rawResponse)}
                              </pre>
                            )}
                            {resViewMode === "render" && (
                              <div className="rounded border border-zinc-300 bg-[#f0f0f0] p-3 font-sans text-xs text-zinc-900">
                                <div className="mb-2 border-b border-zinc-300 pb-1.5 font-bold text-[#2b6b2b]">
                                  DVWA · Vulnerability: SQL Injection ({currentResSim.parsed.securityLevel})
                                </div>
                                {currentResSim.renderType === "redirect302" && (
                                  <div className="rounded border border-amber-500 bg-amber-100 p-2 text-amber-900">
                                    HTTP/1.1 302 Found -&gt; Redirecting to <code>index.php</code> (Thiếu user_token). Bấm nút{" "}
                                    <strong>Follow redirection</strong> ở trên để theo trang đích.
                                  </div>
                                )}
                                {currentResSim.renderType === "error" && (
                                  <div className="rounded border border-rose-400 bg-white p-2 font-mono text-[11px] text-rose-700">
                                    You have an error in your SQL syntax; check the manual that corresponds to your MariaDB server version for the right syntax to use near &apos;&apos;&apos;{currentResSim.parsed.idVal}&apos;&apos;&apos; at line 1
                                  </div>
                                )}
                                {currentResSim.renderType === "dump5" && (
                                  <div className="space-y-1 font-mono text-[11px]">
                                    <div>First name: admin | Surname: admin</div>
                                    <div>First name: Gordon | Surname: Brown</div>
                                    <div>First name: Hack | Surname: Me</div>
                                    <div>First name: Pablo | Surname: Picasso</div>
                                    <div>First name: Bob | Surname: Smith</div>
                                  </div>
                                )}
                                {currentResSim.renderType === "union" && (
                                  <div className="space-y-1 font-mono text-[11px] text-rose-800">
                                    <div>First name: admin | Surname: 5f4dcc3b5aa765d61d8327deb882cf99</div>
                                    <div>First name: gordonb | Surname: e99a18c428cb38d5f260853678922e03</div>
                                    <div>First name: smithy | Surname: 5f4dcc3b5aa765d61d8327deb882cf99</div>
                                  </div>
                                )}
                                {currentResSim.renderType === "impossible_safe" && (
                                  <div className="text-emerald-800">
                                    Form hiển thị bình thường. Không có dữ liệu trả về và không lộ lỗi MariaDB (đã chặn bởi{" "}
                                    <code>is_numeric()</code> &amp; PDO).
                                  </div>
                                )}
                                {(currentResSim.renderType === "normal" ||
                                  currentResSim.renderType === "index") && (
                                  <div>
                                    {currentResSim.renderType === "index" ? (
                                      <p>Welcome to Damn Vulnerable Web Application!</p>
                                    ) : (
                                      <pre className="font-mono text-[11px]">
                                        ID: {currentResSim.parsed.idVal} · First name: admin · Surname: admin
                                      </pre>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}
                          </>
                        )}
                      </div>

                      {/* Bottom Search & Response Metrics */}
                      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#383a40] bg-[#25262a] px-2.5 py-1.5 text-[11px]">
                        <div className="flex items-center gap-1.5">
                          <Search className="h-3 w-3 text-zinc-400" aria-hidden="true" />
                          <input
                            type="text"
                            value={responseSearch}
                            onChange={(e) => setResponseSearch(e.target.value)}
                            placeholder="Search response (vd: syntax, admin)..."
                            aria-label="Tìm trong Response Burp"
                            className="w-48 bg-transparent font-mono text-[11px] text-zinc-200 placeholder:text-zinc-500 focus:outline-none"
                          />
                          {responseSearch && (
                            <span className="rounded bg-[#ff6633]/20 px-1.5 py-0.5 font-mono text-[10px] text-[#ff885e]">
                              {responseSearchCount} matches
                            </span>
                          )}
                        </div>
                        <span className="font-mono text-zinc-400">
                          {currentTab.latencyMs} millis | {currentTab.rawResponse.length.toLocaleString()} bytes
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Inspector Right Sidebar */}
                  {inspectorOpen && (
                    <div className="w-full shrink-0 space-y-2.5 rounded border border-[#383a40] bg-[#25262a] p-2.5 text-xs lg:w-64">
                      <div className="border-b border-[#383a40] pb-1.5 font-bold text-white">
                        Inspector
                      </div>

                      {/* Request Attributes */}
                      <div className="space-y-1 rounded border border-[#383a40] bg-[#1e1f22] p-2">
                        <div className="text-[11px] font-semibold text-zinc-300">
                          Request attributes
                        </div>
                        <div className="flex justify-between font-mono text-[11px]">
                          <span className="text-zinc-500">Method:</span>
                          <span className="text-zinc-200">{parsedCurrentReq.method}</span>
                        </div>
                        <div className="flex justify-between gap-2 font-mono text-[11px]">
                          <span className="text-zinc-500">Path:</span>
                          <span className="truncate text-zinc-200">{parsedCurrentReq.pathOnly}</span>
                        </div>
                        <div className="flex justify-between font-mono text-[11px]">
                          <span className="text-zinc-500">Protocol:</span>
                          <span className="text-zinc-200">HTTP/1.1</span>
                        </div>
                      </div>

                      {/* Query Parameters */}
                      <div className="space-y-2 rounded border border-[#383a40] bg-[#1e1f22] p-2">
                        <div className="text-[11px] font-semibold text-zinc-300">
                          Query parameters
                        </div>
                        <div>
                          <div className="mb-1 flex items-center justify-between text-[10px] text-zinc-400">
                            <span className="font-mono">id</span>
                            <label className="inline-flex cursor-pointer items-center gap-1">
                              <input
                                type="checkbox"
                                checked={urlEncodeParam}
                                onChange={(e) =>
                                  handleInspectorChange({ urlEncode: e.target.checked })
                                }
                              />
                              <span>URL-encode</span>
                            </label>
                          </div>
                          <input
                            type="text"
                            data-burp-target="inspector-id"
                            value={parsedCurrentReq.idVal}
                            onChange={(e) => handleInspectorChange({ idVal: e.target.value })}
                            aria-label="Inspector Query param id"
                            className={`w-full rounded border border-[#383a40] bg-[#16171a] px-2 py-1 font-mono text-[11px] text-zinc-100 focus:border-[#ff6633] focus:outline-none ${highlightRing(
                              "inspector-id"
                            )}`}
                          />
                        </div>

                        <div>
                          <div className="mb-1 flex items-center justify-between text-[10px] text-zinc-400">
                            <label
                              data-burp-target="inspector-token-checkbox"
                              className={`inline-flex cursor-pointer items-center gap-1 rounded px-0.5 ${highlightRing(
                                "inspector-token-checkbox"
                              )}`}
                            >
                              <input
                                type="checkbox"
                                checked={parsedCurrentReq.includeToken}
                                onChange={(e) =>
                                  handleInspectorChange({ includeToken: e.target.checked })
                                }
                              />
                              <span className="font-mono">user_token</span>
                            </label>
                            <button
                              type="button"
                              data-burp-target="inspector-rotate-token"
                              onClick={() => {
                                const chars = "0123456789abcdef";
                                let next = "";
                                for (let i = 0; i < 32; i++) {
                                  next += chars[Math.floor(Math.random() * chars.length)];
                                }
                                handleInspectorChange({ includeToken: true, userToken: next });
                              }}
                              className={`inline-flex cursor-pointer items-center gap-0.5 rounded px-1 text-[#ff885e] hover:underline ${highlightRing(
                                "inspector-rotate-token"
                              )}`}
                            >
                              <RotateCcw className="h-2.5 w-2.5" aria-hidden="true" /> Xoay token
                            </button>
                          </div>
                          {parsedCurrentReq.includeToken && (
                            <input
                              type="text"
                              value={parsedCurrentReq.userToken}
                              onChange={(e) =>
                                handleInspectorChange({ includeToken: true, userToken: e.target.value })
                              }
                              aria-label="Inspector user_token"
                              className="w-full rounded border border-[#383a40] bg-[#16171a] px-2 py-1 font-mono text-[10px] text-zinc-300 focus:border-[#ff6633] focus:outline-none"
                            />
                          )}
                        </div>
                      </div>

                      {/* Request Cookies */}
                      <div className="space-y-2 rounded border border-[#383a40] bg-[#1e1f22] p-2">
                        <div className="text-[11px] font-semibold text-zinc-300">
                          Request cookies
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono text-[11px] text-zinc-400">security</span>
                          <div className="flex gap-1">
                            {(["low", "impossible"] as const).map((lvl) => (
                              <button
                                key={lvl}
                                type="button"
                                data-burp-target={`inspector-sec-${lvl}`}
                                onClick={() => handleInspectorChange({ securityLevel: lvl })}
                                className={`cursor-pointer rounded border px-2 py-0.5 font-mono text-[10px] ${
                                  parsedCurrentReq.securityLevel === lvl
                                    ? "border-[#ff6633] bg-[#ff6633] font-bold text-white"
                                    : "border-[#383a40] bg-[#25262a] text-zinc-300"
                                } ${highlightRing(`inspector-sec-${lvl}`)}`}
                              >
                                {lvl}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <div className="mb-1 font-mono text-[10px] text-zinc-400">PHPSESSID</div>
                          <input
                            type="text"
                            value={parsedCurrentReq.phpsessid}
                            onChange={(e) => handleInspectorChange({ phpsessid: e.target.value })}
                            aria-label="Inspector PHPSESSID"
                            className="w-full rounded border border-[#383a40] bg-[#16171a] px-2 py-1 font-mono text-[10px] text-zinc-300 focus:border-[#ff6633] focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* MODULE: TARGET */}
            {activeModule === "target" && (
              <div className="grid gap-3 md:grid-cols-12 text-xs">
                <div className="rounded border border-[#383a40] bg-[#16171a] p-3 md:col-span-5">
                  <div className="mb-2 font-bold text-white">Site map</div>
                  <div className="space-y-1 font-mono text-[11px]">
                    <div className="flex items-center gap-1.5 text-zinc-200">
                      <FolderOpen className="h-3.5 w-3.5 text-[#ff6633]" aria-hidden="true" />
                      <span>http://localtest.me:8080</span>
                    </div>
                    <div className="ml-4 space-y-1 border-l border-[#383a40] pl-3 text-zinc-400">
                      <div>login.php (200 OK · PoC 1)</div>
                      <div>setup.php (200 OK)</div>
                      <div className="font-semibold text-amber-300">
                        vulnerabilities/sqli/ (GET id)
                      </div>
                      <div>index.php (302 target)</div>
                    </div>
                  </div>
                </div>
                <div className="rounded border border-[#383a40] bg-[#16171a] p-3 md:col-span-7">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="font-bold text-white">Issues (Target Advisory)</span>
                    <span className="rounded bg-rose-500/20 px-2 py-0.5 font-mono text-[10px] font-bold text-rose-300">
                      High · Certain
                    </span>
                  </div>
                  <div className="font-semibold text-amber-200">
                    SQL injection — GET /vulnerabilities/sqli/?id=
                  </div>
                  <p className="mt-1.5 text-[11.5px] leading-relaxed text-zinc-400">
                    Tham số <code className="text-zinc-200">id</code> nối trực tiếp vào câu truy vấn SQL trong{" "}
                    <code className="text-zinc-200">low.php</code> và xuất thẳng lỗi MariaDB ra giao diện.
                  </p>
                  <button
                    type="button"
                    onClick={() =>
                      handleSendToRepeater(
                        buildHttpRequest({
                          idVal: "1'",
                          includeToken: false,
                          userToken,
                          securityLevel: "low",
                          phpsessid,
                        }),
                        "Từ Target Advisory"
                      )
                    }
                    className="mt-3 inline-flex cursor-pointer items-center gap-1.5 rounded bg-[#ff6633] px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90"
                  >
                    <Send className="h-3 w-3" aria-hidden="true" />
                    Mở trong Repeater
                  </button>
                </div>
              </div>
            )}

            {/* MODULE: DECODER */}
            {activeModule === "decoder" && (
              <div className="space-y-3 text-xs">
                <div className="rounded border border-[#383a40] bg-[#16171a] p-3">
                  <div className="mb-1.5 font-semibold text-zinc-300">Input (Chuỗi gốc / Payload)</div>
                  <textarea
                    rows={3}
                    value={decoderInput}
                    onChange={(e) => setDecoderInput(e.target.value)}
                    aria-label="Burp Decoder Input"
                    className="w-full rounded border border-[#383a40] bg-[#1e1f22] p-2 font-mono text-xs text-zinc-100 focus:border-[#ff6633] focus:outline-none"
                  />
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {[
                      {
                        label: "Encode as URL",
                        fn: () => setDecoderOutput(encodeURIComponent(decoderInput)),
                      },
                      {
                        label: "Decode as URL",
                        fn: () => {
                          try {
                            setDecoderOutput(decodeURIComponent(decoderInput.replace(/\+/g, " ")));
                          } catch {
                            setDecoderOutput("[Lỗi chuỗi URL không hợp lệ]");
                          }
                        },
                      },
                      {
                        label: "Encode as Base64",
                        fn: () => {
                          try {
                            const bytes = new TextEncoder().encode(decoderInput);
                            let bin = "";
                            bytes.forEach((b) => (bin += String.fromCharCode(b)));
                            setDecoderOutput(btoa(bin));
                          } catch {
                            setDecoderOutput("[Không thể encode Base64]");
                          }
                        },
                      },
                      {
                        label: "Hash as MD5",
                        fn: () => setDecoderOutput(md5Hex(decoderInput)),
                      },
                    ].map((op) => (
                      <button
                        key={op.label}
                        type="button"
                        onClick={() => {
                          setDecoderOp(op.label);
                          op.fn();
                        }}
                        className={`cursor-pointer rounded border px-3 py-1 font-mono text-[11px] ${
                          decoderOp === op.label
                            ? "border-[#ff6633] bg-[#ff6633] font-bold text-white"
                            : "border-[#383a40] bg-[#25262a] text-zinc-200 hover:bg-[#383a40]"
                        }`}
                      >
                        {op.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="rounded border border-[#383a40] bg-[#16171a] p-3">
                  <div className="mb-1.5 flex items-center justify-between text-zinc-300">
                    <span className="font-semibold">Output ({decoderOp})</span>
                    <button
                      type="button"
                      onClick={() => setDecoderInput("password")}
                      className="cursor-pointer font-mono text-[11px] text-[#ff885e] hover:underline"
                    >
                      Thử &quot;password&quot; -&gt; Hash MD5
                    </button>
                  </div>
                  <pre className="overflow-x-auto rounded border border-[#2b2d31] bg-[#1e1f22] p-2.5 font-mono text-xs text-emerald-300">
                    {decoderOutput}
                  </pre>
                </div>
              </div>
            )}

            {/* MODULE: LOGGER */}
            {activeModule === "logger" && (
              <div className="overflow-x-auto rounded border border-[#383a40] bg-[#16171a]">
                <table className="w-full text-left font-mono text-[11px]">
                  <thead className="border-b border-[#383a40] bg-[#25262a] text-zinc-400">
                    <tr>
                      <th className="px-2.5 py-2">#</th>
                      <th className="px-2.5 py-2">Time</th>
                      <th className="px-2.5 py-2">Tool</th>
                      <th className="px-2.5 py-2">Method &amp; URL</th>
                      <th className="px-2.5 py-2">Status</th>
                      <th className="px-2.5 py-2">Length</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2b2d31]">
                    {httpHistory.map((row) => (
                      <tr key={row.idx} className="hover:bg-[#25262a]">
                        <td className="px-2.5 py-1.5">{row.idx}</td>
                        <td className="px-2.5 py-1.5 text-zinc-400">{row.time}</td>
                        <td className="px-2.5 py-1.5 text-[#ff885e]">Proxy/Repeater</td>
                        <td className="px-2.5 py-1.5 text-amber-200">
                          {row.method} {row.url}
                        </td>
                        <td className="px-2.5 py-1.5 text-emerald-400">{row.status}</td>
                        <td className="px-2.5 py-1.5">{row.length} B</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* MODULE: DASHBOARD & INTRUDER */}
            {(activeModule === "dashboard" || activeModule === "intruder") && (
              <div className="grid gap-3 md:grid-cols-2 text-xs">
                <div className="rounded border border-[#383a40] bg-[#16171a] p-3">
                  <div className="mb-2 flex items-center gap-1.5 font-bold text-white">
                    <Shield className="h-3.5 w-3.5 text-[#ff6633]" aria-hidden="true" />
                    <span>
                      {activeModule === "dashboard" ? "Tasks & Event Log" : "Intruder Attack Positions"}
                    </span>
                  </div>
                  {activeModule === "dashboard" ? (
                    <ul className="space-y-1.5 font-mono text-[11px] text-zinc-300">
                      <li className="text-emerald-300">
                        [Info] Proxy service started on 127.0.0.1:{listenerPort}
                      </li>
                      <li>[Info] Embedded Chromium browser ready (localtest.me:8080)</li>
                      <li>[Info] Captured {httpHistory.length} HTTP transactions in project memory</li>
                    </ul>
                  ) : (
                    <pre className="rounded border border-[#2b2d31] bg-[#1e1f22] p-2.5 font-mono text-[11px] text-amber-200">
{`GET /vulnerabilities/sqli/?id=§1'§&Submit=Submit HTTP/1.1
Host: localtest.me:8080
Cookie: security=${parsedCurrentReq.securityLevel}; PHPSESSID=${parsedCurrentReq.phpsessid}

# Attack type: Sniper | Payload set: SQLi error & UNION probes`}
                    </pre>
                  )}
                </div>

                <div className="rounded border border-[#383a40] bg-[#16171a] p-3">
                  <div className="mb-2 font-bold text-white">Trạng thái Kiểm thử Nhanh</div>
                  <div className="space-y-1.5 text-[11.5px] text-zinc-300">
                    <div className="flex items-center gap-2">
                      {currentResSim.statusCode === 302 || currentResSim.renderType === "impossible_safe" ? (
                        <ShieldCheck className="h-4 w-4 text-emerald-400" aria-hidden="true" />
                      ) : (
                        <ShieldAlert className="h-4 w-4 text-rose-400" aria-hidden="true" />
                      )}
                      <span>
                        Response hiện tại: <strong>HTTP {currentTab.statusCode}</strong> ({currentTab.rawResponse.length} bytes)
                      </span>
                    </div>
                    <p className="text-zinc-400">
                      Proxy Listener: <span className="font-mono text-zinc-300">127.0.0.1:{listenerPort}</span> ·{" "}
                      Target Host: <span className="font-mono text-zinc-300">{browserUrl}</span>
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );

  return (
    <>
      {renderBurpWindow(false)}
      {isFullscreen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 backdrop-blur-sm sm:p-5"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsFullscreen(false);
          }}
        >
          {renderBurpWindow(true)}
        </div>
      )}
    </>
  );
}
