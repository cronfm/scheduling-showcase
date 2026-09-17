namespace SchedulingShowcase;

public sealed class ShortestJobFirstStrategy : ISchedulingStrategy
{
    public string Id => "sjf";
    public string Name => "SJF (non-preemptive)";

    public ScheduleResult Schedule(IReadOnlyList<ProcessDefinition> processes, int quantum = 3)
    {
        var working = ProcessStateFactory.CreateWorkingSet(processes, quantum);
        var timeline = new TimelineBuilder();
        var time = 0;
        var finished = 0;

        while (finished < working.Count)
        {
            var ready = working.Where(process => !process.IsFinished && process.Definition.ReadyTime <= time).ToList();
            if (ready.Count == 0)
            {
                timeline.IdleUntil(working.Where(process => !process.IsFinished)
                    .Min(process => process.Definition.ReadyTime), ref time);
                continue;
            }
            var next = ready.OrderBy(process => process.Definition.ExecutionTime)
                .ThenBy(process => process.Definition.ReadyTime).ThenBy(process => process.Rank).First();
            timeline.Run(next, next.Remaining, ref time);
            finished++;
        }
        return ScheduleResultFactory.Create(Id, quantum, working, timeline, time);
    }
}
