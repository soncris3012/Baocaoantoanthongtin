"use client";

import React from "react";

interface WindowControlsProps {
  className?: string;
  onClose?: () => void;
  closeTitle?: string;
  onMinimize?: () => void;
  isMinimized?: boolean;
  onMaximize?: () => void;
  isMaximized?: boolean;
}

export function WindowControls({
  className = "",
  onClose,
  closeTitle = "Đóng",
  onMinimize,
  isMinimized = false,
  onMaximize,
  isMaximized = false,
}: WindowControlsProps) {
  return (
    <div
      className={`group/win flex items-center gap-1.5 shrink-0 ${className}`}
      aria-hidden={!onClose && !onMinimize && !onMaximize ? "true" : undefined}
    >
      {onClose ? (
        <button
          type="button"
          onClick={onClose}
          title={closeTitle}
          aria-label={closeTitle}
          className="relative flex h-3 w-3 cursor-pointer items-center justify-center rounded-full border border-[#e0443e] bg-[#ff5f56] text-[9px] font-bold leading-none text-[#4d0000] transition-transform hover:scale-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-white"
        >
          <span className="opacity-0 transition-opacity group-hover/win:opacity-100">×</span>
        </button>
      ) : (
        <span className="inline-block h-3 w-3 rounded-full border border-[#e0443e] bg-[#ff5f56] shadow-sm" />
      )}

      {onMinimize ? (
        <button
          type="button"
          onClick={onMinimize}
          title={isMinimized ? "Mở rộng lại" : "Thu gọn cửa sổ"}
          aria-label={isMinimized ? "Mở rộng lại" : "Thu gọn cửa sổ"}
          className="relative flex h-3 w-3 cursor-pointer items-center justify-center rounded-full border border-[#dea123] bg-[#ffbd2e] text-[9px] font-bold leading-none text-[#5c3c00] transition-transform hover:scale-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-white"
        >
          <span className="opacity-0 transition-opacity group-hover/win:opacity-100">−</span>
        </button>
      ) : (
        <span className="inline-block h-3 w-3 rounded-full border border-[#dea123] bg-[#ffbd2e] shadow-sm" />
      )}

      {onMaximize ? (
        <button
          type="button"
          onClick={onMaximize}
          title={isMaximized ? "Thoát phóng to" : "Phóng to cửa sổ"}
          aria-label={isMaximized ? "Thoát phóng to" : "Phóng to cửa sổ"}
          className="relative flex h-3 w-3 cursor-pointer items-center justify-center rounded-full border border-[#1aab29] bg-[#27c93f] text-[9px] font-bold leading-none text-[#004d0c] transition-transform hover:scale-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-white"
        >
          <span className="opacity-0 transition-opacity group-hover/win:opacity-100">+</span>
        </button>
      ) : (
        <span className="inline-block h-3 w-3 rounded-full border border-[#1aab29] bg-[#27c93f] shadow-sm" />
      )}
    </div>
  );
}

interface WindowBarProps {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  rightElement?: React.ReactNode;
  className?: string;
  controlsProps?: WindowControlsProps;
}

export function WindowBar({
  title,
  subtitle,
  rightElement,
  className = "",
  controlsProps,
}: WindowBarProps) {
  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 bg-[#161b22] px-3.5 py-2 ${className}`}
    >
      <div className="flex min-w-0 items-center gap-2.5">
        <WindowControls {...controlsProps} />
        {title && (
          <span className="truncate font-mono text-xs font-semibold text-zinc-200">
            {title}
          </span>
        )}
        {subtitle && (
          <span className="truncate font-mono text-[11px] text-zinc-400">
            {subtitle}
          </span>
        )}
      </div>
      {rightElement && <div className="shrink-0">{rightElement}</div>}
    </div>
  );
}
