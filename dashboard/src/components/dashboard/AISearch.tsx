import { useState } from "react";
import { Search, Sparkles, X } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { answerQuestion, EXAMPLE_PROMPTS } from "@/lib/ai-answers";
import type { DashboardData } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

interface AISearchProps {
  data: DashboardData;
  className?: string;
}

export function AISearch({ data, className }: AISearchProps) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [thinking, setThinking] = useState(false);

  function ask(prompt: string) {
    setQ(prompt);
    setOpen(true);
    setThinking(true);
    setAnswer(null);
    setTimeout(() => {
      setAnswer(answerQuestion(prompt, data).answer);
      setThinking(false);
    }, 450);
  }

  return (
    <div className={cn("relative w-full md:w-[360px]", className)}>
      <div className="glass-solid rounded-full h-10 flex items-center pl-4 pr-1">
        <Sparkles className="h-4 w-4 text-primary mr-2 shrink-0" />
        <Input
          value={q}
          placeholder="Ask AI about this data…"
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && q.trim()) ask(q);
          }}
          className="border-0 bg-transparent shadow-none focus-visible:ring-0 px-0 h-8 text-sm"
        />
        <Button
          size="sm"
          onClick={() => q.trim() && ask(q)}
          className="rounded-full h-8 px-3 bg-primary hover:bg-primary/90"
        >
          <Search className="h-3.5 w-3.5" />
        </Button>
      </div>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.98 }}
              transition={{ duration: 0.18 }}
              className="absolute right-0 mt-2 w-[min(420px,90vw)] glass-solid rounded-2xl p-4 z-50 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Sparkles className="h-4 w-4 text-primary" />
                  AI Insights
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="rounded-full p-1 hover:bg-white/40 dark:hover:bg-white/10"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {!answer && !thinking && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Try asking:</p>
                  <div className="flex flex-wrap gap-2">
                    {EXAMPLE_PROMPTS.map((p) => (
                      <button
                        key={p}
                        onClick={() => ask(p)}
                        className="text-xs rounded-full px-3 py-1.5 bg-white/60 dark:bg-white/10 hover:bg-white/90 dark:hover:bg-white/20 transition border border-white/40"
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {thinking && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                  <span className="inline-block h-2 w-2 rounded-full bg-primary animate-pulse" />
                  Thinking…
                </div>
              )}

              {answer && (
                <div className="prose prose-sm dark:prose-invert max-w-none text-sm leading-relaxed [&_p]:my-1.5 [&_strong]:text-foreground [&_ol]:my-2 [&_ol]:pl-5 [&_li]:my-0.5">
                  <ReactMarkdown>{answer}</ReactMarkdown>
                  <button
                    onClick={() => {
                      setAnswer(null);
                      setQ("");
                    }}
                    className="mt-3 text-xs text-primary hover:underline"
                  >
                    Ask another →
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
