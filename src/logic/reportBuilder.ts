import { modeGuidance, modeLabels, requiredTools } from "../data/toolMappings";
import type { Answers, AssessmentResult } from "../types";
import { maturityNarrative } from "./maturityModel";

export function buildExecutiveSummary(result: AssessmentResult, answers: Answers): string {
  const orgName = typeof answers.orgName === "string" && answers.orgName.trim() ? answers.orgName.trim() : "The organisation";
  return `${orgName} is assessed at ${result.overallScore.toFixed(1)} out of 5.0 (${result.classification}). ${maturityNarrative(result.overallScore)} The recommended direction is ${modeLabels[result.mode].toLowerCase()}, combining practical controls with a platform roadmap that improves trust, delivery speed, resilience, and cost transparency.`;
}

export function buildArchitectureLayers(result: AssessmentResult) {
  const managed = result.mode === "aws-managed";
  return {
    current: ["Source systems", "Ad hoc ingestion", "Mixed storage", "Manual transforms", "Fragmented BI"],
    target: [
      "Source systems",
      result.mode === "open-source" ? requiredTools.ingestion : `${requiredTools.ingestion} / ${requiredTools.awsStreaming}`,
      `${requiredTools.awsStorage} raw-curated-consumption zones`,
      managed ? `${requiredTools.awsEtl}, ${requiredTools.awsServerless}, ${requiredTools.awsOrchestration}` : `${requiredTools.transformation}, ${requiredTools.orchestration}, ${requiredTools.awsEtl}`,
      `${requiredTools.awsWarehouse}, ${requiredTools.analyticsDb}, BI`,
      `${requiredTools.catalogue}, ${requiredTools.dataQuality}, ${requiredTools.standards}`,
    ],
  };
}

export function comparisonRows(result: AssessmentResult) {
  return [
    { area: "Catalogue", open: requiredTools.catalogue, aws: "AWS Glue Data Catalog plus DataHub for richer enterprise metadata", fit: "Use DataHub as the user-facing catalogue in all modes." },
    { area: "Quality", open: requiredTools.dataQuality, aws: "AWS Glue Data Quality where native checks are useful", fit: "Keep Great Expectations for portable, testable checks and catalogue visibility." },
    { area: "Standards", open: requiredTools.standards, aws: "AWS tags, policies, and account controls", fit: "Use MetaWorks for human-readable standards and link to AWS controls." },
    { area: "Orchestration", open: requiredTools.orchestration, aws: requiredTools.awsOrchestration, fit: result.mode === "open-source" ? "Airflow-first orchestration." : "Step Functions for managed workflows; Airflow where DAG portability matters." },
    { area: "Transformation", open: requiredTools.transformation, aws: requiredTools.awsEtl, fit: "Combine dbt for warehouse SQL and Glue for managed ETL." },
    { area: "BI", open: requiredTools.bi, aws: "Amazon QuickSight if AWS standardisation is desired", fit: "Open BI is strong where portability and cost control matter." },
    { area: "Monitoring", open: requiredTools.monitoring, aws: "Amazon CloudWatch", fit: "Use Grafana dashboards over platform, quality, and SLA metrics." },
  ];
}

export function modeSummary(result: AssessmentResult): string[] {
  return modeGuidance[result.mode];
}
