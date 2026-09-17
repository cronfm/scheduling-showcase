namespace SchedulingShowcase;

public sealed class ProcessState(ProcessDefinition definition, int rank)
{
    public ProcessDefinition Definition { get; } =
        definition ?? throw new ArgumentNullException(nameof(definition));
    public int Rank { get; } = rank;
    public int Remaining { get; internal set; } = definition.ExecutionTime;
    public int StartTime { get; internal set; } = -1;
    public int CompletionTime { get; internal set; } = -1;
    public bool IsFinished => Remaining == 0 && CompletionTime >= 0;
    public int TurnaroundTime => CompletionTime - Definition.ReadyTime;
    public int WaitingTime => TurnaroundTime - Definition.ExecutionTime;
    public int ResponseTime => StartTime - Definition.ReadyTime;
}
