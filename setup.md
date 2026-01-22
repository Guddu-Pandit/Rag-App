# RAG Assistant - Setup Guide

This guide documents all required API keys, environment variables, and configuration steps for running the RAG Assistant.

---

## 📋 Prerequisites

- **Node.js** 18.x or higher
- **npm** or **yarn**
- Access to the following services:
  - [Supabase](https://supabase.com) (for storage)
  - [Pinecone](https://pinecone.io) (for vector database)
  - [Google AI Studio](https://aistudio.google.com) (for Gemini API)
  - [LangSmith](https://smith.langchain.com) (optional, for tracing)

---

## 🔑 Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# ========================================
# Supabase Configuration
# ========================================
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
BUCKET_NAME=rag_app

# ========================================
# Pinecone Configuration
# ========================================
PINECONE_API_KEY=your_pinecone_api_key
PINECONE_INDEX=rag

# ========================================
# Google Gemini Configuration
# ========================================
GEMINI_API_KEY=your_gemini_api_key

# ========================================
# LangSmith Configuration (Optional)
# ========================================
LANGCHAIN_TRACING_V2=true
LANGCHAIN_API_KEY=your_langsmith_api_key
LANGCHAIN_PROJECT=Rag-App
```

---

## 📖 Variable Reference

| Variable | Required | Description |
|----------|:--------:|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Your Supabase project URL (e.g., `https://xxxx.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Public anonymous key for client-side requests |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Service role key for server-side operations (keep secret!) |
| `BUCKET_NAME` | ✅ | Supabase Storage bucket name (e.g., `rag_app`) |
| `PINECONE_API_KEY` | ✅ | API key from your Pinecone console |
| `PINECONE_INDEX` | ✅ | Name of your Pinecone index (e.g., `rag`) |
| `GEMINI_API_KEY` | ✅ | API key from Google AI Studio |
| `LANGCHAIN_TRACING_V2` | ❌ | Set to `true` to enable LangSmith tracing |
| `LANGCHAIN_API_KEY` | ❌ | API key from LangSmith |
| `LANGCHAIN_PROJECT` | ❌ | Project name for LangSmith traces |

---

## 🚀 Configuration Steps

### 1. Supabase Setup
1. Create a new project at [supabase.com](https://supabase.com).
2. Go to **Settings > API** and copy:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY`
3. Go to **Storage** and create a new bucket named `rag_app` (or your preferred name).
4. Set the bucket's policy to allow authenticated uploads.

### 2. Pinecone Setup
1. Create an account at [pinecone.io](https://pinecone.io).
2. Create a new **Serverless Index** with:
   - **Dimensions**: `768` (for Gemini embeddings)
   - **Metric**: `cosine`
3. Copy your API key and index name to `.env`.

### 3. Google Gemini Setup
1. Go to [Google AI Studio](https://aistudio.google.com).
2. Click **Get API Key** and create a new key.
3. Copy the key to `GEMINI_API_KEY`.

### 4. LangSmith Setup (Optional)
1. Sign up at [smith.langchain.com](https://smith.langchain.com).
2. Go to **Settings > API Keys** and create a new key.
3. Add the key and project name to your `.env`.

---

## ✅ Verify Configuration

After setting up your `.env`, run:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). If everything is configured correctly, you should be able to:
- Upload documents
- Ask questions in the chat
- See real-time "Thinking" and "Calling VectorSearch" status updates

---

## 🛠️ Troubleshooting

| Issue | Solution |
|-------|----------|
| `Pinecone index not found` | Verify `PINECONE_INDEX` matches your index name exactly |
| `Supabase upload fails` | Check storage bucket policies and `BUCKET_NAME` |
| `Gemini API error` | Ensure `GEMINI_API_KEY` is valid and has quota |
| `No LangSmith traces` | Verify `LANGCHAIN_TRACING_V2=true` and API key is correct |
