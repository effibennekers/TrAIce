import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check,
  X,
  Sparkles,
  Leaf,
  Zap,
  Database,
  Download,
  FileText,
  Languages,
  ListPlus,
} from "lucide-react";
import { GlassCard } from "./GlassCard";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

interface Suggestion {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  savingsKwh: number;
  savingsEur: number;
  accent: string;
}

const SUGGESTIONS: Suggestion[] = [
  {
    id: "caveman-prompts",
    icon: <Languages className="h-5 w-5" />,
    title: "Use Caveman prompts to cut input tokens",
    description:
      "Most prompts carry 30–45% filler the model still pays for. A pre-processor that strips them down to blunt, caveman-style instructions cuts input tokens by ~⅓ with no quality loss.",
    savingsKwh: 2850,
    savingsEur: 1195,
    accent: "#D97706",
  },
  {
    id: "lighter-model",
    icon: <Database className="h-5 w-5" />,
    title: "Use a lighter model for simple tasks",
    description:
      "Simple jobs like summarising notes or sorting tickets don't need a top-tier model. A smaller one handles them just as well for a fraction of the energy.",
    savingsKwh: 2400,
    savingsEur: 1010,
    accent: "#2B9EB3",
  },
  {
    id: "route-gpt-oss",
    icon: <Zap className="h-5 w-5" />,
    title: "Route routine search to GPT OSS 120B",
    description:
      "GPT OSS 120B has verified telemetry and is ~20× more efficient than GPT-4o. Send low-stakes search and classification there, keep GPT-4o for nuanced answers. A simple router rule on prompt length and intent is enough to capture the bulk of the savings.",
    savingsKwh: 1100,
    savingsEur: 460,
    accent: "#16A34A",
  },
  {
    id: "transcription-batch",
    icon: <Leaf className="h-5 w-5" />,
    title: "Batch Whisper transcription overnight",
    description:
      "Whisper Large is the most energy-intensive model in your stack. Batching non-urgent recordings to 02:00–05:00 cuts grid-carbon intensity without changing UX. The same shift also smooths daytime GPU contention and lowers peak-hour cloud spend.",
    savingsKwh: 540,
    savingsEur: 230,
    accent: "#FCAB10",
  },
];

export function SuggestionsWidget() {
  const [stack, setStack] = useState(SUGGESTIONS);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [reportOpen, setReportOpen] = useState(false);
  const [accepted, setAccepted] = useState<Suggestion | null>(null);

  const visible = stack.slice(0, 2); // top + peek
  const current = stack[0];
  const total = SUGGESTIONS.length;
  const idx = total - stack.length + 1;

  function advance(action: "accept" | "skip") {
    if (!current) return;
    setDirection(action === "accept" ? 1 : -1);
    if (action === "accept") {
      setAccepted(current);
      setReportOpen(true);
    }
    setStack((s) => s.slice(1));
  }

  function reset() {
    setStack(SUGGESTIONS);
  }

  return (
    <>
      <GlassCard
        title="AI-powered suggestions"
        subtitle={current ? `${idx} of ${total} · swipe to review` : "All reviewed"}
        info={{
          description:
            "A Tinder-style stack of suggestion cards. Each card describes one concrete optimisation opportunity our system has spotted in your AI usage, with an icon, short rationale and the estimated monthly savings.",
          purpose:
            "Turns raw analytics into actions a decision maker can take in seconds: swipe right (or tap Accept) to generate a stakeholder-ready report, swipe left to dismiss. Designed to keep the optimisation backlog moving without long meetings.",
          metrics:
            "Each card surfaces two key numbers: estimated CO₂ savings per month in kilograms, and the equivalent cost saving in euros — both calculated from your current usage volumes assuming the suggestion is fully adopted. The header counter shows progress through the suggestion queue.",
        }}
        action={
          <span className="flex items-center gap-1 text-xs text-primary font-medium">
            <Sparkles className="h-3.5 w-3.5" />
            Proactive
          </span>
        }
      >
        <div className="relative h-[360px] flex items-center justify-center">
          <AnimatePresence mode="popLayout" custom={direction}>
            {visible.length === 0 && (
              <motion.div
                key="empty"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center"
              >
                <div className="h-14 w-14 rounded-2xl bg-primary/10 text-primary mx-auto mb-3 flex items-center justify-center">
                  <Check className="h-7 w-7" />
                </div>
                <p className="text-sm font-medium mb-1">All suggestions reviewed</p>
                <p className="text-xs text-muted-foreground mb-4">
                  We'll surface new opportunities as your usage evolves.
                </p>
                <Button onClick={reset} variant="outline" size="sm" className="rounded-full">
                  Replay suggestions
                </Button>
              </motion.div>
            )}

            {visible.map((s, i) => (
              <motion.div
                key={s.id}
                custom={direction}
                initial={{
                  opacity: 0,
                  scale: 0.92,
                  y: 30,
                  rotate: 0,
                }}
                animate={{
                  opacity: i === 0 ? 1 : 0.6,
                  scale: i === 0 ? 1 : 0.94,
                  y: i === 0 ? 0 : 14,
                  rotate: i === 0 ? 0 : -2,
                  zIndex: 10 - i,
                }}
                exit={{
                  opacity: 0,
                  x: direction === 1 ? 320 : -320,
                  rotate: direction === 1 ? 18 : -18,
                  transition: { duration: 0.35 },
                }}
                transition={{ type: "spring", stiffness: 240, damping: 26 }}
                drag={i === 0 ? "x" : false}
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.7}
                onDragEnd={(_, info) => {
                  if (i !== 0) return;
                  if (info.offset.x > 120) advance("accept");
                  else if (info.offset.x < -120) advance("skip");
                }}
                className="absolute inset-x-0 mx-auto w-[92%] glass-solid rounded-3xl p-5 cursor-grab active:cursor-grabbing"
                style={{
                  boxShadow: i === 0 ? `0 20px 60px -20px ${s.accent}55` : undefined,
                }}
              >
                <div
                  className="h-12 w-12 rounded-2xl flex items-center justify-center mb-4"
                  style={{ background: `${s.accent}22`, color: s.accent }}
                >
                  {s.icon}
                </div>
                <h4 className="text-base font-semibold leading-snug mb-2">{s.title}</h4>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                  {s.description}
                </p>
                <div className="flex items-baseline gap-3 mb-5">
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      Est. savings / month
                    </div>
                    <div
                      className="text-2xl font-semibold tabular-nums"
                      style={{ color: s.accent }}
                    >
                      {s.savingsKwh} kWh{" "}
                      <span className="text-sm font-normal text-muted-foreground">energy</span>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">≈ €{s.savingsEur}</div>
                </div>
                {i === 0 && (
                  <div className="flex gap-2">
                    <Button
                      onClick={() => advance("skip")}
                      variant="outline"
                      className="flex-1 rounded-full h-11 border-white/60 bg-white/40 hover:bg-white/70"
                    >
                      <X className="h-4 w-4 mr-1.5" />
                      Skip
                    </Button>
                    <Button
                      onClick={() => advance("accept")}
                      className="flex-1 rounded-full h-11 text-white"
                      style={{ background: s.accent }}
                    >
                      <Check className="h-4 w-4 mr-1.5" />
                      Accept
                    </Button>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </GlassCard>

      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <DialogContent className="glass-solid max-w-lg rounded-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Report ready for review
            </DialogTitle>
            <DialogDescription>
              We've prepared a detailed analysis your team can circulate before deciding.
            </DialogDescription>
          </DialogHeader>
          {accepted && (
            <div className="space-y-4 text-sm">
              <div className="rounded-2xl bg-white/60 border border-white/70 p-4">
                <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
                  Suggestion
                </div>
                <div className="font-medium">{accepted.title}</div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-white/60 border border-white/70 p-4">
                  <div className="text-xs text-muted-foreground">Est. energy savings / mo</div>
                  <div
                    className="text-xl font-semibold tabular-nums"
                    style={{ color: accepted.accent }}
                  >
                    {accepted.savingsKwh} kWh
                  </div>
                </div>
                <div className="rounded-2xl bg-white/60 border border-white/70 p-4">
                  <div className="text-xs text-muted-foreground">Est. cost savings / mo</div>
                  <div className="text-xl font-semibold tabular-nums">€{accepted.savingsEur}</div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                The report contains the underlying data, affected workloads, technical
                implementation steps, risks and a rollout plan — to be discussed with the relevant
                internal stakeholders before any change is enforced.
              </p>
            </div>
          )}
          <DialogFooter className="flex-wrap gap-2 sm:gap-2">
            <Button variant="outline" onClick={() => setReportOpen(false)} className="rounded-full">
              Close
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                toast.success("Added to backlog", {
                  description: "We'll surface it again when the team reviews open items.",
                });
                setReportOpen(false);
              }}
              className="rounded-full"
            >
              <ListPlus className="h-4 w-4 mr-1.5" />
              Add to backlog
            </Button>
            <Button
              onClick={() => {
                toast.success("Report downloaded", { description: "Saved to your Downloads." });
                setReportOpen(false);
              }}
              className="rounded-full"
            >
              <Download className="h-4 w-4 mr-1.5" />
              Download report (PDF)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
