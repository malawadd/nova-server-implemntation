"use client";

import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div
      className="retro-shell min-h-screen retro-grid flex items-center justify-center px-4 py-12"
      style={{ flexDirection: "column", gap: 32 }}
    >
      <div className="text-center">
        <span className="font-black text-xl neon-text tracking-widest">
          NEURO<span style={{ color: "var(--retro-neon-pink)" }}>FEEDBACK</span>
        </span>
        <p className="text-xs font-bold uppercase tracking-widest opacity-50 mt-2">
          Sign in to continue
        </p>
      </div>
      <SignIn
        appearance={{
          variables: {
            colorPrimary: "#ff4fd8",
            colorBackground: "var(--retro-surface)",
            colorText: "var(--foreground)",
            fontFamily: "var(--font-geist-sans)",
            borderRadius: "0px",
          },
        }}
      />
    </div>
  );
}
