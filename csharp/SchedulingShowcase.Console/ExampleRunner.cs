using SchedulingShowcase;

namespace SchedulingShowcase.ConsoleRunner;

internal static class ExampleRunner
{
    public static void RunAll()
    {
        Console.WriteLine("Dispatch · the original C# scheduling example, refactored");
        Console.WriteLine("One CPU, integer ticks, zero context-switch cost. Round Robin quantum: 3.");
        foreach (var result in SchedulingRunner.RunAllStrategies(Examples.FcfsSjfBaseProcesses, Examples.RoundRobinQuantum))
            ScheduleFormatter.Print(result);

        var orders = PermutationExplorer.Explore(Examples.FcfsSjfBaseProcesses, "rr", Examples.RoundRobinQuantum);
        Console.WriteLine();
        Console.WriteLine(FormattableString.Invariant(
            $"Round Robin: {orders.Count} queue orders; best average waiting {orders[0].Result.Metrics.Waiting:0.00}, worst {orders[^1].Result.Metrics.Waiting:0.00}."));
        var arrivals = PermutationExplorer.Explore(Examples.SjfArrivalExample, "srtf", mode: "arrival");
        Console.WriteLine(FormattableString.Invariant(
            $"SRTF: {arrivals.Count} unique arrival assignments; best average waiting {arrivals[0].Result.Metrics.Waiting:0.00}, worst {arrivals[^1].Result.Metrics.Waiting:0.00}."));
    }
}
