namespace SchedulingShowcase;

public sealed class RoundRobinStrategy : ISchedulingStrategy
{
    public string Id => "rr";
    public string Name => "Round Robin";

    public ScheduleResult Schedule(IReadOnlyList<ProcessDefinition> processes, int quantum = 3)
    {
        var working = ProcessStateFactory.CreateWorkingSet(processes, quantum);
        var timeline = new TimelineBuilder();
        var time = 0;
        var finished = 0;
        var queue = new Queue<ProcessState>();
        // Includes the running job until it finishes, preventing duplicate admission.
        var admitted = new HashSet<string>(StringComparer.Ordinal);

        void EnqueueReady()
        {
            foreach (var process in working.Where(process => !process.IsFinished &&
                         process.Definition.ReadyTime <= time && admitted.Add(process.Definition.Name)))
                queue.Enqueue(process);
        }

        EnqueueReady();
        while (finished < working.Count)
        {
            if (queue.Count == 0)
            {
                timeline.IdleUntil(working.Where(process => !process.IsFinished)
                    .Min(process => process.Definition.ReadyTime), ref time);
                EnqueueReady();
                continue;
            }
            var current = queue.Dequeue();
            var slice = Math.Min(quantum, current.Remaining);
            for (var step = 0; step < slice; step++)
            {
                timeline.Run(current, 1, ref time);
                // Boundary arrivals are admitted before the current job is requeued.
                EnqueueReady();
                if (!current.IsFinished) continue;
                finished++;
                admitted.Remove(current.Definition.Name);
                break;
            }
            if (!current.IsFinished) queue.Enqueue(current);
        }
        return ScheduleResultFactory.Create(Id, quantum, working, timeline, time);
    }
}
