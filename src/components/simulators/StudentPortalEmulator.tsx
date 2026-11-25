"use client";

import { useEffect, useRef, useState } from "react";
import {
  BookOpen,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
  GraduationCap,
  Home,
  Lock,
  MessageSquare,
  Search,
  ShieldAlert,
} from "lucide-react";
import { WindowControls } from "@/components/WindowBar";
import {
  PORTAL_CLASS_SUMMARIES,
  PORTAL_STUDENTS,
  type PortalStudentRow,
} from "@/data/studentPortalDataset";
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

interface PortalResponseState {
  url: string;
  status: number;
  blockedByWaf: boolean;
  incidentId?: string;
  students?: PortalStudentRow[];
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

function MtaCrest({ className = "h-9 w-9" }: { className?: string }) {
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

const ANNOUNCEMENTS = [
  { day: "25/11", title: "Kế hoạch thi kết thúc học phần Học kỳ I" },
  { day: "18/11", title: "Rà soát điểm tích lũy và đăng ký phúc khảo" },
  { day: "30/10", title: "Lịch bảo vệ đồ án Khoa Công nghệ Thông tin" },
];

export function StudentPortalEmulator({
  wafMode,
  portalMode,
  ipBanned = false,
  externalCommand,
  onExchange,
}: StudentPortalEmulatorProps) {
  const [page, setPage] = useState<PortalPageId>("home");

  const [heroQuery, setHeroQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [selectedClass, setSelectedClass] = useState<string>("ALL");
  const [pageNum, setPageNum] = useState<number>(1);
  const [loginUser, setLoginUser] = useState("sv001");
  const [loginPass, setLoginPass] = useState("student123");
  const [commentAuthor, setCommentAuthor] = useState("Nguyen Van An");
  const [commentMsg, setCommentMsg] = useState("");
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
      setPageNum(1);
      const hasSqliAttack =
        /('|\bor\b|\bunion\b|\bselect\b)/i.test(rawVal) &&
        !/^(patrick )?o'brien$|^(marco )?d'angelo$/i.test(rawVal.trim());
      if (hasSqliAttack && portalMode === "VULNERABLE") {
        setBrowserState({
          url: fullUrl,
          status: rawVal.trim() === "'" ? 500 : 200,
          blockedByWaf: false,
          students: PORTAL_STUDENTS,
          leakedRows: [
            "admin | portal_admin_2026 | lecturer",
            "sv001 | student123 | student",
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
      const matched = PORTAL_STUDENTS.filter(
        (s) =>
          !qLow ||
          s.masv.toLowerCase().includes(qLow) ||
          s.fullname.toLowerCase().includes(qLow) ||
          s.className.toLowerCase().includes(qLow) ||
          s.note.toLowerCase().includes(qLow)
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
          status === 401 ? "Sai tên đăng nhập hoặc mật khẩu." : undefined,
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
            ? "HTTP 400 Bad Request"
            : "root:x:0:0:root:/root:/bin/bash\nwww-data:x:33:33:www-data:/var/www:/usr/sbin/nologin\npostgres:x:108:114:PostgreSQL administrator:/var/lib/postgresql:/bin/bash",
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
          ? "HƯỚNG DẪN TRA CỨU ĐIỂM HỌC PHẦN\n1. Đăng nhập tài khoản sinh viên hoặc tra cứu theo Mã SV.\n2. Mọi thắc mắc phúc khảo gửi Phòng Đào tạo trong 7 ngày."
          : "%PDF-1.4\n% QUY CHẾ ĐÀO TẠO ĐẠI HỌC CHÍNH QUY 2026\n% Học viện Kỹ thuật Quân sự",
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
    <div className="overflow-hidden rounded-xl border border-slate-300 bg-white text-slate-800 shadow-sm dark:border-zinc-700">
      {/* Browser Address Bar */}
      <div className="flex flex-wrap items-center gap-2.5 border-b border-slate-200 bg-slate-100 px-3 py-2 text-xs">
        <WindowControls onClose={() => navTo("home")} closeTitle="Trang chủ" />
        <div className="flex min-w-[200px] flex-1 items-center gap-1.5 rounded-full border border-slate-300 bg-white px-3 py-1 font-mono text-[11px] text-slate-700">
          <Lock className="h-3 w-3 shrink-0 text-[#005F37]" aria-hidden="true" />
          <span className="truncate">{currentUrl}</span>
        </div>
      </div>

      {/* Header */}
      <div className="bg-[#005F37] px-4 py-2.5 text-white">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => navTo("home")}
            className="flex cursor-pointer items-center gap-2.5 text-left"
          >
            <MtaCrest className="h-9 w-9 shrink-0" />
            <div>
              <div className="text-xs font-extrabold tracking-wide text-white sm:text-sm">
                HỌC VIỆN KỸ THUẬT QUÂN SỰ
              </div>
              <div className="text-[10px] font-bold tracking-widest text-amber-400 uppercase">
                CỔNG THÔNG TIN ĐÀO TẠO
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

      {browserState?.blockedByWaf ? (
        <div className="bg-slate-50 p-5">
          <div className="mx-auto max-w-xl rounded-xl border border-rose-300 bg-white p-5 text-slate-800 space-y-3">
            <div className="flex items-center gap-2 text-base font-bold text-rose-700">
              <ShieldAlert className="h-5 w-5 shrink-0" aria-hidden="true" />
              403 Forbidden
            </div>
            <p className="text-xs text-slate-600">
              Yêu cầu tới <code className="rounded bg-slate-100 px-1 py-0.5 text-slate-800">{currentUrl}</code> đã bị từ chối.
            </p>
            <div className="flex items-center justify-between border-t border-slate-100 pt-2.5 font-mono text-[11px] text-slate-500">
              <span>{browserState.incidentId}</span>
              <button
                type="button"
                onClick={() => setBrowserState(null)}
                className="cursor-pointer rounded bg-[#005F37] px-3 py-1 font-sans font-semibold text-white hover:bg-[#004a2b]"
              >
                Trang chủ
              </button>
            </div>
          </div>
        </div>
      ) : (
        <>
          {page === "home" && (
            <>
              <div className="bg-gradient-to-br from-[#004b2b] via-[#065f46] to-[#132a46] px-5 py-6 text-white">
                <div className="max-w-2xl space-y-3">
                  <h2 className="text-xl font-extrabold tracking-tight text-white sm:text-2xl">
                    Trí tuệ tỏa sáng
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    <input
                      type="text"
                      value={heroQuery}
                      onChange={(e) => setHeroQuery(e.target.value)}
                      placeholder="Mã SV, họ tên hoặc lớp..."
                      className="min-w-[200px] flex-1 rounded-lg border border-white/25 bg-white/95 px-3 py-2 text-xs text-slate-900 placeholder:text-slate-500 focus:outline-none"
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
                  </div>
                </div>
              </div>

              <div className="space-y-5 bg-white p-4 sm:p-5 text-xs">
                <div className="grid gap-3 sm:grid-cols-3">
                  {[
                    {
                      id: "search" as const,
                      title: "Đào tạo & Bảng điểm",
                      Icon: GraduationCap,
                    },
                    {
                      id: "login" as const,
                      title: "Đăng nhập Học viên",
                      Icon: Lock,
                    },
                    {
                      id: "download" as const,
                      title: "Tài liệu Học phần",
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
                      className="flex cursor-pointer items-center gap-3 rounded-xl border border-[#E6EFEB] bg-[#F2F9F6] p-3 text-left transition-colors hover:border-[#005F37]/40"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#FFEED0] text-[#005F37]">
                        <card.Icon className="h-4 w-4" aria-hidden="true" />
                      </div>
                      <span className="font-bold text-[#005F37]">{card.title}</span>
                    </button>
                  ))}
                </div>

                {/* Class Filter Chips (402 records / 22 classes) */}
                <div className="space-y-2 rounded-xl border border-[#E6EFEB] bg-[#F2F9F6] p-3.5">
                  <div className="flex items-center justify-between">
                    <h3 className="border-l-4 border-amber-400 pl-2 text-xs font-bold text-[#005F37] uppercase">
                      Lớp Chuyên ngành ({PORTAL_STUDENTS.length})
                    </h3>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedClass("ALL");
                        setSearchInput("");
                        setPageNum(1);
                        setPage("search");
                        executePortalAction("search", "");
                      }}
                      className="cursor-pointer text-[11px] font-semibold text-[#005F37] hover:underline"
                    >
                      Tất cả ▶
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {PORTAL_CLASS_SUMMARIES.slice(0, 12).map((cls) => (
                      <button
                        key={cls.className}
                        type="button"
                        onClick={() => {
                          setSelectedClass(cls.className);
                          setSearchInput(cls.className);
                          setPageNum(1);
                          setPage("search");
                          executePortalAction("search", cls.className);
                        }}
                        className="cursor-pointer rounded border border-[#E6EFEB] bg-white px-2.5 py-1 text-[11px] font-semibold text-[#005F37] hover:border-[#005F37]"
                      >
                        {cls.className} <span className="font-mono text-slate-500">({cls.count})</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Announcements */}
                <div className="space-y-2">
                  <h3 className="border-l-4 border-amber-400 pl-2 text-xs font-bold text-[#005F37] uppercase">
                    Thông báo đào tạo
                  </h3>
                  <div className="divide-y divide-slate-100 rounded-xl border border-[#E6EFEB]">
                    {ANNOUNCEMENTS.map((item) => (
                      <button
                        key={item.title}
                        type="button"
                        onClick={() => navTo("download")}
                        className="flex w-full cursor-pointer items-center gap-2.5 px-3 py-2 text-left hover:bg-[#F2F9F6]"
                      >
                        <span className="inline-flex items-center gap-1 rounded bg-[#005F37] px-2 py-0.5 font-mono text-[10px] font-bold text-amber-300">
                          <Calendar className="h-3 w-3" aria-hidden="true" />
                          {item.day}
                        </span>
                        <span className="font-medium text-slate-800">{item.title}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {page === "search" && (() => {
            const baseList = browserState?.students ?? PORTAL_STUDENTS;
            const filteredByClass =
              selectedClass === "ALL"
                ? baseList
                : baseList.filter((st) => st.className === selectedClass);
            const pageSize = 12;
            const totalPages = Math.max(1, Math.ceil(filteredByClass.length / pageSize));
            const safePage = Math.min(pageNum, totalPages);
            const sliceRows = filteredByClass.slice((safePage - 1) * pageSize, safePage * pageSize);

            return (
              <div className="space-y-3 bg-white p-4 text-xs">
                <h3 className="border-l-4 border-amber-400 pl-2.5 text-sm font-bold text-[#005F37]">
                  Tra cứu Bảng điểm ({filteredByClass.length})
                </h3>

                <div className="flex flex-wrap gap-2">
                  <input
                    type="text"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    aria-label="Tìm kiếm sinh viên"
                    placeholder="Mã SV, họ tên hoặc lớp..."
                    className="min-w-[200px] flex-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-slate-900"
                  />
                  <select
                    value={selectedClass}
                    onChange={(e) => {
                      setSelectedClass(e.target.value);
                      setPageNum(1);
                    }}
                    aria-label="Lọc theo Lớp"
                    className="rounded-lg border border-slate-300 bg-[#F2F9F6] px-2.5 py-1.5 font-semibold text-[#005F37]"
                  >
                    <option value="ALL">Tất cả lớp ({PORTAL_STUDENTS.length})</option>
                    {PORTAL_CLASS_SUMMARIES.map((c) => (
                      <option key={c.className} value={c.className}>
                        {c.className} ({c.count})
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedClass("ALL");
                      executePortalAction("search", searchInput);
                    }}
                    className="cursor-pointer rounded-lg bg-[#005F37] px-4 py-1.5 font-semibold text-white hover:bg-[#004a2b]"
                  >
                    Tra cứu
                  </button>
                </div>

                {browserState?.sqlError && (
                  <div className="rounded-lg border border-rose-300 bg-rose-50 p-2.5 font-mono text-[11px] text-rose-800">
                    {browserState.sqlError}
                  </div>
                )}

                {browserState?.leakedRows && (
                  <div className="rounded-lg border border-amber-300 bg-amber-50 p-2.5 font-mono text-[11px] text-slate-800">
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
                      {sliceRows.map((st) => (
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
                          <td className="px-3 py-2 font-mono text-[11px] text-slate-700">{st.className}</td>
                          <td className="px-3 py-2 font-mono font-bold text-[#005F37]">{st.gpa}</td>
                          <td className="px-3 py-2 text-slate-600">{st.note}</td>
                        </tr>
                      ))}
                      {sliceRows.length === 0 && (
                        <tr>
                          <td colSpan={5} className="px-3 py-4 text-center text-slate-500">
                            Không có dữ liệu phù hợp.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-600">
                  <span>
                    {filteredByClass.length === 0 ? 0 : (safePage - 1) * pageSize + 1}–{Math.min(safePage * pageSize, filteredByClass.length)} / {filteredByClass.length}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={safePage <= 1}
                      onClick={() => setPageNum((p) => Math.max(1, p - 1))}
                      className="inline-flex cursor-pointer items-center gap-0.5 rounded border border-slate-300 bg-white px-2 py-1 font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" />
                      Trước
                    </button>
                    <span className="font-mono font-semibold text-[#005F37]">
                      {safePage}/{totalPages}
                    </span>
                    <button
                      type="button"
                      disabled={safePage >= totalPages}
                      onClick={() => setPageNum((p) => Math.min(totalPages, p + 1))}
                      className="inline-flex cursor-pointer items-center gap-0.5 rounded border border-slate-300 bg-white px-2 py-1 font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Sau
                      <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })()}

          {page === "login" && (
            <div className="bg-white p-4 text-xs">
              {browserState?.authenticatedUser ? (
                <div className="mx-auto max-w-lg rounded-xl border border-[#E6EFEB] bg-[#F2F9F6] p-4 flex items-center justify-between gap-3">
                  <div className="font-bold text-[#005F37]">
                    {browserState.authenticatedUser.role === "admin"
                      ? `Quản trị Đào tạo (${browserState.authenticatedUser.username}) · ${PORTAL_STUDENTS.length} hồ sơ`
                      : `Sinh viên ${browserState.authenticatedUser.username}`}
                  </div>
                  <button
                    type="button"
                    onClick={() => setBrowserState(null)}
                    className="cursor-pointer rounded border border-slate-300 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700"
                  >
                    Đăng xuất
                  </button>
                </div>
              ) : (
                <div className="mx-auto max-w-md space-y-3 rounded-xl border border-[#E6EFEB] bg-[#F2F9F6] p-4">
                  <h3 className="border-l-4 border-amber-400 pl-2.5 text-sm font-bold text-[#005F37]">
                    Đăng nhập Cổng Đào tạo
                  </h3>
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={loginUser}
                      onChange={(e) => setLoginUser(e.target.value)}
                      placeholder="Tên đăng nhập"
                      aria-label="Username Portal"
                      className="w-full rounded-md border border-slate-300 bg-white px-3 py-1.5"
                    />
                    <input
                      type="password"
                      value={loginPass}
                      onChange={(e) => setLoginPass(e.target.value)}
                      placeholder="Mật khẩu"
                      aria-label="Password Portal"
                      className="w-full rounded-md border border-slate-300 bg-white px-3 py-1.5"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => executePortalAction("login", loginUser, loginPass)}
                    className="w-full cursor-pointer rounded-md bg-[#005F37] px-3.5 py-2 font-semibold text-white hover:bg-[#004a2b]"
                  >
                    Đăng nhập
                  </button>
                  {browserState?.loginError && (
                    <div className="rounded-md border border-rose-300 bg-rose-50 p-2 text-[11px] text-rose-800">
                      {browserState.loginError}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {page === "comments" && (
            <div className="space-y-3 bg-white p-4 text-xs">
              <h3 className="border-l-4 border-amber-400 pl-2.5 text-sm font-bold text-[#005F37]">
                Hỏi đáp Giáo vụ
              </h3>
              <div className="flex flex-wrap gap-2">
                <input
                  type="text"
                  value={commentAuthor}
                  onChange={(e) => setCommentAuthor(e.target.value)}
                  placeholder="Họ tên"
                  aria-label="Họ tên"
                  className="w-36 rounded-md border border-slate-300 px-2.5 py-1.5"
                />
                <input
                  type="text"
                  value={commentMsg}
                  onChange={(e) => setCommentMsg(e.target.value)}
                  placeholder="Nội dung câu hỏi..."
                  aria-label="Nội dung"
                  className="min-w-[200px] flex-1 rounded-md border border-slate-300 px-2.5 py-1.5"
                />
                <button
                  type="button"
                  onClick={() => executePortalAction("comments", commentMsg)}
                  className="cursor-pointer rounded-md bg-[#005F37] px-3.5 py-1.5 font-semibold text-white hover:bg-[#004a2b]"
                >
                  Gửi
                </button>
              </div>
              {browserState?.commentPreview && (
                <div className="space-y-2 rounded-lg border border-[#E6EFEB] bg-[#F2F9F6] p-3">
                  {browserState.commentPreview.xssAlert && (
                    <div className="rounded border border-slate-400 bg-white p-2 text-[11px] text-slate-900 shadow-sm">
                      <div className="font-bold">127.0.0.1:8080 says</div>
                      <div className="mt-0.5 font-mono">1</div>
                    </div>
                  )}
                  <div>
                    <strong className="text-[#005F37]">{browserState.commentPreview.author}:</strong>{" "}
                    <span>{browserState.commentPreview.content}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {page === "download" && (
            <div className="space-y-3 bg-white p-4 text-xs">
              <h3 className="border-l-4 border-amber-400 pl-2.5 text-sm font-bold text-[#005F37]">
                Kho Tài liệu
              </h3>
              <div className="grid gap-2 sm:grid-cols-2">
                {[
                  { file: "Quy_che_Dao_tao_2026.pdf", label: "Quy chế Đào tạo 2026 (PDF)" },
                  { file: "Huong_dan_Tra_cuu_Diem.txt", label: "Hướng dẫn Tra cứu Điểm (TXT)" },
                ].map((doc) => (
                  <button
                    key={doc.file}
                    type="button"
                    onClick={() => {
                      setDownloadFile(doc.file);
                      executePortalAction("download", doc.file);
                    }}
                    className="flex cursor-pointer items-center justify-between rounded-lg border border-[#E6EFEB] bg-[#F2F9F6] px-3 py-2 text-left hover:border-[#005F37]/40"
                  >
                    <span className="font-medium text-[#005F37]">{doc.label}</span>
                    <Download className="h-4 w-4 text-[#005F37]" aria-hidden="true" />
                  </button>
                ))}
              </div>
              {browserState?.downloadText && (
                <div className="space-y-1">
                  <div className="font-mono text-[11px] text-slate-500">{downloadFile}</div>
                  <pre className="whitespace-pre-wrap rounded-lg border border-slate-200 bg-slate-50 p-3 font-mono text-[11px] text-slate-800">
                    {browserState.downloadText}
                  </pre>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Minimal Footer */}
      <footer className="flex flex-wrap items-center justify-between gap-2 bg-[#005F37] px-4 py-2.5 text-[11px] text-emerald-100">
        <span className="font-semibold text-white">Học viện Kỹ thuật Quân sự</span>
        <span>info@mta.edu.vn · 236 Hoàng Quốc Việt, Hà Nội</span>
      </footer>
    </div>
  );
}
