import { STRATEGIES, simulate, validate, explore } from "./engine.js";
const $ = (id) => document.getElementById(id);
const clone = (value) => structuredClone(value);
const fmt = (value) =>
  Number.isInteger(value) ? String(value) : value.toFixed(2);
const color = (id) => `var(--${id.toLowerCase()})`;
const makeJobs = (rows) =>
  rows.map((r, i) => ({
    id: `P${i + 1}`,
    arrival: r[0],
    burst: r[1],
    deadline: r[2] ?? null,
  }));
const scenarios = {
  convoy: {
    name: "The convoy",
    icon: "↳",
    description:
      "One long job makes everyone wait. Can changing the order help?",
    jobs: makeJobs([
      [0, 12],
      [0, 2],
      [0, 1],
      [0, 3],
    ]),
    strategy: "fcfs",
  },
  preemption: {
    name: "Short-job takeover",
    icon: "↯",
    description: "Small jobs arrive while a long task is already running.",
    jobs: makeJobs([
      [0, 10],
      [2, 3],
      [3, 1],
      [5, 2],
    ]),
    strategy: "srtf",
  },
  deadlines: {
    name: "Beat the clock",
    icon: "◷",
    description:
      "A fast average does not guarantee everyone meets their deadline.",
    jobs: makeJobs([
      [0, 5, 12],
      [1, 3, 7],
      [2, 2, 5],
      [4, 1, 6],
    ]),
    strategy: "edf",
  },
  idle: {
    name: "Room to breathe",
    icon: "∿",
    description: "Quiet gaps, then overlapping arrivals. Look for idle time.",
    jobs: makeJobs([
      [2, 2, 5],
      [7, 3, 12],
      [8, 1, 10],
      [14, 2, 17],
    ]),
    strategy: "srtf",
  },
  quantum: {
    name: "Taking turns",
    icon: "⟳",
    description:
      "Smaller slices get everyone started sooner. Count the switches.",
    jobs: makeJobs([
      [0, 12],
      [0, 8],
      [0, 2],
      [0, 1],
    ]),
    strategy: "rr",
  },
};
let state = {
  jobs: clone(scenarios.convoy.jobs),
  strategy: "fcfs",
  quantum: 3,
  scenario: "convoy",
};
let result,
  comparisons,
  variants = [],
  timer = null,
  position = 0;
function notice(message) {
  $("notice").textContent = message;
  $("notice").hidden = !message;
}
function stop() {
  clearInterval(timer);
  timer = null;
  $("play").innerHTML = "▶ <span>Replay</span>";
  $("play").setAttribute("aria-label", "Play schedule");
}
function invalidate() {
  variants = [];
  $("permutation-results").className = "permutation-results";
  $("permutation-results").innerHTML =
    '<div class="empty-orbit" aria-hidden="true"><span>P1</span><span>P2</span><span>P3</span><span>P4</span></div><h3>Compare job permutations.</h3><p>Explore up to 720 permutations, ranked by average waiting.</p>';
}
function update(patch, { editor = true, clear = true } = {}) {
  const next = { ...state, ...patch };
  validate(next.jobs, next.strategy, next.quantum);
  state = clone(next);
  stop();
  notice("");
  comparisons = Object.keys(STRATEGIES).map((strategy) =>
    simulate(state.jobs, strategy, state.quantum),
  );
  result = comparisons.find((r) => r.strategy === state.strategy);
  position = result.makespan;
  if (editor) renderEditor();
  renderStrategies();
  renderResult();
  renderComparisons();
  if (clear) invalidate();
}
function renderEditor() {
  $("jobs").innerHTML = state.jobs
    .map(
      (job) =>
        `<tr><td><span class="job-token" style="--color:${color(job.id)}">${job.id}</span></td>${["arrival", "burst", "deadline"].map((field) => `<td><input type="number" aria-label="${job.id} ${field}" data-job="${job.id}" data-field="${field}" min="${field === "burst" ? 1 : 0}" max="${field === "arrival" ? 40 : field === "burst" ? 30 : 200}" step="1" value="${job[field] ?? ""}" placeholder="—"></td>`).join("")}<td><button class="remove-job" data-remove="${job.id}" aria-label="Remove ${job.id}" ${state.jobs.length === 1 ? "disabled" : ""}>×</button></td></tr>`,
    )
    .join("");
  renderEditorMetadata();
}
function renderEditorMetadata() {
  $("job-count").textContent = `${state.jobs.length} JOBS`;
  $("add-job").disabled = state.jobs.length >= 6;
  $("total-work").textContent =
    `${state.jobs.reduce((n, j) => n + j.burst, 0)} ticks`;
  $("scenario-description").textContent =
    scenarios[state.scenario]?.description ??
    "Custom workload. Edit arrivals, burst lengths, or deadlines to recalculate.";
  document
    .querySelectorAll("[data-scenario]")
    .forEach((button) =>
      button.setAttribute(
        "aria-pressed",
        button.dataset.scenario === state.scenario,
      ),
    );
}
function renderStrategies() {
  $("strategies").innerHTML = Object.entries(STRATEGIES)
    .map(
      ([id, s]) =>
        `<button data-strategy="${id}" aria-pressed="${id === state.strategy}" title="${s.name}">${s.short}</button>`,
    )
    .join("");
  const strategy = STRATEGIES[state.strategy];
  $("strategy-type").textContent = strategy.type;
  $("strategy-description").textContent = strategy.description;
  $("quantum-control").hidden = state.strategy !== "rr";
  $("quantum").value = state.quantum;
}
function miniTimeline(r) {
  return `<div class="mini-timeline" role="img" aria-label="${STRATEGIES[r.strategy].short} schedule, ${r.makespan} ticks">${r.timeline
    .filter((s) => s.id)
    .map(
      (s) =>
        `<span style="--color:${color(s.id)};left:${(s.start / r.makespan) * 100}%;width:${((s.end - s.start) / r.makespan) * 100}%" title="${s.id}: ${s.start}–${s.end}"></span>`,
    )
    .join("")}</div>`;
}
function renderResult() {
  const total = result.makespan;
  $("timeline-title").textContent = STRATEGIES[state.strategy].name;
  const axis = Array.from({ length: 6 }, (_, i) => Math.round((total * i) / 5));
  $("timeline").innerHTML =
    `<div class="axis">${[...new Set(axis)].map((t) => `<span style="left:${(t / total) * 100}%">${t}</span>`).join("")}</div>${result.jobs
      .map(
        (job) =>
          `<div class="lane"><span class="lane-label">${job.id}</span><div class="lane-track"><div class="waiting" style="left:${(job.arrival / total) * 100}%;width:${((job.completion - job.arrival) / total) * 100}%"></div>${result.timeline
            .filter((s) => s.id === job.id)
            .map(
              (s) =>
                `<div class="segment" data-start="${s.start}" data-end="${s.end}" style="--color:${color(job.id)};left:${(s.start / total) * 100}%;width:${((s.end - s.start) / total) * 100}%" title="${job.id} runs from ${s.start} to ${s.end}">${s.end - s.start > 1 ? s.end - s.start : ""}</div>`,
            )
            .join(
              "",
            )}${job.deadline !== null && job.deadline <= total ? `<span class="deadline-line" style="left:${(job.deadline / total) * 100}%" title="${job.id} deadline: ${job.deadline}"></span>` : ""}<span class="cursor"></span></div></div>`,
      )
      .join("")}`;
  $("scrubber").max = total;
  const m = result.metrics;
  $("metrics").innerHTML = [
    ["Avg. waiting", fmt(m.waiting), "ticks"],
    ["Avg. response", fmt(m.response), "ticks"],
    ["Turnaround", fmt(m.turnaround), "ticks"],
    ["Deadlines missed", `${m.deadlineMisses}/${m.deadlineCount}`, "jobs"],
  ]
    .map(
      ([label, value, unit]) =>
        `<div class="metric"><span>${label}</span><strong>${value}<small>${unit}</small></strong></div>`,
    )
    .join("");
  $("job-results").innerHTML = result.jobs
    .map(
      (j) =>
        `<tr><td><span class="job-token" style="--color:${color(j.id)}">${j.id}</span></td>${["start", "completion", "waiting", "turnaround", "response", "tardiness"].map((key) => `<td>${j[key] === null ? "—" : j[key]}</td>`).join("")}</tr>`,
    )
    .join("");
  renderPlayback();
}
function renderPlayback() {
  $("clock").textContent = `t = ${position} / ${result.makespan}`;
  $("scrubber").value = position;
  const active = result.timeline.find(
    (s) => s.start <= position && position < s.end,
  );
  $("running-job").textContent =
    position >= result.makespan ? "DONE" : (active?.id ?? "IDLE");
  document.querySelectorAll(".cursor").forEach((c) => {
    c.style.left = `${(position / result.makespan) * 100}%`;
    c.style.display = position === result.makespan ? "none" : "block";
  });
  document
    .querySelectorAll(".segment")
    .forEach((s) =>
      s.classList.toggle(
        "future",
        Number(s.dataset.start) >= position && position < result.makespan,
      ),
    );
  $("step").disabled = position >= result.makespan;
}
function renderComparisons() {
  const bestWait = Math.min(...comparisons.map((r) => r.metrics.waiting)),
    bestResponse = Math.min(...comparisons.map((r) => r.metrics.response));
  $("comparisons").innerHTML = comparisons
    .map(
      (r) =>
        `<tr class="${r.strategy === state.strategy ? "selected" : ""}"><td><button class="comparison-name" data-compare="${r.strategy}" aria-label="Select ${STRATEGIES[r.strategy].name}"><strong>${STRATEGIES[r.strategy].short}</strong><span>${STRATEGIES[r.strategy].type}</span></button></td><td>${miniTimeline(r)}</td><td class="${r.metrics.waiting === bestWait ? "best" : ""}">${fmt(r.metrics.waiting)}${r.metrics.waiting === bestWait ? '<span class="best-tag">BEST</span>' : ""}</td><td class="${r.metrics.response === bestResponse ? "best" : ""}">${fmt(r.metrics.response)}</td><td>${r.metrics.deadlineCount ? `${r.metrics.deadlineMisses} / ${r.metrics.deadlineCount}` : "—"}</td><td>${r.metrics.switches}</td></tr>`,
    )
    .join("");
}
function runExplore() {
  variants = explore(
    state.jobs,
    state.strategy,
    state.quantum,
    $("permutation-mode").value,
  );
  const best = variants[0].result.metrics.waiting,
    worst = variants.at(-1).result.metrics.waiting;
  const bins = Array(16).fill(0);
  variants.forEach(
    (v) =>
      bins[
        worst === best
          ? 0
          : Math.min(
              15,
              Math.floor(
                ((v.result.metrics.waiting - best) / (worst - best)) * 16,
              ),
            )
      ]++,
  );
  const shown = [...new Set([0, 1, 2, variants.length - 1])].filter(
    (i) => i < variants.length,
  );
  $("permutation-results").className = "permutation-results populated";
  $("permutation-results").innerHTML =
    `<div class="permutation-stats"><div><strong>${variants.length}</strong><span>unique permutations</span></div><div><strong>${fmt(best)}</strong><span>best avg. waiting</span></div><div><strong>${fmt(worst)}</strong><span>worst avg. waiting</span></div></div><div class="distribution" role="img" aria-label="Distribution of average waiting from ${fmt(best)} to ${fmt(worst)} ticks">${bins.map((n) => `<div style="height:${Math.max(4, (n / Math.max(...bins)) * 100)}%" title="${n} permutations"></div>`).join("")}</div><div class="results-caption">${best === worst ? "Every permutation ties. Try another strategy or change arrival times." : `Order changes average waiting by up to ${fmt(worst - best)} ticks.`} · ${STRATEGIES[state.strategy].short}</div>${shown.map((i) => `<div class="variant"><span class="rank">${i === variants.length - 1 && i > 2 ? "LAST" : "#" + (i + 1)}</span><span class="variant-order">${variants[i].label}</span><strong>${fmt(variants[i].result.metrics.waiting)}</strong><button data-apply="${i}" aria-label="Apply permutation ${i + 1}">Try it ↗</button></div>`).join("")}<p class="results-caption">${$("permutation-mode").value === "arrival" ? `Arrival values map to ${state.jobs.map((j) => j.id).join(", ")}.` : "Shown in queue / tie order."} Ranked by average waiting; tied values sort by sequence.</p>`;
  return { count: variants.length, bestWaiting: best, worstWaiting: worst };
}
function loadScenario(id) {
  if (!scenarios[id]) throw new Error("Unknown scenario.");
  update({
    scenario: id,
    jobs: clone(scenarios[id].jobs),
    strategy: scenarios[id].strategy,
    quantum: 3,
  });
}
$("scenarios").innerHTML = Object.entries(scenarios)
  .map(
    ([id, s]) =>
      `<button data-scenario="${id}" aria-pressed="false">${s.icon} ${s.name}</button>`,
  )
  .join("");
$("scenarios").addEventListener("click", (e) => {
  const id = e.target.closest("[data-scenario]")?.dataset.scenario;
  if (id) loadScenario(id);
});
$("strategies").addEventListener("click", (e) => {
  const strategy = e.target.closest("[data-strategy]")?.dataset.strategy;
  if (strategy) update({ strategy }, { editor: false });
});
$("comparisons").addEventListener("click", (e) => {
  const strategy = e.target.closest("[data-compare]")?.dataset.compare;
  if (strategy) update({ strategy }, { editor: false });
});
function editJob(e) {
  const input = e.target;
  if (!input.dataset.field) return;
  const jobs = clone(state.jobs);
  const job = jobs.find((j) => j.id === input.dataset.job);
  job[input.dataset.field] =
    input.value === "" && input.dataset.field === "deadline"
      ? null
      : input.value === ""
        ? NaN
        : Number(input.value);
  try {
    update({ jobs, scenario: null }, { editor: false });
    renderEditorMetadata();
    input.removeAttribute("aria-invalid");
  } catch (error) {
    notice(error.message);
    input.setAttribute("aria-invalid", "true");
    if (e.type === "change") {
      input.value =
        state.jobs.find((j) => j.id === job.id)[input.dataset.field] ?? "";
      input.removeAttribute("aria-invalid");
    }
  }
}
$("jobs").addEventListener("input", editJob);
$("jobs").addEventListener("change", editJob);
$("jobs").addEventListener("click", (e) => {
  const id = e.target.closest("[data-remove]")?.dataset.remove;
  if (id && state.jobs.length > 1)
    update({ jobs: state.jobs.filter((j) => j.id !== id), scenario: null });
});
$("add-job").addEventListener("click", () => {
  const id = Array.from({ length: 6 }, (_, i) => `P${i + 1}`).find(
    (id) => !state.jobs.some((j) => j.id === id),
  );
  if (id)
    update({
      jobs: [...state.jobs, { id, arrival: 0, burst: 3, deadline: null }],
      scenario: null,
    });
});
$("reset").addEventListener("click", () =>
  loadScenario(state.scenario ?? "convoy"),
);
$("randomize").addEventListener("click", () =>
  update({
    scenario: null,
    jobs: makeJobs(
      Array.from({ length: 4 + Math.floor(Math.random() * 3) }, () => [
        Math.floor(Math.random() * 9),
        1 + Math.floor(Math.random() * 12),
        Math.random() > 0.35 ? 10 + Math.floor(Math.random() * 25) : null,
      ]),
    ),
  }),
);
function editQuantum(e) {
  try {
    update({ quantum: Number(e.target.value) }, { editor: false });
  } catch (error) {
    notice(error.message);
    if (e.type === "change") e.target.value = state.quantum;
  }
}
$("quantum").addEventListener("input", editQuantum);
$("quantum").addEventListener("change", editQuantum);
$("play").addEventListener("click", () => {
  if (timer) {
    stop();
    return;
  }
  if (position >= result.makespan) position = 0;
  renderPlayback();
  $("play").innerHTML = "Ⅱ <span>Pause</span>";
  $("play").setAttribute("aria-label", "Pause schedule");
  timer = setInterval(() => {
    position++;
    renderPlayback();
    if (position >= result.makespan) stop();
  }, 350);
});
$("step").addEventListener("click", () => {
  stop();
  position = Math.min(result.makespan, position + 1);
  renderPlayback();
});
$("scrubber").addEventListener("input", (e) => {
  stop();
  position = Number(e.target.value);
  renderPlayback();
});
$("explore").addEventListener("click", runExplore);
$("permutation-mode").addEventListener("change", () => {
  invalidate();
  $("permutation-help").textContent =
    $("permutation-mode").value === "order"
      ? "Reorder the jobs to change simultaneous-arrival and priority ties. Arrival times stay with each job."
      : "Redistribute the existing arrival times among jobs. Burst lengths, deadlines, and tie order stay fixed.";
});
$("permutation-results").addEventListener("click", (e) => {
  const index = e.target.closest("[data-apply]")?.dataset.apply;
  if (index !== undefined) {
    const jobs = clone(variants[Number(index)].jobs);
    update({ jobs, scenario: null }, { clear: false });
    notice(
      "Permutation applied. The timeline and all strategy comparisons have updated.",
    );
  }
});
$("share").addEventListener("click", async () => {
  const url = new URL(location.href);
  url.hash =
    "experiment=" +
    encodeURIComponent(
      JSON.stringify({
        jobs: state.jobs,
        strategy: state.strategy,
        quantum: state.quantum,
      }),
    );
  try {
    await navigator.clipboard.writeText(url.href);
    $("share").textContent = "Experiment link copied ✓";
    setTimeout(() => ($("share").textContent = "Copy experiment link ↗"), 2500);
  } catch {
    location.hash = url.hash;
    notice("Your experiment is in the address bar. Copy the URL to share it.");
  }
});
function restore() {
  if (!location.hash.startsWith("#experiment=")) return;
  try {
    if (location.hash.length > 4000) throw new Error("Link too long");
    const saved = JSON.parse(decodeURIComponent(location.hash.slice(12)));
    if (!saved.jobs?.length) throw new Error("No jobs");
    validate(saved.jobs, saved.strategy, saved.quantum);
    state = {
      jobs: saved.jobs,
      strategy: saved.strategy,
      quantum: saved.quantum,
      scenario: null,
    };
  } catch {
    state = {
      jobs: clone(scenarios.convoy.jobs),
      strategy: "fcfs",
      quantum: 3,
      scenario: "convoy",
    };
    notice("This experiment link is invalid. Loaded The convoy instead.");
  }
}
restore();
const initialNotice = $("notice").textContent;
update(state);
if (initialNotice) notice(initialNotice);
addEventListener("hashchange", () => {
  notice("");
  restore();
  const message = $("notice").textContent;
  update(state);
  if (message) notice(message);
});
// Optional WebMCP: tools use the same validated state and rendering path as the UI.
const context = document.modelContext;
if (context?.registerTool) {
  const lifecycle = new AbortController();
  const register = (tool) => {
    try {
      Promise.resolve(
        context.registerTool(tool, { signal: lifecycle.signal }),
      ).catch(() => {});
    } catch {}
  };
  register({
    name: "read_schedule",
    title: "Read schedule",
    description: "Read the current workload, strategy, timeline and metrics.",
    inputSchema: {
      type: "object",
      properties: {},
      additionalProperties: false,
    },
    annotations: { readOnlyHint: true, untrustedContentHint: false },
    execute: () => clone({ state, result }),
  });
  register({
    name: "configure_schedule",
    title: "Configure schedule",
    description:
      "Replace the visible workload and choose a strategy. Runs all comparisons immediately.",
    inputSchema: {
      type: "object",
      properties: {
        jobs: {
          type: "array",
          minItems: 1,
          maxItems: 6,
          items: {
            type: "object",
            properties: {
              id: {
                type: "string",
                enum: ["P1", "P2", "P3", "P4", "P5", "P6"],
              },
              arrival: { type: "integer", minimum: 0, maximum: 40 },
              burst: { type: "integer", minimum: 1, maximum: 30 },
              deadline: { type: ["integer", "null"], minimum: 0, maximum: 200 },
            },
            required: ["id", "arrival", "burst"],
            additionalProperties: false,
          },
        },
        strategy: { type: "string", enum: Object.keys(STRATEGIES) },
        quantum: { type: "integer", minimum: 1, maximum: 20 },
      },
      required: ["jobs", "strategy", "quantum"],
      additionalProperties: false,
    },
    annotations: { readOnlyHint: false, untrustedContentHint: false },
    execute: (input) => {
      if (!input || !Array.isArray(input.jobs) || !input.jobs.length)
        throw new Error("Provide one to six jobs.");
      update({
        jobs: input.jobs,
        strategy: input.strategy,
        quantum: input.quantum,
        scenario: null,
      });
      return clone(result.metrics);
    },
  });
  register({
    name: "explore_schedule_permutations",
    title: "Explore schedule permutations",
    description:
      "Explore queue order or arrival assignment permutations and display ranked results. Does not apply a permutation.",
    inputSchema: {
      type: "object",
      properties: { mode: { type: "string", enum: ["order", "arrival"] } },
      required: ["mode"],
      additionalProperties: false,
    },
    annotations: { readOnlyHint: false, untrustedContentHint: false },
    execute: (input) => {
      if (!["order", "arrival"].includes(input?.mode))
        throw new Error("Invalid permutation mode.");
      $("permutation-mode").value = input.mode;
      $("permutation-mode").dispatchEvent(new Event("change"));
      return runExplore();
    },
  });
  addEventListener("pagehide", () => lifecycle.abort(), { once: true });
}
