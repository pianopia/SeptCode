"use client";

import { useMemo } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { oneDark } from "@codemirror/theme-one-dark";
import type { Extension } from "@codemirror/state";
import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import { rust } from "@codemirror/lang-rust";
import { sql } from "@codemirror/lang-sql";
import { html } from "@codemirror/lang-html";
import { css } from "@codemirror/lang-css";
import { json } from "@codemirror/lang-json";
import { xml } from "@codemirror/lang-xml";
import { yaml } from "@codemirror/lang-yaml";
import { markdown } from "@codemirror/lang-markdown";
import { cpp } from "@codemirror/lang-cpp";
import { java } from "@codemirror/lang-java";
import { go } from "@codemirror/lang-go";
import { php } from "@codemirror/lang-php";
import { MAX_CODE_LINE_LENGTH, wrapCodeLinesByMaxChars } from "@/lib/code-wrap";

export function PostCodeTextarea({
  name,
  value,
  onValueChange,
  language = "",
  placeholder,
  rows = 7,
  className,
  required = false,
  maxLineChars = MAX_CODE_LINE_LENGTH
}: {
  name: string;
  value: string;
  onValueChange: (value: string) => void;
  language?: string;
  placeholder?: string;
  rows?: number;
  className?: string;
  required?: boolean;
  maxLineChars?: number;
}) {
  const extensions = useMemo<Extension[]>(() => {
    const ext = resolveLanguageExtension(language);
    return ext ? [ext] : [];
  }, [language]);

  return (
    <div className={className ?? ""}>
      <textarea
        name={name}
        value={value}
        readOnly
        required={required}
        tabIndex={-1}
        aria-hidden
        className="hidden"
      />
      <div className="overflow-hidden rounded-lg border border-slate-700 bg-[#0d1117]">
        <div className="flex items-center border-b border-slate-800 px-3 py-1.5">
          <span className="rounded-full border border-slate-600 bg-slate-900/70 px-2 py-0.5 text-[10px] font-mono uppercase tracking-wide text-slate-300">
            {language && language.trim().length > 0 ? language : "plain text"}
          </span>
        </div>
        <CodeMirror
          value={value}
          height={`${rows * 24 + 24}px`}
          theme={oneDark}
          basicSetup={{
            lineNumbers: true,
            foldGutter: false,
            highlightActiveLine: false,
            highlightActiveLineGutter: false
          }}
          extensions={extensions}
          placeholder={placeholder}
          onChange={(nextValue) => {
            const wrapped = wrapCodeLinesByMaxChars(nextValue, maxLineChars);
            onValueChange(wrapped);
          }}
          className="code-no-ligatures text-sm"
        />
      </div>
    </div>
  );
}

function resolveLanguageExtension(language: string): Extension | null {
  const l = language.toLowerCase().trim();
  if (!l) return null;

  if (["js", "jsx", "javascript", "react"].includes(l)) return javascript({ jsx: true });
  if (["ts", "tsx", "typescript"].includes(l)) return javascript({ typescript: true, jsx: true });
  if (["py", "python"].includes(l)) return python();
  if (["rs", "rust"].includes(l)) return rust();
  if (["sql"].includes(l)) return sql();
  if (["html", "htm"].includes(l)) return html();
  if (["css"].includes(l)) return css();
  if (["json"].includes(l)) return json();
  if (["xml"].includes(l)) return xml();
  if (["yaml", "yml"].includes(l)) return yaml();
  if (["md", "markdown"].includes(l)) return markdown();
  if (["cpp", "c++"].includes(l)) return cpp();
  if (["c", "h"].includes(l)) return cpp();
  if (["java"].includes(l)) return java();
  if (["go", "golang"].includes(l)) return go();
  if (["php"].includes(l)) return php();

  return null;
}
