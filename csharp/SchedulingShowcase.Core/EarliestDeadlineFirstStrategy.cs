namespace SchedulingShowcase;

public sealed class EarliestDeadlineFirstStrategy : ISchedulingStrategy
{
    private readonly PreemptiveStrategy _inner = new(
        "edf",
        "EDF (earliest deadline first, preemptive)",
        (process, _) => process.Definition.Deadline is int deadline
            ? deadline
            : double.PositiveInfinity);
    public string Id => _inner.Id;
    public string Name => _inner.Name;
    public ScheduleResult Schedule(
        IReadOnlyList<ProcessDefinition> processes,
        int quantum = 3) =>
        _inner.Schedule(processes, quantum);
}
