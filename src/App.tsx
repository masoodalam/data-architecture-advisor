import { useEffect, useMemo, useState } from "react";
import { scoreAssessment } from "./logic/scoringEngine";
import { AssessmentChatPage } from "./pages/AssessmentChatPage";
import { AssessmentPage } from "./pages/AssessmentPage";
import { AwsCostDesignerPage } from "./pages/AwsCostDesignerPage";
import { GapAnalysisPage } from "./pages/GapAnalysisPage";
import { LandingPage } from "./pages/LandingPage";
import { MethodologyPage } from "./pages/MethodologyPage";
import { ReportPage } from "./pages/ReportPage";
import type { Answers, AssessmentResult } from "./types";
import { clearAnswers, loadAnswers, saveAnswers } from "./utils/storage";

type View = "landing" | "methodology" | "awsCostDesigner" | "assessment" | "chatAssessment" | "report" | "gapAnalysis";

function viewFromPath(): View {
  if (window.location.pathname.endsWith("/aws-cost-designer")) return "awsCostDesigner";
  return "landing";
}

function pathForView(view: View): string {
  const base = "/data-architecture-advisor";
  return view === "awsCostDesigner" ? `${base}/aws-cost-designer` : `${base}/`;
}

export default function App() {
  const [view, setView] = useState<View>(() => viewFromPath());
  const [answers, setAnswers] = useState<Answers>(() => loadAnswers());
  const [currentStep, setCurrentStep] = useState(0);
  const [chatResult, setChatResult] = useState<AssessmentResult | null>(null);

  useEffect(() => {
    saveAnswers(answers);
  }, [answers]);

  useEffect(() => {
    const handlePopState = () => setView(viewFromPath());
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const result = useMemo(() => scoreAssessment(answers), [answers]);

  function navigate(nextView: View) {
    setView(nextView);
    if (nextView !== "assessment" && nextView !== "report") {
      window.history.pushState({}, "", pathForView(nextView));
    }
  }

  function handleAnswer(id: string, value: string | string[]) {
    setAnswers((current) => ({ ...current, [id]: value }));
  }

  function restart() {
    clearAnswers();
    setAnswers({});
    setCurrentStep(0);
    setChatResult(null);
    navigate("landing");
  }

  if (view === "chatAssessment") {
    return (
      <AssessmentChatPage
        onComplete={(result) => { setChatResult(result); setView("report"); }}
        onBack={() => navigate("landing")}
        onTraditional={() => setView("assessment")}
      />
    );
  }

  if (view === "assessment") {
    return (
      <AssessmentPage
        answers={answers}
        currentStep={currentStep}
        setCurrentStep={setCurrentStep}
        onAnswer={handleAnswer}
        onComplete={() => setView("report")}
        onRestart={restart}
      />
    );
  }

  if (view === "report") {
    const reportResult = chatResult ?? result;
    return <ReportPage answers={answers} result={reportResult} onBack={() => navigate("landing")} onRestart={restart} />;
  }

  if (view === "methodology") {
    return <MethodologyPage onBack={() => navigate("landing")} onStart={() => setView("assessment")} />;
  }

  if (view === "awsCostDesigner") {
    return <AwsCostDesignerPage onBack={() => navigate("landing")} />;
  }

  if (view === "gapAnalysis") {
    return <GapAnalysisPage onBack={() => navigate("landing")} />;
  }

  return (
    <LandingPage
      onStart={() => setView("chatAssessment")}
      onTraditional={() => setView("assessment")}
      onMethodology={() => setView("methodology")}
      onAwsCostDesigner={() => navigate("awsCostDesigner")}
      onGapAnalysis={() => setView("gapAnalysis")}
    />
  );
}
