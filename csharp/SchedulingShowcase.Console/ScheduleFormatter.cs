using System.Globalization;
using SchedulingShowcase;

namespace SchedulingShowcase.ConsoleRunner;

internal static class ScheduleFormatter
{
    public static void Print(ScheduleResult result)
    {
        Console.WriteLine();
        Console.WriteLine(SchedulingRunner.CreateStrategy(result.Strategy).Name);
        Console.WriteLine(string.Join(" | ", result.Timeline.Select(segment =>
            $"{segment.Start}–{segment.End}: {segment.Id ?? "idle"}")));
        Console.WriteLine("Job   Arrival  Burst  Deadline  Start  Finish  Waiting  Turnaround  Response");
        foreach (var job in result.Jobs)
            Console.WriteLine(FormattableString.Invariant(
                $"{job.Id,-6}{job.Arrival,7}{job.Burst,7}{job.Deadline?.ToString(CultureInfo.InvariantCulture) ?? "—",10}{job.Start,7}{job.Completion,8}{job.Waiting,9}{job.Turnaround,12}{job.Response,10}"));
        Console.WriteLine(FormattableString.Invariant(
            $"Average waiting: {result.Metrics.Waiting:0.00}; response: {result.Metrics.Response:0.00}; turnaround: {result.Metrics.Turnaround:0.00}; switches: {result.Metrics.Switches}"));
    }
}
