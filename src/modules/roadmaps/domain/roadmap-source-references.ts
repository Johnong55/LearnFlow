import type { SearchResult } from '@/infrastructure/external/search/search-provider.interface';
import { roadmapJsonSchema } from './roadmap-output.schema';

interface NormalizationResult {
  output: unknown;
  repairedModules: number;
}

type JsonRecord = Record<string, unknown>;

export function roadmapSchemaForSources(sourceUrls: string[]) {
  const allowedUrls = [...new Set(sourceUrls)];
  const schema = structuredClone(roadmapJsonSchema.schema);
  const properties = record(schema.properties);
  const milestones = record(properties?.milestones);
  const milestoneItems = record(milestones?.items);
  const milestoneProperties = record(milestoneItems?.properties);
  const modules = record(milestoneProperties?.modules);
  const moduleItems = record(modules?.items);
  const moduleProperties = record(moduleItems?.properties);
  const sourceUrlArray = record(moduleProperties?.sourceUrls);

  if (sourceUrlArray) {
    sourceUrlArray.items = {
      type: 'string',
      enum: allowedUrls,
    };
  }

  return { ...roadmapJsonSchema, schema };
}

export function normalizeRoadmapSourceReferences(
  value: unknown,
  sources: SearchResult[],
): NormalizationResult {
  const root = record(value);
  if (!root || !Array.isArray(root.milestones) || !sources.length) {
    return { output: value, repairedModules: 0 };
  }

  const allowed = new Set(sources.map((source) => source.url));
  let repairedModules = 0;
  let moduleIndex = 0;
  const milestoneValues = root.milestones as unknown[];
  const milestones = milestoneValues.map((milestoneValue) => {
    const milestone = record(milestoneValue);
    if (!milestone || !Array.isArray(milestone.modules)) return milestoneValue;
    const moduleValues = milestone.modules as unknown[];
    const modules = moduleValues.map((moduleValue) => {
      const module = record(moduleValue);
      if (!module) return moduleValue;
      const provided = Array.isArray(module.sourceUrls)
        ? module.sourceUrls.filter(
            (url): url is string => typeof url === 'string' && allowed.has(url),
          )
        : [];
      const sourceUrls = [...new Set(provided)];
      if (!sourceUrls.length) {
        sourceUrls.push(bestSourceUrl(module, sources, moduleIndex));
      }
      moduleIndex += 1;
      const original = Array.isArray(module.sourceUrls) ? module.sourceUrls : [];
      if (
        original.length !== sourceUrls.length ||
        original.some((url, index) => url !== sourceUrls[index])
      ) {
        repairedModules += 1;
      }
      return { ...module, sourceUrls };
    });
    return { ...milestone, modules };
  });

  return { output: { ...root, milestones }, repairedModules };
}

function bestSourceUrl(module: JsonRecord, sources: SearchResult[], moduleIndex: number): string {
  const moduleTokens = tokens(`${text(module.title)} ${text(module.description)}`);
  const scored = sources.map((source, index) => {
    const sourceTokens = tokens(`${source.title} ${source.description}`);
    let overlap = 0;
    for (const token of moduleTokens) if (sourceTokens.has(token)) overlap += 1;
    return {
      source,
      index,
      score: overlap * 10 + source.relevanceScore * 2 + source.credibilityScore,
    };
  });
  scored.sort((left, right) => right.score - left.score || left.index - right.index);
  if (scored[0] && scored[0].score > 3) return scored[0].source.url;
  return sources[moduleIndex % sources.length]!.url;
}

function tokens(value: string): Set<string> {
  return new Set(
    value
      .normalize('NFKC')
      .toLocaleLowerCase('en')
      .split(/[^\p{L}\p{N}]+/u)
      .filter((token) => token.length > 2),
  );
}

function record(value: unknown): JsonRecord | undefined {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as JsonRecord)
    : undefined;
}

function text(value: unknown): string {
  return typeof value === 'string' ? value : '';
}
