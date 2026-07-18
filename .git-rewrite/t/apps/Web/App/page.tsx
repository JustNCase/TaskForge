export default function Home() {
  return (
    <main className="min-h-screen bg-slate-900 text-white">
      <section className="max-w-6xl mx-auto px-8 py-24">
        <h1 className="text-6xl font-bold">
          TaskForge AI
        </h1>

        <p className="text-xl mt-6 max-w-2xl text-slate-300">
          Take a picture of a problem.
          AI tells you what's wrong,
          how to fix it, and what it should cost.
        </p>

        <div className="mt-10 flex gap-4">
          <button className="bg-blue-600 px-6 py-3 rounded-lg">
            Upload Photo
          </button>

          <button className="border border-slate-500 px-6 py-3 rounded-lg">
            Learn More
          </button>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-8 py-12">
        <div className="grid md:grid-cols-3 gap-8">

          <div className="bg-slate-800 p-6 rounded-xl">
            <h2 className="text-2xl font-semibold">
              📷 Scan
            </h2>
            <p className="mt-3 text-slate-300">
              Upload a photo of the issue.
            </p>
          </div>

          <div className="bg-slate-800 p-6 rounded-xl">
            <h2 className="text-2xl font-semibold">
              🤖 Analyze
            </h2>
            <p className="mt-3 text-slate-300">
              AI detects the problem.
            </p>
          </div>

          <div className="bg-slate-800 p-6 rounded-xl">
            <h2 className="text-2xl font-semibold">
              🔧 Repair
            </h2>
            <p className="mt-3 text-slate-300">
              Get repair steps and cost estimates.
            </p>
          </div>

        </div>
      </section>
    </main>
  );
}
