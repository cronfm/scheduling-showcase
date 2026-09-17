namespace SchedulingShowcase;

public sealed class FirstComeFirstServedStrategy : ISchedulingStrategy
{
    public string Id => "fcfs";
    public string Name => "FCFS (non-preemptive)";

    public ScheduleResult Schedule(IReadOnlyList<ProcessDefinition> processes, int quantum = 3)
    {
        var working = ProcessStateFactory.CreateWorkingSet(processes, quantum);
        var ordered = working.OrderBy(process => process.Definition.ReadyTime)
            .ThenBy(process => process.Rank).ToList();
        var timeline = new TimelineBuilder();
        var time = 0;

        foreach (var process in ordered)
        {
            timeline.IdleUntil(process.Definition.ReadyTime, ref time);
            timeline.Run(process, process.Remaining, ref time);
        }
        return ScheduleResultFactory.Create(Id, quantum, working, timeline, time);
    }
}
