import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import Prism from "prismjs";
import loadLanguages from "prismjs/components/index.js";

loadLanguages(["csharp"]);

// These are real compiled source files, not separately maintained examples.
const sources = [
  ["ProcessDefinition", "The input", "An immutable record preserves the original process model. Current list order, rather than Index, decides a tied priority."],
  ["ISchedulingStrategy", "The contract", "Every algorithm implements one contract and returns the same timeline, job results and metrics."],
  ["ShortestJobFirstStrategy", "Choose the shortest", "LINQ makes the policy explicit: burst length, then arrival, then workload order. Once selected, a job runs to completion."],
  ["PreemptiveStrategy", "Share the mechanism", "SRTF, EDF and LLF supply a priority function to this shared tick-by-tick scheduling loop."],
  ["RoundRobinStrategy", "Take turns", "A FIFO queue controls time slices. New arrivals enter before the running job returns to the queue."],
  ["ProcessState", "Measure the result", "Waiting subtracts execution time from turnaround. Keeping the measures separate makes the tradeoffs visible."],
];
const root = new URL("../", import.meta.url);
const entries = await Promise.all(sources.map(async ([name, label, description]) => {
  const path = `csharp/SchedulingShowcase.Core/${name}.cs`;
  const code = (await readFile(new URL(path, root), "utf8")).replaceAll("\r\n", "\n").trimEnd();
  const html = Prism.highlight(code, Prism.languages.csharp, "csharp");
  return { name, label, description, path, code, html };
}));
await writeFile(new URL("dist/csharp-source.json", root), JSON.stringify(entries, null, 2) + "\n");
console.log(`Exported ${entries.length} compiled C# source files to ${fileURLToPath(new URL("dist/csharp-source.json", root))}`);
