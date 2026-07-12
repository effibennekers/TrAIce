// Mocked AI search responses — keyword based.
import type { DashboardData } from "./mock-data";
import { KWH_PER_KG } from "./mock-data";

export interface AIResponse {
  answer: string; // markdown
}

const fmtKwh = (kg: number) => {
  const kwh = kg * KWH_PER_KG;
  if (kwh >= 1000) return `${(kwh / 1000).toFixed(2)} MWh`;
  return `${kwh.toFixed(1)} kWh`;
};

export function answerQuestion(q: string, data: DashboardData): AIResponse {
  const text = q.toLowerCase().trim();

  const topUC = [...data.byUseCase].sort((a, b) => b.total - a.total)[0];
  const lowestUC = [...data.byUseCase].sort((a, b) => a.total - b.total)[0];
  const totalCo2 = data.byUseCase.reduce((s, d) => s + d.total, 0);
  const ind = data.industry;
  const diff = ((ind.yourOrg - ind.banking) / ind.banking) * 100;
  const sortedDept = [...data.byDepartment].sort((a, b) => a.value - b.value);

  if (!text) {
    return {
      answer: `Ask me anything about your AI energy use — try the example prompts below.`,
    };
  }

  if (
    /(top|highest|most|biggest).*(use case|usecase|workload|dept|department|team)/.test(text) ||
    /which (use case|department)/.test(text)
  ) {
    return {
      answer: `**${topUC.useCase}** is your highest-impact use case at **${fmtKwh(
        topUC.total,
      )}** for the selected period — about **${((topUC.total / totalCo2) * 100).toFixed(
        0,
      )}%** of total energy use. It is a clear outlier; consider routing routine traffic through a lighter model or a cache.`,
    };
  }

  if (/(lowest|least|smallest).*(use case|usecase|dept|department|team)/.test(text)) {
    return {
      answer: `**${lowestUC.useCase}** has the smallest footprint at **${fmtKwh(lowestUC.total)}**.`,
    };
  }

  if (/(industry|peer|benchmark|compare|vs|versus|sector|other org|rank)/.test(text)) {
    return {
      answer: `Your organisation runs at **${ind.yourOrg} kWh / 1k prompts**, which is **${
        diff < 0 ? `${Math.abs(diff).toFixed(0)}% below` : `${diff.toFixed(0)}% above`
      }** the banking-industry average of **${ind.banking} kWh / 1k prompts**. Internally, **${sortedDept[0].label}** is the most efficient department and **${sortedDept[sortedDept.length - 1].label}** the least.`,
    };
  }

  if (/(save|reduce|cut|lower|suggestion|recommend)/.test(text)) {
    return {
      answer: `Top opportunities right now:\n\n1. **Add a cache + retrieval layer in front of Enterprise knowledge management & internal search** — your single biggest workload outlier, est. **2,400 kWh/month** saved.\n2. **Route routine search traffic to GPT OSS 120B** — the only model with verified energy data and >20× more efficient than GPT-4o, est. **1,100 kWh/month** saved.\n3. **Batch transcription overnight** — Whisper Large dominates per-token energy; off-peak batching cuts both grid carbon and unit cost.\n\nSee the *Suggestions* widget to accept these.`,
    };
  }

  if (/(trend|over time|change|growth|increase|decrease)/.test(text)) {
    const first = data.series[0];
    const last = data.series[data.series.length - 1];
    const sum = (p: typeof first) =>
      Object.entries(p).reduce(
        (s, [k, v]) => (k !== "label" && k !== "ts" ? s + (v as number) : s),
        0,
      );
    const pct = ((sum(last) - sum(first)) / Math.max(0.01, sum(first))) * 100;
    return {
      answer: `Energy use ${pct >= 0 ? "rose" : "fell"} by **${Math.abs(pct).toFixed(
        0,
      )}%** from ${first.label} to ${last.label}. Largest contributor across the window remains **${topUC.useCase}**.`,
    };
  }

  if (/(token|prompt|user|usage|volume)/.test(text)) {
    return {
      answer: `For the selected window: **${data.totals.tokens.toLocaleString()} tokens** across **${data.totals.prompts.toLocaleString()} prompts** from **${data.totals.users}** unique users.`,
    };
  }

  if (/(model|gpt|claude|llama|mistral|gemini|whisper|sdxl|oss)/.test(text)) {
    return {
      answer: `**GPT OSS 120B** is currently the lightest model at **0.226 J / token** (verified telemetry) — roughly **20× more efficient** than GPT-4o for comparable text workloads. All other model factors in this prototype are estimated and labelled *unverified*.`,
    };
  }

  return {
    answer: `I don't have a specific answer for that yet — try asking about **top use cases**, **industry benchmark**, **trends**, or **how to reduce energy use**.`,
  };
}

export const EXAMPLE_PROMPTS = [
  "Which use case uses the most energy?",
  "How does our org compare to the banking industry?",
  "Where can we save the most kWh?",
];
