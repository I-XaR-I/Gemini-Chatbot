import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import multer from "multer";
import pdfParse from "pdf-parse";
import crypto from "crypto";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

const app = express();
const port = process.env.PORT ? Number(process.env.PORT) : 3001;

app.use(
  cors({
    origin: process.env.CORS_ORIGIN ?? "http://localhost:5173",
  })
);
app.use(express.json({ limit: "10mb" }));

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 },
});

type Role = "user" | "assistant";

type StoredFile = {
  id: string;
  name: string;
  mimeType: string;
  buffer: Buffer;
  text?: string;
  dataUri: string;
};

type StoredFileSummary = {
  id: string;
  name: string;
  mimeType: string;
};

type ChatMessage = {
  id: string;
  role: Role;
  content: string;
  createdAt: number;
  attachments?: StoredFileSummary[];
};

type ChatSession = {
  id: string;
  messages: ChatMessage[];
  files: Map<string, StoredFile>;
};

const chats = new Map<string, ChatSession>();

function getApiKey(req: express.Request): string | null {
  const authHeader = req.header("authorization") ?? "";
  if (authHeader.toLowerCase().startsWith("bearer ")) {
    const token = authHeader.slice(7).trim();
    return token || null;
  }
  const headerKey = req.header("x-api-key");
  return headerKey?.trim() || null;
}

function getClient(apiKey: string) {
  return new GoogleGenerativeAI(apiKey);
}

function getModel(client: GoogleGenerativeAI, name: string) {
  return client.getGenerativeModel({ model: name });
}

function isOverloaded(error: unknown): boolean {
  if (!error) {
    return false;
  }
  if (typeof error === "string") {
    return error.includes("503");
  }
  if (error instanceof Error) {
    return error.message.includes("503") || error.message.includes("Service Unavailable");
  }
  return false;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function ensureChat(chatId: string): ChatSession {
  const existing = chats.get(chatId);
  if (existing) {
    return existing;
  }
  const session: ChatSession = {
    id: chatId,
    messages: [],
    files: new Map(),
  };
  chats.set(chatId, session);
  return session;
}

function toDataUri(mimeType: string, buffer: Buffer): string {
  return `data:${mimeType};base64,${buffer.toString("base64")}`;
}

app.post("/api/chat/new", (req, res) => {
  const providedId = typeof req.body?.chatId === "string" ? req.body.chatId : "";
  const chatId = providedId.trim() ? providedId : crypto.randomUUID();
  chats.set(chatId, { id: chatId, messages: [], files: new Map() });
  res.json({ chatId });
});

app.post("/api/upload/document", upload.single("file"), async (req, res) => {
  try {
    const chatId = typeof req.body?.chatId === "string" ? req.body.chatId : "";
    if (!chatId) {
      return res.status(400).json({ error: "chatId is required" });
    }
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: "file is required" });
    }

    const allowed = ["application/pdf", "text/plain"];
    if (!allowed.includes(file.mimetype)) {
      return res.status(415).json({ error: "Unsupported document type" });
    }

    let text = "";
    if (file.mimetype === "application/pdf") {
      const parsed = await pdfParse(file.buffer);
      text = parsed.text?.trim() ?? "";
    } else {
      text = file.buffer.toString("utf-8");
    }

    const chat = ensureChat(chatId);
    const fileId = crypto.randomUUID();
    const stored: StoredFile = {
      id: fileId,
      name: file.originalname,
      mimeType: file.mimetype,
      buffer: file.buffer,
      text,
      dataUri: toDataUri(file.mimetype, file.buffer),
    };
    chat.files.set(fileId, stored);

    res.json({
      fileId,
      name: stored.name,
      mimeType: stored.mimeType,
      text: stored.text,
      dataUri: stored.dataUri,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to process document" });
  }
});

app.post("/api/upload/image", upload.single("file"), async (req, res) => {
  try {
    const chatId = typeof req.body?.chatId === "string" ? req.body.chatId : "";
    if (!chatId) {
      return res.status(400).json({ error: "chatId is required" });
    }
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: "file is required" });
    }

    const allowed = ["image/png", "image/jpeg"];
    if (!allowed.includes(file.mimetype)) {
      return res.status(415).json({ error: "Unsupported image type" });
    }

    const chat = ensureChat(chatId);
    const fileId = crypto.randomUUID();
    const stored: StoredFile = {
      id: fileId,
      name: file.originalname,
      mimeType: file.mimetype,
      buffer: file.buffer,
      dataUri: toDataUri(file.mimetype, file.buffer),
    };
    chat.files.set(fileId, stored);

    res.json({
      fileId,
      name: stored.name,
      mimeType: stored.mimeType,
      dataUri: stored.dataUri,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to process image" });
  }
});

app.get("/api/models", async (req, res) => {
  try {
    const apiKey = getApiKey(req);
    if (!apiKey) {
      return res.status(401).json({ error: "API key is required" });
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
    );
    if (!response.ok) {
      throw new Error(`Model list failed: ${response.status}`);
    }
    const data = await response.json();
    const models = (data.models ?? [])
      .filter(
        (model: { name: string; supportedGenerationMethods?: string[] }) =>
          model.name.toLowerCase().includes("gemini") &&
          model.supportedGenerationMethods?.includes("generateContent")
      )
      .map(
        (model: { name: string; displayName?: string; description?: string }) => ({
          name: model.name,
          displayName: model.displayName,
          description: model.description,
        })
      );

    res.json({ models });
  } catch (error) {
    console.error("Model list error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({ error: "Failed to list models", details: message });
  }
});

app.post("/api/chat", async (req, res) => {
  try {
    const apiKey = getApiKey(req);
    if (!apiKey) {
      return res.status(401).json({ error: "API key is required" });
    }
    const chatId = typeof req.body?.chatId === "string" ? req.body.chatId : "";
    const message = typeof req.body?.message === "string" ? req.body.message : "";
    const requestedModel = typeof req.body?.model === "string" ? req.body.model : "";
    const attachmentIds = Array.isArray(req.body?.attachmentIds)
      ? req.body.attachmentIds
      : [];

    if (!chatId || !message) {
      return res.status(400).json({ error: "chatId and message are required" });
    }

    const chat = ensureChat(chatId);
    const attachments = attachmentIds
      .map((id: string) => chat.files.get(id))
      .filter((file): file is StoredFile => Boolean(file));

    const attachmentSummaries: StoredFileSummary[] = attachments.map((file) => ({
      id: file.id,
      name: file.name,
      mimeType: file.mimeType,
    }));

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: message,
      createdAt: Date.now(),
      attachments: attachmentSummaries.length ? attachmentSummaries : undefined,
    };

    chat.messages.push(userMessage);

    const docText = attachments
      .filter((file) => file.mimeType === "application/pdf" || file.mimeType === "text/plain")
      .map((file) => `Document: ${file.name}\n${file.text ?? ""}`)
      .join("\n\n");

    const userText = docText ? `${message}\n\n${docText}` : message;

    const imageParts = attachments
      .filter((file) => file.mimeType.startsWith("image/"))
      .map((file) => ({
        inlineData: {
          data: file.buffer.toString("base64"),
          mimeType: file.mimeType,
        },
      }));

    const recentHistory = chat.messages
      .slice(-12)
      .slice(0, -1)
      .map((msg) => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }],
    }));

    const primaryModel = requestedModel || "gemini-1.5-flash";
    const modelNames = [
      primaryModel,
      process.env.GEMINI_FALLBACK_MODEL ?? "gemini-1.5-flash",
    ].filter((name, index, self) => name && self.indexOf(name) === index);

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders?.();

    const writeEvent = (event: string, payload: Record<string, unknown>) => {
      res.write(`event: ${event}\n`);
      res.write(`data: ${JSON.stringify(payload)}\n\n`);
    };

    const client = getClient(apiKey);
    let replyText = "";
    let lastError: unknown;

    for (const modelName of modelNames) {
      for (let attempt = 0; attempt < 3; attempt += 1) {
        let started = false;
        try {
          const model = getModel(client, modelName);
          const streamResult = await model.generateContentStream({
            contents: [
              ...recentHistory,
              {
                role: "user",
                parts: [{ text: userText }, ...imageParts],
              },
            ],
          });

          for await (const chunk of streamResult.stream) {
            const chunkText = chunk.text();
            if (chunkText) {
              started = true;
              replyText += chunkText;
              writeEvent("chunk", { text: chunkText });
            }
          }

          lastError = undefined;
          writeEvent("done", { text: replyText });
          break;
        } catch (error) {
          lastError = error;
          if (started || !isOverloaded(error) || attempt === 2) {
            break;
          }
          await sleep(300 * (attempt + 1));
        }
      }
      if (!lastError) {
        break;
      }
      if (lastError && !isOverloaded(lastError)) {
        break;
      }
    }

    if (lastError && !replyText) {
      throw lastError;
    }
    const assistantMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: replyText,
      createdAt: Date.now(),
    };

    chat.messages.push(assistantMessage);

    res.end();
  } catch (error) {
    console.error("Gemini error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    if (!res.headersSent) {
      res.status(500).json({ error: "Failed to generate response", details: message });
    } else {
      res.write(`event: error\n`);
      res.write(`data: ${JSON.stringify({ error: "Failed to generate response", details: message })}\n\n`);
      res.end();
    }
  }
});

app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});
