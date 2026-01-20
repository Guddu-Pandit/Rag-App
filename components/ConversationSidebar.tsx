import { useState } from "react";
import { Plus, MessageSquare, Trash2, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface Conversation {
    id: string;
    title: string;
    createdAt: Date;
}

interface ConversationSidebarProps {
    conversations: Conversation[];
    activeId: string | null;
    onSelect: (id: string) => void;
    onNew: () => void;
    onDelete: (id: string) => void;
    isCollapsed: boolean;
    onToggle: () => void;
}

export function ConversationSidebar({
    conversations,
    activeId,
    onSelect,
    onNew,
    onDelete,
    isCollapsed,
    onToggle,
}: ConversationSidebarProps) {
    const [hoveredId, setHoveredId] = useState<string | null>(null);

    return (
        <div
            className={cn(
                "h-full bg-[#0a0f1d] border-r border-white/5 flex flex-col transition-all duration-300 shadow-xl",
                isCollapsed ? "w-16" : "w-72"
            )}
        >
            <div className="p-4 flex items-center justify-between">
                {!isCollapsed && (
                    <h2 className="font-semibold text-foreground/90 tracking-tight">Conversations</h2>
                )}
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onToggle}
                    className="text-muted-foreground hover:text-foreground hover:bg-white/5"
                >
                    <ChevronLeft
                        className={cn(
                            "w-5 h-5 transition-transform duration-300",
                            isCollapsed && "rotate-180"
                        )}
                    />
                </Button>
            </div>

            <div className="p-3">
                <Button
                    onClick={onNew}
                    className={cn(
                        "w-full bg-[#111827] hover:bg-[#1a2333] text-[#2dd4bf] border border-[#2dd4bf]/20 rounded-xl transition-all duration-200 shadow-[0_0_15px_rgba(45,45,45,0.2)] font-medium",
                        isCollapsed && "px-0"
                    )}
                >
                    <Plus className="w-4 h-4" />
                    {!isCollapsed && <span className="ml-2">New Chat</span>}
                </Button>
            </div>

            <ScrollArea className="flex-1 px-3">
                <div className="space-y-1 pb-4">
                    {conversations.map((conv) => (
                        <div
                            key={conv.id}
                            onMouseEnter={() => setHoveredId(conv.id)}
                            onMouseLeave={() => setHoveredId(null)}
                            onClick={() => onSelect(conv.id)}
                            className={cn(
                                "group flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200",
                                activeId === conv.id
                                    ? "bg-[#162731] text-[#2dd4bf] border border-[#2dd4bf]/10"
                                    : "hover:bg-white/5 text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <MessageSquare className={cn(
                                "w-4 h-4 flex-shrink-0",
                                activeId === conv.id ? "text-[#2dd4bf]" : "text-muted-foreground"
                            )} />
                            {!isCollapsed && (
                                <>
                                    <span className="flex-1 truncate text-sm font-medium">{conv.title}</span>
                                    {(hoveredId === conv.id || activeId === conv.id) && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onDelete(conv.id);
                                            }}
                                            className="text-muted-foreground/50 hover:text-destructive transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </>
                            )}
                        </div>
                    ))}
                </div>
            </ScrollArea>
        </div>
    );
}
