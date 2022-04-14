using Microsoft.AspNetCore.Components;
using System.Globalization;

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
public partial class DateTimeInput<TValue>
{
    private const int CloseDelay = 200;

    private readonly Type _baseType;
    private readonly Type? _nullableType;

    private bool _clockMouseDown;
    private DateTime? _min, _max;

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
    /// cref="TimeOnly"/>.
    /// </para>
    /// </summary>
    [Parameter] public DateType DateType { get; set; } = DateType.Date;

    /// <summary>
    /// <para>
    /// Whether to display this picker as an inline component.
    /// </para>
    /// <para>
    /// If not, an input field is displayed inline instead, and the picker is displayed in a popup
    /// when the field has focus.
    /// </para>
    /// <para>
    /// Default is <see langword="false"/>.
    /// </para>
    /// </summary>
    [Parameter] public bool Inline { get; set; }

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
    [Parameter] public DateTime Max { get; set; }

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
    /// The time zone used for values set by this component.
    /// </para>
    /// <para>
    /// Defaults to the system's local time zone.
    /// </para>
    /// <para>
    /// If <see cref="ShowTimeZone"/> is <see langword="true"/>, this can be selected by the user.
    /// </para>
    /// </summary>
    [Parameter] public TimeZoneInfo TimeZone { get; set; }

    /// <inheritdoc />
    protected override string? CssStyle => new CssBuilder(Style)
        .AddStyleFromDictionary(AdditionalAttributes)
        .AddStyle("min-width", "310px")
        .ToString();

    /// <summary>
    /// The display text for the current selection.
    /// </summary>
    protected override string? DisplayString
    {
        get
        {
            if (CurrentValue is null)
            {
                return null;
            }
            if (OnlyDate)
            {
                return DateTimeOffset.ToString(Format ?? "d", Culture);
            }
            if (OnlyTime)
            {
                return DateTimeOffset.ToString(Format ?? (ShowSeconds ? "T" : "t"), Culture);
            }
            return DateType switch
            {
                DateType.Year => DateTimeOffset.ToString(Format ?? "yyy", Culture),
                DateType.Month => DateTimeOffset.ToString(Format ?? "y", Culture),
                DateType.Week => $"Week {Calendar.GetWeekOfYear(DateTimeOffset.DateTime, Culture.DateTimeFormat.CalendarWeekRule, Culture.DateTimeFormat.FirstDayOfWeek)}, {DateTimeOffset.ToString(Format ?? "yyy", Culture)}",
                DateType.Date => ShowTime
                    ? DateTimeOffset.ToString(Format ?? "g", Culture)
                    : DateTimeOffset.ToString(Format ?? "d", Culture),
                _ => ShowTime
                    ? DateTimeOffset.ToString(Format ?? (ShowSeconds ? "T" : "t"), Culture)
                    : DateTimeOffset.ToString(Format ?? "s", Culture),
            };
        }
    }

    private protected override bool ShrinkWhen => Inline
        || CurrentValue is not null;

    private string? AMClass => new CssBuilder("btn btn-text current")
        .Add("inactive", Hour >= 12)
        .Add("outlined", Disabled && Hour < 12)
        .ToString();

    private string AMString => Culture.DateTimeFormat.AMDesignator;

    private Calendar Calendar => Culture.DateTimeFormat.Calendar;

    private string? CalendarLabelsClass => new CssBuilder("d-grid center-items")
        .Add("text-muted", !Disabled)
        .ToString();

    private string? CalendarLabelsStyle => new CssBuilder()
        .AddStyle("color", "var(--tavenem-color-text-disabled)", Disabled)
        .ToString();

    private List<Calendar> Calendars { get; } = new();

    private List<string> CalendarNames { get; } = new();

    private string? CalendarStyle => new CssBuilder()
        .AddStyle("--date-picker-calendar-columns", (DateType == DateType.Week ? 8 : 7).ToString(CultureInfo.InvariantCulture))
        .AddStyle("--date-picker-calendar-rows", (WeeksInMonth + 1).ToString(CultureInfo.InvariantCulture))
        .ToString();

    private bool CanGoBackCentury => !Disabled
        && Century > 0
        && FirstDateInCentury > Min;

    private bool CanGoBackDecade => !Disabled
        && (Decade > 0 || Century > 0)
        && FirstDateInDecade > Min;

    private bool CanGoBackMonth => !Disabled
        && (Year > Calendar.MinSupportedDateTime.Year
        || Month > Calendar.MinSupportedDateTime.Month)
        && FirstDateInMonth > Min;

    private bool CanGoBackYear => !Disabled
        && Year > Calendar.MinSupportedDateTime.Year
        && FirstDateInYear > Min;

    private bool CanGoForwardCentury => !Disabled
        && Century < CenturyCount
        && LastDateInCentury < Max;

    private bool CanGoForwardDecade => !Disabled
        && (Decade < DecadeCount
        || Century < CenturyCount)
        && LastDateInDecade < Max;

    private bool CanGoForwardMonth => !Disabled
        && (Year < Calendar.MaxSupportedDateTime.Year
        || Month < Calendar.MaxSupportedDateTime.Month)
        && LastDateInMonth < Max;

    private bool CanGoForwardYear => !Disabled
        && Year < Calendar.MaxSupportedDateTime.Year
        && LastDateInYear < Max;

    private int Century { get; set; }

    private int CenturyCount { get; set; }

    private string CenturyTitle
        => $"{FirstDateInCentury.ToString("yyy", Culture)}-{LastDateInCentury.ToString("yyy", Culture)}";

    private DateTimeOffset DateTimeOffset { get; set; } = DateTimeOffset.Now;

    private byte DaysInMonth { get; set; }

    private byte Decade { get; set; }

    private byte DecadeCount { get; set; }

    private string DecadeTitle
        => $"{FirstDateInDecade.ToString("yyy", Culture)}-{LastDateInDecade.ToString("yyy", Culture)}";

    private DateTime DisplayedTime { get; set; }

    private DateTime FirstDateInCentury { get; set; }

    private DateTime FirstDateInDecade { get; set; }

    private DateTime FirstDateInMonth { get; set; }

    private DateTime FirstDateInYear { get; set; }

    private int FirstDay { get; set; }

    private int FirstDayOfWeek { get; set; }

    private int FirstYearInCentury { get; set; }

    private int FirstYearInDecade { get; set; }

    private bool HasDate => !OnlyTime && (OnlyDate || !ShowTime || DateType != DateType.None);

    private bool HasTime => !OnlyDate && (OnlyTime || (ShowTime && DateType is DateType.None or DateType.Date));

    private byte Hour { get; set; }

    private string? HourClass => new CssBuilder("btn btn-text current")
        .Add("inactive", SettingMinutes || SettingSeconds)
        .ToString();

    private string? HourDialClass => new CssBuilder("dial hour")
        .Add("closed", SettingMinutes || SettingSeconds)
        .Add("invisible", SettingMinutes || SettingSeconds)
        .ToString();

    private string HourTitle => DisplayedTime.ToString(ShowAMPM ? "%h" : "HH", Culture);

    private string Icon => OnlyTime
        || (!OnlyDate
        && DateType == DateType.None
        && ShowTime)
        ? DefaultIcons.TimeSelect
        : DefaultIcons.DateTimeSelect;

    private string InputType
    {
        get
        {
            if (OnlyDate)
            {
                return "date";
            }
            if (OnlyTime)
            {
                return "time";
            }
            return DateType switch
            {
                DateType.Year => "number",
                DateType.Week => "week",
                DateType.Month => "month",
                DateType.Date => ShowTime ? "datetime-local" : "date",
                _ => ShowTime ? "time" : "text",
            };
        }
    }

    private bool IsNowDisabled => Disabled
        || (Value is not null
        && DateTimeOffset.Hour == DateTimeOffset.Now.Hour
        && DateTimeOffset.Minute == DateTimeOffset.Now.Minute
        && (!ShowSeconds
        || DateTimeOffset.Second == DateTimeOffset.Now.Second))
        || (OnlyTime
        && (DateTimeOffset.Now.TimeOfDay < Min.TimeOfDay
        || DateTimeOffset.Now.TimeOfDay > Max.TimeOfDay));

    private bool IsTodayDisabled => Disabled
        || (Value is not null
        && DateTimeOffset.Date == DateTimeOffset.Now.Date)
        || DateTimeOffset.Now.Date < Min.Date
        || DateTimeOffset.Now.Date > Max.Date;

    private DateTime LastDateInCentury { get; set; }

    private DateTime LastDateInDecade { get; set; }

    private DateTime LastDateInMonth { get; set; }

    private DateTime LastDateInYear { get; set; }

    private int LastDay { get; set; }

    private int LastYearInCentury { get; set; }

    private int LastYearInDecade { get; set; }

    private byte Minute { get; set; }

    private string? MinuteClass => new CssBuilder("btn btn-text current")
        .Add("inactive", !SettingMinutes)
        .ToString();

    private string? MinuteDialClass => new CssBuilder("dial")
        .Add("closed", !SettingMinutes)
        .Add("invisible", !SettingMinutes)
        .ToString();

    private string MinuteTitle => DisplayedTime.ToString("mm", Culture);

    private byte Month { get; set; }

    private string MonthTitle
        => FirstDateInMonth.ToString(Culture.DateTimeFormat.YearMonthPattern);

    private bool OnlyDate { get; set; }

    private bool OnlyTime { get; set; }

    private string? PMClass => new CssBuilder("btn btn-text current")
        .Add("inactive", Hour < 12)
        .Add("outlined", Disabled && Hour >= 12)
        .ToString();

    private string PMString => Culture.DateTimeFormat.PMDesignator;

    private string? PointerClass => new CssBuilder("pointer")
        .Add("animated", !_clockMouseDown)
        .ToString();

    private string? PointerStyle => new CssBuilder()
        .AddStyle("height", "40%", SettingMinutes || SettingSeconds || ShowAMPM || Hour < 12)
        .AddStyle("height", "26%", !SettingMinutes && !SettingSeconds && !ShowAMPM && Hour >= 12)
        .AddStyle("transform", $"rotateZ({GetDegree()}deg)")
        .ToString();

    private string? PointerThumbClass => new CssBuilder()
        .Add("onvalue", GetDegree() % 30 == 0)
        .ToString();

    [Inject] private ScrollService ScrollService { get; set; } = default!;

    private byte Second { get; set; }

    private string? SecondClass => new CssBuilder("btn btn-text current")
        .Add("inactive", !SettingSeconds)
        .ToString();

    private string? SecondDialClass => new CssBuilder("dial")
        .Add("closed", !SettingSeconds)
        .Add("invisible", !SettingSeconds)
        .ToString();

    private string SecondTitle => DisplayedTime.ToString("ss", Culture);

    private bool SetDate { get; set; }

    private bool SetTime { get; set; }

    private bool SettingMinutes { get; set; }

    private bool SettingSeconds { get; set; }

    private bool ShowAMPM => Culture.DateTimeFormat.LongTimePattern.Contains('h');

    private string TimeSeparator => Culture.DateTimeFormat.TimeSeparator;

    private IReadOnlyCollection<TimeZoneInfo> TimeZones { get; }

    private string? Title
    {
        get
        {
            if (DateType == DateType.Month)
            {
                return DateTimeOffset.ToString("MMM", Culture);
            }
            if (DateType == DateType.Week)
            {
                return $"Week {Calendar.GetWeekOfYear(DateTimeOffset.DateTime, Culture.DateTimeFormat.CalendarWeekRule, Culture.DateTimeFormat.FirstDayOfWeek)}";
            }

            return DateTimeOffset.ToString(Culture.DateTimeFormat.LongDatePattern
                .Replace("dddd", "ddd")
                .Replace("MMMM", "MMM")
                .Replace("y", string.Empty)
                .Replace("  ", " ")
                .Trim()
                .Trim(',')
                .Trim(),
                Culture);
        }
    }

    private DatePickerView View { get; set; } = DatePickerView.Date;

    private List<string> WeekdayNames { get; } = new();

    private List<DateTime?[]> Weeks { get; } = new();

    private byte WeeksInMonth { get; set; }

    private int ValueCentury { get; set; }

    private byte ValueDecade { get; set; }

    private int Year { get; set; }

    private ElementReference YearButton { get; set; }

    private byte YearCountInDecade { get; set; }

    private string YearTitle => Calendar is JapaneseCalendar or JapaneseLunisolarCalendar
        ? FirstDateInMonth.ToString("g yyy", Culture)
        : FirstDateInMonth.ToString("yyy", Culture);

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

        Max = DateTime.MaxValue;

        Year = DateTimeOffset.Year;
        Month = (byte)DateTimeOffset.Month;
        Hour = (byte)DateTimeOffset.Hour;
        Minute = (byte)DateTimeOffset.Minute;
        Second = (byte)DateTimeOffset.Second;
        DisplayedTime = new DateTime(1, 1, 1, Hour, Minute, Second);

        Clearable = _nullableType is not null
            || _baseType == typeof(string);

        try
        {
            TimeZones = TimeZoneInfo.GetSystemTimeZones();
        }
        catch
        {
            TimeZones = Array.Empty<TimeZoneInfo>();
        }
        TimeZone = TimeZoneInfo.Local;

        Culture = CultureInfo.CurrentCulture;
        SetCulture();

        if (!Clearable)
        {
            SetValue();
        }
    }

    /// <inheritdoc/>
    protected override void OnInitialized()
    {
        base.OnInitialized();

        View = DateType switch
        {
            DateType.Year => DatePickerView.Year,
            DateType.Month => DatePickerView.Month,
            _ => DatePickerView.Date,
        };
    }

    /// <inheritdoc/>
    public override async Task SetParametersAsync(ParameterView parameters)
    {
        var setDate = false;
        var setCalendar = false;
        var scrollToYear = false;

        await base.SetParametersAsync(parameters);

        if (FormatProvider is null)
        {
            FormatProvider = Culture;
        }

        if (parameters.TryGetValue<DateTime>(nameof(Min), out var min))
        {
            _min = min;
        }
        if (parameters.TryGetValue<DateTime>(nameof(Max), out var max))
        {
            _max = max;
        }

        if (parameters.TryGetValue<DateType>(nameof(DateType), out var dateType))
        {
            if (dateType == DateType.Year
                && (int)View < (int)DatePickerView.Year)
            {
                View = DatePickerView.Year;
                scrollToYear = true;
            }
            else if (dateType == DateType.Month
                && (int)View < (int)DatePickerView.Month)
            {
                View = DatePickerView.Month;
            }
        }

        if (parameters.TryGetValue<CultureInfo>(nameof(Culture), out _))
        {
            SetCulture();
            setCalendar = true;
        }

        if (parameters.TryGetValue<Calendar>(nameof(Calendar), out var calendar))
        {
            SetCalendar(calendar);
            setDate = true;
        }

        if (parameters.TryGetValue<bool>(nameof(ShowTime), out var showTime)
            && !showTime)
        {
            DateTimeOffset = new DateTimeOffset(
                DateTimeOffset.Year,
                DateTimeOffset.Month,
                DateTimeOffset.Day,
                0, 0, 0,
                DateTimeOffset.Offset);
        }

        if (parameters.TryGetValue<TimeZoneInfo>(nameof(TimeZone), out var timeZone))
        {
            SetTimeZone(timeZone);
        }

        if (parameters.TryGetValue<TValue>(nameof(Value), out var value))
        {
            if (value is null)
            {
                DateTimeOffset = DateTimeOffset.Now;
            }
            else if (value is string str)
            {
                if (DateTimeOffset.TryParse(str, out var dto))
                {
                    DateTimeOffset = dto;
                }
            }
            else if (value is DateTime dateTime)
            {
                DateTimeOffset = dateTime.Kind == DateTimeKind.Unspecified
                    ? new DateTimeOffset(dateTime, TimeSpan.Zero)
                    : new DateTimeOffset(dateTime);
            }
            else if (value is DateTimeOffset dto)
            {
                DateTimeOffset = dto;
            }
            else if (value is DateOnly dateOnly)
            {
                DateTimeOffset = new DateTimeOffset(dateOnly.ToDateTime(TimeOnly.MinValue), TimeSpan.Zero);
            }
            else if (value is TimeOnly timeOnly)
            {
                DateTimeOffset = new DateTimeOffset(DateOnly.FromDateTime(DateTime.Today).ToDateTime(timeOnly), TimeSpan.Zero);
            }

            Year = DateTimeOffset.Year;
            Month = (byte)DateTimeOffset.Month;
            Hour = (byte)DateTimeOffset.Hour;
            Minute = (byte)DateTimeOffset.Minute;
            Second = (byte)DateTimeOffset.Second;
            setDate = true;
        }

        if (!setCalendar && setDate)
        {
            SetDateValues();
        }

        if (scrollToYear)
        {
            await ScrollService.ScrollToId($"date-picker-year-{Calendar.GetYear(FirstDateInMonth)}", ScrollLogicalPosition.Nearest);
        }
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
    public override void Clear()
    {
        if (Disabled || ReadOnly)
        {
            return;
        }

        DateTimeOffset = DateTimeOffset.Now;

        if (_nullableType is null)
        {
            SetValue();
        }
        else
        {
            CurrentValue = default;
        }
    }

    /// <summary>
    /// Focuses this element.
    /// </summary>
    public override async Task FocusAsync()
    {
        if (Inline
            && !OnlyTime
            && (OnlyDate
            || !ShowTime
            || DateType != DateType.None))
        {
            await YearButton.FocusAsync();
        }
        else
        {
            await ElementReference.FocusAsync();
        }
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
            return dateOnly.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture);
        }
        if (value is TimeOnly timeOnly)
        {
            return timeOnly.ToString("HH:mm", CultureInfo.InvariantCulture);
        }
        if (value is DateTime dateTime)
        {
            return DateType switch
            {
                DateType.Year => dateTime.ToString("yyyy", CultureInfo.InvariantCulture),
                DateType.Month => dateTime.ToString("yyyy-MM", CultureInfo.InvariantCulture),
                DateType.Week => $"{dateTime.ToString("yyyy", CultureInfo.InvariantCulture)}-W{Calendar.GetWeekOfYear(dateTime, Culture.DateTimeFormat.CalendarWeekRule, Culture.DateTimeFormat.FirstDayOfWeek)}",
                DateType.Date => ShowTime
                    ? dateTime.ToString("s", CultureInfo.InvariantCulture)
                    : dateTime.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture),
                _ => ShowTime
                    ? dateTime.ToString(ShowSeconds ? "HH:mm:ss" : "HH:mm", CultureInfo.InvariantCulture)
                    : dateTime.ToString("s", CultureInfo.InvariantCulture),
            };
        }
        if (value is DateTimeOffset dateTimeOffset)
        {
            return DateType switch
            {
                DateType.Year => dateTimeOffset.ToString("yyyy", CultureInfo.InvariantCulture),
                DateType.Month => dateTimeOffset.ToString("yyyy-MM", CultureInfo.InvariantCulture),
                DateType.Week => $"{dateTimeOffset.ToString("yyyy", CultureInfo.InvariantCulture)}-W{Calendar.GetWeekOfYear(dateTimeOffset.DateTime, Culture.DateTimeFormat.CalendarWeekRule, Culture.DateTimeFormat.FirstDayOfWeek)}",
                DateType.Date => ShowTime
                    ? dateTimeOffset.ToString("s", CultureInfo.InvariantCulture)
                    : dateTimeOffset.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture),
                _ => ShowTime
                    ? dateTimeOffset.ToString(ShowSeconds ? "HH:mm:ss" : "HH:mm", CultureInfo.InvariantCulture)
                    : dateTimeOffset.ToString("s", CultureInfo.InvariantCulture),
            };
        }
        if (value is string str
            && DateTimeOffset.TryParse(str, out var dto))
        {
            return DateType switch
            {
                DateType.Year => dto.ToString("yyyy", CultureInfo.InvariantCulture),
                DateType.Month => dto.ToString("yyyy-MM", CultureInfo.InvariantCulture),
                DateType.Week => $"{dto.ToString("yyyy", CultureInfo.InvariantCulture)}-W{Calendar.GetWeekOfYear(dto.DateTime, Culture.DateTimeFormat.CalendarWeekRule, Culture.DateTimeFormat.FirstDayOfWeek)}",
                DateType.Date => ShowTime
                    ? dto.ToString("s", CultureInfo.InvariantCulture)
                    : dto.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture),
                _ => ShowTime
                    ? dto.ToString("HH:mm", CultureInfo.InvariantCulture)
                    : dto.ToString("s", CultureInfo.InvariantCulture),
            };
        }
        else
        {
            return base.FormatValueAsString(value);
        }
    }

    private protected override Task OnClosePopoverAsync()
    {
        SetDate = false;
        SetTime = false;
        return Task.CompletedTask;
    }

    private static string GetTransform(int angle, int radius, int offsetX, int offsetY)
    {
        var (sin, cos) = Math.SinCos(angle / 180.0 * Math.PI);
        return $"transform:translate({((sin * radius) + offsetX).ToPixels(3)},{(((cos + 1) * radius) + offsetY).ToPixels(3)})";
    }

    private string? GetCenturyClass(int century) => new CssBuilder("btn btn-text")
        .Add("large active", Value is not null && century == ValueCentury)
        .Add("outlined",
            century == Calendar.GetYear(DateTime.Today) / CloseDelay
            && (Value is null
            || century != ValueCentury))
        .ToString();

    private string? GetDayClass(int week, int day) => new CssBuilder("btn btn-text")
        .Add("text-muted", Weeks[week][day]?.Month != Month)
        .Add("active", Value is not null && Weeks[week][day] == DateTimeOffset.DateTime.Date)
        .Add("outlined", Disabled || ReadOnly
            ? Weeks[week][day] == DateTimeOffset.DateTime.Date
            : Weeks[week][day] == DateTime.Today
                && (Value is null
                || Weeks[week][day] != DateTimeOffset.DateTime.Date))
        .ToString();

    private string? GetDecadeClass(byte value) => new CssBuilder("btn btn-text")
        .Add("active", Value is not null && value == ValueDecade)
        .Add("outlined",
            value == Calendar.GetYear(DateTime.Today) % CloseDelay / 10
            && (Value is null
            || value != ValueDecade))
        .ToString();

    private int GetDegree()
    {
        if (SettingMinutes)
        {
            return Minute * 6 % 360;
        }
        if (SettingSeconds)
        {
            return Second * 6 % 360;
        }
        return Hour * 30 % 360;
    }

    private string? GetHourClass(byte value) => new CssBuilder("number")
        .Add("active", value == Hour)
        .Add("outlined", (Disabled || ReadOnly)
            && value == Hour)
        .ToString();

    private string? GetMinuteClass(byte value) => new CssBuilder("number")
        .Add("active", Value is not null
            && value == Minute)
        .Add("outlined", (Disabled || ReadOnly)
            && value == Minute)
        .ToString();

    private string? GetMonthClass(int value) => new CssBuilder("btn btn-text")
        .Add("active",
            Value is not null
                && Year == Calendar.GetYear(DateTimeOffset.DateTime)
                && value == Calendar.GetMonth(DateTimeOffset.DateTime))
        .Add("outlined",
            Year == Calendar.GetYear(DateTime.Today)
            && value == Calendar.GetMonth(DateTime.Today)
            && (Value is null
            || Year != Calendar.GetYear(DateTimeOffset.DateTime)
            || value != Calendar.GetMonth(DateTimeOffset.DateTime)))
        .Add("d-none",
            (Year == Calendar.MinSupportedDateTime.Year
            && value < Calendar.MinSupportedDateTime.Month)
            || (Year == Calendar.MaxSupportedDateTime.Year
            && value > Calendar.MaxSupportedDateTime.Month))
        .ToString();

    private string? GetSecondClass(byte value) => new CssBuilder("number")
        .Add("active", Value is not null
            && value == Second)
        .Add("outlined", (Disabled || ReadOnly)
            && value == Second)
        .ToString();

    private string? GetYearClass(int value) => new CssBuilder("btn btn-text")
        .Add("active", Value is not null && value == Calendar.GetYear(DateTimeOffset.DateTime))
        .Add("outlined",
            value == Calendar.GetYear(DateTime.Today)
            && (Value is null
            || value != Calendar.GetYear(DateTimeOffset.DateTime)))
        .ToString();

    private bool IsCenturyOutOfRange(int value)
    {
        var firstYearInCentury = Math.Max(Calendar.MinSupportedDateTime.Year, Calendar.MinSupportedDateTime.Year + (value * CloseDelay) - 1);
        var firstDateInCentury = new DateTime(firstYearInCentury, 1, 1);
        if (firstDateInCentury > Max)
        {
            return true;
        }
        var lastYearInCentury = Math.Min(Calendar.MaxSupportedDateTime.Year, Calendar.MinSupportedDateTime.Year + (value * CloseDelay) + 98);
        var monthsInYear = Calendar.GetMonthsInYear(lastYearInCentury);
        var lastDateInCentury = new DateTime(lastYearInCentury, monthsInYear, Calendar.GetDaysInMonth(lastYearInCentury, monthsInYear));
        return lastDateInCentury < Min;
    }

    private bool IsDayOutOfRange(int week, int day) => Disabled
        || ReadOnly
        || Weeks[week][day] < Min.Date
        || Weeks[week][day] > Max.Date;

    private bool IsDecadeOutOfRange(byte value)
    {
        if (Disabled)
        {
            return true;
        }
        var firstYearInDecade = Math.Max(Calendar.MinSupportedDateTime.Year, FirstYearInCentury + (value * 10));
        var firstDateInDecade = new DateTime(firstYearInDecade, 1, 1);
        if (firstDateInDecade > Max)
        {
            return true;
        }
        var lastYearInDecade = Math.Min(Calendar.MaxSupportedDateTime.Year, FirstYearInCentury + (value * 10) + 9);
        var monthsInYear = Calendar.GetMonthsInYear(lastYearInDecade);
        var lastDateInDecade = new DateTime(lastYearInDecade, monthsInYear, Calendar.GetDaysInMonth(lastYearInDecade, monthsInYear));
        return lastDateInDecade < Min;
    }

    private bool IsMonthOutOfRange(int value) => Disabled
        || (Year == Calendar.MinSupportedDateTime.Year
        && value < Calendar.MinSupportedDateTime.Month)
        || (Year == Calendar.MaxSupportedDateTime.Year
        && value > Calendar.MaxSupportedDateTime.Month)
        || (Year == Min.Year
        && value < Min.Month)
        || (Year == Max.Year
        && value > Max.Month);

    private bool IsYearOutOfRange(int value) => Disabled
        || value < Calendar.MinSupportedDateTime.Year
        || value > Calendar.MaxSupportedDateTime.Year
        || value < Min.Year
        || value > Max.Year;

    private void OnClockMouseDown() => _clockMouseDown = true;

    private async Task OnClockMouseUp()
    {
        if (_clockMouseDown)
        {
            if (SettingMinutes)
            {
                if (Minute != DateTimeOffset.Minute)
                {
                    await OnSelectMinuteAsync(Minute);
                }
            }
            else if (SettingSeconds)
            {
                if (Second != DateTimeOffset.Second)
                {
                    await OnSelectMinuteAsync(Second);
                }
            }
            else if (Hour != DateTimeOffset.Hour)
            {
                OnSelectHour(Hour);
            }

            _clockMouseDown = false;
        }
    }

    private void OnMouseOverHour(byte value)
    {
        if (_clockMouseDown)
        {
            Hour = value;
            DisplayedTime = new DateTime(1, 1, 1, Hour, Minute, Second);
        }
    }

    private void OnMouseOverMinute(byte value)
    {
        if (_clockMouseDown)
        {
            Minute = value;
            DisplayedTime = new DateTime(1, 1, 1, Hour, Minute, Second);
        }
    }

    private void OnMouseOverSecond(byte value)
    {
        if (_clockMouseDown)
        {
            Second = value;
            DisplayedTime = new DateTime(1, 1, 1, Hour, Minute, Second);
        }
    }

    private void OnNextCentury()
    {
        if (!CanGoForwardCentury)
        {
            return;
        }
        Century++;
        FirstYearInCentury = Math.Max(Calendar.MinSupportedDateTime.Year, Calendar.MinSupportedDateTime.Year + (Century * CloseDelay) - 1);
        LastYearInCentury = Math.Min(Calendar.MaxSupportedDateTime.Year, Calendar.MinSupportedDateTime.Year + (Century * CloseDelay) + 98);
        DecadeCount = (byte)((LastYearInCentury - FirstYearInCentury) / 10);
        if ((LastYearInCentury - FirstYearInCentury) % 10 != 0)
        {
            DecadeCount++;
        }
        Decade = (byte)Math.Min(Decade, DecadeCount - 1);
        SetCenturyDecadeValues();
    }

    private void OnNextDecade()
    {
        if (!CanGoForwardDecade)
        {
            return;
        }
        Decade++;
        if (Decade > DecadeCount)
        {
            Century++;
            Decade = 0;
        }
        SetCenturyDecadeValues();
    }

    private void OnNextMonth()
    {
        if (!CanGoForwardMonth)
        {
            return;
        }
        Month++;
        if (Month > 12)
        {
            Year++;
            Month = 1;
        }
        SetDateValues();
    }

    private void OnNextYear()
    {
        if (!CanGoForwardYear)
        {
            return;
        }
        Year++;
        SetDateValues();
    }

    private void OnPreviousCentury()
    {
        if (!CanGoBackCentury)
        {
            return;
        }
        Century--;
        FirstYearInCentury = Math.Max(Calendar.MinSupportedDateTime.Year, Calendar.MinSupportedDateTime.Year + (Century * CloseDelay) - 1);
        LastYearInCentury = Math.Min(Calendar.MaxSupportedDateTime.Year, Calendar.MinSupportedDateTime.Year + (Century * CloseDelay) + 98);
        DecadeCount = (byte)((LastYearInCentury - FirstYearInCentury) / 10);
        if ((LastYearInCentury - FirstYearInCentury) % 10 != 0)
        {
            DecadeCount++;
        }
        Decade = (byte)Math.Min(Decade, DecadeCount - 1);
        SetCenturyDecadeValues();
    }

    private void OnPreviousDecade()
    {
        if (!CanGoBackDecade)
        {
            return;
        }
        if (Decade == 1)
        {
            Century--;
            FirstYearInCentury = Math.Max(Calendar.MinSupportedDateTime.Year, Calendar.MinSupportedDateTime.Year + (Century * CloseDelay) - 1);
            LastYearInCentury = Math.Min(Calendar.MaxSupportedDateTime.Year, Calendar.MinSupportedDateTime.Year + (Century * CloseDelay) + 98);
            DecadeCount = (byte)((LastYearInCentury - FirstYearInCentury) / 10);
            if ((LastYearInCentury - FirstYearInCentury) % 10 != 0)
            {
                DecadeCount++;
            }
            Decade = (byte)(DecadeCount - 1);
        }
        else
        {
            Decade--;
        }
        SetCenturyDecadeValues();
    }

    private void OnPreviousMonth()
    {
        if (!CanGoBackMonth)
        {
            return;
        }
        Month--;
        if (Month < 1)
        {
            Year--;
            Month = 12;
        }
        SetDateValues();
    }

    private void OnPreviousYear()
    {
        if (!CanGoBackYear)
        {
            return;
        }
        Year--;
        SetDateValues();
    }

    private void OnSelectAM()
    {
        if (Hour >= 12)
        {
            Hour -= 12;
            DisplayedTime = new DateTime(1, 1, 1, Hour, Minute, Second);
        }
        if (ReadOnly
            || DateTimeOffset.Hour < 12)
        {
            return;
        }
        DateTimeOffset = new DateTimeOffset(
            DateTimeOffset.Year,
            DateTimeOffset.Month,
            DateTimeOffset.Day,
            DateTimeOffset.Hour - 12,
            DateTimeOffset.Minute,
            DateTimeOffset.Second,
            DateTimeOffset.Offset);
        SetValue();
    }

    private async Task OnSelectCenturyAsync(int century)
    {
        Century = century;
        SetCenturyDecadeValues();
        View = DatePickerView.Decade;
        await ScrollService.ScrollToId($"date-picker-decade-{Decade}", ScrollLogicalPosition.Nearest);
    }

    private void OnSelectCurent()
    {
        Year = Calendar.GetYear(DateTimeOffset.DateTime);
        Month = (byte)Calendar.GetMonth(DateTimeOffset.DateTime);
        SetDateValues();
        if ((int)DateType > (int)DateType.Month
            || (DateType == DateType.None
            && (!ShowTime
            || OnlyDate)))
        {
            View = DatePickerView.Date;
        }
    }

    private async Task OnSelectDayAsync(int week, int day)
    {
        if (Weeks[week][day].HasValue
            && (DateTimeOffset.Year != Weeks[week][day]!.Value.Year
            || DateTimeOffset.Month != Weeks[week][day]!.Value.Month
            || DateTimeOffset.Day != Weeks[week][day]!.Value.Day))
        {
            DateTimeOffset = new DateTimeOffset(
                Weeks[week][day]!.Value.Year,
                Weeks[week][day]!.Value.Month,
                Weeks[week][day]!.Value.Day,
                DateTimeOffset.Hour,
                DateTimeOffset.Minute,
                DateTimeOffset.Second,
                DateTimeOffset.Offset);
            Year = DateTimeOffset.Year;
            Month = (byte)DateTimeOffset.Month;
            SetValue();
        }
        SetDate = true;
        if (!Inline && (!HasTime || SetTime))
        {
            await Task.Delay(CloseDelay);
            await ClosePopoverAsync();
        }
    }

    private async Task OnSelectDecadeAsync(byte value)
    {
        Decade = value;
        SetCenturyDecadeValues();
        View = DatePickerView.Year;
        await ScrollService.ScrollToId($"date-picker-year-{Year}", ScrollLogicalPosition.Nearest);
    }

    private void OnSelectHour(byte value)
    {
        Hour = value;
        DisplayedTime = new DateTime(1, 1, 1, value, Minute, Second);
        if (ReadOnly
            || DateTimeOffset.Hour == value)
        {
            return;
        }
        DateTimeOffset = new DateTimeOffset(
            DateTimeOffset.Year,
            DateTimeOffset.Month,
            DateTimeOffset.Day,
            value,
            DateTimeOffset.Minute,
            DateTimeOffset.Second,
            DateTimeOffset.Offset);
        SetValue();
        SettingMinutes = true;
    }

    private async Task OnSelectMinuteAsync(byte value)
    {
        Minute = value;
        DisplayedTime = new DateTime(1, 1, 1, Hour, value, Second);
        if (ReadOnly
            || DateTimeOffset.Minute == value)
        {
            return;
        }
        DateTimeOffset = new DateTimeOffset(
            DateTimeOffset.Year,
            DateTimeOffset.Month,
            DateTimeOffset.Day,
            DateTimeOffset.Hour,
            value,
            DateTimeOffset.Second,
            DateTimeOffset.Offset);
        SetValue();
        SettingMinutes = false;
        SetTime = !ShowSeconds;
        if (ShowSeconds)
        {
            SettingSeconds = true;
        }
        else if (!Inline && (!HasDate || SetDate))
        {
            await Task.Delay(CloseDelay);
            await ClosePopoverAsync();
        }
    }

    private async Task OnSelectMonthAsync(byte value)
    {
        Month = value;
        SetDateValues();
        if (DateType == DateType.Month)
        {
            if (ReadOnly)
            {
                return;
            }
            DateTimeOffset = new DateTimeOffset(
                Year,
                Month,
                1,
                DateTimeOffset.Hour,
                DateTimeOffset.Minute,
                DateTimeOffset.Second,
                DateTimeOffset.Offset);
            SetValue();
            if (!Inline)
            {
                await Task.Delay(CloseDelay);
                await ClosePopoverAsync();
            }
        }
        else if (View == DatePickerView.Month)
        {
            View = DatePickerView.Date;
        }
    }

    private async Task OnSelectNowAsync()
    {
        Hour = (byte)Calendar.GetHour(DateTime.Now);
        Minute = (byte)Calendar.GetMinute(DateTime.Now);
        Second = (byte)Calendar.GetSecond(DateTime.Now);
        if (ReadOnly)
        {
            return;
        }
        DateTimeOffset = new DateTimeOffset(
            DateTimeOffset.Year,
            DateTimeOffset.Month,
            DateTimeOffset.Day,
            Hour,
            Minute,
            Second,
            DateTimeOffset.Offset);
        SetValue();
        SetTime = true;
        if (!Inline && (!HasDate || SetDate))
        {
            await Task.Delay(CloseDelay);
            await ClosePopoverAsync();
        }
    }

    private void OnSelectPM()
    {
        if (Hour < 12)
        {
            Hour += 12;
            DisplayedTime = new DateTime(1, 1, 1, Hour, Minute, Second);
        }
        if (ReadOnly
            || DateTimeOffset.Hour >= 12)
        {
            return;
        }
        DateTimeOffset = new DateTimeOffset(
            DateTimeOffset.Year,
            DateTimeOffset.Month,
            DateTimeOffset.Day,
            DateTimeOffset.Hour + 12,
            DateTimeOffset.Minute,
            DateTimeOffset.Second,
            DateTimeOffset.Offset);
        SetValue();
    }

    private async Task OnSelectSecondAsync(byte value)
    {
        Second = value;
        DisplayedTime = new DateTime(1, 1, 1, Hour, Minute, value);
        if (ReadOnly
            || DateTimeOffset.Second == value)
        {
            return;
        }
        DateTimeOffset = new DateTimeOffset(
            DateTimeOffset.Year,
            DateTimeOffset.Month,
            DateTimeOffset.Day,
            DateTimeOffset.Hour,
            DateTimeOffset.Minute,
            value,
            DateTimeOffset.Offset);
        SetValue();
        SettingSeconds = false;
        SetTime = true;
        if (!Inline && (!HasDate || SetDate))
        {
            await Task.Delay(CloseDelay);
            await ClosePopoverAsync();
        }
    }

    private async Task OnSelectTodayAsync()
    {
        Year = Calendar.GetYear(DateTime.Now);
        Month = (byte)Calendar.GetMonth(DateTime.Now);
        SetDateValues();
        if (View == DatePickerView.Date
            || (View == DatePickerView.Month
            && DateType == DateType.Month)
            || (View == DatePickerView.Year
            && DateType == DateType.Year))
        {
            if (ReadOnly)
            {
                return;
            }
            DateTimeOffset = new DateTimeOffset(
                DateTimeOffset.Now.Year,
                DateTimeOffset.Now.Month,
                DateTimeOffset.Now.Day,
                DateTimeOffset.Hour,
                DateTimeOffset.Minute,
                DateTimeOffset.Second,
                DateTimeOffset.Offset);
            SetValue();
            SetDate = true;
            if (!Inline && (!HasTime || SetTime))
            {
                await Task.Delay(CloseDelay);
                await ClosePopoverAsync();
            }
        }
        else if ((int)DateType >= (int)DateType.Week)
        {
            View = DatePickerView.Date;
        }
    }

    private async Task OnSelectYearAsync(int value)
    {
        Year = value;
        SetDateValues();
        if (DateType == DateType.Year)
        {
            if (ReadOnly)
            {
                return;
            }
            DateTimeOffset = new DateTimeOffset(
                Year,
                1,
                DateTimeOffset.Day,
                DateTimeOffset.Hour,
                DateTimeOffset.Minute,
                DateTimeOffset.Second,
                DateTimeOffset.Offset);
            SetValue();
            if (!Inline)
            {
                await Task.Delay(CloseDelay);
                await ClosePopoverAsync();
            }
        }
        else if (View == DatePickerView.Year)
        {
            View = DatePickerView.Month;
        }
    }

    private void SetCalendar(Calendar calendar)
    {
        Culture.DateTimeFormat.Calendar = calendar;
        Min = _min ?? DateTime.MinValue;
        if (Calendar.MinSupportedDateTime > Min)
        {
            Min = Calendar.MinSupportedDateTime;
        }
        Max = _max ?? DateTime.MaxValue;
        if (Calendar.MaxSupportedDateTime < Max)
        {
            Max = Calendar.MaxSupportedDateTime;
        }

        WeekdayNames.Clear();
        for (var i = FirstDayOfWeek; i < Culture.DateTimeFormat.AbbreviatedDayNames.Length; i++)
        {
            WeekdayNames.Add(Culture.DateTimeFormat.AbbreviatedDayNames[i]);
        }
        for (var i = 0; i < FirstDayOfWeek; i++)
        {
            WeekdayNames.Add(Culture.DateTimeFormat.AbbreviatedDayNames[i]);
        }

        CenturyCount = (Calendar.MaxSupportedDateTime.Year - Calendar.MinSupportedDateTime.Year) / CloseDelay;
        if ((Calendar.MaxSupportedDateTime.Year - Calendar.MinSupportedDateTime.Year) % CloseDelay != 0)
        {
            CenturyCount++;
        }

        var calendarYear = Calendar.GetYear(DateTimeOffset.DateTime);
        ValueDecade = (byte)(calendarYear % CloseDelay / 10);
        ValueCentury = calendarYear % 1000 / CloseDelay;

        if (Century >= CenturyCount)
        {
            Century = CenturyCount - 1;
        }

        if (Decade >= DecadeCount)
        {
            Decade = (byte)(DecadeCount - 1);
        }

        if (Year < Calendar.MinSupportedDateTime.Year)
        {
            Year = Calendar.MinSupportedDateTime.Year;
        }
        else if (Year > Calendar.MaxSupportedDateTime.Year)
        {
            Year = Calendar.MaxSupportedDateTime.Year;
        }

        if (Year == Calendar.MinSupportedDateTime.Year
            && Month < Calendar.MinSupportedDateTime.Month)
        {
            Month = (byte)Calendar.MinSupportedDateTime.Month;
        }
        else if (Year == Calendar.MaxSupportedDateTime.Year
            && Month > Calendar.MaxSupportedDateTime.Month)
        {
            Month = (byte)Calendar.MaxSupportedDateTime.Month;
        }

        SetDateValues();
    }

    private void SetCenturyDecadeValues()
    {
        FirstYearInCentury = Math.Max(Calendar.MinSupportedDateTime.Year, Calendar.MinSupportedDateTime.Year + (Century * CloseDelay) - 1);
        LastYearInCentury = Math.Min(Calendar.MaxSupportedDateTime.Year, Calendar.MinSupportedDateTime.Year + (Century * CloseDelay) + 98);
        DecadeCount = (byte)((LastYearInCentury - FirstYearInCentury) / 10);
        if ((LastYearInCentury - FirstYearInCentury) % 10 != 0)
        {
            DecadeCount++;
        }
        FirstYearInDecade = Math.Max(Calendar.MinSupportedDateTime.Year, FirstYearInCentury + (Decade * 10));
        LastYearInDecade = Math.Min(Calendar.MaxSupportedDateTime.Year, FirstYearInCentury + (Decade * 10) + 9);
        YearCountInDecade = (byte)(LastYearInDecade - FirstYearInDecade + 1);
        FirstDateInCentury = new DateTime(FirstYearInCentury, 1, 1);
        var monthsInYear = Calendar.GetMonthsInYear(LastYearInCentury);
        LastDateInCentury = new DateTime(LastYearInCentury, monthsInYear, Calendar.GetDaysInMonth(LastYearInCentury, monthsInYear));
        FirstDateInDecade = new DateTime(FirstYearInDecade, 1, 1);
        monthsInYear = Calendar.GetMonthsInYear(LastYearInDecade);
        LastDateInDecade = new DateTime(LastYearInDecade, monthsInYear, Calendar.GetDaysInMonth(LastYearInDecade, monthsInYear));
    }

    private void SetCulture()
    {
        Culture = CultureInfo.CreateSpecificCulture(Culture.Name);
        FirstDayOfWeek = (int)Culture.DateTimeFormat.FirstDayOfWeek;

        Calendars.Clear();
        CalendarNames.Clear();
        try
        {
            var c = (CultureInfo)Culture.Clone();
            Calendars.Add(c.Calendar);
            CalendarNames.Add($"{char.ToUpper(c.DateTimeFormat.NativeCalendarName[0])}{c.DateTimeFormat.NativeCalendarName[1..]}");
            for (var i = 0; i < Culture.OptionalCalendars.Length; i++)
            {
                var add = false;
                if (Culture.OptionalCalendars[i].GetType() == Culture.Calendar.GetType())
                {
                    if (Culture.Calendar is GregorianCalendar calendar
                        && Culture.OptionalCalendars[i] is GregorianCalendar optional
                        && calendar.CalendarType != optional.CalendarType)
                    {
                        add = true;
                    }
                }
                else
                {
                    add = true;
                }
                if (add)
                {
                    Calendars.Add(Culture.OptionalCalendars[i]);
                    c.DateTimeFormat.Calendar = Culture.OptionalCalendars[i];
                    CalendarNames.Add($"{char.ToUpper(c.DateTimeFormat.NativeCalendarName[0])}{c.DateTimeFormat.NativeCalendarName[1..]}");
                }
            }
        }
        catch { }
        SetCalendar(Calendars[0]);
    }

    private void SetDateValues()
    {
        FirstDateInYear = new DateTime(Year, 1, 1);
        var monthsInYear = Calendar.GetMonthsInYear(Year);
        LastDateInYear = new DateTime(Year, monthsInYear, Calendar.GetDaysInMonth(Year, monthsInYear));
        FirstDateInMonth = new DateTime(Year, Month, 1);
        var calendarYear = Calendar.GetYear(FirstDateInMonth);
        Decade = (byte)(calendarYear % CloseDelay / 10);
        Century = calendarYear / CloseDelay;
        SetCenturyDecadeValues();
        DaysInMonth = (byte)Calendar.GetDaysInMonth(Year, Month);
        LastDateInMonth = FirstDateInMonth.AddDays(DaysInMonth);
        FirstDay = (int)Calendar.GetDayOfWeek(FirstDateInMonth);
        WeeksInMonth = (byte)Math.Ceiling((FirstDay + DaysInMonth) / 7.0);
        LastDay = (int)Calendar.GetDayOfWeek(LastDateInMonth);

        Weeks.Clear();
        for (var week = 0; week < WeeksInMonth; week++)
        {
            var days = new DateTime?[7];
            for (var day = 0; day < 7; day++)
            {
                DateTime? date = null;
                var dayOfMonth = (week * 7) + day - (FirstDay - FirstDayOfWeek) + 1;
                if (dayOfMonth < 1)
                {
                    if (Month == 1)
                    {
                        if (Year > 1)
                        {
                            var month = Calendar.GetMonthsInYear(Year - 1);
                            var firstDay = (int)Calendar.GetDayOfWeek(new DateTime(Year - 1, month, 1));
                            var weeksInMonth = (int)Math.Ceiling((firstDay + Calendar.GetDaysInMonth(Year - 1, month)) / 7.0);
                            dayOfMonth = ((weeksInMonth - 1) * 7) + day - (firstDay - FirstDayOfWeek) + 1;
                            date = new DateTime(Year - 1, 12, dayOfMonth);
                        }
                    }
                    else
                    {
                        var firstDay = (int)Calendar.GetDayOfWeek(new DateTime(Year, Month - 1, 1));
                        var weeksInMonth = (int)Math.Ceiling((firstDay + Calendar.GetDaysInMonth(Year, Month - 1)) / 7.0);
                        dayOfMonth = ((weeksInMonth - 1) * 7) + day - (firstDay - FirstDayOfWeek) + 1;
                        date = new DateTime(Year, Month - 1, dayOfMonth);
                    }
                }
                else if (dayOfMonth > DaysInMonth)
                {
                    if (Month == 12)
                    {
                        if (Year != DateTime.MaxValue.Year)
                        {
                            dayOfMonth = day - ((int)Calendar.GetDayOfWeek(new DateTime(Year + 1, 1, 1)) - FirstDayOfWeek) + 1;
                            date = new DateTime(Year + 1, 1, dayOfMonth);
                        }
                    }
                    else if (Year < DateTime.MaxValue.Year
                        || Month < DateTime.MaxValue.Month - 1
                        || dayOfMonth < DateTime.MaxValue.Day)
                    {
                        dayOfMonth = day - ((int)Calendar.GetDayOfWeek(new DateTime(Year, Month + 1, 1)) - FirstDayOfWeek) + 1;
                        date = new DateTime(Year, Month + 1, dayOfMonth);
                    }
                }
                else if (Year < DateTime.MaxValue.Year
                    || Month < DateTime.MaxValue.Month
                    || dayOfMonth < DateTime.MaxValue.Day)
                {
                    date = new DateTime(Year, Month, dayOfMonth);
                }
                if (date > Calendar.MinSupportedDateTime
                    && date < Calendar.MaxSupportedDateTime)
                {
                    days[day] = date;
                }
            }
            Weeks.Add(days);
        }
    }

    private void SetHour()
    {
        SettingMinutes = false;
        SettingSeconds = false;
    }

    private void SetMinutes()
    {
        SettingMinutes = true;
        SettingSeconds = false;
    }

    private void SetSeconds()
    {
        SettingMinutes = false;
        SettingSeconds = true;
    }

    private void SetTimeZone(TimeZoneInfo timeZone)
    {
        TimeZone = timeZone;
        DateTimeOffset = DateTimeOffset.ToOffset(timeZone.GetUtcOffset(DateTimeOffset));
        if (_baseType == typeof(DateTimeOffset))
        {
            SetValue();
        }
    }

    private void SetValue()
    {
        TValue? newValue;
        if (_baseType == typeof(DateTime))
        {
            newValue = DateTimeOffset.Offset.Ticks == 0
                ? (TValue)(object)new DateTime(DateTimeOffset.DateTime.Ticks, DateTimeKind.Utc)
                : (TValue)(object)DateTimeOffset.DateTime;
        }
        else if (_baseType == typeof(DateTimeOffset))
        {
            newValue = (TValue)(object)DateTimeOffset;
        }
        else if (_baseType == typeof(DateOnly))
        {
            newValue = (TValue)(object)DateOnly.FromDateTime(DateTimeOffset.DateTime);
        }
        else if (_baseType == typeof(TimeOnly))
        {
            newValue = (TValue)(object)TimeOnly.FromDateTime(DateTimeOffset.DateTime);
        }
        else if (_baseType == typeof(string))
        {
            newValue = (TValue)(object)(DateType switch
            {
                DateType.Year => DateTimeOffset.ToString("yyyy", CultureInfo.InvariantCulture),
                DateType.Week => $"{DateTimeOffset.ToString("yyyy", CultureInfo.InvariantCulture)}-W{(DateTimeOffset.DayOfYear % 7) + 1}",
                DateType.Month => DateTimeOffset.ToString("yyyy-MM", CultureInfo.InvariantCulture),
                DateType.Date => ShowTime
                    ? DateTimeOffset.ToString("s", CultureInfo.InvariantCulture)
                    : DateTimeOffset.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture),
                _ => ShowTime
                    ? DateTimeOffset.ToString("HH:mm", CultureInfo.InvariantCulture)
                    : DateTimeOffset.ToString("s", CultureInfo.InvariantCulture),
            });
        }
        else
        {
            newValue = default;
        }

        if (!IsTouched
            && !EqualityComparer<TValue>.Default.Equals(newValue, InitialValue))
        {
            IsTouched = true;
            _ = IsTouchedChanged.InvokeAsync(true);
        }

        if (!IsNested
            && !EqualityComparer<TValue>.Default.Equals(newValue, CurrentValue))
        {
            EvaluateDebounced();
        }

        CurrentValue = newValue;

        var calendarYear = Calendar.GetYear(DateTimeOffset.DateTime);
        ValueDecade = (byte)(calendarYear % CloseDelay / 10);
        ValueCentury = calendarYear / CloseDelay;
    }

    private async Task SetViewAsync(DatePickerView view)
    {
        View = view;
        await Task.Delay(1);
        if (View == DatePickerView.Year)
        {
            await ScrollService.ScrollToId($"date-picker-year-{Year}", ScrollLogicalPosition.Nearest);
        }
        else if (View == DatePickerView.Decade)
        {
            await ScrollService.ScrollToId($"date-picker-decade-{Decade}", ScrollLogicalPosition.Nearest);
        }
        else if (View == DatePickerView.Century)
        {
            await ScrollService.ScrollToId($"date-picker-century-{Century}", ScrollLogicalPosition.Nearest);
        }
    }
}