using SchedulingShowcase;

namespace SchedulingShowcase.Tests;

internal static class Program
{
    private static readonly ProcessDefinition[] AuditJobs =
    [
        new(0, "P1", 0, 5, 8), new(1, "P2", 1, 3, 5), new(2, "P3", 2, 1, 3)
    ];

    private static int Main()
    {
        var tests = new List<(string Name, Action Run)>();
        foreach (var example in new (string Strategy, string Ticks, int[] Completion, int[] Waiting)[]
        {
            ("fcfs", "111112223", [5, 8, 9], [0, 4, 6]),
            ("sjf", "111113222", [5, 9, 6], [0, 5, 3]),
            ("srtf", "123221111", [9, 5, 3], [4, 1, 0]),
            ("rr", "112231121", [9, 8, 5], [4, 4, 2]),
            ("edf", "123221111", [9, 5, 3], [4, 1, 0]),
            ("llf", "123212111", [9, 6, 3], [4, 2, 0])
        })
        {
            tests.Add(($"{example.Strategy}: hand-worked schedule and metrics", () =>
            {
                var result = SchedulingRunner.Schedule(example.Strategy, AuditJobs, 2);
                Equal(example.Ticks, Ticks(result));
                Sequence(example.Completion, result.Jobs.Select(job => job.Completion));
                Sequence(example.Waiting, result.Jobs.Select(job => job.Waiting));
                foreach (var job in result.Jobs) Equal(job.Turnaround, job.Waiting + job.Burst);
            }));
        }

        tests.Add(("Round Robin admits boundary arrivals before requeue", () =>
        {
            var result = SchedulingRunner.Schedule("rr", [new(0, "P1", 0, 4, null), new(1, "P2", 2, 1, null)], 2);
            Equal("11211", Ticks(result));
            Sequence([5, 3], result.Jobs.Select(job => job.Completion));
        }));
        tests.Add(("SRTF tie retains earlier arrival", () =>
            Equal("11122", Ticks(SchedulingRunner.Schedule("srtf",
                [new(0, "P1", 0, 3, null), new(1, "P2", 1, 2, null)])))));
        tests.Add(("EDF and LLF absent deadlines follow current list order", () =>
        {
            foreach (var strategy in new[] { "edf", "llf" })
                Equal("1122222", Ticks(SchedulingRunner.Schedule(strategy,
                    [new(9, "P1", 0, 2, null), new(1, "P2", 0, 5, null)])));
        }));
        tests.Add(("Finite deadlines outrank absent deadlines", () =>
        {
            foreach (var strategy in new[] { "edf", "llf" })
                Equal("1211", Ticks(SchedulingRunner.Schedule(strategy,
                    [new(0, "P1", 0, 3, null), new(1, "P2", 1, 1, 3)])));
        }));
        tests.Add(("Idle segments, utilization, and exact deadline", () =>
        {
            foreach (var strategy in SchedulingRunner.StrategyIds)
            {
                var result = SchedulingRunner.Schedule(strategy,
                    [new(0, "P1", 3, 1, null), new(1, "P2", 5, 2, 7)], 2);
                Equal("...1.22", Ticks(result));
                Close(0, result.Metrics.Waiting);
                Close(3d / 7 * 100, result.Metrics.Utilization);
                Equal(0, result.Metrics.DeadlineMisses);
                Equal(1, result.Metrics.DeadlineCount);
                Equal(0, result.Metrics.Switches);
            }
        }));
        tests.Add(("Permutation counts, unique arrivals, and current-list rank", () =>
        {
            Equal(120, PermutationHelper.Permute(new[] { 1, 2, 3, 4, 5 }).Count());
            Equal(10, PermutationHelper.Permute(new[] { 0, 0, 4, 4, 4 }).Count());
            Equal(1, PermutationHelper.Permute(Array.Empty<int>()).Count());
            ProcessDefinition[] convoy =
            [new(0, "P1", 0, 12, null), new(1, "P2", 0, 2, null), new(2, "P3", 0, 1, null), new(3, "P4", 0, 3, null)];
            var ranked = PermutationExplorer.Explore(convoy, "fcfs");
            Equal(24, ranked.Count);
            Close(2.5, ranked[0].Result.Metrics.Waiting);
            Close(11, ranked[^1].Result.Metrics.Waiting);
            Equal(1, PermutationExplorer.Explore(convoy, "fcfs", mode: "arrival").Count);
            Throws(() => PermutationHelper.Permute(new[] { 1, 2, 3, 4, 5, 6, 7 }));
        }));
        tests.Add(("Invalid inputs fail and empty workloads stay finite", () =>
        {
            foreach (var burst in new[] { -1, 0, 31 })
                Throws(() => SchedulingRunner.Schedule("fcfs", [AuditJobs[0] with { ExecutionTime = burst }]));
            foreach (var arrival in new[] { -1, 41 })
                Throws(() => SchedulingRunner.Schedule("fcfs", [AuditJobs[0] with { ReadyTime = arrival }]));
            foreach (var deadline in new[] { -1, 201 })
                Throws(() => SchedulingRunner.Schedule("edf", [AuditJobs[0] with { Deadline = deadline }]));
            Throws(() => SchedulingRunner.Schedule("rr", AuditJobs, 0));
            Throws(() => SchedulingRunner.Schedule("rr", AuditJobs, 21));
            Throws(() => SchedulingRunner.Schedule("unknown", AuditJobs));
            Throws(() => SchedulingRunner.Schedule("fcfs", [AuditJobs[0], AuditJobs[0]]));
            Throws(() => SchedulingRunner.Schedule("fcfs", [null!]));
            Throws(() => SchedulingRunner.Schedule("fcfs", [AuditJobs[0] with { Name = "<script>" }]));
            Throws(() => SchedulingRunner.Schedule("fcfs", Enumerable.Repeat(AuditJobs[0], 7).ToArray()));
            foreach (var strategy in SchedulingRunner.StrategyIds)
            {
                var empty = SchedulingRunner.Schedule(strategy, []);
                Equal(0, empty.Makespan);
                Equal(0, empty.Timeline.Count);
                Close(0, empty.Metrics.Waiting);
                Close(0, empty.Metrics.Response);
                Close(0, empty.Metrics.Utilization);
            }
        }));
        tests.Add(("Inputs remain unchanged across strategies and permutations", () =>
        {
            var before = AuditJobs.ToArray();
            foreach (var strategy in SchedulingRunner.StrategyIds)
            {
                _ = SchedulingRunner.Schedule(strategy, AuditJobs);
                _ = PermutationExplorer.Explore(AuditJobs, strategy);
                _ = PermutationExplorer.Explore(AuditJobs, strategy, mode: "arrival");
            }
            Sequence(before, AuditJobs);
        }));
        tests.Add(("200 deterministic workloads × six strategies preserve invariants", RandomInvariants));

        var failures = 0;
        foreach (var (name, run) in tests)
        {
            try { run(); Console.WriteLine($"PASS {name}"); }
            catch (Exception error) { failures++; Console.Error.WriteLine($"FAIL {name}\n{error}"); }
        }
        Console.WriteLine($"{tests.Count - failures}/{tests.Count} tests passed.");
        return failures == 0 ? 0 : 1;
    }

    private static void RandomInvariants()
    {
        var random = new Random(20260917);
        for (var trial = 0; trial < 200; trial++)
        {
            var jobs = Enumerable.Range(0, random.Next(1, 7)).Select(index => new ProcessDefinition(
                index, $"P{index + 1}", random.Next(0, 41), random.Next(1, 31),
                random.Next(3) == 0 ? null : random.Next(0, 201))).ToArray();
            var quantum = random.Next(1, 21);
            foreach (var strategy in SchedulingRunner.StrategyIds)
            {
                var result = SchedulingRunner.Schedule(strategy, jobs, quantum);
                var end = 0;
                foreach (var segment in result.Timeline)
                {
                    Equal(end, segment.Start);
                    True(segment.End > segment.Start, "Timeline segments must have positive length.");
                    end = segment.End;
                }
                Equal(end, result.Makespan);
                foreach (var job in result.Jobs)
                {
                    Equal(job.Burst, result.Timeline.Where(segment => segment.Id == job.Id).Sum(segment => segment.End - segment.Start));
                    True(job.Start >= job.Arrival, "Jobs must not run before arriving.");
                    True(job.Waiting >= 0 && job.Response >= 0 && job.Response <= job.Waiting, "Waiting/response invariants.");
                    Equal(job.Turnaround, job.Waiting + job.Burst);
                    Equal(job.Completion, result.Timeline.Last(segment => segment.Id == job.Id).End);
                }
            }
        }
    }

    private static string Ticks(ScheduleResult result) => string.Concat(result.Timeline.Select(segment =>
        new string(segment.Id is null ? '.' : segment.Id[1], segment.End - segment.Start)));
    private static void Equal<T>(T expected, T actual)
    {
        if (!EqualityComparer<T>.Default.Equals(expected, actual)) throw new Exception($"Expected {expected}, got {actual}.");
    }
    private static void Sequence<T>(IEnumerable<T> expected, IEnumerable<T> actual)
    {
        if (!expected.SequenceEqual(actual)) throw new Exception("Sequences differ.");
    }
    private static void Close(double expected, double actual)
    {
        if (!double.IsFinite(actual) || Math.Abs(expected - actual) > 1e-10) throw new Exception($"Expected {expected}, got {actual}.");
    }
    private static void True(bool condition, string message)
    {
        if (!condition) throw new Exception(message);
    }
    private static void Throws(Action action)
    {
        try { action(); }
        catch (ArgumentException) { return; }
        throw new Exception("Expected an argument exception.");
    }
}
