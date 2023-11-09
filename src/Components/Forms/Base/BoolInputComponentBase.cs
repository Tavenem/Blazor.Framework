using Microsoft.AspNetCore.Components;

namespace Tavenem.Blazor.Framework.Components.Forms;

/// <summary>
/// A base class for input components which express a boolean state (possibly including a third
/// "null" or "indeterminate" state).
/// </summary>
public abstract class BoolInputComponentBase<TValue>
    : FormComponentBase<TValue>
{
    /// <summary>
    /// <para>
    /// Whether a <see langword="null"/> value can be set by interacting with the component.
    /// </para>
    /// <para>
    /// Only applies when <typeparamref name="TValue"/> is nullable <see cref="bool"/>?
    /// </para>
    /// </summary>
    /// <remarks>
    /// Even when this is <see langword="false"/>, if <typeparamref name="TValue"/> is nullable <see
    /// cref="bool"/>? then a <see langword="null"/> value can be assigned programmatically.
    /// </remarks>
    [Parameter] public bool AllowNull { get; set; }

    /// <summary>
    /// The current boolean value of this input.
    /// </summary>
    protected virtual bool? IsChecked => Value switch
    {
        null => null,
        bool b => b,
        IConvertible c => c.ToBoolean(null),
        var x => bool.TryParse(x.ToString(), out var s) && s,
    };

    /// <summary>
    /// Sets this input's value.
    /// </summary>
    /// <param name="value">
    /// <para>
    /// The new value.
    /// </para>
    /// <para>
    /// Assigning <see langword="null"/> to a <see cref="BoolInputComponentBase{TValue}"/> with a
    /// non-nullable type results in a value of <see langword="false"/>.
    /// </para>
    /// </param>
    public void SetValue(bool? value)
    {
        if (IsChecked == value
            || (typeof(TValue) == typeof(bool)
            && !value.HasValue
            && IsChecked == false))
        {
            return;
        }

        if (value is null)
        {
            if (NullableUnderlyingType is not null
                || !typeof(TValue).IsValueType)
            {
                CurrentValue = default;

                if (!IsTouched)
                {
                    SetTouchedDebounced();
                }

                if (!IsNested)
                {
                    EvaluateDebounced();
                }

                StateHasChanged();
                return;
            }
            else
            {
                value = false;
            }
        }

        var targetType = NullableUnderlyingType ?? typeof(TValue);
        if (targetType == typeof(bool))
        {
            CurrentValue = (TValue)(object)value.Value;
        }
        if (targetType == typeof(byte))
        {
            CurrentValue = (TValue)(object)(byte)(value.Value ? 1 : 0);
        }
        else if (targetType == typeof(decimal))
        {
            CurrentValue = (TValue)(object)(value.Value ? 1m : 0m);
        }
        else if (targetType == typeof(double))
        {
            CurrentValue = (TValue)(object)(value.Value ? 1.0 : 0.0);
        }
        else if (targetType == typeof(float))
        {
            CurrentValue = (TValue)(object)(value.Value ? 1f : 0f);
        }
        else if (targetType == typeof(int))
        {
            CurrentValue = (TValue)(object)(value.Value ? 1 : 0);
        }
        else if (targetType == typeof(long))
        {
            CurrentValue = (TValue)(object)(value.Value ? 1L : 0L);
        }
        else if (targetType == typeof(nint))
        {
            CurrentValue = (TValue)(object)(nint)(value.Value ? 1 : 0);
        }
        else if (targetType == typeof(nuint))
        {
            CurrentValue = (TValue)(object)(nuint)(value.Value ? 1 : 0);
        }
        else if (targetType == typeof(sbyte))
        {
            CurrentValue = (TValue)(object)(sbyte)(value.Value ? 1 : 0);
        }
        else if (targetType == typeof(short))
        {
            CurrentValue = (TValue)(object)(short)(value.Value ? 1 : 0);
        }
        else if (targetType == typeof(uint))
        {
            CurrentValue = (TValue)(object)(value.Value ? 1U : 0U);
        }
        else if (targetType == typeof(ulong))
        {
            CurrentValue = (TValue)(object)(value.Value ? 1UL : 0UL);
        }
        else if (targetType == typeof(ushort))
        {
            CurrentValue = (TValue)(object)(ushort)(value.Value ? 1 : 0);
        }
        else
        {
            return;
        }

        if (!IsTouched)
        {
            SetTouchedDebounced();
        }

        if (!IsNested)
        {
            EvaluateDebounced();
        }

        StateHasChanged();
    }

    /// <summary>
    /// Toggles this input's value.
    /// </summary>
    /// <remarks>
    /// <para>
    /// When <typeparamref name="TValue"/> is <see cref="bool"/>, switches between <see
    /// langword="true"/> and <see langword="false"/>.
    /// </para>
    /// <para>
    /// When <typeparamref name="TValue"/> is nullable <see cref="bool"/>? and <see
    /// cref="AllowNull"/> is <see langword="true"/>, cycles between <see langword="true"/>, <see
    /// langword="false"/>, and <see langword="null"/>.
    /// </para>
    /// </remarks>
    public void Toggle()
    {
        if (AllowNull)
        {
            if (Value is null)
            {
                SetValue(true);
            }
            else if (IsChecked == true)
            {
                SetValue(false);
            }
            else
            {
                SetValue(null);
            }
        }
        else if (IsChecked == true)
        {
            SetValue(false);
        }
        else
        {
            SetValue(true);
        }
    }
}
