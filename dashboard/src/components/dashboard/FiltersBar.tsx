import { useState } from "react";
import { format } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { CalendarIcon, ChevronDown, Filter, Cloud, MapPin, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { MODELS, type ModelId } from "@/lib/models";
import { getModelEnergyLabel } from "@/lib/model-label";
import {
  PROVIDERS,
  DATA_CENTERS,
  DEPARTMENTS,
  getToday,
  isFuturePreset,
  type ProviderId,
  type DataCenterId,
  type DepartmentId,
  type TimePreset,
} from "@/lib/mock-data";

const PAST_TIME_OPTIONS: { id: TimePreset; label: string }[] = [
  { id: "day", label: "Last day" },
  { id: "week", label: "Last week" },
  { id: "month", label: "Last month" },
  { id: "quarter", label: "Last quarter" },
  { id: "year", label: "Last 365 days" },
  { id: "custom", label: "Custom range" },
];

const FUTURE_TIME_OPTIONS: { id: TimePreset; label: string }[] = [
  { id: "next-week", label: "Next week" },
  { id: "next-month", label: "Next month" },
  { id: "next-quarter", label: "Next quarter" },
  { id: "next-year", label: "Next 365 days" },
  { id: "custom", label: "Custom range" },
];

interface FiltersBarProps {
  preset: TimePreset;
  customStart?: Date;
  customEnd?: Date;
  models: ModelId[];
  provider: ProviderId;
  dataCenter: DataCenterId;
  department: DepartmentId;
  mode?: "historical" | "simulated";
  /** Optional overrides — when uploaded data is present, restrict to values found in the CSV. */
  departmentOptions?: { id: string; label: string }[];
  providerOptions?: { id: string; label: string }[];
  dataCenterOptions?: { id: string; label: string; region?: string }[];
  modelOptions?: ModelId[];
  onChange: (next: {
    preset?: TimePreset;
    customStart?: Date;
    customEnd?: Date;
    models?: ModelId[];
    provider?: ProviderId;
    dataCenter?: DataCenterId;
    department?: DepartmentId;
  }) => void;
}

export function FiltersBar({
  preset,
  customStart,
  customEnd,
  models,
  provider,
  dataCenter,
  department,
  mode = "historical",
  departmentOptions,
  providerOptions,
  dataCenterOptions,
  modelOptions,
  onChange,
}: FiltersBarProps) {
  const [timeOpen, setTimeOpen] = useState(false);
  const [modelsOpen, setModelsOpen] = useState(false);
  const [providerOpen, setProviderOpen] = useState(false);
  const [dcOpen, setDcOpen] = useState(false);
  const [deptOpen, setDeptOpen] = useState(false);
  const providerList = providerOptions ?? PROVIDERS;
  const dcList = dataCenterOptions ?? DATA_CENTERS;
  const deptList = departmentOptions ?? DEPARTMENTS;
  const modelList = modelOptions ? MODELS.filter((m) => modelOptions.includes(m.id)) : MODELS;
  const providerLabel = providerList.find((p) => p.id === provider)?.label ?? "Provider";
  const dcLabel = dcList.find((d) => d.id === dataCenter)?.label ?? "Data center";
  const deptLabel = deptList.find((d) => d.id === department)?.label ?? "Department";

  const timeOptions = mode === "simulated" ? FUTURE_TIME_OPTIONS : PAST_TIME_OPTIONS;
  const today = getToday();

  const currentLabel =
    preset === "custom" && customStart && customEnd
      ? `${format(customStart, "MMM d")} – ${format(customEnd, "MMM d, yyyy")}`
      : (timeOptions.find((t) => t.id === preset)?.label ?? "Time");

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Time period */}
      <Popover open={timeOpen} onOpenChange={setTimeOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="glass-solid rounded-full px-4 h-10 gap-2 font-medium"
          >
            <CalendarIcon className="h-4 w-4 opacity-70" />
            {currentLabel}
            <ChevronDown className="h-4 w-4 opacity-60" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-auto p-3 glass-solid rounded-2xl">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground px-2 pb-2">
            {mode === "simulated" ? "Simulated future" : "Historical window"}
          </p>
          <div className="flex flex-col gap-1 min-w-[180px]">
            {timeOptions.map((opt) => (
              <button
                key={opt.id}
                onClick={() => {
                  if (opt.id !== "custom") {
                    onChange({ preset: opt.id });
                    setTimeOpen(false);
                  } else {
                    onChange({ preset: "custom" });
                  }
                }}
                className={cn(
                  "text-left rounded-lg px-3 py-2 text-sm hover:bg-white/50 dark:hover:bg-white/10 transition",
                  preset === opt.id && "bg-primary/15 text-primary font-medium",
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
          {preset === "custom" && (
            <div className="mt-3 border-t border-white/40 pt-3">
              <Calendar
                mode="range"
                selected={{ from: customStart, to: customEnd }}
                onSelect={(range) => {
                  onChange({ customStart: range?.from, customEnd: range?.to });
                  if (range?.from && range?.to) setTimeOpen(false);
                }}
                numberOfMonths={1}
                disabled={mode === "simulated" ? { before: today } : { after: today }}
              />
            </div>
          )}
        </PopoverContent>
      </Popover>

      {/* Models */}
      <Popover open={modelsOpen} onOpenChange={setModelsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="glass-solid rounded-full px-4 h-10 gap-2 font-medium"
          >
            <Filter className="h-4 w-4 opacity-70" />
            {models.length === MODELS.length
              ? "All models"
              : `${models.length} model${models.length === 1 ? "" : "s"}`}
            <ChevronDown className="h-4 w-4 opacity-60" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="end"
          className="w-80 p-3 glass-solid rounded-2xl max-h-[480px] overflow-y-auto"
        >
          <p className="text-xs font-medium text-muted-foreground mb-2 px-1">Compare models</p>
          <div className="flex flex-col gap-1">
            {(() => {
              const allIds = modelList.map((m) => m.id);
              const allSelected = allIds.length > 0 && allIds.every((id) => models.includes(id));
              return (
                <label className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-white/50 dark:hover:bg-white/10 cursor-pointer border-b border-white/40 mb-1 pb-2">
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={(v) => {
                      if (v) onChange({ models: allIds.slice() });
                      else onChange({ models: allIds.slice(0, 1) });
                    }}
                  />
                  <Label className="text-sm flex-1 font-semibold cursor-pointer">All models</Label>
                </label>
              );
            })()}
            {modelList.map((m) => {
              const checked = models.includes(m.id);
              return (
                <label
                  key={m.id}
                  className="flex items-center gap-3 rounded-lg px-2 py-2 transition hover:bg-white/50 dark:hover:bg-white/10 cursor-pointer"
                >
                  <Checkbox
                    checked={checked}
                    onCheckedChange={(v) => {
                      let next = models.slice();
                      if (v) {
                        if (!next.includes(m.id)) next.push(m.id);
                      } else {
                        next = next.filter((x) => x !== m.id);
                      }
                      if (next.length === 0) return;
                      onChange({ models: next });
                    }}
                  />
                  <span
                    className="h-3 w-3 rounded-full ring-2 ring-white/60 shrink-0"
                    style={{ background: m.color }}
                  />
                  <Label className="text-sm flex-1 flex items-center gap-1.5 cursor-pointer">
                    {m.name}
                    {(() => {
                      const lbl = getModelEnergyLabel(m.id);
                      return (
                        <span
                          className="text-[10px] font-bold rounded px-1.5 py-0.5 text-white leading-none"
                          style={{ background: lbl.color }}
                          title={`Energy label ${lbl.grade} · ${lbl.description}${m.verified ? "" : " · supplier unverified"}`}
                        >
                          {lbl.grade}
                        </span>
                      );
                    })()}
                    {m.verified ? (
                      <span className="text-[9px] uppercase tracking-wider font-medium rounded-full px-1.5 py-0.5 bg-emerald-500/15 text-emerald-700">
                        Verified
                      </span>
                    ) : (
                      <span className="text-[9px] uppercase tracking-wider font-medium rounded-full px-1.5 py-0.5 bg-amber-500/10 text-amber-700">
                        Unverified
                      </span>
                    )}
                  </Label>
                </label>
              );
            })}
          </div>
        </PopoverContent>
      </Popover>

      {/* Provider */}
      <Popover open={providerOpen} onOpenChange={setProviderOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="glass-solid rounded-full px-4 h-10 gap-2 font-medium"
          >
            <Cloud className="h-4 w-4 opacity-70" />
            {providerLabel}
            <ChevronDown className="h-4 w-4 opacity-60" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-56 p-2 glass-solid rounded-2xl">
          <div className="flex flex-col gap-1">
            {providerList.map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  onChange({ provider: p.id as ProviderId });
                  setProviderOpen(false);
                }}
                className={cn(
                  "text-left rounded-lg px-3 py-2 text-sm hover:bg-white/50 dark:hover:bg-white/10 transition",
                  provider === p.id && "bg-primary/15 text-primary font-medium",
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>

      {/* Department */}
      <Popover open={deptOpen} onOpenChange={setDeptOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="glass-solid rounded-full px-4 h-10 gap-2 font-medium"
          >
            <Building2 className="h-4 w-4 opacity-70" />
            {deptLabel}
            <ChevronDown className="h-4 w-4 opacity-60" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="end"
          className="w-64 p-2 glass-solid rounded-2xl max-h-[420px] overflow-y-auto"
        >
          <div className="flex flex-col gap-1">
            {deptList.map((d) => (
              <button
                key={d.id}
                onClick={() => {
                  onChange({ department: d.id as DepartmentId });
                  setDeptOpen(false);
                }}
                className={cn(
                  "text-left rounded-lg px-3 py-2 text-sm hover:bg-white/50 dark:hover:bg-white/10 transition",
                  department === d.id && "bg-primary/15 text-primary font-medium",
                )}
              >
                {d.label}
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>

      {/* Data center */}
      <Popover open={dcOpen} onOpenChange={setDcOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="glass-solid rounded-full px-4 h-10 gap-2 font-medium"
          >
            <MapPin className="h-4 w-4 opacity-70" />
            {dcLabel}
            <ChevronDown className="h-4 w-4 opacity-60" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="end"
          className="w-64 p-2 glass-solid rounded-2xl max-h-[420px] overflow-y-auto"
        >
          {dataCenterOptions ? (
            <div className="flex flex-col gap-1">
              {dcList.map((d) => (
                <button
                  key={d.id}
                  onClick={() => {
                    onChange({ dataCenter: d.id as DataCenterId });
                    setDcOpen(false);
                  }}
                  className={cn(
                    "w-full text-left rounded-lg px-3 py-2 text-sm hover:bg-white/50 dark:hover:bg-white/10 transition",
                    dataCenter === d.id && "bg-primary/15 text-primary font-medium",
                  )}
                >
                  {d.label}
                </button>
              ))}
            </div>
          ) : (
            <>
              <p className="text-xs font-medium text-muted-foreground mb-1.5 px-2 pt-1">EU</p>
              {DATA_CENTERS.filter((d) => d.region === "eu" || d.id === "all").map((d) => (
                <button
                  key={d.id}
                  onClick={() => {
                    onChange({ dataCenter: d.id });
                    setDcOpen(false);
                  }}
                  className={cn(
                    "w-full text-left rounded-lg px-3 py-2 text-sm hover:bg-white/50 dark:hover:bg-white/10 transition",
                    dataCenter === d.id && "bg-primary/15 text-primary font-medium",
                  )}
                >
                  {d.label}
                </button>
              ))}
              <p className="text-xs font-medium text-muted-foreground mb-1.5 px-2 pt-2">US</p>
              {DATA_CENTERS.filter((d) => d.region === "us").map((d) => (
                <button
                  key={d.id}
                  onClick={() => {
                    onChange({ dataCenter: d.id });
                    setDcOpen(false);
                  }}
                  className={cn(
                    "w-full text-left rounded-lg px-3 py-2 text-sm hover:bg-white/50 dark:hover:bg-white/10 transition",
                    dataCenter === d.id && "bg-primary/15 text-primary font-medium",
                  )}
                >
                  {d.label}
                </button>
              ))}
            </>
          )}
        </PopoverContent>
      </Popover>
      {/* prevent unused */}
      <span className="hidden">{isFuturePreset(preset) ? "f" : ""}</span>
    </div>
  );
}
