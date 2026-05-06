import { Image, Paperclip, Send, X } from "lucide-react";
import { useEffect, useRef } from "react";
import type { Attachment, ModelOption } from "../types";

type InputBarProps = {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onUploadDocument: (file: File) => void;
  onUploadImage: (file: File) => void;
  isSending: boolean;
  uploading: { doc: boolean; image: boolean };
  attachments: Attachment[];
  models: ModelOption[];
  selectedModel: string;
  isModelsLoading: boolean;
  onModelChange: (value: string) => void;
  onPreview: (attachment: Attachment) => void;
  onRemoveAttachment: (id: string) => void;
  isKeyReady: boolean;
};

export default function InputBar({
  value,
  onChange,
  onSend,
  onUploadDocument,
  onUploadImage,
  isSending,
  uploading,
  attachments,
  models,
  selectedModel,
  isModelsLoading,
  onModelChange,
  onPreview,
  onRemoveAttachment,
  isKeyReady,
}: InputBarProps) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) {
      return;
    }
    el.style.height = "auto";
    const maxHeight = 160;
    const nextHeight = Math.min(el.scrollHeight, maxHeight);
    el.style.height = `${nextHeight}px`;
    el.style.overflowY = el.scrollHeight > maxHeight ? "auto" : "hidden";
  }, [value]);

  return (
    <div className="absolute bottom-0 left-0 right-0 mx-auto w-full max-w-5xl px-6 pb-6">
      <div className="rounded-3xl bg-white/90 p-4 shadow-2xl ring-1 ring-slate-200 backdrop-blur">
        {attachments.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {attachments.map((attachment) => (
              <div
                key={attachment.id}
                className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600"
              >
                <button onClick={() => onPreview(attachment)}>{attachment.name}</button>
                <button
                  onClick={() => onRemoveAttachment(attachment.id)}
                  className="text-slate-400 hover:text-slate-700"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="flex items-end gap-3">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                onSend();
              }
            }}
            rows={1}
            placeholder="Ask Gemini anything..."
            className="min-h-[48px] flex-1 resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 shadow-inner focus:border-[color:var(--accent)] focus:outline-none focus:ring-2 focus:ring-[color:var(--ring)]"
          />

          <div className="flex items-center gap-2">
            <div className="min-w-[180px]">
              <select
                value={selectedModel}
                onChange={(event) => onModelChange(event.target.value)}
                disabled={!isKeyReady || isModelsLoading}
                className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-xs text-slate-700 shadow-inner focus:border-[color:var(--accent)] focus:outline-none focus:ring-2 focus:ring-[color:var(--ring)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {!isKeyReady && <option value="">Add API key to load models</option>}
                {isKeyReady && isModelsLoading && <option value="">Loading models...</option>}
                {isKeyReady && !isModelsLoading && models.length === 0 && (
                  <option value="">No models available</option>
                )}
                {models.map((model) => (
                  <option key={model.name} value={model.name}>
                    {model.displayName ?? model.name}
                  </option>
                ))}
              </select>
            </div>
            <label className="relative cursor-pointer rounded-2xl border border-slate-200 bg-white px-3 py-3 text-slate-600 transition hover:border-slate-300">
              <input
                type="file"
                accept=".pdf,.txt"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) {
                    onUploadDocument(file);
                  }
                  event.currentTarget.value = "";
                }}
              />
              {uploading.doc ? (
                <span className="block h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600" />
              ) : (
                <Paperclip size={18} />
              )}
            </label>

            <label className="relative cursor-pointer rounded-2xl border border-slate-200 bg-white px-3 py-3 text-slate-600 transition hover:border-slate-300">
              <input
                type="file"
                accept="image/png,image/jpeg"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) {
                    onUploadImage(file);
                  }
                  event.currentTarget.value = "";
                }}
              />
              {uploading.image ? (
                <span className="block h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600" />
              ) : (
                <Image size={18} />
              )}
            </label>

            <button
              onClick={onSend}
              disabled={isSending || !isKeyReady}
              className="rounded-2xl bg-[color:var(--accent)] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-200 transition hover:translate-y-[-1px] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
