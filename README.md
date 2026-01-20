# Premium RAG Assistant

A state-of-the-art Retrieval-Augmented Generation (RAG) assistant built with Next.js, featuring a premium dark theme, Supabase integration, and Pinecone vector search.

![Design Preview](https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/www/public/og.png) <!-- Placeholder for actual screenshot if available -->

## 🚀 Features

- **Document Knowledge Base**: Upload PDFs and text files directly to a dedicated knowledge base.
- **Advanced RAG Pipeline**:
  - **Vector Storage**: Leverages Pinecone for high-performance similarity search.
  - **Cloud Storage**: Uses Supabase Storage for reliable document persistence.
  - **Smart Chunking**: LangChain-powered text splitting for optimal context retrieval.
  - **Gemini Embeddings**: Utilizes Google Gemini `embedding-004` for state-of-the-art semantic understanding.
- **Premium UI/UX**:
  - Deep Dark Navy aesthetic with teal glassmorphism.
  - Smooth micro-animations and responsive layouts.
  - Interactive chat interface with streaming message support.

## 🛠️ Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (Turbopack)
- **Database**: [Supabase](https://supabase.com/)
- **Vector DB**: [Pinecone](https://www.pinecone.io/)
- **AI Models**: Google Gemini Pro & Gemini Embeddings
- **Styling**: Tailwind CSS 4
- **Components**: Shadcn UI & Lucide Icons

## ⚙️ Setup

### 1. Environment Variables

Create a `.env` file in the root directory and add the following:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
BUCKET_NAME=rag_app

# Pinecone
PINECONE_API_KEY=your_pinecone_api_key
PINECONE_INDEX=rag

# Google Gemini
GEMINI_APT_KEY=your_gemini_api_key
```

### 2. Installation

```bash
npm install
```

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) (or the port shown in console) to see the result.

## 📄 License

MIT
