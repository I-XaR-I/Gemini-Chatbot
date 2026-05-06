import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import type { Attachment } from "../types";

type PreviewModalProps = {
  attachment: Attachment | null;
  onClose: () => void;
};

export default function PreviewModal({ attachment, onClose }: PreviewModalProps) {
  return (
    <AnimatePresence>
      {attachment && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="relative max-h-[85vh] w-[min(900px,92vw)] rounded-3xl bg-white/90 shadow-2xl ring-1 ring-black/10"
            initial={{ y: 30, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 20, opacity: 0, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 220, damping: 22 }}
            drag
            dragElastic={0.08}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200/70 px-6 py-4">
              <div>
                <p className="text-sm text-slate-500">Preview</p>
                <p className="font-display text-lg text-slate-900">{attachment.name}</p>
              </div>
              <button
                onClick={onClose}
                className="rounded-full border border-slate-200 bg-white p-2 text-slate-500 transition hover:border-slate-300 hover:text-slate-900"
                aria-label="Close preview"
              >
                <X size={18} />
              </button>
            </div>

            <div className="max-h-[70vh] overflow-auto p-6">
              {attachment.mimeType.startsWith("image/") && (
                <img
                  src={attachment.dataUri}
                  alt={attachment.name}
                  className="w-full rounded-2xl object-contain shadow-lg"
                />
              )}

              {attachment.mimeType === "application/pdf" && (
                <iframe
                  title={attachment.name}
                  src={attachment.dataUri}
                  className="h-[65vh] w-full rounded-2xl border border-slate-200"
                />
              )}

              {attachment.mimeType === "text/plain" && (
                <pre className="whitespace-pre-wrap rounded-2xl bg-slate-900/90 p-6 text-sm text-slate-100">
                  {attachment.text || "No text content available."}
                </pre>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
