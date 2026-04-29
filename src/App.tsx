import { useEffect, useMemo, useState } from "react";
import { scoreAssessment } from "./logic/scoringEngine";
import { AssessmentPage } from "./pages/AssessmentPage";
import { AwsCostDesignerPage } from "./pages/AwsCostDesignerPage";
import { LandingPage } from "./pages/LandingPage";
import { MethodologyPage } from "./pages/MethodologyPage";
import { ReportPage } from "./pages/ReportPage";
import type { Answers } from "./types";
import { clearAnswers, loadAnswers, saveAnswers } from "./utils/storage";

type View = "landing" | "methodology" | "awsCostDesigner" | "assessment" | "report";

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
    navigate("landing");
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
    return <ReportPage answers={answers} result={result} onBack={() => setView("assessment")} onRestart={restart} />;
  }

  if (view === "methodology") {
    return <MethodologyPage onBack={() => navigate("landing")} onStart={() => setView("assessment")} />;
  }

  if (view === "awsCostDesigner") {
    return <AwsCostDesignerPage onBack={() => navigate("landing")} />;
  }

  return <LandingPage onStart={() => setView("assessment")} onMethodology={() => setView("methodology")} onAwsCostDesigner={() => navigate("awsCostDesigner")} />;
}
