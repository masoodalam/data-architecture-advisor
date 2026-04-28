import type { ArchitectureMode } from "../types";

export const requiredTools = {
  catalogue: "DataHub",
  dataQuality: "Great Expectations",
  standards: "MetaWorks",
  awsStorage: "Amazon S3",
  awsWarehouse: "Amazon Redshift",
  awsEtl: "AWS Glue",
  awsServerless: "AWS Lambda",
  awsOrchestration: "Step Functions",
  awsStreaming: "Amazon Kinesis",
  orchestration: "Apache Airflow",
  transformation: "dbt",
  bi: "Apache Superset or Metabase",
  monitoring: "Prometheus and Grafana",
  analyticsDb: "ClickHouse",
  ingestion: "Airbyte",
};

export const modeLabels: Record<ArchitectureMode, string> = {
  "open-source": "Open source heavy",
  hybrid: "Hybrid",
  "aws-managed": "AWS managed",
};

export const modeGuidance: Record<ArchitectureMode, string[]> = {
  "open-source": [
    "Prioritise DataHub, Great Expectations, MetaWorks, Airbyte, dbt, Airflow, Superset or Metabase, ClickHouse, Prometheus, and Grafana.",
    "Use cloud object storage where needed, but keep orchestration, transformation, catalogue, and BI portable.",
  ],
  hybrid: [
    "Use Amazon S3, AWS Glue, Lambda, Step Functions, Kinesis, and Redshift for managed platform services.",
    "Keep open metadata, quality, transformation, and BI layers with DataHub, Great Expectations, MetaWorks, dbt, and Superset or Metabase.",
  ],
  "aws-managed": [
    "Anchor the platform on S3, Glue, Lambda, Step Functions, Kinesis, and Redshift with AWS-native security and operations.",
    "Integrate DataHub, Great Expectations, and MetaWorks to preserve rich metadata, standards, and quality visibility.",
  ],
};
