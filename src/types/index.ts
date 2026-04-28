export type ArchitectureMode = "open-source" | "hybrid" | "aws-managed";

export type QuestionType = "scale" | "select" | "multi" | "text";

export interface QuestionOption {
  label: string;
  value: string;
  score?: number;
}

export interface Question {
  id: string;
  prompt: string;
  helper?: string;
  type: QuestionType;
  dimension?: MaturityDimension;
  weight?: number;
  options?: QuestionOption[];
}

export interface Section {
  id: string;
  title: string;
  shortTitle: string;
  questions: Question[];
}

export type AnswerValue = string | string[] | number;

export type Answers = Record<string, AnswerValue>;

export type MaturityDimension =
  | "ingestion"
  | "storage"
  | "transformation"
  | "biConsumption"
  | "catalogueMetadata"
  | "governance"
  | "dataQuality"
  | "observability"
  | "securityCompliance"
  | "costEfficiency"
  | "lifecycleRetention"
  | "ownershipOperatingModel"
  | "dataContracts"
  | "cicd"
  | "environmentManagement"
  | "lineage"
  | "slaFreshness"
  | "mlAiReadiness"
  | "cloudPortability";

export interface DimensionScore {
  dimension: MaturityDimension;
  label: string;
  score: number;
  target: number;
}

export interface RiskItem {
  area: string;
  likelihood: number;
  impact: number;
  severity: "Low" | "Medium" | "High" | "Critical";
  recommendation: string;
}

export interface Recommendation {
  area: string;
  priority: "High" | "Medium" | "Low";
  timeframe: "Quick win" | "Stabilise" | "Scale";
  summary: string;
  actions: string[];
  tools: string[];
}

export interface AssessmentResult {
  mode: ArchitectureMode;
  overallScore: number;
  classification: string;
  dimensionScores: DimensionScore[];
  risks: RiskItem[];
  recommendations: Recommendation[];
}
