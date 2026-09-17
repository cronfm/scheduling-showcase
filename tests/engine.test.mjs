import test from "node:test";
import assert from "node:assert/strict";
import { simulate, explore, permutations, STRATEGIES } from "../dist/engine.js";
const jobs = [
  { id: "P1", arrival: 0, burst: 5, deadline: 8 },
  { id: "P2", arrival: 1, burst: 3, deadline: 5 },
  { id: "P3", arrival: 2, burst: 1, deadline: 3 },
];
const ticks = (r) =>
  r.timeline
    .map((s) => (s.id?.slice(1) ?? ".").repeat(s.end - s.start))
    .join("");
const expected = {
  fcfs: ["111112223", [5, 8, 9], [0, 4, 6]],
  sjf: ["111113222", [5, 9, 6], [0, 5, 3]],
  srtf: ["123221111", [9, 5, 3], [4, 1, 0]],
  edf: ["123221111", [9, 5, 3], [4, 1, 0]],
  llf: ["123212111", [9, 6, 3], [4, 2, 0]],
  rr: ["112231121", [9, 8, 5], [4, 4, 2]],
};
for (const [strategy, [timeline, completion, waiting]] of Object.entries(
  expected,
))
  test(`${strategy}: known timeline, completions and true waiting`, () => {
    const r = simulate(jobs, strategy, 2);
    assert.equal(ticks(r), timeline);
    assert.deepEqual(
      r.jobs.map((j) => j.completion),
      completion,
    );
    assert.deepEqual(
      r.jobs.map((j) => j.waiting),
      waiting,
    );
    for (const j of r.jobs) assert.equal(j.turnaround, j.waiting + j.burst);
  });
test("Round Robin admits quantum-boundary arrivals before requeue", () => {
  const r = simulate(
    [
      { id: "P1", arrival: 0, burst: 4 },
      { id: "P2", arrival: 2, burst: 1 },
    ],
    "rr",
    2,
  );
  assert.equal(ticks(r), "11211");
  assert.deepEqual(
    r.jobs.map((j) => j.response),
    [0, 0],
  );
});
test("SRTF equal-remaining tie keeps earlier arrival", () =>
  assert.equal(
    ticks(
      simulate(
        [
          { id: "P1", arrival: 0, burst: 3 },
          { id: "P2", arrival: 1, burst: 2 },
        ],
        "srtf",
      ),
    ),
    "11122",
  ));
test("No-deadline EDF and LLF use arrival/tie order", () => {
  for (const strategy of ["edf", "llf"])
    assert.equal(
      ticks(
        simulate(
          [
            { id: "P1", arrival: 0, burst: 2 },
            { id: "P2", arrival: 0, burst: 5 },
          ],
          strategy,
        ),
      ),
      "1122222",
    );
});
test("Idle segments, utilization, and exact deadlines", () => {
  for (const strategy of Object.keys(STRATEGIES)) {
    const r = simulate(
      [
        { id: "P1", arrival: 3, burst: 1 },
        { id: "P2", arrival: 5, burst: 2, deadline: 7 },
      ],
      strategy,
    );
    assert.equal(ticks(r), "...1.22");
    assert.equal(r.metrics.waiting, 0);
    assert.equal(r.metrics.deadlineMisses, 0);
    assert.equal(r.metrics.deadlineCount, 1);
    assert.equal(r.metrics.switches, 0);
    assert.equal(r.metrics.utilization, (3 / 7) * 100);
  }
});
test("Bounded unique permutations and queue rank effects", () => {
  assert.equal(permutations(["P1", "P2", "P3", "P4", "P5"]).length, 120);
  assert.equal(permutations([0, 0, 4, 4, 4]).length, 10);
  assert.deepEqual(permutations([]), [[]]);
  const convoy = [12, 2, 1, 3].map((burst, i) => ({
    id: `P${i + 1}`,
    arrival: 0,
    burst,
  }));
  const ranked = explore(convoy, "fcfs", 3);
  assert.equal(ranked.length, 24);
  assert.equal(ranked[0].result.metrics.waiting, 2.5);
  assert.equal(ranked.at(-1).result.metrics.waiting, 11);
  assert.equal(explore(convoy, "fcfs", 3, "arrival").length, 1);
  assert.throws(() => permutations([1, 2, 3, 4, 5, 6, 7]));
});
test("Input validation fails quickly without mutating input", () => {
  const frozen = jobs.map((j) => Object.freeze({ ...j }));
  Object.freeze(frozen);
  for (const strategy of Object.keys(STRATEGIES))
    assert.doesNotThrow(() => simulate(frozen, strategy));
  for (const burst of [0, -1, 1.5, Infinity, NaN, 31, "2"])
    assert.throws(() => simulate([{ ...jobs[0], burst }]));
  for (const arrival of [-1, 41, 0.5, NaN])
    assert.throws(() => simulate([{ ...jobs[0], arrival }]));
  assert.throws(() => simulate([jobs[0], jobs[0]]));
  assert.throws(() => simulate(Array(1)));
  assert.throws(() => simulate(jobs, "unknown"));
  assert.throws(() => simulate(jobs, "rr", 0));
  assert.throws(() => simulate([{ ...jobs[0], id: "<script>" }]));
  for (const strategy of Object.keys(STRATEGIES)) {
    const r = simulate([], strategy);
    assert.equal(r.makespan, 0);
    assert.deepEqual(r.timeline, []);
    assert.equal(r.metrics.waiting, 0);
  }
});
test("200 deterministic workloads preserve CPU work and metric invariants across six strategies", () => {
  let seed = 42;
  const rand = (max) => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed % max;
  };
  for (let trial = 0; trial < 200; trial++) {
    const workload = Array.from({ length: 1 + rand(6) }, (_, i) => ({
      id: `P${i + 1}`,
      arrival: rand(20),
      burst: 1 + rand(15),
      deadline: rand(2) ? rand(70) : null,
    }));
    for (const strategy of Object.keys(STRATEGIES)) {
      const r = simulate(workload, strategy, 1 + rand(8));
      let previousEnd = 0;
      for (const s of r.timeline) {
        assert.equal(s.start, previousEnd);
        assert.ok(s.end > s.start);
        previousEnd = s.end;
      }
      for (const j of r.jobs) {
        assert.equal(
          r.timeline
            .filter((s) => s.id === j.id)
            .reduce((n, s) => n + s.end - s.start, 0),
          j.burst,
        );
        assert.ok(j.start >= j.arrival);
        assert.ok(j.waiting >= 0);
        assert.ok(j.response >= 0 && j.response <= j.waiting);
        assert.equal(
          j.completion,
          r.timeline.filter((s) => s.id === j.id).at(-1).end,
        );
      }
      assert.equal(r.makespan, previousEnd);
    }
  }
});
