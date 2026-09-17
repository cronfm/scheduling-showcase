namespace SchedulingShowcase;

public sealed record TimelineSegment(string? Id, int Start, int End);

public sealed record ProcessResult(
    string Id,
    int Arrival,
    int Burst,
    int? Deadline,
    int Start,
    int Completion,
    int Turnaround,
    int Waiting,
    int Response,
    int? Tardiness);

public sealed record ScheduleMetrics(
    double Waiting,
    double Turnaround,
    double Response,
    int Switches,
    int DeadlineMisses,
    int DeadlineCount,
    double Utilization);

public sealed record ScheduleResult(
    string Strategy,
    int Quantum,
    IReadOnlyList<TimelineSegment> Timeline,
    IReadOnlyList<ProcessResult> Jobs,
    int Makespan,
    ScheduleMetrics Metrics);

internal static class ScheduleResultFactory
{
    public static ScheduleResult Create(
        string strategy,
        int quantum,
        IReadOnlyList<ProcessState> working,
        TimelineBuilder timeline,
        int time)
    {
        var jobs = working
            .Select(process => new ProcessResult(
                process.Definition.Name,
                process.Definition.ReadyTime,
                process.Definition.ExecutionTime,
                process.Definition.Deadline,
                process.StartTime,
                process.CompletionTime,
                process.TurnaroundTime,
                process.WaitingTime,
                process.ResponseTime,
                process.Definition.Deadline is int deadline
                    ? Math.Max(0, process.CompletionTime - deadline)
                    : null))
            .ToArray();
        var segments = timeline.Segments.ToArray();
        var switches = 0;
        for (var i = 1; i < segments.Length; i++)
            if (segments[i - 1].Id is not null && segments[i].Id is not null)
                switches++;

        double Average(Func<ProcessResult, int> select) =>
            jobs.Length == 0 ? 0 : jobs.Average(select);
        var metrics = new ScheduleMetrics(
            Average(job => job.Waiting),
            Average(job => job.Turnaround),
            Average(job => job.Response),
            switches,
            jobs.Count(job => job.Tardiness > 0),
            jobs.Count(job => job.Deadline is not null),
            time == 0 ? 0 : (double)jobs.Sum(job => job.Burst) / time * 100);
        return new ScheduleResult(strategy, quantum, segments, jobs, time, metrics);
    }
}
