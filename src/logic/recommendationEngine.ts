import { requiredTools } from "../data/toolMappings";
import type { Answers, ArchitectureMode, DimensionScore, Recommendation } from "../types";

export function buildRecommendations(scores: DimensionScore[], mode: ArchitectureMode, answers: Answers): Recommendation[] {
  const lowScores = scores.filter((score) => score.score < 3.5);
  const currentTools = Array.isArray(answers.currentTools) ? answers.currentTools : [];

  const recs: Recommendation[] = lowScores.map((score) => recommendationFor(score, mode));

  if (!currentTools.includes(requiredTools.catalogue)) {
    recs.unshift({
      area: "Data catalogue",
      priority: "High",
      timeframe: "Quick win",
      summary: "Stand up DataHub as the searchable metadata spine for datasets, ownership, glossary, quality status, lineage, and trust signals.",
      actions: [
        "Onboard critical datasets first, then expand by domain.",
        "Publish owners, glossary definitions, certification status, and quality outcomes.",
        "Integrate ingestion, transformation, BI, and quality metadata feeds.",
      ],
      tools: [requiredTools.catalogue],
    });
  }

  if (!currentTools.includes(requiredTools.dataQuality)) {
    recs.unshift({
      area: "Data quality",
      priority: "High",
      timeframe: "Quick win",
      summary: "Use Great Expectations to make data quality checks executable, versioned, visible, and owned.",
      actions: [
        "Start with completeness, freshness, uniqueness, accepted values, and referential checks for critical datasets.",
        "Publish Great Expectations validation status into DataHub.",
        "Route failures to dataset owners with clear severity and remediation paths.",
      ],
      tools: [requiredTools.dataQuality, requiredTools.catalogue],
    });
  }

  return dedupe(recs).slice(0, 12);
}

function recommendationFor(score: DimensionScore, mode: ArchitectureMode): Recommendation {
  const base = {
    priority: score.score < 2.6 ? "High" : score.score < 3.2 ? "Medium" : "Low",
    timeframe: score.score < 2.6 ? "Quick win" : score.score < 3.2 ? "Stabilise" : "Scale",
  } as Pick<Recommendation, "priority" | "timeframe">;

  const managed = mode === "aws-managed";
  const hybrid = mode === "hybrid";

  const map: Record<string, Omit<Recommendation, "priority" | "timeframe">> = {
    ingestion: {
      area: "Ingestion",
      summary: "Create reusable ingestion patterns for batch, CDC, and streaming workloads.",
      actions: ["Use Airbyte for repeatable connector-based ingestion.", "Use Amazon Kinesis for streaming workloads.", "Classify data sources by criticality, latency, and ownership."],
      tools: [requiredTools.ingestion, requiredTools.awsStreaming, requiredTools.awsStorage],
    },
    storage: {
      area: "Storage architecture",
      summary: "Formalise raw, curated, and consumption layers with governed storage and warehouse patterns.",
      actions: ["Use Amazon S3 as the durable landing zone.", "Use Amazon Redshift for governed analytical workloads.", "Define naming, partitioning, retention, and access patterns."],
      tools: [requiredTools.awsStorage, requiredTools.awsWarehouse],
    },
    transformation: {
      area: "Transformation",
      summary: "Make transformation logic versioned, testable, and observable.",
      actions: ["Adopt dbt for SQL transformation where suitable.", "Use AWS Glue for managed ETL and Spark-style processing.", "Define reusable transformation templates and review gates."],
      tools: [requiredTools.transformation, requiredTools.awsEtl],
    },
    biConsumption: {
      area: "BI and consumption",
      summary: "Create trusted consumption products with certified datasets and semantic definitions.",
      actions: ["Use Apache Superset or Metabase for governed open BI.", "Publish certified datasets and dashboards through DataHub.", "Define business metrics, owners, and change processes."],
      tools: [requiredTools.bi, requiredTools.catalogue],
    },
    catalogueMetadata: {
      area: "Catalogue and metadata",
      summary: "Make DataHub the central discovery, ownership, glossary, lineage, and trust interface.",
      actions: ["Connect ingestion, warehouse, transformation, and BI metadata.", "Show dataset owners, schema, quality status, and lineage.", "Create certification workflow for trusted datasets."],
      tools: [requiredTools.catalogue],
    },
    governance: {
      area: "Governance and standards",
      summary: "Turn standards into practical controls embedded in delivery workflows.",
      actions: ["Manage naming, schema, glossary, and modelling standards in MetaWorks.", "Link standards to DataHub datasets and business terms.", "Review exceptions through a lightweight governance forum."],
      tools: [requiredTools.standards, requiredTools.catalogue],
    },
    dataQuality: {
      area: "Data quality",
      summary: "Expand Great Expectations from point checks to a managed quality operating model.",
      actions: ["Add ingestion, transformation, and business-rule checks.", "Expose validation results in DataHub.", "Alert on critical failures and trend quality over time."],
      tools: [requiredTools.dataQuality, requiredTools.monitoring],
    },
    observability: {
      area: "Observability",
      summary: "Monitor pipelines, freshness, quality, costs, and user-facing data reliability.",
      actions: ["Use Prometheus and Grafana for platform metrics.", "Alert on stale data and failed jobs.", "Track freshness, completeness, accuracy, and timeliness by dataset."],
      tools: [requiredTools.monitoring, managed || hybrid ? requiredTools.awsOrchestration : requiredTools.orchestration],
    },
    securityCompliance: {
      area: "Security and compliance",
      summary: "Strengthen access control, auditability, sensitive data handling, and regulatory evidence.",
      actions: ["Apply least-privilege access for S3, Redshift, and Glue.", "Tag sensitive fields and datasets in DataHub.", "Document GDPR retention, subject access, and deletion controls."],
      tools: [requiredTools.awsStorage, requiredTools.awsWarehouse, requiredTools.catalogue],
    },
    costEfficiency: {
      area: "Cost efficiency",
      summary: "Manage spend by matching workloads to storage, warehouse, serverless, and orchestration patterns.",
      actions: ["Use lifecycle policies on S3.", "Use Lambda and Step Functions for event-driven tasks.", "Measure warehouse utilisation and optimise heavy workloads."],
      tools: [requiredTools.awsServerless, requiredTools.awsOrchestration, requiredTools.analyticsDb],
    },
    lifecycleRetention: {
      area: "Lifecycle and retention",
      summary: "Make retention, archival, and deletion policies explicit, automated, and auditable.",
      actions: ["Define retention by data class and regulatory need.", "Automate archival and deletion in storage layers.", "Expose lifecycle policy and owners in catalogue metadata."],
      tools: [requiredTools.awsStorage, requiredTools.catalogue, requiredTools.standards],
    },
    ownershipOperatingModel: {
      area: "Ownership and operating model",
      summary: "Assign clear business and technical accountability for critical data products.",
      actions: ["Define dataset owner, steward, engineer, and consumer roles.", "Create escalation paths for quality, freshness, and access issues.", "Track stewardship coverage in DataHub."],
      tools: [requiredTools.catalogue],
    },
    dataContracts: {
      area: "Data contracts",
      summary: "Protect consumers from breaking producer changes with explicit contracts and schema evolution rules.",
      actions: ["Define producer-consumer contracts for critical feeds.", "Test schema compatibility in CI.", "Publish contract ownership and change notices in DataHub."],
      tools: [requiredTools.catalogue, requiredTools.dataQuality],
    },
    cicd: {
      area: "CI/CD",
      summary: "Make pipeline changes versioned, tested, reviewed, and promoted through controlled releases.",
      actions: ["Add tests for transformations, contracts, and quality expectations.", "Run Great Expectations checks in CI.", "Use dbt, Glue jobs, Airflow DAGs, or Step Functions definitions as code."],
      tools: [requiredTools.dataQuality, requiredTools.transformation, requiredTools.awsEtl],
    },
    environmentManagement: {
      area: "Environment management",
      summary: "Separate development, test, staging, and production to reduce operational and compliance risk.",
      actions: ["Define environment-specific data access and masking rules.", "Promote metadata, jobs, and schemas through release gates.", "Use representative non-production datasets for testing."],
      tools: [requiredTools.awsStorage, requiredTools.awsWarehouse],
    },
    lineage: {
      area: "Lineage",
      summary: "Use lineage to understand impact from source through transformation to dashboard.",
      actions: ["Capture dataset and column-level lineage where possible.", "Integrate dbt, Airflow or Step Functions, Glue, Redshift, and BI metadata into DataHub.", "Use lineage during change impact analysis."],
      tools: [requiredTools.catalogue, requiredTools.transformation, requiredTools.awsEtl],
    },
    slaFreshness: {
      area: "SLAs and freshness",
      summary: "Define visible service levels for critical datasets and monitor reliability against them.",
      actions: ["Set freshness, completeness, availability, and latency targets.", "Publish SLA status in DataHub.", "Alert owners and platform teams before consumers are affected."],
      tools: [requiredTools.catalogue, requiredTools.monitoring, requiredTools.dataQuality],
    },
    mlAiReadiness: {
      area: "ML and AI readiness",
      summary: "Prepare trusted, governed, quality-assured datasets for ML and AI workloads.",
      actions: ["Prioritise lineage, quality, access controls, and feature ownership.", "Document training data provenance and permissible use.", "Create AI-ready curated zones and metadata standards."],
      tools: [requiredTools.catalogue, requiredTools.dataQuality, requiredTools.awsStorage],
    },
    cloudPortability: {
      area: "Cloud and portability",
      summary: "Balance AWS managed velocity with open formats, portable metadata, and clear exit options.",
      actions: ["Prefer open file formats and decoupled transformation logic.", "Use DataHub and MetaWorks to avoid metadata lock-in.", "Document managed-service dependencies and portability risks."],
      tools: [requiredTools.catalogue, requiredTools.standards, requiredTools.awsStorage],
    },
  };

  return { ...base, ...map[score.dimension] };
}

function dedupe(recs: Recommendation[]): Recommendation[] {
  const seen = new Set<string>();
  return recs.filter((rec) => {
    if (seen.has(rec.area)) return false;
    seen.add(rec.area);
    return true;
  });
}
