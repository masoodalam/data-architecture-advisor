import type { QuestionOption, Section } from "../types";

const maturityOptions: QuestionOption[] = [
  { label: "Not in place", value: "1", score: 1 },
  { label: "Informal or inconsistent", value: "2", score: 2 },
  { label: "Defined for key areas", value: "3", score: 3 },
  { label: "Standardised and measured", value: "4", score: 4 },
  { label: "Optimised and continuously improved", value: "5", score: 5 },
];

export const questionBank: Section[] = [
  {
    id: "organisation",
    title: "Organisation context",
    shortTitle: "Context",
    questions: [
      { id: "orgName", prompt: "Organisation or programme name", type: "text" },
      { id: "mode", prompt: "Preferred architecture recommendation mode", type: "select", options: [
        { label: "Hybrid", value: "hybrid" },
        { label: "AWS managed", value: "aws-managed" },
        { label: "Open source heavy", value: "open-source" },
      ] },
      { id: "strategicAlignment", prompt: "How well is data architecture aligned to business priorities?", type: "scale", dimension: "ownershipOperatingModel", options: maturityOptions },
    ],
  },
  {
    id: "ingestion",
    title: "Data sources and ingestion",
    shortTitle: "Ingestion",
    questions: [
      { id: "sourceInventory", prompt: "Do you maintain an inventory of source systems and integration patterns?", type: "scale", dimension: "ingestion", options: maturityOptions },
      { id: "ingestionAutomation", prompt: "How automated and reusable are ingestion pipelines?", type: "scale", dimension: "ingestion", options: maturityOptions },
      { id: "streamingReadiness", prompt: "Can the platform support near real-time ingestion where needed?", type: "scale", dimension: "cloudPortability", options: maturityOptions },
    ],
  },
  {
    id: "storage",
    title: "Storage and architecture",
    shortTitle: "Storage",
    questions: [
      { id: "layers", prompt: "Do you separate raw, curated, and consumption data layers?", type: "scale", dimension: "storage", options: maturityOptions },
      { id: "warehouseFit", prompt: "How mature is warehouse or lakehouse modelling for analytical workloads?", type: "scale", dimension: "storage", options: maturityOptions },
      { id: "architecturePatterns", prompt: "Are architecture patterns documented and reused?", type: "scale", dimension: "governance", options: maturityOptions },
    ],
  },
  {
    id: "transformation",
    title: "Transformation and processing",
    shortTitle: "Transform",
    questions: [
      { id: "transformStandards", prompt: "Are transformation patterns standardised, tested, and reusable?", type: "scale", dimension: "transformation", options: maturityOptions },
      { id: "batchServerlessFit", prompt: "Are workloads assessed for batch, streaming, serverless, or managed service fit?", type: "scale", dimension: "costEfficiency", options: maturityOptions },
    ],
  },
  {
    id: "bi",
    title: "BI and consumption",
    shortTitle: "BI",
    questions: [
      { id: "trustedConsumption", prompt: "Can users find trusted reporting datasets and semantic definitions?", type: "scale", dimension: "biConsumption", options: maturityOptions },
      { id: "selfService", prompt: "How mature is governed self-service analytics?", type: "scale", dimension: "biConsumption", options: maturityOptions },
    ],
  },
  {
    id: "catalogue",
    title: "Data catalogue and metadata",
    shortTitle: "Catalogue",
    questions: [
      { id: "centralCatalogue", prompt: "Do you have a central data catalogue?", type: "scale", dimension: "catalogueMetadata", options: maturityOptions },
      { id: "datasetDiscovery", prompt: "Can users search and discover trusted datasets?", type: "scale", dimension: "catalogueMetadata", options: maturityOptions },
      { id: "ownershipTracking", prompt: "Do you track dataset ownership?", type: "scale", dimension: "ownershipOperatingModel", options: maturityOptions },
    ],
  },
  {
    id: "quality",
    title: "Data quality",
    shortTitle: "Quality",
    questions: [
      { id: "qualityChecks", prompt: "Do you have data quality checks at ingestion and transformation?", type: "scale", dimension: "dataQuality", options: maturityOptions },
      { id: "gxCatalogue", prompt: "Are Great Expectations checks integrated into catalogue visibility?", type: "scale", dimension: "dataQuality", options: maturityOptions },
    ],
  },
  {
    id: "governance",
    title: "Data standards and governance",
    shortTitle: "Governance",
    questions: [
      { id: "namingStandards", prompt: "Do you have naming standards, schema standards, and business glossary definitions?", type: "scale", dimension: "governance", options: maturityOptions },
      { id: "metaworks", prompt: "Are standards managed in MetaWorks or an equivalent standards catalogue?", type: "scale", dimension: "governance", options: maturityOptions },
    ],
  },
  {
    id: "observability",
    title: "Observability and monitoring",
    shortTitle: "Observe",
    questions: [
      { id: "pipelineAlerts", prompt: "Do you have alerts for pipeline failures or stale data?", type: "scale", dimension: "observability", options: maturityOptions },
      { id: "operationalMetrics", prompt: "Do you monitor freshness, completeness, accuracy, and timeliness?", type: "scale", dimension: "observability", options: maturityOptions },
    ],
  },
  {
    id: "security",
    title: "Security and compliance",
    shortTitle: "Security",
    questions: [
      { id: "auditAccess", prompt: "Do you have audit trails and access controls?", type: "scale", dimension: "securityCompliance", options: maturityOptions },
      { id: "sensitiveData", prompt: "Do you manage sensitive data and GDPR requirements?", type: "scale", dimension: "securityCompliance", options: maturityOptions },
    ],
  },
  {
    id: "cost",
    title: "Cost and efficiency",
    shortTitle: "Cost",
    questions: [
      { id: "costOptimisation", prompt: "Do you have a cost optimisation strategy?", type: "scale", dimension: "costEfficiency", options: maturityOptions },
      { id: "serverlessFit", prompt: "Are workloads suited to serverless or managed AWS services?", type: "scale", dimension: "costEfficiency", options: maturityOptions },
    ],
  },
  {
    id: "tooling",
    title: "Current tooling",
    shortTitle: "Tooling",
    questions: [
      { id: "currentTools", prompt: "Which tools are currently in use?", type: "multi", options: [
        { label: "DataHub", value: "DataHub" },
        { label: "Great Expectations", value: "Great Expectations" },
        { label: "MetaWorks", value: "MetaWorks" },
        { label: "AWS Glue", value: "AWS Glue" },
        { label: "Amazon Redshift", value: "Amazon Redshift" },
        { label: "dbt", value: "dbt" },
        { label: "Apache Airflow", value: "Apache Airflow" },
        { label: "Airbyte", value: "Airbyte" },
      ] },
    ],
  },
  {
    id: "risks",
    title: "Pain points and risks",
    shortTitle: "Risks",
    questions: [
      { id: "painPoints", prompt: "Main pain points or risks", type: "text" },
      { id: "riskManagement", prompt: "How mature is active data risk management?", type: "scale", dimension: "governance", options: maturityOptions },
    ],
  },
  {
    id: "lifecycle",
    title: "Data lifecycle and retention",
    shortTitle: "Lifecycle",
    questions: [
      { id: "retentionPolicies", prompt: "Do you define retention, archival, and deletion policies?", type: "scale", dimension: "lifecycleRetention", options: maturityOptions },
      { id: "dataDeletion", prompt: "Are deletion and archival controls automated and auditable?", type: "scale", dimension: "lifecycleRetention", options: maturityOptions },
    ],
  },
  {
    id: "ownership",
    title: "Data ownership and operating model",
    shortTitle: "Ownership",
    questions: [
      { id: "domainOwners", prompt: "Are business and technical data owners accountable for critical datasets?", type: "scale", dimension: "ownershipOperatingModel", options: maturityOptions },
      { id: "stewardship", prompt: "Is data stewardship embedded into delivery and support processes?", type: "scale", dimension: "ownershipOperatingModel", options: maturityOptions },
    ],
  },
  {
    id: "contracts",
    title: "Data contracts and schema evolution",
    shortTitle: "Contracts",
    questions: [
      { id: "dataContracts", prompt: "Do you enforce data contracts between producers and consumers?", type: "scale", dimension: "dataContracts", options: maturityOptions },
      { id: "schemaChanges", prompt: "How do you handle schema changes and breaking changes?", type: "scale", dimension: "dataContracts", options: maturityOptions },
    ],
  },
  {
    id: "cicd",
    title: "CI/CD for data pipelines",
    shortTitle: "CI/CD",
    questions: [
      { id: "versionControlled", prompt: "Is data pipeline code version controlled?", type: "scale", dimension: "cicd", options: maturityOptions },
      { id: "pipelineTesting", prompt: "Are pipeline changes tested through CI/CD?", type: "scale", dimension: "cicd", options: maturityOptions },
    ],
  },
  {
    id: "environments",
    title: "Dev, test, staging, and production separation",
    shortTitle: "Envs",
    questions: [
      { id: "envSeparation", prompt: "Do you use dev, test, staging, and production environments?", type: "scale", dimension: "environmentManagement", options: maturityOptions },
      { id: "releasePromotion", prompt: "Are data changes promoted through controlled release paths?", type: "scale", dimension: "environmentManagement", options: maturityOptions },
    ],
  },
  {
    id: "lineage",
    title: "Lineage and impact analysis",
    shortTitle: "Lineage",
    questions: [
      { id: "lineageTrace", prompt: "Can you trace lineage from source to dashboard?", type: "scale", dimension: "lineage", options: maturityOptions },
      { id: "columnLineage", prompt: "Do you support column-level lineage?", type: "scale", dimension: "lineage", options: maturityOptions },
    ],
  },
  {
    id: "sla",
    title: "Data SLAs, SLIs, and freshness targets",
    shortTitle: "SLAs",
    questions: [
      { id: "criticalSlas", prompt: "Do you define SLAs for critical datasets?", type: "scale", dimension: "slaFreshness", options: maturityOptions },
      { id: "freshnessTargets", prompt: "Are freshness targets monitored and visible to consumers?", type: "scale", dimension: "slaFreshness", options: maturityOptions },
    ],
  },
  {
    id: "advanced-quality",
    title: "Advanced data quality checks",
    shortTitle: "Adv Quality",
    questions: [
      { id: "advancedQuality", prompt: "Do checks cover anomalies, distribution drift, referential integrity, and business rules?", type: "scale", dimension: "dataQuality", options: maturityOptions },
      { id: "qualityOwnership", prompt: "Are quality failures routed to accountable data owners?", type: "scale", dimension: "ownershipOperatingModel", options: maturityOptions },
    ],
  },
  {
    id: "ml-ai",
    title: "ML and AI readiness",
    shortTitle: "ML/AI",
    questions: [
      { id: "aiReadiness", prompt: "Is your platform ready for ML or AI workloads?", type: "scale", dimension: "mlAiReadiness", options: maturityOptions },
      { id: "featureGovernance", prompt: "Are training data, features, lineage, and model inputs governed?", type: "scale", dimension: "mlAiReadiness", options: maturityOptions },
    ],
  },
  {
    id: "portability",
    title: "Vendor lock-in and portability",
    shortTitle: "Portability",
    questions: [
      { id: "lockInRisk", prompt: "Are you at risk of vendor lock-in?", helper: "Score higher when portability risk is actively understood and mitigated.", type: "scale", dimension: "cloudPortability", options: maturityOptions },
      { id: "openFormats", prompt: "Do you use open formats, portable metadata, and decoupled interfaces?", type: "scale", dimension: "cloudPortability", options: maturityOptions },
    ],
  },
  {
    id: "aws",
    title: "Cloud strategy and AWS adoption readiness",
    shortTitle: "AWS",
    questions: [
      { id: "awsReadiness", prompt: "How ready is the organisation to adopt managed AWS data services?", type: "scale", dimension: "cloudPortability", options: maturityOptions },
      { id: "cloudOperatingModel", prompt: "Are cloud controls, tagging, networking, IAM, and platform support models defined?", type: "scale", dimension: "securityCompliance", options: maturityOptions },
    ],
  },
];
