namespace SchedulingShowcase;

public sealed class ShortestRemainingTimeStrategy : ISchedulingStrategy
{
    private readonly PreemptiveStrategy _inner = new(
        "srtf", "SRTF (preemptive, shortest remaining time first)", (process, _) => process.Remaining);
    public string Id => _inner.Id;
    public string Name => _inner.Name;
    public ScheduleResult Schedule(IReadOnlyList<ProcessDefinition> processes, int quantum = 3) =>
        _inner.Schedule(processes, quantum);
}
