namespace SchedulingShowcase;

public static class Examples
{
    // The workload and quantum from the original C# lecture example.
    public static IReadOnlyList<ProcessDefinition> FcfsSjfBaseProcesses { get; } = Array.AsReadOnly(new ProcessDefinition[]
    {
        new(0, "P1", 0, 22, null),
        new(1, "P2", 0, 2, null),
        new(2, "P3", 0, 3, null),
        new(3, "P4", 0, 5, null),
        new(4, "P5", 0, 8, null)
    });

    public static IReadOnlyList<ProcessDefinition> SjfArrivalExample { get; } = Array.AsReadOnly(new ProcessDefinition[]
    {
        new(0, "P1", 0, 22, null),
        new(1, "P2", 0, 2, null),
        new(2, "P3", 4, 3, null),
        new(3, "P4", 4, 5, null),
        new(4, "P5", 4, 8, null)
    });
    public const int RoundRobinQuantum = 3;
}
