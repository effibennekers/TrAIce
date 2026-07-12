export type CompanySize = "1-50" | "51-250" | "251-1000" | "1001-5000" | "5000+";

export const COMPANY_SIZES: { id: CompanySize; label: string; multiplier: number }[] = [
  { id: "1-50", label: "1–50 employees", multiplier: 0.3 },
  { id: "51-250", label: "51–250 employees", multiplier: 1 },
  { id: "251-1000", label: "251–1,000 employees", multiplier: 3 },
  { id: "1001-5000", label: "1,001–5,000 employees", multiplier: 8 },
  { id: "5000+", label: "5,000+ employees", multiplier: 20 },
];

export const INDUSTRIES = [
  "Banking",
  "Public sector",
  "Education",
  "Energy & utilities",
  "Healthcare",
  "Retail & e-commerce",
  "Telecommunications",
  "Manufacturing",
  "Insurance",
  "Professional services",
] as const;
export type Industry = (typeof INDUSTRIES)[number];

export const SIMULATION_USE_CASES: string[] = [
  "Transcription",
  "Translation",
  "Summarisation",
  "Knowledge search",
  "Customer support chat",
  "Code generation",
  "Code review",
  "Document drafting",
  "Contract review",
  "Meeting notes",
  "Email triage",
  "Sentiment analysis",
  "Fraud detection",
  "KYC screening",
  "Risk modelling",
  "Forecasting",
  "Image generation",
  "Image classification",
  "OCR",
  "Data extraction",
  "Data labelling",
  "Voice assistant",
  "RAG / retrieval",
  "Recommendation",
  "Personalisation",
  "Marketing copy",
  "SEO content",
  "Lesson planning",
  "Tutoring",
  "Research synthesis",
  "Policy drafting",
];

export interface SimulationInput {
  companySize: CompanySize;
  industry: Industry;
  useCases: string[];
}

export function getSimulationMultiplier(size: CompanySize): number {
  return COMPANY_SIZES.find((c) => c.id === size)?.multiplier ?? 1;
}
