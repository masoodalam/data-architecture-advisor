import { useEffect, useMemo, useState } from "react";
import { scoreAssessment } from "./logic/scoringEngine";
import { AssessmentPage } from "./pages/AssessmentPage";
import { LandingPage } from "./pages/LandingPage";
import { MethodologyPage } from "./pages/MethodologyPage";
import { ReportPage } from "./pages/ReportPage";
import type { Answers } from "./types";
import { clearAnswers, loadAnswers, saveAnswers } from "./utils/storage";

type View = "landing" | "methodology" | "assessment" | "report";

export default function App() {
  const [view, setView] = useState<View>("landing");
  const [answers, setAnswers] = useState<Answers>(() => loadAnswers());
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    saveAnswers(answers);
  }, [answers]);

  const result = useMemo(() => scoreAssessment(answers), [answers]);

  function handleAnswer(id: string, value: string | string[]) {
    setAnswers((current) => ({ ...current, [id]: value }));
  }

  function restart() {
    clearAnswers();
    setAnswers({});
    setCurrentStep(0);
    setView("landing");
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
    return <MethodologyPage onBack={() => setView("landing")} onStart={() => setView("assessment")} />;
  }

  return <LandingPage onStart={() => setView("assessment")} onMethodology={() => setView("methodology")} />;
}
