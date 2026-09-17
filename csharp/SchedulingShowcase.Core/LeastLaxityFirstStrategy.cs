namespace SchedulingShowcase;

public sealed class LeastLaxityFirstStrategy : ISchedulingStrategy
{
    private readonly PreemptiveStrategy _inner = new(
        "llf", "LLF (least laxity first, preemptive)",
        (process, time) => process.Definition.Deadline is int deadline
            ? deadline - time - process.Remaining : double.PositiveInfinity);
    public string Id => _inner.Id;
    public string Name => _inner.Name;
    public ScheduleResult Schedule(IReadOnlyList<ProcessDefinition> processes, int quantum = 3) =>
        _inner.Schedule(processes, quantum);
}
