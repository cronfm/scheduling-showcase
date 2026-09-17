# Dispatch · C# scheduling playground

A C# scheduling project by **cronfm**, with an interactive browser companion.

**[Try Dispatch](https://scheduling.cronfm.com)** · **[Read the case study](https://cronfm.com/work/scheduling)** · **[Explore the C#](csharp)**

Compare six CPU scheduling strategies, remix workloads, and explore every unique ordering. Read the actual C# strategy classes in the source viewer, then run the .NET console project yourself.

## C# first

[`csharp/SchedulingShowcase.Core`](csharp/SchedulingShowcase.Core) is a .NET 10 library refactored from my original Scheduling project. It retains the strategy interface, six strategy classes, immutable process record, shared preemptive loop, and permutation helpers. Console formatting and JSON serialization live in a separate runner.

```sh
dotnet build csharp/SchedulingShowcase.slnx --configuration Release
dotnet run --project csharp/SchedulingShowcase.Console --configuration Release --no-build
dotnet run --project csharp/SchedulingShowcase.Tests --configuration Release --no-build
```

See the [C# README](csharp/README.md) for the public API, model decisions, and JSON interface. There are no third-party .NET dependencies. The original repository and its history remain private; only selected, refactored source is published here.

## Explore

- Six strategies: FCFS, SJF, SRTF, Round Robin, EDF, and LLF.
- Five scenarios: convoy effects, preemption, deadline pressure, idle gaps, and quantum tradeoffs.
- Editable arrivals, bursts, optional deadlines, and Round Robin quantum.
- Timelines, playback, waiting intervals, deadlines, per-job results, and side-by-side metrics.
- Queue/tie-order or unique arrival-assignment permutations, up to 720 possibilities.
- Shareable experiments encoded in the URL fragment. No accounts, analytics, backend data, or stored user workloads.
- A source viewer generated directly from the compiled C# files, with copy controls and GitHub links.
- Responsive layout, keyboard controls, and optional feature-detected WebMCP tools.

## Browser companion

The interactive simulation executes JavaScript in the browser. C# runs in the local .NET project; it is not executed by the browser or Cloudflare Worker. Both engines share the same model and are compared against identical workloads in CI.

Requires Node.js 22 or later:

```sh
npm ci
npm run build  # exports actual C# files to the source viewer
npm start     # http://127.0.0.1:4173
npm test
npm run test:parity  # requires the Release .NET build above
```

The browser has no JavaScript runtime dependencies. Wrangler is a development/deployment dependency. `dist/engine.js` is pure and DOM-independent; `dist/app.js` owns presentation. Google Fonts supplies DM Sans and DM Mono, with system fallbacks.

## Deploy to Cloudflare Workers

`wrangler.jsonc` deploys `dist/` using Workers Static Assets, with the custom domain **scheduling.cronfm.com**. It needs no KV, R2, D1, secrets, or server process. Unknown paths return 404; experiment state lives in the URL fragment.

```sh
npx wrangler login
npm run deploy
```

For Workers Builds, connect `cronfm/scheduling-showcase`, use the production branch `main`, root `/`, build command `npm run build`, and deploy command `npx wrangler deploy`. The Worker name must be `scheduling-showcase`. The checked-in account/domain configuration is for cronfm's account; change it before deploying a copy elsewhere.

## Model and verification

One CPU, integer ticks, known burst lengths, and zero context-switch overhead. This is an educational simulation, not an operating-system benchmark.

- FCFS/SJF are non-preemptive. SRTF/EDF/LLF select a job every tick.
- Ties resolve by arrival, then current workload position.
- Round Robin admits boundary arrivals before requeuing the running job.
- Missing deadlines have infinite priority. Completion exactly at a deadline is on time.
- Waiting = completion − arrival − burst; turnaround = completion − arrival; response = first start − arrival.
- Switches count direct job-to-job changes, excluding idle transitions.
- At most six jobs; arrivals 0–40, bursts 1–30, deadlines 0–200, quantum 1–20.

Node and C# regression suites check hand-worked timelines, boundaries, deadlines, idle gaps, validation, unique permutations, immutability, and deterministic workload invariants. The parity check compares **1,221 complete schedule results across 205 workloads**: timelines, job results, and aggregate metrics. CI also verifies that the source viewer matches the compiled C# files.
