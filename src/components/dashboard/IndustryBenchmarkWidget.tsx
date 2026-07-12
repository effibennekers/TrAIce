import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
  LabelList,
} from "recharts";
import { GlassCard } from "./GlassCard";
import type { DashboardData } from "@/lib/mock-data";

interface Props {
  data: DashboardData;
}

export function IndustryBenchmarkWidget({ data }: Props) {
  const rows = [
    { name: "Your organisation", value: data.industry.yourOrg, isUs: true },
    { name: "Banking industry avg.", value: data.industry.banking, isUs: false },
  ];
  const diff = ((data.industry.yourOrg - data.industry.banking) / data.industry.banking) * 100;

  return (
    <GlassCard
      title="Industry benchmark"
      subtitle="kWh per 1,000 prompts · your organisation vs. the banking industry average"
      info={{
        description:
          "A two-bar chart that puts your organisation's AI energy intensity directly next to the banking-industry average so a single glance is enough to see where you sit.",
        purpose:
          "Gives executives an external sanity check: are we more or less efficient than our peers in the same regulated sector? It strips away noise from other industries and keeps the comparison apples-to-apples.",
        metrics:
          "X-axis: entity (your organisation vs. banking industry average). Y-axis: energy intensity in kilowatt-hours per 1,000 prompts — usage-normalised so volume differences don't distort the picture. The header shows the percentage gap to the industry average.",
      }}
      action={
        <div className="text-right">
          <div
            className="text-xl font-semibold tabular-nums"
            style={{ color: diff < 0 ? "#22c55e" : "#ef4444" }}
          >
            {diff < 0 ? "↓" : "↑"} {Math.abs(diff).toFixed(0)}%
          </div>
          <div className="text-xs text-muted-foreground">vs. banking avg.</div>
        </div>
      }
    >
      <div className="h-[260px] -mx-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} margin={{ top: 24, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="rgba(120,120,150,0.15)" vertical={false} />
            <XAxis
              dataKey="name"
              stroke="rgba(80,80,110,0.7)"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis stroke="rgba(80,80,110,0.6)" fontSize={11} tickLine={false} axisLine={false} />
            <Tooltip
              cursor={{ fill: "rgba(120,120,150,0.08)" }}
              contentStyle={{
                background: "rgba(255,255,255,0.92)",
                backdropFilter: "blur(12px)",
                border: "1px solid rgba(255,255,255,0.5)",
                borderRadius: 12,
                fontSize: 12,
              }}
              formatter={(v) => [`${v} kWh / 1k prompts`, "Energy intensity"]}
            />
            <Bar dataKey="value" radius={[10, 10, 0, 0]} barSize={90}>
              {rows.map((p) => (
                <Cell key={p.name} fill={p.isUs ? "#eab308" : "#94a3b8"} />
              ))}
              <LabelList
                dataKey="value"
                position="top"
                formatter={(v: unknown) => `${v}`}
                style={{ fontSize: 12, fill: "rgba(60,60,90,0.85)", fontWeight: 600 }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </GlassCard>
  );
}
