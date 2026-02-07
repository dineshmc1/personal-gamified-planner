export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-neutral-950 text-neutral-100">
      <div className="z-10 max-w-5xl w-full items-center justify-center font-mono text-sm lg:flex flex-col gap-4">
        <h1 className="text-4xl font-bold text-emerald-400">Gamified Planner System</h1>
        <p className="text-xl text-neutral-400">Initialize Core...</p>

        <div className="mt-8 border border-neutral-800 bg-neutral-900 p-4 rounded-lg">
          <p className="text-yellow-500">Status: System Pending Authentication</p>
        </div>
      </div>
    </main>
  );
}
