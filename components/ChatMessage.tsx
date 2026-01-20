import { Bot, User } from "lucide-react";
import { cn } from "@/lib/utils";

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
                        <>
                            {content}
                            {isStreaming && (
                                <span className="inline-block w-2 h-4 ml-1 bg-[#2dd4bf] animate-pulse rounded-sm" />
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
