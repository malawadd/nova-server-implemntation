import Home from "./inner";
import { preloadQuery, preloadedQueryResult } from "convex/nextjs";
import { api } from "@/convex/_generated/api";

export default async function ServerPage() {
  const preloaded = await preloadQuery(api.myFunctions.listNumbers, {
    count: 3,
  });

  const data = preloadedQueryResult(preloaded);

  return (
    <main className="retro-grid p-8 flex flex-col gap-5 mx-auto max-w-3xl min-h-screen">
      <h1 className="text-4xl font-bold text-center neon-text">Convex + Next.js</h1>
      <div className="hybrid-surface flex flex-col gap-4 p-4">
        <h2 className="text-xl font-bold neon-text">Non-reactive server-loaded data</h2>
        <code>
          <pre>{JSON.stringify(data, null, 2)}</pre>
        </code>
      </div>
      <Home preloaded={preloaded} />
    </main>
  );
}
