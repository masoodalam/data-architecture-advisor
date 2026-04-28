import type { MaturityDimension } from "../types";

export const dimensionLabels: Record<MaturityDimension, string> = {
  ingestion: "Ingestion",
  storage: "Storage",
  transformation: "Transformation",
  biConsumption: "BI & consumption",
  catalogueMetadata: "Catalogue & metadata",
  governance: "Governance",
  dataQuality: "Data quality",
  observability: "Observability",
  securityCompliance: "Security & compliance",
  costEfficiency: "Cost efficiency",
  lifecycleRetention: "Lifecycle & retention",
  ownershipOperatingModel: "Ownership model",
  dataContracts: "Data contracts",
  cicd: "CI/CD",
  environmentManagement: "Environments",
  lineage: "Lineage",
  slaFreshness: "SLAs & freshness",
  mlAiReadiness: "ML/AI readiness",
  cloudPortability: "Cloud & portability",
};

export const maturityDimensions = Object.keys(dimensionLabels) as MaturityDimension[];

export function classifyMaturity(score: number): string {
  if (score < 2) return "Ad hoc";
  if (score < 3) return "Developing";
  if (score < 4) return "Managed";
  if (score <= 4.5) return "Advanced";
  return "Optimised";
}

export function maturityNarrative(score: number): string {
  const classification = classifyMaturity(score);
  const narratives: Record<string, string> = {
    "Ad hoc": "Capability is fragmented, manually operated, and dependent on local knowledge. Immediate stabilisation will reduce delivery and compliance risk.",
    Developing: "Foundational practices exist, but adoption is uneven. The next step is standardising controls, ownership, and repeatable platform patterns.",
    Managed: "Core data architecture practices are in place. Focus should move to automation, observability, integrated metadata, and measurable service levels.",
    Advanced: "The platform is mature and governed. The opportunity is to optimise cost, portability, self-service, and AI-ready data products.",
    Optimised: "Architecture practices are highly mature. Continue measuring business value, reducing friction, and improving resilience at scale.",
  };
  return narratives[classification];
}
