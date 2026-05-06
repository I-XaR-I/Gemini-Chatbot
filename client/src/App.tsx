import { useEffect, useMemo, useState } from "react";
import ChatWindow from "./components/ChatWindow";
import InputBar from "./components/InputBar";
import OnboardingModal from "./components/OnboardingModal";
import PreviewModal from "./components/PreviewModal";
import SettingsPanel from "./components/SettingsPanel";
import Sidebar from "./components/Sidebar";
import type { Attachment, ChatSession, Message, ModelOption } from "./types";
import { exportConfig, getStoredApiKey, parseConfig, setStoredApiKey } from "./utils/storage";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

function createEmptyChat(chatId: string): ChatSession {
  return {
    id: chatId,
    title: "New Chat",
    messages: [],
  };
}

async function registerChat(chatId: string, apiKey: string): Promise<string> {
  try {
    const response = await fetch(`${API_BASE}/api/chat/new`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
      },
      body: JSON.stringify({ chatId }),
    });
    if (response.ok) {
      const data = await response.json();
      return data.chatId ?? chatId;
    }
  } catch (error) {
    return chatId;
  }
  return chatId;
}

export default function App() {
  const [chats, setChats] = useState<ChatSession[]>([]);
  const [activeChatId, setActiveChatId] = useState<string>("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [composerText, setComposerText] = useState("");
  const [composerAttachments, setComposerAttachments] = useState<Attachment[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [uploading, setUploading] = useState({ doc: false, image: false });
  const [preview, setPreview] = useState<Attachment | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [apiKey, setApiKey] = useState(() => getStoredApiKey());
  const [settingsDraft, setSettingsDraft] = useState(apiKey);
  const [models, setModels] = useState<ModelOption[]>([]);
  const [selectedModel, setSelectedModel] = useState("");
  const [modelsLoading, setModelsLoading] = useState(false);
  const [onboardingOpen, setOnboardingOpen] = useState(!apiKey);

  const activeChat = useMemo(
    () => chats.find((chat) => chat.id === activeChatId) ?? null,
    [chats, activeChatId]
  );

  const startNewChat = async () => {
    const localId = crypto.randomUUID();
    const chatId = await registerChat(localId, apiKey);
    const newChat = createEmptyChat(chatId);
    setChats((prev) => [newChat, ...prev]);
    setActiveChatId(chatId);
    setComposerText("");
    setComposerAttachments([]);
  };

  useEffect(() => {
    if (!activeChatId) {
      void startNewChat();
    }
  }, [activeChatId]);

  const handleSelectChat = (chatId: string) => {
    setActiveChatId(chatId);
    setComposerText("");
    setComposerAttachments([]);
  };

  useEffect(() => {
    setStoredApiKey(apiKey);
    if (!apiKey) {
      setOnboardingOpen(true);
      setModels([]);
      setSelectedModel("");
    } else {
      setOnboardingOpen(false);
    }
  }, [apiKey]);

  useEffect(() => {
    const loadModels = async () => {
      if (!apiKey) {
        return;
      }
      setModelsLoading(true);
      try {
        const response = await fetch(`${API_BASE}/api/models`, {
          headers: { Authorization: `Bearer ${apiKey}` },
        });
        if (!response.ok) {
          throw new Error("Failed to fetch models");
        }
        const data = await response.json();
        const loaded: ModelOption[] = Array.isArray(data.models) ? data.models : [];
        setModels(loaded);
        if (!loaded.find((model) => model.name === selectedModel)) {
          setSelectedModel(loaded[0]?.name ?? "");
        }
      } catch (error) {
        setModels([]);
        setSelectedModel("");
      } finally {
        setModelsLoading(false);
      }
    };

    void loadModels();
  }, [apiKey]);

  const updateChatMessages = (chatId: string, updater: (messages: Message[]) => Message[]) => {
    setChats((prev) =>
      prev.map((chat) =>
        chat.id === chatId ? { ...chat, messages: updater(chat.messages) } : chat
      )
    );
  };

  const appendToMessage = (chatId: string, messageId: string, chunk: string) => {
    setChats((prev) =>
      prev.map((chat) => {
        if (chat.id !== chatId) {
          return chat;
        }
        return {
          ...chat,
          messages: chat.messages.map((msg) =>
            msg.id === messageId ? { ...msg, content: msg.content + chunk } : msg
          ),
        };
      })
    );
  };

  const setMessageContent = (chatId: string, messageId: string, content: string) => {
    setChats((prev) =>
      prev.map((chat) => {
        if (chat.id !== chatId) {
          return chat;
        }
        return {
          ...chat,
          messages: chat.messages.map((msg) =>
            msg.id === messageId ? { ...msg, content } : msg
          ),
        };
      })
    );
  };

  const handleSend = async () => {
    if (!activeChat || isSending) {
      return;
    }
    if (!apiKey) {
      setOnboardingOpen(true);
      return;
    }

    const trimmed = composerText.trim();
    if (!trimmed && composerAttachments.length === 0) {
      return;
    }

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmed || "(Attachment only)",
      createdAt: Date.now(),
      attachments: composerAttachments.length ? composerAttachments : undefined,
    };

    updateChatMessages(activeChat.id, (messages) => [...messages, userMessage]);

    if (activeChat.messages.length === 0 && trimmed) {
      setChats((prev) =>
        prev.map((chat) =>
          chat.id === activeChat.id
            ? { ...chat, title: trimmed.slice(0, 32) }
            : chat
        )
      );
    }

    setComposerText("");
    setComposerAttachments([]);
    setIsSending(true);

    const assistantId = crypto.randomUUID();
    updateChatMessages(activeChat.id, (messages) => [
      ...messages,
      {
        id: assistantId,
        role: "assistant",
        content: "",
        createdAt: Date.now(),
      },
    ]);

    try {
      const response = await fetch(`${API_BASE}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          chatId: activeChat.id,
          message: trimmed || "Please analyze the attached file(s).",
          attachmentIds: composerAttachments.map((file) => file.id),
          model: selectedModel,
        }),
      });

      if (!response.ok) {
        const errorPayload = await response.json().catch(() => null);
        throw new Error(errorPayload?.details ?? "Failed to generate reply");
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("Streaming response not available");
      }

      const decoder = new TextDecoder();
      let buffer = "";
      let hasChunk = false;

      while (true) {
        const { value, done } = await reader.read();
        if (done) {
          break;
        }
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop() ?? "";

        for (const part of parts) {
          const lines = part.split("\n");
          let event = "message";
          let data = "";
          for (const line of lines) {
            if (line.startsWith("event:")) {
              event = line.replace("event:", "").trim();
            }
            if (line.startsWith("data:")) {
              data += line.replace("data:", "").trim();
            }
          }

          if (!data) {
            continue;
          }

          const payload = JSON.parse(data) as { text?: string; error?: string; details?: string };

          if (event === "chunk" && payload.text) {
            appendToMessage(activeChat.id, assistantId, payload.text);
            if (!hasChunk) {
              hasChunk = true;
              setIsSending(false);
            }
          }

          if (event === "error") {
            setMessageContent(
              activeChat.id,
              assistantId,
              payload.details ?? "Something went wrong while contacting Gemini."
            );
            setIsSending(false);
          }

          if (event === "done") {
            setIsSending(false);
          }
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Something went wrong";
      setMessageContent(activeChat.id, assistantId, message);
    } finally {
      setIsSending(false);
    }
  };

  const uploadFile = async (file: File, endpoint: "document" | "image") => {
    if (!activeChat) {
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("chatId", activeChat.id);

    setUploading((prev) => ({ ...prev, [endpoint === "document" ? "doc" : "image"]: true }));

    try {
      const response = await fetch(`${API_BASE}/api/upload/${endpoint}`, {
        method: "POST",
        headers: apiKey ? { Authorization: `Bearer ${apiKey}` } : undefined,
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const data = await response.json();
      const attachment: Attachment = {
        id: data.fileId,
        name: data.name,
        mimeType: data.mimeType,
        dataUri: data.dataUri,
        text: data.text,
      };

      setComposerAttachments((prev) => [...prev, attachment]);
    } catch (error) {
      setComposerAttachments((prev) =>
        prev.concat({
          id: crypto.randomUUID(),
          name: `${file.name} (upload failed)`,
          mimeType: file.type,
          dataUri: "",
        })
      );
    } finally {
      setUploading((prev) => ({ ...prev, [endpoint === "document" ? "doc" : "image"]: false }));
    }
  };

  const handleExport = () => {
    const content = exportConfig(apiKey);
    const blob = new Blob([content], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "gemini-config.json";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (file: File) => {
    const text = await file.text();
    const parsed = parseConfig(text);
    if (parsed?.apiKey) {
      setSettingsDraft(parsed.apiKey);
      setApiKey(parsed.apiKey);
      setOnboardingOpen(false);
    }
  };

  return (
    <div className="flex h-screen w-full">
      <Sidebar
        chats={chats}
        activeChatId={activeChatId}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen((prev) => !prev)}
        onNewChat={startNewChat}
        onSelectChat={handleSelectChat}
        onOpenSettings={() => {
          setSettingsDraft(apiKey);
          setSettingsOpen(true);
        }}
      />

      <main className="relative flex flex-1 flex-col overflow-hidden">
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between px-8 py-6">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Gemini Chat</p>
              <h1 className="font-display text-2xl text-slate-900">{activeChat?.title}</h1>
            </div>
            <div className="rounded-full bg-[color:var(--panel)] px-4 py-2 text-xs text-slate-600">
              {activeChat?.messages.length ?? 0} messages
            </div>
          </div>

          <ChatWindow
            messages={activeChat?.messages ?? []}
            isSending={isSending}
            onPreview={(attachment) => setPreview(attachment)}
          />
        </div>

        <InputBar
          value={composerText}
          onChange={setComposerText}
          onSend={handleSend}
          onUploadDocument={(file) => uploadFile(file, "document")}
          onUploadImage={(file) => uploadFile(file, "image")}
          isSending={isSending}
          uploading={uploading}
          attachments={composerAttachments}
          models={models}
          selectedModel={selectedModel}
          isModelsLoading={modelsLoading}
          onModelChange={setSelectedModel}
          isKeyReady={Boolean(apiKey)}
          onPreview={(attachment) => setPreview(attachment)}
          onRemoveAttachment={(id) =>
            setComposerAttachments((prev) => prev.filter((file) => file.id !== id))
          }
        />

        <PreviewModal attachment={preview} onClose={() => setPreview(null)} />
        <SettingsPanel
          isOpen={settingsOpen}
          apiKey={settingsDraft}
          onClose={() => setSettingsOpen(false)}
          onApiKeyChange={setSettingsDraft}
          onSave={() => {
            setApiKey(settingsDraft.trim());
            setSettingsOpen(false);
          }}
          onExport={handleExport}
          onImport={handleImport}
        />
        <OnboardingModal
          isOpen={onboardingOpen}
          onSave={(key) => {
            if (!key) {
              return;
            }
            setApiKey(key);
            setOnboardingOpen(false);
          }}
        />
      </main>
    </div>
  );
}
