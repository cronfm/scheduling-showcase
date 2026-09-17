namespace SchedulingShowcase;

public sealed record PermutationResult(
    IReadOnlyList<ProcessDefinition> Jobs,
    string Label,
    ScheduleResult Result);

public static class PermutationExplorer
{
    public static IReadOnlyList<PermutationResult> Explore(
        IReadOnlyList<ProcessDefinition> processes,
        string strategy,
        int quantum = 3,
        string mode = "order")
    {
        SchedulingValidation.Validate(processes, quantum);
        _ = SchedulingRunner.CreateStrategy(strategy);
        IEnumerable<PermutationResult> variants = mode switch
        {
            "order" => PermutationHelper.Permute(
                    processes
                        .Select(process => process.Name)
                        .ToArray())
                .Select(order => Create(
                    order
                        .Select(name => processes
                            .First(process => process.Name == name))
                        .ToArray(),
                    string.Join(" → ", order))),
            "arrival" => PermutationHelper.Permute(
                    processes
                        .Select(process => process.ReadyTime)
                        .ToArray())
                .Select(arrivals => Create(
                    processes
                        .Select((process, rank) =>
                            process with { ReadyTime = arrivals[rank] })
                        .ToArray(),
                    string.Join(" → ", arrivals))),
            _ => throw new ArgumentException(
                "Choose queue order or arrival assignment.",
                nameof(mode))
        };
        return variants
            .OrderBy(variant => variant.Result.Metrics.Waiting)
            .ThenBy(variant => variant.Label, StringComparer.Ordinal)
            .ToArray();

        PermutationResult Create(IReadOnlyList<ProcessDefinition> jobs, string label) =>
            new(jobs, label, SchedulingRunner.Schedule(strategy, jobs, quantum));
    }
}
