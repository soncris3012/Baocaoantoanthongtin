#!/usr/bin/env python3
"""
khanh_sql_lexer_waf.py - Context-Aware SQL Lexical Tokenizer & RASP Engine
Demonstrates why naive Regex blacklists break on MySQL versioned comments (/*!50000...*/)
and create false positives on names like "O'Connor", vs structural SQL token fingerprinting
(inspired by libinjection) + PHP SafePDO reference output.
Uses Python 3 standard library only.
"""

from __future__ import annotations

import argparse
import dataclasses
import re
import sys
import urllib.parse


SQL_KEYWORDS = {
    "SELECT",
    "UNION",
    "FROM",
    "WHERE",
    "AND",
    "OR",
    "ORDER",
    "BY",
    "GROUP",
    "HAVING",
    "INSERT",
    "UPDATE",
    "DELETE",
    "DROP",
    "SLEEP",
    "BENCHMARK",
    "CONCAT",
    "GROUP_CONCAT",
    "SUBSTRING",
    "ASCII",
    "INFORMATION_SCHEMA",
    "OUTFILE",
    "DUMPFILE",
    "NULL",
    "XOR",
}

NAIVE_REGEX_PATTERNS = [
    re.compile(r"(union\s+select)", re.IGNORECASE),
    re.compile(r"\b(or|and)\s+1\s*=\s*1", re.IGNORECASE),
    re.compile(r"'", re.IGNORECASE),
]


@dataclasses.dataclass
class SqlToken:
    kind: str  # n=number, s=string, o=operator, k=keyword, w=word/ident, c=comment
    lexeme: str


@dataclasses.dataclass
class InspectionResult:
    raw_input: str
    normalized: str
    tokens: list[SqlToken]
    fingerprint: str
    naive_regex_action: str
    lexer_action: str
    reason: str


def normalize_sql_input(raw: str) -> str:
    """Iteratively URL-decode (handles double encoding %2527) & normalize MySQL comments."""
    current = raw
    for _ in range(3):
        decoded = urllib.parse.unquote_plus(current)
        if decoded == current:
            break
        current = decoded

    # Expose hidden code inside MySQL conditional execution comments /*!50000...*/
    current = re.sub(r"/\*!\d*\s*(.*?)\s*\*/", r" \1 ", current, flags=re.DOTALL)
    # Collapse standard SQL block comments /**/ used to split keywords (UN/**/ION)
    current = re.sub(r"/\*.*?\*/", " ", current, flags=re.DOTALL)
    return re.sub(r"\s+", " ", current).strip()


def tokenize_sql(text: str) -> list[SqlToken]:
    """Scan normalized SQL fragment into typed lexical tokens."""
    tokens: list[SqlToken] = []
    i = 0
    n = len(text)

    while i < n:
        ch = text[i]
        if ch.isspace():
            i += 1
            continue

        # End-of-line comments (-- or #)
        if ch == "#" or text[i : i + 2] == "--":
            tokens.append(SqlToken("c", text[i:]))
            break

        # Quoted strings or unmatched quote delimiter
        if ch in ("'", '"'):
            quote = ch
            j = i + 1
            while j < n and text[j] != quote:
                j += 1
            if j < n:
                tokens.append(SqlToken("s", text[i : j + 1]))
                i = j + 1
            else:
                tokens.append(SqlToken("o", quote))
                i += 1
            continue

        # Multi-char operators & punctuation
        if text[i : i + 2] in ("<=", ">=", "<>", "!=", "||", "&&"):
            tokens.append(SqlToken("o", text[i : i + 2]))
            i += 2
            continue
        if ch in ("=", "<", ">", "(", ")", ",", ";", "+", "-", "*", "/"):
            tokens.append(SqlToken("o", ch))
            i += 1
            continue

        # Numbers (including 0x... hex literals)
        if ch.isdigit():
            m = re.match(r"0x[0-9a-fA-F]+|\d+(?:\.\d+)?", text[i:])
            assert m is not None
            lex = m.group(0)
            tokens.append(SqlToken("n", lex))
            i += len(lex)
            continue

        # Identifiers & SQL keywords
        if ch.isalpha() or ch in ("_", "@", "."):
            m = re.match(r"[A-Za-z_@.][A-Za-z0-9_@.$]*", text[i:])
            assert m is not None
            lex = m.group(0)
            upper = lex.upper()
            kind = "k" if upper in SQL_KEYWORDS else "w"
            tokens.append(SqlToken(kind, lex))
            i += len(lex)
            continue

        tokens.append(SqlToken("o", ch))
        i += 1

    return tokens


def inspect_payload(raw_input: str) -> InspectionResult:
    """Compare Naive Regex WAF vs Structural SQL Lexical Tokenizer."""
    regex_hit = any(p.search(raw_input) for p in NAIVE_REGEX_PATTERNS)
    naive_action = "BLOCK (regex match)" if regex_hit else "ALLOW"

    normalized = normalize_sql_input(raw_input)
    tokens = tokenize_sql(normalized)
    fp = "".join(t.kind for t in tokens[:7])

    upper_kws = [t.lexeme.upper() for t in tokens if t.kind == "k"]
    has_comment = any(t.kind == "c" for t in tokens)
    has_unmatched_quote = any(t.kind == "o" and t.lexeme in ("'", '"') for t in tokens)

    # Structural SQLi detection checks grammar rather than plain English punctuation
    tautology_grammar = (
        has_unmatched_quote
        and any(k in ("OR", "AND", "XOR") for k in upper_kws)
        and ("=" in [t.lexeme for t in tokens] or has_comment)
    )
    union_grammar = "UNION" in upper_kws and "SELECT" in upper_kws
    time_or_blind_grammar = any(
        k in ("SLEEP", "BENCHMARK", "INFORMATION_SCHEMA", "OUTFILE", "DUMPFILE")
        for k in upper_kws
    ) and ("(" in [t.lexeme for t in tokens] or has_unmatched_quote or "INTO" in normalized.upper())

    if union_grammar:
        lexer_action = "BLOCK"
        reason = "Detected structural UNION + SELECT clause sequence across normalized SQL tokens."
    elif tautology_grammar:
        lexer_action = "BLOCK"
        reason = "Detected quote boundary breakout followed by boolean tautology operator/comment."
    elif time_or_blind_grammar:
        lexer_action = "BLOCK"
        reason = "Detected privileged SQL function or schema/file exfiltration token structure."
    else:
        lexer_action = "ALLOW"
        reason = "Benign lexical profile (e.g., plain identifier or surname apostrophe without SQL grammar)."

    return InspectionResult(
        raw_input=raw_input,
        normalized=normalized,
        tokens=tokens,
        fingerprint=fp,
        naive_regex_action=naive_action,
        lexer_action=lexer_action,
        reason=reason,
    )


SAFE_PDO_SNIPPET = """<?php
// khanh_safe_pdo.php - Strict PDO Prepared Statements + Integer Boundary Validation
if (isset($_GET['Submit'])) {
    $rawId = $_GET['id'] ?? '';
    $id = filter_var($rawId, FILTER_VALIDATE_INT, [
        'options' => ['min_range' => 1, 'max_range' => 999999]
    ]);
    if ($id === false) {
        http_response_code(400);
        exit('Invalid user identifier');
    }

    $pdo = new PDO(
        'mysql:host=' . $_ENV['DB_SERVER'] . ';dbname=' . $_ENV['DB_DATABASE'] . ';charset=utf8mb4',
        $_ENV['DB_USER'],
        $_ENV['DB_PASS'],
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_EMULATE_PREPARES => false, // Enforce native MySQL protocol separation
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]
    );

    $stmt = $pdo->prepare('SELECT first_name, last_name FROM v_user_public_profile WHERE user_id = :id LIMIT 1');
    $stmt->bindValue(':id', $id, PDO::PARAM_INT);
    $stmt->execute();
}
"""


BENCHMARK_SUITE = [
    ("Benign numeric ID", "1"),
    ("False-positive stress test (surname)", "O'Connor"),
    ("Naive Regex bypass: MySQL /*!50000...*/", "1' /*!50000UNION*/ /*!50000SELECT*/ user,password FROM users#"),
    ("Naive Regex bypass: Double-URL encoding", "1%2527%20OR%201%3D1--%20-"),
    ("Blind timing payload", "1' AND SLEEP(3)#"),
    ("RCE INTO OUTFILE attempt", "1' UNION SELECT '<?php system($_GET[0]);?>',null INTO OUTFILE '/var/www/html/s.php'#"),
]


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Context-Aware SQL Lexical Tokenizer & RASP Benchmark Engine"
    )
    parser.add_argument("--payload", help="Inspect single input payload")
    parser.add_argument("--benchmark", action="store_true", help="Run adversarial bypass vs false-positive suite")
    parser.add_argument("--show-pdo", action="store_true", help="Print hardened PHP PDO Prepared Statement code")
    args = parser.parse_args()

    if args.show_pdo:
        print(SAFE_PDO_SNIPPET)
        return 0

    if args.payload is not None:
        res = inspect_payload(args.payload)
        tok_str = " ".join(f"[{t.kind}:{t.lexeme}]" for t in res.tokens)
        print(f"Input      : {res.raw_input}")
        print(f"Normalized : {res.normalized}")
        print(f"Tokens     : {tok_str}")
        print(f"Fingerprint: {res.fingerprint}")
        print(f"Naive Regex: {res.naive_regex_action}")
        print(f"Lexer WAF  : {res.lexer_action} -> {res.reason}")
        return 0 if res.lexer_action == "ALLOW" else 2

    print("=== Adversarial Regex Bypass vs Context-Aware SQL Lexer Benchmark ===")
    for label, sample in BENCHMARK_SUITE:
        res = inspect_payload(sample)
        print(f"\n[{label}]")
        print(f"  Payload    : {sample}")
        print(f"  Normalized : {res.normalized}")
        print(f"  Fingerprint: {res.fingerprint:8s} | Naive Regex: {res.naive_regex_action:20s} | SQL Lexer: {res.lexer_action}")
        print(f"  Analysis   : {res.reason}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
