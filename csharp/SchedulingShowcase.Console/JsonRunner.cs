using System.Text.Json;
using System.Text.Json.Serialization;
using SchedulingShowcase;

namespace SchedulingShowcase.ConsoleRunner;

internal static class JsonRunner
{
    private static readonly JsonSerializerOptions Options = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        UnmappedMemberHandling = JsonUnmappedMemberHandling.Disallow,
        RespectNullableAnnotations = true,
        WriteIndented = true
    };

    public static void Run(string path)
    {
        var fixtures = JsonSerializer.Deserialize<List<WorkloadInput>>(File.ReadAllText(path), Options)
            ?? throw new JsonException("Expected an array of workloads.");
        var names = new HashSet<string>(StringComparer.Ordinal);
        var output = new List<ParityOutput>();
        foreach (var fixture in fixtures)
        {
            if (fixture is null || string.IsNullOrWhiteSpace(fixture.CaseId) || !names.Add(fixture.CaseId))
                throw new JsonException("Every workload needs a unique nonempty caseId.");
            if (fixture.Jobs is null || fixture.Jobs.Any(job => job is null))
                throw new JsonException("Jobs must be an array of job objects.");
            var jobs = fixture.Jobs.Select((job, rank) =>
                new ProcessDefinition(rank, job.Id, job.Arrival, job.Burst, job.Deadline)).ToArray();
            SchedulingValidation.Validate(jobs, fixture.Quantum);
            IReadOnlyList<string> strategies = fixture.Strategies ?? SchedulingRunner.StrategyIds;
            foreach (var strategy in strategies)
            {
                var result = SchedulingRunner.Schedule(strategy, jobs, fixture.Quantum);
                output.Add(new ParityOutput(fixture.CaseId, result.Strategy, result.Quantum,
                    result.Timeline, result.Jobs, result.Makespan, result.Metrics));
            }
        }
        Console.WriteLine(JsonSerializer.Serialize(output, Options));
    }

    private sealed record WorkloadInput
    {
        public required string CaseId { get; init; }
        public required List<JobInput> Jobs { get; init; }
        public int Quantum { get; init; } = 3;
        public List<string>? Strategies { get; init; }
    }

    private sealed record JobInput
    {
        public required string Id { get; init; }
        public required int Arrival { get; init; }
        public required int Burst { get; init; }
        public int? Deadline { get; init; }
    }

    private sealed record ParityOutput(string CaseId, string Strategy, int Quantum,
        IReadOnlyList<TimelineSegment> Timeline, IReadOnlyList<ProcessResult> Jobs,
        int Makespan, ScheduleMetrics Metrics);
}
