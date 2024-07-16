using Microsoft.AspNetCore.Components;
using Microsoft.AspNetCore.Components.Routing;
using Microsoft.AspNetCore.WebUtilities;
using System.Text;

namespace Tavenem.Blazor.Framework;

/// <summary>
/// Persists component state in query parameters.
/// </summary>
public class QueryStateService
{
    /// <summary>
    /// The name of the query parameter used to represent component state.
    /// </summary>
    public const string QueryParameterName = "tvf";

    private readonly Dictionary<string, Dictionary<string, List<string>>> _componentProperties = [];
    private readonly Dictionary<string, Dictionary<string, string>> _componentPropertyDefaults = [];
    private readonly Dictionary<string, Dictionary<string, Func<QueryChangeEventArgs, Task>>> _callbacks = [];
    private readonly NavigationManager _navigationManager;

    /// <summary>
    /// Whether the service has finished parsing the current query string and set the initial values
    /// of all tracked components.
    /// </summary>
    /// <remarks>
    /// This operation is performed lazily the first time any of the public methods of the service
    /// are called. Therefore the value of this property will normally be <see langword="false"/>
    /// before any component has registered a callback or value, and <see langword="true"/> after at
    /// least one component has done so.
    /// </remarks>
    public bool IsInitialized { get; private set; }

    /// <summary>
    /// Constructs a new instance of <see cref="QueryStateService"/>.
    /// </summary>
    /// <param name="navigationManager">
    /// An injected instance of <see cref="NavigationManager"/>.
    /// </param>
    public QueryStateService(NavigationManager navigationManager)
    {
        _navigationManager = navigationManager;
        _navigationManager.LocationChanged += OnLocationChanged;
    }

    /// <summary>
    /// Registers a component's property value with the service.
    /// </summary>
    /// <param name="id">A unique ID for the component.</param>
    /// <param name="property">A name for the property to be persisted.</param>
    /// <param name="value">
    /// <para>
    /// A value to be added to the current collection of values assigned to property.
    /// </para>
    /// <para>
    /// If the property has already been assigned one or more values, this one is added to that
    /// list, rather than replacing those.
    /// </para>
    /// <para>
    /// If <see langword="null"/> nothing occurs.
    /// </para>
    /// <para>
    /// Only built-in numeric value types, <see cref="bool"/>, <see cref="char"/>, <see
    /// cref="string"/>, <see cref="DateTime"/>, <see cref="DateTimeOffset"/>, <see
    /// cref="DateOnly"/>, <see cref="TimeOnly"/>, <see cref="TimeSpan"/>, <see cref="Guid"/>,
    /// nullable versions of those types are supported.
    /// </para>
    /// </param>
    /// <param name="callback">
    /// <para>
    /// A callback to be invoked when this parameter's value changes.
    /// </para>
    /// <para>
    /// Replaces any callback currently set for this component-property pair.
    /// </para>
    /// <para>
    /// If <see langword="null"/>, no callback is attached, but an existing callback will not be
    /// removed.
    /// </para>
    /// <para>
    /// It is not necessary to call <c>SetPropertyValue</c> from a callback to update the query
    /// parameter to the new value. That is handled automatically.
    /// </para>
    /// </param>
    /// <param name="replace">
    /// If <see langword="true"/>, replaces the current entry in the history stack. If <see
    /// langword="false"/>, appends the new entry to the history stack.
    /// </param>
    /// <param name="defaultValue">
    /// <para>
    /// A value which should be considered the default for this property.
    /// </para>
    /// <para>
    /// When the current value equals this default, no query parameter will be set.
    /// </para>
    /// </param>
    public void AddPropertyValue(
        string id,
        string property,
        object? value,
        Func<QueryChangeEventArgs, Task>? callback = null,
        bool replace = true,
        object? defaultValue = null)
    {
        InitializeFromQuery();

        if (callback is not null)
        {
            if (!_callbacks.TryGetValue(id, out var componentCallbacks))
            {
                componentCallbacks = [];
                _callbacks[id] = componentCallbacks;
            }
            componentCallbacks[property] = callback;
        }

        if (GetPropertyString(defaultValue) is string defaultStringValue)
        {
            if (!_componentPropertyDefaults.TryGetValue(id, out var componentPropertyDefaults))
            {
                componentPropertyDefaults = [];
                _componentPropertyDefaults[id] = componentPropertyDefaults;
            }
            componentPropertyDefaults[property] = defaultStringValue;
        }

        if (GetPropertyString(value) is not string stringValue)
        {
            return;
        }
        if (!_componentProperties.TryGetValue(id, out var componentProperties))
        {
            componentProperties = [];
            _componentProperties[id] = componentProperties;
        }
        if (!componentProperties.TryGetValue(property, out var propertyValues)
            || propertyValues is null)
        {
            propertyValues = [];
            componentProperties[property] = propertyValues;
        }
        propertyValues.Add(stringValue);

        UpdateQuery(replace);
    }

    /// <summary>
    /// Registers a component's property value with the service.
    /// </summary>
    /// <param name="id">A unique ID for the component.</param>
    /// <param name="property">A name for the property to be persisted.</param>
    /// <param name="values">
    /// <para>
    /// Values to be added to the current collection of values assigned to property.
    /// </para>
    /// <para>
    /// If the property has already been assigned one or more values, these are added to that list,
    /// rather than replacing those.
    /// </para>
    /// <para>
    /// If <see langword="null"/> nothing occurs.
    /// </para>
    /// <para>
    /// Only built-in numeric value types, <see cref="bool"/>, <see cref="char"/>, <see
    /// cref="string"/>, <see cref="DateTime"/>, <see cref="DateTimeOffset"/>, <see
    /// cref="DateOnly"/>, <see cref="TimeOnly"/>, <see cref="TimeSpan"/>, <see cref="Guid"/>,
    /// nullable versions of those types are supported.
    /// </para>
    /// </param>
    /// <param name="callback">
    /// <para>
    /// A callback to be invoked when this parameter's value changes.
    /// </para>
    /// <para>
    /// Replaces any callback currently set for this component-property pair.
    /// </para>
    /// <para>
    /// If <see langword="null"/>, no callback is attached, but an existing callback will not be
    /// removed.
    /// </para>
    /// <para>
    /// It is not necessary to call <c>SetPropertyValue</c> from a callback to update the query
    /// parameter to the new value. That is handled automatically.
    /// </para>
    /// </param>
    /// <param name="replace">
    /// If <see langword="true"/>, replaces the current entry in the history stack. If <see
    /// langword="false"/>, appends the new entry to the history stack.
    /// </param>
    /// <param name="defaultValue">
    /// <para>
    /// A value which should be considered the default for this property.
    /// </para>
    /// <para>
    /// When the current value equals this default, no query parameter will be set.
    /// </para>
    /// </param>
    public void AddPropertyValues(
        string id,
        string property,
        IEnumerable<object?>? values,
        Func<QueryChangeEventArgs, Task>? callback = null,
        bool replace = true,
        object? defaultValue = null)
    {
        InitializeFromQuery();

        if (callback is not null)
        {
            if (!_callbacks.TryGetValue(id, out var componentCallbacks))
            {
                componentCallbacks = [];
                _callbacks[id] = componentCallbacks;
            }
            componentCallbacks[property] = callback;
        }

        if (GetPropertyString(defaultValue) is string defaultStringValue)
        {
            if (!_componentPropertyDefaults.TryGetValue(id, out var componentPropertyDefaults))
            {
                componentPropertyDefaults = [];
                _componentPropertyDefaults[id] = componentPropertyDefaults;
            }
            componentPropertyDefaults[property] = defaultStringValue;
        }

        if (GetPropertyStrings(values) is not List<string> stringValues)
        {
            return;
        }
        if (!_componentProperties.TryGetValue(id, out var componentProperties))
        {
            componentProperties = [];
            _componentProperties[id] = componentProperties;
        }
        if (!componentProperties.TryGetValue(property, out var propertyValues)
            || propertyValues is null)
        {
            propertyValues = [];
            componentProperties[property] = propertyValues;
        }
        propertyValues.AddRange(stringValues);

        UpdateQuery(replace);
    }

    /// <summary>
    /// Gets the given URI if the given <see langword="property"/> for the component with the given
    /// <paramref name="id"/> did not have the provided <paramref name="value"/>.
    /// </summary>
    /// <param name="uri">The URI to modify.</param>
    /// <param name="id">A unique ID for the component.</param>
    /// <param name="property">A name for the property to be persisted.</param>
    /// <param name="value">
    /// <para>
    /// A value to be removed from the <see langword="property"/>, if it is currently assigned.
    /// </para>
    /// <para>
    /// If <see langword="null"/> the property is omitted completely.
    /// </para>
    /// </param>
    /// <returns>
    /// The given URI, with a query string modified to omit the given property value, if present.
    /// </returns>
    public string GetUriWithoutPropertyValue(
        string uri,
        string id,
        string property,
        object? value) => _navigationManager.GetUriWithQueryParameters(
            uri,
            GetQueryWithoutParameter(
                id,
                property,
                value,
                GetPropertiesFromQuery(uri)));

    /// <summary>
    /// Gets the current URI if the given <see langword="property"/> for the component with the
    /// given <paramref name="id"/> did not have the provided <paramref name="value"/>.
    /// </summary>
    /// <param name="id">A unique ID for the component.</param>
    /// <param name="property">A name for the property to be persisted.</param>
    /// <param name="value">
    /// <para>
    /// A value to be removed from the <see langword="property"/>, if it is currently assigned.
    /// </para>
    /// <para>
    /// If <see langword="null"/> the property is omitted completely.
    /// </para>
    /// </param>
    /// <returns>
    /// The current URI, with a query string modified to omit the given property value, if present.
    /// </returns>
    public string GetUriWithoutPropertyValue(
        string id,
        string property,
        object? value)
    {
        InitializeFromQuery();

        return _navigationManager.GetUriWithQueryParameters(
            GetQueryWithoutParameter(
                id,
                property,
                value));
    }

    /// <summary>
    /// Gets the given URI if the given <see langword="property"/> for the component with the given
    /// <paramref name="id"/> did not have the provided <paramref name="values"/>.
    /// </summary>
    /// <param name="uri">The URI to modify.</param>
    /// <param name="id">A unique ID for the component.</param>
    /// <param name="property">A name for the property to be persisted.</param>
    /// <param name="values">
    /// <para>
    /// A collection of values to be removed from the <see langword="property"/>, if any are
    /// currently assigned.
    /// </para>
    /// <para>
    /// If <see langword="null"/> the property is omitted completely.
    /// </para>
    /// </param>
    /// <returns>
    /// The given URI, with a query string modified to omit the given property values, if present.
    /// </returns>
    public string GetUriWithoutPropertyValues(
        string uri,
        string id,
        string property,
        IEnumerable<object?>? values) => _navigationManager.GetUriWithQueryParameters(
            uri,
            GetQueryWithoutParameter(
                id,
                property,
                values,
                GetPropertiesFromQuery(uri)));

    /// <summary>
    /// Gets the current URI if the given <see langword="property"/> for the component with the
    /// given <paramref name="id"/> did not have the provided <paramref name="values"/>.
    /// </summary>
    /// <param name="id">A unique ID for the component.</param>
    /// <param name="property">A name for the property to be persisted.</param>
    /// <param name="values">
    /// <para>
    /// A collection of values to be removed from the <see langword="property"/>, if any are
    /// currently assigned.
    /// </para>
    /// <para>
    /// If <see langword="null"/> the property is omitted completely.
    /// </para>
    /// </param>
    /// <returns>
    /// The current URI, with a query string modified to omit the given property values, if present.
    /// </returns>
    public string GetUriWithoutPropertyValues(
        string id,
        string property,
        IEnumerable<object?>? values)
    {
        InitializeFromQuery();

        return _navigationManager.GetUriWithQueryParameters(
            GetQueryWithoutParameter(
                id,
                property,
                values));
    }

    /// <summary>
    /// Gets the given URI if the given <see langword="property"/> for the component with the given
    /// <paramref name="id"/> had the provided <paramref name="value"/>.
    /// </summary>
    /// <param name="uri">The URI to modify.</param>
    /// <param name="id">A unique ID for the component.</param>
    /// <param name="property">A name for the property to be persisted.</param>
    /// <param name="value">
    /// <para>
    /// A value to be assigned to the <see langword="property"/>.
    /// </para>
    /// <para>
    /// If <see langword="null"/> the property is omitted completely.
    /// </para>
    /// <para>
    /// Only built-in numeric value types, <see cref="bool"/>, <see cref="char"/>, <see
    /// cref="string"/>, <see cref="DateTime"/>, <see cref="DateTimeOffset"/>, <see
    /// cref="DateOnly"/>, <see cref="TimeOnly"/>, <see cref="TimeSpan"/>, <see cref="Guid"/>,
    /// nullable versions of those types are supported.
    /// </para>
    /// </param>
    /// <param name="add">
    /// Whether the given <paramref name="value"/> should be added to any current value(s) already
    /// present in the query string. If <see langword="false"/>, the given <paramref name="value"/>
    /// will replace any current value(s).
    /// </param>
    /// <returns>
    /// The given URI, with a query string modified to reflect the given property value.
    /// </returns>
    public string GetUriWithPropertyValue(
        string uri,
        string id,
        string property,
        object? value,
        bool add = false) => _navigationManager.GetUriWithQueryParameters(
            uri,
            GetQueryParameter(
                id,
                property,
                value,
                add,
                GetPropertiesFromQuery(uri)));

    /// <summary>
    /// Gets the current URI if the given <see langword="property"/> for the component with the
    /// given <paramref name="id"/> had the provided <paramref name="value"/>.
    /// </summary>
    /// <param name="id">A unique ID for the component.</param>
    /// <param name="property">A name for the property to be persisted.</param>
    /// <param name="value">
    /// <para>
    /// A value to be assigned to the <see langword="property"/>.
    /// </para>
    /// <para>
    /// If <see langword="null"/> the property is omitted completely.
    /// </para>
    /// <para>
    /// Only built-in numeric value types, <see cref="bool"/>, <see cref="char"/>, <see
    /// cref="string"/>, <see cref="DateTime"/>, <see cref="DateTimeOffset"/>, <see
    /// cref="DateOnly"/>, <see cref="TimeOnly"/>, <see cref="TimeSpan"/>, <see cref="Guid"/>,
    /// nullable versions of those types are supported.
    /// </para>
    /// </param>
    /// <param name="add">
    /// Whether the given <paramref name="value"/> should be added to any current value(s) already
    /// present in the query string. If <see langword="false"/>, the given <paramref name="value"/>
    /// will replace any current value(s).
    /// </param>
    /// <returns>
    /// The current URI, with a query string modified to reflect the given property value.
    /// </returns>
    public string GetUriWithPropertyValue(
        string id,
        string property,
        object? value,
        bool add = false)
    {
        InitializeFromQuery();

        return _navigationManager.GetUriWithQueryParameters(
            GetQueryParameter(
                id,
                property,
                value,
                add));
    }

    /// <summary>
    /// Gets the given URI if the given <see langword="property"/> for the component with the
    /// given <paramref name="id"/> had the provided <paramref name="values"/>.
    /// </summary>
    /// <param name="uri">The URI to modify.</param>
    /// <param name="id">A unique ID for the component.</param>
    /// <param name="property">A name for the property to be persisted.</param>
    /// <param name="values">
    /// <para>
    /// A collection of values to assign to the <see langword="property"/>.
    /// </para>
    /// <para>
    /// If <see langword="null"/> the property is omitted completely.
    /// </para>
    /// <para>
    /// Only built-in numeric value types, <see cref="bool"/>, <see cref="char"/>, <see
    /// cref="string"/>, <see cref="DateTime"/>, <see cref="DateTimeOffset"/>, <see
    /// cref="DateOnly"/>, <see cref="TimeOnly"/>, <see cref="TimeSpan"/>, <see cref="Guid"/>,
    /// nullable versions of those types are supported.
    /// </para>
    /// </param>
    /// <param name="add">
    /// Whether the given <paramref name="values"/> should be added to any current value(s) already
    /// present in the query string. If <see langword="false"/>, the given <paramref name="values"/>
    /// will replace any current value(s).
    /// </param>
    /// <returns>
    /// The given URI, with a query string modified to reflect the given property value.
    /// </returns>
    public string GetUriWithPropertyValues(
        string uri,
        string id,
        string property,
        IEnumerable<object?>? values,
        bool add = false) => _navigationManager.GetUriWithQueryParameters(
            uri,
            GetQueryParameter(
                id,
                property,
                values,
                add,
                GetPropertiesFromQuery(uri)));

    /// <summary>
    /// Gets the current URI if the given <see langword="property"/> for the component with the
    /// given <paramref name="id"/> had the provided <paramref name="values"/>.
    /// </summary>
    /// <param name="id">A unique ID for the component.</param>
    /// <param name="property">A name for the property to be persisted.</param>
    /// <param name="values">
    /// <para>
    /// A collection of values to assign to the <see langword="property"/>.
    /// </para>
    /// <para>
    /// If <see langword="null"/> the property is omitted completely.
    /// </para>
    /// <para>
    /// Only built-in numeric value types, <see cref="bool"/>, <see cref="char"/>, <see
    /// cref="string"/>, <see cref="DateTime"/>, <see cref="DateTimeOffset"/>, <see
    /// cref="DateOnly"/>, <see cref="TimeOnly"/>, <see cref="TimeSpan"/>, <see cref="Guid"/>,
    /// nullable versions of those types are supported.
    /// </para>
    /// </param>
    /// <param name="add">
    /// Whether the given <paramref name="values"/> should be added to any current value(s) already
    /// present in the query string. If <see langword="false"/>, the given <paramref name="values"/>
    /// will replace any current value(s).
    /// </param>
    /// <returns>
    /// The current URI, with a query string modified to reflect the given property value.
    /// </returns>
    public string GetUriWithPropertyValues(
        string id,
        string property,
        IEnumerable<object?>? values,
        bool add = false)
    {
        InitializeFromQuery();

        return _navigationManager.GetUriWithQueryParameters(
            GetQueryParameter(
                id,
                property,
                values,
                add));
    }

    /// <summary>
    /// Registers a component's property with the service, without setting a current value.
    /// </summary>
    /// <param name="id">A unique ID for the component.</param>
    /// <param name="property">A name for the property to be persisted.</param>
    /// <param name="callback">
    /// <para>
    /// A callback to be invoked when this parameter's value changes.
    /// </para>
    /// <para>
    /// Replaces any callback currently set for this component-property pair.
    /// </para>
    /// <para>
    /// If <see langword="null"/>, no callback is attached, but an existing callback will not be
    /// removed.
    /// </para>
    /// <para>
    /// It is not necessary to call <c>SetPropertyValue</c> from a callback to update the query
    /// parameter to the new value. That is handled automatically.
    /// </para>
    /// </param>
    /// <param name="defaultValue">
    /// <para>
    /// A value which should be considered the default for this property.
    /// </para>
    /// <para>
    /// When the current value equals this default, no query parameter will be set.
    /// </para>
    /// </param>
    /// <returns>
    /// The current value(s) of the property, if any have already been specified in the query
    /// string. Note that the value(s) will be in string form. Date/time objects will be in
    /// round-trip ("O") format. <see cref="Guid"/> values will be in "N" format. All other
    /// supported types will use the default formatting used by the parameterless <see
    /// cref="object.ToString"/> method.
    /// </returns>
    public List<string>? RegisterProperty(
        string id,
        string property,
        Func<QueryChangeEventArgs, Task>? callback,
        object? defaultValue = null)
    {
        InitializeFromQuery();

        if (callback is not null)
        {
            if (!_callbacks.TryGetValue(id, out var componentCallbacks))
            {
                componentCallbacks = [];
                _callbacks[id] = componentCallbacks;
            }
            componentCallbacks[property] = callback;
        }

        if (GetPropertyString(defaultValue) is string defaultStringValue)
        {
            if (!_componentPropertyDefaults.TryGetValue(id, out var componentPropertyDefaults))
            {
                componentPropertyDefaults = [];
                _componentPropertyDefaults[id] = componentPropertyDefaults;
            }
            componentPropertyDefaults[property] = defaultStringValue;
        }

        return _componentProperties.TryGetValue(id, out var componentProperties)
            && componentProperties.TryGetValue(property, out var propertyValues)
            ? propertyValues
            : null;
    }

    /// <summary>
    /// Unregisters a component from the service, removing all its values and callbacks.
    /// </summary>
    /// <param name="id">A unique ID for the component.</param>
    /// <param name="replace">
    /// If <see langword="true"/>, replaces the current entry in the history stack. If <see
    /// langword="false"/>, appends the new entry to the history stack.
    /// </param>
    public void RemoveComponent(string id, bool replace = true)
    {
        InitializeFromQuery();

        _callbacks.Remove(id);
        if (_componentProperties.TryGetValue(id, out var componentProperties))
        {
            _componentProperties.Remove(id);
            if (componentProperties.Count > 0)
            {
                UpdateQuery(replace);
            }
        }
    }

    /// <summary>
    /// Removes a component's property value from the service.
    /// </summary>
    /// <param name="id">A unique ID for the component.</param>
    /// <param name="property">A name for the property to be persisted.</param>
    /// <param name="removeCallback">
    /// If <see langword="true"/>, also unregisters any callback currently associated with this
    /// component-parameter pair.
    /// </param>
    /// <param name="replace">
    /// If <see langword="true"/>, replaces the current entry in the history stack. If <see
    /// langword="false"/>, appends the new entry to the history stack.
    /// </param>
    public void RemoveProperty(
        string id,
        string property,
        bool removeCallback = false,
        bool replace = true)
    {
        InitializeFromQuery();

        if (removeCallback
            && _callbacks.TryGetValue(id, out var componentCallbacks))
        {
            componentCallbacks.Remove(property);
        }

        if (_componentProperties.TryGetValue(id, out var componentProperties)
            && componentProperties.ContainsKey(property))
        {
            componentProperties.Remove(property);
            UpdateQuery(replace);
        }
    }

    /// <summary>
    /// Removes a specific value for a component's property from the service.
    /// </summary>
    /// <param name="id">A unique ID for the component.</param>
    /// <param name="property">A name for the property.</param>
    /// <param name="value">
    /// <para>
    /// A value to be removed from the current collection of values assigned to property.
    /// </para>
    /// <para>
    /// If the collection of values assigned to the property does not include this one, nothing happens.
    /// </para>
    /// <para>
    /// If <see langword="null"/> nothing occurs.
    /// </para>
    /// </param>
    /// <param name="replace">
    /// If <see langword="true"/>, replaces the current entry in the history stack. If <see
    /// langword="false"/>, appends the new entry to the history stack.
    /// </param>
    public void RemovePropertyValue(
        string id,
        string property,
        object? value,
        bool replace = true)
    {
        InitializeFromQuery();

        if (GetPropertyString(value) is not string stringValue)
        {
            return;
        }
        if (_componentProperties.TryGetValue(id, out var componentProperties)
            && componentProperties.TryGetValue(property, out var propertyValues)
            && propertyValues.Remove(stringValue))
        {
            UpdateQuery(replace);
        }
    }

    /// <summary>
    /// Removes a specific set of values for a component's property from the service.
    /// </summary>
    /// <param name="id">A unique ID for the component.</param>
    /// <param name="property">A name for the property.</param>
    /// <param name="values">
    /// <para>
    /// An enumeration of values to be removed from the current collection of values assigned to
    /// property.
    /// </para>
    /// <para>
    /// If the collection of values assigned to the property does not include any of these, nothing
    /// happens.
    /// </para>
    /// <para>
    /// If <see langword="null"/> nothing occurs.
    /// </para>
    /// </param>
    /// <param name="replace">
    /// If <see langword="true"/>, replaces the current entry in the history stack. If <see
    /// langword="false"/>, appends the new entry to the history stack.
    /// </param>
    public void RemovePropertyValues(
        string id,
        string property,
        IEnumerable<object?>? values,
        bool replace = true)
    {
        InitializeFromQuery();

        if (GetPropertyStrings(values) is not List<string> stringValues)
        {
            return;
        }
        if (_componentProperties.TryGetValue(id, out var componentProperties)
            && componentProperties.TryGetValue(property, out var propertyValues))
        {
            var any = false;
            foreach (var value in stringValues)
            {
                any |= propertyValues.Remove(value);
            }
            if (any)
            {
                UpdateQuery(replace);
            }
        }
    }

    /// <summary>
    /// Registers a component's property value with the service.
    /// </summary>
    /// <param name="id">A unique ID for the component.</param>
    /// <param name="property">A name for the property to be persisted.</param>
    /// <param name="value">
    /// <para>
    /// The value for the property.
    /// </para>
    /// <para>
    /// If <see langword="null"/> any existing value is removed.
    /// </para>
    /// <para>
    /// Only built-in numeric value types, <see cref="bool"/>, <see cref="char"/>, <see
    /// cref="string"/>, <see cref="DateTime"/>, <see cref="DateTimeOffset"/>, <see
    /// cref="DateOnly"/>, <see cref="TimeOnly"/>, <see cref="TimeSpan"/>, <see cref="Guid"/>,
    /// nullable versions of those types are supported.
    /// </para>
    /// </param>
    /// <param name="callback">
    /// <para>
    /// A callback to be invoked when this parameter's value changes.
    /// </para>
    /// <para>
    /// Replaces any callback currently set for this component-property pair.
    /// </para>
    /// <para>
    /// If <see langword="null"/>, no callback is attached, but an existing callback will not be
    /// removed.
    /// </para>
    /// <para>
    /// It is not necessary to call <c>SetPropertyValue</c> from a callback to update the query
    /// parameter to the new value. That is handled automatically.
    /// </para>
    /// </param>
    /// <param name="replace">
    /// If <see langword="true"/>, replaces the current entry in the history stack. If <see
    /// langword="false"/>, appends the new entry to the history stack.
    /// </param>
    /// <param name="defaultValue">
    /// <para>
    /// A value which should be considered the default for this property.
    /// </para>
    /// <para>
    /// When the current value equals this default, no query parameter will be set.
    /// </para>
    /// </param>
    public void SetPropertyValue(
        string id,
        string property,
        object? value,
        Func<QueryChangeEventArgs, Task>? callback = null,
        bool replace = true,
        object? defaultValue = null)
    {
        InitializeFromQuery();

        if (callback is not null)
        {
            if (!_callbacks.TryGetValue(id, out var componentCallbacks))
            {
                componentCallbacks = [];
                _callbacks[id] = componentCallbacks;
            }
            componentCallbacks[property] = callback;
        }

        if (GetPropertyString(defaultValue) is string defaultStringValue)
        {
            if (!_componentPropertyDefaults.TryGetValue(id, out var componentPropertyDefaults))
            {
                componentPropertyDefaults = [];
                _componentPropertyDefaults[id] = componentPropertyDefaults;
            }
            componentPropertyDefaults[property] = defaultStringValue;
        }

        if (!_componentProperties.TryGetValue(id, out var componentProperties))
        {
            componentProperties = [];
            _componentProperties[id] = componentProperties;
        }

        var update = false;
        if (GetPropertyString(value) is not string stringValue)
        {
            update = componentProperties.Remove(property);
        }
        else if (!componentProperties.TryGetValue(property, out var currentValues))
        {
            componentProperties[property] = [stringValue];
            update = true;
        }
        else if (currentValues.Count != 1)
        {
            componentProperties[property] = [stringValue];
            update = true;
        }
        else if (!currentValues[0].Equals(stringValue, StringComparison.Ordinal))
        {
            componentProperties[property][0] = stringValue;
            update = true;
        }

        if (update)
        {
            UpdateQuery(replace);
        }
    }

    /// <summary>
    /// Registers a component's property value with the service.
    /// </summary>
    /// <param name="id">A unique ID for the component.</param>
    /// <param name="property">A name for the property to be persisted.</param>
    /// <param name="values">
    /// <para>
    /// A collection of values for the property.
    /// </para>
    /// <para>
    /// <see langword="null"/> values are ignored.
    /// </para>
    /// <para>
    /// If the entire collection is <see langword="null"/> any existing value is removed.
    /// </para>
    /// <para>
    /// Only built-in numeric value types, <see cref="bool"/>, <see cref="char"/>, <see
    /// cref="string"/>, <see cref="DateTime"/>, <see cref="DateTimeOffset"/>, <see
    /// cref="DateOnly"/>, <see cref="TimeOnly"/>, <see cref="TimeSpan"/>, <see cref="Guid"/>,
    /// nullable versions of those types are supported.
    /// </para>
    /// </param>
    /// <param name="callback">
    /// <para>
    /// A callback to be invoked when this parameter's value changes.
    /// </para>
    /// <para>
    /// Replaces any callback currently set for this component-property pair.
    /// </para>
    /// <para>
    /// If <see langword="null"/>, no callback is attached, but an existing callback will not be
    /// removed.
    /// </para>
    /// <para>
    /// It is not necessary to call <c>SetPropertyValue</c> from a callback to update the query
    /// parameter to the new value. That is handled automatically.
    /// </para>
    /// </param>
    /// <param name="replace">
    /// If <see langword="true"/>, replaces the current entry in the history stack. If <see
    /// langword="false"/>, appends the new entry to the history stack.
    /// </param>
    /// <param name="defaultValue">
    /// <para>
    /// A value which should be considered the default for this property.
    /// </para>
    /// <para>
    /// When the current value equals this default, no query parameter will be set.
    /// </para>
    /// </param>
    public void SetPropertyValues(
        string id,
        string property,
        IEnumerable<object?>? values,
        Func<QueryChangeEventArgs, Task>? callback = null,
        bool replace = true,
        object? defaultValue = null)
    {
        InitializeFromQuery();

        if (callback is not null)
        {
            if (!_callbacks.TryGetValue(id, out var componentCallbacks))
            {
                componentCallbacks = [];
                _callbacks[id] = componentCallbacks;
            }
            componentCallbacks[property] = callback;
        }

        if (GetPropertyString(defaultValue) is string defaultStringValue)
        {
            if (!_componentPropertyDefaults.TryGetValue(id, out var componentPropertyDefaults))
            {
                componentPropertyDefaults = [];
                _componentPropertyDefaults[id] = componentPropertyDefaults;
            }
            componentPropertyDefaults[property] = defaultStringValue;
        }

        if (!_componentProperties.TryGetValue(id, out var componentProperties))
        {
            componentProperties = [];
            _componentProperties[id] = componentProperties;
        }

        var update = false;
        if (GetPropertyStrings(values) is not List<string> stringValues)
        {
            update = componentProperties.Remove(property);
        }
        else if (!componentProperties.TryGetValue(property, out var currentValues))
        {
            componentProperties[property] = stringValues;
            update = true;
        }
        else if (currentValues.Count != stringValues.Count
            || !currentValues.Order().SequenceEqual(stringValues.Order()))
        {
            componentProperties[property] = stringValues;
            update = true;
        }

        if (update)
        {
            UpdateQuery(replace);
        }
    }

    private static void AppendCollection(StringBuilder sb, List<string> values)
    {
        var started = false;
        foreach (var value in values)
        {
            if (string.IsNullOrEmpty(value))
            {
                continue;
            }
            if (!started)
            {
                sb.Append('-');
                started = true;
            }
            AppendEscaped(sb, value);
        }
        if (started)
        {
            sb.Append('~');
        }
    }

    private static void AppendEscaped(StringBuilder sb, string? value)
    {
        if (string.IsNullOrEmpty(value))
        {
            return;
        }

        if (value.Equals(bool.TrueString))
        {
            sb.Append("_T~");
            return;
        }

        if (value.Equals(bool.FalseString))
        {
            sb.Append("_F~");
            return;
        }

        sb.Append(value)
            .Append('~');
    }

    private static string? GetPropertyString(object? value)
    {
        if (value is null)
        {
            return null;
        }
        if (value is string str)
        {
            return str;
        }
        if (value is bool
            or byte
            or sbyte
            or char
            or decimal
            or double
            or float
            or int
            or uint
            or nint
            or nuint
            or long
            or ulong
            or short
            or ushort
            or TimeSpan)
        {
            return value.ToString();
        }
        if (value is DateTime dateTime)
        {
            return dateTime.ToString("O");
        }
        if (value is DateTimeOffset dateTimeOffset)
        {
            return dateTimeOffset.ToString("O");
        }
        if (value is DateOnly dateOnly)
        {
            return dateOnly.ToString("O");
        }
        if (value is TimeOnly timeOnly)
        {
            return timeOnly.ToString("O");
        }
        if (value is Guid guid)
        {
            return guid.ToString("N");
        }
        throw new ArgumentException("Unsupported type", nameof(value));
    }

    private static List<string>? GetPropertyStrings(IEnumerable<object?>? values)
    {
        if (values is null)
        {
            return null;
        }
        List<string>? list = null;
        foreach (var value in values)
        {
            var stringValue = GetPropertyString(value);
            if (!string.IsNullOrEmpty(stringValue))
            {
                (list ??= []).Add(stringValue);
            }
        }
        return list;
    }

    private static Dictionary<string, object?> GetQueryParameter(string? queryParameterString) => new()
    {
        {
            QueryParameterName,
            queryParameterString
        }
    };

    private static string? Unescape(string? value)
    {
        if (string.IsNullOrEmpty(value))
        {
            return null;
        }

        if (value.Equals("_T"))
        {
            return bool.TrueString;
        }

        if (value.Equals("_F"))
        {
            return bool.FalseString;
        }

        return value;
    }

    private Dictionary<string, Dictionary<string, List<string>>> GetPropertiesFromQuery(string uriString)
    {
        if (!Uri.TryCreate(uriString, UriKind.Absolute, out var uri))
        {
            return [];
        }

        if (!QueryHelpers
            .ParseQuery(uri.Query)
            .TryGetValue(QueryParameterName, out var queryValues))
        {
            return [];
        }

        var changes = new Dictionary<string, Dictionary<string, QueryChangeEventArgs>>();
        foreach (var queryValue in queryValues)
        {
            ParseQueryParameter(changes, queryValue);
        }

        Dictionary<string, Dictionary<string, List<string>>> allComponentProperties = [];
        foreach (var (id, propertyChanges) in changes)
        {
            Dictionary<string, List<string>> componentProperties = [];
            foreach (var (property, changeEventArgs) in propertyChanges)
            {
                if (changeEventArgs.Values is not null)
                {
                    componentProperties[property] = changeEventArgs.Values;
                }
                else if (changeEventArgs.Value is not null)
                {
                    componentProperties[property] = [changeEventArgs.Value];
                }
            }
            if (componentProperties.Count > 0)
            {
                allComponentProperties[id] = componentProperties;
            }
        }

        return allComponentProperties;
    }

    private void InitializeFromQuery()
    {
        if (IsInitialized
            || !Uri.TryCreate(_navigationManager.Uri, UriKind.Absolute, out var uri))
        {
            return;
        }

        if (!QueryHelpers
            .ParseQuery(uri.Query)
            .TryGetValue(QueryParameterName, out var queryValues))
        {
            IsInitialized = true;
            return;
        }

        var changes = new Dictionary<string, Dictionary<string, QueryChangeEventArgs>>();
        foreach (var queryValue in queryValues)
        {
            ParseQueryParameter(changes, queryValue);
        }

        foreach (var (id, propertyChanges) in changes)
        {
            Dictionary<string, List<string>> componentProperties = [];
            foreach (var (property, changeEventArgs) in propertyChanges)
            {
                if (changeEventArgs.Values is not null)
                {
                    componentProperties[property] = changeEventArgs.Values;
                }
                else if (changeEventArgs.Value is not null)
                {
                    componentProperties[property] = [changeEventArgs.Value];
                }
            }
            if (componentProperties.Count > 0)
            {
                _componentProperties[id] = componentProperties;
            }
        }

        IsInitialized = true;
    }

    private Dictionary<string, object?> GetQueryParameter()
        => GetQueryParameter(GetQueryParameterString(_componentProperties));

    private string? GetQueryParameterString(
        Dictionary<string, Dictionary<string, List<string>>> componentProperties,
        bool includeDefaults = false)
    {
        var sb = new StringBuilder();
        foreach (var (id, propertyValues) in componentProperties)
        {
            var startedComponent = false;
            foreach (var (property, valueList) in propertyValues)
            {
                if (valueList.Count == 0)
                {
                    continue;
                }
                if (!includeDefaults
                    && valueList.Count == 1
                    && _componentPropertyDefaults.TryGetValue(id, out var componentPropertyDefaults)
                    && componentPropertyDefaults.TryGetValue(property, out var componentPropertyDefault)
                    && string.Equals(valueList[0], componentPropertyDefault, StringComparison.Ordinal))
                {
                    continue;
                }
                if (!startedComponent)
                {
                    AppendEscaped(sb, id);
                    sb.Append('-');
                    startedComponent = true;
                }
                AppendEscaped(sb, property);
                if (valueList.Count == 1)
                {
                    AppendEscaped(sb, valueList[0]);
                }
                else
                {
                    AppendCollection(sb, valueList);
                }
            }
            if (startedComponent)
            {
                sb.Append('~');
            }
        }
        return sb.Length == 0
            ? null
            : sb.ToTrimmedString('~');
    }

    private Dictionary<string, object?> GetQueryParameter(
        string id,
        string property,
        object? value,
        bool add = false,
        Dictionary<string, Dictionary<string, List<string>>>? componentProperties = null)
    {
        componentProperties ??= _componentProperties.ToDictionary(
            x => x.Key,
            x => x.Value.ToDictionary(
                y => y.Key,
                y => y.Value.ToList()));
        if (!componentProperties.TryGetValue(id, out var componentPropertyValues))
        {
            componentPropertyValues = [];
            componentProperties[id] = componentPropertyValues;
        }
        var valueString = GetPropertyString(value);
        if (string.IsNullOrEmpty(valueString))
        {
            componentPropertyValues.Remove(property);
        }
        else if (add)
        {
            if (!componentPropertyValues.TryGetValue(property, out var propertyValues))
            {
                propertyValues = [];
                componentPropertyValues[property] = propertyValues;
            }
            propertyValues.Add(valueString);
        }
        else
        {
            componentPropertyValues[property] = [valueString];
        }
        return GetQueryParameter(GetQueryParameterString(componentProperties, true));
    }

    private Dictionary<string, object?> GetQueryParameter(
        string id,
        string property,
        IEnumerable<object?>? values,
        bool add = false)
    {
        var componentProperties = _componentProperties.ToDictionary(
            x => x.Key,
            x => x.Value.ToDictionary(
                y => y.Key,
                y => y.Value.ToList()));
        if (!componentProperties.TryGetValue(id, out var componentPropertyValues))
        {
            componentPropertyValues = [];
            componentProperties[id] = componentPropertyValues;
        }
        var valueStrings = GetPropertyStrings(values);
        if (valueStrings is null)
        {
            componentPropertyValues.Remove(property);
        }
        else if (add)
        {
            if (!componentPropertyValues.TryGetValue(property, out var propertyValues))
            {
                propertyValues = [];
                componentPropertyValues[property] = propertyValues;
            }
            propertyValues.AddRange(valueStrings);
        }
        else
        {
            componentPropertyValues[property] = valueStrings;
        }
        return GetQueryParameter(GetQueryParameterString(componentProperties, true));
    }

    private Dictionary<string, object?> GetQueryWithoutParameter(
        string id,
        string property,
        object? value,
        Dictionary<string, Dictionary<string, List<string>>>? componentProperties = null)
    {
        componentProperties ??= _componentProperties.ToDictionary(
            x => x.Key,
            x => x.Value.ToDictionary(
                y => y.Key,
                y => y.Value.ToList()));
        if (!componentProperties.TryGetValue(id, out var componentPropertyValues))
        {
            componentPropertyValues = [];
            componentProperties[id] = componentPropertyValues;
        }
        var valueString = GetPropertyString(value);
        if (string.IsNullOrEmpty(valueString))
        {
            componentPropertyValues.Remove(property);
        }
        else if (componentPropertyValues.TryGetValue(property, out var propertyValues))
        {
            propertyValues.Remove(valueString);
        }
        return GetQueryParameter(GetQueryParameterString(componentProperties, true));
    }

    private Dictionary<string, object?> GetQueryWithoutParameter(
        string id,
        string property,
        IEnumerable<object?>? values)
    {
        var componentProperties = _componentProperties.ToDictionary(
            x => x.Key,
            x => x.Value.ToDictionary(
                y => y.Key,
                y => y.Value.ToList()));
        if (!componentProperties.TryGetValue(id, out var componentPropertyValues))
        {
            componentPropertyValues = [];
            componentProperties[id] = componentPropertyValues;
        }
        var valueStrings = GetPropertyStrings(values);
        if (valueStrings is null)
        {
            componentPropertyValues.Remove(property);
        }
        else if (componentPropertyValues.TryGetValue(property, out var propertyValues))
        {
            foreach (var value in valueStrings)
            {
                propertyValues.Remove(value);
            }
        }
        return GetQueryParameter(GetQueryParameterString(componentProperties, true));
    }

    private async void OnLocationChanged(object? sender, LocationChangedEventArgs e)
    {
        if (!Uri.TryCreate(e.Location, UriKind.Absolute, out var uri)
            || !QueryHelpers
            .ParseQuery(uri.Query)
            .TryGetValue(QueryParameterName, out var queryValues))
        {
            return;
        }

        var changes = new Dictionary<string, Dictionary<string, QueryChangeEventArgs>>();
        foreach (var queryValue in queryValues)
        {
            ParseQueryParameter(changes, queryValue);
        }

        foreach (var (id, propertyChanges) in changes)
        {
            if (!_callbacks.TryGetValue(id, out var callbacks))
            {
                callbacks = [];
            }
            if (!_componentProperties.TryGetValue(id, out var componentProperties))
            {
                componentProperties = [];
            }
            foreach (var (property, changeEventArgs) in propertyChanges)
            {
                if (changeEventArgs.Values is null
                    && changeEventArgs.Value is null)
                {
                    componentProperties.Remove(property);
                    if (componentProperties.Count == 0)
                    {
                        _componentProperties.Remove(id);
                    }
                }
                else
                {
                    componentProperties[property] = changeEventArgs.Values ?? [changeEventArgs.Value!];
                }

                if (callbacks.TryGetValue(property, out var callback))
                {
                    await callback.Invoke(changeEventArgs);
                }
            }
        }

        var newQueryParameter = GetQueryParameterString(_componentProperties);

        if (queryValues.Count > 1
            || !string.Equals(newQueryParameter, queryValues, StringComparison.Ordinal))
        {
            _navigationManager.NavigateTo(
                _navigationManager.GetUriWithQueryParameters(
                    GetQueryParameter(newQueryParameter)),
                false,
                true);
        }
    }

    private void ParseQueryParameter(Dictionary<string, Dictionary<string, QueryChangeEventArgs>> changes, string? queryParameter)
    {
        if (queryParameter is null)
        {
            return;
        }

        var index = 0;
        while (index < queryParameter.Length)
        {
            var separatorIndex = queryParameter.IndexOf('~', index);
            if (separatorIndex == -1
                || separatorIndex == queryParameter.Length - 1
                || queryParameter[separatorIndex + 1] != '-')
            {
                break;
            }

            var id = queryParameter[index..separatorIndex];
            index = separatorIndex + 2; // skip ~-
            if (string.IsNullOrEmpty(id))
            {
                continue;
            }

            while (index < queryParameter.Length)
            {
                if (queryParameter[index] == '~')
                {
                    index++;
                    break;
                }

                var propertyObject = GetValue(queryParameter, ref index);
                var property = propertyObject is string propertyString
                    ? propertyString
                    : null;
                if (property is null
                    || index >= queryParameter.Length)
                {
                    continue;
                }

                if (index >= queryParameter.Length)
                {
                    break;
                }

                if (queryParameter[index] == '-')
                {
                    var collection = GetCollection(queryParameter, ref index);
                    if (collection is null)
                    {
                        if (_componentProperties.TryGetValue(id, out var componentProperties)
                            && componentProperties.ContainsKey(property))
                        {
                            componentProperties.Remove(property);
                            AddPropertyChange(id, property, null, null);
                        }
                    }
                    else
                    {
                        if (!_componentProperties.TryGetValue(id, out var componentProperties))
                        {
                            componentProperties = [];
                            _componentProperties[id] = componentProperties;
                        }
                        if (!componentProperties.TryGetValue(property, out var propertyValues))
                        {
                            propertyValues = [];
                        }
                        foreach (var value in collection)
                        {
                            if (!propertyValues.Contains(value))
                            {
                                propertyValues.Add(value);
                                AddPropertyChange(id, property, null, propertyValues);
                            }
                        }
                    }
                }
                else
                {
                    var value = GetValue(queryParameter, ref index);
                    if (value is null)
                    {
                        if (_componentProperties.TryGetValue(id, out var componentProperties)
                            && componentProperties.ContainsKey(property))
                        {
                            componentProperties.Remove(property);
                            AddPropertyChange(id, property, null, null);
                        }
                    }
                    else
                    {
                        if (!_componentProperties.TryGetValue(id, out var componentProperties))
                        {
                            componentProperties = [];
                            _componentProperties[id] = componentProperties;
                        }
                        if (!componentProperties.TryGetValue(property, out var propertyValues))
                        {
                            propertyValues = [];
                        }
                        if (!propertyValues.Contains(value))
                        {
                            propertyValues.Add(value);
                            AddPropertyChange(id, property, null, propertyValues);
                        }
                    }
                }
            }
        }

        void AddPropertyChange(string id, string property, string? value, List<string>? values)
        {
            if (!changes.TryGetValue(id, out var componentChanges))
            {
                componentChanges = [];
                changes[id] = componentChanges;
            }
            componentChanges[property] = new()
            {
                Value = value ?? values?.FirstOrDefault(),
                Values = values,
            };
        }

        static List<string>? GetCollection(string queryParameter, ref int index)
        {
            List<string>? values = null;
            if (queryParameter[index] == '-')
            {
                index++;
            }
            while (index < queryParameter.Length)
            {
                if (queryParameter[index] == '~')
                {
                    index++;
                    break;
                }

                var value = GetValue(queryParameter, ref index);
                if (value is not null)
                {
                    (values ??= []).Add(value);
                }
            }
            return values;
        }

        static string? GetValue(string queryParameter, ref int index)
        {
            var sb = new StringBuilder();
            while (index < queryParameter.Length)
            {
                if (queryParameter[index] == '~')
                {
                    index++;
                    break;
                }
                sb.Append(queryParameter[index++]);
            }
            return Unescape(sb.ToString());
        }
    }

    private void UpdateQuery(bool replace = true)
    {
        try
        {
            _navigationManager.NavigateTo(
                _navigationManager.GetUriWithQueryParameters(GetQueryParameter()),
                false,
                replace);
        }
        catch { } // may be thrown in non-interactive scenarios; ignore
    }
}
