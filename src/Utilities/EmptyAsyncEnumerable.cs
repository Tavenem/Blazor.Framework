namespace Tavenem.Blazor.Framework;

internal class EmptyAsyncEnumerable<T> : IAsyncEnumerator<T>, IAsyncEnumerable<T>
{
    public static readonly EmptyAsyncEnumerable<T> Empty = new();
    public T Current => default!;
    public ValueTask DisposeAsync() => default;
    public IAsyncEnumerator<T> GetAsyncEnumerator(CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        return this;
    }
    public ValueTask<bool> MoveNextAsync() => new(false);
}
