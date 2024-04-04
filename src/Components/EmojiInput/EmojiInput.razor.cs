using Microsoft.AspNetCore.Components;
using Microsoft.Extensions.DependencyInjection;
using System.Diagnostics.CodeAnalysis;
using Tavenem.Blazor.Framework.Components.EmojiInput;
using Tavenem.Blazor.Framework.Components.Forms;

namespace Tavenem.Blazor.Framework;

/// <summary>
/// A picker for emoji.
/// </summary>
public partial class EmojiInput : PickerComponentBase<string>
{
    private const string LatestEmojiStorageKey = "tavenem.latest-emoji";

    private static Dictionary<string, Emoji[]>? _categorizedEmoji;
    private static readonly SemaphoreSlim _lock = new(1);

    /// <summary>
    /// <para>
    /// The way a picker's activator should be displayed.
    /// </para>
    /// <para>
    /// Defaults to <see cref="PickerDisplayType.Button"/>.
    /// </para>
    /// </summary>
    [Parameter] public PickerDisplayType DisplayType { get; set; } = PickerDisplayType.Button;

    /// <summary>
    /// This can be used to override the default icon.
    /// </summary>
    [Parameter] public string? Icon { get; set; }

    /// <summary>
    /// When <see cref="DisplayType"/> is <see cref="PickerDisplayType.Button"/> and this is <see
    /// langword="true"/>, the button displays an icon rather than the current selected emoji.
    /// </summary>
    [Parameter] public bool IconButton { get; set; }

    /// <inheritdoc/>
    protected override string? CssClass => new CssBuilder(base.CssClass)
        .Add("disabled", IsDisabled)
        .Add("read-only", IsReadOnly)
        .ToString();

    /// <summary>
    /// The display text for the current selection.
    /// </summary>
    protected override string? DisplayString => CurrentValue;

    private protected override bool ShrinkWhen => DisplayType == PickerDisplayType.Inline
        || CurrentValue is not null;

    private string? ButtonClass => new CssBuilder(InputClass)
        .AddClassFromDictionary(InputAttributes)
        .Add(ThemeColor.ToCSS())
        .Add("picker-btn btn btn-icon")
        .ToString();

    private string? ButtonContainerClass => new CssBuilder(Class)
        .AddClassFromDictionary(AdditionalAttributes)
        .Add("field picker")
        .Add("modified", IsTouched)
        .Add("valid", IsValid)
        .Add("invalid", IsInvalidAndTouched)
        .ToString();

    private string ButtonText => CurrentValue ?? "☺️";

    private string ButtonIcon => Icon ?? DefaultIcons.Emoji;

    private string? EmojiCategoryButtonClass => new CssBuilder("btn btn-icon small")
        .Add(ThemeColor.ToCSS())
        .ToString();

    private Dictionary<string, Emoji[]> FilteredEmoji { get; set; } = [];

    private string? InputContainerStyle => new CssBuilder(Style)
        .AddStyleFromDictionary(AdditionalAttributes)
        .AddStyle("min-width", "308px")
        .ToString();

    private bool IsSkinTonePickerOpen
        => (DisplayType == PickerDisplayType.Inline || ShowPicker) && ShowSkinTonePicker;

    private List<Emoji> LatestEmoji { get; set; } = [];

    [Inject, NotNull] private ScrollService? ScrollService { get; set; }

    private TextInput? SearchInput { get; set; }

    private string? SearchValue { get; set; }

    [Inject, NotNull] private IServiceProvider? ServiceProvider { get; set; }

    private bool ShowSkinTonePicker { get; set; }

    private int SkinTone1 { get; set; }

    private int SkinTone2 { get; set; }

    private string? SkinToneCss
    {
        get
        {
            if (SkinTone2 == SkinTone1
                || SkinTone2 is < 1 or > 5)
            {
                return SkinTone1 switch
                {
                    1 => "btn btn-icon skin-tone-btn tone1",
                    2 => "btn btn-icon skin-tone-btn tone2",
                    3 => "btn btn-icon skin-tone-btn tone3",
                    4 => "btn btn-icon skin-tone-btn tone4",
                    5 => "btn btn-icon skin-tone-btn tone5",
                    _ => "btn btn-icon skin-tone-btn tone0",
                };
            }
            var skinTone1 = SkinTone1 switch
            {
                1 => "tone1",
                2 => "tone2",
                3 => "tone3",
                4 => "tone4",
                5 => "tone5",
                _ => "tone0",
            };
            var skinTone2 = SkinTone2 switch
            {
                1 => "tone1",
                2 => "tone2",
                3 => "tone3",
                4 => "tone4",
                5 => "tone5",
                _ => "tone0",
            };
            return $"btn btn-icon skin-tone-btn {skinTone1}-{skinTone2}";
        }
    }

    private TavenemFrameworkHttpClient? TavenemFrameworkHttpClient { get; set; }

    [Inject, NotNull] UtilityService? UtilityService { get; set; }

    /// <summary>
    /// Constructs a new instance of <see cref="EmojiInput"/>.
    /// </summary>
    public EmojiInput() => Clearable = true;

    /// <inheritdoc/>
    protected override async Task OnAfterRenderAsync(bool firstRender)
    {
        await base.OnAfterRenderAsync(firstRender);

        if (_categorizedEmoji is null)
        {
            await _lock.WaitAsync();

            if (_categorizedEmoji is null)
            {
                TavenemFrameworkHttpClient = ServiceProvider.GetService<TavenemFrameworkHttpClient>();
                if (TavenemFrameworkHttpClient is null)
                {
                    var client = ServiceProvider.GetService<HttpClient>();
                    if (client is not null)
                    {
                        TavenemFrameworkHttpClient = new(client);
                    }
                }
                if (TavenemFrameworkHttpClient is null)
                {
                    return;
                }

                var emojis = await TavenemFrameworkHttpClient.GetEmojiAsync();
                _categorizedEmoji = emojis
                    .GroupBy(x => x.Category)
                    .ToDictionary(x => x.Key, x => x.ToArray());
            }

            _lock.Release();
        }
        FilteredEmoji = _categorizedEmoji;

        var latest = await UtilityService.GetFromLocalStorageAsync(
            LatestEmojiStorageKey,
            TavenemFrameworkSerializerContext.Default.StringArray);
        if (latest?.Length > 0)
        {
            LatestEmoji.Clear();
            foreach (var emojiName in latest)
            {
                var emoji = _categorizedEmoji
                    .SelectMany(x => x.Value)
                    .FirstOrDefault(x => string.CompareOrdinal(x.Name, emojiName) == 0);
                if (!string.IsNullOrEmpty(emoji.Name))
                {
                    LatestEmoji.Add(emoji);
                }
            }
        }
    }

    /// <summary>
    /// Focuses this element.
    /// </summary>
    public override async Task FocusAsync()
    {
        if (DisplayType == PickerDisplayType.Inline
            && SearchInput is not null)
        {
            await SearchInput.FocusAsync();
        }
        else
        {
            await ElementReference.FocusAsync();
        }
    }

    /// <inheritdoc/>
    protected override string? FormatValueAsString(string? value) => value;

    private async Task ClearAndCloseAsync()
    {
        await ClearAsync();
        await ClosePopoverAsync();
    }

    private ValueTask OnClickCategoryAsync(string category)
        => ScrollService.ScrollToId($"{Id}-category-{category}");

    private protected override async Task OnClosePopoverAsync()
    {
        ShowSkinTonePicker = false;
        await base.OnClosePopoverAsync();
    }

    private void OnSearch()
    {
        if (_categorizedEmoji is null)
        {
            return;
        }

        var searchTerms = SearchValue?
            .Split(' ', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
        if (searchTerms is null
            || searchTerms.Length == 0)
        {
            FilteredEmoji = _categorizedEmoji;
            return;
        }

        FilteredEmoji = _categorizedEmoji
            .SelectMany(x => x.Value)
            .Where(x => x.Keywords.Any(x => searchTerms.Any(y => x.StartsWith(y, StringComparison.OrdinalIgnoreCase))))
            .GroupBy(x => x.Category)
            .ToDictionary(x => x.Key, x => x.ToArray());
    }

    private async Task OnSelectAsync(Emoji value)
    {
        CurrentValue = value.WithSkinTones(SkinTone1, SkinTone2);

        await ClosePopoverAsync();

        if (LatestEmoji.Count > 0
            && string.CompareOrdinal(LatestEmoji[0].Name, value.Name) == 0)
        {
            return;
        }
        LatestEmoji.Remove(value);
        if (LatestEmoji.Count >= 9)
        {
            LatestEmoji.RemoveAt(LatestEmoji.Count - 1);
        }
        LatestEmoji.Insert(0, value);
        await UtilityService.SetInLocalStorageAsync(
            LatestEmojiStorageKey,
            LatestEmoji.Select(x => x.Name).ToArray(),
            TavenemFrameworkSerializerContext.Default.StringArray);
    }

    private class EmojiCategoryComparer : Comparer<string>
    {
        private static readonly string[] _categories =
        [
            "Smileys & Emotion",
            "People & Body",
            "Animals & Nature",
            "Food & Drink",
            "Activities",
            "Travel & Places",
            "Objects",
            "Symbols",
            "Flags"
        ];

        public static EmojiCategoryComparer Instance { get; } = new();

        public override int Compare(string? x, string? y)
        {
            if (x is null)
            {
                return y is null ? 0 : -1;
            }
            return y is null
                ? 1
                : Array
                    .IndexOf(_categories, x)
                    .CompareTo(Array.IndexOf(_categories, y));
        }
    }
}