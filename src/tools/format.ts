import type { RankedModel } from "../types.js";

/**
 * Value index: Elo points per dollar of output cost (per 1M tokens).
 * Higher = more quality per dollar. Only computed when both Elo and output pricing are available.
 */
export function valueIndex(m: RankedModel): number | null {
  if (m.elo_score == null || m.pricing?.output_cost == null || m.pricing.output_cost === 0) return null;
  return Math.round(m.elo_score / m.pricing.output_cost);
}

function modelUrl(m: RankedModel): string | null {
  switch (m.source) {
    case "huggingface": return `https://huggingface.co/${m.id}`;
    case "openrouter": return `https://openrouter.ai/models/${m.id}`;
    case "artificial_analysis": return `https://artificialanalysis.ai/models/${m.id.replace("/", "-")}`;
    default: return null;
  }
}

/**
 * Rough energy tier derived from throughput as a proxy.
 * Higher throughput suggests smaller/more efficient model architecture.
 * Marked with * to signal this is speculative — throughput reflects provider
 * infrastructure speed, not the model's absolute energy draw.
 */
export function energyTier(m: RankedModel): string {
  const t = m.performance?.throughput;
  if (t == null) return "—";
  if (t > 80) return "low*";
  if (t > 20) return "mid*";
  return "high*";
}

/** Format a list of recommendations as a Markdown table (survives model rewrites better than prose) */
export function recommendToMarkdown(models: RankedModel[], title?: string): string {
  if (models.length === 0) return "No models found.";

  const hasElo = models.some((m) => m.elo_score != null);
  const hasScore = models.some((m) => m.benchmark_score != null);
  const hasPricing = models.some((m) => m.pricing != null);
  const hasSpeed = models.some((m) => m.performance?.throughput != null);
  const hasVI = models.some((m) => valueIndex(m) != null);
  const hasEnergy = models.some((m) => m.performance?.throughput != null);

  type Col = { header: string; cell: (m: RankedModel, i: number) => string };
  const cols: Col[] = [
    { header: "#", cell: (_, i) => String(i + 1) },
    { header: "Model", cell: (m) => { const url = modelUrl(m); return url ? `[${m.name}](${url})` : m.name; } },
    { header: "Creator", cell: (m) => m.creator },
    ...(hasElo ? [{ header: "Elo", cell: (m: RankedModel) => m.elo_score != null ? String(m.elo_score) : "—" }] : []),
    ...(hasScore ? [{ header: "Score", cell: (m: RankedModel) => m.benchmark_score != null ? String(m.benchmark_score) : "—" }] : []),
    ...(hasPricing ? [
      { header: "In$/1M", cell: (m: RankedModel) => m.pricing?.input_cost != null ? `$${m.pricing.input_cost.toFixed(2)}` : "—" },
      { header: "Out$/1M", cell: (m: RankedModel) => m.pricing?.output_cost != null ? `$${m.pricing.output_cost.toFixed(2)}` : "—" },
    ] : []),
    ...(hasSpeed ? [{ header: "tok/s", cell: (m: RankedModel) => m.performance?.throughput != null ? m.performance.throughput.toFixed(0) : "—" }] : []),
    ...(hasVI ? [{ header: "VI", cell: (m: RankedModel) => { const v = valueIndex(m); return v != null ? String(v) : "—"; } }] : []),
    ...(hasEnergy ? [{ header: "Energy*", cell: (m: RankedModel) => energyTier(m) }] : []),
    { header: "Source", cell: (m) => m.source },
  ];

  const heading = title ? `### ${title}\n` : "";
  const tableHeader = `| ${cols.map((c) => c.header).join(" | ")} |`;
  const tableSep = `| ${cols.map(() => "---").join(" | ")} |`;
  const tableRows = models.map((m, i) => `| ${cols.map((c) => c.cell(m, i)).join(" | ")} |`);

  return [heading, tableHeader, tableSep, ...tableRows].join("\n");
}

/** @deprecated use recommendToMarkdown for recommendation output */
export function modelToMarkdown(m: RankedModel, index?: number): string {
  const prefix = index != null ? `${index}. ` : "";
  const url = modelUrl(m);
  const nameStr = url ? `[${m.name}](${url})` : m.name;
  const score = m.elo_score != null ? `Elo ${m.elo_score}` : m.benchmark_score != null ? `Score ${m.benchmark_score}` : null;
  const price = m.pricing ? [
    m.pricing.input_cost != null ? `$${m.pricing.input_cost.toFixed(2)} in` : null,
    m.pricing.output_cost != null ? `$${m.pricing.output_cost.toFixed(2)} out` : null,
  ].filter(Boolean).join("/") : null;
  const perf = m.performance?.throughput != null ? `${m.performance.throughput.toFixed(0)} tok/s` : null;
  const vi = valueIndex(m); const viStr = vi != null ? `VI:${vi}` : null;
  const meta = [m.creator, score, price, perf, viStr, `src:${m.source}`].filter(Boolean).join(" · ");
  return `**${prefix}${nameStr}** — ${meta}`;
}

/** Format a list of models as a compact Markdown table */
export function leaderboardToMarkdown(
  models: RankedModel[],
  title: string,
): string {
  if (models.length === 0) return `## ${title}\n\nNo models found.`;

  // Detect which columns have data across the result set
  const hasElo = models.some((m) => m.elo_score != null);
  const hasScore = models.some((m) => m.benchmark_score != null);
  const hasPricing = models.some((m) => m.pricing != null);
  const hasSpeed = models.some((m) => m.performance?.throughput != null);
  const multiSource = new Set(models.map((m) => m.source)).size > 1;

  type Col = { header: string; cell: (m: RankedModel) => string };
  const cols: Col[] = [
    { header: "#", cell: (m) => String(m.rank) },
    { header: "Model", cell: (m) => m.name },
    { header: "Creator", cell: (m) => m.creator },
    ...(hasElo ? [{ header: "Elo", cell: (m: RankedModel) => m.elo_score != null ? String(m.elo_score) : "—" }] : []),
    ...(hasScore ? [{ header: "Score", cell: (m: RankedModel) => m.benchmark_score != null ? String(m.benchmark_score) : "—" }] : []),
    ...(hasPricing ? [
      { header: "In$/1M", cell: (m: RankedModel) => m.pricing?.input_cost != null ? `$${m.pricing.input_cost.toFixed(2)}` : "—" },
      { header: "Out$/1M", cell: (m: RankedModel) => m.pricing?.output_cost != null ? `$${m.pricing.output_cost.toFixed(2)}` : "—" },
    ] : []),
    ...(hasSpeed ? [{ header: "tok/s", cell: (m: RankedModel) => m.performance?.throughput != null ? String(m.performance.throughput.toFixed(0)) : "—" }] : []),
    { header: "VI", cell: (m: RankedModel) => { const v = valueIndex(m); return v != null ? String(v) : "—"; } },
    ...(multiSource ? [{ header: "Source", cell: (m: RankedModel) => m.source }] : []),
  ];

  const header = `## ${title}\n`;
  const tableHeader = `| ${cols.map((c) => c.header).join(" | ")} |`;
  const tableSep = `| ${cols.map(() => "---").join(" | ")} |`;
  const tableRows = models.map((m) => `| ${cols.map((c) => c.cell(m)).join(" | ")} |`);

  return [header, tableHeader, tableSep, ...tableRows].join("\n");
}

/** Format a comparison table in Markdown */
export function comparisonToMarkdown(models: RankedModel[]): string {
  if (models.length === 0) return "No models found for comparison.";

  const multiSource = new Set(models.map((m) => m.source)).size > 1;
  const cols = [
    "Model", "Creator", "Elo", "Score", "In$/1M", "Out$/1M", "tok/s", "VI",
    ...(multiSource ? ["Source"] : []),
  ];
  const rows = models.map((m) => {
    const vi = valueIndex(m);
    return [
      m.name,
      m.creator,
      m.elo_score != null ? String(m.elo_score) : "—",
      m.benchmark_score != null ? String(m.benchmark_score) : "—",
      m.pricing?.input_cost != null ? `$${m.pricing.input_cost.toFixed(2)}` : "—",
      m.pricing?.output_cost != null ? `$${m.pricing.output_cost.toFixed(2)}` : "—",
      m.performance?.throughput != null ? `${m.performance.throughput.toFixed(0)} tok/s` : "—",
      vi != null ? String(vi) : "—",
      ...(multiSource ? [m.source] : []),
    ];
  });

  return [
    "## Model comparison",
    `| ${cols.join(" | ")} |`,
    `| ${cols.map(() => "---").join(" | ")} |`,
    ...rows.map((r) => `| ${r.join(" | ")} |`),
  ].join("\n");
}
