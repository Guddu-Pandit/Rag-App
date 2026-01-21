# 🤖 RAG Assistant

A modern **Retrieval-Augmented Generation (RAG)** chatbot built with Next.js 16, LangGraph, Pinecone, and Google Gemini. Upload documents to build your knowledge base and chat with AI that answers based on your content.

<div>

![Modern Dashboard](https://img.shields.io/badge/UI-Premium-success)
![AI Powered](https://img.shields.io/badge/AI-Google_Gemini-blue)
![Database](https://img.shields.io/badge/DB-Supabase_%26_Pinecone-green)

</div>

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


```mermaid
graph TD
    A[📄 User Upload] -->|Chunk & Store| B[🗄️ Supabase Storage]
    A -->|Embed| C[⚡ Gemini Embeddings]
    C -->|Vector Index| D[🌲 Pinecone DB]
    E[👤 User Query] -->|Search| D
    D -->|Retrieve Context| F[🧠 LangGraph Workflow]
    F -->|Generate Answer| G[🤖 Gemini AI]
```

1. **📥 Ingestion** → Upload documents (PDF, Docx) which are securely stored in Supabase.
2. **🧩 Processing** → Text is chunked and converted into vector embeddings.
3. **💾 Indexing** → High-dimensional vectors are stored in Pinecone for semantic search.
4. **🔍 Retrieval** → LangGraph orchestrates the search for relevant context.
5. **✨ Generation** → Gemini synthesizes the ANSWER using your specific data.


## 🧠 LangGraph Workflow

The intelligent orchestration layer manages the conversation flow:

```mermaid
graph TD
    Start([Start]) --> Decide{Decide Action}
    Decide -->|"Need Context"| Retrieve[🔍 Retrieve Nodes]
    Decide -->|"General Chat"| Generate[✨ Generate Answer]
    
    Retrieve --> Generate
    Generate --> Validate{Validate Answer}
    
    Validate -->|"Valid"| End([End])
    Validate -->|"Invalid (Max 3)"| End
    Validate -->|"Invalid"| Decide
```

1. **Decide Node**: Analyzes the query to determine if retrieval is needed (e.g., specific facts) or if it can be answered directly (e.g., greetings).
2. **Retrieve Node**: Fetches specialized context from Pinecone if required.
3. **Generate Node**: Produces an answer using Gemini 2.5 Flash.
4. **Validate Node**: Self-reflects on the answer to ensure it is factually correct and grounded in the context. If not, it loops back to retry (up to 3 times).

## 📄 License
This project is licensed under the ISC License.

---

Developed with ❤️ by [Guddu-Pandit](https://github.com/Guddu-Pandit)
