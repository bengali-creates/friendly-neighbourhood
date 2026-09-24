"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useStore } from "@/lib/store";
import { useWatchUrl } from "@/lib/queries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, X, Globe, Radio } from "lucide-react";

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
    <div className="rounded-[var(--radius-lg)] bg-[var(--depth)] border border-[var(--rim)] p-4 flex flex-col gap-3 transition-colors">
      <Button
        variant={open ? "secondary" : "default"}
        className="w-full py-2.5 text-xs font-medium justify-center gap-2"
        onClick={() => setOpen((v) => !v)}
      >
        {open ? <><X className="w-4 h-4" /> Close Watch Form</> : <><Plus className="w-4 h-4" /> Add Watch Target</>}
      </Button>

      <AnimatePresence>
        {open && (
          <motion.form
            onSubmit={handleSubmit}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="flex flex-col gap-3 pt-2">
              <div>
                <label className="text-[10px] font-mono uppercase tracking-wider text-[var(--ink-tertiary)] block mb-1">Target URL</label>
                <Input
                  placeholder="https://example.com/legal/privacy"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-mono uppercase tracking-wider text-[var(--ink-tertiary)] block mb-1">Label (Optional)</label>
                <Input
                  placeholder="e.g. Adobe Terms of Service"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div>
                <label className="text-[10px] font-mono uppercase tracking-wider text-[var(--ink-tertiary)] block mb-1">Focus Prompt</label>
                <textarea
                  className="w-full rounded-[var(--radius-sm)] border border-[var(--rim)] bg-[var(--surface)] px-3 py-2 text-xs text-[var(--ink-primary)] placeholder:text-[var(--ink-tertiary)] focus-visible:outline-none focus-visible:border-[var(--watchful)] focus-visible:ring-2 focus-visible:ring-[rgba(196,181,253,0.2)] h-16 resize-none transition-all"
                  placeholder="Focus on AI training terms, copyright assignation & opt-out provisions"
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                />
              </div>

              <div>
                <label className="text-[10px] font-mono uppercase tracking-wider text-[var(--ink-tertiary)] block mb-1">Source Category</label>
                <select
                  className="w-full rounded-[var(--radius-sm)] border border-[var(--rim)] bg-[var(--surface)] px-3 py-1.5 text-xs text-[var(--ink-primary)] focus-visible:outline-none focus-visible:border-[var(--watchful)] cursor-pointer transition-all"
                  value={sourceType}
                  onChange={(e) => setSourceType(e.target.value)}
                >
                  <option value="tos">Terms of Service / Privacy</option>
                  <option value="recall">Product Recall / Consumer Safety</option>
                  <option value="civic">Civic / Regulatory Notice</option>
                  <option value="search">General Web Intelligence</option>
                </select>
              </div>

              <Button
                variant="default"
                className="w-full py-2 text-xs font-semibold mt-1"
                type="submit"
                disabled={watch.isPending}
              >
                {watch.isPending ? "Connecting to Radar..." : "Add to Autonomous Radar"}
              </Button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}
