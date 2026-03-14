"use client";

import {
  useState,
  useRef,
  useEffect,
  useCallback,
  type KeyboardEvent,
  type FormEvent,
} from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import {
  Send,
  Bot,
  User,
  Sparkles,
  Globe,
  Copy,
  Check,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ──────────────────────────────────────────────────────

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
}

// ─── Constants ──────────────────────────────────────────────────

const SUGGESTED_QUESTIONS = [
  {
    text: "Compare Trino vs Denodo for our federation needs",
    icon: "🔀",
  },
  {
    text: "What semantic layer should NICE adopt?",
    icon: "🧊",
  },
  {
    text: "Latest news in data lakehouse technology",
    icon: "📰",
  },
  {
    text: "Build vs buy analysis for data catalog",
    icon: "🏗️",
  },
  {
    text: "Recommend a data quality tool for multi-tenant SaaS",
    icon: "✅",
  },
];

// ─── Main Component ─────────────────────────────────────────────

export function AssistantChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight, 200)}px`;
  }, [input]);

  // ─── Send Message ──────────────────────────────────────────────

  const sendMessage = useCallback(
    async (text?: string) => {
      const content = (text ?? input).trim();
      if (!content || isLoading) return;

      const userMsg: ChatMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        content,
      };

      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: "",
        isStreaming: true,
      };

      const updatedMessages = [...messages, userMsg];
      setMessages([...updatedMessages, assistantMsg]);
      setInput("");
      setIsLoading(true);
      setIsSearching(false);

      try {
        const res = await fetch("/api/assistant/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: updatedMessages.map((m) => ({
              role: m.role,
              content: m.content,
            })),
          }),
        });

        if (!res.ok) throw new Error("Failed to start chat");

        const reader = res.body?.getReader();
        if (!reader) throw new Error("No response body");

        const decoder = new TextDecoder();
        let buffer = "";
        let accumulated = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          const lines = buffer.split("\n\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const jsonStr = line.slice(6);
            try {
              const event = JSON.parse(jsonStr);

              if (event.type === "text") {
                accumulated += event.text;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantMsg.id
                      ? { ...m, content: accumulated }
                      : m
                  )
                );
              } else if (event.type === "tool_start" || event.type === "tool_use") {
                setIsSearching(true);
              } else if (event.type === "done") {
                setIsSearching(false);
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantMsg.id
                      ? { ...m, isStreaming: false }
                      : m
                  )
                );
              } else if (event.type === "error") {
                accumulated += `\n\n*Error: ${event.error}*`;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantMsg.id
                      ? { ...m, content: accumulated, isStreaming: false }
                      : m
                  )
                );
              }
            } catch {
              // Skip malformed JSON
            }
          }
        }

        // Finalize if stream ended without explicit done event
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsg.id
              ? { ...m, content: accumulated || "No response received.", isStreaming: false }
              : m
          )
        );
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : "Unknown error";
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsg.id
              ? { ...m, content: `Sorry, something went wrong: ${errMsg}`, isStreaming: false }
              : m
          )
        );
      } finally {
        setIsLoading(false);
        setIsSearching(false);
        textareaRef.current?.focus();
      }
    },
    [input, isLoading, messages]
  );

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    sendMessage();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      sendMessage();
    }
  };

  const isEmpty = messages.length === 0;

  // ─── Render ───────────────────────────────────────────────────

  return (
    <div className="flex h-[calc(100vh-7rem)] flex-col">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-navy">AI Assistant</h1>
          <p className="mt-1 text-navy-400">
            Ask questions about vendors, categories, and data platforms
          </p>
        </div>
        {isSearching && (
          <div className="flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue">
            <Globe size={12} className="animate-spin" />
            Searching the web…
          </div>
        )}
      </div>

      {/* Messages Area */}
      <div
        ref={scrollAreaRef}
        className="flex-1 overflow-y-auto rounded-xl border border-navy-100 bg-white shadow-sm"
      >
        {isEmpty ? (
          <EmptyState onSelectQuestion={sendMessage} />
        ) : (
          <div className="p-6 space-y-6">
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area */}
      <form onSubmit={handleSubmit} className="mt-4 flex items-end gap-3">
        <div className="relative flex-1">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about vendors, categories, pricing..."
            rows={1}
            disabled={isLoading}
            className={cn(
              "w-full resize-none rounded-xl border border-navy-100 bg-white py-3 pl-4 pr-12 text-sm leading-relaxed",
              "placeholder:text-navy-300 focus:border-blue focus:outline-none focus:ring-1 focus:ring-blue",
              "disabled:opacity-50"
            )}
          />
          <div className="absolute bottom-2 right-2 flex items-center gap-1">
            <span className="hidden text-[9px] text-navy-200 sm:inline">
              {isLoading ? "" : "⌘↵"}
            </span>
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className={cn(
                "nav-transition rounded-lg p-2 text-white",
                input.trim() && !isLoading
                  ? "bg-blue hover:bg-blue-700"
                  : "bg-navy-200 cursor-not-allowed"
              )}
            >
              <Send size={14} />
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

// ─── Empty State with Suggestions ───────────────────────────────

function EmptyState({
  onSelectQuestion,
}: {
  onSelectQuestion: (text: string) => void;
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center px-6 py-16">
      <div className="rounded-2xl bg-gradient-to-br from-blue-50 to-accent-50 p-4">
        <Bot className="h-10 w-10 text-blue" />
      </div>
      <h2 className="mt-5 text-lg font-semibold text-navy">
        NICE DP Assistant
      </h2>
      <p className="mt-2 max-w-md text-center text-sm text-navy-400">
        I can help you explore vendor data, compare platforms, analyze pricing,
        review recent news, and answer questions about data platform
        technologies.
      </p>

      {/* Suggested questions carousel */}
      <div className="mt-8 w-full max-w-2xl">
        <div className="mb-3 flex items-center gap-1.5 justify-center">
          <Sparkles size={12} className="text-amber-500" />
          <span className="text-[10px] font-semibold uppercase tracking-wider text-navy-300">
            Suggested questions
          </span>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {SUGGESTED_QUESTIONS.map((q) => (
            <button
              key={q.text}
              onClick={() => onSelectQuestion(q.text)}
              className={cn(
                "nav-transition group flex min-w-[220px] flex-shrink-0 items-start gap-3",
                "rounded-xl border border-navy-100 bg-navy-50/40 p-4 text-left",
                "hover:border-blue/30 hover:bg-blue-50/40 hover:shadow-sm"
              )}
            >
              <span className="text-lg">{q.icon}</span>
              <div className="flex-1">
                <p className="text-xs font-medium text-navy leading-relaxed">
                  {q.text}
                </p>
                <div className="mt-2 flex items-center gap-1 text-[10px] text-navy-300 group-hover:text-blue">
                  Ask this
                  <ChevronRight size={10} />
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Message Bubble ─────────────────────────────────────────────

function MessageBubble({ message }: { message: ChatMessage }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="flex max-w-[75%] items-start gap-3">
          <div className="rounded-2xl rounded-br-md bg-blue px-4 py-3 text-sm text-white leading-relaxed">
            {message.content}
          </div>
          <div className="mt-1 flex-shrink-0 rounded-full bg-blue p-1.5">
            <User size={14} className="text-white" />
          </div>
        </div>
      </div>
    );
  }

  // Assistant message
  return (
    <div className="flex justify-start">
      <div className="flex max-w-[85%] items-start gap-3">
        <div className="mt-1 flex-shrink-0 rounded-full bg-blue-50 p-1.5">
          <Bot size={14} className="text-blue" />
        </div>
        <div className="group relative min-w-0">
          <div className="rounded-2xl rounded-bl-md bg-navy-50/60 px-4 py-3 text-sm text-navy leading-relaxed">
            {message.isStreaming && !message.content ? (
              <TypingIndicator />
            ) : (
              <div className="assistant-markdown prose prose-sm max-w-none">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeHighlight]}
                  components={{
                    // Style code blocks
                    pre({ children, ...props }) {
                      return (
                        <pre
                          className="overflow-x-auto rounded-lg bg-navy-900 p-3 text-xs text-navy-100"
                          {...props}
                        >
                          {children}
                        </pre>
                      );
                    },
                    code({ className, children, ...props }) {
                      const isInline = !className;
                      if (isInline) {
                        return (
                          <code
                            className="rounded bg-navy-100 px-1 py-0.5 text-xs font-mono text-navy-700"
                            {...props}
                          >
                            {children}
                          </code>
                        );
                      }
                      return (
                        <code className={className} {...props}>
                          {children}
                        </code>
                      );
                    },
                    // Tables
                    table({ children, ...props }) {
                      return (
                        <div className="overflow-x-auto my-3">
                          <table
                            className="min-w-full border-collapse text-xs"
                            {...props}
                          >
                            {children}
                          </table>
                        </div>
                      );
                    },
                    th({ children, ...props }) {
                      return (
                        <th
                          className="border border-navy-200 bg-navy-100 px-3 py-1.5 text-left font-semibold text-navy"
                          {...props}
                        >
                          {children}
                        </th>
                      );
                    },
                    td({ children, ...props }) {
                      return (
                        <td
                          className="border border-navy-100 px-3 py-1.5 text-navy-600"
                          {...props}
                        >
                          {children}
                        </td>
                      );
                    },
                    // Links
                    a({ children, href, ...props }) {
                      return (
                        <a
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue hover:underline"
                          {...props}
                        >
                          {children}
                        </a>
                      );
                    },
                  }}
                >
                  {message.content}
                </ReactMarkdown>
              </div>
            )}
            {message.isStreaming && message.content && <StreamingCursor />}
          </div>

          {/* Copy button */}
          {!message.isStreaming && message.content && (
            <button
              onClick={handleCopy}
              className="nav-transition absolute -right-8 top-2 rounded-md p-1 text-navy-200 opacity-0 hover:text-navy group-hover:opacity-100"
              title="Copy"
            >
              {copied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Typing Indicator ───────────────────────────────────────────

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 py-1">
      <span className="h-1.5 w-1.5 rounded-full bg-navy-300 animate-[pulse-dot_1.4s_ease-in-out_infinite]" />
      <span className="h-1.5 w-1.5 rounded-full bg-navy-300 animate-[pulse-dot_1.4s_ease-in-out_0.2s_infinite]" />
      <span className="h-1.5 w-1.5 rounded-full bg-navy-300 animate-[pulse-dot_1.4s_ease-in-out_0.4s_infinite]" />
    </div>
  );
}

function StreamingCursor() {
  return (
    <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-navy-400 align-text-bottom" />
  );
}
