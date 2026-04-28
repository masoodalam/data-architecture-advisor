import { ArrowLeft, ArrowRight, RotateCcw } from "lucide-react";
import { Button } from "../components/Button";
import { ProgressIndicator } from "../components/ProgressIndicator";
import { QuestionRenderer } from "../components/QuestionRenderer";
import { questionBank } from "../data/questionBank";
import type { Answers } from "../types";

interface AssessmentPageProps {
  answers: Answers;
  currentStep: number;
  setCurrentStep: (step: number) => void;
  onAnswer: (id: string, value: string | string[]) => void;
  onComplete: () => void;
  onRestart: () => void;
}

export function AssessmentPage({ answers, currentStep, setCurrentStep, onAnswer, onComplete, onRestart }: AssessmentPageProps) {
  const section = questionBank[currentStep];
  const isLast = currentStep === questionBank.length - 1;
  const answered = questionBank.flatMap((item) => item.questions).filter((question) => answers[question.id] !== undefined && answers[question.id] !== "").length;
  const total = questionBank.flatMap((item) => item.questions).length;

  return (
    <main className="min-h-screen bg-mist">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-teal">Data Architecture Advisor</p>
            <h1 className="text-xl font-bold text-ink">Enterprise assessment</h1>
          </div>
          <Button variant="ghost" onClick={onRestart}>
            <RotateCcw className="h-4 w-4" /> Restart
          </Button>
        </div>
      </header>
      <div className="mx-auto grid max-w-7xl gap-6 px-6 py-8 lg:grid-cols-[260px_1fr] lg:px-8">
        <ProgressIndicator currentStep={currentStep} onStepClick={setCurrentStep} />
        <section>
          <div className="rounded-md border border-slate-200 bg-white p-6 shadow-panel">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-slate-500">
                  Section {currentStep + 1} of {questionBank.length}
                </p>
                <h2 className="mt-1 text-3xl font-bold text-ink">{section.title}</h2>
              </div>
              <p className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-600">
                {answered}/{total} answered
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-4">
            {section.questions.map((question) => (
              <QuestionRenderer key={question.id} question={question} answers={answers} onChange={onAnswer} />
            ))}
          </div>

          <div className="mt-6 flex flex-wrap justify-between gap-3">
            <Button variant="secondary" onClick={() => setCurrentStep(Math.max(0, currentStep - 1))} disabled={currentStep === 0}>
              <ArrowLeft className="h-4 w-4" /> Previous
            </Button>
            {isLast ? (
              <Button onClick={onComplete}>Generate report <ArrowRight className="h-4 w-4" /></Button>
            ) : (
              <Button onClick={() => setCurrentStep(Math.min(questionBank.length - 1, currentStep + 1))}>
                Next section <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
