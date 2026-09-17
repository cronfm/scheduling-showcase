using System.Text;

namespace SchedulingShowcase.ConsoleRunner;

internal static class Program
{
    private static int Main(string[] args)
    {
        Console.OutputEncoding = new UTF8Encoding(false);
        try
        {
            if (args.Length == 0)
                ExampleRunner.RunAll();
            else if (args is ["--json", var path])
                JsonRunner.Run(path);
            else if (args is ["--help"] or ["-h"])
                Console.WriteLine("Usage: dotnet run --project SchedulingShowcase.Console [-- --json fixtures.json]\nNo arguments print the original lecture example. --json writes only machine-readable JSON to stdout.");
            else
                throw new ArgumentException("Use no arguments, --help, or --json <fixture-file>.");
            return 0;
        }
        catch (Exception error)
        {
            Console.Error.WriteLine($"Error: {error.Message}");
            return 2;
        }
    }
}
