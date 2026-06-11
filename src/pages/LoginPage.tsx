import Button from "../components/Button";
import Input from "../components/Input";
import Layout from "../components/Layout";
import type { Page } from "../types";

type LoginPageProps = {
  onLogin: () => void;
  onSignUp: () => void;
  onNavigate: (page: Page) => void;
};

export default function LoginPage({ onLogin, onSignUp, onNavigate }: LoginPageProps) {
  return (
    <Layout currentPage="login" onNavigate={onNavigate}>
      <section className="bg-neutral-50 px-6 py-20">
        <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 lg:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-neutral-500">MUSÉ account</p>
            <h1 className="mt-5 text-5xl font-semibold tracking-tight">Welcome back to your style space.</h1>
            <p className="mt-5 max-w-xl text-lg leading-8 text-neutral-600">Continue exploring real-life outfit inspiration, saved looks, and body-aware discovery.</p>
          </div>
          <div className="space-y-6 rounded-3xl border border-neutral-200 bg-white p-8 shadow-sm md:p-10">
            <h2 className="text-3xl font-semibold tracking-tight">Welcome back</h2>
            <p className="mt-2 text-sm text-neutral-500">Log in to continue to MUSÉ.</p>
            <div className="space-y-3">
              <Input label="Email" placeholder="user@muse.app" type="email" />
              <Input label="Password" placeholder="••••••••" type="password" />
            </div>
            <Button onClick={onLogin}>Log in</Button>
            <button onClick={onSignUp} className="w-full text-center text-sm text-neutral-500 underline-offset-4 hover:text-black hover:underline">
              Not a member? Sign up
            </button>
          </div>
        </div>
      </section>
    </Layout>
  );
}