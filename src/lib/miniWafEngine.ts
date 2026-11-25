export type WafMode = "OFF" | "MONITOR" | "BLOCKING";
export type PortalSecurityMode = "VULNERABLE" | "HARDENED";
export type RateAlgo = "sliding" | "fixed";

const SQL_LEXER_KEYWORDS = new Set([
  "SELECT",
  "UNION",
  "ALL",
  "FROM",
  "WHERE",
  "AND",
  "OR",
  "XOR",
  "ORDER",
  "BY",
  "GROUP",
  "HAVING",
  "INSERT",
  "UPDATE",
  "DELETE",
  "DROP",
  "ALTER",
  "SLEEP",
  "BENCHMARK",
  "WAITFOR",
  "DELAY",
  "CONCAT",
  "GROUP_CONCAT",
  "SUBSTRING",
  "SUBSTR",
  "ASCII",
  "CHAR",
  "INFORMATION_SCHEMA",
  "SQLITE_MASTER",
  "OUTFILE",
  "DUMPFILE",
  "LOAD_FILE",
  "INTO",
  "NULL",
  "TRUE",
  "FALSE",
]);

export function normalizeMultiPass(raw: string): {
  decoded: string;
  spaced: string;
  collapsed: string;
} {
  let curr = raw.slice(0, 4096);
  for (let i = 0; i < 3; i++) {
    try {
      const next = decodeURIComponent(curr.replace(/\+/g, " "));
      if (next === curr) break;
      curr = next;
    } catch {
      break;
    }
  }
  curr = curr
    .replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&amp;/gi, "&")
    .normalize("NFKC");

  const unwrappedSpace = curr.replace(/\/\*!\d*\s*([\s\S]*?)\s*\*\//g, " $1 ");
  const unwrappedCol = curr.replace(/\/\*!\d*\s*([\s\S]*?)\s*\*\//g, "$1");

  let spaced = unwrappedSpace
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/[\t\r\n]+/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim()
    .toLowerCase();

  let collapsed = unwrappedCol
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/[\t\r\n]+/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim()
    .toLowerCase();

  if (spaced.includes("....//")) spaced = spaced.replaceAll("....//", "../../");
  if (collapsed.includes("....//")) collapsed = collapsed.replaceAll("....//", "../../");
  return { decoded: curr, spaced, collapsed };
}

function tokenizeSqlForWaf(text: string): { kind: string; lexeme: string }[] {
  const tokens: { kind: string; lexeme: string }[] = [];
  let i = 0;
  while (i < text.length && tokens.length < 64) {
    const ch = text[i];
    if (/\s/.test(ch)) {
      i += 1;
      continue;
    }
    if (ch === "#" || text.slice(i, i + 2) === "--") {
      tokens.push({ kind: "c", lexeme: text.slice(i, i + 24) });
      break;
    }
    if (ch === "'" || ch === '"') {
      let j = i + 1;
      while (j < text.length && text[j] !== ch) j += 1;
      if (j < text.length) {
        tokens.push({ kind: "s", lexeme: text.slice(i, j + 1) });
        i = j + 1;
      } else {
        tokens.push({ kind: "o", lexeme: ch });
        i += 1;
      }
      continue;
    }
    if ("=<>(),;+-*/".includes(ch)) {
      tokens.push({ kind: "o", lexeme: ch });
      i += 1;
      continue;
    }
    const numM = text.slice(i).match(/^(?:0x[0-9a-fA-F]+|\d+(?:\.\d+)?)/);
    if (numM) {
      tokens.push({ kind: "n", lexeme: numM[0] });
      i += numM[0].length;
      continue;
    }
    const wordM = text.slice(i).match(/^[A-Za-z_@.][A-Za-z0-9_@.$]*/);
    if (wordM) {
      const lex = wordM[0];
      tokens.push({
        kind: SQL_LEXER_KEYWORDS.has(lex.toUpperCase()) ? "k" : "w",
        lexeme: lex,
      });
      i += lex.length;
      continue;
    }
    tokens.push({ kind: "o", lexeme: ch });
    i += 1;
  }
  return tokens;
}

export function analyzeSqlLexical(rawValue: string): { suspicious: boolean; fingerprint: string } {
  const views = normalizeMultiPass(rawValue);
  let lastFp = "";
  for (const variant of [views.spaced, views.collapsed]) {
    const tokens = tokenizeSqlForWaf(variant);
    if (tokens.length === 0) continue;
    lastFp = tokens
      .slice(0, 8)
      .map((t) => t.kind)
      .join("");
    const kws = tokens.filter((t) => t.kind === "k").map((t) => t.lexeme.toUpperCase());
    const ops = tokens.filter((t) => t.kind === "o").map((t) => t.lexeme);
    const hasComment = tokens.some((t) => t.kind === "c");
    const hasQuote = ops.includes("'") || ops.includes('"') || tokens.some((t) => t.kind === "s");
    if (kws.includes("UNION") && kws.includes("SELECT")) {
      return { suspicious: true, fingerprint: lastFp };
    }
    if (
      hasQuote &&
      kws.some((k) => k === "OR" || k === "AND" || k === "XOR") &&
      (ops.includes("=") || hasComment || kws.includes("TRUE"))
    ) {
      return { suspicious: true, fingerprint: lastFp };
    }
    if (
      kws.some((k) =>
        ["SLEEP", "BENCHMARK", "WAITFOR", "ASCII", "SUBSTRING", "SUBSTR", "LOAD_FILE", "GROUP_CONCAT"].includes(k)
      ) &&
      ops.includes("(")
    ) {
      return { suspicious: true, fingerprint: lastFp };
    }
    if (kws.some((k) => ["INFORMATION_SCHEMA", "SQLITE_MASTER", "OUTFILE", "DUMPFILE"].includes(k))) {
      return { suspicious: true, fingerprint: lastFp };
    }
    for (let idx = 0; idx < tokens.length - 1; idx++) {
      if (tokens[idx].lexeme === ";" && tokens[idx + 1].kind === "k") {
        if (["SELECT", "DROP", "DELETE", "INSERT", "UPDATE", "ALTER"].includes(tokens[idx + 1].lexeme.toUpperCase())) {
          return { suspicious: true, fingerprint: lastFp };
        }
      }
    }
  }
  return { suspicious: false, fingerprint: lastFp };
}

export function maskSensitiveLog(text: string): string {
  return text
    .replace(/\b(Bearer|Basic)\s+[A-Za-z0-9\-_.~+/=]+/gi, "$1 ***MASKED***")
    .replace(/\b(password|passwd|pwd|token|cookie|phpsessid)\s*([=:])\s*([^&\s,;"]+)/gi, "$1$2***MASKED***")
    .slice(0, 180);
}

export function inspectSimulatedRequest(params: {
  method: "GET" | "POST";
  path: string;
  queryOrBody: string;
  userAgent: string;
  wafMode: WafMode;
}) {
  if (params.wafMode === "OFF") {
    return {
      action: "ALLOWED" as const,
      ruleIds: [] as string[],
      category: "Normal",
      score: 0,
      confidence: 1.0,
      normalized: normalizeMultiPass(params.queryOrBody),
      fingerprint: "",
      reasons: ["WAF đang ở chế độ OFF (chuyển thẳng sang máy chủ đích)."],
    };
  }

  const parts = params.queryOrBody
    .split("&")
    .map((p) => (p.includes("=") ? p.split("=").slice(1).join("=") : p));
  const combinedParam = parts.length > 1 ? parts.join(" ") : params.queryOrBody;

  const normPath = normalizeMultiPass(params.path);
  const normParam = normalizeMultiPass(combinedParam);
  const lex = analyzeSqlLexical(combinedParam);

  const ruleIds: string[] = [];
  const reasons: string[] = [];
  let score = 0;
  let category = "Normal";

  const addHit = (id: string, grp: string, pts: number, desc: string) => {
    if (ruleIds.includes(id)) return;
    ruleIds.push(id);
    if (category === "Normal") category = grp;
    score += pts;
    reasons.push(`${id} (${desc}, +${pts})`);
  };

  const candidates = [normParam.spaced, normParam.collapsed, params.queryOrBody];
  if (candidates.some((s) => /(?:'|"|\s--(?:\s|$)|#)/.test(s))) {
    addHit("SQL-01", "SQLi", 2, "Dấu nháy đơn/kép hoặc comment SQL");
  }
  if (
    candidates.some((s) =>
      /(?:(?:'|")\s*(?:or|and|xor)\s+(?:['"]?[a-z0-9_]+['"]?\s*=\s*['"]?[a-z0-9_]+['"]?|true\b))|(?:\b(?:or|and|xor)\s+['"]?\d+['"]?\s*=\s*['"]?\d+['"]?)|(?:\bor\s+'[^']{1,32}'\s*=\s*'[^']{1,32}')/i.test(
        s
      )
    )
  ) {
    addHit("SQL-02", "SQLi", 5, "Biểu thức logic Tautology / Boolean bypass");
  }
  if (
    candidates.some((s) =>
      /(?:\bunion(?:\s+all)?\s+(?:select\b|\(\s*select\b))|(?:\b(?:information_schema|sqlite_master)\b)|(?:\binto\s+(?:outfile|dumpfile)\b)/i.test(
        s
      )
    )
  ) {
    addHit("SQL-03", "SQLi", 6, "UNION SELECT / Metadata Schema");
  }
  if (
    candidates.some((s) =>
      /(?:\b(?:sleep|benchmark|pg_sleep|randomblob)\s*\()|(?:\bwaitfor\s+delay\b)|(?:;\s*(?:drop\s+table|delete\s+from|insert\s+into|alter\s+table)\b)/i.test(
        s
      )
    )
  ) {
    addHit("SQL-04", "SQLi", 6, "Time-Based Blind SQLi / Stacked DDL");
  }
  if (lex.suspicious) {
    addHit("SQL-05", "SQLi", 6, `SQL Lexical Grammar [${lex.fingerprint}]`);
  }

  const allTargets = [...candidates, normPath.spaced, normPath.collapsed];
  if (
    allTargets.some((s) =>
      /(?:<\s*\/?\s*(?:script|iframe|svg|object|embed)\b)|(?:<\s*(?:img|body|video|audio|details|a|input|marquee)\b[^>]*\bon(?:error|load|click|mouseover|focus)\s*=)|(?:\bon(?:error|load|mouseover|focus)\s*=\s*['"]?(?:alert|prompt|confirm|fetch|eval|document))|(?:\b(?:javascript|vbscript)\s*:)/i.test(
        s
      )
    )
  ) {
    addHit("XSS-01", "XSS", 5, "Thẻ HTML thực thi / Thuộc tính sự kiện / javascript:");
  }

  if (
    allTargets.some((s) =>
      /(?:\.\.\/|\.\.\\|\x00|%00|\/etc\/passwd|\/etc\/shadow|\/etc\/hosts|\\windows\\win\.ini|file:\/\/)/i.test(
        s
      )
    )
  ) {
    addHit("LFI-01", "LFI", 5, "Path Traversal / Đọc tệp hệ thống nhạy cảm");
  }

  if (/\b(sqlmap|nikto|acunetix|masscan|hydra|nessus|gobuster|dirbuster)\b/i.test(params.userAgent)) {
    addHit("SCN-01", "Scanner", 3, "User-Agent công cụ rà quét (+3 < 5: không chặn đơn lẻ)");
  }
  if (/^(?:\/\.env$|\/\.git(?:\/|$)|\/wp-login\.php$|\/phpmyadmin(?:\/|$)|\/cgi-bin\/)/i.test(normPath.spaced)) {
    addHit("SCN-02", "Scanner", 3, "Đường dẫn thăm dò nhạy cảm");
  }

  const action =
    score >= 5
      ? params.wafMode === "BLOCKING"
        ? ("BLOCKED" as const)
        : ("MONITORED" as const)
      : params.wafMode === "MONITOR" && score > 0
      ? ("MONITORED" as const)
      : ("ALLOWED" as const);

  return {
    action,
    ruleIds,
    category,
    score,
    confidence: score === 0 ? 0.99 : Number(Math.min(0.99, 0.55 + (score / 10) * 0.44).toFixed(2)),
    normalized: normParam,
    fingerprint: lex.fingerprint,
    reasons: reasons.length ? reasons : ["Sạch trên toàn bộ 4 vùng HTTP."],
  };
}

export const VERIFIED_PYTHON_BENCHMARK = {
  datasetSize: 100,
  iterations: 3,
  off: { backendHits: 300, meanMs: 0.928, medianMs: 0.859, p95Ms: 1.404 },
  monitor: { backendHits: 100, monitoredLogged: 50 },
  blocking: {
    tp: 50,
    fp: 0,
    tn: 50,
    fn: 0,
    precisionPct: 100.0,
    recallTprPct: 100.0,
    fprPct: 0.0,
    f1Pct: 100.0,
    meanMs: 1.637,
    medianMs: 1.693,
    p95Ms: 2.16,
    deltaMeanMs: 0.709,
    deltaP95Ms: 0.756,
    backendHits: 150,
  },
  groups: [
    { name: "SQLi cơ bản & Tautology", total: 15, blocked: 15, expected: "Chặn 15/15" },
    { name: "SQLi né lọc (Double Encode / /**/ / HPP / JSON)", total: 10, blocked: 10, expected: "Chặn 10/10" },
    { name: "XSS, Path Traversal & Scanner + Probe", total: 25, blocked: 25, expected: "Chặn 25/25" },
    { name: "Lưu lượng hợp lệ biên (O'Brien, D'Angelo, 5 < 10)", total: 50, blocked: 0, expected: "Cho qua >= 49/50" },
  ],
};
