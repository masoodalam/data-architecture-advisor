import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { AssessmentResult } from "../types";

export function MaturityRadar({ result }: { result: AssessmentResult }) {
  return (
    <div className="h-[420px]">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={result.dimensionScores}>
          <PolarGrid />
          <PolarAngleAxis dataKey="label" tick={{ fill: "#475569", fontSize: 11 }} />
          <Radar name="Current" dataKey="score" stroke="#0f766e" fill="#0f766e" fillOpacity={0.25} />
          <Radar name="Target" dataKey="target" stroke="#b45309" fill="#b45309" fillOpacity={0.08} />
          <Legend />
          <Tooltip />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function DomainBarChart({ result }: { result: AssessmentResult }) {
  return (
    <div className="h-[520px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={result.dimensionScores} layout="vertical" margin={{ left: 90, right: 24 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" domain={[0, 5]} />
          <YAxis type="category" dataKey="label" tick={{ fontSize: 11 }} width={130} />
          <Tooltip />
          <Bar dataKey="score" fill="#0f766e" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function PriorityMatrix({ result }: { result: AssessmentResult }) {
  const data = result.recommendations.map((rec, index) => ({
    x: rec.timeframe === "Quick win" ? 1 : rec.timeframe === "Stabilise" ? 2 : 3,
    y: rec.priority === "High" ? 3 : rec.priority === "Medium" ? 2 : 1,
    name: rec.area,
    index,
  }));

  return (
    <div className="h-[340px]">
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 20, right: 24, bottom: 32, left: 24 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" dataKey="x" domain={[0.5, 3.5]} ticks={[1, 2, 3]} tickFormatter={(value) => ["", "Quick", "Stabilise", "Scale"][Number(value)]} />
          <YAxis type="number" dataKey="y" domain={[0.5, 3.5]} ticks={[1, 2, 3]} tickFormatter={(value) => ["", "Low", "Medium", "High"][Number(value)]} />
          <Tooltip cursor={{ strokeDasharray: "3 3" }} formatter={(_, __, item) => data[item.payload.index].name} />
          <Scatter name="Priorities" data={data} fill="#be123c" />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}

export function CostComplexityChart() {
  const data = [
    { name: "Airbyte", cost: 2, complexity: 2 },
    { name: "DataHub", cost: 3, complexity: 3 },
    { name: "Great Expectations", cost: 2, complexity: 2 },
    { name: "MetaWorks", cost: 2, complexity: 2 },
    { name: "AWS Glue", cost: 3, complexity: 2 },
    { name: "Redshift", cost: 4, complexity: 3 },
    { name: "Kinesis", cost: 3, complexity: 4 },
    { name: "ClickHouse", cost: 3, complexity: 4 },
  ];
  return (
    <div className="h-[320px]">
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 20, right: 24, bottom: 32, left: 24 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" dataKey="cost" domain={[0, 5]} name="Cost" />
          <YAxis type="number" dataKey="complexity" domain={[0, 5]} name="Complexity" />
          <Tooltip cursor={{ strokeDasharray: "3 3" }} formatter={(value, name) => [value, name]} labelFormatter={(_, items) => items?.[0]?.payload?.name ?? ""} />
          <Scatter data={data} fill="#0f766e" />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
