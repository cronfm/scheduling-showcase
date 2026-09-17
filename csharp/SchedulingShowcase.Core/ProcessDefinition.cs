namespace SchedulingShowcase;

// Original C# input shape retained. Index is metadata; current list order breaks ties.
public sealed record ProcessDefinition(
    int Index,
    string Name,
    int ReadyTime,
    int ExecutionTime,
    int? Deadline);
