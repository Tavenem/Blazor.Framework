using System.Collections;
using System.Diagnostics.CodeAnalysis;

namespace Tavenem.Blazor.Framework;

/// <summary>
/// A set of parameters to pass to a dialog.
/// </summary>
public class DialogParameters : IEnumerable<KeyValuePair<string, object>>
{
    internal Dictionary<string, object?> _parameters = [];

    /// <summary>
    /// Accesses the elements of the parameter set by name.
    /// </summary>
    /// <param name="parameterName">A parameter name.</param>
    public object? this[string parameterName]
    {
        get => Get(parameterName);
        set => _parameters[parameterName] = value;
    }

    /// <summary>
    /// The number of parameters contained in the set.
    /// </summary>
    public int Count => _parameters.Count;

    /// <summary>
    /// Adds the given value to the set of parameters.
    /// </summary>
    /// <param name="name">The name of the parameter.</param>
    /// <param name="value">The value of the parameter.</param>
    /// <returns>This instance.</returns>
    public DialogParameters Add(string name, object? value)
    {
        _parameters.Add(name, value);
        return this;
    }

    /// <summary>
    /// Gets the parameter with the given name.
    /// </summary>
    /// <param name="name">The name of the parameter to get.</param>
    /// <returns>
    /// The parameter with the given name. Or <see langword="null"/>, if there
    /// is no such parameter.
    /// </returns>
    public object? Get(string name) => _parameters.TryGetValue(name, out var value)
        ? value
        : null;

    /// <summary>
    /// Gets the parameter with the given name.
    /// </summary>
    /// <typeparam name="T">The type of the parameter to get.</typeparam>
    /// <param name="name">The name of the parameter to get.</param>
    /// <returns>
    /// The parameter with the given name. Or a <c>default</c> value, if there
    /// is no such parameter.
    /// </returns>
    public T? Get<T>(string name) => _parameters.TryGetValue(name, out var value)
        && value is T t
        ? t
        : default;

    /// <summary>
    /// Returns an enumerator that iterates through the collection.
    /// </summary>
    /// <returns>
    /// An enumerator that can be used to iterate through the collection.
    /// </returns>
    public IEnumerator<KeyValuePair<string, object>> GetEnumerator()
        => _parameters.GetEnumerator();

    /// <summary>
    /// Returns an enumerator that iterates through the collection.
    /// </summary>
    /// <returns>
    /// An enumerator that can be used to iterate through the collection.
    /// </returns>
    IEnumerator IEnumerable.GetEnumerator()
        => _parameters.GetEnumerator();

    /// <summary>
    /// Gets the parameter with the given name.
    /// </summary>
    /// <typeparam name="T">The type of the parameter to get.</typeparam>
    /// <param name="name">The name of the parameter to get.</param>
    /// <param name="value">
    /// The parameter with the given name. Or a <c>default</c> value, if there
    /// is no such parameter.
    /// </param>
    /// <returns>
    /// <see langword="true"/> if a parameter with the given name exists and is
    /// of the given type; otherwise <see langword="false"/>.
    /// </returns>
    public bool TryGet<T>(string name, [NotNullWhen(true)] out T? value)
    {
        if (_parameters.TryGetValue(name, out var v)
            && v is T t)
        {
            value = t;
            return true;
        }
        value = default;
        return false;
    }
}