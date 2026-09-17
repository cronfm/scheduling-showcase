namespace SchedulingShowcase;

public static class SchedulingRunner
{
    public static IReadOnlyList<string> StrategyIds { get; } = Array.AsReadOnly(new[] { "fcfs", "sjf", "srtf", "rr", "edf", "llf" });

    public static ISchedulingStrategy CreateStrategy(string strategy) => strategy switch
    {
        "fcfs" => new FirstComeFirstServedStrategy(),
        "sjf" => new ShortestJobFirstStrategy(),
        "srtf" => new ShortestRemainingTimeStrategy(),
        "rr" => new RoundRobinStrategy(),
        "edf" => new EarliestDeadlineFirstStrategy(),
        "llf" => new LeastLaxityFirstStrategy(),
        _ => throw new ArgumentException("Choose a supported strategy.", nameof(strategy))
    };

    public static ScheduleResult Schedule(string strategy, IReadOnlyList<ProcessDefinition> processes, int quantum = 3) =>
        CreateStrategy(strategy).Schedule(processes, quantum);

    public static IReadOnlyList<ScheduleResult> RunAllStrategies(IReadOnlyList<ProcessDefinition> processes, int quantum = 3) =>
        StrategyIds.Select(strategy => Schedule(strategy, processes, quantum)).ToArray();
}
