"use client";

import { useEffect, useMemo, useRef } from "react";
import hljs from "highlight.js/lib/core";
import javascript from "highlight.js/lib/languages/javascript";
import typescript from "highlight.js/lib/languages/typescript";
import python from "highlight.js/lib/languages/python";
import shell from "highlight.js/lib/languages/shell";
import sql from "highlight.js/lib/languages/sql";
import rust from "highlight.js/lib/languages/rust";
import xml from "highlight.js/lib/languages/xml";
import mermaid from "mermaid";

hljs.registerLanguage("javascript", javascript);
hljs.registerLanguage("typescript", typescript);
hljs.registerLanguage("python", python);
hljs.registerLanguage("shell", shell);
hljs.registerLanguage("sql", sql);
hljs.registerLanguage("rust", rust);
hljs.registerLanguage("xml", xml);

function isMermaid(language: string, code: string) {
  const l = language.toLowerCase();
  return l === "mermaid" || /^(graph|flowchart|sequenceDiagram|classDiagram)/.test(code.trim());
}

export function CodeRenderer({ language, code }: { language: string; code: string }) {
  const preRef = useRef<HTMLPreElement | null>(null);
  const mermaidRef = useRef<HTMLDivElement | null>(null);
  const mermaidMode = useMemo(() => isMermaid(language, code), [language, code]);

  useEffect(() => {
    if (mermaidMode) return;
    if (!preRef.current) return;
    const result = hljs.highlightAuto(code);
    preRef.current.innerHTML = result.value;
  }, [code, mermaidMode]);

  useEffect(() => {
    if (!mermaidMode || !mermaidRef.current) return;

    mermaid.initialize({ startOnLoad: false, theme: "dark" });
    const id = `m-${Math.random().toString(36).slice(2)}`;
    mermaid
      .render(id, code)
      .then(({ svg }) => {
        if (mermaidRef.current) mermaidRef.current.innerHTML = svg;
      })
      .catch(() => {
        if (mermaidRef.current) mermaidRef.current.innerHTML = "<p>Mermaid rendering failed.</p>";
      });
  }, [code, mermaidMode]);

  if (mermaidMode) {
    return <div ref={mermaidRef} className="overflow-x-auto rounded-lg border border-slate-700 bg-slate-950 p-2" />;
  }

  return (
    <pre
      ref={preRef}
      className="overflow-x-auto rounded-lg border border-slate-700 bg-slate-950 p-3 text-xs leading-relaxed sm:text-sm"
    />
  );
}
