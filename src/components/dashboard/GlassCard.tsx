import { type ReactNode } from "react";
import { Info } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export interface WidgetInfo {
  description: string;
  purpose: string;
  metrics: string;
}

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  info?: WidgetInfo;
}

function InfoButton({ title, info }: { title: string; info: WidgetInfo }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          aria-label={`About ${title}`}
          className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-transparent text-[11px] font-semibold text-primary hover:bg-primary/10 transition"
        >
          <Info className="h-3 w-3" />
        </button>
      </DialogTrigger>
      <DialogContent className="glass-solid max-w-lg rounded-3xl">
        <DialogHeader>
          <DialogTitle>About this widget · {title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 text-sm leading-relaxed text-foreground/90">
          <div>
            <h4 className="font-semibold mb-1">What you're looking at</h4>
            <p className="text-muted-foreground">{info.description}</p>
          </div>
          <div>
            <h4 className="font-semibold mb-1">Why it's here</h4>
            <p className="text-muted-foreground">{info.purpose}</p>
          </div>
          <div>
            <h4 className="font-semibold mb-1">Axes & metrics</h4>
            <p className="text-muted-foreground">{info.metrics}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function GlassCard({ children, className, title, subtitle, action, info }: GlassCardProps) {
  return (
    <div
      className={cn(
        "glass rounded-3xl p-5 md:p-6 transition-all duration-500 hover:shadow-xl",
        className,
      )}
    >
      {(title || action) && (
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            {title && (
              <h3 className="text-base font-semibold tracking-tight text-foreground inline-flex items-center gap-2">
                {title}
                {info && <InfoButton title={title} info={info} />}
              </h3>
            )}
            {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </div>
  );
}
