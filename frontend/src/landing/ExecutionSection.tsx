import { useState } from "react";
import { Play, Terminal, ShieldCheck, Cpu, HardDrive, CheckCircle2 } from "lucide-react";

interface RuntimeSnippet {
  language: string;
  entrypoint: string;
  source: string;
  output: string[];
}

const RUNTIME_SNIPPETS: Record<string, RuntimeSnippet> = {
  python: {
    language: "Python 3.11",
    entrypoint: "monte_carlo.py",
    source: `import random

def estimate_pi(samples=1_000_000):
    inside = sum(1 for _ in range(samples) if random.random()**2 + random.random()**2 <= 1.0)
    return 4 * inside / samples

print(f"Calculated π ~ {estimate_pi():.6f}")`,
    output: [
      "[E2B micro-VM container initialized in 194ms]",
      "python3 monte_carlo.py",
      "Calculated π ~ 3.141592",
      "[Execution completed in 0.42s • exit code 0]",
    ],
  },
  typescript: {
    language: "TypeScript / Node",
    entrypoint: "bench.ts",
    source: `import { performance } from "perf_hooks";

const start = performance.now();
const data = Array.from({ length: 50_000 }, (_, i) => i * 2);
const filtered = data.filter(n => n % 8 === 0).reduce((a, b) => a + b, 0);

console.log(\`Processed in \${(performance.now() - start).toFixed(2)}ms | Sum: \${filtered}\`);`,
    output: [
      "[E2B micro-VM container initialized in 210ms]",
      "npx tsx bench.ts",
      "Processed in 1.48ms | Sum: 312487500",
      "[Execution completed in 0.38s • exit code 0]",
    ],
  },
  cpp: {
    language: "C++ (g++ 13)",
    entrypoint: "quicksort.cpp",
    source: `#include <iostream>
#include <vector>
#include <algorithm>

int main() {
    std::vector<int> arr = {9, 2, 8, 4, 1, 7, 3, 5, 6};
    std::sort(arr.begin(), arr.end());
    std::cout << "Sorted: ";
    for (int x : arr) std::cout << x << " ";
    std::cout << std::endl;
    return 0;
}`,
    output: [
      "[E2B micro-VM container initialized in 188ms]",
      "g++ -O3 quicksort.cpp -o a.out && ./a.out",
      "Sorted: 1 2 3 4 5 6 7 8 9 ",
      "[Execution completed in 0.51s • exit code 0]",
    ],
  },
};

export function ExecutionSection() {
  const [selectedRuntime, setSelectedRuntime] = useState<"python" | "typescript" | "cpp">("python");
  const [isExecuting, setIsExecuting] = useState(false);
  const [terminalLines, setTerminalLines] = useState<string[]>(RUNTIME_SNIPPETS.python.output);

  const handleRun = () => {
    setIsExecuting(true);
    setTerminalLines(["[Spawning E2B micro-VM sandbox...]", "[Mounting workspace files...]"]);

    setTimeout(() => {
      setTerminalLines(RUNTIME_SNIPPETS[selectedRuntime].output);
      setIsExecuting(false);
    }, 450);
  };

  const currentSnippet = RUNTIME_SNIPPETS[selectedRuntime];

  return (
    <section id="execution" className="relative border-t border-[#27272a] bg-[#09090b] py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Conceptual Details */}
          <div className="lg:col-span-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#27272a] bg-[#121214] px-3 py-1 font-mono text-xs text-[#a1a1aa] mb-4">
              <span className="text-white">04</span>
              <span className="text-[#71717a]">/</span>
              <span>E2B Sandbox Execution Pipeline</span>
            </div>

            <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-[#f4f4f5]">
              Run code in micro-VM sandboxes in milliseconds.
            </h2>

            <p className="mt-4 text-base text-[#a1a1aa] leading-relaxed">
              No local compiler setup, Docker configurations, or security leaks. Confluo executes your project code inside isolated E2B cloud micro-VM containers with strict resource quotas, constant-time authentication, and real-time output bounding.
            </p>

            <div className="mt-8 grid grid-cols-2 gap-3 font-mono text-xs">
              <div className="rounded-lg border border-[#27272a] bg-[#121214] p-3">
                <ShieldCheck size={16} className="text-white mb-2" />
                <div className="font-semibold text-[#f4f4f5]">Isolated Micro-VM</div>
                <div className="text-[#a1a1aa] text-[11px] mt-1">Dedicated kernel boundary per execution</div>
              </div>

              <div className="rounded-lg border border-[#27272a] bg-[#121214] p-3">
                <Cpu size={16} className="text-white mb-2" />
                <div className="font-semibold text-[#f4f4f5]">Multi-Language</div>
                <div className="text-[#a1a1aa] text-[11px] mt-1">C++, C, Python, TS, Java, and Bash</div>
              </div>

              <div className="rounded-lg border border-[#27272a] bg-[#121214] p-3">
                <HardDrive size={16} className="text-white mb-2" />
                <div className="font-semibold text-[#f4f4f5]">100 KB Stream Cap</div>
                <div className="text-[#a1a1aa] text-[11px] mt-1">Safe stdout/stderr output truncation</div>
              </div>

              <div className="rounded-lg border border-[#27272a] bg-[#121214] p-3">
                <CheckCircle2 size={16} className="text-white mb-2" />
                <div className="font-semibold text-[#f4f4f5]">Rate Limited</div>
                <div className="text-[#a1a1aa] text-[11px] mt-1">60 runs/hour quota with 30s timeout</div>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Sandbox Playground */}
          <div className="lg:col-span-7">
            <div className="rounded-xl border border-[#27272a] bg-[#121214] overflow-hidden shadow-2xl">
              {/* Language Selector & Run Action */}
              <div className="flex flex-wrap items-center justify-between border-b border-[#27272a] bg-[#18181b] px-4 py-2.5 gap-2">
                <div className="flex items-center gap-1.5 font-mono text-xs">
                  {(["python", "typescript", "cpp"] as const).map((lang) => (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => {
                        setSelectedRuntime(lang);
                        setTerminalLines(RUNTIME_SNIPPETS[lang].output);
                      }}
                      className={`px-3 py-1 rounded transition-colors ${
                        selectedRuntime === lang
                          ? "bg-[#09090b] text-white border border-[#27272a] font-semibold"
                          : "text-[#a1a1aa] hover:text-[#f4f4f5]"
                      }`}
                    >
                      {lang === "python" ? "Python" : lang === "typescript" ? "TypeScript" : "C++"}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={handleRun}
                  disabled={isExecuting}
                  className="inline-flex items-center gap-1.5 rounded border border-white bg-white text-black px-3.5 py-1 text-xs font-mono font-semibold text-[#09090b] hover:bg-zinc-200 disabled:opacity-60 transition-all shadow-[0_0_15px_rgba(255, 255, 255, 0.25)]"
                >
                  <Play size={12} className="fill-[#09090b]" />
                  <span>{isExecuting ? "Executing…" : `Run ${currentSnippet.entrypoint}`}</span>
                </button>
              </div>

              {/* Code Snippet Box */}
              <div className="p-4 bg-[#09090b] font-mono text-xs text-[#f4f4f5] leading-relaxed border-b border-[#27272a] overflow-x-auto">
                <div className="text-[10px] text-[#71717a] mb-2 flex items-center justify-between">
                  <span>Entrypoint: {currentSnippet.entrypoint}</span>
                  <span className="text-[#d4d4d8]">{currentSnippet.language}</span>
                </div>
                <pre className="text-[#a1a1aa] whitespace-pre font-mono">
                  <code>{currentSnippet.source}</code>
                </pre>
              </div>

              {/* Terminal Output */}
              <div className="p-4 bg-[#09090b] font-mono text-xs">
                <div className="flex items-center justify-between text-[#71717a] text-[10px] pb-2 mb-2 border-b border-[#27272a]/60">
                  <div className="flex items-center gap-2 text-white">
                    <Terminal size={12} />
                    <span>Terminal Stream (stdout / stderr)</span>
                  </div>
                  <span>Sandbox Status: Active</span>
                </div>

                <div className="space-y-1">
                  {terminalLines.map((line, idx) => (
                    <div
                      key={idx}
                      className={
                        line.startsWith("✓") || line.includes("Calculated") || line.includes("Sorted") || line.includes("Processed")
                          ? "text-white font-medium"
                          : line.startsWith("[")
                          ? "text-[#d4d4d8]"
                          : "text-[#f4f4f5]"
                      }
                    >
                      {line}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

