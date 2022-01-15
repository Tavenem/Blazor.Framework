using System.Text;

namespace Tavenem.Blazor.Framework;

/// <summary>
/// <para>
/// Fluently build a CSS string from optional components.
/// </para>
/// <para>
/// Use <see cref="ToString"/> to return the full string.
/// </para>
/// </summary>
public class CssBuilder
{
    private readonly StringBuilder _builder = new();

    /// <summary>
    /// Initializes a new instance of <see cref="CssBuilder"/>.
    /// </summary>
    public CssBuilder() { }

    /// <summary>
    /// Initializes a new instance of <see cref="CssBuilder"/>.
    /// </summary>
    /// <param name="value">A starting value.</param>
    public CssBuilder(string? value)
    {
        if (!string.IsNullOrWhiteSpace(value))
        {
            _builder.Append(value);
        }
    }

    /// <summary>
    /// Adds a value. A space separator will be prepended automatically.
    /// </summary>
    /// <param name="value">The string to add.</param>
    /// <param name="when">
    /// The value is only added if this value is <see langword="true"/>.
    /// </param>
    /// <returns>This instance</returns>
    public CssBuilder Add(string? value, bool when = true)
    {
        if (!when || string.IsNullOrWhiteSpace(value))
        {
            return this;
        }

        if (_builder.Length > 0)
        {
            _builder.Append(' ');
        }
        _builder.Append(value);

        return this;
    }

    /// <summary>
    /// Adds a value. A space separator will be prepended automatically.
    /// </summary>
    /// <param name="value">The string to add.</param>
    /// <param name="when">
    /// The value is only added if this value is <see langword="true"/>.
    /// </param>
    /// <returns>This instance</returns>
    public CssBuilder Add(string? value, bool? when)
    {
        if (when != true || string.IsNullOrWhiteSpace(value))
        {
            return this;
        }

        if (_builder.Length > 0)
        {
            _builder.Append(' ');
        }
        _builder.Append(value);

        return this;
    }

    /// <summary>
    /// Adds a value. A space separator will be prepended automatically.
    /// </summary>
    /// <param name="value">The string to add.</param>
    /// <param name="when">
    /// The value is only added if this function returns <see langword="true"/>.
    /// </param>
    /// <returns>This instance</returns>
    public CssBuilder Add(string? value, Func<bool> when)
    {
        if (!when.Invoke() || string.IsNullOrWhiteSpace(value))
        {
            return this;
        }

        if (_builder.Length > 0)
        {
            _builder.Append(' ');
        }
        _builder.Append(value);

        return this;
    }

    /// <summary>
    /// Adds a value. A space separator will be prepended automatically.
    /// </summary>
    /// <param name="value">A function when returns the string to add.</param>
    /// <param name="when">
    /// The value is only added if this value is <see langword="true"/>.
    /// </param>
    /// <returns>This instance</returns>
    public CssBuilder Add(Func<string?> value, bool when = true)
    {
        if (!when)
        {
            return this;
        }

        var v = value.Invoke();
        if (string.IsNullOrWhiteSpace(v))
        {
            return this;
        }

        if (_builder.Length > 0)
        {
            _builder.Append(' ');
        }
        _builder.Append(v);

        return this;
    }

    /// <summary>
    /// Adds a value. A space separator will be prepended automatically.
    /// </summary>
    /// <param name="value">A function when returns the string to add.</param>
    /// <param name="when">
    /// The value is only added if this value is <see langword="true"/>.
    /// </param>
    /// <returns>This instance</returns>
    public CssBuilder Add(Func<string?> value, bool? when)
    {
        if (when != true)
        {
            return this;
        }

        var v = value.Invoke();
        if (string.IsNullOrWhiteSpace(v))
        {
            return this;
        }

        if (_builder.Length > 0)
        {
            _builder.Append(' ');
        }
        _builder.Append(v);

        return this;
    }

    /// <summary>
    /// Adds a value. A space separator will be prepended automatically.
    /// </summary>
    /// <param name="value">A function when returns the string to add.</param>
    /// <param name="when">
    /// The value is only added if this function returns <see langword="true"/>.
    /// </param>
    /// <returns>This instance</returns>
    public CssBuilder Add(Func<string?> value, Func<bool> when)
    {
        if (!when.Invoke())
        {
            return this;
        }

        var v = value.Invoke();
        if (string.IsNullOrWhiteSpace(v))
        {
            return this;
        }

        if (_builder.Length > 0)
        {
            _builder.Append(' ');
        }
        _builder.Append(v);

        return this;
    }

    /// <summary>
    /// Appends a second <see cref="CssBuilder"/> instance to this one. A space
    /// separator will be prepended automatically.
    /// </summary>
    /// <param name="value">The other instance.</param>
    /// <param name="when">
    /// The value is only added if this value is <see langword="true"/>.
    /// </param>
    /// <returns>This instance</returns>
    public CssBuilder Add(CssBuilder value, bool when = true)
        => Add(value, ' ', when);

    /// <summary>
    /// Appends a second <see cref="CssBuilder"/> instance to this one. A space
    /// separator will be prepended automatically.
    /// </summary>
    /// <param name="value">The other instance.</param>
    /// <param name="when">
    /// The value is only added if this value is <see langword="true"/>.
    /// </param>
    /// <returns>This instance</returns>
    public CssBuilder Add(CssBuilder value, bool? when)
        => Add(value, ' ', when);

    /// <summary>
    /// Appends a second <see cref="CssBuilder"/> instance to this one. A space
    /// separator will be prepended automatically.
    /// </summary>
    /// <param name="value">The other instance.</param>
    /// <param name="when">
    /// The value is only added if this function returns <see langword="true"/>.
    /// </param>
    /// <returns>This instance</returns>
    public CssBuilder Add(CssBuilder value, Func<bool> when)
        => Add(value, ' ', when);

    /// <summary>
    /// Adds any value found in a dictionary with the key "class".
    /// </summary>
    /// <param name="dictionary">A <see cref="string"/>-<see cref="object"/> dictionary.</param>
    /// <returns>This instance.</returns>
    /// <remarks>
    /// The <see cref="object.ToString"/> method is called on the value to obtain the string to add.
    /// </remarks>
    public CssBuilder AddClassFromDictionary(IReadOnlyDictionary<string, object>? dictionary)
        => dictionary?.TryGetValue("class", out var value) == true
        ? Add(value.ToString())
        : this;

    /// <summary>
    /// Adds a CSS style. A semicolor separator will be prepended automatically.
    /// </summary>
    /// <param name="prop">The style property to add.</param>
    /// <param name="value">The style value to add.</param>
    /// <param name="when">
    /// The value is only added if this value is <see langword="true"/>.
    /// </param>
    /// <returns>This instance</returns>
    /// <remarks>
    /// The style will not be added if either the <paramref name="prop"/> or
    /// <paramref name="value"/> is empty.
    /// </remarks>
    public CssBuilder AddStyle(string? prop, string? value, bool when = true)
    {
        if (!when
            || string.IsNullOrWhiteSpace(prop)
            || string.IsNullOrWhiteSpace(value))
        {
            return this;
        }

        if (_builder.Length > 0)
        {
            _builder.Append(';');
        }
        _builder.Append(prop)
            .Append(':')
            .Append(value);

        return this;
    }

    /// <summary>
    /// Adds a value. A space separator will be prepended automatically.
    /// </summary>
    /// <param name="prop">The style property to add.</param>
    /// <param name="value">The string to add.</param>
    /// <param name="when">
    /// The value is only added if this value is <see langword="true"/>.
    /// </param>
    /// <returns>This instance</returns>
    /// <remarks>
    /// The style will not be added if either the <paramref name="prop"/> or
    /// <paramref name="value"/> is empty.
    /// </remarks>
    public CssBuilder AddStyle(string? prop, string? value, bool? when)
    {
        if (when != true
            || string.IsNullOrWhiteSpace(prop)
            || string.IsNullOrWhiteSpace(value))
        {
            return this;
        }

        if (_builder.Length > 0)
        {
            _builder.Append(';');
        }
        _builder.Append(prop)
            .Append(':')
            .Append(value);

        return this;
    }

    /// <summary>
    /// Adds a value. A space separator will be prepended automatically.
    /// </summary>
    /// <param name="prop">The style property to add.</param>
    /// <param name="value">The string to add.</param>
    /// <param name="when">
    /// The value is only added if this function returns <see langword="true"/>.
    /// </param>
    /// <returns>This instance</returns>
    /// <remarks>
    /// The style will not be added if either the <paramref name="prop"/> or
    /// <paramref name="value"/> is empty.
    /// </remarks>
    public CssBuilder AddStyle(string? prop, string? value, Func<bool> when)
    {
        if (!when.Invoke()
            || string.IsNullOrWhiteSpace(prop)
            || string.IsNullOrWhiteSpace(value))
        {
            return this;
        }

        if (_builder.Length > 0)
        {
            _builder.Append(';');
        }
        _builder.Append(prop)
            .Append(':')
            .Append(value);

        return this;
    }

    /// <summary>
    /// Adds a value. A space separator will be prepended automatically.
    /// </summary>
    /// <param name="prop">The style property to add.</param>
    /// <param name="value">A function when returns the string to add.</param>
    /// <param name="when">
    /// The value is only added if this value is <see langword="true"/>.
    /// </param>
    /// <returns>This instance</returns>
    /// <remarks>
    /// The style will not be added if either the <paramref name="prop"/> or
    /// <paramref name="value"/> is empty.
    /// </remarks>
    public CssBuilder AddStyle(string? prop, Func<string?> value, bool when = true)
    {
        if (!when || string.IsNullOrWhiteSpace(prop))
        {
            return this;
        }

        var v = value.Invoke();
        if (string.IsNullOrWhiteSpace(v))
        {
            return this;
        }

        if (_builder.Length > 0)
        {
            _builder.Append(';');
        }
        _builder.Append(prop)
            .Append(':')
            .Append(v);

        return this;
    }

    /// <summary>
    /// Adds a value. A space separator will be prepended automatically.
    /// </summary>
    /// <param name="prop">The style property to add.</param>
    /// <param name="value">A function when returns the string to add.</param>
    /// <param name="when">
    /// The value is only added if this value is <see langword="true"/>.
    /// </param>
    /// <returns>This instance</returns>
    /// <remarks>
    /// The style will not be added if either the <paramref name="prop"/> or
    /// <paramref name="value"/> is empty.
    /// </remarks>
    public CssBuilder AddStyle(string? prop, Func<string?> value, bool? when)
    {
        if (when != true || string.IsNullOrWhiteSpace(prop))
        {
            return this;
        }

        var v = value.Invoke();
        if (string.IsNullOrWhiteSpace(v))
        {
            return this;
        }

        if (_builder.Length > 0)
        {
            _builder.Append(';');
        }
        _builder.Append(prop)
            .Append(':')
            .Append(v);

        return this;
    }

    /// <summary>
    /// Adds a value. A space separator will be prepended automatically.
    /// </summary>
    /// <param name="prop">The style property to add.</param>
    /// <param name="value">A function when returns the string to add.</param>
    /// <param name="when">
    /// The value is only added if this function returns <see langword="true"/>.
    /// </param>
    /// <returns>This instance</returns>
    /// <remarks>
    /// The style will not be added if either the <paramref name="prop"/> or
    /// <paramref name="value"/> is empty.
    /// </remarks>
    public CssBuilder AddStyle(string? prop, Func<string?> value, Func<bool> when)
    {
        if (!when.Invoke() || string.IsNullOrWhiteSpace(prop))
        {
            return this;
        }

        var v = value.Invoke();
        if (string.IsNullOrWhiteSpace(v))
        {
            return this;
        }

        if (_builder.Length > 0)
        {
            _builder.Append(';');
        }
        _builder.Append(prop)
            .Append(':')
            .Append(v);

        return this;
    }

    /// <summary>
    /// Appends a second <see cref="CssBuilder"/> instance to this one. A
    /// semicolon separator will be prepended automatically.
    /// </summary>
    /// <param name="value">The other instance.</param>
    /// <param name="when">
    /// The value is only added if this value is <see langword="true"/>.
    /// </param>
    /// <returns>This instance</returns>
    public CssBuilder AddStyle(CssBuilder value, bool when = true)
        => Add(value, ';', when);

    /// <summary>
    /// Appends a second <see cref="CssBuilder"/> instance to this one. A
    /// semicolon separator will be prepended automatically.
    /// </summary>
    /// <param name="value">The other instance.</param>
    /// <param name="when">
    /// The value is only added if this value is <see langword="true"/>.
    /// </param>
    /// <returns>This instance</returns>
    public CssBuilder AddStyle(CssBuilder value, bool? when)
        => Add(value, ';', when);

    /// <summary>
    /// Appends a second <see cref="CssBuilder"/> instance to this one. A
    /// semicolon separator will be prepended automatically.
    /// </summary>
    /// <param name="value">The other instance.</param>
    /// <param name="when">
    /// The value is only added if this function returns <see langword="true"/>.
    /// </param>
    /// <returns>This instance</returns>
    public CssBuilder AddStyle(CssBuilder value, Func<bool> when)
        => Add(value, ';', when);

    /// <summary>
    /// Adds any value found in a dictionary with the key "style".
    /// </summary>
    /// <param name="dictionary">A <see cref="string"/>-<see cref="object"/> dictionary.</param>
    /// <returns>This instance.</returns>
    /// <remarks>
    /// The <see cref="object.ToString"/> method is called on the value to obtain the string to add.
    /// </remarks>
    public CssBuilder AddStyleFromDictionary(IReadOnlyDictionary<string, object>? dictionary)
    {
        if (dictionary?.TryGetValue("style", out var value) != true)
        {
            return this;
        }

        var v = value?.ToString();
        if (string.IsNullOrWhiteSpace(v))
        {
            return this;
        }

        if (_builder.Length > 0)
        {
            _builder.Append(';');
        }
        _builder.Append(v);

        return this;
    }

    /// <summary>
    /// Returns the current complete string.
    /// </summary>
    /// <returns>A <see cref="string"/>.</returns>
    /// <remarks>
    /// It is possible to continue using this <see cref="CssBuilder"/> instance after calling
    /// this method, and to call it again to obtain the new value.
    /// </remarks>
    public override string ToString() => _builder.ToString();

    private CssBuilder Add(CssBuilder value, char separator, bool when = true)
    {
        if (!when || value._builder.Length == 0)
        {
            return this;
        }

        if (_builder.Length > 0)
        {
            _builder.Append(separator);
        }
        _builder.Append(value._builder);

        return this;
    }

    private CssBuilder Add(CssBuilder value, char separator, bool? when)
    {
        if (when != true || value._builder.Length == 0)
        {
            return this;
        }

        if (_builder.Length > 0)
        {
            _builder.Append(separator);
        }
        _builder.Append(value._builder);

        return this;
    }

    private CssBuilder Add(CssBuilder value, char separator, Func<bool> when)
    {
        if (!when.Invoke() || value._builder.Length == 0)
        {
            return this;
        }

        if (_builder.Length > 0)
        {
            _builder.Append(separator);
        }
        _builder.Append(value._builder);

        return this;
    }
}
