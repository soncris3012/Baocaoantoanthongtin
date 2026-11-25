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
  Globe,
  GraduationCap,
  Home,
  Lock,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Search,
  ShieldAlert,
  ShieldCheck,
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

interface StudentRow {
  masv: string;
  fullname: string;
  className: string;
  gpa: number;
  note: string;
}

const STUDENTS: StudentRow[] = [
  { masv: "SV001", fullname: "Nguyen Van An", className: "D22AT19A", gpa: 8.8, note: "An toan mang" },
  { masv: "SV002", fullname: "Patrick O'Brien", className: "D22AT19A", gpa: 9.1, note: "Bao mat Web" },
  { masv: "SV003", fullname: "Marco D'Angelo", className: "D22AT19B", gpa: 8.4, note: "Mat ma hoc" },
  { masv: "SV004", fullname: "Tran Thi Binh", className: "D22AT19B", gpa: 7.9, note: "He dieu hanh" },
  { masv: "SV005", fullname: "Le Minh Khanh", className: "D22AT19A", gpa: 9.4, note: "Kiem thu xam nhap" },
];

const ANNOUNCEMENTS = [
  {
    day: "25/11",
    year: "2026",
    title: "Lịch thi kết thúc học phần Học kỳ I — Khối ngành An toàn Thông tin",
    tag: "Đào tạo",
  },
  {
    day: "18/11",
    year: "2026",
    title: "Hướng dẫn sinh viên tra cứu bảng điểm tích lũy và phúc khảo trực tuyến",
    tag: "Khảo thí",
  },
  {
    day: "30/10",
    year: "2026",
    title: "Triển khai lớp bảo vệ Reverse Proxy Mini-WAF trên Cổng Sinh viên",
    tag: "Hệ thống",
  },
];

interface PortalResponseState {
  url: string;
  status: number;
  blockedByWaf: boolean;
  ruleIds: string[];
  score: number;
  students?: StudentRow[];
  leakedRows?: string[];
  sqlError?: string;
  loginMessage?: string;
  commentPreview?: { author: string; content: string; xssAlert: boolean; escaped: boolean };
  downloadText?: string;
}

interface StudentPortalEmulatorProps {
  wafMode: WafMode;
  portalMode: PortalSecurityMode;
  ipBanned?: boolean;
  externalCommand?: PortalDriverCommand | null;
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
}: StudentPortalEmulatorProps) {
  const [page, setPage] = useState<PortalPageId>("home");
  const [showHeaders, setShowHeaders] = useState(false);

  const [heroQuery, setHeroQuery] = useState("");
  const [searchInput, setSearchInput] = useState("SV001");
  const [loginUser, setLoginUser] = useState("sv001");
  const [loginPass, setLoginPass] = useState("student123");
  const [commentAuthor, setCommentAuthor] = useState("Nguyen Van An");
  const [commentMsg, setCommentMsg] = useState("5 < 10 và GPA học kỳ >= 8.0");
  const [downloadFile, setDownloadFile] = useState("tailieu.pdf");

  const [browserState, setBrowserState] = useState<PortalResponseState | null>(null);

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

    if (wafMode !== "OFF" && ipBanned) {
      setBrowserState({
        url: `http://127.0.0.1:8080${pathMap[targetPage]}`,
        status: 403,
        blockedByWaf: true,
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
        url:
          targetPage === "login"
            ? "http://127.0.0.1:8080/login"
            : `http://127.0.0.1:8080${pathMap[targetPage]}?${
                targetPage === "search"
                  ? "q"
                  : targetPage === "comments"
                  ? "msg"
                  : "file"
              }=${rawVal}`,
        status: 403,
        blockedByWaf: true,
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
          sqlError:
            rawVal.trim() === "'"
              ? "SQLite Error: near \"'\": syntax error (Lộ cấu trúc truy vấn!)"
              : undefined,
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
          loginMessage:
            "ĐĂNG NHẬP THÀNH CÔNG QUYỀN GIẢNG VIÊN/ADMIN (Bypass SQLi vì VULNERABLE nối chuỗi SQL!)",
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

    const isTraversal = /\.\.\/|\.\.\\|\/etc\/passwd/i.test(rawVal);
    if (isTraversal) {
      if (portalMode === "HARDENED") {
        setBrowserState({
          url: `http://127.0.0.1:8080/download?file=${rawVal}`,
          status: 400,
          blockedByWaf: false,
          ruleIds: decision.ruleIds,
          score: decision.score,
          downloadText:
            "HTTP 400 Invalid file path — os.path.realpath() sandbox đã chặn leo thư mục!",
        });
      } else {
        setBrowserState({
          url: `http://127.0.0.1:8080/download?file=${rawVal}`,
          status: 200,
          blockedByWaf: false,
          ruleIds: decision.ruleIds,
          score: decision.score,
          downloadText:
            "root:x:0:0:root:/root:/bin/bash\nwww-data:x:33:33:www-data:/var/www:/usr/sbin/nologin\n(LỘ NỘI DUNG /etc/passwd DO CHẾ ĐỘ VULNERABLE!)",
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
          ? "Quy chế & Hướng dẫn tra cứu điểm học phần — Học viện Kỹ thuật Quân sự."
          : "%PDF-1.4\n% Đề cương & Tài liệu Học phần An toàn Hệ thống Thông tin - MTA",
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
      : `http://127.0.0.1:8080/${page}${page === "search" ? `?q=${searchInput}` : ""}`);

  const navTo = (target: PortalPageId) => {
    setPage(target);
    setBrowserState(null);
  };

  return (
    <div className="overflow-hidden rounded-xl border border-slate-300 bg-white text-slate-800 shadow-md dark:border-zinc-700">
      {/* Browser Address & Security Telemetry Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-slate-100 px-3 py-2 text-xs">
        <div className="flex items-center gap-2">
          <WindowControls onClose={() => navTo("home")} closeTitle="Về Trang chủ Portal" />
          <span className="inline-flex items-center gap-1 font-semibold text-[#005F37]">
            <Globe className="h-3.5 w-3.5" aria-hidden="true" />
            MTA Portal
          </span>
        </div>

        <div className="flex min-w-[180px] flex-1 items-center gap-1.5 rounded-md border border-slate-300 bg-white px-2.5 py-1 font-mono text-[11px] text-slate-700">
          <Lock className="h-3 w-3 shrink-0 text-[#005F37]" aria-hidden="true" />
          <span className="truncate">{currentUrl}</span>
        </div>

        <div className="flex flex-wrap items-center gap-1 font-mono text-[10px] font-bold">
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
                ? "bg-teal-100 text-teal-800"
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
        <div className="border-b border-slate-800 bg-[#0d1117] px-4 py-2 font-mono text-[11px] text-emerald-300">
          {wafMode === "OFF" ? (
            <div className="text-rose-300">
              HTTP/1.1 {browserState?.status ?? 200} · Server: StudentPortal-Apache-Dev/2.4.25 · X-Powered-By: Python-Legacy/3.11 · Set-Cookie: mta_session=demo-token (Thiếu HttpOnly!)
            </div>
          ) : (
            <div>
              HTTP/1.1 {browserState?.status ?? 200} · [Server header stripped] · X-Content-Type-Options: nosniff · X-Frame-Options: DENY · Set-Cookie: mta_session=...; HttpOnly; SameSite=Lax
            </div>
          )}
        </div>
      )}

      {/* MTA TOP UTILITY BAR */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-[#004528] px-4 py-1.5 text-[11px] text-emerald-100">
        <div className="flex items-center gap-2.5">
          <span className="font-medium text-white">Welcome to MTA</span>
          <span className="text-emerald-400/50">|</span>
          <span className="hidden sm:inline">Cổng Đào tạo &amp; An toàn Thông tin</span>
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
                MILITARY TECHNICAL ACADEMY · CỔNG SINH VIÊN
              </div>
            </div>
          </button>

          <nav className="flex flex-wrap items-center gap-1 text-[11px] font-semibold">
            {[
              { id: "home" as const, label: "Trang chủ", Icon: Home },
              { id: "search" as const, label: "Đào tạo & Bảng điểm", Icon: Search },
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

      {/* GLOBAL WAF BLOCK SCREEN (OVERRIDES CONTENT WHEN INTERCEPTED BY MINI-WAF) */}
      {browserState?.blockedByWaf ? (
        <div className="bg-slate-50 p-5">
          <div className="mx-auto max-w-2xl rounded-xl border-2 border-rose-500 bg-[#0b1628] p-5 text-white shadow-lg space-y-3">
            <div className="flex items-center gap-2.5 text-base font-bold text-rose-400">
              <ShieldAlert className="h-6 w-6 shrink-0" aria-hidden="true" />
              403 Forbidden — Hệ thống Tường lửa Mini-WAF Học viện đã chặn truy cập
            </div>
            <p className="text-xs leading-relaxed text-slate-300">
              Lưu lượng tới Cổng Thông tin Học viện (<code className="text-amber-300">{currentUrl}</code>) đã bị ngắt ngay tại Reverse Proxy <code className="text-amber-300">:8080</code> trước khi chạm tới máy chủ nội bộ (<code className="text-emerald-300">:8000 internal</code>).
            </p>
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-slate-900/90 px-3 py-2 font-mono text-[11px] text-amber-300">
              <span>Rule IDs: [{browserState.ruleIds.join(", ")}] · Score: {browserState.score}</span>
              <button
                type="button"
                onClick={() => setBrowserState(null)}
                className="cursor-pointer rounded bg-white/10 px-2.5 py-1 text-white hover:bg-white/20"
              >
                Quay lại giao diện Portal
              </button>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* HERO CAROUSEL BANNER (FULL HERO ON HOME, SLIM BANNER ON SUBPAGES) */}
          {page === "home" ? (
            <div className="relative overflow-hidden bg-gradient-to-br from-[#004b2b] via-[#065f46] to-[#132a46] px-5 py-7 text-white">
              {/* Subtle Dong Son concentric motif */}
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
                  Cổng thông tin tổng hợp Học viện Kỹ thuật Quân sự: tra cứu bảng điểm học phần, quản lý tài khoản giảng viên/học viên, hỏi đáp học thuật và kho giáo trình chuyên ngành An toàn Thông tin.
                </p>

                {/* Quick Portal Search Bar directly inside Hero */}
                <div className="flex flex-wrap gap-2 pt-1">
                  <input
                    type="text"
                    value={heroQuery}
                    onChange={(e) => setHeroQuery(e.target.value)}
                    placeholder="Tra cứu nhanh Mã SV hoặc Họ tên (vd: SV001, O'Brien)..."
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
                    Đăng nhập Portal
                    <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-900/10 bg-[#F2F9F6] px-4 py-2 text-[11px]">
              <div className="flex items-center gap-1.5 font-medium text-[#005F37]">
                <button
                  type="button"
                  onClick={() => navTo("home")}
                  className="cursor-pointer hover:underline"
                >
                  Trang chủ MTA
                </button>
                <ChevronRight className="h-3 w-3 text-slate-400" aria-hidden="true" />
                <span className="font-bold">
                  {page === "search"
                    ? "Cổng Đào tạo & Tra cứu Bảng điểm"
                    : page === "login"
                    ? "Đăng nhập Học viên / Giảng viên"
                    : page === "comments"
                    ? "Kênh Hỏi đáp & Góp ý Học phần"
                    : "Kho Biểu mẫu & Đề cương Tài liệu"}
                </span>
              </div>
              <span className="font-mono text-[10px] text-slate-500">
                Upstream Node: target_web (:8000)
              </span>
            </div>
          )}

          {/* MAIN PORTAL BODY */}
          {page === "home" && (
            <div className="space-y-6 bg-white p-4 sm:p-5 text-xs">
              {/* 3 QUICK-ACCESS PORTAL CARDS (Styled after mta.edu.vn #F2F9F6 + #FFEED0) */}
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
                    desc: "Tải đề cương PDF, quy chế đào tạo & trao đổi môn học",
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
                    className="group relative flex cursor-pointer items-start gap-3 overflow-hidden rounded-xl border border-[#E6EFEB] bg-[#F2F9F6] p-3.5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-[#005F37]/40 hover:shadow-sm"
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

              {/* NEWS + ANNOUNCEMENTS GRID (2-column MTA asymmetric style) */}
              <div className="grid gap-4 md:grid-cols-12">
                {/* Left 6 cols: Featured News */}
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
                      Thảo luận thêm
                      <ChevronRight className="h-3 w-3" aria-hidden="true" />
                    </button>
                  </div>
                  <div className="overflow-hidden rounded-xl border border-[#E6EFEB] bg-white shadow-xs">
                    <div className="bg-gradient-to-r from-[#005F37] to-[#0b3b2e] px-3.5 py-2.5 text-white">
                      <span className="rounded bg-amber-400 px-1.5 py-0.5 text-[10px] font-bold text-[#003d22]">
                        ĐÀO TẠO &amp; ANTT
                      </span>
                      <div className="mt-1.5 font-bold leading-snug">
                        Khoa Công nghệ Thông tin hoàn thiện mô hình Phòng thủ Chủ động cho Cổng Quản lý Điểm Sinh viên
                      </div>
                    </div>
                    <div className="p-3 text-[11px] leading-relaxed text-slate-600 space-y-2">
                      <p>
                        Hệ thống hỗ trợ chuyển đổi linh hoạt giữa chế độ thực hành kiểm thử lỗ hổng và chế độ phòng thủ chiều sâu kết hợp Reverse Proxy Mini-WAF, giúp giảng viên và sinh viên thực nghiệm trực quan trên dữ liệu thực tế.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setPage("search");
                          executePortalAction("search", "");
                        }}
                        className="inline-flex cursor-pointer items-center gap-1 font-semibold text-[#005F37] hover:underline"
                      >
                        Mở bảng điểm lớp D22AT19A ▶
                      </button>
                    </div>
                  </div>
                </div>

                {/* Right 6 cols: Announcements with Shield Date Badges */}
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
                            Mục: {item.tag} · Xem tài liệu đính kèm
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* SCIENTIFIC RESEARCH NAVY SECTION + IMPRESSIVE NUMBERS */}
              <div className="grid gap-3 sm:grid-cols-12">
                <div className="sm:col-span-6 rounded-xl bg-[#0a1d35] p-4 text-white space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-amber-400 uppercase">
                      <Cpu className="h-3.5 w-3.5" aria-hidden="true" />
                      Nghiên cứu Khoa học
                    </span>
                    <span className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-[10px] text-emerald-300">
                      LAB ATTT
                    </span>
                  </div>
                  <div className="font-bold text-white">
                    Nghiên cứu Chuẩn hóa URL Đa lớp &amp; Phân tích Từ vựng SQL Chống Né lọc
                  </div>
                  <p className="text-[11px] leading-relaxed text-slate-300">
                    Đạt Precision 100%, Recall 100%, FPR 0% trên 100 mẫu đối chứng với độ trễ phụ trội chỉ +0.709 ms trung bình.
                  </p>
                </div>

                <div className="sm:col-span-6 rounded-xl bg-gradient-to-r from-[#5a1f18] to-[#7c2d12] p-4 text-white">
                  <div className="mb-2.5 border-b border-white/20 pb-1 text-center text-[11px] font-bold uppercase tracking-wider">
                    Những con số ấn tượng
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-center">
                    {[
                      { num: "3", label: "Top ĐH KTQS", Icon: Award },
                      { num: "13+", label: "Bộ Test E2E", Icon: ShieldCheck },
                      { num: "100+", label: "Mẫu Chuẩn", Icon: BookOpen },
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

          {/* FUNCTIONAL SUBPAGE: /search */}
          {page === "search" && (
            <div className="space-y-3.5 bg-white p-4 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2 border-l-4 border-amber-400 pl-2.5">
                <div>
                  <h3 className="text-sm font-bold text-[#005F37]">
                    Tra cứu Điểm Học phần &amp; Hồ sơ Sinh viên (/search)
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Hỗ trợ tìm theo Mã SV, Họ tên (kể cả O&apos;Brien / D&apos;Angelo) hoặc kiểm chứng SQL Injection.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  aria-label="Tìm kiếm sinh viên trên Website"
                  className="min-w-[200px] flex-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 font-mono text-slate-900"
                />
                <button
                  type="button"
                  onClick={() => executePortalAction("search", searchInput)}
                  className="cursor-pointer rounded-lg bg-[#005F37] px-4 py-1.5 font-semibold text-white hover:bg-[#004a2b]"
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
                    className="cursor-pointer rounded-md border border-[#E6EFEB] bg-[#F2F9F6] px-2 py-0.5 text-[#005F37] hover:bg-emerald-100"
                  >
                    {chip.label}
                  </button>
                ))}
              </div>

              {browserState?.sqlError && (
                <div className="rounded-lg border border-amber-400 bg-amber-50 p-2.5 font-mono text-[11px] text-amber-900">
                  {browserState.sqlError}
                </div>
              )}

              {browserState?.leakedRows && (
                <div className="rounded-lg border border-rose-500 bg-rose-50 p-3 font-mono text-[11px] text-rose-900">
                  <div className="font-bold">
                    [CẢNH BÁO RÒ RỈ CSDL] Khai thác SQLi thành công do WAF OFF &amp; Portal VULNERABLE:
                  </div>
                  {browserState.leakedRows.map((r) => (
                    <div key={r} className="mt-0.5">{r}</div>
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
                      <th className="px-3 py-2">Học phần trọng tâm</th>
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

          {/* FUNCTIONAL SUBPAGE: /login */}
          {page === "login" && (
            <div className="bg-white p-4 text-xs">
              <div className="mx-auto max-w-md space-y-3 rounded-xl border border-[#E6EFEB] bg-[#F2F9F6] p-4">
                <h3 className="border-l-4 border-amber-400 pl-2.5 text-sm font-bold text-[#005F37]">
                  Đăng nhập Cổng Đào tạo Sinh viên / Giảng viên (/login)
                </h3>
                <div className="grid gap-2 sm:grid-cols-2">
                  <input
                    type="text"
                    value={loginUser}
                    onChange={(e) => setLoginUser(e.target.value)}
                    aria-label="Username Portal"
                    className="rounded-md border border-slate-300 bg-white px-2.5 py-1.5 font-mono"
                  />
                  <input
                    type="text"
                    value={loginPass}
                    onChange={(e) => setLoginPass(e.target.value)}
                    aria-label="Password Portal"
                    className="rounded-md border border-slate-300 bg-white px-2.5 py-1.5 font-mono"
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => executePortalAction("login", loginUser, loginPass)}
                    className="cursor-pointer rounded-md bg-[#005F37] px-3.5 py-1.5 font-semibold text-white hover:bg-[#004a2b]"
                  >
                    Đăng nhập
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setLoginUser("admin' OR '1'='1'--");
                      executePortalAction("login", "admin' OR '1'='1'--", "x");
                    }}
                    className="cursor-pointer rounded-md border border-[#E6EFEB] bg-white px-2.5 py-1.5 font-mono text-[#005F37]"
                  >
                    admin&apos; OR &apos;1&apos;=&apos;1&apos;--
                  </button>
                </div>
                {browserState?.loginMessage && (
                  <div
                    className={`rounded-md border p-2.5 font-mono text-[11px] ${
                      browserState.status === 200
                        ? browserState.loginMessage.includes("Bypass SQLi")
                          ? "border-rose-400 bg-rose-50 text-rose-900"
                          : "border-emerald-400 bg-emerald-50 text-emerald-900"
                        : "border-amber-300 bg-amber-50 text-amber-900"
                    }`}
                  >
                    {browserState.loginMessage}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* FUNCTIONAL SUBPAGE: /comments */}
          {page === "comments" && (
            <div className="space-y-3 bg-white p-4 text-xs">
              <h3 className="border-l-4 border-amber-400 pl-2.5 text-sm font-bold text-[#005F37]">
                Kênh Hỏi đáp &amp; Phản hồi Học phần (/comments)
              </h3>
              <div className="flex flex-wrap gap-2">
                <input
                  type="text"
                  value={commentAuthor}
                  onChange={(e) => setCommentAuthor(e.target.value)}
                  aria-label="Tác giả bình luận"
                  className="w-32 rounded-md border border-slate-300 px-2.5 py-1.5"
                />
                <input
                  type="text"
                  value={commentMsg}
                  onChange={(e) => setCommentMsg(e.target.value)}
                  aria-label="Nội dung bình luận"
                  className="min-w-[200px] flex-1 rounded-md border border-slate-300 px-2.5 py-1.5 font-mono"
                />
                <button
                  type="button"
                  onClick={() => executePortalAction("comments", commentMsg)}
                  className="cursor-pointer rounded-md bg-[#005F37] px-3.5 py-1.5 font-semibold text-white hover:bg-[#004a2b]"
                >
                  Gửi câu hỏi
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5 font-mono text-[11px]">
                {[
                  "5 < 10 và GPA >= 8.0",
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
                    className="cursor-pointer rounded-md border border-[#E6EFEB] bg-[#F2F9F6] px-2 py-0.5 text-[#005F37]"
                  >
                    {s}
                  </button>
                ))}
              </div>
              {browserState?.commentPreview && (
                <div className="rounded-lg border border-[#E6EFEB] bg-[#F2F9F6] p-3">
                  {browserState.commentPreview.xssAlert && (
                    <div className="mb-2 rounded border border-rose-500 bg-rose-100 px-2.5 py-1.5 font-mono font-bold text-rose-800">
                      [XSS EXECUTED!] alert(1) kích hoạt do WAF OFF &amp; không html.escape()!
                    </div>
                  )}
                  {browserState.commentPreview.escaped && (
                    <div className="mb-1 inline-flex items-center gap-1 font-mono text-[11px] font-bold text-[#005F37]">
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

          {/* FUNCTIONAL SUBPAGE: /download */}
          {page === "download" && (
            <div className="space-y-3 bg-white p-4 text-xs">
              <h3 className="border-l-4 border-amber-400 pl-2.5 text-sm font-bold text-[#005F37]">
                Kho Biểu mẫu &amp; Đề cương Học phần (/download)
              </h3>
              <div className="flex flex-wrap gap-2">
                <input
                  type="text"
                  value={downloadFile}
                  onChange={(e) => setDownloadFile(e.target.value)}
                  aria-label="Tên tệp cần tải"
                  className="min-w-[200px] flex-1 rounded-md border border-slate-300 px-2.5 py-1.5 font-mono"
                />
                <button
                  type="button"
                  onClick={() => executePortalAction("download", downloadFile)}
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-md bg-[#005F37] px-3.5 py-1.5 font-semibold text-white hover:bg-[#004a2b]"
                >
                  <Download className="h-3.5 w-3.5" aria-hidden="true" />
                  Tải tài liệu
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5 font-mono text-[11px]">
                {["tailieu.pdf", "huongdan.txt", "../../etc/passwd", "....//....//etc/passwd"].map(
                  (f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => {
                        setDownloadFile(f);
                        executePortalAction("download", f);
                      }}
                      className="cursor-pointer rounded-md border border-[#E6EFEB] bg-[#F2F9F6] px-2 py-0.5 text-[#005F37]"
                    >
                      {f}
                    </button>
                  )
                )}
              </div>
              {browserState?.downloadText && (
                <pre className="whitespace-pre-wrap rounded-lg border border-slate-800 bg-[#0d1117] p-3 font-mono text-[11px] text-emerald-300">
                  {browserState.downloadText}
                </pre>
              )}
            </div>
          )}
        </>
      )}

      {/* MTA MILITARY GREEN FOOTER (#005F37 + Gold Accent + Campuses + Links) */}
      <footer className="relative overflow-hidden bg-[#005F37] px-4 py-4 text-[11px] text-emerald-100">
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
              © Học viện Kỹ thuật Quân sự · Bảo vệ bởi Mini-WAF
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
