import { motion } from "framer-motion";
import { useState, type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import type { Attachment, Message } from "../types";

type MessageBubbleProps = {
  message: Message;
  onPreview: (attachment: Attachment) => void;
};

type CodeBlockProps = {
  className?: string;
  children?: ReactNode;
};

function CodeBlock({ className, children, ...props }: CodeBlockProps) {
  const match = /language-(\w+)/.exec(className ?? "");
  const language = match?.[1];

  if (!language) {
    return (
      <code
        className="rounded bg-slate-200 px-1 py-0.5 text-[0.85em] text-rose-600"
        {...props}
      >
        {children}
      </code>
    );
  }

  const [copied, setCopied] = useState(false);
  const raw = String(children).replace(/\n$/, "");

  return (
    <div className="relative overflow-hidden rounded-md border border-slate-200 bg-slate-950/90">
      <button
        onClick={async () => {
          await navigator.clipboard.writeText(raw);
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1200);
        }}
        className="absolute right-3 top-3 rounded-full border border-slate-700/60 bg-slate-900/80 px-3 py-1 text-xs text-slate-200 transition hover:border-slate-400"
      >
        {copied ? "Copied" : "Copy Code"}
      </button>
      <SyntaxHighlighter
        style={vscDarkPlus}
        language={language}
        customStyle={{ margin: 0, background: "transparent" }}
        codeTagProps={{ style: { fontSize: "0.85rem" } }}
      >
        {raw}
      </SyntaxHighlighter>
    </div>
  );
}

export default function MessageBubble({ message, onPreview }: MessageBubbleProps) {
  const isUser = message.role === "user";

  const MarkdownContent = () => (
    <ReactMarkdown
      remarkPlugins={[remarkGfm, remarkMath]}
      rehypePlugins={[rehypeKatex]}
      className="space-y-4 text-sm leading-relaxed text-slate-900"
      components={{
        p: ({ children }) => <p className="leading-relaxed text-slate-900">{children}</p>,
        hr: () => <hr className="my-6 border-slate-200" />,
        table: ({ children }) => (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-slate-200 text-xs">
              {children}
            </table>
          </div>
        ),
        th: ({ children }) => (
          <th className="border border-slate-200 bg-slate-100 px-4 py-2 text-left font-semibold">
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td className="border border-slate-200 px-4 py-2 text-slate-700">{children}</td>
        ),
        code: CodeBlock,
      }}
    >
      {message.content}
    </ReactMarkdown>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={`flex ${isUser ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`max-w-[80%] rounded-3xl px-5 py-4 shadow-lg ring-1 ring-black/5 ${
          isUser
            ? "bg-[color:var(--accent)] text-white"
            : "bg-white/95 text-slate-900"
        }`}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>
        ) : (
          <MarkdownContent />
        )}

        {message.attachments && message.attachments.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {message.attachments.map((attachment) => (
              <button
                key={attachment.id}
                onClick={() => onPreview(attachment)}
                className={`rounded-full border px-3 py-1 text-xs transition ${
                  isUser
                    ? "border-white/40 text-white hover:border-white"
                    : "border-slate-200 text-slate-600 hover:border-slate-300"
                }`}
              >
                {attachment.name}
              </button>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
