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
    <div className="overflow-hidden rounded-lg border border-zinc-800 bg-[#0d1117]">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 bg-[#161b22] px-3.5 py-2">
        <div className="flex items-center gap-2 text-xs">
          <Terminal className="h-3.5 w-3.5 text-zinc-400" aria-hidden="true" />
          <span className="font-medium text-zinc-200">{label || "Lệnh thực thi"}</span>
          <span className="font-mono text-[11px] text-zinc-400">({shell})</span>
        </div>
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
      </div>
      <pre className="overflow-x-auto p-3.5 font-mono text-xs leading-relaxed text-zinc-100 sm:text-[13px]">
        <code>{rendered}</code>
      </pre>
      {explanation && (
        <div className="border-t border-zinc-800 bg-[#090d13] px-3.5 py-2 text-xs text-zinc-300">
          <span className="font-semibold text-zinc-100">Ghi chú kỹ thuật: </span>
          {explanation}
        </div>
      )}
    </div>
  );
}
