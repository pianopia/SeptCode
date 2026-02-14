"use client";

import { useEffect, useMemo, useRef } from "react";
import hljs from "highlight.js/lib/core";
import javascript from "highlight.js/lib/languages/javascript";
import typescript from "highlight.js/lib/languages/typescript";
import python from "highlight.js/lib/languages/python";
import shell from "highlight.js/lib/languages/shell";
import bash from "highlight.js/lib/languages/bash";
import sql from "highlight.js/lib/languages/sql";
import rust from "highlight.js/lib/languages/rust";
import xml from "highlight.js/lib/languages/xml";
import css from "highlight.js/lib/languages/css";
import json from "highlight.js/lib/languages/json";
import yaml from "highlight.js/lib/languages/yaml";
import markdown from "highlight.js/lib/languages/markdown";
import go from "highlight.js/lib/languages/go";
import ruby from "highlight.js/lib/languages/ruby";
import java from "highlight.js/lib/languages/java";
import kotlin from "highlight.js/lib/languages/kotlin";
import dart from "highlight.js/lib/languages/dart";
import c from "highlight.js/lib/languages/c";
import cpp from "highlight.js/lib/languages/cpp";
import swift from "highlight.js/lib/languages/swift";

hljs.registerLanguage("javascript", javascript);
hljs.registerLanguage("typescript", typescript);
hljs.registerLanguage("python", python);
hljs.registerLanguage("shell", shell);
hljs.registerLanguage("bash", bash);
hljs.registerLanguage("sql", sql);
hljs.registerLanguage("rust", rust);
hljs.registerLanguage("xml", xml);
hljs.registerLanguage("html", xml);
hljs.registerLanguage("css", css);
hljs.registerLanguage("json", json);
hljs.registerLanguage("yaml", yaml);
hljs.registerLanguage("markdown", markdown);
hljs.registerLanguage("go", go);
hljs.registerLanguage("ruby", ruby);
hljs.registerLanguage("java", java);
hljs.registerLanguage("kotlin", kotlin);
hljs.registerLanguage("dart", dart);
hljs.registerLanguage("c", c);
hljs.registerLanguage("cpp", cpp);
hljs.registerLanguage("swift", swift);

function normalizeLang(language: string): string | undefined {
  const l = language.toLowerCase().trim();
  const map: Record<string, string> = {
    js: "javascript",
    jsx: "javascript",
    ts: "typescript",
    tsx: "typescript",
    react: "javascript",
    py: "python",
    sh: "shell",
    yml: "yaml",
    md: "markdown",
    htm: "xml",
    html: "xml",
    "c++": "cpp",
    objc: "c",
    rs: "rust",
    rb: "ruby",
    kt: "kotlin"
  };

  const resolved = map[l] ?? l;
  return hljs.getLanguage(resolved) ? resolved : undefined;
}

export function CodeRenderer({ language, code }: { language: string; code: string }) {
  const codeRef = useRef<HTMLElement | null>(null);
  const normalizedLanguage = useMemo(() => normalizeLang(language), [language]);

  useEffect(() => {
    if (!codeRef.current) return;
    const highlighted = normalizedLanguage
      ? hljs.highlight(code, { language: normalizedLanguage }).value
      : hljs.highlightAuto(code).value;
    codeRef.current.innerHTML = highlighted;
  }, [code, normalizedLanguage]);

  return (
    <pre className="code-no-ligatures overflow-x-auto rounded-lg border border-slate-700 bg-slate-950 p-3 text-xs leading-relaxed sm:text-sm">
      <code ref={codeRef} className={`code-no-ligatures hljs language-${normalizedLanguage ?? ""}`} />
    </pre>
  );
}
