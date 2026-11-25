"use client";

import { useEffect, useRef, useState } from "react";
import {
  Award,
  BookOpen,
  Calendar,
  ChevronRight,
  Cpu,
  Download,
  FileText,
  GraduationCap,
  Home,
  Lock,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Search,
  ShieldAlert,
  Users,
} from "lucide-react";
import { WindowControls } from "@/components/WindowBar";
import {
  type PortalSecurityMode,
  type WafMode,
  inspectSimulatedRequest,
} from "@/lib/miniWafEngine";

export type PortalPageId = "home" | "search" | "login" | "comments" | "download";

export interface PortalDriverCommand {
  id: number;
  page: "search" | "login" | "comments" | "download";
  input: string;
}

export interface PortalHttpExchange {
  url: string;
  status: number;
  headers: string[];
  action: "ALLOWED" | "MONITORED" | "BLOCKED" | "BANNED";
  ruleIds: string[];
  score: number;
}

interface StudentRow {
  masv: string;
  fullname: string;
  className: string;
  gpa: number;
  note: string;
}

const STUDENTS: StudentRow[] = [
  { masv: "SV001", fullname: "Nguyen Van An", className: "D22CNTT01", gpa: 8.8, note: "Mạng máy tính" },
  { masv: "SV002", fullname: "Patrick O'Brien", className: "D22CNTT01", gpa: 9.1, note: "Cơ sở dữ liệu" },
  { masv: "SV003", fullname: "Marco D'Angelo", className: "D22CNTT02", gpa: 8.4, note: "Toán rời rạc" },
  { masv: "SV004", fullname: "Tran Thi Binh", className: "D22CNTT02", gpa: 7.9, note: "Hệ điều hành" },
  { masv: "SV005", fullname: "Le Minh Khanh", className: "D22CNTT01", gpa: 9.4, note: "Kiến trúc máy tính" },
];

const ANNOUNCEMENTS = [
  {
    day: "25/11",
    year: "2026",
    title: "Kế hoạch thi kết thúc học phần Học kỳ I — Hệ Đại học Chính quy",
    tag: "Đào tạo",
  },
  {
    day: "18/11",
    year: "2026",
    title: "Thông báo rà soát điểm tích lũy và đăng ký phúc khảo trực tuyến",
    tag: "Khảo thí",
  },
  {
    day: "30/10",
    year: "2026",
    title: "Hội nghị Sinh viên Nghiên cứu Khoa học Khoa Công nghệ Thông tin 2026",
    tag: "Nghiên cứu",
  },
];

interface PortalResponseState {
  url: string;
  status: number;
  blockedByWaf: boolean;
  incidentId?: string;
  students?: StudentRow[];
  leakedRows?: string[];
  sqlError?: string;
  authenticatedUser?: { username: string; role: "admin" | "student"; viaBypass: boolean };
  loginError?: string;
  commentPreview?: { author: string; content: string; xssAlert: boolean };
  downloadText?: string;
}

interface StudentPortalEmulatorProps {
  wafMode: WafMode;
  portalMode: PortalSecurityMode;
  ipBanned?: boolean;
  externalCommand?: PortalDriverCommand | null;
  onExchange?: (exchange: PortalHttpExchange) => void;
}

function MtaCrest({ className = "h-10 w-10" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={className}
      role="img"
      aria-label="Huy hiệu Học viện Kỹ thuật Quân sự"
    >
      <circle cx="32" cy="32" r="30" fill="#005F37" stroke="#FBBF24" strokeWidth="2.5" />
      <circle cx="32" cy="32" r="24" fill="none" stroke="#FDE68A" strokeWidth="1" strokeDasharray="3 2" />
      <ellipse cx="32" cy="32" rx="16" ry="6.5" fill="none" stroke="#FBBF24" strokeWidth="1.4" transform="rotate(-32 32 32)" />
      <ellipse cx="32" cy="32" rx="16" ry="6.5" fill="none" stroke="#34D399" strokeWidth="1.4" transform="rotate(32 32 32)" />
      <polygon
        points="32,16 35.4,26.2 46,26.2 37.5,32.5 40.7,42.8 32,36.6 23.3,42.8 26.5,32.5 18,26.2 28.6,26.2"
        fill="#FBBF24"
      />
    </svg>
  );
}

export function StudentPortalEmulator({
  wafMode,
  portalMode,
  ipBanned = false,
  externalCommand,
  onExchange,
}: StudentPortalEmulatorProps) {
  const [page, setPage] = useState<PortalPageId>("home");

  const [heroQuery, setHeroQuery] = useState("");
  const [searchInput, setSearchInput] = useState("SV001");
  const [loginUser, setLoginUser] = useState("sv001");
  const [loginPass, setLoginPass] = useState("student123");
  const [commentAuthor, setCommentAuthor] = useState("Nguyen Van An");
  const [commentMsg, setCommentMsg] = useState("Cho em hỏi lịch công bố điểm phúc khảo môn Hệ điều hành ạ?");
  const [downloadFile, setDownloadFile] = useState("Quy_che_Dao_tao_2026.pdf");

  const [browserState, setBrowserState] = useState<PortalResponseState | null>(null);

  const buildHeaders = (status: number) =>
    wafMode === "OFF"
      ? [
          `HTTP/1.1 ${status}`,
          "Server: StudentPortal-Apache/2.4.25 (Debian)",
          "X-Powered-By: PHP-Python-Legacy/3.11",
          "Set-Cookie: mta_session=9f8e7d6c; Path=/",
        ]
      : [
          `HTTP/1.1 ${status}`,
          "X-Content-Type-Options: nosniff",
          "X-Frame-Options: DENY",
          "Set-Cookie: mta_session=9f8e7d6c; Path=/; HttpOnly; SameSite=Lax",
        ];

  const executePortalAction = (
    targetPage: "search" | "login" | "comments" | "download",
    rawVal: string,
    overridePass?: string
  ) => {
    const pathMap = {
      search: "/search",
      login: "/login",
      comments: "/comments",
      download: "/download",
    };
    const paramStr =
      targetPage === "search"
        ? `q=${rawVal}`
        : targetPage === "login"
        ? `username=${rawVal}&password=${overridePass ?? loginPass}`
        : targetPage === "comments"
        ? `author=${commentAuthor}&msg=${rawVal}`
        : `file=${rawVal}`;

    const fullUrl =
      targetPage === "login"
        ? "http://127.0.0.1:8080/login"
        : `http://127.0.0.1:8080${pathMap[targetPage]}?${
            targetPage === "search" ? "q" : targetPage === "comments" ? "msg" : "file"
          }=${rawVal}`;

    if (wafMode !== "OFF" && ipBanned) {
      setBrowserState({
        url: `http://127.0.0.1:8080${pathMap[targetPage]}`,
        status: 403,
        blockedByWaf: true,
        incidentId: "INC-BAN-403",
      });
      onExchange?.({
        url: fullUrl,
        status: 403,
        headers: buildHeaders(403),
        action: "BANNED",
        ruleIds: ["BAN-403"],
        score: 10,
      });
      return;
    }

    const decision = inspectSimulatedRequest({
      method: targetPage === "login" ? "POST" : "GET",
      path: pathMap[targetPage],
      queryOrBody: paramStr,
      userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X)",
      wafMode,
    });

    if (decision.action === "BLOCKED") {
      setBrowserState({
        url: fullUrl,
        status: 403,
        blockedByWaf: true,
        incidentId: `WAF-${decision.ruleIds.join("-")}`,
      });
      onExchange?.({
        url: fullUrl,
        status: 403,
        headers: buildHeaders(403),
        action: "BLOCKED",
        ruleIds: decision.ruleIds,
        score: decision.score,
      });
      return;
    }

    if (targetPage === "search") {
      const hasSqliAttack =
        /('|\bor\b|\bunion\b|\bselect\b)/i.test(rawVal) &&
        !/^(patrick )?o'brien$|^(marco )?d'angelo$/i.test(rawVal.trim());
      if (hasSqliAttack && portalMode === "VULNERABLE") {
        setBrowserState({
          url: fullUrl,
          status: rawVal.trim() === "'" ? 500 : 200,
          blockedByWaf: false,
          students: STUDENTS,
          leakedRows: [
            "admin | portal_admin_2026 | Giảng viên Quản trị",
            "sv001 | student123 | Sinh viên D22CNTT01",
          ],
          sqlError:
            rawVal.trim() === "'"
              ? 'sqlite3.OperationalError: near "\'": syntax error'
              : undefined,
        });
        onExchange?.({
          url: fullUrl,
          status: rawVal.trim() === "'" ? 500 : 200,
          headers: buildHeaders(rawVal.trim() === "'" ? 500 : 200),
          action: decision.action,
          ruleIds: decision.ruleIds,
          score: decision.score,
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
        url: fullUrl,
        status: 200,
        blockedByWaf: false,
        students: matched,
      });
      onExchange?.({
        url: fullUrl,
        status: 200,
        headers: buildHeaders(200),
        action: decision.action,
        ruleIds: decision.ruleIds,
        score: decision.score,
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
          authenticatedUser: { username: "admin", role: "admin", viaBypass: true },
        });
        onExchange?.({
          url: "http://127.0.0.1:8080/login",
          status: 200,
          headers: buildHeaders(200),
          action: decision.action,
          ruleIds: decision.ruleIds,
          score: decision.score,
        });
        return;
      }
      const passVal = overridePass ?? loginPass;
      const okAdmin = rawVal === "admin" && passVal === "portal_admin_2026";
      const okStudent = rawVal === "sv001" && passVal === "student123";
      const status = okAdmin || okStudent ? 200 : 401;
      setBrowserState({
        url: "http://127.0.0.1:8080/login",
        status,
        blockedByWaf: false,
        authenticatedUser: okAdmin
          ? { username: "admin", role: "admin", viaBypass: false }
          : okStudent
          ? { username: "sv001", role: "student", viaBypass: false }
          : undefined,
        loginError:
          status === 401 ? "Tên đăng nhập hoặc mật khẩu không chính xác." : undefined,
      });
      onExchange?.({
        url: "http://127.0.0.1:8080/login",
        status,
        headers: buildHeaders(status),
        action: decision.action,
        ruleIds: decision.ruleIds,
        score: decision.score,
      });
      return;
    }

    if (targetPage === "comments") {
      const hasXss = /<script|<img|onerror=|onload=|javascript:/i.test(rawVal);
      const xssTriggers = hasXss && portalMode === "VULNERABLE";
      setBrowserState({
        url: fullUrl,
        status: 200,
        blockedByWaf: false,
        commentPreview: { author: commentAuthor, content: rawVal, xssAlert: xssTriggers },
      });
      onExchange?.({
        url: fullUrl,
        status: 200,
        headers: buildHeaders(200),
        action: decision.action,
        ruleIds: decision.ruleIds,
        score: decision.score,
      });
      return;
    }

    const isTraversal = /\.\.\/|\.\.\\|\/etc\/passwd/i.test(rawVal);
    if (isTraversal) {
      const status = portalMode === "HARDENED" ? 400 : 200;
      setBrowserState({
        url: fullUrl,
        status,
        blockedByWaf: false,
        downloadText:
          portalMode === "HARDENED"
            ? "HTTP 400 Bad Request — Đường dẫn tài liệu không hợp lệ."
            : "root:x:0:0:root:/root:/bin/bash\ndaemon:x:1:1:daemon:/usr/sbin:/usr/sbin/nologin\nwww-data:x:33:33:www-data:/var/www:/usr/sbin/nologin\npostgres:x:108:114:PostgreSQL administrator:/var/lib/postgresql:/bin/bash",
      });
      onExchange?.({
        url: fullUrl,
        status,
        headers: buildHeaders(status),
        action: decision.action,
        ruleIds: decision.ruleIds,
        score: decision.score,
      });
      return;
    }

    setBrowserState({
      url: fullUrl,
      status: 200,
      blockedByWaf: false,
      downloadText:
        rawVal.toLowerCase().includes("huong_dan") || rawVal === "huongdan.txt"
          ? "HƯỚNG DẪN TRA CỨU ĐIỂM HỌC PHẦN\n1. Đăng nhập tài khoản sinh viên D22 hoặc tra cứu theo Mã SV.\n2. Mọi thắc mắc phúc khảo gửi trực tiếp về Phòng Đào tạo trong 7 ngày."
          : "%PDF-1.4\n% QUY CHẾ ĐÀO TẠO & CHƯƠNG TRÌNH ĐẠI HỌC CHÍNH QUY 2026\n% Học viện Kỹ thuật Quân sự (MTA) — Phòng Đào tạo",
    });
    onExchange?.({
      url: fullUrl,
      status: 200,
      headers: buildHeaders(200),
      action: decision.action,
      ruleIds: decision.ruleIds,
      score: decision.score,
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
    (page === "home"
      ? "https://portal.mta.edu.vn/"
      : page === "search"
      ? `http://127.0.0.1:8080/search?q=${searchInput}`
      : `http://127.0.0.1:8080/${page}`);

  const navTo = (target: PortalPageId) => {
    setPage(target);
    setBrowserState(null);
  };

  return (
    <div className="overflow-hidden rounded-xl border border-slate-300 bg-white text-slate-800 shadow-md dark:border-zinc-700">
      {/* Clean Real Browser Address Chrome (Zero Security/Lab Badges) */}
      <div className="flex flex-wrap items-center gap-2.5 border-b border-slate-200 bg-slate-100 px-3 py-2 text-xs">
        <WindowControls onClose={() => navTo("home")} closeTitle="Về Trang chủ Portal" />
        <div className="flex min-w-[200px] flex-1 items-center gap-1.5 rounded-full border border-slate-300 bg-white px-3 py-1 font-mono text-[11px] text-slate-700">
          <Lock className="h-3 w-3 shrink-0 text-[#005F37]" aria-hidden="true" />
          <span className="truncate">{currentUrl}</span>
        </div>
      </div>

      {/* MTA TOP UTILITY BAR */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-[#004528] px-4 py-1.5 text-[11px] text-emerald-100">
        <div className="flex items-center gap-2.5">
          <span className="font-medium text-white">Welcome to MTA</span>
          <span className="text-emerald-400/50">|</span>
          <span className="hidden sm:inline">Cổng Thông tin Đào tạo Sinh viên</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navTo("search")}
            className="inline-flex cursor-pointer items-center gap-1 hover:text-amber-300"
          >
            <Search className="h-3 w-3" aria-hidden="true" />
            Tra cứu nhanh
          </button>
          <span className="text-emerald-400/50">|</span>
          <span className="font-semibold text-amber-300">VN</span>
        </div>
      </div>

      {/* MTA MAIN NAVIGATION HEADER */}
      <div className="bg-[#005F37] px-4 py-3 text-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => navTo("home")}
            className="flex cursor-pointer items-center gap-2.5 text-left"
          >
            <MtaCrest className="h-10 w-10 shrink-0" />
            <div>
              <div className="text-xs font-extrabold tracking-wide text-white sm:text-sm">
                HỌC VIỆN KỸ THUẬT QUÂN SỰ
              </div>
              <div className="text-[10px] font-bold tracking-widest text-amber-400 uppercase">
                MILITARY TECHNICAL ACADEMY · CỔNG ĐÀO TẠO
              </div>
            </div>
          </button>

          <nav className="flex flex-wrap items-center gap-1 text-[11px] font-semibold">
            {[
              { id: "home" as const, label: "Trang chủ", Icon: Home },
              { id: "search" as const, label: "Tra cứu Điểm", Icon: Search },
              { id: "login" as const, label: "Đăng nhập SV", Icon: Lock },
              { id: "comments" as const, label: "Hỏi đáp", Icon: MessageSquare },
              { id: "download" as const, label: "Tài liệu", Icon: FileText },
            ].map((nav) => (
              <button
                key={nav.id}
                type="button"
                onClick={() => navTo(nav.id)}
                className={`inline-flex cursor-pointer items-center gap-1 rounded-md px-2.5 py-1.5 transition-colors ${
                  page === nav.id
                    ? "bg-white text-[#005F37] shadow-sm"
                    : "text-white/90 hover:bg-white/15"
                }`}
              >
                <nav.Icon className="h-3 w-3" aria-hidden="true" />
                {nav.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* EDGE GATEWAY 403 BLOCK PAGE WHEN INTERCEPTED BEFORE APP */}
      {browserState?.blockedByWaf ? (
        <div className="bg-slate-50 p-5">
          <div className="mx-auto max-w-2xl rounded-xl border border-rose-300 bg-white p-5 text-slate-800 shadow-sm space-y-3">
            <div className="flex items-center gap-2.5 text-base font-bold text-rose-700">
              <ShieldAlert className="h-6 w-6 shrink-0" aria-hidden="true" />
              403 Forbidden — Yêu cầu bị từ chối bởi Cổng Bảo mật
            </div>
            <p className="text-xs leading-relaxed text-slate-600">
              Kết nối tới tài nguyên <code className="rounded bg-slate-100 px-1 py-0.5 text-slate-800">{currentUrl}</code> không được phép xử lý do vi phạm chính sách an toàn truy cập của hệ thống.
            </p>
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-[11px] text-slate-600">
              <span>Mã sự cố: {browserState.incidentId}</span>
              <button
                type="button"
                onClick={() => setBrowserState(null)}
                className="cursor-pointer rounded bg-[#005F37] px-3 py-1 font-sans font-semibold text-white hover:bg-[#004a2b]"
              >
                Quay lại Trang chủ
              </button>
            </div>
          </div>
        </div>
      ) : (
        <>
          {page === "home" ? (
            <div className="relative overflow-hidden bg-gradient-to-br from-[#004b2b] via-[#065f46] to-[#132a46] px-5 py-7 text-white">
              <svg
                viewBox="0 0 400 200"
                className="pointer-events-none absolute right-[-40px] top-[-30px] h-64 w-96 opacity-15"
                aria-hidden="true"
              >
                <circle cx="240" cy="100" r="90" fill="none" stroke="#FBBF24" strokeWidth="1.5" />
                <circle cx="240" cy="100" r="68" fill="none" stroke="#FBBF24" strokeWidth="1" strokeDasharray="6 4" />
                <circle cx="240" cy="100" r="46" fill="none" stroke="#34D399" strokeWidth="1.2" />
                <polygon points="240,68 248,92 272,92 252,107 260,130 240,115 220,130 228,107 208,92 232,92" fill="#FBBF24" />
              </svg>

              <div className="relative z-10 max-w-2xl space-y-3">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/40 bg-amber-400/15 px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-300">
                  Năm học 2025 – 2026 · Hệ thống Đào tạo Trực tuyến
                </span>
                <h2 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
                  Trí tuệ tỏa sáng
                </h2>
                <p className="text-xs leading-relaxed text-emerald-100/90">
                  Cổng thông tin tổng hợp Học viện Kỹ thuật Quân sự: tra cứu bảng điểm học phần, quản lý hồ sơ giảng viên/học viên, hỏi đáp giáo vụ và kho biểu mẫu đào tạo chính quy.
                </p>

                <div className="flex flex-wrap gap-2 pt-1">
                  <input
                    type="text"
                    value={heroQuery}
                    onChange={(e) => setHeroQuery(e.target.value)}
                    placeholder="Nhập Mã sinh viên hoặc Họ tên để tra cứu điểm..."
                    className="min-w-[210px] flex-1 rounded-lg border border-white/25 bg-white/95 px-3 py-2 text-xs text-slate-900 placeholder:text-slate-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const q = heroQuery.trim() || "SV001";
                      setSearchInput(q);
                      setPage("search");
                      executePortalAction("search", q);
                    }}
                    className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-amber-400 px-3.5 py-2 text-xs font-bold text-[#003d22] hover:bg-amber-300"
                  >
                    <Search className="h-3.5 w-3.5" aria-hidden="true" />
                    Tra cứu điểm
                  </button>
                  <button
                    type="button"
                    onClick={() => navTo("login")}
                    className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-white/30 bg-white/10 px-3 py-2 text-xs font-semibold text-white hover:bg-white/20"
                  >
                    Đăng nhập Cổng Đào tạo
                    <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-1.5 border-b border-emerald-900/10 bg-[#F2F9F6] px-4 py-2 text-[11px] font-medium text-[#005F37]">
              <button
                type="button"
                onClick={() => navTo("home")}
                className="cursor-pointer hover:underline"
              >
                Trang chủ
              </button>
              <ChevronRight className="h-3 w-3 text-slate-400" aria-hidden="true" />
              <span className="font-bold">
                {page === "search"
                  ? "Tra cứu Điểm học phần"
                  : page === "login"
                  ? "Đăng nhập Hệ thống Đào tạo"
                  : page === "comments"
                  ? "Hỏi đáp & Phản hồi Giáo vụ"
                  : "Kho Biểu mẫu & Học liệu"}
              </span>
            </div>
          )}

          {/* HOME LANDING VIEW */}
          {page === "home" && (
            <div className="space-y-6 bg-white p-4 sm:p-5 text-xs">
              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  {
                    id: "search" as const,
                    title: "Đào tạo & Bảng điểm",
                    desc: "Tra cứu điểm học phần, GPA tích lũy học kỳ I 2025–2026",
                    Icon: GraduationCap,
                  },
                  {
                    id: "login" as const,
                    title: "Cổng Đăng nhập Nội bộ",
                    desc: "Phân hệ nhập điểm Giảng viên & hồ sơ Sinh viên D22",
                    Icon: Lock,
                  },
                  {
                    id: "download" as const,
                    title: "Hỏi đáp & Kho Tài liệu",
                    desc: "Tải quy chế đào tạo PDF & trao đổi trực tiếp với Giáo vụ",
                    Icon: BookOpen,
                  },
                ].map((card) => (
                  <button
                    key={card.id}
                    type="button"
                    onClick={() => {
                      navTo(card.id);
                      if (card.id === "search") executePortalAction("search", "");
                    }}
                    className="group flex cursor-pointer items-start gap-3 rounded-xl border border-[#E6EFEB] bg-[#F2F9F6] p-3.5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-[#005F37]/40 hover:shadow-sm"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#FFEED0] text-[#005F37]">
                      <card.Icon className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <div className="space-y-0.5">
                      <div className="font-bold text-[#005F37] group-hover:underline">
                        {card.title}
                      </div>
                      <p className="text-[11px] leading-snug text-slate-600">{card.desc}</p>
                    </div>
                  </button>
                ))}
              </div>

              <div className="grid gap-4 md:grid-cols-12">
                <div className="md:col-span-6 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h3 className="border-l-4 border-amber-400 pl-2.5 text-sm font-bold text-[#005F37] uppercase">
                      Tin nổi bật
                    </h3>
                    <button
                      type="button"
                      onClick={() => navTo("comments")}
                      className="inline-flex cursor-pointer items-center gap-0.5 text-[11px] font-semibold text-[#005F37] hover:underline"
                    >
                      Hỏi đáp thêm
                      <ChevronRight className="h-3 w-3" aria-hidden="true" />
                    </button>
                  </div>
                  <div className="overflow-hidden rounded-xl border border-[#E6EFEB] bg-white shadow-xs">
                    <div className="bg-gradient-to-r from-[#005F37] to-[#0b3b2e] px-3.5 py-2.5 text-white">
                      <span className="rounded bg-amber-400 px-1.5 py-0.5 text-[10px] font-bold text-[#003d22]">
                        ĐÀO TẠO ĐẠI HỌC
                      </span>
                      <div className="mt-1.5 font-bold leading-snug">
                        Học viện Kỹ thuật Quân sự hoàn tất cập nhật Cổng Thông tin Tra cứu Điểm Học kỳ I năm học 2025 – 2026
                      </div>
                    </div>
                    <div className="space-y-2 p-3 text-[11px] leading-relaxed text-slate-600">
                      <p>
                        Sinh viên và giảng viên các lớp chính quy có thể tra cứu trực tiếp điểm thành phần, điểm tổng kết GPA hệ 10 và tải tài liệu hướng dẫn học vụ ngay trên cổng trực tuyến.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setPage("search");
                          executePortalAction("search", "");
                        }}
                        className="inline-flex cursor-pointer items-center gap-1 font-semibold text-[#005F37] hover:underline"
                      >
                        Xem bảng điểm lớp D22CNTT01 ▶
                      </button>
                    </div>
                  </div>
                </div>

                <div className="md:col-span-6 space-y-2.5 rounded-xl border border-[#E6EFEB] bg-[#F2F9F6] p-3.5">
                  <h3 className="border-l-4 border-amber-400 pl-2.5 text-sm font-bold text-[#005F37] uppercase">
                    Thông báo đào tạo
                  </h3>
                  <div className="space-y-2">
                    {ANNOUNCEMENTS.map((item) => (
                      <button
                        key={item.title}
                        type="button"
                        onClick={() => navTo("download")}
                        className="flex w-full cursor-pointer items-center gap-2.5 rounded-lg border border-[#E6EFEB] bg-white p-2 text-left transition-colors hover:border-[#005F37]/40"
                      >
                        <div className="flex w-12 shrink-0 flex-col items-center rounded-md bg-[#005F37] py-1 text-center text-white">
                          <span className="text-[11px] font-extrabold leading-tight text-amber-300">
                            {item.day}
                          </span>
                          <span className="text-[9px] text-emerald-100">{item.year}</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="truncate font-semibold text-slate-800">{item.title}</div>
                          <div className="mt-0.5 inline-flex items-center gap-1 text-[10px] text-[#005F37]">
                            <Calendar className="h-3 w-3" aria-hidden="true" />
                            Mục: {item.tag} · Xem văn bản
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* RESEARCH & IMPRESSIVE NUMBERS */}
              <div className="grid gap-3 sm:grid-cols-12">
                <div className="sm:col-span-6 rounded-xl bg-[#0a1d35] p-4 text-white space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-amber-400 uppercase">
                      <Cpu className="h-3.5 w-3.5" aria-hidden="true" />
                      Nghiên cứu Khoa học
                    </span>
                    <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] text-emerald-300">
                      NĂM 2026
                    </span>
                  </div>
                  <div className="font-bold text-white">
                    Chuyển đổi số Quản lý Đào tạo &amp; Học liệu Mở cho Sinh viên Kỹ thuật
                  </div>
                  <p className="text-[11px] leading-relaxed text-slate-300">
                    Kết nối đồng bộ dữ liệu điểm thi, lịch giảng đường và kho giáo trình dùng chung giữa các khoa chuyên ngành.
                  </p>
                </div>

                <div className="sm:col-span-6 rounded-xl bg-gradient-to-r from-[#5a1f18] to-[#7c2d12] p-4 text-white">
                  <div className="mb-2.5 border-b border-white/20 pb-1 text-center text-[11px] font-bold uppercase tracking-wider">
                    Những con số ấn tượng
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-center">
                    {[
                      { num: "3", label: "Top ĐH KTQS", Icon: Award },
                      { num: "13", label: "Giải thưởng KHCN", Icon: GraduationCap },
                      { num: "100+", label: "Chuyên ngành", Icon: BookOpen },
                      { num: "5069+", label: "Sinh viên", Icon: Users },
                    ].map((stat) => (
                      <div key={stat.label} className="space-y-0.5">
                        <stat.Icon className="mx-auto h-3.5 w-3.5 text-white/80" aria-hidden="true" />
                        <div className="text-sm font-extrabold text-amber-400">{stat.num}</div>
                        <div className="text-[9px] text-amber-100/90">{stat.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* FUNCTIONAL PAGE: GRADE LOOKUP */}
          {page === "search" && (
            <div className="space-y-3.5 bg-white p-4 text-xs">
              <div className="border-l-4 border-amber-400 pl-2.5">
                <h3 className="text-sm font-bold text-[#005F37]">
                  Tra cứu Bảng điểm Học phần — Học kỳ I (2025 – 2026)
                </h3>
                <p className="text-[11px] text-slate-500">
                  Nhập Mã sinh viên (vd: SV001) hoặc Họ và tên sinh viên (vd: Patrick O&apos;Brien) để kiểm tra kết quả học tập.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  aria-label="Tìm kiếm sinh viên"
                  className="min-w-[200px] flex-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-slate-900"
                />
                <button
                  type="button"
                  onClick={() => executePortalAction("search", searchInput)}
                  className="cursor-pointer rounded-lg bg-[#005F37] px-4 py-1.5 font-semibold text-white hover:bg-[#004a2b]"
                >
                  Tra cứu
                </button>
              </div>

              {browserState?.sqlError && (
                <div className="rounded-lg border border-rose-300 bg-rose-50 p-3 font-mono text-[11px] text-rose-800">
                  {browserState.sqlError}
                </div>
              )}

              {browserState?.leakedRows && (
                <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 font-mono text-[11px] text-slate-800">
                  <div className="mb-1 font-sans text-xs font-bold text-slate-900">
                    Kết quả truy vấn bổ sung từ CSDL:
                  </div>
                  {browserState.leakedRows.map((r) => (
                    <div key={r}>{r}</div>
                  ))}
                </div>
              )}

              <div className="overflow-x-auto rounded-lg border border-[#E6EFEB]">
                <table className="w-full text-left">
                  <thead className="bg-[#F2F9F6] text-[#005F37]">
                    <tr>
                      <th className="px-3 py-2">Mã SV</th>
                      <th className="px-3 py-2">Họ và tên</th>
                      <th className="px-3 py-2">Lớp</th>
                      <th className="px-3 py-2">GPA</th>
                      <th className="px-3 py-2">Học phần</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(browserState?.students ?? STUDENTS).map((st) => (
                      <tr
                        key={st.masv}
                        className={
                          st.masv === "SV002" && /o'brien/i.test(searchInput)
                            ? "bg-emerald-50 font-semibold"
                            : ""
                        }
                      >
                        <td className="px-3 py-2 font-mono font-semibold text-[#005F37]">{st.masv}</td>
                        <td className="px-3 py-2">{st.fullname}</td>
                        <td className="px-3 py-2">{st.className}</td>
                        <td className="px-3 py-2 font-mono font-bold text-[#005F37]">{st.gpa}</td>
                        <td className="px-3 py-2 text-slate-600">{st.note}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* FUNCTIONAL PAGE: LOGIN PORTAL */}
          {page === "login" && (
            <div className="bg-white p-4 text-xs">
              {browserState?.authenticatedUser ? (
                <div className="mx-auto max-w-lg rounded-xl border border-[#E6EFEB] bg-[#F2F9F6] p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-emerald-900/10 pb-2">
                    <div>
                      <div className="font-bold text-[#005F37] text-sm">
                        Xin chào, {browserState.authenticatedUser.role === "admin" ? "Quản trị viên Đào tạo (admin)" : "Sinh viên Nguyen Van An (sv001)"}
                      </div>
                      <div className="text-[11px] text-slate-600">
                        {browserState.authenticatedUser.role === "admin"
                          ? "Quyền hạn: Toàn quyền quản trị bảng điểm & tài khoản toàn trường"
                          : "Quyền hạn: Xem bảng điểm cá nhân Lớp D22CNTT01"}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setBrowserState(null)}
                      className="cursor-pointer rounded border border-slate-300 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700"
                    >
                      Đăng xuất
                    </button>
                  </div>
                  {browserState.authenticatedUser.role === "admin" && (
                    <div className="rounded-lg border border-amber-300 bg-white p-3 text-[11px] text-slate-700">
                      <strong>Bảng điều khiển Giảng viên:</strong> Đang hiển thị 5 hồ sơ điểm lớp D22CNTT01–02 (cho phép cập nhật GPA &amp; xuất danh sách).
                    </div>
                  )}
                </div>
              ) : (
                <div className="mx-auto max-w-md space-y-3 rounded-xl border border-[#E6EFEB] bg-[#F2F9F6] p-4">
                  <h3 className="border-l-4 border-amber-400 pl-2.5 text-sm font-bold text-[#005F37]">
                    Đăng nhập Cổng Đào tạo
                  </h3>
                  <div className="space-y-2">
                    <div>
                      <label className="mb-1 block text-[11px] font-medium text-slate-600">
                        Tên đăng nhập / Mã học viên
                      </label>
                      <input
                        type="text"
                        value={loginUser}
                        onChange={(e) => setLoginUser(e.target.value)}
                        aria-label="Username Portal"
                        className="w-full rounded-md border border-slate-300 bg-white px-3 py-1.5"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-[11px] font-medium text-slate-600">
                        Mật khẩu
                      </label>
                      <input
                        type="password"
                        value={loginPass}
                        onChange={(e) => setLoginPass(e.target.value)}
                        aria-label="Password Portal"
                        className="w-full rounded-md border border-slate-300 bg-white px-3 py-1.5"
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => executePortalAction("login", loginUser, loginPass)}
                    className="w-full cursor-pointer rounded-md bg-[#005F37] px-3.5 py-2 font-semibold text-white hover:bg-[#004a2b]"
                  >
                    Đăng nhập
                  </button>
                  {browserState?.loginError && (
                    <div className="rounded-md border border-rose-300 bg-rose-50 p-2.5 text-[11px] text-rose-800">
                      {browserState.loginError}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* FUNCTIONAL PAGE: ACADEMIC Q&A / COMMENTS */}
          {page === "comments" && (
            <div className="space-y-3 bg-white p-4 text-xs">
              <h3 className="border-l-4 border-amber-400 pl-2.5 text-sm font-bold text-[#005F37]">
                Kênh Hỏi đáp Giáo vụ &amp; Thảo luận Học phần
              </h3>
              <div className="flex flex-wrap gap-2">
                <input
                  type="text"
                  value={commentAuthor}
                  onChange={(e) => setCommentAuthor(e.target.value)}
                  aria-label="Họ tên sinh viên"
                  className="w-36 rounded-md border border-slate-300 px-2.5 py-1.5"
                />
                <input
                  type="text"
                  value={commentMsg}
                  onChange={(e) => setCommentMsg(e.target.value)}
                  aria-label="Nội dung câu hỏi"
                  className="min-w-[200px] flex-1 rounded-md border border-slate-300 px-2.5 py-1.5"
                />
                <button
                  type="button"
                  onClick={() => executePortalAction("comments", commentMsg)}
                  className="cursor-pointer rounded-md bg-[#005F37] px-3.5 py-1.5 font-semibold text-white hover:bg-[#004a2b]"
                >
                  Gửi câu hỏi
                </button>
              </div>
              {browserState?.commentPreview && (
                <div className="space-y-2 rounded-lg border border-[#E6EFEB] bg-[#F2F9F6] p-3">
                  {browserState.commentPreview.xssAlert && (
                    <div className="rounded-md border border-slate-400 bg-white p-2.5 text-[11px] text-slate-900 shadow-sm">
                      <div className="font-bold text-slate-700">127.0.0.1:8080 says</div>
                      <div className="mt-1 font-mono">1</div>
                    </div>
                  )}
                  <div>
                    <strong className="text-[#005F37]">{browserState.commentPreview.author}:</strong>{" "}
                    <span className="text-slate-800">{browserState.commentPreview.content}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* FUNCTIONAL PAGE: ACADEMIC DOCUMENTS DOWNLOAD */}
          {page === "download" && (
            <div className="space-y-3 bg-white p-4 text-xs">
              <h3 className="border-l-4 border-amber-400 pl-2.5 text-sm font-bold text-[#005F37]">
                Kho Biểu mẫu &amp; Quy chế Đào tạo
              </h3>
              <div className="grid gap-2 sm:grid-cols-2">
                {[
                  { file: "Quy_che_Dao_tao_2026.pdf", label: "Quy chế Đào tạo Chính quy 2026 (PDF)" },
                  { file: "Huong_dan_Tra_cuu_Diem.txt", label: "Hướng dẫn Tra cứu & Phúc khảo Điểm (TXT)" },
                ].map((doc) => (
                  <button
                    key={doc.file}
                    type="button"
                    onClick={() => {
                      setDownloadFile(doc.file);
                      executePortalAction("download", doc.file);
                    }}
                    className="flex cursor-pointer items-center justify-between rounded-lg border border-[#E6EFEB] bg-[#F2F9F6] px-3 py-2.5 text-left hover:border-[#005F37]/40"
                  >
                    <span className="font-medium text-[#005F37]">{doc.label}</span>
                    <Download className="h-4 w-4 text-[#005F37]" aria-hidden="true" />
                  </button>
                ))}
              </div>
              {browserState?.downloadText && (
                <div className="space-y-1.5">
                  <div className="font-mono text-[11px] font-semibold text-slate-500">
                    Tệp đang xem: {downloadFile}
                  </div>
                  <pre className="whitespace-pre-wrap rounded-lg border border-slate-200 bg-slate-50 p-3 font-mono text-[11px] text-slate-800">
                    {browserState.downloadText}
                  </pre>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* CLEAN MTA FOOTER (Zero Security Branding) */}
      <footer className="bg-[#005F37] px-4 py-4 text-[11px] text-emerald-100">
        <div className="grid gap-3 sm:grid-cols-12">
          <div className="sm:col-span-5 space-y-1.5">
            <div className="flex items-center gap-2">
              <MtaCrest className="h-7 w-7 shrink-0" />
              <span className="font-bold text-white uppercase">
                Học viện Kỹ thuật Quân sự
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px]">
              <Mail className="h-3 w-3 text-amber-300 shrink-0" aria-hidden="true" />
              <span>info@mta.edu.vn</span>
              <span className="mx-1 text-emerald-400/50">·</span>
              <Phone className="h-3 w-3 text-amber-300 shrink-0" aria-hidden="true" />
              <span>Đào tạo: 069.515200</span>
            </div>
          </div>

          <div className="sm:col-span-4 space-y-1 text-[10px]">
            <div className="font-bold text-amber-300 uppercase">Địa chỉ Cơ sở</div>
            <div className="flex items-start gap-1">
              <MapPin className="mt-0.5 h-3 w-3 shrink-0 text-amber-300" aria-hidden="true" />
              <span>CS1: 236 Hoàng Quốc Việt, Cổ Nhuế 1, Bắc Từ Liêm, Hà Nội</span>
            </div>
            <div className="flex items-start gap-1">
              <MapPin className="mt-0.5 h-3 w-3 shrink-0 text-amber-300" aria-hidden="true" />
              <span>CS2: 125 Vĩnh Phúc, Ba Đình, Hà Nội</span>
            </div>
          </div>

          <div className="sm:col-span-3 space-y-1 text-[10px]">
            <div className="font-bold text-amber-300 uppercase">Liên kết Đào tạo</div>
            <div className="flex flex-wrap gap-x-2 gap-y-0.5 text-emerald-100/90">
              <span>Học viện KTMM</span>
              <span>· Bách khoa HN</span>
              <span>· UET ĐHQGHN</span>
            </div>
            <div className="pt-1 text-[9px] text-emerald-200/70">
              © 2026 Copyright by Military Technical Academy
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
