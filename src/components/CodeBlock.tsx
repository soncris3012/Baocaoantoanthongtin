"use client";

import { useState } from "react";
import { Check, Copy, Terminal } from "lucide-react";

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
  const rendered = interpolateCommand(code, variables);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(rendered);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // clipboard fallback
    }
  };

  return (
    <div className="overflow-hidden rounded-xl border border-slate-800 bg-[#090e1a]">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/90 bg-slate-900/70 px-3.5 py-2">
        <div className="flex items-center gap-2 text-xs">
          <Terminal className="h-3.5 w-3.5 text-cyan-400" />
          <span className="font-medium text-slate-200">{label || "Lệnh thực thi"}</span>
          <span className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-[10px] text-slate-400">
            {shell}
          </span>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1 rounded-md border border-slate-700 bg-slate-800/80 px-2.5 py-1 text-xs font-medium text-slate-200 transition hover:border-cyan-500/50 hover:text-cyan-300"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-emerald-300">Đã copy</span>
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              <span>Copy lệnh</span>
            </>
          )}
        </button>
      </div>
      <pre className="overflow-x-auto p-3.5 font-mono text-xs leading-relaxed text-cyan-100 sm:text-[13px]">
        <code>{rendered}</code>
      </pre>
      {explanation && (
        <div className="border-t border-slate-800/70 bg-slate-950/60 px-3.5 py-2 text-xs text-slate-400">
          <span className="font-semibold text-slate-300">Giải thích: </span>
          {explanation}
        </div>
      )}
    </div>
  );
}
