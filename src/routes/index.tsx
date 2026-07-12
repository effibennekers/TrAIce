import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Leaf, Sparkles, RotateCcw, Upload, HelpCircle } from "lucide-react";
import { FiltersBar } from "@/components/dashboard/FiltersBar";
import { AISearch } from "@/components/dashboard/AISearch";
import { UsageWidget } from "@/components/dashboard/UsageWidget";
import { ImpactBreakdownWidget } from "@/components/dashboard/ImpactBreakdownWidget";
import { ProductivityWidget } from "@/components/dashboard/ProductivityWidget";
import { SuggestionsWidget } from "@/components/dashboard/SuggestionsWidget";

import { IndustryBenchmarkWidget } from "@/components/dashboard/IndustryBenchmarkWidget";
import { DepartmentBenchmarkWidget } from "@/components/dashboard/DepartmentBenchmarkWidget";
import { SimulationModal } from "@/components/dashboard/SimulationModal";
import { UploadDataModal, UploadedChip } from "@/components/dashboard/UploadDataModal";
import { WelcomeModal } from "@/components/dashboard/WelcomeModal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { getSimulationMultiplier, type SimulationInput } from "@/lib/simulation";
import { DEFAULT_MODEL_IDS, type ModelId } from "@/lib/models";
import {
  DATA_CENTERS,
  DEPARTMENTS,
  PROVIDERS,
  generateData,
  setTodayOverride,
  type ProviderId,
  type DataCenterId,
  type DepartmentId,
  type TimePreset,
} from "@/lib/mock-data";
import {
  aggregateUploaded,
  parseCsv,
  buildDataset,
  type UploadedDataset,
  type BaselineDataset,
} from "@/lib/uploaded-data";
import { autoMap } from "@/lib/csv-schema";

export const Route = createFileRoute("/")({
  component: Dashboard,
  head: () => ({
    meta: [
      { title: "TrAIce Dashboard" },
      {
        name: "description",
        content:
          "Actionable enterprise dashboard tracking the carbon footprint of AI usage across teams, models and time.",
      },
    ],
  }),
});

function Dashboard() {
  const [preset, setPreset] = useState<TimePreset>("month");
  const [customStart, setCustomStart] = useState<Date | undefined>();
  const [customEnd, setCustomEnd] = useState<Date | undefined>();
  const [models, setModels] = useState<ModelId[]>(DEFAULT_MODEL_IDS);
  const [provider, setProvider] = useState<ProviderId>("all");
  const [dataCenter, setDataCenter] = useState<DataCenterId>("all");
  const [department, setDepartment] = useState<DepartmentId>("all");
  const [simulation, setSimulation] = useState<SimulationInput | null>(null);
  const [simulationOpen, setSimulationOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploaded, setUploadedState] = useState<UploadedDataset | null>(null);
  const [todayVersion, setTodayVersion] = useState(0);
  const setUploaded = (ds: UploadedDataset | null) => {
    if (ds && ds.isDefault) {
      setTodayOverride(new Date("2026-06-15T23:59:59"));
    } else {
      setTodayOverride(null);
    }
    setTodayVersion((v) => v + 1);
    setUploadedState(ds);
  };
  const [baseline, setBaseline] = useState<BaselineDataset | null>(null);
  const [welcomeOpen, setWelcomeOpen] = useState(false);
  const [headerVisible, setHeaderVisible] = useState(true);
  const lastScrollY = useRef(0);

  // Auto-load bundled sample CSV on first mount so the dashboard ships with
  // real-shaped data (not the synthetic mock generator).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/sample-ai-usage.csv");
        if (!res.ok) return;
        const text = await res.text();
        const file = new File([text], "sample-ai-usage.csv", { type: "text/csv" });
        const parsed = await parseCsv(file);
        const mapping = autoMap(parsed.headers);
        const ds = buildDataset("sample-ai-usage.csv", parsed.rawRows, mapping);
        if (!cancelled && ds.rowCount > 0) {
          setUploaded({ ...ds, isDefault: true });
        }
      } catch {
        // fall back to synthetic data — no-op
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // First-visit welcome modal
  useEffect(() => {
    try {
      if (localStorage.getItem("traice.welcomeSeen") !== "1") {
        setWelcomeOpen(true);
      }
    } catch {
      setWelcomeOpen(true);
    }
  }, []);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      const delta = y - lastScrollY.current;
      if (y < 24) setHeaderVisible(true);
      else if (delta > 6) setHeaderVisible(false);
      else if (delta < -6) setHeaderVisible(true);
      lastScrollY.current = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const simulationMultiplier = simulation ? getSimulationMultiplier(simulation.companySize) : 1;
  const mode: "historical" | "simulated" = simulation ? "simulated" : "historical";

  const uploadedOptions = useMemo(() => {
    if (!uploaded) return null;
    const depts = new Map<string, string>();
    const provs = new Map<string, string>();
    const dcs = new Map<string, string>();
    const mods = new Set<ModelId>();
    for (const r of uploaded.rows) {
      if (r.raw_department) depts.set(r.raw_department, r.raw_department);
      if (r.raw_provider) {
        provs.set(r.raw_provider, r.raw_provider);
      } else if (r.provider) {
        const p = PROVIDERS.find((x) => x.id === r.provider);
        if (p) provs.set(p.id, p.label);
      }
      if (r.raw_data_center) {
        dcs.set(r.raw_data_center, r.raw_data_center);
      } else if (r.data_center) {
        const d = DATA_CENTERS.find((x) => x.id === r.data_center);
        if (d) dcs.set(d.id, d.label);
      }
      mods.add(r.model);
    }
    return {
      departmentOptions: [
        { id: "all", label: "All departments" },
        ...Array.from(depts.entries()).map(([id, label]) => ({ id, label })),
      ],
      providerOptions:
        provs.size > 0
          ? [
              { id: "all", label: "All providers" },
              ...Array.from(provs.entries()).map(([id, label]) => ({ id, label })),
            ]
          : undefined,
      dataCenterOptions:
        dcs.size > 0
          ? [
              { id: "all", label: "All data centers" },
              ...Array.from(dcs.entries()).map(([id, label]) => ({ id, label })),
            ]
          : undefined,
      modelOptions: mods.size > 0 ? Array.from(mods) : undefined,
    };
  }, [uploaded]);

  // When a new upload arrives, reset filters that would otherwise filter everything out.
  useEffect(() => {
    if (!uploadedOptions) return;
    setDepartment("all");
    setProvider("all");
    setDataCenter("all");
    if (uploadedOptions.modelOptions && uploadedOptions.modelOptions.length > 0) {
      setModels(uploadedOptions.modelOptions);
    }
  }, [uploadedOptions]);

  const data = useMemo(() => {
    const opts = {
      preset,
      customStart,
      customEnd,
      models,
      provider,
      dataCenter,
      department,
      simulationMultiplier,
    };
    return uploaded ? aggregateUploaded(uploaded, opts) : generateData(opts);
    // todayVersion re-derives the dataset when the default "today" override changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    uploaded,
    preset,
    customStart,
    customEnd,
    models,
    provider,
    dataCenter,
    department,
    simulationMultiplier,
    todayVersion,
  ]);

  return (
    <div className="relative min-h-screen [overflow-x:clip]">
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div
          className="blob"
          style={{
            top: "-10%",
            left: "-8%",
            width: 460,
            height: 460,
            background: "radial-gradient(circle, oklch(0.85 0.12 260) 0%, transparent 70%)",
            opacity: 0.35,
          }}
        />
        <div
          className="blob"
          style={{
            top: "5%",
            right: "-10%",
            width: 520,
            height: 520,
            background: "radial-gradient(circle, oklch(0.88 0.1 145) 0%, transparent 70%)",
            opacity: 0.35,
            animationDelay: "-6s",
          }}
        />
        <div
          className="blob"
          style={{
            bottom: "-12%",
            left: "30%",
            width: 600,
            height: 600,
            background: "radial-gradient(circle, oklch(0.9 0.1 25) 0%, transparent 70%)",
            opacity: 0.3,
            animationDelay: "-12s",
          }}
        />
      </div>

      <header
        className={`sticky top-0 z-30 px-4 md:px-8 pt-4 pb-3 backdrop-blur-md bg-background/70 border-b border-white/30 transition-transform duration-300 ${
          headerVisible ? "translate-y-0" : "-translate-y-full"
        }`}
      >
        <div className="max-w-[1400px] mx-auto flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2.5 mr-auto">
            <div className="h-9 w-9 rounded-2xl bg-gradient-to-br from-primary to-emerald-500 flex items-center justify-center shadow-lg">
              <Leaf className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-base md:text-lg font-semibold leading-tight tracking-tight">
              TrAIce
            </h1>
          </div>

          <FiltersBar
            preset={preset}
            customStart={customStart}
            customEnd={customEnd}
            models={models}
            provider={provider}
            dataCenter={dataCenter}
            department={department}
            mode={mode}
            departmentOptions={uploadedOptions?.departmentOptions}
            providerOptions={uploadedOptions?.providerOptions}
            dataCenterOptions={uploadedOptions?.dataCenterOptions}
            modelOptions={uploadedOptions?.modelOptions}
            onChange={(next) => {
              if (next.preset !== undefined) setPreset(next.preset);
              if (next.customStart !== undefined) setCustomStart(next.customStart);
              if (next.customEnd !== undefined) setCustomEnd(next.customEnd);
              if (next.provider !== undefined) setProvider(next.provider);
              if (next.models !== undefined) setModels(next.models);
              if (next.dataCenter !== undefined) setDataCenter(next.dataCenter);
              if (next.department !== undefined) setDepartment(next.department);

              if (next.dataCenter !== undefined) setDataCenter(next.dataCenter);
              if (next.department !== undefined) setDepartment(next.department);
            }}
          />

          <div className="flex items-center gap-2">
            <Button
              onClick={() => setUploadOpen(true)}
              variant="outline"
              className="rounded-full h-10 gap-1.5"
              title="Upload your own CSV"
            >
              <Upload className="h-4 w-4" />
              <span className="hidden sm:inline">Upload data</span>
            </Button>

            <Button
              onClick={() => {
                if (simulation) {
                  setSimulation(null);
                  setPreset("month");
                  setCustomStart(undefined);
                  setCustomEnd(undefined);
                } else {
                  setSimulationOpen(true);
                }
              }}
              variant={simulation ? "outline" : "default"}
              className="rounded-full h-10 gap-1.5"
            >
              {simulation ? (
                <>
                  <RotateCcw className="h-4 w-4" />
                  Reset simulation
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Run simulation
                </>
              )}
            </Button>
          </div>
        </div>
        {(simulation || uploaded) && (
          <div className="max-w-[1400px] mx-auto mt-2 flex items-center gap-2 text-xs flex-wrap">
            {simulation && (
              <>
                <Badge variant="secondary" className="rounded-full">
                  Simulation mode
                </Badge>
                <span className="text-muted-foreground">
                  {simulation.industry} · {simulation.companySize} employees ·{" "}
                  {simulation.useCases.length} use case
                  {simulation.useCases.length === 1 ? "" : "s"} · projecting forward · synthetic
                  data
                </span>
              </>
            )}
            {uploaded && uploaded.isDefault && (
              <Badge variant="secondary" className="rounded-full">
                Sample data · {uploaded.rowCount.toLocaleString()} rows
              </Badge>
            )}
            {uploaded && !uploaded.isDefault && (
              <UploadedChip dataset={uploaded} onClear={() => setUploaded(null)} />
            )}
          </div>
        )}
      </header>

      <main className="max-w-[1400px] mx-auto px-4 md:px-8 py-6 md:py-8 space-y-6">
        <div className="flex justify-center">
          <AISearch data={data} className="w-full max-w-2xl md:w-full" />
        </div>
        <UsageWidget data={data} models={models} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SuggestionsWidget />
          <ProductivityWidget data={data} models={models} baseline={baseline} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <DepartmentBenchmarkWidget data={data} department={department} />
          <IndustryBenchmarkWidget data={data} />
        </div>

        <ImpactBreakdownWidget data={data} models={models} labelOverrides={simulation?.useCases} />

        <footer className="text-center text-xs text-muted-foreground pt-4 pb-8">
          Prototype · figures are illustrative · CO₂ estimates based on token-weighted model
          averages
        </footer>
      </main>

      <SimulationModal
        open={simulationOpen}
        onOpenChange={setSimulationOpen}
        onComplete={(input) => {
          setSimulation(input);
          setPreset("next-month");
          setCustomStart(undefined);
          setCustomEnd(undefined);
        }}
      />
      <UploadDataModal
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        onLoaded={(ds) => setUploaded(ds)}
        baseline={baseline}
        onBaselineLoaded={(b) => setBaseline(b)}
      />
      <WelcomeModal open={welcomeOpen} onOpenChange={setWelcomeOpen} />

      <TooltipProvider delayDuration={150}>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => setWelcomeOpen(true)}
              aria-label="About this project"
              className="fixed bottom-6 right-6 z-40 h-12 w-12 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 hover:scale-105 active:scale-95 transition flex items-center justify-center"
            >
              <HelpCircle className="h-6 w-6" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="left" className="font-medium">
            About this project
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
