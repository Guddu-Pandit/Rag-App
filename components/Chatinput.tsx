"use client";

import { useState, useRef } from "react";
import { Paperclip, Send, X, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface ChatInputProps {
    onSend: (message: string) => void;
    disabled?: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
    const [message, setMessage] = useState("");
    const [files, setFiles] = useState<File[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleSend = () => {
        if ((message.trim() || files.length > 0) && !disabled) {
            onSend(message);
            setMessage("");
            setFiles([]);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFiles([...files, ...Array.from(e.target.files)]);
        }
    };

    const removeFile = (index: number) => {
        setFiles(files.filter((_, i) => i !== index));
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="relative group">
            {/* Attached Files */}
            {files.length > 0 && (
                <div className="absolute bottom-full mb-3 flex flex-wrap gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    {files.map((file, i) => (
                        <div
                            key={i}
                            className="flex items-center gap-2 bg-[#1e293b]/90 backdrop-blur-md border border-white/5 pl-3 pr-1.5 py-1.5 rounded-full shadow-lg transition-transform hover:scale-105"
                        >
                            <FileText className="w-4 h-4 text-[#2dd4bf]" />
                            <span className="text-xs font-medium text-white/90 truncate max-w-[150px]">
                                {file.name}
                            </span>
                            <button
                                onClick={() => removeFile(i)}
                                className="w-5 h-5 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors group/btn"
                            >
                                <X className="w-3 h-3 text-white/40 group-hover/btn:text-white" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Input Box */}
            <div className="relative bg-card/80 backdrop-blur-xl border border-white/5 rounded-[24px] p-3 pl-5 shadow-2xl shadow-[0_0_15px_rgba(45,45,45,0.2)] transition-all duration-300 group-focus-within:border-[#2dd4bf]/30">
                <div className="flex items-end gap-2">
                    <input
                        type="file"
                        multiple
                        className="hidden"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                    />
                    {/* <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => fileInputRef.current?.click()}
                        className="h-10 w-10 text-white/40 hover:text-[#2dd4bf] hover:bg-white/5 rounded-full flex-shrink-0 transition-colors"
                    >
                        <Paperclip className="h-5 w-5" />
                    </Button> */}

                    <Textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Ask anything about your documents..."
                        className="min-h-[44px] max-h-[40px] border-0 focus-visible:ring-0 bg-transparent py-2.5 resize-none text-white placeholder:text-white/20"
                        disabled={disabled}
                    />

                    <Button
                        onClick={handleSend}
                        disabled={(!message.trim() && files.length === 0) || disabled}
                        className={cn(
                            "h-12 w-12 rounded-md flex-shrink-0 transition-all duration-300",
                            message.trim() || files.length > 0
                                ? "bg-[#2dd4bf]/20 text-[#2dd4bf] hover:bg-[#2dd4bf]/30 scale-100 shadow-[0_0_15px_rgba(45,212,191,0.2)]"
                                : "bg-white/5 text-white/20 scale-95"
                        )}
                    >
                        <Send className="h-7 w-7 fontsize-10px" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
