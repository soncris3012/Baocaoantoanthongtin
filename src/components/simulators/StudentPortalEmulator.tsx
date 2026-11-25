"use client";

import { useEffect, useRef, useState } from "react";
import {
  FileText,
  Globe,
  Lock,
  MessageSquare,
  Search,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import { WindowControls } from "@/components/WindowBar";
import {
  inspectSimulatedRequest,
  type PortalSecurityMode,
  type WafMode,
} from "@/lib/miniWafEngine";

export interface PortalDriverCommand {
  id: number;
  page: "search" | "login" | "comments" | "download";
  input: string;
}

interface StudentPortalEmulatorProps {
  wafMode: WafMode;
  portalMode: PortalSecurityMode;
  ipBanned?: boolean;
  externalCommand?: PortalDriverCommand | null;
}

interface StudentRecord {
  masv: string;
  fullname: string;
  className: string;
  gpa: number;
  note: string;
}

const STUDENTS: StudentRecord[] = [
  { masv: "SV001", fullname: "Nguyen Van An", className: "AT19A", gpa: 8.8, note: "An toan mang" },
  { masv: "SV002", fullname: "Patrick O'Brien", className: "AT19A", gpa: 9.1, note: "Bao mat Web" },
  { masv: "SV003", fullname: "Marco D'Angelo", className: "AT19B", gpa: 8.4, note: "Mat ma hoc" },
  { masv: "SV004", fullname: "Tran Thi Binh", className: "AT19B", gpa: 7.9, note: "He dieu hanh" },
  { masv: "SV005", fullname: "Le Minh Khanh", className: "AT19A", gpa: 9.4, note: "Kiem thu xam nhap" },
];

export function StudentPortalEmulator({
  wafMode,
  portalMode,
  ipBanned = false,
  externalCommand = null,
}: StudentPortalEmulatorProps) {
  const [page, setPage] = useState<"search" | "login" | "comments" | "download">("search");
  const [searchInput, setSearchInput] = useState("SV001");
  const [loginUser, setLoginUser] = useState("sv001");
  const [loginPass, setLoginPass] = useState("student123");
  const [commentAuthor, setCommentAuthor] = useState("Minh");
  const [commentMsg, setCommentMsg] = useState("5 < 10 và điểm >= 8.0");
  const [downloadFile, setDownloadFile] = useState("tailieu.pdf");
  const [showHeaders, setShowHeaders] = useState(false);

  const [browserState, setBrowserState] = useState<{
    url: string;
    status: number;
    blockedByWaf: boolean;
    ruleIds: string[];
    score: number;
    students?: StudentRecord[];
    leakedRows?: string[];
    loginMessage?: string;
    commentPreview?: { author: string; content: string; xssAlert: boolean; escaped: boolean };
    downloadText?: string;
    sqlError?: string;
  } | null>(null);

  const executePortalAction = (
    targetPage: "search" | "login" | "comments" | "download",
    rawVal: string,
    overridePass?: string
  ) => {
    const queryOrBody =
      targetPage === "search"
        ? `q=${rawVal}`
        : targetPage === "login"
        ? `username=${rawVal}&password=${overridePass ?? loginPass}`
        : targetPage === "comments"
        ? `author=${commentAuthor}&msg=${rawVal}`
        : `file=${rawVal}`;
    const urlPath =
      targetPage === "search"
        ? "/search"
        : targetPage === "login"
        ? "/login"
        : targetPage === "comments"
        ? "/comments"
        : "/download";

    if (wafMode !== "OFF" && ipBanned) {
      setBrowserState({
        url: `http://127.0.0.1:8080${urlPath}?${queryOrBody}`,
        status: 403,
        blockedByWaf: true,
        ruleIds: ["BAN-403"],
        score: 10,
      });
      return;
    }

    const decision = inspectSimulatedRequest({
      method: targetPage === "login" ? "POST" : "GET",
      path: urlPath,
      queryOrBody,
      userAgent: "Mozilla/5.0 (Portal Browser)",
      wafMode,
    });

    if (decision.action === "BLOCKED") {
      setBrowserState({
        url: `http://127.0.0.1:8080${urlPath}?${queryOrBody}`,
        status: 403,
        blockedByWaf: true,
        ruleIds: decision.ruleIds,
        score: decision.score,
      });
      return;
    }

    // Reached upstream target_web (:8000 internal)
    if (targetPage === "search") {
      const hasSqliAttack = /('|\bor\b|\bunion\b|\bselect\b)/i.test(rawVal) && !/^(patrick )?o'brien$|^(marco )?d'angelo$/i.test(rawVal.trim());
      if (hasSqliAttack && portalMode === "VULNERABLE") {
        setBrowserState({
          url: `http://127.0.0.1:8080/search?q=${rawVal}`,
          status: 200,
          blockedByWaf: false,
          ruleIds: decision.ruleIds,
          score: decision.score,
          students: STUDENTS,
          leakedRows: [
            "accounts: admin | portal_admin_2026 | role=lecturer",
            "accounts: sv001 | student123 | role=student",
          ],
          sqlError: rawVal.trim() === "'" ? "SQLite Error: near \"'\": syntax error (Lộ thông báo lỗi DB!)" : undefined,
        });
        return;
      }
      const qLow = rawVal.trim().toLowerCase();
      const matched = STUDENTS.filter(
        (s) =>
          !qLow ||
          s.masv.toLowerCase().includes(qLow) ||
          s.fullname.toLowerCase().includes(qLow) ||
          s.className.toLowerCase().includes(qLow)
      );
      setBrowserState({
        url: `http://127.0.0.1:8080/search?q=${rawVal}`,
        status: 200,
        blockedByWaf: false,
        ruleIds: decision.ruleIds,
        score: decision.score,
        students: matched,
      });
      return;
    }

    if (targetPage === "login") {
      const sqliBypass = /'\s*or\s+/i.test(rawVal) && portalMode === "VULNERABLE";
      if (sqliBypass) {
        setBrowserState({
          url: "http://127.0.0.1:8080/login",
          status: 200,
          blockedByWaf: false,
          ruleIds: decision.ruleIds,
          score: decision.score,
          loginMessage: "ĐĂNG NHẬP THÀNH CÔNG QUYỀN ADMIN (Bypass SQLi vì VULNERABLE nối chuỗi SQL!)",
        });
        return;
      }
      const okCreds =
        (rawVal === "sv001" && (overridePass ?? loginPass) === "student123") ||
        (rawVal === "admin" && (overridePass ?? loginPass) === "portal_admin_2026");
      setBrowserState({
        url: "http://127.0.0.1:8080/login",
        status: okCreds ? 200 : 401,
        blockedByWaf: false,
        ruleIds: decision.ruleIds,
        score: decision.score,
        loginMessage: okCreds
          ? `Đăng nhập thành công (${rawVal}).`
          : portalMode === "HARDENED"
          ? "401 Unauthorized — Prepared Statement (?) vô hiệu hóa ký tự SQLi."
          : "401 Unauthorized — Sai tài khoản hoặc mật khẩu.",
      });
      return;
    }

    if (targetPage === "comments") {
      const hasXss = /<script|<img|onerror=|onload=|javascript:/i.test(rawVal);
      if (hasXss && portalMode === "VULNERABLE") {
        setBrowserState({
          url: `http://127.0.0.1:8080/comments?msg=${rawVal}`,
          status: 200,
          blockedByWaf: false,
          ruleIds: decision.ruleIds,
          score: decision.score,
          commentPreview: { author: commentAuthor, content: rawVal, xssAlert: true, escaped: false },
        });
        return;
      }
      setBrowserState({
        url: `http://127.0.0.1:8080/comments?msg=${rawVal}`,
        status: 200,
        blockedByWaf: false,
        ruleIds: decision.ruleIds,
        score: decision.score,
        commentPreview: {
          author: commentAuthor,
          content: rawVal,
          xssAlert: false,
          escaped: hasXss && portalMode === "HARDENED",
        },
      });
      return;
    }

    // Download endpoint
    const isTraversal = /\.\.\/|\.\.\\|\/etc\/passwd/i.test(rawVal);
    if (isTraversal) {
      if (portalMode === "HARDENED") {
        setBrowserState({
          url: `http://127.0.0.1:8080/download?file=${rawVal}`,
          status: 400,
          blockedByWaf: false,
          ruleIds: decision.ruleIds,
          score: decision.score,
          downloadText: "HTTP 400 Invalid file path — os.path.realpath() sandbox đã chặn leo thư mục!",
        });
      } else {
        setBrowserState({
          url: `http://127.0.0.1:8080/download?file=${rawVal}`,
          status: 200,
          blockedByWaf: false,
          ruleIds: decision.ruleIds,
          score: decision.score,
          downloadText: "root:x:0:0:root:/root:/bin/bash\nwww-data:x:33:33:www-data:/var/www:/usr/sbin/nologin\n(LỘ NỘI DUNG /etc/passwd DO CHẾ ĐỘ VULNERABLE!)",
        });
      }
      return;
    }

    setBrowserState({
      url: `http://127.0.0.1:8080/download?file=${rawVal}`,
      status: 200,
      blockedByWaf: false,
      ruleIds: decision.ruleIds,
      score: decision.score,
      downloadText:
        rawVal === "huongdan.txt"
          ? "Huong dan xem diem & tai tai lieu mon ATTT — Nhom Son, Hung, Quyet, Khanh."
          : "%PDF-1.4\n% De cuong & Tai lieu Mon An toan Thong tin - Khoa ATTT",
    });
  };

  const latestExecuteRef = useRef(executePortalAction);
  useEffect(() => {
    latestExecuteRef.current = executePortalAction;
  });

  useEffect(() => {
    if (!externalCommand) return;
    setPage(externalCommand.page);
    if (externalCommand.page === "search") setSearchInput(externalCommand.input);
    if (externalCommand.page === "login") setLoginUser(externalCommand.input);
    if (externalCommand.page === "comments") setCommentMsg(externalCommand.input);
    if (externalCommand.page === "download") setDownloadFile(externalCommand.input);
    latestExecuteRef.current(externalCommand.page, externalCommand.input);
  }, [externalCommand]);

  const currentUrl =
    browserState?.url ??
    `http://127.0.0.1:8080/${page}${page === "search" ? `?q=${searchInput}` : ""}`;

  return (
    <div className="overflow-hidden rounded-lg border border-zinc-300 bg-white text-slate-900 shadow-sm dark:border-zinc-700">
      {/* Realistic Chrome / Browser Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-slate-100 px-3 py-2 text-xs">
        <div className="flex items-center gap-2">
          <WindowControls />
          <span className="inline-flex items-center gap-1 font-semibold text-slate-700">
            <Globe className="h-3.5 w-3.5 text-blue-600" aria-hidden="true" />
            Portal Điểm Sinh viên
          </span>
        </div>

        <div className="flex flex-1 min-w-[200px] items-center gap-1.5 rounded border border-slate-300 bg-white px-2.5 py-1 font-mono text-[11px] text-slate-700">
          <Lock className="h-3 w-3 shrink-0 text-slate-400" aria-hidden="true" />
          <span className="truncate">{currentUrl}</span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 font-mono text-[10px] font-bold">
          <span
            className={`rounded px-2 py-0.5 ${
              wafMode === "BLOCKING"
                ? "bg-emerald-100 text-emerald-800"
                : wafMode === "MONITOR"
                ? "bg-amber-100 text-amber-800"
                : "bg-rose-100 text-rose-800"
            }`}
          >
            WAF: {wafMode}
          </span>
          <span
            className={`rounded px-2 py-0.5 ${
              portalMode === "HARDENED"
                ? "bg-blue-100 text-blue-800"
                : "bg-orange-100 text-orange-800"
            }`}
          >
            WEB: {portalMode}
          </span>
          <button
            type="button"
            onClick={() => setShowHeaders((v) => !v)}
            className="cursor-pointer rounded border border-slate-300 bg-white px-2 py-0.5 text-slate-700 hover:bg-slate-50"
          >
            {showHeaders ? "Ẩn Headers" : "HTTP Headers"}
          </button>
        </div>
      </div>

      {/* Collapsible HTTP Response Headers Drawer */}
      {showHeaders && (
        <div className="border-b border-slate-800 bg-[#0d1117] px-4 py-2.5 font-mono text-[11px] text-emerald-300">
          {wafMode === "OFF" ? (
            <div className="text-rose-300">
              HTTP/1.1 {browserState?.status ?? 200} · Server: StudentPortal-Apache-Dev/2.4.25 (Debian) · X-Powered-By: Python-Legacy/3.11 · Set-Cookie: portal_session=demo-session-token (Thiếu HttpOnly/SameSite!)
            </div>
          ) : (
            <div>
              HTTP/1.1 {browserState?.status ?? 200} · [Server &amp; X-Powered-By đã bị Mini-WAF xóa] · X-Content-Type-Options: nosniff · X-Frame-Options: DENY · Set-Cookie: portal_session=...; HttpOnly; SameSite=Lax
            </div>
          )}
        </div>
      )}

      {/* Student Portal App Header & Nav */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-[#0f172a] px-4 py-2.5 text-white">
        <div className="text-xs font-bold tracking-wide">
          CỔNG QUẢN LÝ ĐIỂM SINH VIÊN · KHOA AN TOÀN THÔNG TIN
        </div>
        <div className="flex flex-wrap gap-1 text-xs">
          {[
            { id: "search" as const, label: "Bảng điểm", Icon: Search },
            { id: "login" as const, label: "Đăng nhập", Icon: Lock },
            { id: "comments" as const, label: "Bình luận", Icon: MessageSquare },
            { id: "download" as const, label: "Tài liệu", Icon: FileText },
          ].map((nav) => (
            <button
              key={nav.id}
              type="button"
              onClick={() => {
                setPage(nav.id);
                setBrowserState(null);
              }}
              className={`inline-flex cursor-pointer items-center gap-1 rounded px-2.5 py-1 font-medium ${
                page === nav.id ? "bg-blue-600 text-white" : "text-slate-300 hover:bg-slate-800"
              }`}
            >
              <nav.Icon className="h-3 w-3" aria-hidden="true" />
              {nav.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Browser Content Area */}
      <div className="p-4 text-xs">
        {browserState?.blockedByWaf ? (
          <div className="rounded-lg border-2 border-rose-500 bg-[#0f172a] p-5 text-white space-y-2">
            <div className="flex items-center gap-2 text-base font-bold text-rose-400">
              <ShieldAlert className="h-5 w-5" aria-hidden="true" />
              403 Forbidden — Yêu cầu bị chặn bởi Mini-WAF
            </div>
            <p className="text-slate-300">
              Hệ thống phòng thủ tầng biên phát hiện dấu hiệu vi phạm trước khi gói tin chạm tới Website Quản lý Sinh viên (<code className="text-amber-300">:8000 internal</code>).
            </p>
            <div className="font-mono text-[11px] text-amber-300">
              Rule IDs: [{browserState.ruleIds.join(", ")}] · Anomaly Score: {browserState.score} · Backend Hits: 0
            </div>
          </div>
        ) : (
          <>
            {page === "search" && (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  <input
                    type="text"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    aria-label="Tìm kiếm sinh viên trên Website"
                    className="min-w-[200px] flex-1 rounded border border-slate-300 bg-white px-2.5 py-1.5 font-mono text-slate-900"
                  />
                  <button
                    type="button"
                    onClick={() => executePortalAction("search", searchInput)}
                    className="cursor-pointer rounded bg-blue-600 px-3.5 py-1.5 font-semibold text-white hover:bg-blue-700"
                  >
                    Tra cứu
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5 font-mono text-[11px]">
                  {[
                    { label: "O'Brien", val: "O'Brien" },
                    { label: "D'Angelo", val: "D'Angelo" },
                    { label: "' OR '1'='1", val: "' OR '1'='1" },
                    { label: "UN/**/ION SEL/**/ECT", val: "1' UN/**/ION SEL/**/ECT 1,2--" },
                    { label: "%2527 Double URL", val: "1%2527%2520OR%25201%253D1--" },
                  ].map((chip) => (
                    <button
                      key={chip.label}
                      type="button"
                      onClick={() => {
                        setSearchInput(chip.val);
                        executePortalAction("search", chip.val);
                      }}
                      className="cursor-pointer rounded border border-slate-300 bg-slate-100 px-2 py-0.5 text-slate-700 hover:bg-slate-200"
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>

                {browserState?.leakedRows && (
                  <div className="rounded border border-rose-400 bg-rose-50 p-2.5 font-mono text-[11px] text-rose-900">
                    <div className="font-bold">[CẢNH BÁO RÒ RỈ CSDL] Khai thác SQLi thành công do WAF OFF &amp; Portal VULNERABLE:</div>
                    {browserState.leakedRows.map((r) => (
                      <div key={r}>{r}</div>
                    ))}
                  </div>
                )}

                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500">
                      <th className="py-1.5 pr-2">Mã SV</th>
                      <th className="py-1.5 pr-2">Họ và tên</th>
                      <th className="py-1.5 pr-2">Lớp</th>
                      <th className="py-1.5 pr-2">GPA</th>
                      <th className="py-1.5">Ghi chú</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(browserState?.students ?? STUDENTS).map((st) => (
                      <tr key={st.masv} className={st.masv === "SV002" && /o'brien/i.test(searchInput) ? "bg-emerald-50 font-semibold" : ""}>
                        <td className="py-1.5 pr-2 font-mono">{st.masv}</td>
                        <td className="py-1.5 pr-2">{st.fullname}</td>
                        <td className="py-1.5 pr-2">{st.className}</td>
                        <td className="py-1.5 pr-2 font-mono font-bold text-blue-700">{st.gpa}</td>
                        <td className="py-1.5 text-slate-600">{st.note}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {page === "login" && (
              <div className="max-w-md space-y-2.5">
                <div className="grid gap-2 sm:grid-cols-2">
                  <input
                    type="text"
                    value={loginUser}
                    onChange={(e) => setLoginUser(e.target.value)}
                    aria-label="Username Portal"
                    className="rounded border border-slate-300 px-2.5 py-1.5 font-mono"
                  />
                  <input
                    type="text"
                    value={loginPass}
                    onChange={(e) => setLoginPass(e.target.value)}
                    aria-label="Password Portal"
                    className="rounded border border-slate-300 px-2.5 py-1.5 font-mono"
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => executePortalAction("login", loginUser, loginPass)}
                    className="cursor-pointer rounded bg-blue-600 px-3 py-1.5 font-semibold text-white"
                  >
                    Đăng nhập
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setLoginUser("admin' OR '1'='1'--");
                      executePortalAction("login", "admin' OR '1'='1'--", "x");
                    }}
                    className="cursor-pointer rounded border border-slate-300 bg-slate-100 px-2.5 py-1.5 font-mono text-slate-800"
                  >
                    admin&apos; OR &apos;1&apos;=&apos;1&apos;--
                  </button>
                </div>
                {browserState?.loginMessage && (
                  <div className="rounded border border-slate-300 bg-slate-50 p-2.5 font-mono text-[11px]">
                    {browserState.loginMessage}
                  </div>
                )}
              </div>
            )}

            {page === "comments" && (
              <div className="space-y-2.5">
                <div className="flex flex-wrap gap-2">
                  <input
                    type="text"
                    value={commentAuthor}
                    onChange={(e) => setCommentAuthor(e.target.value)}
                    aria-label="Tác giả bình luận"
                    className="w-28 rounded border border-slate-300 px-2.5 py-1.5"
                  />
                  <input
                    type="text"
                    value={commentMsg}
                    onChange={(e) => setCommentMsg(e.target.value)}
                    aria-label="Nội dung bình luận"
                    className="min-w-[200px] flex-1 rounded border border-slate-300 px-2.5 py-1.5 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => executePortalAction("comments", commentMsg)}
                    className="cursor-pointer rounded bg-blue-600 px-3 py-1.5 font-semibold text-white"
                  >
                    Đăng bình luận
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5 font-mono text-[11px]">
                  {[
                    "5 < 10 và điểm >= 8.0",
                    "<img src=x onerror=alert(1)>",
                    "<script>alert(document.cookie)</script>",
                  ].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => {
                        setCommentMsg(s);
                        executePortalAction("comments", s);
                      }}
                      className="cursor-pointer rounded border border-slate-300 bg-slate-100 px-2 py-0.5 text-slate-700"
                    >
                      {s}
                    </button>
                  ))}
                </div>
                {browserState?.commentPreview && (
                  <div className="rounded border border-slate-200 bg-slate-50 p-3">
                    {browserState.commentPreview.xssAlert && (
                      <div className="mb-2 rounded border border-rose-500 bg-rose-100 px-2.5 py-1.5 font-mono font-bold text-rose-800">
                        [XSS EXECUTED!] alert(1) kích hoạt do WAF OFF &amp; không html.escape()!
                      </div>
                    )}
                    {browserState.commentPreview.escaped && (
                      <div className="mb-1 inline-flex items-center gap-1 font-mono text-[11px] font-bold text-emerald-700">
                        <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                        HARDENED: Đã mã hóa HTML Entities (vô hiệu hóa script)
                      </div>
                    )}
                    <div>
                      <strong>{browserState.commentPreview.author}:</strong>{" "}
                      <span className="font-mono">{browserState.commentPreview.content}</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {page === "download" && (
              <div className="space-y-2.5">
                <div className="flex flex-wrap gap-2">
                  <input
                    type="text"
                    value={downloadFile}
                    onChange={(e) => setDownloadFile(e.target.value)}
                    aria-label="Tên tệp cần tải"
                    className="min-w-[200px] flex-1 rounded border border-slate-300 px-2.5 py-1.5 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => executePortalAction("download", downloadFile)}
                    className="cursor-pointer rounded bg-blue-600 px-3 py-1.5 font-semibold text-white"
                  >
                    Tải tài liệu
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5 font-mono text-[11px]">
                  {["tailieu.pdf", "huongdan.txt", "../../etc/passwd", "....//....//etc/passwd"].map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => {
                        setDownloadFile(f);
                        executePortalAction("download", f);
                      }}
                      className="cursor-pointer rounded border border-slate-300 bg-slate-100 px-2 py-0.5 text-slate-700"
                    >
                      {f}
                    </button>
                  ))}
                </div>
                {browserState?.downloadText && (
                  <pre className="whitespace-pre-wrap rounded border border-slate-800 bg-[#0d1117] p-3 font-mono text-[11px] text-emerald-300">
                    {browserState.downloadText}
                  </pre>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
