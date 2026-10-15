import { useCallback, useState, type ReactNode } from "react";
import { Icon } from "./Icons.tsx";
import { copyText } from "../lib/copy.ts";

const KEYWORDS = /\b(import|from|const|await|async|let|new|return|function|export)\b/;

/** A deliberately small highlighter (comments, strings, keywords, numbers): enough to read, with no dependency. */
function highlight(code: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /(\/\/[^\n]*|#[^\n]*)|("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)|(\b\d+n?\b)|(\b[A-Za-z_]+\b)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(code))) {
    if (m.index > last) out.push(code.slice(last, m.index));
    if (m[1]) out.push(<span key={i++} className="tok-c">{m[1]}</span>);
    else if (m[2]) out.push(<span key={i++} className="tok-s">{m[2]}</span>);
    else if (m[3]) out.push(<span key={i++} className="tok-n">{m[3]}</span>);
    else if (m[4] && KEYWORDS.test(m[4])) out.push(<span key={i++} className="tok-k">{m[4]}</span>);
    else out.push(m[0]);
    last = m.index + m[0].length;
  }
  if (last < code.length) out.push(code.slice(last));
  return out;
}

export function CodeBlock({ code, label }: { code: string; label: string }) {
  const [state, setState] = useState<"idle" | "done" | "failed">("idle");
  const copy = useCallback(async () => {
    setState((await copyText(code)) ? "done" : "failed");
    setTimeout(() => setState("idle"), 2000);
  }, [code]);
  return (
    <div className="code">
      <div className="code-bar">
        <span className="code-label">{label}</span>
        <button className="btn btn-quiet btn-sm" onClick={copy} aria-label={`Copy ${label}`}>
          <Icon name={state === "done" ? "check" : "copy"} size={15} /> {state === "done" ? "Copied" : state === "failed" ? "Copy blocked" : "Copy"}
        </button>
      </div>
      <pre tabIndex={0}><code>{highlight(code)}</code></pre>
      <span className="sr-only" role="status" aria-live="polite">{state === "done" ? "Copied to clipboard" : state === "failed" ? "Copy failed" : ""}</span>
    </div>
  );
}
