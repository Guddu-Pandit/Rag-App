import { useState, useCallback } from "react";
import { Upload, FileText, X, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface UploadedDocument {
    id: string;
    name: string;
    size: number;
    status: "uploading" | "processing" | "ready" | "error" | "deleting";
}

interface DocumentUploadProps {
    documents: UploadedDocument[];
    onUpload: (files: File[]) => void;
    onRemove: (id: string) => void;
}

export function DocumentUpload({ documents, onUpload, onRemove }: DocumentUploadProps) {
    const [isDragging, setIsDragging] = useState(false);

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            setIsDragging(false);
            const files = Array.from(e.dataTransfer.files);
            onUpload(files);
        },
        [onUpload]
    );

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback(() => {
        setIsDragging(false);
    }, []);

    const formatSize = (bytes: number) => {
        if (bytes < 1024) return bytes + " B";
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
        return (bytes / (1024 * 1024)).toFixed(1) + " MB";
    };

    return (
        <div className="space-y-6">
            <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={cn(
                    "border-2 border-dashed rounded-[20px] p-12 text-center transition-all cursor-pointer relative overflow-hidden group",
                    isDragging
                        ? "border-[#2dd4bf] bg-[#2dd4bf]/5"
                        : "border-[#2dd4bf]/20 hover:border-[#2dd4bf]/40 bg-[#0f172a]/40"
                )}
            >
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#2dd4bf]/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                <input
                    type="file"
                    multiple
                    accept=".pdf,.doc,.docx,.txt,.md"
                    className="hidden"
                    id="file-upload"
                    onChange={(e) => {
                        if (e.target.files) {
                            onUpload(Array.from(e.target.files));
                        }
                    }}
                />
                <label htmlFor="file-upload" className="cursor-pointer relative z-10 block">
                    <div className="w-16 h-16 bg-[#1e293b] rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/5 shadow-xl">
                        <Upload className="w-8 h-8 text-[#2dd4bf]" />
                    </div>
                    <p className="text-foreground font-semibold text-lg tracking-tight">
                        Drop files here or click to upload
                    </p>
                    <p className="text-sm text-muted-foreground/60 mt-2 font-medium">
                        PDF, DOC, DOCX, TXT, MD up to 10MB
                    </p>
                </label>
            </div>

            {documents.length > 0 && (
                <div className="space-y-4">
                    <h3 className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-[0.2em] pl-1">
                        UPLOADED ASSETS
                    </h3>
                    <div className="space-y-2">
                        {documents.map((doc) => (
                            <div
                                key={doc.id}
                                className={cn(
                                    "flex items-center gap-3 p-4 bg-[#0f172a]/80 border border-white/5 rounded-2xl transition-all hover:bg-[#0f172a]/100 group shadow-sm",
                                    doc.status === "deleting" && "opacity-50 grayscale-[0.5]"
                                )}
                            >
                                <div className="w-10 h-10 bg-[#1e293b] rounded-xl flex items-center justify-center border border-white/5">
                                    <FileText className={cn("w-5 h-5", doc.status === "deleting" ? "text-red-400" : "text-[#2dd4bf]")} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold truncate text-foreground/90">{doc.name}</p>
                                    <p className="text-xs text-muted-foreground/50 mt-0.5">
                                        {formatSize(doc.size)}
                                    </p>
                                </div>
                                <div className="flex items-center gap-3">
                                    {doc.status === "ready" && (
                                        <CheckCircle2 className="w-5 h-5 text-emerald-500 fill-emerald-500/10" />
                                    )}
                                    {doc.status === "uploading" && (
                                        <div className="w-4 h-4 border-2 border-[#2dd4bf] border-t-transparent rounded-full animate-spin" />
                                    )}
                                    {doc.status === "processing" && (
                                        <span className="text-[10px] font-bold text-[#2dd4bf] uppercase tracking-tighter animate-pulse">Processing</span>
                                    )}
                                    {doc.status === "deleting" && (
                                        <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                                    )}
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => onRemove(doc.id)}
                                        disabled={doc.status === "deleting" || doc.status === "uploading"}
                                        className={cn(
                                            "h-8 w-8 text-white/20 hover:text-white/60 hover:bg-white/5 rounded-lg transition-all",
                                            doc.status === "deleting" && "text-red-500/50"
                                        )}
                                    >
                                        <X className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
