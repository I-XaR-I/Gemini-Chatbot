import { AnimatePresence, motion } from "framer-motion";
import { Download, Settings, Upload, X } from "lucide-react";

type SettingsPanelProps = {
  isOpen: boolean;
  apiKey: string;
  onClose: () => void;
  onApiKeyChange: (value: string) => void;
  onSave: () => void;
  onExport: () => void;
  onImport: (file: File) => void;
};

export default function SettingsPanel({
  isOpen,
  apiKey,
  onClose,
  onApiKeyChange,
  onSave,
  onExport,
  onImport,
}: SettingsPanelProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-40 flex justify-end bg-black/30 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.aside
            className="h-full w-[min(420px,90vw)] bg-white/95 p-6 shadow-2xl"
            initial={{ x: 40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 40, opacity: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 22 }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-900">
                <Settings size={18} />
                <h2 className="font-display text-xl">Settings</h2>
              </div>
              <button
                onClick={onClose}
                className="rounded-full border border-slate-200 bg-white p-2 text-slate-500 transition hover:border-slate-300 hover:text-slate-900"
                aria-label="Close settings"
              >
                <X size={16} />
              </button>
            </div>

            <div className="mt-8">
              <label className="text-xs uppercase tracking-[0.2em] text-slate-400">
                Gemini API Key
              </label>
              <input
                type="password"
                value={apiKey}
                onChange={(event) => onApiKeyChange(event.target.value)}
                placeholder="AI..."
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 shadow-inner focus:border-[color:var(--accent)] focus:outline-none focus:ring-2 focus:ring-[color:var(--ring)]"
              />
              <p className="mt-2 text-xs text-slate-500">
                Stored locally in your browser. Never sent anywhere except to your own server.
              </p>
              <button
                onClick={onSave}
                className="mt-4 w-full rounded-2xl bg-[color:var(--accent)] px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-emerald-200 transition hover:translate-y-[-1px]"
              >
                Save Settings
              </button>
            </div>

            <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Config</p>
              <div className="mt-3 flex flex-col gap-3">
                <button
                  onClick={onExport}
                  className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 transition hover:border-slate-300"
                >
                  <Download size={16} />
                  Export Config
                </button>
                <label className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 transition hover:border-slate-300">
                  <Upload size={16} />
                  Import Config
                  <input
                    type="file"
                    accept="application/json"
                    className="hidden"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) {
                        onImport(file);
                      }
                      event.currentTarget.value = "";
                    }}
                  />
                </label>
              </div>
            </div>
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
