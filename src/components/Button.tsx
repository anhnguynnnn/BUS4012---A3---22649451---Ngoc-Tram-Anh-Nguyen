import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost";
};

export default function Button({ children, variant = "primary", className = "", ...props }: ButtonProps) {
  const variants = {
    primary: "bg-black text-white hover:bg-neutral-800",
    secondary: "border border-neutral-300 bg-white text-black hover:bg-neutral-50",
    ghost: "bg-transparent text-neutral-600 hover:text-black",
  };

  return (
    <button
      className={`w-full rounded-full px-5 py-3 text-sm font-semibold transition ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}