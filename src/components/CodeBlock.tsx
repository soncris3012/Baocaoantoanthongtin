"use client";

import { useEffect, useState } from "react";
import { Check, Copy, Maximize2, Minimize2, Terminal, X } from "lucide-react";
import { WindowControls } from "@/components/WindowBar";

interface CodeBlockProps {
  label?: string;
  shell?: string;
  code: string;
  explanation?: string;
  variables?: {
    container?: string;
    phpsessid?: string;
    userToken?: string;
  };
}

export function interpolateCommand(
  template: string,
  variables?: {
    container?: string;
    phpsessid?: string;
    userToken?: string;
  }
): string {
  const container = variables?.container?.trim() || "dvwa";
  const phpsessid = variables?.phpsessid?.trim() || "7nst0hrqrfmv744a5ouj7663b0";
  const userToken = variables?.userToken?.trim() || "d41d8cd98f00b204e9800998ecf8427e";

  return template
    .replaceAll("{{CONTAINER}}", container)
    .replaceAll("{{PHPSESSID}}", phpsessid)
    .replaceAll("{{USER_TOKEN}}", userToken);
}

export function CodeBlock({
  label,
  shell = "zsh / bash",
  code,
  explanation,
  variables,
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const rendered = interpolateCommand(code, variables);

  useEffect(() => {
    if (!isMaximized) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsMaximized(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isMaximized]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(rendered);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // clipboard fallback
    }
  };

  const renderWindow = (modalMode: boolean) => (
    <div
      className={`overflow-hidden rounded-lg border border-zinc-800 bg-[#0d1117] ${
        modalMode ? "flex max-h-[88vh] w-full max-w-4xl flex-col shadow-2xl" : ""
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 bg-[#161b22] px-3.5 py-2">
        <div className="flex min-w-0 items-center gap-2.5 text-xs">
          <WindowControls
            onClose={() => {
              if (modalMode) {
                setIsMaximized(false);
              } else {
                setIsMinimized((v) => !v);
              }
            }}
            closeTitle={modalMode ? "Đóng phóng to (Esc)" : isMinimized ? "Mở lại cửa sổ" : "Thu gọn cửa sổ"}
            onMinimize={() => {
              if (modalMode) {
                setIsMaximized(false);
              } else {
                setIsMinimized((v) => !v);
              }
            }}
            isMinimized={isMinimized}
            onMaximize={() => {
              setIsMinimized(false);
              setIsMaximized((v) => !v);
            }}
            isMaximized={modalMode}
          />
          <Terminal className="h-3.5 w-3.5 shrink-0 text-zinc-400" aria-hidden="true" />
          <span className="truncate font-medium text-zinc-200">{label || "Lệnh thực thi"}</span>
          <span className="shrink-0 font-mono text-[11px] text-zinc-400">({shell})</span>
        </div>

        <div className="flex items-center gap-1.5">
          {!modalMode && (
            <button
              type="button"
              onClick={() => {
                setIsMinimized(false);
                setIsMaximized(true);
              }}
              aria-label="Phóng to khối lệnh"
              title="Phóng to toàn màn hình"
              className="hidden cursor-pointer items-center justify-center rounded border border-zinc-700 bg-zinc-800 p-1 text-zinc-300 transition-colors hover:border-zinc-500 hover:bg-zinc-700 sm:flex"
            >
              <Maximize2 className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          )}
          {modalMode && (
            <button
              type="button"
              onClick={() => setIsMaximized(false)}
              aria-label="Thu nhỏ"
              title="Thu nhỏ lại (Esc)"
              className="flex cursor-pointer items-center gap-1 rounded border border-zinc-700 bg-zinc-800 px-2 py-1 text-xs text-zinc-200 transition-colors hover:border-zinc-500 hover:bg-zinc-700"
            >
              <Minimize2 className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Thu nhỏ</span>
            </button>
          )}
          <button
            type="button"
            onClick={handleCopy}
            className="flex cursor-pointer items-center gap-1.5 rounded border border-zinc-700 bg-zinc-800 px-2.5 py-1 text-xs font-medium text-zinc-200 transition-colors hover:border-zinc-500 hover:bg-zinc-700"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />
                <span className="text-emerald-300">Đã copy</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Copy</span>
              </>
            )}
          </button>
          {modalMode && (
            <button
              type="button"
              onClick={() => setIsMaximized(false)}
              aria-label="Đóng cửa sổ phóng to"
              className="flex cursor-pointer items-center justify-center rounded border border-zinc-700 bg-zinc-800 p-1 text-zinc-300 hover:bg-zinc-700"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      {(!isMinimized || modalMode) && (
        <>
          <pre
            className={`overflow-x-auto font-mono leading-relaxed text-zinc-100 ${
              modalMode ? "flex-1 overflow-y-auto p-5 text-sm" : "p-3.5 text-xs sm:text-[13px]"
            }`}
          >
            <code>{rendered}</code>
          </pre>
          {explanation && (
            <div className="border-t border-zinc-800 bg-[#090d13] px-3.5 py-2 text-xs text-zinc-300">
              <span className="font-semibold text-zinc-100">Ghi chú kỹ thuật: </span>
              {explanation}
            </div>
          )}
        </>
      )}
    </div>
  );

  return (
    <>
      {renderWindow(false)}
      {isMaximized && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsMaximized(false);
          }}
        >
          {renderWindow(true)}
        </div>
      )}
    </>
  );
}
