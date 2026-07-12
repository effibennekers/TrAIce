import { useState } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Leaf,
  ArrowRight,
  ArrowLeft,
  ExternalLink,
  Coins,
  ShieldAlert,
  FileCheck2,
  Zap,
  Factory,
  Lock,
  Upload,
  SlidersHorizontal,
  Sparkles,
  ShieldOff,
  Database,
} from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

const SIGNUP_URL =
  "https://forms.cloud.microsoft/pages/responsepage.aspx?id=ujzz4PV5YkaC5w5TbNoSMiOBEppOTIpKsqBrGc3mRaJUM0M3R0hYOVQyRllLU0hGM045N1FFMzNTNy4u";

const CONTRIBUTORS = ["ING", "RVO", "UWV", "DNB", "UvA", "University of Twente"];

const TRACK = [
  { icon: Coins, label: "Costs" },
  { icon: ShieldAlert, label: "Risk" },
  { icon: FileCheck2, label: "Compliance" },
];

const UNKNOWN = [
  { icon: Zap, label: "Energy consumption" },
  { icon: Factory, label: "Environmental impact" },
  { icon: Lock, label: "Vendor lock-in" },
];

const USAGE = [
  {
    icon: Upload,
    title: "Upload your own CSV",
    caption: "Swap the bundled sample for your gateway logs at any time.",
  },
  {
    icon: SlidersHorizontal,
    title: "Slice by team, model or provider",
    caption: "Filter the dashboard to the workflows that matter.",
  },
  {
    icon: Sparkles,
    title: "Simulate before you scale",
    caption: "Project the footprint of a rollout before committing.",
  },
];

export function WelcomeModal({ open, onOpenChange }: Props) {
  const [step, setStep] = useState(0);
  const total = 3;
  const titles = ["Welcome to TrAIce", "How to use it", "What's next"];

  function close() {
    onOpenChange(false);
    try {
      localStorage.setItem("traice.welcomeSeen", "1");
    } catch {
      // ignore
    }
    setTimeout(() => setStep(0), 300);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) close();
        else onOpenChange(true);
      }}
    >
      <DialogContent className="w-full max-w-2xl max-h-[100dvh] sm:max-h-[90vh] sm:rounded-3xl bg-background border border-border p-0 overflow-hidden flex flex-col gap-0">
        <DialogTitle className="sr-only">{titles[step]}</DialogTitle>
        <DialogDescription className="sr-only">
          A short introduction to TrAIce, how to use it, and how to get involved.
        </DialogDescription>

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-border/60">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-sm shadow-primary/20">
              <Leaf className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-foreground tracking-tight">TrAIce</span>
          </div>
          <span className="text-xs text-muted-foreground tabular-nums">
            Step {step + 1} of {total}
          </span>
        </div>

        <div className="px-6 sm:px-8 pt-6 pb-2 flex-1 overflow-y-auto min-h-0 sm:min-h-[420px]">
          {step === 0 && (
            <div className="space-y-6">
              <div>
                <div className="text-[11px] font-medium uppercase tracking-widest text-primary mb-2">
                  Welcome
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold leading-tight text-foreground">
                  Productivity is rising,
                  <br />
                  but control is not keeping pace.
                </h2>
              </div>

              <p className="text-sm text-muted-foreground leading-relaxed">
                Organisations already measure what AI saves — but rarely what it costs the planet.
                TrAIce closes the gap between what we track and what we still don't know.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="rounded-2xl border border-border bg-card p-4">
                  <div className="text-xs font-semibold text-muted-foreground mb-3">
                    We can track
                  </div>
                  <ul className="space-y-2">
                    {TRACK.map((t) => (
                      <li key={t.label} className="flex items-center gap-2 text-sm text-foreground">
                        <t.icon className="h-4 w-4 text-muted-foreground" />
                        {t.label}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4">
                  <div className="text-xs font-semibold text-primary mb-3">
                    But we still don't know
                  </div>
                  <ul className="space-y-2">
                    {UNKNOWN.map((t) => (
                      <li key={t.label} className="flex items-center gap-2 text-sm text-foreground">
                        <t.icon className="h-4 w-4 text-primary" />
                        {t.label}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-3 text-[11px] text-primary/80 italic">
                    The hidden costs of AI.
                  </div>
                </div>
              </div>

              <p className="text-xs text-muted-foreground">
                Built by contributors from{" "}
                <span className="text-foreground font-medium">{CONTRIBUTORS.join(" · ")}</span>{" "}
                during a TNO challenge on measuring the energy footprint of AI.
              </p>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-5">
              <div>
                <div className="text-[11px] font-medium uppercase tracking-widest text-primary mb-2">
                  How to use it
                </div>
                <h2 className="text-xl sm:text-2xl font-bold leading-tight text-foreground">
                  A decision layer for senior management — not just a dashboard.
                </h2>
              </div>

              <div className="space-y-2">
                {USAGE.map((u) => (
                  <div
                    key={u.title}
                    className="flex items-start gap-3 rounded-xl border border-border bg-card p-3"
                  >
                    <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <u.icon className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-foreground">{u.title}</div>
                      <div className="text-xs text-muted-foreground">{u.caption}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 space-y-2">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <ShieldOff className="h-4 w-4 text-amber-600" />
                  Don't use production data
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  This is a prototype. Please upload only synthetic or anonymised exports — never
                  real customer or employee data.
                </p>
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground pt-1">
                  <Database className="h-4 w-4 text-muted-foreground" />
                  No database, no server
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Everything runs in your browser. Uploaded CSVs are parsed client-side and
                  disappear on refresh — nothing is sent anywhere.
                </p>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div>
                <div className="text-[11px] font-medium uppercase tracking-widest text-primary mb-2">
                  What's next
                </div>
                <h2 className="text-xl sm:text-2xl font-bold leading-tight text-foreground">
                  Build this with us.
                </h2>
              </div>

              <p className="text-sm text-muted-foreground leading-relaxed">
                TrAIce is an open coalition prototype. We're looking for organisations willing to
                share anonymised workflow data, run pilots, and help make AI's energy footprint a
                board-level KPI — not a footnote.
              </p>

              <div className="space-y-3">
                {[
                  {
                    n: "1",
                    title: "Join the coalition",
                    caption: "Add your organisation to the shared evidence layer.",
                  },
                  {
                    n: "2",
                    title: "Run a pilot",
                    caption: "Bring one workflow — we bring the measurement stack.",
                  },
                  {
                    n: "3",
                    title: "Embed carbon in governance",
                    caption: "Make AI impact part of decision-making, not reporting.",
                  },
                ].map((a) => (
                  <div
                    key={a.n}
                    className="flex items-start gap-3 rounded-xl border border-border bg-card p-4"
                  >
                    <div className="h-6 w-6 rounded-full bg-muted text-muted-foreground flex items-center justify-center shrink-0 text-xs font-semibold">
                      {a.n}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-foreground">{a.title}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{a.caption}</div>
                    </div>
                  </div>
                ))}
              </div>

              <a
                href={SIGNUP_URL}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center gap-2 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm px-5 py-2.5 transition"
              >
                Sign up to join the coalition
                <ExternalLink className="h-4 w-4" />
              </a>

              <p className="text-[11px] text-muted-foreground">
                You can reopen this intro any time from the help button in the bottom-right corner.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/60 px-6 py-4 bg-muted/30">
          <div className="flex items-center gap-1.5">
            {Array.from({ length: total }).map((_, i) => (
              <button
                key={i}
                onClick={() => setStep(i)}
                aria-label={`Go to step ${i + 1}`}
                className={`h-1.5 rounded-full transition-all ${
                  i === step
                    ? "w-6 bg-primary"
                    : "w-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/50"
                }`}
              />
            ))}
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button
              variant="ghost"
              onClick={close}
              className="text-muted-foreground hover:text-foreground rounded-full h-9"
            >
              Skip
            </Button>
            {step > 0 && (
              <Button
                variant="outline"
                onClick={() => setStep((s) => Math.max(0, s - 1))}
                className="rounded-full h-9"
              >
                <ArrowLeft className="h-4 w-4 mr-1" /> Back
              </Button>
            )}
            {step < total - 1 ? (
              <Button
                onClick={() => setStep((s) => Math.min(total - 1, s + 1))}
                className="rounded-full h-9"
              >
                Next <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button onClick={close} className="rounded-full h-9">
                Enter dashboard <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
