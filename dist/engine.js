/** Pure single-CPU scheduler. Integer time, zero context-switch overhead. */
export const STRATEGIES = {
  fcfs: {
    name: "First come, first served",
    short: "FCFS",
    type: "Non-preemptive",
    description:
      "Run the earliest arrival to completion. Simple and predictable, but a long job can hold up everyone behind it.",
  },
  sjf: {
    name: "Shortest job first",
    short: "SJF",
    type: "Non-preemptive",
    description:
      "Pick the shortest ready job. Once it starts, it finishes. A short job arriving later still has to wait.",
  },
  srtf: {
    name: "Shortest remaining time",
    short: "SRTF",
    type: "Preemptive",
    description:
      "At every tick, run the job with the least work left. New short jobs can interrupt a longer one.",
  },
  rr: {
    name: "Round Robin",
    short: "RR",
    type: "Time-sliced",
    description:
      "Give each ready job a turn. A small quantum improves responsiveness, but usually means more switches.",
  },
  edf: {
    name: "Earliest deadline first",
    short: "EDF",
    type: "Preemptive",
    description:
      "Run the ready job with the nearest deadline. Jobs with no deadline follow jobs with a deadline.",
  },
  llf: {
    name: "Least laxity first",
    short: "LLF",
    type: "Preemptive",
    description:
      "Run the job with the least slack: deadline minus current time minus work left. Watch how urgency changes.",
  },
};
export const LIMITS = {
  jobs: 6,
  arrival: 40,
  burst: 30,
  deadline: 200,
  quantum: 20,
};
function integer(value, min, max, label) {
  if (!Number.isInteger(value) || value < min || value > max)
    throw new RangeError(`${label} must be an integer from ${min} to ${max}.`);
}
export function validate(jobs, strategy, quantum) {
  if (!Object.hasOwn(STRATEGIES, strategy))
    throw new Error("Choose a supported strategy.");
  integer(quantum, 1, LIMITS.quantum, "Quantum");
  if (!Array.isArray(jobs) || jobs.length > LIMITS.jobs)
    throw new Error("Use at most six jobs.");
  const ids = new Set();
  for (const job of jobs) {
    if (
      !job ||
      typeof job.id !== "string" ||
      !/^P[1-6]$/.test(job.id) ||
      ids.has(job.id)
    )
      throw new Error("Job IDs must be unique P1–P6.");
    ids.add(job.id);
    integer(job.arrival, 0, LIMITS.arrival, `${job.id} arrival`);
    integer(job.burst, 1, LIMITS.burst, `${job.id} burst`);
    if (job.deadline !== null && job.deadline !== undefined)
      integer(job.deadline, 0, LIMITS.deadline, `${job.id} deadline`);
  }
  return true;
}
export function simulate(jobs, strategy = "fcfs", quantum = 3) {
  validate(jobs, strategy, quantum);
  const states = jobs.map((job, rank) => ({
    ...job,
    rank,
    remaining: job.burst,
    start: null,
    completion: null,
  }));
  const timeline = [];
  let time = 0,
    done = 0,
    current = null,
    slice = 0;
  const queue = [];
  const addSegment = (id) => {
    const last = timeline.at(-1);
    if (last && last.id === id && last.end === time) last.end++;
    else timeline.push({ id, start: time, end: time + 1 });
  };
  const tie = (a, b) => a.arrival - b.arrival || a.rank - b.rank;
  const priority = (job) =>
    strategy === "srtf"
      ? job.remaining
      : strategy === "edf"
        ? (job.deadline ?? Infinity)
        : job.deadline == null
          ? Infinity
          : job.deadline - time - job.remaining;
  while (done < states.length) {
    if (strategy === "rr") {
      states.filter((j) => j.arrival === time).forEach((j) => queue.push(j));
      // Boundary arrivals enter before the job that exhausted its quantum.
      if (current && slice === quantum) {
        queue.push(current);
        current = null;
      }
      if (!current) {
        current = queue.shift() ?? null;
        slice = 0;
      }
    } else {
      const ready = states.filter((j) => j.arrival <= time && j.remaining > 0);
      if (!current || !["fcfs", "sjf"].includes(strategy)) {
        current =
          ready.sort((a, b) =>
            strategy === "fcfs"
              ? tie(a, b)
              : strategy === "sjf"
                ? a.burst - b.burst || tie(a, b)
                : priority(a) - priority(b) || tie(a, b),
          )[0] ?? null;
      }
    }
    addSegment(current?.id ?? null);
    if (current) {
      if (current.start === null) current.start = time;
      current.remaining--;
      slice++;
      if (current.remaining === 0) {
        current.completion = time + 1;
        done++;
        current = null;
      }
    }
    time++;
  }
  const results = states.map((j) => ({
    id: j.id,
    arrival: j.arrival,
    burst: j.burst,
    deadline: j.deadline ?? null,
    start: j.start,
    completion: j.completion,
    turnaround: j.completion - j.arrival,
    waiting: j.completion - j.arrival - j.burst,
    response: j.start - j.arrival,
    tardiness:
      j.deadline == null ? null : Math.max(0, j.completion - j.deadline),
  }));
  const avg = (key) =>
    results.length
      ? results.reduce((sum, j) => sum + j[key], 0) / results.length
      : 0;
  const busy = jobs.reduce((sum, j) => sum + j.burst, 0);
  const switches = timeline.reduce(
    (n, s, i) =>
      n + (i > 0 && s.id !== null && timeline[i - 1].id !== null ? 1 : 0),
    0,
  );
  return {
    strategy,
    quantum,
    timeline,
    jobs: results,
    makespan: time,
    metrics: {
      waiting: avg("waiting"),
      turnaround: avg("turnaround"),
      response: avg("response"),
      switches,
      deadlineMisses: results.filter((j) => j.tardiness > 0).length,
      deadlineCount: results.filter((j) => j.deadline !== null).length,
      utilization: time ? (busy / time) * 100 : 0,
    },
  };
}
/** Unique multiset permutations; six items bound exhaustive exploration to 720. */
export function permutations(values) {
  if (values.length > 6)
    throw new Error("Permutation exploration supports up to six jobs.");
  const result = [];
  function visit(prefix, rest) {
    if (!rest.length) {
      result.push(prefix);
      return;
    }
    const seen = new Set();
    rest.forEach((value, i) => {
      if (seen.has(value)) return;
      seen.add(value);
      visit([...prefix, value], [...rest.slice(0, i), ...rest.slice(i + 1)]);
    });
  }
  visit([], values);
  return result;
}
export function explore(jobs, strategy, quantum, mode = "order") {
  validate(jobs, strategy, quantum);
  if (!["order", "arrival"].includes(mode))
    throw new Error("Choose queue order or arrival assignment.");
  const variants = permutations(
    mode === "order" ? jobs.map((j) => j.id) : jobs.map((j) => j.arrival),
  );
  return variants
    .map((values) => {
      const candidate =
        mode === "order"
          ? values.map((id) => ({ ...jobs.find((j) => j.id === id) }))
          : jobs.map((j, i) => ({ ...j, arrival: values[i] }));
      return {
        jobs: candidate,
        label: values.join(" → "),
        result: simulate(candidate, strategy, quantum),
      };
    })
    .sort(
      (a, b) =>
        a.result.metrics.waiting - b.result.metrics.waiting ||
        a.label.localeCompare(b.label),
    );
}
