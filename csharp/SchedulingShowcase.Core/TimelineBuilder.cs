namespace SchedulingShowcase;

internal sealed class TimelineBuilder
{
    private readonly List<TimelineSegment> _segments = [];
    public IReadOnlyList<TimelineSegment> Segments => _segments;

    public void Run(ProcessState process, int duration, ref int time)
    {
        if (process.StartTime < 0) process.StartTime = time;
        Append(process.Definition.Name, time, time + duration);
        process.Remaining -= duration;
        time += duration;
        if (process.Remaining == 0) process.CompletionTime = time;
    }

    public void IdleUntil(int nextReadyTime, ref int time)
    {
        if (nextReadyTime <= time) return;
        Append(null, time, nextReadyTime);
        time = nextReadyTime;
    }

    private void Append(string? id, int start, int end)
    {
        if (_segments.Count > 0 && _segments[^1].Id == id && _segments[^1].End == start)
            _segments[^1] = _segments[^1] with { End = end };
        else
            _segments.Add(new TimelineSegment(id, start, end));
    }
}
