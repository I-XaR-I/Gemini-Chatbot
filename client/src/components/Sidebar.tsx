import { motion } from "framer-motion";
import { Plus, PanelLeftClose, PanelLeftOpen, Settings } from "lucide-react";
import type { ChatSession } from "../types";

type SidebarProps = {
  chats: ChatSession[];
  activeChatId: string;
  isOpen: boolean;
  onToggle: () => void;
  onNewChat: () => void;
  onSelectChat: (chatId: string) => void;
  onOpenSettings: () => void;
};

export default function Sidebar({
  chats,
  activeChatId,
  isOpen,
  onToggle,
  onNewChat,
  onSelectChat,
  onOpenSettings,
}: SidebarProps) {
  return (
    <motion.aside
      className="relative flex h-full flex-col border-r border-slate-200/70 bg-white/70 backdrop-blur"
      animate={{ width: isOpen ? 280 : 80 }}
      transition={{ type: "spring", stiffness: 200, damping: 22 }}
    >
      <div className="flex items-center justify-between px-4 py-5">
        {isOpen && (
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Gemini</p>
            <p className="font-display text-xl text-slate-900">Studio Chat</p>
          </div>
        )}
        <button
          className="rounded-full border border-slate-200 bg-white p-2 text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
          onClick={onToggle}
          aria-label="Toggle sidebar"
        >
          {isOpen ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}
        </button>
      </div>

      <div className="px-4">
        <button
          onClick={onNewChat}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[color:var(--accent)] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-200 transition hover:translate-y-[-1px]"
        >
          <Plus size={16} />
          {isOpen && "New Chat"}
        </button>
      </div>

      <div className="mt-6 flex-1 overflow-y-auto px-3 pb-6">
        <div className="space-y-2">
          {chats.map((chat) => {
            const isActive = chat.id === activeChatId;
            return (
              <button
                key={chat.id}
                onClick={() => onSelectChat(chat.id)}
                className={`flex w-full items-center rounded-2xl px-3 py-3 text-left text-sm transition ${
                  isActive
                    ? "bg-slate-900 text-white"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <span className="truncate">
                  {chat.title || "Untitled chat"}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="px-4 pb-6">
        <button
          onClick={onOpenSettings}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
        >
          <Settings size={16} />
          {isOpen && "Settings"}
        </button>
      </div>
    </motion.aside>
  );
}
