# 🤖 RAG Assistant

A modern **Retrieval-Augmented Generation (RAG)** chatbot built with Next.js 16, LangGraph, Pinecone, and Google Gemini. Upload documents to build your knowledge base and chat with AI that answers based on your content.

## ✨ Features

- **📄 Document Upload** - Support for PDF, TXT, and DOCX files
- **🧠 Smart RAG Pipeline** - LangGraph-powered workflow with vector similarity search
- **💬 Multi-Conversation Support** - Create, switch, and manage multiple chat sessions
- **🎨 Premium Dark UI** - Sleek glassmorphism design with teal accents
- **⚡ Real-time Streaming** - Smooth typing animation for responses
- **💾 Persistent Storage** - Conversations saved to localStorage

## 🛠️ Tech Stack

| Category | Technology |
|----------|------------|
| **Framework** | Next.js 16 (App Router) |
| **AI/LLM** | Google Gemini 2.5 Flash |
| **Orchestration** | LangGraph |
| **Vector DB** | Pinecone |
| **Storage** | Supabase |
| **Styling** | Tailwind CSS 4 |
| **Components** | Radix UI + Lucide Icons |

## 🚀 Quick Start

### 1. Clone & Install

```bash
git clone https://github.com/Guddu-Pandit/Rag-App.git
cd Rag-App
npm install
```

### 2. Configure Environment

Create a `.env` file in the root directory:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
BUCKET_NAME=rag_app

# Pinecone
PINECONE_API_KEY=your_pinecone_api_key
PINECONE_INDEX=rag

# Google Gemini
GEMINI_APT_KEY=your_gemini_api_key
```

### Environment Variables Reference

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (for server-side operations) |
| `BUCKET_NAME` | Supabase storage bucket name for documents |
| `PINECONE_API_KEY` | Your Pinecone API key |
| `PINECONE_INDEX` | Pinecone index name for vector storage |
| `GEMINI_APT_KEY` | Google Gemini API key for LLM and embeddings |

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to start chatting!

## 📁 Project Structure

```
ragapp/
├── app/
│   ├── api/
│   │   ├── chat/          # Chat endpoint
│   │   ├── documents/     # Document CRUD
│   │   └── upload/        # File upload handler
│   └── page.tsx           # Main chat interface
├── components/
│   ├── ChatInput.tsx      # Message input
│   ├── ChatMessage.tsx    # Message display
│   ├── ConversationSidebar.tsx
│   └── DocumentUpload.tsx
└── lib/
    ├── embeddings.ts      # Gemini embeddings
    ├── langgraph.ts       # RAG workflow
    ├── pinecone.ts        # Vector DB client
    └── supabase.ts        # Storage client
```

## 🔧 How It Works

1. **Upload** → Documents are stored in Supabase and chunked using LangChain
2. **Embed** → Text chunks are converted to vectors using Gemini Embeddings
3. **Index** → Vectors are stored in Pinecone for fast similarity search
4. **Query** → User questions retrieve relevant context via LangGraph
5. **Generate** → Gemini generates answers grounded in your documents

## 📄 License

MIT

---

Developed with ❤️ by [Guddu-Pandit](https://github.com/Guddu-Pandit)
