using Microsoft.AspNetCore.Components;
using Microsoft.JSInterop;
using System.Reflection;

namespace Tavenem.Blazor.Framework;

internal static class ElementReferenceExtensions
{
    private static readonly PropertyInfo? _jsRuntimeProperty =
            typeof(WebElementReferenceContext).GetProperty("JSRuntime", BindingFlags.Instance | BindingFlags.NonPublic);

    public static ValueTask<int> AddEventListenerAsync<T>(
        this ElementReference elementReference,
        DotNetObjectReference<T> dotNetRef,
        string @event,
        string callback,
        bool stopPropagation = false) where T : class
    {
        var parameters = dotNetRef
            .Value
            .GetType()
            .GetMethods()
            .FirstOrDefault(x => x.Name == callback)?
            .GetParameters()
            .Select(x => x.ParameterType)
            .ToList();
        if (parameters is null)
        {
            return ValueTask.FromResult(0);
        }

        var parameterSpecs = new Dictionary<string, object>[parameters.Count];
        for (var i = 0; i < parameters.Count; ++i)
        {
            parameterSpecs[i] = GetSerializationSpec(parameters[i]);
        }

        return elementReference.InvokeAsync<int>(
            "addEventListener",
            dotNetRef,
            @event,
            callback,
            parameterSpecs,
            stopPropagation);
    }

    public static ValueTask ChangeCssClassNameAsync(this ElementReference elementReference, string className)
        => elementReference.InvokeVoidAsync("changeCssClassName", className);

    public static ValueTask ChangeCssVariableAsync(this ElementReference elementReference, string name, string newValue)
        => elementReference.InvokeVoidAsync("changeCssVariable", name, newValue);

    public static ValueTask FocusFirstAsync(this ElementReference elementReference, int skip = 0, int min = 0)
        => elementReference.InvokeVoidAsync("focusFirstElement", skip, min);

    public static ValueTask FocusLastAsync(this ElementReference elementReference, int skip = 0, int min = 0)
        => elementReference.InvokeVoidAsync("focusLastElement", skip, min);

    public static async ValueTask<BoundingClientRect> GetBoundingClientRectAsync(this ElementReference elementReference)
        => await elementReference.InvokeAsync<BoundingClientRect>("getBoundingClientRect")
        ?? BoundingClientRect.Empty;

    public static async ValueTask<BoundingClientRect> GetClientRectFromFirstChildAsync(this ElementReference elementReference)
        => await elementReference.InvokeAsync<BoundingClientRect>("getClientRectFromFirstChild")
        ?? BoundingClientRect.Empty;

    public static async ValueTask<BoundingClientRect> GetClientRectFromParentAsync(this ElementReference elementReference)
        => await elementReference.InvokeAsync<BoundingClientRect>("getClientRectFromParent")
        ?? BoundingClientRect.Empty;

    public static async ValueTask<string?> GetTextContentAsync(this ElementReference elementReference)
        => await elementReference.InvokeAsync<string?>("getTextContent");

    public static ValueTask<bool> HasFixedAncestorsAsync(this ElementReference elementReference)
        => elementReference.InvokeAsync<bool>("elementHasFixedAncestors");

    public static ValueTask RemoveEventListenerAsync(this ElementReference elementReference, string @event, int eventId)
        => elementReference.InvokeVoidAsync("removeEventListener", @event, eventId);

    public static ValueTask RestoreFocusAsync(this ElementReference elementReference)
        => elementReference.InvokeVoidAsync("restoreElementFocus");

    public static ValueTask SaveFocusAsync(this ElementReference elementReference)
        => elementReference.InvokeVoidAsync("saveElementFocus");

    public static ValueTask SelectAsync(this ElementReference elementReference)
        => elementReference.InvokeVoidAsync("select");

    public static ValueTask SelectRangeAsync(this ElementReference elementReference, int pos1, int pos2)
        => elementReference.InvokeVoidAsync("selectRange", pos1, pos2);

    private static async ValueTask<IJSObjectReference?> GetJSModule(this ElementReference elementReference)
        => elementReference.Context is not WebElementReferenceContext context
        || _jsRuntimeProperty?.GetValue(context) is not IJSRuntime jsRuntime
        ? null
        : await jsRuntime.InvokeAsync<IJSObjectReference>(
            "import",
            "./_content/Tavenem.Blazor.Framework/tavenem-utility.js");

    private static Dictionary<string, object> GetSerializationSpec(Type type)
    {
        var props = type.GetProperties();
        var propsSpec = new Dictionary<string, object>();
        foreach (var prop in props)
        {
            if (prop.PropertyType.IsPrimitive
                || prop.PropertyType == typeof(string))
            {
                propsSpec.Add(prop.Name.ToJsString(), "*");
            }
            else if (prop.PropertyType.IsArray)
            {
                var elementType = prop.PropertyType.GetElementType();
                if (elementType is not null)
                {
                    propsSpec.Add(prop.Name.ToJsString(), GetSerializationSpec(elementType));
                }
            }
            else if (prop.PropertyType.IsClass)
            {
                propsSpec.Add(prop.Name.ToJsString(), GetSerializationSpec(prop.PropertyType));
            }
        }
        return propsSpec;
    }

    private static async ValueTask InvokeVoidAsync(this ElementReference elementReference, string identifier, params object?[]? args)
    {
        IJSObjectReference? module = null;
        try
        {
            module = await elementReference.GetJSModule();
            if (module is null)
            {
                return;
            }
            var finalArgs = new List<object?> { elementReference };
            if (args is not null)
            {
                finalArgs.AddRange(args);
            }
            await module.InvokeVoidAsync(identifier, finalArgs.ToArray());
        }
        finally
        {
            if (module is not null)
            {
                await module.DisposeAsync();
            }
        }
    }

    private static async ValueTask<TValue?> InvokeAsync<TValue>(this ElementReference elementReference, string identifier, params object?[]? args)
    {
        IJSObjectReference? module = null;
        try
        {
            module = await elementReference.GetJSModule();
            if (module is null)
            {
                return default;
            }
            var finalArgs = new List<object?> { elementReference };
            if (args is not null)
            {
                finalArgs.AddRange(args);
            }
            return await module.InvokeAsync<TValue>(identifier, finalArgs.ToArray());
        }
        finally
        {
            if (module is not null)
            {
                await module.DisposeAsync();
            }
        }
    }
}
