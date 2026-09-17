# Dispatch · C# scheduling showcase

The runnable C# source behind the scheduling ideas in Dispatch. This package adapts the author's original private `Scheduling` project into a public .NET 10 library, a small console demonstration, and dependency-free regression checks. The original repository and its history remain private.

The original design is recognizable: `ISchedulingStrategy`, six separate strategy classes, the shared `PreemptiveStrategy`, `ProcessDefinition`, `ProcessState`, `ProcessStateFactory`, `ScheduleResult`, `SchedulingRunner`, `PermutationHelper`, `PermutationExplorer`, and the lecture examples. The original `ProcessDefinition(Index, Name, ReadyTime, ExecutionTime, Deadline)` shape is retained. The scheduling engine is C#; the browser playground has a separate JavaScript implementation. This package does not compile C# to WebAssembly.

## Run

Install the .NET 10 SDK. No third-party packages or NuGet test frameworks are required.

```sh
dotnet build SchedulingShowcase.slnx --configuration Release
dotnet run --project SchedulingShowcase.Console --configuration Release --no-build
dotnet run --project SchedulingShowcase.Tests --configuration Release --no-build
```

The demonstration prints all six strategies on the original lecture workload, compressed timelines, correct waiting/turnaround/response metrics, and permutation summaries. The regression program exits 0 on success and 1 on failure. It is an ordinary console executable, so run it with `dotnet run`, not `dotnet test`.

## Public library

```csharp
using SchedulingShowcase;

ProcessDefinition[] jobs =
[
    new(0, "P1", 0, 5, 8),
    new(1, "P2", 1, 3, 5),
    new(2, "P3", 2, 1, 3)
];

ScheduleResult schedule = new RoundRobinStrategy().Schedule(jobs, quantum: 2);
IReadOnlyList<ScheduleResult> all = SchedulingRunner.RunAllStrategies(jobs, quantum: 2);
IReadOnlyList<PermutationResult> orders = PermutationExplorer.Explore(jobs, "rr", quantum: 2);
IReadOnlyList<PermutationResult> arrivals = PermutationExplorer.Explore(jobs, "srtf", mode: "arrival");
```

Strategy IDs are `fcfs`, `sjf`, `srtf`, `rr`, `edf`, and `llf`. Results keep jobs in input order and expose compressed execution/idle segments, per-job metrics, makespan, and aggregate metrics. Null timeline IDs represent idle intervals; intervals are half-open `[start, end)`.

## JSON parity interface

```sh
dotnet run --project SchedulingShowcase.Console --configuration Release --no-build -- --json fixtures/parity.json
```

`--json <path>` reads a JSON **array of workloads**:

```json
[
  {
    "caseId": "example",
    "jobs": [
      { "id": "P1", "arrival": 0, "burst": 4, "deadline": null },
      { "id": "P2", "arrival": 2, "burst": 1 }
    ],
    "quantum": 2,
    "strategies": ["fcfs", "rr"]
  }
]
```

`caseId` and `jobs` are required; each case ID must be unique and nonempty. Each job requires `id`, `arrival`, and `burst`; omitted or null `deadline` means no deadline. `quantum` defaults to 3. Omitted/null `strategies` selects all six in the order listed above. Unknown fields, fractional values, unsupported strategies, and invalid workloads are rejected.

Output is one JSON array, ordered by input workload and strategy, containing `{ caseId, strategy, quantum, timeline, jobs, makespan, metrics }`. Removing `caseId` gives the exact browser engine result shape. Property names are camelCase. `jobs` exposes `id`, `arrival`, `burst`, `deadline`, `start`, `completion`, `turnaround`, `waiting`, `response`, and `tardiness`. `metrics` exposes `waiting`, `turnaround`, `response`, `switches`, `deadlineMisses`, `deadlineCount`, and `utilization`. The program writes no demo text in JSON mode, writes failures to stderr, and exits 2 for invalid input. Use `--no-build` or invoke the built DLL when consuming stdout as JSON.

## Refactor decisions

- Correct **waiting = completion − arrival − burst**; the original property reported turnaround. Turnaround and response are now named separately.
- Keep one CPU, known burst lengths, integer ticks, and zero context-switch overhead. This is an educational model, not an operating-system benchmark.
- FCFS/SJF are non-preemptive. SRTF/EDF/LLF reconsider every tick. Ties resolve by arrival then **current list rank**. `Index` remains source metadata and does not override a queue-order experiment.
- EDF/LLF use positive infinity for missing deadlines. A job finishing exactly at its deadline is on time. A deadline before arrival is allowed as a deliberately infeasible experiment.
- Round Robin admits arrivals at a quantum boundary before requeuing the running job.
- Timeline origin is 0. Utilization includes initial idle time. Switches count direct job-to-job changes, excluding transitions to/from idle.
- Central validation bounds jobs to six, names to unique `P1`–`P6`, arrivals to 0–40, bursts to 1–30, deadlines to 0–200, and quantum to 1–20. Empty workloads return finite zero metrics. Inputs are never mutated.
- Permutations retain the original recursive swap structure while generating unique multiset permutations directly; six jobs cap exhaustive search at 720. Order exploration changes tie/queue order; arrival exploration redistributes existing arrival values without moving bursts or deadlines.
- The public core returns structured results. Console formatting and JSON serialization stay outside the scheduling algorithms.

The regression executable covers hand-worked timelines for all six strategies, quantum-boundary arrivals, tie ordering, missing/mixed deadlines, idle intervals, exact deadlines, unique permutations, invalid inputs, empty workloads, input immutability, and 200 deterministic workloads across all six strategies.

This directory contains only selected, refactored source and fixtures for the public showcase. It excludes private Git history, original repository metadata, IDE files, and compiled binaries.
