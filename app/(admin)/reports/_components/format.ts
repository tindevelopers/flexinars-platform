// Shared label maps + small formatting helpers for the reporting pages.

export const KNOWLEDGE_LABELS: Record<string, string> = {
  none: "None",
  novice: "Novice",
  competent: "Competent",
  proficient: "Proficient",
};

export const SPEAKER_RATING_LABELS: Record<string, string> = {
  poor: "Poor",
  below_average: "Below Average",
  average: "Average",
  above_average: "Above Average",
  excellent: "Excellent",
};

export function knowledgeLabel(v: string | null): string {
  if (!v) return "—";
  return KNOWLEDGE_LABELS[v] ?? v;
}

export function speakerLabel(v: string | null): string {
  if (!v) return "—";
  return SPEAKER_RATING_LABELS[v] ?? v;
}

export function yesNo(v: boolean | null | undefined): string {
  if (v === null || v === undefined) return "—";
  return v ? "Yes" : "No";
}

export function formatDate(value: string | null): string {
  if (!value) return "—";
  const d = new Date(value + (value.length === 10 ? "T00:00:00" : ""));
  if (isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
