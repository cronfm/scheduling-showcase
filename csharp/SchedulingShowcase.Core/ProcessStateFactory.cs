namespace SchedulingShowcase;

internal static class ProcessStateFactory
{
    public static List<ProcessState> CreateWorkingSet(IReadOnlyList<ProcessDefinition> processes, int quantum)
    {
        SchedulingValidation.Validate(processes, quantum);
        return processes.Select((process, rank) => new ProcessState(process, rank)).ToList();
    }
}
