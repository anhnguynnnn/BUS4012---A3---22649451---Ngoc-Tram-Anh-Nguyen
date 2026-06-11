import Button from "../components/Button";
import Layout from "../components/Layout";
import QuestionOption from "../components/QuestionOption";
import type { OnboardingAnswers, Page } from "../types";

const options = ["Similar to me", "Slightly different styles", "A mix of everything", "Womenswear", "Menswear", "Gender-neutral"];
type Props = { onboarding: OnboardingAnswers; setOnboarding: (value: OnboardingAnswers) => void; onFinish: () => void; onNavigate: (page: Page) => void };

export default function OnboardingDirectionPage({ onboarding, setOnboarding, onFinish, onNavigate }: Props) {
  const toggle = (option: string) => setOnboarding({ ...onboarding, stylingDirection: onboarding.stylingDirection.includes(option) ? onboarding.stylingDirection.filter((item) => item !== option) : [...onboarding.stylingDirection, option] });
  return <Layout currentPage="onboarding-direction" onNavigate={onNavigate}><section className="mx-auto max-w-5xl px-6 py-20 text-center"><p className="text-xs font-semibold uppercase tracking-[0.35em] text-neutral-500">Question 4 of 4</p><h1 className="mt-5 text-5xl font-semibold tracking-tight">What style would you like to see?</h1><div className="mt-10 flex flex-wrap justify-center gap-3">{options.map((option) => <QuestionOption key={option} label={option} selected={onboarding.stylingDirection.includes(option)} onClick={() => toggle(option)} />)}</div><div className="mx-auto mt-10 flex max-w-md gap-3"><Button onClick={onFinish}>Finish</Button><Button onClick={onFinish} variant="secondary">Skip</Button></div></section></Layout>;
}