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
import { Building2 } from "lucide-react";
import { GlassCard } from "./GlassCard";
import type { DashboardData, DepartmentId } from "@/lib/mock-data";

interface Props {
  data: DashboardData;
  department: DepartmentId;
}

export function DepartmentBenchmarkWidget({ data, department }: Props) {
  const selected = data.byDepartment.find((d) => d.id === department);
  // Put the selected department on the left, the rest sorted ascending after it.
  const rest = data.byDepartment
    .filter((d) => d.id !== department)
    .sort((a, b) => a.value - b.value);
  const sorted = selected
    ? [selected, ...rest]
    : [...data.byDepartment].sort((a, b) => a.value - b.value);

  return (
    <GlassCard
      title="Department benchmark"
      subtitle="kWh per 1,000 prompts · selected department vs. the rest"
      info={{
        description:
          "A horizontal sort of every department in the bank by AI energy intensity, with the department you've picked in the top filter highlighted so you can immediately see how it ranks against its peers internally.",
        purpose:
          "Helps a department head see whether they are punching above or below their weight on responsible AI use, and gives central teams a fast way to spot which department to engage with first.",
        metrics:
          "X-axis: department. Y-axis: energy intensity in kilowatt-hours per 1,000 prompts (lower is better). The selected department is highlighted in the brand colour; the others are muted grey.",
      }}
    >
      {department === "all" || !selected ? (
        <div className="h-[260px] flex flex-col items-center justify-center text-center px-6">
          <div className="h-14 w-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-3">
            <Building2 className="h-7 w-7" />
          </div>
          <p className="text-sm font-medium mb-1">Select a department to compare</p>
          <p className="text-xs text-muted-foreground max-w-sm">
            Pick a department in the filter bar above to benchmark it against the other departments
            in your organisation.
          </p>
        </div>
      ) : (
        <div className="h-[260px] -mx-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={sorted} margin={{ top: 22, right: 12, left: 0, bottom: 56 }}>
              <CartesianGrid stroke="rgba(120,120,150,0.15)" vertical={false} />
              <XAxis
                dataKey="label"
                stroke="rgba(80,80,110,0.7)"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                angle={-25}
                textAnchor="end"
                interval={0}
                height={64}
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
              <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                {sorted.map((d) => (
                  <Cell key={d.id} fill={d.id === department ? "#6366F1" : "#94a3b8"} />
                ))}
                <LabelList
                  dataKey="value"
                  position="top"
                  formatter={(v: unknown) => `${v}`}
                  style={{ fontSize: 10, fill: "rgba(60,60,90,0.7)" }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </GlassCard>
  );
}
