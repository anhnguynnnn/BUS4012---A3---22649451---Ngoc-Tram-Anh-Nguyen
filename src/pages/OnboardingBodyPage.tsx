import Button from "../components/Button";
import Layout from "../components/Layout";
import QuestionOption from "../components/QuestionOption";
import type { OnboardingAnswers, Page } from "../types";

const sizes = ["XXS–XS", "S–M", "M–L", "L–XL", "XL+", "Prefer not to say"];
const heights = ["Under 155 cm", "155–165 cm", "165–175 cm", "175+ cm", "Prefer not to say"];

type Props = { onboarding: OnboardingAnswers; setOnboarding: (value: OnboardingAnswers) => void; onNext: () => void; onNavigate: (page: Page) => void };

export default function OnboardingBodyPage({ onboarding, setOnboarding, onNext, onNavigate }: Props) {
  const toggleSize = (option: string) => {
    const current = onboarding.sizeRange;
    const next = option === "Prefer not to say" ? [option] : current.includes(option) ? current.filter((item) => item !== option) : [...current.filter((item) => item !== "Prefer not to say"), option];
    setOnboarding({ ...onboarding, sizeRange: next });
  };

  return (
    <Layout currentPage="onboarding-body" onNavigate={onNavigate}>
      <section className="mx-auto max-w-5xl px-6 py-20 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-neutral-500">Question 2 of 4</p>
        <h1 className="mt-5 text-5xl font-semibold tracking-tight">Tell us your fit references</h1>
        <h2 className="mt-10 text-2xl font-semibold">What’s your usual size range?</h2>
        <div className="mt-5 flex flex-wrap justify-center gap-3">{sizes.map((option) => <QuestionOption key={option} label={option} selected={onboarding.sizeRange.includes(option)} onClick={() => toggleSize(option)} />)}</div>
        <h2 className="mt-12 text-2xl font-semibold">What’s your height range?</h2>
        <div className="mt-5 flex flex-wrap justify-center gap-3">{heights.map((option) => <QuestionOption key={option} label={option} selected={onboarding.heightRange === option} onClick={() => setOnboarding({ ...onboarding, heightRange: option })} />)}</div>
        <div className="mx-auto mt-10 flex max-w-md gap-3"><Button onClick={onNext}>Next</Button><Button onClick={onNext} variant="secondary">Skip</Button></div>
      </section>
    </Layout>
  );
}