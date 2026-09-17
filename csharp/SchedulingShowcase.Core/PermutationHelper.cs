namespace SchedulingShowcase;

public static class PermutationHelper
{
    public static IEnumerable<IReadOnlyList<T>> Permute<T>(IReadOnlyList<T> items)
    {
        ArgumentNullException.ThrowIfNull(items);
        if (items.Count > SchedulingValidation.MaximumJobs)
            throw new ArgumentException(
                "Permutation exploration supports at most six items.",
                nameof(items));
        return PermuteInternal(items.ToList(), 0);
    }

    private static IEnumerable<IReadOnlyList<T>> PermuteInternal<T>(
        List<T> list,
        int start)
    {
        if (start == list.Count)
        {
            yield return list.ToArray();
            yield break;
        }
        var seen = new HashSet<T>();
        for (var i = start; i < list.Count; i++)
        {
            if (!seen.Add(list[i])) continue;
            (list[start], list[i]) = (list[i], list[start]);
            foreach (var permutation in PermuteInternal(list, start + 1))
                yield return permutation;
            (list[start], list[i]) = (list[i], list[start]);
        }
    }
}
