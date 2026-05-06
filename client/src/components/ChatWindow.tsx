import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import type { Attachment, Message } from "../types";
import MessageBubble from "./MessageBubble";
import LoadingDots from "./LoadingDots";

type ChatWindowProps = {
  messages: Message[];
  isSending: boolean;
  onPreview: (attachment: Attachment) => void;
};

export default function ChatWindow({ messages, isSending, onPreview }: ChatWindowProps) {
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, isSending]);

  return (
    <div className="flex-1 overflow-y-auto px-6 pb-32 pt-6">
      <div className="space-y-5">
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} onPreview={onPreview} />
        ))}

        {isSending && (
          <motion.div
            className="flex justify-start"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="rounded-3xl bg-white/90 px-4 py-3 shadow-lg ring-1 ring-black/5">
              <LoadingDots />
            </div>
          </motion.div>
        )}
      </div>
      <div ref={endRef} />
    </div>
  );
}
