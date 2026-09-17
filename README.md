# Dispatch · Scheduling playground

An interactive, browser-based CPU scheduling laboratory by **cronfm**.

**[Open the playground](https://cronfm-scheduling.cronfm.chatgpt.site)**

Edit a workload, choose a strategy, and see exactly where every CPU tick goes. Compare all six algorithms side by side, replay a schedule, or explore every unique ordering to find the best and worst outcomes.

## Explore

- **Six strategies:** FCFS, SJF, shortest remaining time (SRTF), Round Robin, earliest deadline first (EDF), and least laxity first (LLF).
- **Five scenarios:** convoy effects, preemption, deadline pressure, idle gaps, and quantum tradeoffs.
- **Editable jobs:** arrivals, bursts, optional deadlines, and Round Robin quantum.
- **Visual timelines:** running intervals, waiting intervals, deadlines, playback, scrubbing, and single-tick stepping.
- **Honest metrics:** waiting, response, turnaround, deadline misses, per-job results, and direct task switches.
- **Exhaustive experiments:** queue/tie-order permutations or unique arrival-time assignments, ranked by average waiting. Apply a result directly to the workload.
- **Shareable experiments:** workload and strategy are encoded in the URL fragment. No accounts, backend, analytics, or stored user data.
- Responsive layouts, keyboard controls, readable text results, and optional feature-detected WebMCP tools.

## Run locally

Requires Node.js 22 or later. There are **no package dependencies** and no build step.

```sh
npm start
# http://127.0.0.1:4173
npm test
```

Serve the `dist/` directory on any static host. Relative asset paths also support deployment under a subdirectory. `.openai/hosting.json` identifies the public Sites deployment.

## Design and model

`dist/engine.js` is a pure, DOM-independent scheduling engine. `dist/app.js` owns presentation and interactions; both the visible controls and optional WebMCP actions use the same validation/update path. Tests use Node's built-in test runner.

The model has one CPU, integer ticks, known execution lengths, and **zero context-switch overhead**. A smaller Round Robin quantum may increase task switches but cannot increase total CPU work in this model. This is an educational simulation, not a claim about real operating-system performance.

- FCFS and SJF are non-preemptive. SRTF, EDF and LLF select a job every tick.
- Ties resolve by arrival, then the job's position in the current workload.
- Round Robin admits arrivals at a quantum boundary before requeuing the current job.
- Missing deadlines have infinite priority in EDF/LLF. Completion exactly at a deadline is on time.
- Waiting = completion − arrival − burst; turnaround = completion − arrival; response = first start − arrival.
- Switches count a direct change between jobs, excluding transitions to or from idle.
- Up to six jobs (720 order permutations), arrivals 0–40, bursts 1–30, deadlines 0–200, and quantum 1–20 keep exploration bounded. Arrival permutations are generated uniquely rather than deduplicated after factorial enumeration.

## Relationship to the original project

This is a clean public adaptation of the original private C# Scheduling project. It contains a browser-native refactor of its six algorithms and permutation experiments, with corrected waiting-time semantics, explicit input validation, safe missing-deadline behavior, and independent regression tests. The original repository and its history remain private; compiled binaries, IDE metadata, and private repository files are not included here.

## Verification

The test suite checks hand-worked timelines for every strategy, quantum-boundary arrivals, priority ties, absent deadlines, idle gaps, exact deadlines, unique permutations, invalid inputs, input immutability, and invariants over 200 deterministic workloads across all six strategies.

Google Fonts supplies DM Sans and DM Mono when available; system fonts are the fallback. All scheduling runs locally in the browser.
