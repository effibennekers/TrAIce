import { useState } from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { GlassCard } from "./GlassCard";
import { MODEL_BY_ID, type ModelId } from "@/lib/models";
import { KWH_PER_KG, TASK_LABELS, USE_CASE_SHORT, type DashboardData } from "@/lib/mock-data";

type Mode = "useCase" | "task";

interface Props {
  data: DashboardData;
  models: ModelId[];
  labelOverrides?: string[];
}

export function ImpactBreakdownWidget({ data, models, labelOverrides }: Props) {
  const [mode, setMode] = useState<Mode>("useCase");

  const rows = (() => {
    if (mode === "useCase") {
      const source =
        labelOverrides && labelOverrides.length > 0
          ? data.byUseCase.slice(0, labelOverrides.length)
          : data.byUseCase;
      return source.map((r, i) => {
        const displayName = labelOverrides?.[i] ?? USE_CASE_SHORT[r.useCase] ?? r.useCase;
        const fullName = labelOverrides?.[i] ?? r.useCase;
        const out: Record<string, number | string> = { key: displayName, fullName };
        let total = 0;
        for (const m of models) {
          const kwh = +(((r[m] as number) ?? 0) * KWH_PER_KG).toFixed(2);
          out[m] = kwh;
          total += kwh;
        }
        out.total = +total.toFixed(2);
        return out;
      });
    }
    return data.byTaskType.map((r) => {
      const label = TASK_LABELS[r.task] ?? String(r.task);
      const out: Record<string, number | string> = { key: label, fullName: label };
      let total = 0;
      for (const m of models) {
        const kwh = +(((r[m] as number) ?? 0) * KWH_PER_KG).toFixed(2);
        out[m] = kwh;
        total += kwh;
      }
      out.total = +total.toFixed(2);
      return out;
    });
  })();
  rows.sort((a, b) => Number(b.total) - Number(a.total));

  return (
    <GlassCard
      title="Impact breakdown"
      subtitle={
        mode === "useCase"
          ? "By use case · stacked by model · highest-energy on the left"
          : "By task type · stacked by model · highest-energy on the left"
      }
      info={{
        description:
          "A stacked bar chart that breaks the organisation's AI energy down either by enterprise use case or by generic task type, with each bar segmented by the AI model that produced the demand.",
        purpose:
          "Lets leaders pivot between the business view (which workflows dominate) and the operational view (which kinds of tasks dominate) without leaving the page — so optimisation effort lands where it actually moves the needle.",
        metrics:
          "X-axis: use case or task type, sorted from highest to lowest total impact. Y-axis: energy in kilowatt-hours for the selected window. Stack segments: contribution per selected model.",
      }}
      action={
        <div className="inline-flex rounded-full p-1 bg-white/60 border border-white/70 text-xs">
          {(
            [
              { id: "useCase", label: "Per use case" },
              { id: "task", label: "Per task type" },
            ] as { id: Mode; label: string }[]
          ).map((opt) => (
            <button
              key={opt.id}
              onClick={() => setMode(opt.id)}
              className={`px-3 py-1.5 rounded-full font-medium transition ${
                mode === opt.id
                  ? "bg-primary text-primary-foreground shadow"
                  : "text-muted-foreground"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      }
    >
      <div className="h-[340px] -mx-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} margin={{ top: 10, right: 8, left: 0, bottom: 60 }}>
            <CartesianGrid stroke="rgba(120,120,150,0.15)" vertical={false} />
            <XAxis
              dataKey="key"
              stroke="rgba(80,80,110,0.7)"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              angle={-25}
              textAnchor="end"
              interval={0}
              height={70}
            />
            <YAxis
              stroke="rgba(80,80,110,0.6)"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `${v} kWh`}
            />
            <Tooltip
              cursor={{ fill: "rgba(120,120,150,0.08)" }}
              contentStyle={{
                background: "rgba(255,255,255,0.92)",
                backdropFilter: "blur(12px)",
                border: "1px solid rgba(255,255,255,0.5)",
                borderRadius: 12,
                fontSize: 12,
              }}
              formatter={(value, name) => {
                const meta = MODEL_BY_ID[name as ModelId];
                const num = typeof value === "number" ? value : Number(value ?? 0);
                return [`${num.toFixed(1)} kWh`, meta?.short ?? String(name)];
              }}
            />
            {models.map((m, idx) => {
              const meta = MODEL_BY_ID[m];
              const isLast = idx === models.length - 1;
              return (
                <Bar
                  key={m}
                  dataKey={m}
                  stackId="co2"
                  fill={meta.color}
                  radius={isLast ? [8, 8, 0, 0] : [0, 0, 0, 0]}
                />
              );
            })}
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="flex flex-wrap gap-3 mt-2 px-2">
        {models.map((m) => {
          const meta = MODEL_BY_ID[m];
          return (
            <div key={m} className="flex items-center gap-1.5 text-xs">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: meta.color }} />
              <span className="text-muted-foreground">{meta.name}</span>
            </div>
          );
        })}
      </div>
    </GlassCard>
  );
}
