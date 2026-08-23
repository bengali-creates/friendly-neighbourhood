"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useStore } from "@/lib/store";
import { useWatchUrl } from "@/lib/queries";

export default function AddWatchForm() {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [name, setName] = useState("");
  const [sourceType, setSourceType] = useState("tos");
  const [customPrompt, setCustomPrompt] = useState("");
  const { flash } = useStore();
  const watch = useWatchUrl();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;
    flash(`Adding ${name || url} to watch list…`);
    await watch.mutateAsync({
      url,
      name: name || url,
      source_type: sourceType,
      prompt: customPrompt.trim() || "Extract the main text content, sub-clauses, and hyperlinked URLs in markdown format.",
    });
    flash(`✓ ${name || url} added!`);
    setUrl("");
    setName("");
    setCustomPrompt("");
    setOpen(false);
  };

  return (
    <div className="comic-panel bg-[var(--card-bg)] border-3 border-black shadow-[6px_6px_0_#000000] p-4 flex flex-col gap-3">
      <button
        className="comic-burst-btn btn btn--primary w-full py-2.5 text-xs font-['Bangers'] tracking-wider bg-[#FF2E63] text-white border-2 border-black shadow-[3px_3px_0_#000000]"
        onClick={() => setOpen((v) => !v)}
      >
        {open ? "✕ CLOSE FORM" : "+ WATCH NEW URL"}
      </button>

      <AnimatePresence>
        {open && (
          <motion.form
            onSubmit={handleSubmit}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="flex flex-col gap-3 pt-3">
              <input
                className="input bg-[var(--input-bg)] border-2 border-black text-[var(--input-text)] text-xs"
                placeholder="Target URL (e.g. https://instagram.com/legal/privacy)"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                required
              />
              <input
                className="input bg-[var(--input-bg)] border-2 border-black text-[var(--input-text)] text-xs"
                placeholder="Custom Label / Name (optional)"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <textarea
                className="input bg-[var(--input-bg)] border-2 border-black text-[var(--input-text)] text-xs h-16 resize-none"
                placeholder="Custom AI Focus Prompt (e.g. 'Focus on AI training rules & opt-out steps')"
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
              />
              <select
                className="input bg-[var(--input-bg)] border-2 border-black text-[var(--input-text)] text-xs cursor-pointer"
                value={sourceType}
                onChange={(e) => setSourceType(e.target.value)}
              >
                <option value="tos" className="bg-[var(--input-bg)]">Terms of Service</option>
                <option value="recall" className="bg-[var(--input-bg)]">Product Recall</option>
                <option value="civic" className="bg-[var(--input-bg)]">Civic / Government</option>
                <option value="search" className="bg-[var(--input-bg)]">General Search</option>
              </select>
              <button
                className="comic-burst-btn btn btn--yellow w-full py-2 text-xs font-['Bangers'] tracking-wider bg-[#FFD400] text-black border-2 border-black shadow-[3px_3px_0_#000000]"
                type="submit"
                disabled={watch.isPending}
              >
                {watch.isPending ? "ADDING SCRAPER..." : "ADD TO RADAR"}
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}
