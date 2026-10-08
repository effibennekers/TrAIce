import { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import { GlassCard } from "./GlassCard";
import { MODEL_BY_ID, MODELS, type ModelId } from "@/lib/models";
import { formatNumber, KWH_PER_KG, EUR_PER_KWH, type DashboardData } from "@/lib/mock-data";
import { Users, Hash, Zap, Info, Euro, Timer, SlidersHorizontal } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

type Metric = "kwh" | "co2" | "cost";

interface UsageWidgetProps {
  data: DashboardData;
  models: ModelId[];
}

function MeasurementInfo() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="text-xs font-medium text-primary hover:underline inline-flex items-center gap-1">
          <Info className="h-3.5 w-3.5" />
          How is this measured?
        </button>
      </DialogTrigger>
      <DialogContent className="glass-solid max-w-lg rounded-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>How energy & emissions are measured</DialogTitle>
          <DialogDescription>
            A transparent look at the assumptions behind the numbers.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 text-sm leading-relaxed text-foreground/90">
          <div>
            <h4 className="font-semibold mb-1">Data model</h4>
            <p className="text-muted-foreground">
              For every prompt sent through the AI gateway we log the model, input tokens, output
              tokens, datacenter region and the requesting department. Energy is estimated per
              request and aggregated to the chart bucket (hour, day, week or month) shown above.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-1">Formula</h4>
            <pre className="text-xs bg-white/60 dark:bg-white/5 rounded-xl p-3 overflow-x-auto">
              {`energy_kwh = (tokens / 1000) × kwh_per_1k_tokens(model)
emissions_kg = energy_kwh × grid_intensity(datacenter)
cost_eur    = energy_kwh × €${EUR_PER_KWH.toFixed(2)} (blended)`}
            </pre>
          </div>
          <div>
            <h4 className="font-semibold mb-1">Per-model factors (kWh / 1k tokens)</h4>
            <ul className="space-y-1">
              {MODELS.map((m) => (
                <li key={m.id} className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: m.color }} />
                  <span className="font-medium">{m.name}</span>
                  {m.verified ? (
                    <span className="text-[9px] uppercase tracking-wider font-semibold rounded-full px-1.5 py-0.5 bg-emerald-500/15 text-emerald-700">
                      Verified
                    </span>
                  ) : (
                    <span className="text-[9px] uppercase tracking-wider font-medium rounded-full px-1.5 py-0.5 bg-amber-500/10 text-amber-700">
                      Unverified
                    </span>
                  )}
                  <span className="ml-auto tabular-nums text-muted-foreground">
                    {m.co2PerKToken < 0.001
                      ? `${(m.co2PerKToken * 1000).toFixed(3)} Wh`
                      : `${(m.co2PerKToken * 1000).toFixed(2)} Wh`}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-1">Assumptions</h4>
            <ul className="list-disc pl-5 text-muted-foreground space-y-1">
              <li>
                Per-token factors blend training amortisation, inference compute (GPU energy mix)
                and datacenter PUE.
              </li>
              <li>
                We default to <strong>kWh</strong> because energy is directly metered, while CO₂
                depends on grid mix at the chosen datacenter.
              </li>
              <li>Embodied hardware emissions are amortised over a 4-year lifetime.</li>
              <li>Network and client-side energy are excluded — typically &lt;3%.</li>
              <li>
                Each line shows a ±5% uncertainty band reflecting telemetry drift between the
                gateway and provider invoices.
              </li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Kpi({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <div className="flex-1 min-w-[140px]">
      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1.5">
        <span
          className="h-7 w-7 rounded-xl flex items-center justify-center"
          style={{ background: `${accent}22`, color: accent }}
        >
          {icon}
        </span>
        {label}
      </div>
      <div className="text-3xl md:text-4xl font-semibold tracking-tight tabular-nums text-foreground">
        {value}
      </div>
    </div>
  );
}

type Confidence = "high" | "standard" | "low";
const CONFIDENCE_OPTIONS: { id: Confidence; label: string; margin: number; hint: string }[] = [
  { id: "high", label: "High confidence", margin: 0.02, hint: "±2% — verified telemetry only" },
  { id: "standard", label: "Standard", margin: 0.05, hint: "±5% — default gateway estimate" },
  { id: "low", label: "Exploratory", margin: 0.1, hint: "±10% — includes unverified models" },
];

export function UsageWidget({ data, models }: UsageWidgetProps) {
  const [metric, setMetric] = useState<Metric>("kwh");
  const [confidence, setConfidence] = useState<Confidence>("standard");
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const errorMargin = CONFIDENCE_OPTIONS.find((c) => c.id === confidence)!.margin;
  const marginPct = Math.round(errorMargin * 100);

  const chartData = useMemo(() => {
    return data.series.map((p) => {
      const next: Record<string, number | string | [number, number]> = {
        label: p.label,
        ts: p.ts,
      };
      for (const m of models) {
        const co2 = (p[m] as number) ?? 0;
        const kwh = +(co2 * KWH_PER_KG).toFixed(2);
        let v: number;
        if (metric === "co2") v = co2;
        else if (metric === "kwh") v = kwh;
        else v = +(kwh * EUR_PER_KWH).toFixed(2);
        next[m] = v;
        const isVerified = MODEL_BY_ID[m]?.verified;
        const margin = isVerified && confidence !== "low" ? 0 : errorMargin;
        next[`${m}__band`] = [+(v * (1 - margin)).toFixed(2), +(v * (1 + margin)).toFixed(2)];
      }
      return next;
    });
  }, [data.series, models, metric, errorMargin, confidence]);

  // Per-bucket weights based on CO2 (model-independent proxy) so KPIs can
  // shrink to a single bucket on hover.
  const bucketWeights = useMemo(() => {
    return data.series.map((p) => {
      let sum = 0;
      for (const m of models) sum += (p[m] as number) ?? 0;
      return sum;
    });
  }, [data.series, models]);
  const totalWeight = bucketWeights.reduce((s, v) => s + v, 0) || 1;

  const hoveredBucket =
    hoverIdx != null && hoverIdx >= 0 && hoverIdx < data.series.length
      ? data.series[hoverIdx]
      : null;

  const displayTotals = useMemo(() => {
    if (hoverIdx == null || !hoveredBucket) return data.totals;
    const frac = bucketWeights[hoverIdx] / totalWeight;
    return {
      tokens: Math.round(data.totals.tokens * frac),
      prompts: Math.round(data.totals.prompts * frac),
      users: Math.max(1, Math.round(data.totals.users * frac)),
      costEur: Math.round(data.totals.costEur * frac),
      latencyMs: data.totals.latencyMs,
    };
  }, [hoverIdx, hoveredBucket, bucketWeights, totalWeight, data.totals]);

  const unit = metric === "co2" ? "kg" : metric === "kwh" ? "kWh" : "€";
  const metricLabel = metric === "co2" ? "CO₂" : metric === "kwh" ? "Energy" : "Cost";

  const fmt = (v: number) => (metric === "cost" ? `€${v.toFixed(2)}` : `${v.toFixed(2)} ${unit}`);

  return (
    <GlassCard
      title="Usage & emissions over time"
      subtitle={`${metricLabel} per period · one line per selected model · ±${marginPct}% margin shaded`}
      info={{
        description:
          "A multi-line time-series chart with one coloured line per selected AI model, each surrounded by a soft ±5% uncertainty band, sitting above five summary KPIs (tokens, prompts, active users, cost, average latency) for the same period.",
        purpose:
          "Lets decision makers see how AI consumption, its energy demand and cost evolve over the chosen window, spot growth trends, weekend dips and outlier days, and compare models head-to-head before choosing where to optimise.",
        metrics:
          "X-axis: time bucket (hour, day, week or month). Y-axis: energy in kWh (default), emissions in kg CO₂, or cost in € — toggled in the header. Each line is wrapped in a translucent error band of ±5% in the model's own colour. KPI tiles use absolute totals — tokens, prompts, active users, cost (EUR) and average latency (ms).",
      }}
      action={
        <div className="flex items-center gap-3 flex-wrap">
          <div className="inline-flex rounded-full p-1 bg-white/60 border border-white/70 text-xs">
            {(
              [
                { id: "kwh", label: "Energy (kWh)" },
                { id: "co2", label: "Emissions" },
                { id: "cost", label: "Cost (€)" },
              ] as { id: Metric; label: string }[]
            ).map((opt) => (
              <button
                key={opt.id}
                onClick={() => setMetric(opt.id)}
                className={`px-3 py-1.5 rounded-full font-medium transition ${
                  metric === opt.id
                    ? "bg-primary text-primary-foreground shadow"
                    : "text-muted-foreground"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <button
                className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground rounded-full px-2.5 py-1.5 bg-white/40 border border-white/60 transition"
                title="Adjust uncertainty band"
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />±{marginPct}%
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-64 p-2 glass-solid rounded-2xl">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground px-2 pt-1 pb-1.5">
                Uncertainty band
              </p>
              <div className="flex flex-col gap-0.5">
                {CONFIDENCE_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setConfidence(opt.id)}
                    className={`text-left rounded-lg px-2.5 py-2 transition ${
                      confidence === opt.id ? "bg-primary/15 text-primary" : "hover:bg-white/50"
                    }`}
                  >
                    <div className="text-sm font-medium">{opt.label}</div>
                    <div className="text-[11px] text-muted-foreground">{opt.hint}</div>
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
          <MeasurementInfo />
        </div>
      }
    >
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-2">
        <Kpi
          icon={<Hash className="h-4 w-4" />}
          label="Tokens used"
          value={formatNumber(displayTotals.tokens)}
          accent="#FCAB10"
        />
        <Kpi
          icon={<Zap className="h-4 w-4" />}
          label="Prompts"
          value={formatNumber(displayTotals.prompts)}
          accent="#2B9EB3"
        />
        <Kpi
          icon={<Users className="h-4 w-4" />}
          label="Active users"
          value={displayTotals.users.toString()}
          accent="#44AF69"
        />
        <Kpi
          icon={<Euro className="h-4 w-4" />}
          label="Cost"
          value={`€${formatNumber(displayTotals.costEur)}`}
          accent="#A259FF"
        />
        <Kpi
          icon={<Timer className="h-4 w-4" />}
          label="Avg. latency"
          value={`${displayTotals.latencyMs} ms`}
          accent="#FF5C8A"
        />
      </div>
      <p className="text-[11px] text-muted-foreground mb-4 px-1 h-4">
        {hoveredBucket
          ? `Showing values for ${hoveredBucket.label} · move away from the chart for window totals`
          : ""}
      </p>

      <div className="h-[280px] -mx-2">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            margin={{ top: 10, right: 16, left: 0, bottom: 0 }}
            onMouseMove={(state: {
              activeTooltipIndex?: number | string | null;
              isTooltipActive?: boolean;
            }) => {
              const idx = state?.activeTooltipIndex;
              if (state?.isTooltipActive && typeof idx === "number") {
                setHoverIdx(idx);
              } else {
                setHoverIdx(null);
              }
            }}
            onMouseLeave={() => setHoverIdx(null)}
          >
            <CartesianGrid stroke="rgba(120,120,150,0.15)" vertical={false} />
            <XAxis
              dataKey="label"
              stroke="rgba(80,80,110,0.6)"
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="rgba(80,80,110,0.6)"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => (metric === "cost" ? `€${v}` : `${v} ${unit}`)}
            />
            <Tooltip
              contentStyle={{
                background: "rgba(255,255,255,0.92)",
                backdropFilter: "blur(12px)",
                border: "1px solid rgba(255,255,255,0.5)",
                borderRadius: 12,
                boxShadow: "0 10px 30px -10px rgba(0,0,0,0.2)",
                fontSize: 12,
              }}
              formatter={(value, name) => {
                if (typeof name === "string" && name.endsWith("__band"))
                  return null as unknown as [string, string];
                const meta = MODEL_BY_ID[name as ModelId];
                const num = typeof value === "number" ? value : Number(value ?? 0);
                return [fmt(num), meta?.short ?? String(name)];
              }}
            />
            <Legend
              wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
              iconType="circle"
              formatter={(value) => {
                if (typeof value === "string" && value.endsWith("__band")) return "";
                return MODEL_BY_ID[value as ModelId]?.name ?? String(value);
              }}
            />
            {models.map((m) => {
              const meta = MODEL_BY_ID[m];
              return (
                <Area
                  key={`${m}-band`}
                  type="monotone"
                  dataKey={`${m}__band`}
                  stroke="none"
                  fill={meta.color}
                  fillOpacity={0.18}
                  isAnimationActive={false}
                  legendType="none"
                  activeDot={false}
                />
              );
            })}
            {models.map((m) => {
              const meta = MODEL_BY_ID[m];
              return (
                <Line
                  key={m}
                  type="monotone"
                  dataKey={m}
                  stroke={meta.color}
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 5, strokeWidth: 2, fill: "white", stroke: meta.color }}
                />
              );
            })}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </GlassCard>
  );
}
