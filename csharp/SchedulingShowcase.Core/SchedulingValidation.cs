namespace SchedulingShowcase;

public static class SchedulingValidation
{
    public const int MaximumJobs = 6;
    public const int MaximumArrival = 40;
    public const int MaximumBurst = 30;
    public const int MaximumDeadline = 200;
    public const int MaximumQuantum = 20;

    public static void Validate(IReadOnlyList<ProcessDefinition> processes, int quantum = 3)
    {
        ArgumentNullException.ThrowIfNull(processes);
        InRange(quantum, 1, MaximumQuantum, nameof(quantum));
        if (processes.Count > MaximumJobs)
            throw new ArgumentException("Use at most six jobs.", nameof(processes));

        var names = new HashSet<string>(StringComparer.Ordinal);
        foreach (var process in processes)
        {
            if (process is null || process.Name is not { Length: 2 } name ||
                name[0] != 'P' || name[1] is < '1' or > '6' || !names.Add(name))
                throw new ArgumentException("Job names must be unique P1–P6.", nameof(processes));
            InRange(process.ReadyTime, 0, MaximumArrival, $"{name} arrival");
            InRange(process.ExecutionTime, 1, MaximumBurst, $"{name} burst");
            if (process.Deadline is int deadline)
                InRange(deadline, 0, MaximumDeadline, $"{name} deadline");
        }
    }

    private static void InRange(int value, int minimum, int maximum, string name)
    {
        if (value < minimum || value > maximum)
            throw new ArgumentOutOfRangeException(name, $"Must be from {minimum} to {maximum}.");
    }
}
