# Gemini Studio Chat

A full-featured, ChatGPT-style Gemini chatbot with multi-session memory, document + image uploads, and floating preview windows.

## Tech Stack
- Frontend: React 19, Vite, Tailwind CSS v4, Framer Motion, Lucide React, React Markdown
- Backend: Node.js, Express, Multer, pdf-parse, @google/generative-ai

## Setup

### 1) Backend

```bash
git clone https://github.com/I-XaR-I/Gemini-Chatbot.git
cd Gemini-Chatbot
cd server
npm install
```

Create an `.env` file in `server` (use `.env.example` as a reference):

```bash
PORT=3001
CORS_ORIGIN=http://localhost:5173
GEMINI_FALLBACK_MODEL=gemini-2.5-flash
```

Start the server:

```bash
npm run dev
```

### 2) Frontend

```bash
cd client
npm install
```

Optional: set `VITE_API_URL` in `client/.env` if your server uses a different URL.
The Gemini API key is entered in the UI and stored locally in the browser.

Start the client:

```bash
npm run dev
```

Open http://localhost:5173

## Features
- Multiple chat sessions with a collapsible sidebar
- In-memory chat history per `chatId`
- PDF/TXT extraction and image uploads stored in memory
- Animated floating preview windows for images, PDFs, and TXT files
- Client-side API key storage with onboarding modal
- Dynamic Gemini model selection
- Typing indicator and upload spinners

## API Endpoints
- `GET /api/models` - List available Gemini models (requires API key header)
- `POST /api/chat` - Send a message to Gemini
- `POST /api/upload/document` - Upload PDF/TXT
- `POST /api/upload/image` - Upload PNG/JPG
