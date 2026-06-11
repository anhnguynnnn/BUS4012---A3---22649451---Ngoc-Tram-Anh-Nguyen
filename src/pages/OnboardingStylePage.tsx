import Button from "../components/Button";
import Layout from "../components/Layout";
import QuestionOption from "../components/QuestionOption";
import type { OnboardingAnswers, Page } from "../types";

const options = ["Minimal / clean", "Streetwear", "Feminine / soft", "Classic / tailored", "Trend-driven", "Still figuring out"];

type Props = { onboarding: OnboardingAnswers; setOnboarding: (value: OnboardingAnswers) => void; onNext: () => void; onNavigate: (page: Page) => void };

export default function OnboardingStylePage({ onboarding, setOnboarding, onNext, onNavigate }: Props) {
  const toggle = (option: string) => {
    const current = onboarding.styleAttraction;
    const next = option === "Still figuring out"
      ? [option]
      : current.includes(option)
        ? current.filter((item) => item !== option)
        : [...current.filter((item) => item !== "Still figuring out"), option];
    setOnboarding({ ...onboarding, styleAttraction: next });
  };

  return (
    <Layout currentPage="onboarding-style" onNavigate={onNavigate}>
      <section className="mx-auto max-w-5xl px-6 py-20 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-neutral-500">Question 1 of 4</p>
        <h1 className="mt-5 text-5xl font-semibold tracking-tight">What are you usually drawn to?</h1>
        <p className="mt-4 text-lg text-neutral-600">Select all that apply.</p>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          {options.map((option) => <QuestionOption key={option} label={option} selected={onboarding.styleAttraction.includes(option)} onClick={() => toggle(option)} />)}
        </div>
        <div className="mx-auto mt-10 flex max-w-md gap-3">
          <Button onClick={onNext}>Next</Button><Button onClick={onNext} variant="secondary">Skip</Button>
        </div>
      </section>
    </Layout>
  );
}