using Microsoft.AspNetCore.Components;
using Microsoft.JSInterop;
using System.Diagnostics.CodeAnalysis;
using System.Reflection;

namespace Tavenem.Blazor.Framework;

/// <summary>
/// Extensions for <see cref="ElementReference"/>.
/// </summary>
/// <remarks>
/// Note that these depend on the JavaScript module of this framework, and will only function when
/// the framework is loaded as expected.
/// </remarks>
public static class ElementReferenceExtensions
{
    private static readonly PropertyInfo? _jsRuntimeProperty =
            typeof(WebElementReferenceContext).GetProperty("JSRuntime", BindingFlags.Instance | BindingFlags.NonPublic);

    /// <summary>
    /// Adds an event listener.
    /// </summary>
    [RequiresUnreferencedCode("Uses reflection to serialize parameters of callback.")]
    public static async ValueTask<int> AddEventListenerAsync<T>(
        this ElementReference elementReference,
        DotNetObjectReference<T> dotNetRef,
        string @event,
        string callback,
        bool stopPropagation = false) where T : class
    {
        try
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
                return 0;
            }

            var parameterSpecs = new Dictionary<string, object>[parameters.Count];
            for (var i = 0; i < parameters.Count; ++i)
            {
                parameterSpecs[i] = GetSerializationSpec(parameters[i]);
            }

            return await elementReference.InvokeAsync<int>(
                "addEventListener",
                dotNetRef,
                @event,
                callback,
                parameterSpecs,
                stopPropagation);
        }
        catch (ObjectDisposedException)
        {
            return 0;
        }
    }

    /// <summary>
    /// Changes the CSS class name of the element.
    /// </summary>
    public static ValueTask ChangeCssClassNameAsync(this ElementReference elementReference, string className)
        => elementReference.InvokeVoidAsync("changeCssClassName", className);

    /// <summary>
    /// Changes the value of a CSS variable on the element.
    /// </summary>
    public static ValueTask ChangeCssVariableAsync(this ElementReference elementReference, string name, string newValue)
        => elementReference.InvokeVoidAsync("changeCssVariable", name, newValue);

    /// <summary>
    /// Gives focus to the first child of the element.
    /// </summary>
    /// <param name="elementReference"></param>
    /// <param name="skip">The number of children to skip.</param>
    /// <param name="min">Do nothing if the element does not have at least this many children.</param>
    public static ValueTask FocusFirstAsync(this ElementReference elementReference, int skip = 0, int min = 0)
        => elementReference.InvokeVoidAsync("focusFirstElement", skip, min);

    /// <summary>
    /// Gives focus to the last child of the element.
    /// </summary>
    /// <param name="elementReference"></param>
    /// <param name="skip">The number of children to skip (counting from the end).</param>
    /// <param name="min">Do nothing if the element does not have at least this many children.</param>
    public static ValueTask FocusLastAsync(this ElementReference elementReference, int skip = 0, int min = 0)
        => elementReference.InvokeVoidAsync("focusLastElement", skip, min);

    /// <summary>
    /// Gets a <see cref="BoundingClientRect"/> for the element.
    /// </summary>
    public static async ValueTask<BoundingClientRect> GetBoundingClientRectAsync(this ElementReference elementReference)
        => await elementReference.InvokeAsync<BoundingClientRect>("getBoundingClientRect")
        ?? BoundingClientRect.Empty;

    /// <summary>
    /// Gets a <see cref="BoundingClientRect"/> for the first child of the element.
    /// </summary>
    public static async ValueTask<BoundingClientRect> GetClientRectFromFirstChildAsync(this ElementReference elementReference)
        => await elementReference.InvokeAsync<BoundingClientRect>("getClientRectFromFirstChild")
        ?? BoundingClientRect.Empty;

    /// <summary>
    /// Gets a <see cref="BoundingClientRect"/> for the element's parent.
    /// </summary>
    public static async ValueTask<BoundingClientRect> GetClientRectFromParentAsync(this ElementReference elementReference)
        => await elementReference.InvokeAsync<BoundingClientRect>("getClientRectFromParent")
        ?? BoundingClientRect.Empty;

    /// <summary>
    /// Gets the text content of the element.
    /// </summary>
    public static async ValueTask<string?> GetTextContentAsync(this ElementReference elementReference)
        => await elementReference.InvokeAsync<string?>("getTextContent");

    /// <summary>
    /// Determine whether the element has an ancestor with fixed position.
    /// </summary>
    public static ValueTask<bool> HasFixedAncestorsAsync(this ElementReference elementReference)
        => elementReference.InvokeAsync<bool>("elementHasFixedAncestors");

    /// <summary>
    /// Remove an event listener from the element.
    /// </summary>
    public static ValueTask RemoveEventListenerAsync(this ElementReference elementReference, string @event, int eventId)
        => elementReference.InvokeVoidAsync("removeEventListener", @event, eventId);

    /// <summary>
    /// Restore focus previously saved with <see cref="SaveFocusAsync(ElementReference)"/>.
    /// </summary>
    public static ValueTask RestoreFocusAsync(this ElementReference elementReference)
        => elementReference.InvokeVoidAsync("restoreElementFocus");

    /// <summary>
    /// Preserve the current focus state of the element (for later use with <see cref="RestoreFocusAsync(ElementReference)"/>).
    /// </summary>
    public static ValueTask SaveFocusAsync(this ElementReference elementReference)
        => elementReference.InvokeVoidAsync("saveElementFocus");

    /// <summary>
    /// Selects all content of the element.
    /// </summary>
    public static ValueTask SelectAsync(this ElementReference elementReference)
        => elementReference.InvokeVoidAsync("select");

    /// <summary>
    /// Selects a range of the element's content.
    /// </summary>
    /// <param name="elementReference"></param>
    /// <param name="start">The first index to select.</param>
    /// <param name="end">The last index to select (or <see langword="null"/> to select to the end of the content).</param>
    public static ValueTask SelectRangeAsync(this ElementReference elementReference, int start, int? end = null)
        => elementReference.InvokeVoidAsync("selectRange", start, end);

    private static async ValueTask<IJSObjectReference?> GetJSModule(this ElementReference elementReference)
        => elementReference.Context is not WebElementReferenceContext context
        || _jsRuntimeProperty?.GetValue(context) is not IJSRuntime jsRuntime
        ? null
        : await jsRuntime.InvokeAsync<IJSObjectReference>(
            "import",
            "./_content/Tavenem.Blazor.Framework/tavenem-utility.js");

    [RequiresUnreferencedCode("Uses reflection to serialize type.")]
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

    private static async ValueTask<TValue?> InvokeAsync<[DynamicallyAccessedMembers(
        DynamicallyAccessedMemberTypes.PublicConstructors
        | DynamicallyAccessedMemberTypes.PublicFields
        | DynamicallyAccessedMemberTypes.PublicProperties)] TValue>(
        this ElementReference elementReference,
        string identifier,
        params object?[]? args)
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
        catch (ObjectDisposedException)
        {
            return default;
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
