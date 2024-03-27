using System.Text;
using System.Text.Json.Serialization;

namespace Tavenem.Blazor.Framework.Components.EmojiInput;

internal record struct Emoji(
    string Category,
    string Codepoint,
    string[]? Codepoints,
    bool HasSkinTones,
    string[] Keywords,
    string Name,
    string ShortName)
{
    private static readonly string[] People = ["1F466", "1F467", "1F468", "1F469", "1F476", "1F9D1", "1F9D2", "1F9D3", "1F9D4"];

    private string _text;
    [JsonIgnore]
    public string Text => _text ??= GetText();

    public readonly bool Equals(Emoji other) => string.CompareOrdinal(Name, other.Name) == 0;

    public override readonly int GetHashCode() => Name.GetHashCode();

    public override string ToString() => Text;

    public string WithSkinTones(int value1, int value2)
    {
        if (!HasSkinTones || value1 is < 1 or > 5)
        {
            return Text;
        }
        var sb = new StringBuilder((Codepoints?.Length ?? 0) + 2);
        sb.Append(char.ConvertFromUtf32(Convert.ToInt32(Codepoint, 16)));
        sb.Append(GetSkinTone(value1));
        if (Codepoints is null)
        {
            return sb.ToString();
        }
        var startIndex = Codepoints[0] == "FE0F" ? 1 : 0; // variation selector should be omitted when using a skin tone modifier
        for (var i = startIndex; i < Codepoints.Length; i++)
        {
            sb.Append(char.ConvertFromUtf32(Convert.ToInt32(Codepoints[i], 16)));
            if (Array.IndexOf(People, Codepoints[i]) != -1)
            {
                sb.Append(GetSkinTone(value2 is < 1 or > 5 ? value1 : value2));
                if (i < Codepoints.Length - 1
                    && Codepoints[i + 1] == "FE0F")
                {
                    i++; // if the next codepoint would be the variation selector, skip it
                }
            }
        }
        return sb.ToString();
    }

    private static Rune GetSkinTone(int value) => value switch
    {
        1 => new Rune(127995),
        2 => new Rune(127996),
        3 => new Rune(127997),
        4 => new Rune(127998),
        5 => new Rune(127999),
        _ => Rune.ReplacementChar,
    };

    private readonly string GetText()
    {
        var sb = new StringBuilder((Codepoints?.Length ?? 0) + 1);
        sb.Append(char.ConvertFromUtf32(Convert.ToInt32(Codepoint, 16)));
        if (Codepoints?.Length > 0)
        {
            foreach (var value in Codepoints)
            {
                sb.Append(char.ConvertFromUtf32(Convert.ToInt32(value, 16)));
            }
        }
        return sb.ToString();
    }
}