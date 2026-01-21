import React from "react";
import { Bot, User } from "lucide-react";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface ChatMessageProps {
    role: "user" | "assistant";
    content: string;
    isStreaming?: boolean;
}

export function ChatMessage({ role, content, isStreaming }: ChatMessageProps) {
    const isUser = role === "user";

    return (
        <div
            className={cn(
                "flex gap-4 p-5 rounded-[20px] transition-all duration-300",
                isUser ? "bg-muted/30 border border-white/5" : "bg-card border border-[#2dd4bf]/10 shadow-lg"
            )}
        >
            <div
                className={cn(
                    "flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center shadow-inner",
                    isUser ? "bg-[#1f2937] text-muted-foreground" : "bg-[#1e293b] text-[#2dd4bf]"
                )}
            >
                {isUser ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
            </div>
            <div className="flex-1 space-y-1.5 overflow-hidden">
                <p className="text-xs font-semibold text-muted-foreground/70 uppercase tracking-wider">
                    {isUser ? "You" : "Assistant"}
                </p>
                <div className="text-[15px] leading-relaxed text-foreground/90 whitespace-pre-wrap">
                    {!isUser && content === "" && isStreaming ? (
                        <span className="flex items-center gap-1.5 text-muted-foreground italic">
                            Thinking
                            <span className="flex gap-0.5">
                                <span className="w-1 h-1 bg-current rounded-full animate-bounce [animation-delay:-0.3s]" />
                                <span className="w-1 h-1 bg-current rounded-full animate-bounce [animation-delay:-0.15s]" />
                                <span className="w-1 h-1 bg-current rounded-full animate-bounce" />
                            </span>
                        </span>
                    ) : (
                        <div className="prose prose-sm dark:prose-invert max-w-none break-words prose-p:leading-relaxed prose-pre:bg-gray-900 prose-pre:border prose-pre:border-white/10">
                            <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                components={{
                                    img: ({ node, ...props }) => {
                                        if (props.src === "cursor" && props.alt === "cursor") {
                                            return (
                                                <span className="inline-block w-2 h-4 ml-1 bg-[#2dd4bf] animate-pulse rounded-sm align-middle" />
                                            );
                                        }
                                        /* eslint-disable-next-line @next/next/no-img-element */
                                        return <img {...props} />;
                                    },
                                    code: ({ node, inline, className, children, ...props }: any) => {
                                        if (Array.isArray(children)) {
                                            return (
                                                <code className={className} {...props}>
                                                    {children.map((child, index) => {
                                                        if (typeof child === 'string' && child.includes('![cursor](cursor)')) {
                                                            const parts = child.split('![cursor](cursor)');
                                                            return (
                                                                <React.Fragment key={index}>
                                                                    {parts.map((part, i) => (
                                                                        <React.Fragment key={i}>
                                                                            {part}
                                                                            {i < parts.length - 1 && (
                                                                                <span className="inline-block w-2 h-4 ml-1 bg-[#2dd4bf] animate-pulse rounded-sm align-middle" />
                                                                            )}
                                                                        </React.Fragment>
                                                                    ))}
                                                                </React.Fragment>
                                                            );
                                                        }
                                                        return child;
                                                    })}
                                                </code>
                                            );
                                        }
                                        return <code className={className} {...props}>{children}</code>;
                                    }
                                }}
                            >
                                {content + (isStreaming ? "![cursor](cursor)" : "")}
                            </ReactMarkdown>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
