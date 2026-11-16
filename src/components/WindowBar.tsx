"use client";

import React from "react";

interface WindowBarProps {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  rightElement?: React.ReactNode;
  className?: string;
}

export function WindowControls({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-1.5 shrink-0 ${className}`} aria-hidden="true">
      <span className="h-3 w-3 rounded-full bg-[#ff5f56] border border-[#e0443e] inline-block shadow-sm transition-transform hover:scale-110" />
      <span className="h-3 w-3 rounded-full bg-[#ffbd2e] border border-[#dea123] inline-block shadow-sm transition-transform hover:scale-110" />
      <span className="h-3 w-3 rounded-full bg-[#27c93f] border border-[#1aab29] inline-block shadow-sm transition-transform hover:scale-110" />
    </div>
  );
}

export function WindowBar({
  title,
  subtitle,
  rightElement,
  className = "",
}: WindowBarProps) {
  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 bg-[#161b22] px-3.5 py-2 ${className}`}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <WindowControls />
        {title && (
          <span className="font-mono text-xs font-semibold text-zinc-200 truncate">
            {title}
          </span>
        )}
        {subtitle && (
          <span className="font-mono text-[11px] text-zinc-400 truncate">
            {subtitle}
          </span>
        )}
      </div>
      {rightElement && <div className="shrink-0">{rightElement}</div>}
    </div>
  );
}
