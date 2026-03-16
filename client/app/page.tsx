"use client";

import Link from "next/link";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import BrainScene from "@/components/brain/BrainLoader";
import FeatureCard from "@/components/landing/FeatureCard";
import HeroStats from "@/components/landing/HeroStats";

export default function Home() {
  return (
    <div className="retro-shell">
      {/* ── Nav ── */}
      <header className="hybrid-surface retro-grid sticky top-0 z-20 px-6 py-3 border-x-0 border-t-0 flex items-center justify-between">
        <span className="font-black text-lg neon-text tracking-widest">NEURO<span style={{ color: "var(--retro-neon-pink)" }}>FEEDBACK</span></span>
        <nav className="hidden sm:flex items-center gap-3">
          <Link href="/privacy" className="nav-link text-xs">Privacy</Link>
          <Link href="/terms" className="nav-link text-xs">Terms</Link>
          <SignedIn>
            <UserButton afterSignOutUrl="/" />
            <Link href="/app" className="hybrid-button px-4 py-2 text-sm cursor-pointer inline-block no-underline text-center">
              Go to App →
            </Link>
          </SignedIn>
          <SignedOut>
            <Link href="/sign-in" className="nav-link px-4 py-2 text-sm cursor-pointer inline-block no-underline text-center">Sign In</Link>
            <Link href="/sign-up" className="hybrid-button px-4 py-2 text-sm cursor-pointer inline-block no-underline text-center">
              Start Free →
            </Link>
          </SignedOut>
        </nav>
        <div className="sm:hidden flex items-center gap-2">
          <SignedIn>
            <UserButton afterSignOutUrl="/" />
            <Link href="/app" className="hybrid-button px-3 py-2 text-xs cursor-pointer inline-block no-underline text-center">
              App →
            </Link>
          </SignedIn>
          <SignedOut>
            <Link href="/sign-up" className="hybrid-button px-3 py-2 text-xs cursor-pointer inline-block no-underline text-center">
              Start →
            </Link>
          </SignedOut>
        </div>
      </header>

      <main>
        {/* ── Hero ── */}
        <section className="retro-grid min-h-[90vh] flex flex-col items-center justify-center px-6 py-24 text-center gap-8">
          <div className="flex flex-col items-center gap-4 max-w-3xl">
            <span
              className="status-pill"
              style={{ background: "var(--retro-neon-purple)", color: "white", borderColor: "var(--border)" }}
            >
              AI-powered · Real-time · Evidence-based
            </span>
            <h1 className="neon-text text-5xl sm:text-7xl leading-none">
              REWIRE YOUR BRAIN<br />
              <span style={{ color: "var(--retro-neon-pink)" }}>ONE SESSION</span> AT A TIME
            </h1>
            <p className="text-lg font-medium max-w-xl opacity-80 leading-relaxed">
              Speak naturally with your AI companion. Watch your brain light up in real-time.
              Guided therapy techniques designed around <em>your</em> mind.
            </p>
          </div>

          <div className="flex flex-wrap gap-4 justify-center items-center">
            <SignedOut>
              <Link
                href="/sign-up"
                className="hybrid-button px-8 py-4 text-base cursor-pointer inline-block no-underline text-center"
              >
                ⚡ Start Your First Session
              </Link>
            </SignedOut>
            <SignedIn>
              <Link
                href="/app/sessions/new"
                className="hybrid-button px-8 py-4 text-base cursor-pointer inline-block no-underline text-center"
              >
                ⚡ New Session
              </Link>
            </SignedIn>
            <Link
              href="/app"
              className="neobrutalism-btn text-sm"
            >
              Explore App →
            </Link>
          </div>

          <HeroStats />
        </section>

        {/* ── Brain Visual Section ── */}
        <section className="px-6 py-20 retro-grid">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="neon-text">YOUR BRAIN, VISUALIZED</h2>
              <p className="mt-3 text-base font-medium opacity-70 max-w-lg mx-auto">
                Watch which regions activate as your AI therapist guides you through personalized exercises.
              </p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <BrainScene size="large" highlightAllRegions />

              <div className="flex flex-col gap-4">
                {[
                  { region: "Prefrontal Cortex", color: "var(--retro-neon-cyan)", desc: "Activates during focus and decision exercises" },
                  { region: "Amygdala", color: "var(--retro-neon-pink)", desc: "Monitored to track emotional regulation" },
                  { region: "Hippocampus", color: "var(--retro-neon-purple)", desc: "Engaged during memory and stress recall work" },
                  { region: "Anterior Cingulate", color: "var(--retro-neon-orange)", desc: "Lit up during attention and empathy techniques" },
                  { region: "Insula", color: "var(--accent)", desc: "Active during body-scan and grounding exercises" },
                ].map((item) => (
                  <div
                    key={item.region}
                    className="hybrid-surface flex items-center gap-4 px-4 py-3"
                  >
                    <span
                      style={{
                        display: "inline-block",
                        width: 14,
                        height: 14,
                        borderRadius: "50%",
                        background: item.color,
                        boxShadow: `0 0 10px ${item.color}`,
                        flexShrink: 0,
                        border: "2px solid var(--border)",
                      }}
                    />
                    <div>
                      <p className="font-black text-sm uppercase tracking-wide">{item.region}</p>
                      <p className="text-xs font-medium opacity-60 mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Features ── */}
        <section className="px-6 py-20">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="neon-text">EVERYTHING YOU NEED</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <FeatureCard
                icon="◉"
                title="Voice-First AI"
                desc="Speak naturally. Your AI companion listens, reflects, and guides — like a therapist who's always available."
                color="var(--retro-neon-cyan)"
              />
              <FeatureCard
                icon="◈"
                title="Brain Visualization"
                desc="Retro 80s rotating brain model highlights which regions are activated during each therapeutic technique."
                color="var(--retro-neon-pink)"
              />
              <FeatureCard
                icon="◎"
                title="Evidence-Based Therapy"
                desc="CBT, breathing exercises, grounding, PMR, and values work — all guided by AI in real-time."
                color="var(--retro-neon-purple)"
              />
              <FeatureCard
                icon="▦"
                title="Insights & Patterns"
                desc="Track your mood over time. See which techniques work best for your brain. Own your progress."
                color="var(--retro-neon-orange)"
              />
              <FeatureCard
                icon="▣"
                title="Privacy-First"
                desc="Local-only mode available. You control what's stored. Your mental health data belongs to you."
                color="var(--accent)"
              />
              <FeatureCard
                icon="★"
                title="Quick Sessions"
                desc="3-minute grounding exercise or a full 30-minute deep dive. Your pace, your choice, every time."
                color="var(--success)"
              />
            </div>
          </div>
        </section>

        {/* ── Session Modes ── */}
        <section className="px-6 py-20 retro-grid">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="neon-text">3 WAYS TO START</h2>
              <p className="mt-3 text-base font-medium opacity-70">
                Choose the session type that fits your moment.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {[
                {
                  icon: "▷", title: "Free Talk", color: "var(--retro-neon-cyan)",
                  desc: "Just talk. The AI listens, reflects, and gently guides you toward clarity. No agenda.",
                  badge: "Most popular",
                },
                {
                  icon: "⊕", title: "Guided Exercise", color: "var(--retro-neon-pink)",
                  desc: "Pick a technique (breathing, CBT, grounding…) and follow structured AI-led steps.",
                  badge: "Great for focus",
                },
                {
                  icon: "▤", title: "Program", color: "var(--retro-neon-purple)",
                  desc: "Multi-session plans (7-day stress reset, sleep improvement, mood boost). Guided progress.",
                  badge: "Coming soon",
                },
              ].map((m) => (
                <div key={m.title} className="hybrid-surface p-6 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span style={{ fontSize: 36 }}>{m.icon}</span>
                    <span
                      className="status-pill"
                      style={{ background: m.color, color: "#130b3b", borderColor: "var(--border)", fontSize: 10 }}
                    >
                      {m.badge}
                    </span>
                  </div>
                  <h3 style={{ color: m.color }}>{m.title}</h3>
                  <p className="text-sm font-medium opacity-70 leading-relaxed flex-1">{m.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="px-6 py-24 retro-grid text-center">
          <div className="max-w-2xl mx-auto flex flex-col gap-8 items-center">
            <h2 className="neon-text">READY TO START?</h2>
            <p className="text-base font-medium opacity-70 leading-relaxed">
              No account required to explore. Set your goals, choose your style, begin your first session in under 2 minutes.
            </p>
            <SignedOut>
              <Link
                href="/sign-up"
                className="hybrid-button px-10 py-5 text-lg cursor-pointer inline-block no-underline text-center"
              >
                ⚡ Begin Onboarding →
              </Link>
            </SignedOut>
            <SignedIn>
              <Link
                href="/app"
                className="hybrid-button px-10 py-5 text-lg cursor-pointer inline-block no-underline text-center"
              >
                ⚡ Go to Dashboard →
              </Link>
            </SignedIn>
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer
        className="hybrid-surface border-x-0 border-b-0 px-6 py-8 flex flex-wrap gap-4 items-center justify-between"
      >
        <span className="font-black neon-text">NEUROFEEDBACK</span>
        <div className="flex gap-4">
          <Link href="/privacy" className="nav-link text-xs">Privacy</Link>
          <Link href="/terms" className="nav-link text-xs">Terms</Link>
          <Link href="/app" className="nav-link text-xs">App</Link>
        </div>
        <span className="text-xs font-bold opacity-40 mono">© 2026 NeuroFeedback</span>
      </footer>
    </div>
  );
}

// export default function Home() {
//   return (
//     <>
//       <header className="hybrid-surface retro-grid sticky top-0 z-10 px-4 py-3 border-x-0 border-t-0 flex flex-row justify-between items-center">
//         <span className="font-black tracking-wide neon-text">Convex + Next.js + Clerk</span>
//         <UserButton />
//       </header>
//       <main className="retro-grid p-8 flex flex-col gap-8 min-h-[calc(100vh-88px)]">
//         <h1 className="text-4xl font-bold text-center neon-text">
//           Convex + Next.js + Clerk
//         </h1>
//         <Authenticated>
//           <Content />
//         </Authenticated>
//         <Unauthenticated>
//           <SignInForm />
//         </Unauthenticated>
//       </main>
//     </>
//   );
// }

// function SignInForm() {
//   return (
//     <div className="hybrid-surface flex flex-col gap-6 w-full max-w-md mx-auto p-6">
//       <p>Log in to see the numbers</p>
//       <SignInButton mode="modal">
//         <button className="hybrid-button px-4 py-2">
//           Sign in
//         </button>
//       </SignInButton>
//       <SignUpButton mode="modal">
//         <button className="hybrid-button px-4 py-2">
//           Sign up
//         </button>
//       </SignUpButton>
//     </div>
//   );
// }

// function Content() {
//   const { viewer, numbers } =
//     useQuery(api.myFunctions.listNumbers, {
//       count: 10,
//     }) ?? {};
//   const addNumber = useMutation(api.myFunctions.addNumber);

//   if (viewer === undefined || numbers === undefined) {
//     return (
//       <div className="mx-auto">
//         <p>loading... (consider a loading skeleton)</p>
//       </div>
//     );
//   }

//   return (
//     <div className="hybrid-surface flex flex-col gap-7 max-w-3xl mx-auto p-6">
//       <p>Welcome {viewer ?? "Anonymous"}!</p>
//       <p>
//         Click the button below and open this page in another window - this data
//         is persisted in the Convex cloud database!
//       </p>
//       <p>
//         <button
//           className="hybrid-button text-sm px-4 py-2"
//           onClick={() => {
//             void addNumber({ value: Math.floor(Math.random() * 10) });
//           }}
//         >
//           Add a random number
//         </button>
//       </p>
//       <p>
//         Numbers:{" "}
//         {numbers?.length === 0
//           ? "Click the button!"
//           : (numbers?.join(", ") ?? "...")}
//       </p>
//       <p>
//         Edit{" "}
//         <code className="text-sm font-bold font-mono hybrid-code">
//           convex/myFunctions.ts
//         </code>{" "}
//         to change your backend
//       </p>
//       <p>
//         Edit{" "}
//         <code className="text-sm font-bold font-mono hybrid-code">
//           app/page.tsx
//         </code>{" "}
//         to change your frontend
//       </p>
//       <p>
//         See the{" "}
//         <Link href="/server" className="underline hover:no-underline neon-text font-bold">
//           /server route
//         </Link>{" "}
//         for an example of loading data in a server component
//       </p>
//       <div className="flex flex-col">
//         <p className="text-lg font-bold neon-text">Useful resources:</p>
//         <div className="flex gap-3 flex-col md:flex-row">
//           <div className="flex flex-col gap-3 md:w-1/2">
//             <ResourceCard
//               title="Convex docs"
//               description="Read comprehensive documentation for all Convex features."
//               href="https://docs.convex.dev/home"
//             />
//             <ResourceCard
//               title="Stack articles"
//               description="Learn about best practices, use cases, and more from a growing
//             collection of articles, videos, and walkthroughs."
//               href="https://www.typescriptlang.org/docs/handbook/2/basic-types.html"
//             />
//           </div>
//           <div className="flex flex-col gap-3 md:w-1/2">
//             <ResourceCard
//               title="Templates"
//               description="Browse our collection of templates to get started quickly."
//               href="https://www.convex.dev/templates"
//             />
//             <ResourceCard
//               title="Discord"
//               description="Join our developer community to ask questions, trade tips & tricks,
//             and show off your projects."
//               href="https://www.convex.dev/community"
//             />
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }


