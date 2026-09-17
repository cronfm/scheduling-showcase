namespace SchedulingShowcase;

internal sealed class PreemptiveStrategy(string id, string name, Func<ProcessState, int, double> priority)
    : ISchedulingStrategy
{
    private readonly Func<ProcessState, int, double> _priority = priority ?? throw new ArgumentNullException(nameof(priority));
    public string Id { get; } = id ?? throw new ArgumentNullException(nameof(id));
    public string Name { get; } = name ?? throw new ArgumentNullException(nameof(name));

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
            var current = ready.OrderBy(process => _priority(process, time))
                .ThenBy(process => process.Definition.ReadyTime).ThenBy(process => process.Rank).First();
            timeline.Run(current, 1, ref time);
            if (current.IsFinished) finished++;
        }
        return ScheduleResultFactory.Create(Id, quantum, working, timeline, time);
    }
}
