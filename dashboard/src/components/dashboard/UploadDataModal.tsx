import { useCallback, useMemo, useState } from "react";
import { Upload, FileSpreadsheet, Check, AlertTriangle, X, Download } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CSV_SCHEMA, REQUIRED_FIELDS, OPTIONAL_FIELDS, autoMap } from "@/lib/csv-schema";
import {
  parseCsv,
  buildDataset,
  parseBaselineCsv,
  type UploadedDataset,
  type BaselineDataset,
} from "@/lib/uploaded-data";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onLoaded: (dataset: UploadedDataset) => void;
  baseline: BaselineDataset | null;
  onBaselineLoaded: (b: BaselineDataset | null) => void;
}

export function UploadDataModal({
  open,
  onOpenChange,
  onLoaded,
  baseline,
  onBaselineLoaded,
}: Props) {
  const [stage, setStage] = useState<"schema" | "parsing" | "map" | "done">("schema");
  const [filename, setFilename] = useState("");
  const [headers, setHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<Record<string, string>[]>([]);
  const [rowCount, setRowCount] = useState(0);
  const [mapping, setMapping] = useState<Record<string, string | null>>({});
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setStage("schema");
    setFilename("");
    setHeaders([]);
    setRawRows([]);
    setRowCount(0);
    setMapping({});
    setError(null);
  }, []);

  const requiredOk = useMemo(() => {
    const hasTokens = !!mapping.tokens || (!!mapping.input_tokens && !!mapping.output_tokens);
    return !!mapping.timestamp && !!mapping.model && hasTokens;
  }, [mapping]);

  async function onFile(file: File) {
    if (file.size > 20 * 1024 * 1024) {
      setError("File too large — 20 MB maximum.");
      return;
    }
    setError(null);
    setStage("parsing");
    try {
      const res = await parseCsv(file);
      setFilename(file.name);
      setHeaders(res.headers);
      setRawRows(res.rawRows);
      setRowCount(res.rowCount);
      setMapping(autoMap(res.headers));
      setStage("map");
    } catch (e) {
      setError((e as Error).message || "Could not parse CSV.");
      setStage("schema");
    }
  }

  function commit() {
    const dataset = buildDataset(filename, rawRows, mapping);
    if (dataset.rowCount === 0) {
      setError("No usable rows after mapping. Check the required field selections.");
      return;
    }
    onLoaded(dataset);
    onOpenChange(false);
    setTimeout(reset, 300);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) setTimeout(reset, 300);
      }}
    >
      <DialogContent className="glass-solid max-w-3xl rounded-3xl max-h-[88vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-primary" />
            Upload your own data
          </DialogTitle>
          <DialogDescription>
            The dashboard expects one primary file — your historic AI usage logs. A second, optional
            file lets you replace the synthetic pre-AI productivity baseline with your own numbers.
          </DialogDescription>
        </DialogHeader>

        {stage === "schema" && (
          <div className="space-y-5">
            <div className="rounded-2xl border-2 border-primary/30 bg-primary/5 p-4 space-y-4">
              <div className="flex items-start gap-2">
                <span className="mt-0.5 inline-flex items-center rounded-full bg-primary text-primary-foreground text-[10px] font-semibold px-2 py-0.5 uppercase tracking-wider">
                  Primary
                </span>
                <div>
                  <h3 className="text-sm font-semibold">Historic AI usage CSV</h3>
                  <p className="text-xs text-muted-foreground">
                    Per-prompt logs from your AI gateway. Powers every widget on the dashboard.
                  </p>
                </div>
              </div>

              <Section
                title="Required columns"
                subtitle="The dashboard needs these to render at all."
              >
                <FieldTable fields={REQUIRED_FIELDS} required />
                <p className="text-[11px] text-muted-foreground mt-2">
                  Tokens can be provided as a single <code>tokens</code> column OR as{" "}
                  <code>input_tokens</code> + <code>output_tokens</code>.
                </p>
              </Section>

              <Section
                title="Optional columns"
                subtitle="Each unlocks more widgets and filters."
                collapsibleDefaultOpen={false}
              >
                <FieldTable fields={OPTIONAL_FIELDS} />
              </Section>

              <div className="flex items-center justify-between gap-3 rounded-xl bg-white/50 border border-white/60 px-3 py-2 text-xs">
                <div>
                  <div className="font-medium text-foreground">Need a starting point?</div>
                  <div className="text-muted-foreground">
                    Download the sample dataset that powers the dashboard by default — use it as a
                    template for your own export.
                  </div>
                </div>
                <a
                  href="/sample-ai-usage.csv"
                  download="traice-sample-ai-usage.csv"
                  className="inline-flex items-center gap-1.5 rounded-full bg-primary/15 text-primary hover:bg-primary/25 px-3 py-1.5 font-medium shrink-0"
                >
                  <Download className="h-3.5 w-3.5" />
                  Sample CSV
                </a>
              </div>

              <DropZone onFile={onFile} />

              {error && (
                <div className="flex items-start gap-2 text-xs text-destructive bg-destructive/10 rounded-xl px-3 py-2">
                  <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                  {error}
                </div>
              )}
            </div>

            <BaselineSection baseline={baseline} onBaselineLoaded={onBaselineLoaded} />
          </div>
        )}

        {stage === "parsing" && (
          <div className="py-10 text-center text-sm text-muted-foreground">Parsing {filename}…</div>
        )}

        {stage === "map" && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm">
              <FileSpreadsheet className="h-4 w-4 text-primary" />
              <span className="font-medium">{filename}</span>
              <span className="text-muted-foreground">· {rowCount.toLocaleString()} rows</span>
            </div>

            <Section title="Required" subtitle="Match each required field to a column in your CSV.">
              <MappingRows
                fields={REQUIRED_FIELDS}
                headers={headers}
                mapping={mapping}
                setMapping={setMapping}
              />
            </Section>

            <Section
              title="Optional"
              subtitle="Mapped optional fields unlock extra filters and widgets."
              collapsibleDefaultOpen={false}
            >
              <MappingRows
                fields={OPTIONAL_FIELDS}
                headers={headers}
                mapping={mapping}
                setMapping={setMapping}
              />
            </Section>

            {error && (
              <div className="flex items-start gap-2 text-xs text-destructive bg-destructive/10 rounded-xl px-3 py-2">
                <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                {error}
              </div>
            )}

            <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/40">
              <Button variant="ghost" onClick={() => setStage("schema")} className="rounded-full">
                Back
              </Button>
              <Button onClick={commit} disabled={!requiredOk} className="rounded-full">
                <Check className="h-4 w-4 mr-1.5" />
                Use this data
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Section({
  title,
  subtitle,
  children,
  collapsibleDefaultOpen = true,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  collapsibleDefaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(collapsibleDefaultOpen);
  return (
    <div className="rounded-2xl border border-white/50 bg-white/40 p-4">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between text-left"
      >
        <div>
          <h4 className="text-sm font-semibold">{title}</h4>
          {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>
        <span className="text-xs text-muted-foreground">{open ? "Hide" : "Show"}</span>
      </button>
      {open && <div className="mt-3">{children}</div>}
    </div>
  );
}

function FieldTable({
  fields,
  required = false,
}: {
  fields: typeof CSV_SCHEMA;
  required?: boolean;
}) {
  return (
    <div className="grid gap-1.5">
      {fields.map((f) => (
        <div key={f.key} className="grid grid-cols-[140px_1fr] gap-3 text-xs">
          <div className="font-mono text-foreground flex items-center gap-1.5">
            {f.aliases[0]}
            {required && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
          </div>
          <div className="text-muted-foreground">
            {f.description} <span className="opacity-60">· {f.powers.join(" · ")}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function MappingRows({
  fields,
  headers,
  mapping,
  setMapping,
}: {
  fields: typeof CSV_SCHEMA;
  headers: string[];
  mapping: Record<string, string | null>;
  setMapping: (m: Record<string, string | null>) => void;
}) {
  return (
    <div className="grid gap-2">
      {fields.map((f) => (
        <div key={f.key} className="grid grid-cols-[1fr_220px] gap-3 items-center text-sm">
          <div>
            <div className="font-medium text-foreground">
              {f.label}
              {f.required && <span className="text-primary"> *</span>}
            </div>
            <div className="text-[11px] text-muted-foreground">{f.description}</div>
          </div>
          <select
            value={mapping[f.key] ?? ""}
            onChange={(e) => setMapping({ ...mapping, [f.key]: e.target.value || null })}
            className="rounded-full px-3 h-9 bg-white/80 border border-white/60 text-xs focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            <option value="">— not in CSV —</option>
            {headers.map((h) => (
              <option key={h} value={h}>
                {h}
              </option>
            ))}
          </select>
        </div>
      ))}
    </div>
  );
}

function DropZone({ onFile }: { onFile: (f: File) => void }) {
  const [dragging, setDragging] = useState(false);
  return (
    <label
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        const f = e.dataTransfer.files?.[0];
        if (f) onFile(f);
      }}
      className={cn(
        "block rounded-2xl border-2 border-dashed cursor-pointer transition px-6 py-8 text-center",
        dragging ? "border-primary bg-primary/10" : "border-white/60 bg-white/30 hover:bg-white/50",
      )}
    >
      <input
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
        }}
      />
      <Upload className="h-6 w-6 mx-auto mb-2 text-primary" />
      <p className="text-sm font-medium">Drop a CSV here or click to choose</p>
      <p className="text-xs text-muted-foreground mt-1">Up to 20 MB · header row required</p>
    </label>
  );
}

function BaselineSection({
  baseline,
  onBaselineLoaded,
}: {
  baseline: BaselineDataset | null;
  onBaselineLoaded: (b: BaselineDataset | null) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onFile(file: File) {
    if (file.size > 5 * 1024 * 1024) {
      setErr("Baseline file too large — 5 MB maximum.");
      return;
    }
    setErr(null);
    setBusy(true);
    try {
      const b = await parseBaselineCsv(file);
      if (b.rowCount === 0) {
        setErr("No usable rows. Expected a timestamp column and a units column.");
      } else {
        onBaselineLoaded(b);
      }
    } catch (e) {
      setErr((e as Error).message || "Could not parse baseline CSV.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border border-dashed border-muted-foreground/30 bg-white/30 p-4">
      <div className="flex items-start gap-2 mb-3">
        <span className="mt-0.5 inline-flex items-center rounded-full bg-muted text-muted-foreground text-[10px] font-semibold px-2 py-0.5 uppercase tracking-wider">
          Optional · secondary
        </span>
        <div>
          <h3 className="text-sm font-semibold">Pre-AI baseline units of work</h3>
          <p className="text-xs text-muted-foreground">
            A small CSV with two columns: a timestamp and the units of work delivered before AI
            adoption. Used only by the productivity widget to draw the dashed pre-AI baseline. If
            absent, a synthetic baseline is used.
          </p>
        </div>
      </div>

      {baseline ? (
        <div className="flex items-center justify-between gap-2 rounded-xl bg-white/60 px-3 py-2 text-xs">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{baseline.filename}</span>
            <span className="text-muted-foreground">
              · {baseline.rowCount.toLocaleString()} rows
            </span>
          </div>
          <button
            onClick={() => onBaselineLoaded(null)}
            className="text-muted-foreground hover:text-foreground"
            aria-label="Clear baseline"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <label
          className={cn(
            "block rounded-xl border border-dashed cursor-pointer transition px-4 py-4 text-center text-xs",
            "border-muted-foreground/30 bg-white/40 hover:bg-white/60",
          )}
        >
          <input
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            disabled={busy}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onFile(f);
            }}
          />
          {busy ? "Parsing…" : "Drop a baseline CSV here or click to choose"}
        </label>
      )}

      {err && (
        <div className="flex items-start gap-2 text-xs text-destructive bg-destructive/10 rounded-xl px-3 py-2 mt-2">
          <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
          {err}
        </div>
      )}
    </div>
  );
}

export function UploadedChip({
  dataset,
  onClear,
}: {
  dataset: UploadedDataset;
  onClear: () => void;
}) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full bg-primary/15 text-primary px-3 py-1 text-xs font-medium">
      <FileSpreadsheet className="h-3.5 w-3.5" />
      <span>{dataset.filename}</span>
      <span className="opacity-70">· {dataset.rowCount.toLocaleString()} rows</span>
      <button
        onClick={onClear}
        aria-label="Clear uploaded data"
        className="rounded-full hover:bg-primary/20 p-0.5"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}
