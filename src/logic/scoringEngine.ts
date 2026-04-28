import { questionBank } from "../data/questionBank";
import type { Answers, ArchitectureMode, AssessmentResult, DimensionScore, MaturityDimension, RiskItem } from "../types";
import { classifyMaturity, dimensionLabels, maturityDimensions } from "./maturityModel";
import { buildRecommendations } from "./recommendationEngine";

const defaultTarget = 4.2;

export function scoreAssessment(answers: Answers): AssessmentResult {
  const buckets = new Map<MaturityDimension, { total: number; weight: number }>();

  questionBank.flatMap((section) => section.questions).forEach((question) => {
    if (!question.dimension) return;
    const value = answers[question.id];
    if (value === undefined || value === "") return;
    const numericScore = Number(value);
    if (Number.isNaN(numericScore)) return;
    const weight = question.weight ?? 1;
    const bucket = buckets.get(question.dimension) ?? { total: 0, weight: 0 };
    bucket.total += numericScore * weight;
    bucket.weight += weight;
    buckets.set(question.dimension, bucket);
  });

  const dimensionScores: DimensionScore[] = maturityDimensions.map((dimension) => {
    const bucket = buckets.get(dimension);
    const score = bucket ? bucket.total / bucket.weight : 1;
    return {
      dimension,
      label: dimensionLabels[dimension],
      score: round(score),
      target: defaultTarget,
    };
  });

  const overallScore = round(dimensionScores.reduce((sum, item) => sum + item.score, 0) / dimensionScores.length);
  const mode = (answers.mode as ArchitectureMode) || "hybrid";
  const risks = buildRiskHeatmap(dimensionScores);

  return {
    mode,
    overallScore,
    classification: classifyMaturity(overallScore),
    dimensionScores,
    risks,
    recommendations: buildRecommendations(dimensionScores, mode, answers),
  };
}

function buildRiskHeatmap(scores: DimensionScore[]): RiskItem[] {
  return scores
    .filter((score) => score.score < 3.6)
    .map((score) => {
      const impact = score.dimension === "securityCompliance" || score.dimension === "governance" ? 5 : Math.ceil(6 - score.score);
      const likelihood = Math.ceil(6 - score.score);
      const product = impact * likelihood;
      const severity: RiskItem["severity"] = product >= 20 ? "Critical" : product >= 14 ? "High" : product >= 8 ? "Medium" : "Low";
      return {
        area: score.label,
        impact,
        likelihood,
        severity,
        recommendation: `Raise ${score.label.toLowerCase()} from ${score.score.toFixed(1)} toward the target by standardising controls, owners, automation, and measurable operating practices.`,
      };
    })
    .sort((a, b) => b.impact * b.likelihood - a.impact * a.likelihood)
    .slice(0, 9);
}

function round(value: number): number {
  return Math.round(value * 10) / 10;
}
