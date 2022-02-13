using Microsoft.AspNetCore.Components;
using Microsoft.JSInterop;
using System.Reflection;

namespace Tavenem.Blazor.Framework;

internal static class Extensions
{
    private static readonly PropertyInfo? _jsRuntimeProperty =
            typeof(WebElementReferenceContext).GetProperty("JSRuntime", BindingFlags.Instance | BindingFlags.NonPublic);

    public static string? ToCSS(this Enum value)
    {
        if (value is null || Convert.ToInt32(value) == 0)
        {
            return null;
        }

        return value
            .ToString()
            .ToLowerInvariant()
            .Replace('_', '-');
    }

    public static Dictionary<TKey, TValue> Without<TKey, TValue>(this Dictionary<TKey, TValue> dictionary, params TKey[] keys) where TKey : notnull
    {
        if (keys.Length == 0)
        {
            return dictionary;
        }

        var copy = new Dictionary<TKey, TValue>(dictionary);
        foreach (var key in keys)
        {
            copy.Remove(key);
        }
        return copy;
    }

    internal static IJSRuntime? GetJSRuntime(this ElementReference elementReference)
    {
        if (elementReference.Context is not WebElementReferenceContext context)
        {
            return null;
        }

        return _jsRuntimeProperty?.GetValue(context) as IJSRuntime;
    }
}
