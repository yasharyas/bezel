import { Fragment, type ReactNode } from "react";

/*
 * A deliberately small Markdown renderer for PRINCIPLES.md and STATES.md.
 * It covers what those documents use (headings, paragraphs, bullet and
 * numbered lists, tables, rules, bold, italics, inline code and links) and
 * renders it at build time, so the docs ship as static HTML with no parser in
 * the client bundle.
 */

export function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/`/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

/* ------------------------------------------------------------------ inline */

const INLINE = /(`[^`]+`)|(\*\*[^*]+\*\*)|(\*[^*\s][^*]*\*)|(\[[^\]]+\]\([^)]+\))/;

function inline(text: string, keyPrefix = "i"): ReactNode[] {
  const out: ReactNode[] = [];
  let rest = text;
  let i = 0;
  while (rest.length) {
    const m = INLINE.exec(rest);
    if (!m) {
      out.push(rest);
      break;
    }
    if (m.index > 0) out.push(rest.slice(0, m.index));
    const token = m[0];
    const key = `${keyPrefix}-${i++}`;
    if (m[1]) {
      out.push(
        <code key={key} className="rounded-md bg-void-raised px-1.5 py-0.5 font-mono text-[0.86em] text-void-ink">
          {token.slice(1, -1)}
        </code>,
      );
    } else if (m[2]) {
      out.push(
        <strong key={key} className="font-semibold text-void-ink">
          {inline(token.slice(2, -2), key)}
        </strong>,
      );
    } else if (m[3]) {
      out.push(<em key={key}>{inline(token.slice(1, -1), key)}</em>);
    } else if (m[4]) {
      const [, label, href] = /\[([^\]]+)\]\(([^)]+)\)/.exec(token) ?? [];
      out.push(
        <a key={key} href={href} className="focus-ring rounded text-void-ink underline underline-offset-4">
          {inline(label, key)}
        </a>,
      );
    }
    rest = rest.slice(m.index + token.length);
  }
  return out;
}

/* ------------------------------------------------------------------ blocks */

type Block =
  | { type: "heading"; level: number; text: string }
  | { type: "paragraph"; text: string }
  | { type: "rule" }
  | { type: "list"; ordered: boolean; items: string[] }
  | { type: "table"; head: string[]; rows: string[][] };

const cells = (line: string) =>
  line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((c) => c.trim());

function parse(source: string): Block[] {
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  const blocks: Block[] = [];
  let i = 0;
  const isItem = (l: string) => /^\s*([-*]|\d+\.)\s+/.test(l);

  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) {
      i++;
      continue;
    }
    if (/^---+\s*$/.test(line)) {
      blocks.push({ type: "rule" });
      i++;
      continue;
    }
    const heading = /^(#{1,6})\s+(.*)$/.exec(line);
    if (heading) {
      blocks.push({ type: "heading", level: heading[1].length, text: heading[2].trim() });
      i++;
      continue;
    }
    if (line.trim().startsWith("|") && /^\s*\|[\s:|-]+\|\s*$/.test(lines[i + 1] ?? "")) {
      const head = cells(line);
      const rows: string[][] = [];
      i += 2;
      while (i < lines.length && lines[i].trim().startsWith("|")) rows.push(cells(lines[i++]));
      blocks.push({ type: "table", head, rows });
      continue;
    }
    if (isItem(line)) {
      const ordered = /^\s*\d+\./.test(line);
      const items: string[] = [];
      while (i < lines.length && (isItem(lines[i]) || (/^\s{2,}\S/.test(lines[i]) && items.length))) {
        if (isItem(lines[i])) items.push(lines[i].replace(/^\s*([-*]|\d+\.)\s+/, ""));
        else items[items.length - 1] += ` ${lines[i].trim()}`;
        i++;
      }
      blocks.push({ type: "list", ordered, items });
      continue;
    }
    const para: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() &&
      !/^(#{1,6})\s/.test(lines[i]) &&
      !/^---+\s*$/.test(lines[i]) &&
      !isItem(lines[i]) &&
      !lines[i].trim().startsWith("|")
    ) {
      para.push(lines[i].trim());
      i++;
    }
    blocks.push({ type: "paragraph", text: para.join(" ") });
  }
  return blocks;
}

/* ------------------------------------------------------------------ render */

/** Symbols used in the STATES audit tables, centred and set in mono. */
const SYMBOL = /^(\+|–|-|!|n\/a)$/;

export function Markdown({ source }: { source: string }) {
  const blocks = parse(source);
  return (
    <div className="text-[15px] leading-[1.7] text-void-muted">
      {blocks.map((block, index) => {
        const key = `b-${index}`;
        switch (block.type) {
          case "heading": {
            const id = slugify(block.text);
            if (block.level === 1) {
              return (
                <h1 key={key} id={id} className="font-serif text-5xl font-normal tracking-[-0.01em] text-void-ink sm:text-6xl">
                  {inline(block.text, key)}
                </h1>
              );
            }
            const Tag = block.level === 2 ? "h2" : "h3";
            return (
              <Tag
                key={key}
                id={id}
                className={`group scroll-mt-20 text-void-ink ${
                  block.level === 2
                    ? "mt-14 text-2xl font-semibold tracking-tight"
                    : "mt-10 text-lg font-semibold tracking-tight"
                }`}
              >
                <a href={`#${id}`} className="focus-ring rounded">
                  {inline(block.text, key)}
                </a>
              </Tag>
            );
          }
          case "paragraph":
            return (
              <p key={key} className="mt-4">
                {inline(block.text, key)}
              </p>
            );
          case "rule":
            return <hr key={key} className="my-12 border-void-line" />;
          case "list": {
            const Tag = block.ordered ? "ol" : "ul";
            return (
              <Tag key={key} className={`mt-4 space-y-2 pl-5 ${block.ordered ? "list-decimal" : "list-disc"} marker:text-void-muted`}>
                {block.items.map((item, j) => (
                  <li key={`${key}-${j}`} className="pl-1">
                    {inline(item, `${key}-${j}`)}
                  </li>
                ))}
              </Tag>
            );
          }
          case "table": {
            // A column of audit symbols (+, –, !, n/a) is centred, header included.
            const centred = block.head.map((_, c) => block.rows.length > 0 && block.rows.every((row) => SYMBOL.test(row[c] ?? "")));
            return (
              <div key={key} className="-mx-4 mt-6 overflow-x-auto px-4 sm:mx-0 sm:px-0">
                <table className="w-full min-w-[560px] border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-[rgba(255,255,255,0.18)]">
                      {block.head.map((cell, j) => (
                        <th key={j} scope="col" className={`whitespace-nowrap py-2 pr-4 font-medium text-void-ink ${centred[j] ? "text-center" : ""}`}>
                          {inline(cell, `${key}-h${j}`)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {block.rows.map((row, r) => (
                      <tr key={r} className="border-b border-void-line align-top">
                        {row.map((cell, c) => (
                          <Fragment key={c}>
                            {c === 0 ? (
                              <th scope="row" className="py-2 pr-4 font-normal text-void-ink">
                                {inline(cell, `${key}-${r}-${c}`)}
                              </th>
                            ) : (
                              <td className={`py-2 pr-4 ${centred[c] ? "text-center font-mono" : ""}`}>
                                {inline(cell, `${key}-${r}-${c}`)}
                              </td>
                            )}
                          </Fragment>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          }
        }
      })}
    </div>
  );
}
