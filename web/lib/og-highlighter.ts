// Map token types to colors
const THEME_COLORS: Record<string, string> = {
    keyword: "#c678dd", // purple
    built_in: "#e5c07b", // yellow
    type: "#e5c07b", // yellow
    literal: "#56b6c2", // cyan
    number: "#d19a66", // orange
    regexp: "#98c379", // green
    string: "#98c379", // green
    subst: "#e06c75", // red
    symbol: "#56b6c2", // cyan
    class: "#e5c07b", // yellow
    function: "#61afef", // blue
    title: "#61afef", // blue
    params: "#abb2bf", // grey
    comment: "#5c6370", // grey
    doctag: "#c678dd", // purple
    meta: "#56b6c2", // cyan
    section: "#e06c75", // red
    tag: "#e06c75", // red
    name: "#e06c75", // red
    "attr-name": "#d19a66", // orange
    attribute: "#d19a66", // orange
    variable: "#e06c75", // red
    operator: "#56b6c2", // cyan
    punctuation: "#abb2bf", // grey
};

export type Token = {
    text: string;
    color?: string;
};

// Common keywords across many languages
const KEYWORDS = new Set([
    "const", "let", "var", "function", "class", "return", "import", "export", "from", "as", "default",
    "if", "else", "for", "while", "do", "switch", "case", "break", "continue", "try", "catch", "finally",
    "throw", "new", "this", "super", "extends", "implements", "interface", "type", "enum", "public",
    "private", "protected", "static", "readonly", "async", "await", "yield", "void", "null", "undefined",
    "true", "false", "in", "of", "typeof", "instanceof", "delete", "package", "namespace", "use", "echo",
    "print", "def", "end", "begin", "rescue", "ensure", "module", "include", "require", "struct", "impl",
    "fn", "pub", "crate", "use", "mod", "trait", "where", "select", "insert", "update", "delete", "create",
    "table", "drop", "alter", "into", "values", "from", "where", "group", "by", "order", "limit", "offset",
    "join", "on", "and", "or", "not", "is", "null", "like", "union", "all", "distinct", "count", "sum",
    "avg", "max", "min"
]);

export function highlightCode(code: string, language: string): Token[] {
    const tokens: Token[] = [];
    let remaining = code;

    // Simple tokenizer loop
    while (remaining.length > 0) {
        let match;

        // 1. Strings ( "...", '...', `...` )
        if ((match = remaining.match(/^("([^"\\]*(\\.[^"\\]*)*)"|'([^'\\]*(\\.[^'\\]*)*)'|`([^`\\]*(\\.[^`\\]*)*)`)/))) {
            tokens.push({ text: match[0], color: THEME_COLORS.string });
            remaining = remaining.slice(match[0].length);
            continue;
        }

        // 2. Comments
        // /* ... */
        if ((match = remaining.match(/^\/\*[\s\S]*?\*\//))) {
            tokens.push({ text: match[0], color: THEME_COLORS.comment });
            remaining = remaining.slice(match[0].length);
            continue;
        }
        // // ... or # ... (end of line)
        if ((match = remaining.match(/^(\/\/|#).*$/))) {
            tokens.push({ text: match[0], color: THEME_COLORS.comment });
            remaining = remaining.slice(match[0].length);
            continue;
        }

        // 3. Numbers
        if ((match = remaining.match(/^\b\d+(\.\d+)?\b/))) {
            tokens.push({ text: match[0], color: THEME_COLORS.number });
            remaining = remaining.slice(match[0].length);
            continue;
        }

        // 4. Keywords and Identifiers
        if ((match = remaining.match(/^[a-zA-Z_$][a-zA-Z0-9_$]*/))) {
            const word = match[0];
            if (KEYWORDS.has(word)) {
                tokens.push({ text: word, color: THEME_COLORS.keyword });
            } else if (/^[A-Z]/.test(word)) {
                tokens.push({ text: word, color: THEME_COLORS.class });
            } else {
                tokens.push({ text: word, color: THEME_COLORS.variable });
            }
            remaining = remaining.slice(word.length);
            continue;
        }

        // 5. Punctuation
        if ((match = remaining.match(/^[{}()\[\].,:;]/))) {
            tokens.push({ text: match[0], color: THEME_COLORS.punctuation });
            remaining = remaining.slice(match[0].length);
            continue;
        }

        // 6. Operators
        if ((match = remaining.match(/^[+\-*/%=&|<>!^~?]/))) {
            tokens.push({ text: match[0], color: THEME_COLORS.operator });
            remaining = remaining.slice(match[0].length);
            continue;
        }

        // 7. Whitespace
        if ((match = remaining.match(/^\s+/))) {
            tokens.push({ text: match[0] });
            remaining = remaining.slice(match[0].length);
            continue;
        }

        // 8. Fallback: consume one character
        tokens.push({ text: remaining[0] });
        remaining = remaining.slice(1);
    }

    return tokens;
}
