"use client";

import { useState } from "react";
import { FileText, Settings } from "lucide-react";
import { ChatMessage } from "@/components/ChatMessage";
import { ChatInput } from "@/components/Chatinput";
import { ConversationSidebar } from "@/components/ConversationSidebar";
import { DocumentUpload } from "@/components/DocumentUpload";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { uploadDocument } from "@/app/actions/uploadDocument";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface Conversation {
  id: string;
  title: string;
  createdAt: Date;
  messages: Message[];
}

interface UploadedDocument {
  id: string;
  name: string;
  size: number;
  status: "uploading" | "processing" | "ready" | "error";
}

export default function Index() {
  const [conversations, setConversations] = useState<Conversation[]>([
    {
      id: "1",
      title: "Document Analysis",
      createdAt: new Date(),
      messages: [
        { id: "1", role: "assistant", content: "Hello! I'm ready to help you analyze your documents. Upload a file or ask me anything about your knowledge base." },
      ],
    },
  ]);
  const [activeConversationId, setActiveConversationId] = useState<string>("1");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [documents, setDocuments] = useState<UploadedDocument[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);

  const activeConversation = conversations.find(
    (c) => c.id === activeConversationId
  );

  const handleNewConversation = () => {
    const newId = Date.now().toString();
    const newConversation: Conversation = {
      id: newId,
      title: "New Chat",
      createdAt: new Date(),
      messages: [
        { id: "1", role: "assistant", content: "Hello! How can I help you today?" },
      ],
    };
    setConversations([newConversation, ...conversations]);
    setActiveConversationId(newId);
  };

  const handleDeleteConversation = (id: string) => {
    setConversations(conversations.filter((c) => c.id !== id));
    if (activeConversationId === id && conversations.length > 1) {
      setActiveConversationId(conversations[0].id);
    }
  };

  const handleSendMessage = async (message: string) => {
    if (!activeConversation) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: message,
    };

    // Add user message
    setConversations(
      conversations.map((c) =>
        c.id === activeConversationId
          ? { ...c, messages: [...c.messages, userMessage] }
          : c
      )
    );

    // Simulate streaming response
    setIsStreaming(true);
    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content: "",
    };

    // Add empty assistant message
    setConversations(
      conversations.map((c) =>
        c.id === activeConversationId
          ? { ...c, messages: [...c.messages, userMessage, assistantMessage] }
          : c
      )
    );

    // Simulate streaming text
    const responseText = "This is a simulated response. In production, this would be connected to your RAG backend powered by LangGraph and Supabase, providing intelligent answers based on your uploaded documents.";

    for (let i = 0; i <= responseText.length; i++) {
      await new Promise((resolve) => setTimeout(resolve, 20));
      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeConversationId
            ? {
              ...c,
              messages: c.messages.map((m) =>
                m.id === assistantMessage.id
                  ? { ...m, content: responseText.slice(0, i) }
                  : m
              ),
            }
            : c
        )
      );
    }

    setIsStreaming(false);
  };

  const handleUploadDocuments = async (files: File[]) => {
    const newDocs: UploadedDocument[] = files.map((file) => ({
      id: Date.now().toString() + file.name,
      name: file.name,
      size: file.size,
      status: "uploading" as const,
    }));

    setDocuments((prev) => [...prev, ...newDocs]);

    for (const doc of newDocs) {
      const file = files.find(f => f.name === doc.name && f.size === doc.size);
      if (!file) continue;

      try {
        const formData = new FormData();
        formData.append("file", file);

        await uploadDocument(formData);

        setDocuments((prev) =>
          prev.map((d) =>
            d.id === doc.id ? { ...d, status: "ready" as const } : d
          )
        );
      } catch (error) {
        console.error("Upload error:", error);
        setDocuments((prev) =>
          prev.map((d) =>
            d.id === doc.id ? { ...d, status: "error" as const } : d
          )
        );
      }
    }
  };

  const handleRemoveDocument = (id: string) => {
    setDocuments(documents.filter((d) => d.id !== id));
  };

  return (
    <div className="h-screen flex bg-background text-foreground dark">
      {/* Sidebar */}
      <ConversationSidebar
        conversations={conversations}
        activeId={activeConversationId}
        onSelect={setActiveConversationId}
        onNew={handleNewConversation}
        onDelete={handleDeleteConversation}
        isCollapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-16 glass border-b border-border/50 flex items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="font-semibold text-foreground">RAG Assistant</h1>
              <p className="text-xs text-muted-foreground">
                {documents.filter((d) => d.status === "ready").length} documents loaded
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2 border border-primary/20 hover:bg-primary hover:text-primary-foreground transition-all duration-300 rounded-full px-4 font-medium">
                  <FileText className="w-4 h-4" />
                  Documents
                </Button>
              </SheetTrigger>
              <SheetContent className="glass border-border/50">
                <SheetHeader>
                  <SheetTitle>Knowledge Base</SheetTitle>
                </SheetHeader>
                <div className="mt-6">
                  <DocumentUpload
                    documents={documents}
                    onUpload={handleUploadDocuments}
                    onRemove={handleRemoveDocument}
                  />
                </div>
              </SheetContent>
            </Sheet>

            <Button variant="ghost" size="icon">
              <Settings className="w-5 h-5 text-muted-foreground" />
            </Button>
          </div>
        </header>

        {/* Messages */}
        <ScrollArea className="flex-1 p-6">
          <div className="max-w-3xl mx-auto space-y-4">
            {activeConversation?.messages.map((message, index) => (
              <ChatMessage
                key={message.id}
                role={message.role}
                content={message.content}
                isStreaming={
                  isStreaming &&
                  index === activeConversation.messages.length - 1 &&
                  message.role === "assistant"
                }
              />
            ))}
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="p-6 pt-0">
          <div className="max-w-3xl mx-auto">
            <ChatInput onSend={handleSendMessage} disabled={isStreaming} />
          </div>
        </div>
      </div>
    </div>
  );
}