namespace SchedulingShowcase;

public interface ISchedulingStrategy
{
    string Id { get; }
    string Name { get; }
    ScheduleResult Schedule(
        IReadOnlyList<ProcessDefinition> processes,
        int quantum = 3);
}
