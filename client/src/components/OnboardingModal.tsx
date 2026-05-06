import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";

type OnboardingModalProps = {
  isOpen: boolean;
  onSave: (apiKey: string) => void;
};

export default function OnboardingModal({ isOpen, onSave }: OnboardingModalProps) {
  const [value, setValue] = useState("");

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="w-[min(520px,92vw)] rounded-3xl bg-white/95 p-8 shadow-2xl ring-1 ring-black/10"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
          >
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Welcome</p>
            <h2 className="font-display text-2xl text-slate-900">Add your Gemini API key</h2>
            <p className="mt-2 text-sm text-slate-600">
              Your key is stored locally in this browser for quick access. You can update it
              anytime in Settings.
            </p>

            <div className="mt-6">
              <label className="text-xs uppercase tracking-[0.2em] text-slate-400">
                Gemini API Key
              </label>
              <input
                type="password"
                value={value}
                onChange={(event) => setValue(event.target.value)}
                placeholder="AI..."
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 shadow-inner focus:border-[color:var(--accent)] focus:outline-none focus:ring-2 focus:ring-[color:var(--ring)]"
              />
            </div>

            <button
              onClick={() => onSave(value.trim())}
              disabled={!value.trim()}
              className="mt-6 w-full rounded-2xl bg-[color:var(--accent)] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-200 transition hover:translate-y-[-1px] disabled:cursor-not-allowed disabled:opacity-60"
            >
              Save & Continue
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
