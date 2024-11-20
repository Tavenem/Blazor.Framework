using Microsoft.AspNetCore.Components;
using System.Globalization;
using Tavenem.Blazor.Framework.Components.Forms;
using Tavenem.Blazor.Framework.Services;

namespace Tavenem.Blazor.Framework;

/// <summary>
/// A picker for date and/or time values.
/// </summary>
/// <typeparam name="TValue">
/// <para>
/// The type of bound value. May be a <see cref="string"/>, <see cref="DateTime"/>, <see
/// cref="System.DateTimeOffset"/>, <see cref="DateOnly"/>, or <see cref="TimeOnly"/> (including
/// nullable versions).
/// </para>
/// <para>
/// When binding to a string, anything which can be parsed as a <see cref="System.DateTimeOffset"/>
/// is accepted as input.
/// </para>
/// <para>
/// The string returned depends on the <see cref="DateType"/> parameter:
/// <list type="bullet">
/// <item>
/// <term><see cref="DateType.Year"/></term>
/// <description>
/// yyyy
/// </description>
/// </item>
/// <item>
/// <term><see cref="DateType.Month"/></term>
/// <description>
/// yyyy-MM
/// </description>
/// </item>
/// <item>
/// <term><see cref="DateType.Week"/></term>
/// <description>
/// yyyy-W{<see cref="Calendar.GetWeekOfYear(DateTime, CalendarWeekRule, DayOfWeek)"/>}
/// </description>
/// </item>
/// <item>
/// <term><see cref="DateType.Date"/></term>
/// <description>
/// When <see cref="ShowTime"/> is <see langword="true"/>: s; when it is <see langword="false"/>: yyyy-MM-dd
/// </description>
/// </item>
/// <item>
/// <term><see cref="DateType.None"/></term>
/// <description>
/// When <see cref="ShowTime"/> is <see langword="true"/>: HH:mm. When it is <see langword="false"/>: s
/// </description>
/// </item>
/// </list>
/// </para>
/// </typeparam>
public partial class DateTimeInput<TValue> : PickerComponentBase<TValue>
{
    private static IReadOnlyCollection<TimeZoneInfo>? _TimeZones;

    private readonly Type _baseType;
    private readonly Type? _nullableType;

    /// <summary>
    /// <para>
    /// The calendar to use (as a value supported by the <a
    /// href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/DateTimeFormat">Intl.DateTimeFormat</a>
    /// object in the user's browser.
    /// </para>
    /// <para>
    /// When left null (the default) the browser's own default is used, typically based on the
    /// current locale (usually "gregory", i.e. the Gregorian calendar).
    /// </para>
    /// </summary>
    /// <remarks>
    /// If <see cref="Culture"/> is set the default calendar for that culture will be used.
    /// </remarks>
    [Parameter] public string? Calendar { get; set; }

    /// <summary>
    /// <para>
    /// The converter used to convert bound values to HTML input element values, and vice versa.
    /// </para>
    /// <para>
    /// Built-in input components have reasonable default converters for most data types, but you
    /// can supply your own for custom data.
    /// </para>
    /// </summary>
    [Parameter] public InputValueConverter<TValue>? Converter { get; set; }

    /// <summary>
    /// <para>
    /// The <see cref="CultureInfo"/> to use.
    /// </para>
    /// <para>
    /// Default is <see cref="CultureInfo.CurrentCulture"/>.
    /// </para>
    /// </summary>
    [Parameter] public CultureInfo Culture { get; set; }

    /// <summary>
    /// <para>
    /// The type of date information to set.
    /// </para>
    /// <para>
    /// Default is <see cref="DateType.Date"/>.
    /// </para>
    /// <para>
    /// This property is ignored if the type of <typeparamref name="TValue"/> is <see
    /// cref="TimeOnly"/>, or <see cref="ShowTime"/> is <see langword="true"/>.
    /// </para>
    /// </summary>
    [Parameter] public DateType DateType { get; set; } = DateType.Date;

    /// <summary>
    /// <para>
    /// The way a picker's activator should be displayed.
    /// </para>
    /// <para>
    /// Defaults to <see cref="PickerDisplayType.Field"/>.
    /// </para>
    /// </summary>
    [Parameter] public PickerDisplayType DisplayType { get; set; }

    /// <summary>
    /// <para>
    /// The maximum allowed <see cref="DateTime"/>.
    /// </para>
    /// <para>
    /// Default is the maximum date for the selected calendar.
    /// </para>
    /// <para>
    /// When the type of <typeparamref name="TValue"/> is <see cref="TimeOnly"/> only the <see
    /// cref="DateTime.TimeOfDay"/> portion is considered.
    /// </para>
    /// <para>
    /// When the type of <typeparamref name="TValue"/> is <see cref="DateOnly"/> or <see
    /// cref="ShowTime"/> is <see langword="false"/>, only the <see cref="DateTime.Date"/> portion
    /// is considered.
    /// </para>
    /// </summary>
    [Parameter] public DateTime Max { get; set; } = DateTime.MaxValue;

    /// <summary>
    /// <para>
    /// The minimum allowed <see cref="DateTime"/>.
    /// </para>
    /// <para>
    /// Default is the minimum date for the selected calendar.
    /// </para>
    /// <para>
    /// When the type of <typeparamref name="TValue"/> is <see cref="TimeOnly"/> only the <see
    /// cref="DateTime.TimeOfDay"/> portion is considered.
    /// </para>
    /// <para>
    /// When the type of <typeparamref name="TValue"/> is <see cref="DateOnly"/> or <see
    /// cref="ShowTime"/> is <see langword="false"/>, only the <see cref="DateTime.Date"/> portion
    /// is considered.
    /// </para>
    /// </summary>
    [Parameter] public DateTime Min { get; set; }

    /// <summary>
    /// <para>
    /// Whether to show a select for various calendar types (i.e. other than Gregorian).
    /// </para>
    /// <para>
    /// Default is <see langword="false"/>.
    /// </para>
    /// <para>
    /// This property is ignored if the type of <typeparamref name="TValue"/> is <see
    /// cref="TimeOnly"/>, or if the value of <see cref="DateType"/> is <see cref="DateType.None"/>.
    /// </para>
    /// </summary>
    [Parameter] public bool ShowCalendar { get; set; }

    /// <summary>
    /// <para>
    /// Whether to show seconds in the time picker and in displayed times.
    /// </para>
    /// <para>
    /// Default is <see langword="false"/>.
    /// </para>
    /// <para>
    /// This property is ignored if the type of <typeparamref name="TValue"/> is <see
    /// cref="DateOnly"/>, if the value of <see cref="DateType"/> is <see cref="DateType.Year"/>,
    /// <see cref="DateType.Week"/>, or <see cref="DateType.Month"/>, or if <see cref="ShowTime"/>
    /// is <see langword="false"/>.
    /// </para>
    /// </summary>
    [Parameter] public bool ShowSeconds { get; set; }

    /// <summary>
    /// <para>
    /// Whether to show the time picker, and include a time component in the bound data.
    /// </para>
    /// <para>
    /// Default is <see langword="false"/>.
    /// </para>
    /// <para>
    /// This property is ignored if the type of <typeparamref name="TValue"/> is <see
    /// cref="DateOnly"/> or <see cref="TimeOnly"/>, or if the value of <see cref="DateType"/> is
    /// <see cref="DateType.Year"/>, <see cref="DateType.Week"/>, or <see cref="DateType.Month"/>.
    /// </para>
    /// </summary>
    [Parameter] public bool ShowTime { get; set; }

    /// <summary>
    /// <para>
    /// Whether to show the timezone picker, and include a timezone component in the bound data.
    /// </para>
    /// <para>
    /// Default is <see langword="false"/>.
    /// </para>
    /// <para>
    /// This property is ignored if the type of <typeparamref name="TValue"/> is <see
    /// cref="DateOnly"/> or <see cref="TimeOnly"/>, or if the value of <see cref="DateType"/> is
    /// not <see cref="DateType.Date"/>.
    /// </para>
    /// </summary>
    [Parameter] public bool ShowTimeZone { get; set; }

    /// <summary>
    /// <para>
    /// The IANA time zone identifier used for values set by this component.
    /// </para>
    /// <para>
    /// If <see cref="ShowTimeZone"/> is <see langword="true"/>, this can be selected by the user.
    /// </para>
    /// </summary>
    /// <remarks>
    /// If left <see langword="null"/> and an IANA id can be obtained from <see
    /// cref="TimeZoneInfo"/>, that will be used.
    /// </remarks>
    [Parameter] public string? TimeZone { get; set; }

    /// <summary>
    /// <para>
    /// The time zone used for values set by this component.
    /// </para>
    /// <para>
    /// Defaults to the system's local time zone when <typeparamref name="TValue"/> is <see
    /// cref="DateTimeOffset"/>.
    /// </para>
    /// </summary>
    [Parameter] public TimeZoneInfo? TimeZoneInfo { get; set; }

    /// <inheritdoc/>
    protected override string? CssClass => new CssBuilder(Class)
        .AddClassFromDictionary(AdditionalAttributes)
        .Add("clearable", ShowClear)
        .Add("clearable-readonly", ShowClear)
        .Add(ThemeColor.ToCSS())
        .ToString();

    private string AMString => Culture.DateTimeFormat.AMDesignator;

    private Calendar CultureCalendar => Culture.DateTimeFormat.Calendar;

    private bool HasDate => !OnlyTime && (OnlyDate || !ShowTime || DateType != DateType.None);

    private bool HasTime => !OnlyDate && (OnlyTime || (ShowTime && DateType is DateType.None or DateType.Date));

    private bool IsCalendarShown => ShowCalendar
        && HasDate
        && _baseType != typeof(TimeOnly);

    private bool IsSecondsShown => ShowSeconds
        && HasTime
        && _baseType != typeof(DateOnly);

    private bool IsTimeZoneShown => ShowTimeZone
        && HasTime
        && (_baseType == typeof(string)
        || _baseType == typeof(DateTimeOffset));

    private bool IsTwelveHour => Culture.DateTimeFormat.LongTimePattern.Contains('h');

    private string MaxString
    {
        get
        {
            if (HasTime)
            {
                if (HasDate)
                {
                    return Max.ToString("O", CultureInfo.InvariantCulture);
                }
                return Max.TimeOfDay.ToString("HH':'mm':'ss", CultureInfo.InvariantCulture);
            }
            return Max.ToString("yyyy'-'MM'-'dd", CultureInfo.InvariantCulture);
        }
    }

    private string MinString
    {
        get
        {
            if (HasTime)
            {
                if (HasDate)
                {
                    return Min.ToString("O", CultureInfo.InvariantCulture);
                }
                return Min.TimeOfDay.ToString("HH':'mm':'ss", CultureInfo.InvariantCulture);
            }
            return Min.ToString("yyyy'-'MM'-'dd", CultureInfo.InvariantCulture);
        }
    }

    private bool OnlyDate { get; set; }

    private bool OnlyTime { get; set; }

    private string PMString => Culture.DateTimeFormat.PMDesignator;

    private DateType ResolvedDateType => HasTime ? DateType.Date : DateType;

    private string TimeSeparator => Culture.DateTimeFormat.TimeSeparator;

    private string? TimeZoneIanaId
    {
        get
        {
            if (!string.IsNullOrWhiteSpace(TimeZone))
            {
                return TimeZone;
            }
            if (TimeZoneInfo?.HasIanaId == true)
            {
                return TimeZoneInfo.Id;
            }
            if (TimeZoneInfo is not null
                && TimeZoneInfo.TryConvertWindowsIdToIanaId(TimeZoneInfo.Id, out var id))
            {
                return id;
            }
            return null;
        }
    }

    /// <summary>
    /// Constructs a new instance of <see cref="DateTimeInput{TValue}"/>.
    /// </summary>
    public DateTimeInput()
    {
        _nullableType = Nullable.GetUnderlyingType(typeof(TValue));
        _baseType = _nullableType ?? typeof(TValue);
        if (_baseType != typeof(string)
            && _baseType != typeof(DateTime)
            && _baseType != typeof(DateTimeOffset)
            && _baseType != typeof(DateOnly)
            && _baseType != typeof(TimeOnly))
        {
            throw new InvalidOperationException($"Type {_baseType.Name} is not supported. Only string, System.DateTime, System.DateTimeOffset, System.DateOnly, and System.TimeOnly are supported.");
        }

        if (_baseType == typeof(DateOnly))
        {
            OnlyDate = true;
        }
        else if (_baseType == typeof(TimeOnly))
        {
            OnlyTime = true;
        }

        Clearable = _nullableType is not null
            || _baseType == typeof(string);

        if (_baseType == typeof(DateTimeOffset))
        {
            try
            {
                _TimeZones ??= TimeZoneInfo.GetSystemTimeZones();
            }
            catch
            {
                _TimeZones = [];
            }
            TimeZoneInfo = TimeZoneInfo.Local;
        }

        Culture = CultureInfo.CurrentCulture;
        SetCulture();

        if (!Clearable)
        {
            SetValue();
        }
    }

    /// <inheritdoc/>
    public override async Task SetParametersAsync(ParameterView parameters)
    {
        if (parameters.TryGetValue<CultureInfo>(nameof(Culture), out var culture)
            && culture != Culture)
        {
            Culture = culture;
            SetCulture();
        }

        if (parameters.TryGetValue<TValue>(
            nameof(Value),
            out var value)
            && ((value is null) != (Value is null)
                || value?.Equals(Value) == false))
        {
            if (value is DateTimeOffset dto)
            {
                if (TimeZoneInfo.Local.BaseUtcOffset == dto.Offset)
                {
                    TimeZoneInfo = TimeZoneInfo.Local;
                }
                else if (_TimeZones?.FirstOrDefault(x => x.BaseUtcOffset == dto.Offset) is TimeZoneInfo tz)
                {
                    TimeZoneInfo = tz;
                }
            }
            else if (value is string str
                && DateTimeOffset.TryParse(str, out var strDto)
                && (TimeZoneInfo?.BaseUtcOffset.Ticks != 0
                || strDto.Offset.Ticks != 0))
            {
                if (TimeZoneInfo.Local.BaseUtcOffset == strDto.Offset)
                {
                    TimeZoneInfo = TimeZoneInfo.Local;
                }
                else if (_TimeZones?.FirstOrDefault(x => x.BaseUtcOffset == strDto.Offset) is TimeZoneInfo tz)
                {
                    TimeZoneInfo = tz;
                }
            }
        }

        await base.SetParametersAsync(parameters);

        FormatProvider ??= Culture;
    }

    /// <inheritdoc/>
    protected override void OnParametersSet()
    {
        base.OnParametersSet();

        if (Converter is not null)
        {
            if (Format?.Equals(Converter.Format) != true)
            {
                Converter.Format = Format;
            }
            if (FormatProvider?.Equals(Converter.FormatProvider) != true)
            {
                Converter.FormatProvider = FormatProvider;
            }
        }
    }

    /// <summary>
    /// <para>
    /// Clears the current selected value.
    /// </para>
    /// <para>
    /// If the bound type is non-nullable, this may set the default value.
    /// </para>
    /// </summary>
    public override Task ClearAsync()
    {
        if (!Disabled && !ReadOnly)
        {
            SetValue(null);
        }

        return Task.CompletedTask;
    }

    /// <inheritdoc/>
    protected override string? FormatValueAsString(TValue? value)
    {
        if (Converter is not null
            && Converter.TrySetValue(value, out var input))
        {
            return input;
        }

        if (value is null)
        {
            return null;
        }
        if (value is DateOnly dateOnly)
        {
            return dateOnly.ToString("yyyy'-'MM'-'dd", CultureInfo.InvariantCulture);
        }
        if (value is TimeOnly timeOnly)
        {
            return ShowSeconds
                ? timeOnly.ToString("HH':'mm':'ss", CultureInfo.InvariantCulture)
                : timeOnly.ToString("HH':'mm", CultureInfo.InvariantCulture);
        }
        if (value is DateTime dateTime)
        {
            return DateType switch
            {
                DateType.Year => dateTime.ToString("yyyy", CultureInfo.InvariantCulture),
                DateType.Month => dateTime.ToString("yyyy'-'MM", CultureInfo.InvariantCulture),
                DateType.Week => $"{dateTime.ToString("yyyy", CultureInfo.InvariantCulture)}'-'W{CultureCalendar.GetWeekOfYear(dateTime, Culture.DateTimeFormat.CalendarWeekRule, Culture.DateTimeFormat.FirstDayOfWeek)}",
                DateType.Date => ShowTime
                    ? dateTime.ToString("s", CultureInfo.InvariantCulture)
                    : dateTime.ToString("yyyy'-'MM'-'dd", CultureInfo.InvariantCulture),
                _ => ShowTime
                    ? dateTime.ToString(ShowSeconds ? "HH':'mm':'ss" : "HH':'mm", CultureInfo.InvariantCulture)
                    : dateTime.ToString("s", CultureInfo.InvariantCulture),
            };
        }
        if (value is DateTimeOffset dateTimeOffset)
        {
            return DateType switch
            {
                DateType.Year => dateTimeOffset.ToString("yyyy", CultureInfo.InvariantCulture),
                DateType.Month => dateTimeOffset.ToString("yyyy'-'MM", CultureInfo.InvariantCulture),
                DateType.Week => $"{dateTimeOffset.ToString("yyyy", CultureInfo.InvariantCulture)}'-'W{CultureCalendar.GetWeekOfYear(dateTimeOffset.DateTime, Culture.DateTimeFormat.CalendarWeekRule, Culture.DateTimeFormat.FirstDayOfWeek)}",
                DateType.Date => ShowTime
                    ? dateTimeOffset.ToString("s", CultureInfo.InvariantCulture)
                    : dateTimeOffset.ToString("yyyy'-'MM'-'dd", CultureInfo.InvariantCulture),
                _ => ShowTime
                    ? dateTimeOffset.ToString(ShowSeconds ? "HH':'mm':'ss" : "HH':'mm", CultureInfo.InvariantCulture)
                    : dateTimeOffset.ToString("s", CultureInfo.InvariantCulture),
            };
        }
        if (value is string str
            && DateTimeOffset.TryParse(str, out var dto))
        {
            return DateType switch
            {
                DateType.Year => dto.ToString("yyyy", CultureInfo.InvariantCulture),
                DateType.Month => dto.ToString("yyyy'-'MM", CultureInfo.InvariantCulture),
                DateType.Week => $"{dto.ToString("yyyy", CultureInfo.InvariantCulture)}'-'W{CultureCalendar.GetWeekOfYear(dto.DateTime, Culture.DateTimeFormat.CalendarWeekRule, Culture.DateTimeFormat.FirstDayOfWeek)}",
                DateType.Date => ShowTime
                    ? dto.ToString("s", CultureInfo.InvariantCulture)
                    : dto.ToString("yyyy'-'MM'-'dd", CultureInfo.InvariantCulture),
                _ => ShowTime
                    ? dto.ToString(ShowSeconds ? "HH':'mm':'ss" : "HH':'mm", CultureInfo.InvariantCulture)
                    : dto.ToString("s", CultureInfo.InvariantCulture),
            };
        }
        else
        {
            return base.FormatValueAsString(value);
        }
    }

    private void OnValueChange(ValueChangeEventArgs e)
    {
        var previousValue = CurrentValue;
        SetValue(e.Value);

        if (!IsNested
            && !EqualityComparer<TValue>.Default.Equals(previousValue, CurrentValue))
        {
            EvaluateDebounced();
        }

        StateHasChanged();
    }

    private void SetCulture()
    {
        if (string.IsNullOrEmpty(Calendar))
        {
            Calendar = Culture.Calendar switch
            {
                GregorianCalendar => "gregory",
                ThaiBuddhistCalendar => "buddhist",
                HebrewCalendar => "hebrew",
                HijriCalendar => "islamic-civil",
                UmAlQuraCalendar => "islamic-umalqura",
                JapaneseCalendar => "japanese",
                PersianCalendar => "persian",
                TaiwanCalendar => "roc",
                _ => null,
            };
        }
    }

    private void SetValue(string? value = null)
    {
        TValue? newValue;
        if (string.IsNullOrWhiteSpace(value))
        {
            newValue = default;
        }
        else if (_baseType == typeof(string))
        {
            newValue = (TValue)(object)value;
        }
        else if (_baseType == typeof(DateTime))
        {
            var truncated = value.EndsWith(']') && value.Contains('[')
                    ? value[..value.IndexOf('[')]
                    : value;
            if (DateTime.TryParseExact(
                truncated,
                "yyyy'-'MM'-'dd'T'HH':'mm':'ss.FFFFFFFK",
                CultureInfo.InvariantCulture,
                DateTimeStyles.RoundtripKind,
                out var result))
            {
                newValue = (TValue)(object)result;
            }
            else if (DateTime.TryParseExact(
                truncated,
                "yyyy'-'MM'-'dd",
                CultureInfo.InvariantCulture,
                DateTimeStyles.RoundtripKind,
                out var dateOnlyResult))
            {
                newValue = (TValue)(object)dateOnlyResult;
            }
            else
            {
                newValue = default;
            }
        }
        else if (_baseType == typeof(DateTimeOffset))
        {
            var truncated = value.EndsWith(']') && value.Contains('[')
                    ? value[..value.IndexOf('[')]
                    : value;
            if (DateTimeOffset.TryParseExact(
                truncated,
                "yyyy'-'MM'-'dd'T'HH':'mm':'ss.FFFFFFFzzz",
                CultureInfo.InvariantCulture,
                DateTimeStyles.RoundtripKind,
                out var result))
            {
                newValue = (TValue)(object)result;
            }
            else if (DateTimeOffset.TryParseExact(
                truncated,
                "yyyy'-'MM'-'dd",
                CultureInfo.InvariantCulture,
                DateTimeStyles.RoundtripKind,
                out var dateOnlyResult))
            {
                newValue = (TValue)(object)dateOnlyResult;
            }
            else
            {
                newValue = default;
            }
        }
        else if (_baseType == typeof(DateOnly))
        {
            if (DateOnly.TryParseExact(
                value,
                "yyyy'-'MM'-'dd",
                CultureInfo.InvariantCulture,
                DateTimeStyles.RoundtripKind,
                out var result1))
            {
                newValue = (TValue)(object)result1;
            }
            else if (DateTimeOffset.TryParseExact(
                value.EndsWith(']') && value.Contains('[')
                    ? value[..value.IndexOf('[')]
                    : value,
                "yyyy'-'MM'-'dd'T'HH':'mm':'ss.FFFFFFFzzz",
                CultureInfo.InvariantCulture,
                DateTimeStyles.RoundtripKind,
                out var result2))
            {
                newValue = (TValue)(object)DateOnly.FromDateTime(result2.DateTime);
            }
            else
            {
                newValue = default;
            }
        }
        else if (_baseType == typeof(TimeOnly))
        {
            if (TimeOnly.TryParseExact(
                value,
                "HH':'mm':'ss",
                CultureInfo.InvariantCulture,
                DateTimeStyles.RoundtripKind,
                out var result1))
            {
                newValue = (TValue)(object)result1;
            }
            else if (DateTimeOffset.TryParseExact(
                value.EndsWith(']') && value.Contains('[')
                    ? value[..value.IndexOf('[')]
                    : value,
                "yyyy'-'MM'-'dd'T'HH':'mm':'ss.FFFFFFFzzz",
                CultureInfo.InvariantCulture,
                DateTimeStyles.RoundtripKind,
                out var result2))
            {
                newValue = (TValue)(object)TimeOnly.FromTimeSpan(result2.TimeOfDay);
            }
            else
            {
                newValue = default;
            }
        }
        else
        {
            newValue = default;
        }

        CurrentValue = newValue;
    }
}