import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ChevronRight, Sparkles, X, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  COMPANY_SIZES,
  INDUSTRIES,
  SIMULATION_USE_CASES,
  type CompanySize,
  type Industry,
  type SimulationInput,
} from "@/lib/simulation";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onComplete: (input: SimulationInput) => void;
}

const STEPS = ["Company size", "Industry", "Use cases", "Generating"] as const;

export function SimulationModal({ open, onOpenChange, onComplete }: Props) {
  const [step, setStep] = useState(0);
  const [size, setSize] = useState<CompanySize | null>(null);
  const [industry, setIndustry] = useState<Industry | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [generating, setGenerating] = useState(false);

  function reset() {
    setStep(0);
    setSize(null);
    setIndustry(null);
    setTags([]);
    setQuery("");
    setGenerating(false);
  }

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return SIMULATION_USE_CASES.filter(
      (u) => u.toLowerCase().includes(q) && !tags.includes(u),
    ).slice(0, 6);
  }, [query, tags]);

  function next() {
    if (step === 2) {
      setStep(3);
      setGenerating(true);
      setTimeout(() => {
        if (size && industry) {
          onComplete({ companySize: size, industry, useCases: tags });
        }
        onOpenChange(false);
        setTimeout(reset, 300);
      }, 1300);
      return;
    }
    setStep((s) => s + 1);
  }

  const canNext =
    (step === 0 && !!size) || (step === 1 && !!industry) || (step === 2 && tags.length > 0);

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) setTimeout(reset, 300);
      }}
    >
      <DialogContent className="glass-solid max-w-2xl rounded-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Run a simulation
          </DialogTitle>
          <DialogDescription>
            Sketch your organisation in three steps. We'll generate synthetic data so you can
            preview what your dashboard could look like for the months ahead.
          </DialogDescription>
        </DialogHeader>

        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground flex-wrap">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-1.5">
              <span
                className={cn(
                  "px-2.5 py-1 rounded-full transition",
                  i === step
                    ? "bg-primary text-primary-foreground font-semibold"
                    : i < step
                      ? "bg-primary/15 text-primary"
                      : "bg-white/40",
                )}
              >
                {i + 1}. {s}
              </span>
              {i < STEPS.length - 1 && <ChevronRight className="h-3 w-3 opacity-50" />}
            </div>
          ))}
        </div>

        <div className="min-h-[300px] py-2">
          <AnimatePresence mode="wait">
            {step === 0 && (
              <motion.div
                key="size"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="grid grid-cols-1 sm:grid-cols-2 gap-2"
              >
                {COMPANY_SIZES.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setSize(c.id)}
                    className={cn(
                      "text-left rounded-2xl px-4 py-3 border-2 transition",
                      size === c.id
                        ? "border-primary bg-primary/10"
                        : "border-white/60 bg-white/40 hover:bg-white/60",
                    )}
                  >
                    <div className="text-sm font-semibold">{c.label}</div>
                  </button>
                ))}
              </motion.div>
            )}

            {step === 1 && (
              <motion.div
                key="industry"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="grid grid-cols-2 sm:grid-cols-3 gap-2"
              >
                {INDUSTRIES.map((ind) => (
                  <button
                    key={ind}
                    onClick={() => setIndustry(ind)}
                    className={cn(
                      "text-left rounded-2xl px-3 py-2.5 text-sm border-2 transition",
                      industry === ind
                        ? "border-primary bg-primary/10 font-semibold"
                        : "border-white/60 bg-white/40 hover:bg-white/60",
                    )}
                  >
                    {ind}
                  </button>
                ))}
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="usecases"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-3"
              >
                <div className="flex flex-wrap gap-1.5 min-h-[28px]">
                  {tags.map((t) => (
                    <Badge
                      key={t}
                      variant="secondary"
                      className="rounded-full pl-3 pr-1 py-1 gap-1"
                    >
                      {t}
                      <button
                        onClick={() => setTags((s) => s.filter((x) => x !== t))}
                        className="rounded-full hover:bg-black/10 p-0.5"
                        aria-label={`Remove ${t}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                <div className="relative">
                  <Input
                    autoFocus
                    placeholder="Type a use case, e.g. transc…"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && suggestions[0]) {
                        e.preventDefault();
                        setTags((s) => [...s, suggestions[0]]);
                        setQuery("");
                      }
                    }}
                    className="rounded-full bg-white/60"
                  />
                  {suggestions.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1 z-10 glass-solid rounded-2xl p-1 max-h-56 overflow-y-auto">
                      {suggestions.map((s) => (
                        <button
                          key={s}
                          onClick={() => {
                            setTags((cur) => [...cur, s]);
                            setQuery("");
                          }}
                          className="w-full text-left text-sm px-3 py-2 rounded-lg hover:bg-primary/10"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Add at least one use case. Type to search the catalogue of common AI workflows.
                </p>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="gen"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center text-center py-12"
              >
                <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
                <p className="text-sm font-medium">
                  Generating synthetic simulation based on your inputs…
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Projecting token volumes, energy intensity and use-case mix forward.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {!generating && (
          <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/40">
            <Button
              variant="ghost"
              onClick={() => (step > 0 ? setStep((s) => s - 1) : onOpenChange(false))}
              className="rounded-full"
            >
              {step > 0 ? "Back" : "Cancel"}
            </Button>
            <Button onClick={next} disabled={!canNext} className="rounded-full">
              {step === 2 ? (
                <>
                  <Check className="h-4 w-4 mr-1.5" />
                  Run simulation
                </>
              ) : (
                <>
                  Continue
                  <ChevronRight className="h-4 w-4 ml-1" />
                </>
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
