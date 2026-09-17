import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { simulate, STRATEGIES } from "../dist/engine.js";

const root = fileURLToPath(new URL("../", import.meta.url));
const dotnet = process.env.DOTNET_PATH || "dotnet";
const dll = join(root, "csharp/SchedulingShowcase.Console/bin/Release/net10.0/SchedulingShowcase.Console.dll");
const fixtures = JSON.parse(await readFile(new URL("../csharp/fixtures/parity.json", import.meta.url), "utf8"));
let seed = 1960917;
const next = (max) => {
  seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
  return seed % max;
};
for (let i = 0; i < 200; i++) {
  const jobs = Array.from({ length: next(7) }, (_, p) => ({
    id: `P${p + 1}`, arrival: next(41), burst: next(30) + 1,
    deadline: next(3) === 0 ? null : next(201),
  }));
  // Exercise current list order independently of the process ID.
  for (let p = jobs.length - 1; p > 0; p--) {
    const target = next(p + 1);
    [jobs[p], jobs[target]] = [jobs[target], jobs[p]];
  }
  fixtures.push({ caseId: `generated-${i}`, jobs, quantum: next(20) + 1 });
}
const directory = await mkdtemp(join(tmpdir(), "dispatch-parity-"));
try {
  const fixturePath = join(directory, "workloads.json");
  await writeFile(fixturePath, JSON.stringify(fixtures));
  const result = spawnSync(dotnet, [dll, "--json", fixturePath], { cwd: root, encoding: "utf8", maxBuffer: 32 * 1024 * 1024 });
  if (result.error) throw result.error;
  assert.equal(result.status, 0, result.stderr || "Build the C# solution in Release before running parity checks.");
  const actual = JSON.parse(result.stdout);
  const strategies = Object.keys(STRATEGIES);
  const expected = fixtures.flatMap((fixture) => (fixture.strategies ?? strategies).map((strategy) => ({
    caseId: fixture.caseId,
    ...simulate(fixture.jobs, strategy, fixture.quantum ?? 3),
  })));
  // Both engines perform the same integer sums and divisions; compare full results.
  assert.deepStrictEqual(actual, expected);
  console.log(`C# and JavaScript agree on ${actual.length} complete schedules across ${fixtures.length} workloads.`);
} finally {
  await rm(directory, { recursive: true, force: true });
}
