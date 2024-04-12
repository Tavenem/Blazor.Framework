using System.Drawing;
using System.Globalization;

namespace Tavenem.Blazor.Framework;

/// <summary>
/// Converts a color from one format to various other formats.
/// </summary>
public struct ColorFormatConverter
{
    private const double Epsilon = 0.000000000000001;

    /// <summary>
    /// An instance of <see cref="ColorFormatConverter"/> representing pure black.
    /// </summary>
    public static ColorFormatConverter Black { get; } = new(0, 0, 0);

    /// <summary>
    /// An instance of <see cref="ColorFormatConverter"/> with the color values set to the default
    /// dark mode primary color theme.
    /// </summary>
    public static ColorFormatConverter DefaultPrimary { get; } = FromHSLA(246, 100, 72);

    /// <summary>
    /// An instance of <see cref="ColorFormatConverter"/> with zero alpha.
    /// </summary>
    public static ColorFormatConverter Transparent { get; } = new(0, 0, 0, 0);

    /// <summary>
    /// The alpha component of this color, as an integral value in the range [0-255].
    /// </summary>
    public byte AlphaByte { get; }

    /// <summary>
    /// The alpha component of this color, as a floating-point value in the range [0-1].
    /// </summary>
    public float AlphaFloat { get; }

    /// <summary>
    /// The blue component of this color, as an integral value in the range [0-255].
    /// </summary>
    public byte Blue { get; }

    /// <summary>
    /// The <see cref="System.Drawing.Color"/> equivalent of this color.
    /// </summary>
    public Color Color { get; }

    /// <summary>
    /// <para>
    /// A CSS-style color string.
    /// </para>
    /// <para>
    /// Will use <see cref="CssRGBA"/> if there is an alpha component, or <see cref="Hex6"/>
    /// if not, for maximum compatibility.
    /// </para>
    /// </summary>
    public readonly string Css => Hex6 ?? CssRGBA;

    /// <summary>
    /// <para>
    /// A CSS-style hsl string.
    /// </para>
    /// <para>
    /// Will be <see langword="null"/> if the color contains an alpha component.
    /// </para>
    /// </summary>
    public readonly string? CssHSL => AlphaByte < 255 ? null : $"hsl({Hue},{Saturation}%,{Lightness}%)";

    /// <summary>
    /// A CSS-style hsla string.
    /// </summary>
    /// <remarks>
    /// Alpha is represented with a precision of 2 decimal places.
    /// </remarks>
    public readonly string CssHSLA => $"hsla({Hue},{Saturation}%,{Lightness}%,{AlphaFloat.ToCSS(2)})";

    /// <summary>
    /// The shortest CSS-style hsl(a) string which accurately represents the color (between hsl and
    /// hsla formats).
    /// </summary>
    public readonly string CssHSLCompact => CssHSL ?? CssHSLA;

    /// <summary>
    /// <para>
    /// A CSS-style rgb string.
    /// </para>
    /// <para>
    /// Will be <see langword="null"/> if the color contains an alpha component.
    /// </para>
    /// </summary>
    public readonly string? CssRGB => AlphaByte < 255 ? null : $"rgb({Red},{Green},{Blue})";

    /// <summary>
    /// A CSS-style rgba string.
    /// </summary>
    /// <remarks>
    /// Alpha is represented with a precision of 2 decimal places.
    /// </remarks>
    public readonly string CssRGBA => $"rgba({Red},{Green},{Blue},{AlphaFloat.ToCSS(2)})";

    /// <summary>
    /// The shortest CSS-style rgb(a) string which accurately represents the color (between rgb and
    /// rgba formats).
    /// </summary>
    public readonly string CssRGBCompact => CssRGB ?? CssRGBA;

    /// <summary>
    /// The green component of this color, as an integral value in the range [0-255].
    /// </summary>
    public byte Green { get; }

    /// <summary>
    /// <para>
    /// A 6-character CSS-style hexadecimal string (including '#').
    /// </para>
    /// <para>
    /// Will be <see langword="null"/> if the color cannot be representd with only 6 characters.
    /// </para>
    /// </summary>
    public readonly string? Hex6 => AlphaByte < 255 ? null : $"#{Red:x2}{Green:x2}{Blue:x2}";

    /// <summary>
    /// An 8-character CSS-style hexadecimal string (including '#').
    /// </summary>
    public readonly string Hex8 => $"#{Red:x2}{Green:x2}{Blue:x2}{AlphaByte:x2}";

    /// <summary>
    /// The shortest CSS-style hexadecimal string which accurately represents the color.
    /// </summary>
    public readonly string HexCompact => Hex6 ?? Hex8;

    /// <summary>
    /// The hue of this color, as an integral degree in the range [0-360).
    /// </summary>
    /// <remarks>
    /// <para>
    /// Although 360 is a valid value for hue in most contexts, 360 is always represented by the
    /// equivalent value of zero in this property.
    /// </para>
    /// </remarks>
    public ushort Hue { get; }

    /// <summary>
    /// If this color is equivalent to a CSS color keyword, this gets that keyword. Otherwise, it is
    /// <see langword="null"/>.
    /// </summary>
    public readonly string? Keyword
    {
        get
        {
            if (AlphaByte == 0)
            {
                return "transparent";
            }

            if (AlphaByte < 255)
            {
                return null;
            }

            if (Red == 0
                && Green == 0
                && Blue == 0)
            {
                return "black";
            }
            if (Red == 255
                && Green == 255
                && Blue == 255)
            {
                return "white";
            }
            if (Red == 255
                && Green == 0
                && Blue == 0)
            {
                return "red";
            }
            if (Red == 0
                && Green == 255
                && Blue == 0)
            {
                return "lime";
            }
            if (Red == 0
                && Green == 0
                && Blue == 255)
            {
                return "blue";
            }
            if (Red == 255
                && Green == 0
                && Blue == 255)
            {
                return "fuschia";
            }
            if (Red == 255
                && Green == 255
                && Blue == 0)
            {
                return "yellow";
            }
            if (Red == 0
                && Green == 255
                && Blue == 255)
            {
                return "aqua";
            }
            if (Red == 192
                && Green == 192
                && Blue == 192)
            {
                return "silver";
            }
            if (Red == 128
                && Green == 128
                && Blue == 128)
            {
                return "gray";
            }
            if (Red == 128
                && Green == 0
                && Blue == 0)
            {
                return "maroon";
            }
            if (Red == 128
                && Green == 0
                && Blue == 128)
            {
                return "purple";
            }
            if (Red == 0
                && Green == 128
                && Blue == 0)
            {
                return "green";
            }
            if (Red == 128
                && Green == 128
                && Blue == 0)
            {
                return "olive";
            }
            if (Red == 0
                && Green == 0
                && Blue == 128)
            {
                return "navy";
            }
            if (Red == 0
                && Green == 128
                && Blue == 128)
            {
                return "teal";
            }
            if (Red == 255
                && Green == 165
                && Blue == 0)
            {
                return "orange";
            }
            if (Red == 240
                && Green == 248
                && Blue == 255)
            {
                return "aliceblue";
            }
            if (Red == 250
                && Green == 235
                && Blue == 215)
            {
                return "antiquewhite";
            }
            if (Red == 127
                && Green == 255
                && Blue == 212)
            {
                return "aquamarine";
            }
            if (Red == 240
                && Green == 255
                && Blue == 255)
            {
                return "azure";
            }
            if (Red == 245
                && Green == 245
                && Blue == 220)
            {
                return "beige";
            }
            if (Red == 255
                && Green == 228
                && Blue == 196)
            {
                return "bisque";
            }
            if (Red == 255
                && Green == 235
                && Blue == 205)
            {
                return "blanchedalmond";
            }
            if (Red == 138
                && Green == 43
                && Blue == 226)
            {
                return "blueviolet";
            }
            if (Red == 165
                && Green == 42
                && Blue == 42)
            {
                return "brown";
            }
            if (Red == 222
                && Green == 184
                && Blue == 135)
            {
                return "burlywood";
            }
            if (Red == 95
                && Green == 158
                && Blue == 160)
            {
                return "cadetblue";
            }
            if (Red == 127
                && Green == 255
                && Blue == 0)
            {
                return "chartreuse";
            }
            if (Red == 210
                && Green == 105
                && Blue == 30)
            {
                return "chocolate";
            }
            if (Red == 255
                && Green == 127
                && Blue == 80)
            {
                return "coral";
            }
            if (Red == 100
                && Green == 149
                && Blue == 237)
            {
                return "cornflowerblue";
            }
            if (Red == 255
                && Green == 248
                && Blue == 220)
            {
                return "cornsilk";
            }
            if (Red == 220
                && Green == 20
                && Blue == 60)
            {
                return "crimson";
            }
            if (Red == 0
                && Green == 0
                && Blue == 139)
            {
                return "darkblue";
            }
            if (Red == 0
                && Green == 139
                && Blue == 139)
            {
                return "darkcyan";
            }
            if (Red == 184
                && Green == 134
                && Blue == 11)
            {
                return "darkgoldenrod";
            }
            if (Red == 169
                && Green == 169
                && Blue == 169)
            {
                return "darkgray";
            }
            if (Red == 0
                && Green == 100
                && Blue == 0)
            {
                return "darkgreen";
            }
            if (Red == 189
                && Green == 183
                && Blue == 107)
            {
                return "darkkhaki";
            }
            if (Red == 139
                && Green == 0
                && Blue == 139)
            {
                return "darkmagenta";
            }
            if (Red == 85
                && Green == 107
                && Blue == 47)
            {
                return "darkolivegreen";
            }
            if (Red == 255
                && Green == 140
                && Blue == 0)
            {
                return "darkorange";
            }
            if (Red == 153
                && Green == 50
                && Blue == 204)
            {
                return "darkorchid";
            }
            if (Red == 139
                && Green == 0
                && Blue == 0)
            {
                return "darkred";
            }
            if (Red == 233
                && Green == 150
                && Blue == 122)
            {
                return "darksalmon";
            }
            if (Red == 143
                && Green == 188
                && Blue == 143)
            {
                return "darkseagreen";
            }
            if (Red == 72
                && Green == 61
                && Blue == 139)
            {
                return "darkslateblue";
            }
            if (Red == 47
                && Green == 79
                && Blue == 79)
            {
                return "darkslategray";
            }
            if (Red == 0
                && Green == 206
                && Blue == 209)
            {
                return "darkturquoise";
            }
            if (Red == 148
                && Green == 0
                && Blue == 211)
            {
                return "darkviolet";
            }
            if (Red == 255
                && Green == 20
                && Blue == 147)
            {
                return "deeppink";
            }
            if (Red == 0
                && Green == 191
                && Blue == 255)
            {
                return "deepskyblue";
            }
            if (Red == 105
                && Green == 105
                && Blue == 105)
            {
                return "dimgray";
            }
            if (Red == 30
                && Green == 144
                && Blue == 255)
            {
                return "dodgerblue";
            }
            if (Red == 178
                && Green == 34
                && Blue == 34)
            {
                return "firebrick";
            }
            if (Red == 255
                && Green == 250
                && Blue == 240)
            {
                return "floralwhite";
            }
            if (Red == 34
                && Green == 139
                && Blue == 34)
            {
                return "forestgreen";
            }
            if (Red == 220
                && Green == 220
                && Blue == 220)
            {
                return "gainsboro";
            }
            if (Red == 248
                && Green == 248
                && Blue == 255)
            {
                return "ghostwhite";
            }
            if (Red == 255
                && Green == 215
                && Blue == 0)
            {
                return "gold";
            }
            if (Red == 218
                && Green == 165
                && Blue == 32)
            {
                return "goldenrod";
            }
            if (Red == 173
                && Green == 255
                && Blue == 47)
            {
                return "greenyellow";
            }
            if (Red == 240
                && Green == 255
                && Blue == 240)
            {
                return "honeydew";
            }
            if (Red == 255
                && Green == 105
                && Blue == 180)
            {
                return "hotpink";
            }
            if (Red == 205
                && Green == 92
                && Blue == 92)
            {
                return "indianred";
            }
            if (Red == 75
                && Green == 0
                && Blue == 130)
            {
                return "indigo";
            }
            if (Red == 255
                && Green == 255
                && Blue == 240)
            {
                return "ivory";
            }
            if (Red == 240
                && Green == 230
                && Blue == 140)
            {
                return "khaki";
            }
            if (Red == 230
                && Green == 230
                && Blue == 250)
            {
                return "lavender";
            }
            if (Red == 255
                && Green == 240
                && Blue == 245)
            {
                return "lavenderblush";
            }
            if (Red == 124
                && Green == 252
                && Blue == 0)
            {
                return "lawngreen";
            }
            if (Red == 255
                && Green == 250
                && Blue == 205)
            {
                return "lemonchiffon";
            }
            if (Red == 173
                && Green == 216
                && Blue == 230)
            {
                return "lightblue";
            }
            if (Red == 240
                && Green == 128
                && Blue == 128)
            {
                return "lightcoral";
            }
            if (Red == 224
                && Green == 255
                && Blue == 255)
            {
                return "lightcyan";
            }
            if (Red == 250
                && Green == 250
                && Blue == 210)
            {
                return "lightgoldenrodyellow";
            }
            if (Red == 211
                && Green == 211
                && Blue == 211)
            {
                return "lightgray";
            }
            if (Red == 144
                && Green == 238
                && Blue == 144)
            {
                return "lightgreen";
            }
            if (Red == 255
                && Green == 182
                && Blue == 193)
            {
                return "lightpink";
            }
            if (Red == 255
                && Green == 160
                && Blue == 122)
            {
                return "lightsalmon";
            }
            if (Red == 32
                && Green == 178
                && Blue == 170)
            {
                return "lightseagreen";
            }
            if (Red == 135
                && Green == 206
                && Blue == 250)
            {
                return "lightskyblue";
            }
            if (Red == 119
                && Green == 136
                && Blue == 153)
            {
                return "lightslategray";
            }
            if (Red == 176
                && Green == 196
                && Blue == 222)
            {
                return "lightsteelblue";
            }
            if (Red == 255
                && Green == 255
                && Blue == 224)
            {
                return "lightyellow";
            }
            if (Red == 50
                && Green == 205
                && Blue == 50)
            {
                return "limegreen";
            }
            if (Red == 250
                && Green == 240
                && Blue == 230)
            {
                return "linen";
            }
            if (Red == 102
                && Green == 205
                && Blue == 170)
            {
                return "mediumaquamarine";
            }
            if (Red == 0
                && Green == 0
                && Blue == 205)
            {
                return "mediumblue";
            }
            if (Red == 186
                && Green == 85
                && Blue == 211)
            {
                return "mediumorchid";
            }
            if (Red == 147
                && Green == 112
                && Blue == 219)
            {
                return "mediumpurple";
            }
            if (Red == 60
                && Green == 179
                && Blue == 113)
            {
                return "mediumseagreen";
            }
            if (Red == 123
                && Green == 104
                && Blue == 238)
            {
                return "mediumslateblue";
            }
            if (Red == 0
                && Green == 250
                && Blue == 154)
            {
                return "mediumspringgreen";
            }
            if (Red == 72
                && Green == 209
                && Blue == 204)
            {
                return "mediumturquoise";
            }
            if (Red == 199
                && Green == 21
                && Blue == 133)
            {
                return "mediumvioletred";
            }
            if (Red == 25
                && Green == 25
                && Blue == 112)
            {
                return "midnightblue";
            }
            if (Red == 245
                && Green == 255
                && Blue == 250)
            {
                return "mintcream";
            }
            if (Red == 255
                && Green == 228
                && Blue == 225)
            {
                return "mistyrose";
            }
            if (Red == 255
                && Green == 228
                && Blue == 181)
            {
                return "moccasin";
            }
            if (Red == 255
                && Green == 222
                && Blue == 173)
            {
                return "navajowhite";
            }
            if (Red == 253
                && Green == 245
                && Blue == 230)
            {
                return "oldlace";
            }
            if (Red == 107
                && Green == 142
                && Blue == 35)
            {
                return "olivedrab";
            }
            if (Red == 255
                && Green == 69
                && Blue == 0)
            {
                return "orangered";
            }
            if (Red == 218
                && Green == 112
                && Blue == 214)
            {
                return "orchid";
            }
            if (Red == 238
                && Green == 232
                && Blue == 170)
            {
                return "palegoldenrod";
            }
            if (Red == 152
                && Green == 251
                && Blue == 152)
            {
                return "palegreen";
            }
            if (Red == 175
                && Green == 238
                && Blue == 238)
            {
                return "paleturquoise";
            }
            if (Red == 219
                && Green == 112
                && Blue == 147)
            {
                return "palevioletred";
            }
            if (Red == 255
                && Green == 239
                && Blue == 213)
            {
                return "papayawhip";
            }
            if (Red == 255
                && Green == 218
                && Blue == 185)
            {
                return "peachpuff";
            }
            if (Red == 205
                && Green == 133
                && Blue == 63)
            {
                return "peru";
            }
            if (Red == 255
                && Green == 192
                && Blue == 203)
            {
                return "pink";
            }
            if (Red == 221
                && Green == 160
                && Blue == 221)
            {
                return "plum";
            }
            if (Red == 176
                && Green == 224
                && Blue == 230)
            {
                return "powderblue";
            }
            if (Red == 188
                && Green == 143
                && Blue == 143)
            {
                return "rosybrown";
            }
            if (Red == 65
                && Green == 105
                && Blue == 225)
            {
                return "royalblue";
            }
            if (Red == 139
                && Green == 69
                && Blue == 19)
            {
                return "saddlebrown";
            }
            if (Red == 250
                && Green == 128
                && Blue == 114)
            {
                return "salmon";
            }
            if (Red == 244
                && Green == 164
                && Blue == 96)
            {
                return "sandybrown";
            }
            if (Red == 46
                && Green == 139
                && Blue == 87)
            {
                return "seagreen";
            }
            if (Red == 255
                && Green == 245
                && Blue == 238)
            {
                return "seashell";
            }
            if (Red == 160
                && Green == 82
                && Blue == 45)
            {
                return "sienna";
            }
            if (Red == 135
                && Green == 206
                && Blue == 235)
            {
                return "skyblue";
            }
            if (Red == 106
                && Green == 90
                && Blue == 205)
            {
                return "slateblue";
            }
            if (Red == 112
                && Green == 128
                && Blue == 144)
            {
                return "slategray";
            }
            if (Red == 255
                && Green == 250
                && Blue == 250)
            {
                return "snow";
            }
            if (Red == 0
                && Green == 255
                && Blue == 127)
            {
                return "springgreen";
            }
            if (Red == 70
                && Green == 130
                && Blue == 180)
            {
                return "steelblue";
            }
            if (Red == 210
                && Green == 180
                && Blue == 140)
            {
                return "tan";
            }
            if (Red == 216
                && Green == 191
                && Blue == 216)
            {
                return "thistle";
            }
            if (Red == 255
                && Green == 99
                && Blue == 71)
            {
                return "tomato";
            }
            if (Red == 64
                && Green == 224
                && Blue == 208)
            {
                return "turquoise";
            }
            if (Red == 238
                && Green == 130
                && Blue == 238)
            {
                return "violet";
            }
            if (Red == 245
                && Green == 222
                && Blue == 179)
            {
                return "wheat";
            }
            if (Red == 245
                && Green == 245
                && Blue == 245)
            {
                return "whitesmoke";
            }
            if (Red == 154
                && Green == 205
                && Blue == 50)
            {
                return "yellowgreen";
            }
            if (Red == 102
                && Green == 51
                && Blue == 153)
            {
                return "rebeccapurple";
            }
            return null;
        }
    }

    /// <summary>
    /// The lightness of this color, as an integral percentage in the range [0-100].
    /// </summary>
    public byte Lightness { get; }

    /// <summary>
    /// The red component of this color, as an integral value in the range [0-255].
    /// </summary>
    public byte Red { get; }

    /// <summary>
    /// The saturation of this color, as an integral percentage in the range [0-100].
    /// </summary>
    public byte Saturation { get; }

    /// <summary>
    /// Constructs a new instance of <see cref="ColorFormatConverter"/> with the given values.
    /// </summary>
    /// <param name="red">
    /// The red component of this color, as an integral value in the range [0-255].
    /// </param>
    /// <param name="green">
    /// The green component of this color, as an integral value in the range [0-255].
    /// </param>
    /// <param name="blue">
    /// The blue component of this color, as an integral value in the range [0-255].
    /// </param>
    /// <param name="alpha">
    /// The alpha component of this color, as an integral value in the range [0-255].
    /// </param>
    public ColorFormatConverter(byte red, byte green, byte blue, byte alpha = 255)
    {
        Red = red;
        Green = green;
        Blue = blue;
        AlphaByte = alpha;

        AlphaFloat = Math.Clamp(alpha / 255f, 0, 1);

        var hsl = RGBToHSL(red, green, blue);

        Hue = hsl[0];
        Saturation = (byte)hsl[1];
        Lightness = (byte)hsl[2];

        Color = Color.FromArgb(AlphaByte, red, green, blue);
    }

    /// <summary>
    /// Constructs a new instance of <see cref="ColorFormatConverter"/> with the given values.
    /// </summary>
    /// <param name="red">
    /// The red component of this color, as an integral value in the range [0-255].
    /// </param>
    /// <param name="green">
    /// The green component of this color, as an integral value in the range [0-255].
    /// </param>
    /// <param name="blue">
    /// The blue component of this color, as an integral value in the range [0-255].
    /// </param>
    /// <param name="alpha">
    /// The alpha component of this color, as a floating-point value in the range [0-1].
    /// </param>
    public ColorFormatConverter(byte red, byte green, byte blue, float alpha)
    {
        Red = red;
        Green = green;
        Blue = blue;
        AlphaFloat = alpha;

        AlphaByte = (byte)Math.Clamp((int)Math.Round(alpha * 255), 0, 255);

        var hsl = RGBToHSL(red, green, blue);

        Hue = hsl[0];
        Saturation = (byte)hsl[1];
        Lightness = (byte)hsl[2];

        Color = Color.FromArgb(AlphaByte, red, green, blue);
    }

    /// <summary>
    /// Constructs a new instance of <see cref="ColorFormatConverter"/> with the given values.
    /// </summary>
    /// <param name="css">
    /// A CSS color string, which can be in any of the following notations:
    /// <list type="bullet">
    /// <item>
    /// <term>Keyword</term>
    /// <description>
    /// A CSS color keyword.
    /// </description>
    /// </item>
    /// <item>
    /// <term>Hexadecimal</term>
    /// <description>
    /// A 3-, 6-, or 8-character CSS-style hexadecimal string (with or without leading '#').
    /// </description>
    /// </item>
    /// <item>
    /// <term>RGB(A)</term>
    /// <description>
    /// An rgb or rgba function with comma- or space-separated values enclosed in parentheses (the
    /// alpha component is separated by a forward slash ('/') in space-separated notation.
    /// </description>
    /// </item>
    /// <item>
    /// <term>HSL(A)</term>
    /// <description>
    /// An hsl or hsla function with comma- or space-separated values enclosed in parentheses (the
    /// alpha component is separated by a forward slash ('/') in space-separated notation.
    /// </description>
    /// </item>
    /// </list>
    /// </param>
    public ColorFormatConverter(string css)
    {
        if (string.IsNullOrWhiteSpace(css))
        {
            throw new ArgumentNullException(nameof(css), $"{nameof(css)} must be a valid CSS-style color string");
        }

        css = css
            .Trim()
            .ToLowerInvariant();
        switch (css)
        {
            case "black":
                Red = 0;
                Green = 0;
                Blue = 0;
                Hue = 0;
                Saturation = 0;
                Lightness = 0;
                AlphaByte = 255;
                AlphaFloat = 1;
                Color = Color.Black;
                return;
            case "white":
                Red = 255;
                Green = 255;
                Blue = 255;
                Hue = 0;
                Saturation = 0;
                Lightness = 100;
                AlphaByte = 255;
                AlphaFloat = 1;
                Color = Color.White;
                return;
            case "red":
                Red = 255;
                Green = 0;
                Blue = 0;
                Hue = 0;
                Saturation = 100;
                Lightness = 50;
                AlphaByte = 255;
                AlphaFloat = 1;
                Color = Color.Red;
                return;
            case "lime":
                Red = 0;
                Green = 255;
                Blue = 0;
                Hue = 120;
                Saturation = 100;
                Lightness = 50;
                AlphaByte = 255;
                AlphaFloat = 1;
                Color = Color.Lime;
                return;
            case "blue":
                Red = 0;
                Green = 0;
                Blue = 255;
                Hue = 240;
                Saturation = 100;
                Lightness = 50;
                AlphaByte = 255;
                AlphaFloat = 1;
                Color = Color.Blue;
                return;
            case "fuschia":
                Red = 255;
                Green = 0;
                Blue = 255;
                Hue = 300;
                Saturation = 100;
                Lightness = 50;
                AlphaByte = 255;
                AlphaFloat = 1;
                Color = Color.Fuchsia;
                return;
            case "magenta":
                Red = 255;
                Green = 0;
                Blue = 255;
                Hue = 300;
                Saturation = 100;
                Lightness = 50;
                AlphaByte = 255;
                AlphaFloat = 1;
                Color = Color.Magenta;
                return;
            case "yellow":
                Red = 255;
                Green = 255;
                Blue = 0;
                Hue = 60;
                Saturation = 100;
                Lightness = 50;
                AlphaByte = 255;
                AlphaFloat = 1;
                Color = Color.Yellow;
                return;
            case "aqua":
                Red = 0;
                Green = 255;
                Blue = 255;
                Hue = 180;
                Saturation = 100;
                Lightness = 50;
                AlphaByte = 255;
                AlphaFloat = 1;
                Color = Color.Aqua;
                return;
            case "cyan":
                Red = 0;
                Green = 255;
                Blue = 255;
                Hue = 180;
                Saturation = 100;
                Lightness = 50;
                AlphaByte = 255;
                AlphaFloat = 1;
                Color = Color.Cyan;
                return;
            case "silver":
                Red = 192;
                Green = 192;
                Blue = 192;
                Hue = 0;
                Saturation = 0;
                Lightness = 75;
                AlphaByte = 255;
                AlphaFloat = 1;
                Color = Color.Silver;
                return;
            case "gray" or "grey":
                Red = 128;
                Green = 128;
                Blue = 128;
                Hue = 0;
                Saturation = 0;
                Lightness = 50;
                AlphaByte = 255;
                AlphaFloat = 1;
                Color = Color.Gray;
                return;
            case "maroon":
                Red = 128;
                Green = 0;
                Blue = 0;
                Hue = 0;
                Saturation = 100;
                Lightness = 25;
                AlphaByte = 255;
                AlphaFloat = 1;
                Color = Color.Maroon;
                return;
            case "purple":
                Red = 128;
                Green = 0;
                Blue = 128;
                Hue = 300;
                Saturation = 100;
                Lightness = 25;
                AlphaByte = 255;
                AlphaFloat = 1;
                Color = Color.Purple;
                return;
            case "green":
                Red = 0;
                Green = 128;
                Blue = 0;
                Hue = 120;
                Saturation = 100;
                Lightness = 25;
                AlphaByte = 255;
                AlphaFloat = 1;
                Color = Color.Green;
                return;
            case "olive":
                Red = 128;
                Green = 128;
                Blue = 0;
                Hue = 60;
                Saturation = 100;
                Lightness = 25;
                AlphaByte = 255;
                AlphaFloat = 1;
                Color = Color.Olive;
                return;
            case "navy":
                Red = 0;
                Green = 0;
                Blue = 128;
                Hue = 240;
                Saturation = 100;
                Lightness = 25;
                AlphaByte = 255;
                AlphaFloat = 1;
                Color = Color.Navy;
                return;
            case "teal":
                Red = 0;
                Green = 128;
                Blue = 128;
                Hue = 180;
                Saturation = 100;
                Lightness = 25;
                AlphaByte = 255;
                AlphaFloat = 1;
                Color = Color.Teal;
                return;
            case "orange":
                Red = 255;
                Green = 165;
                Blue = 0;
                Hue = 39;
                Saturation = 100;
                Lightness = 50;
                AlphaByte = 255;
                AlphaFloat = 1;
                Color = Color.Orange;
                return;
            case "aliceblue":
                Red = 240;
                Green = 248;
                Blue = 255;
                Hue = 208;
                Saturation = 100;
                Lightness = 97;
                AlphaByte = 255;
                AlphaFloat = 1;
                Color = Color.AliceBlue;
                return;
            case "antiquewhite":
                Red = 250;
                Green = 235;
                Blue = 215;
                Hue = 34;
                Saturation = 78;
                Lightness = 91;
                AlphaByte = 255;
                AlphaFloat = 1;
                Color = Color.AntiqueWhite;
                return;
            case "aquamarine":
                Red = 127;
                Green = 255;
                Blue = 212;
                Hue = 160;
                Saturation = 100;
                Lightness = 75;
                AlphaByte = 255;
                AlphaFloat = 1;
                Color = Color.Aquamarine;
                return;
            case "azure":
                Red = 240;
                Green = 255;
                Blue = 255;
                Hue = 180;
                Saturation = 100;
                Lightness = 97;
                AlphaByte = 255;
                AlphaFloat = 1;
                Color = Color.Azure;
                return;
            case "beige":
                Red = 245;
                Green = 245;
                Blue = 220;
                Hue = 60;
                Saturation = 56;
                Lightness = 91;
                AlphaByte = 255;
                AlphaFloat = 1;
                Color = Color.Beige;
                return;
            case "bisque":
                Red = 255;
                Green = 228;
                Blue = 196;
                Hue = 33;
                Saturation = 100;
                Lightness = 88;
                AlphaByte = 255;
                AlphaFloat = 1;
                Color = Color.Bisque;
                return;
            case "blanchedalmond":
                Red = 255;
                Green = 235;
                Blue = 205;
                Hue = 36;
                Saturation = 100;
                Lightness = 90;
                AlphaByte = 255;
                AlphaFloat = 1;
                Color = Color.BlanchedAlmond;
                return;
            case "blueviolet":
                Red = 138;
                Green = 43;
                Blue = 226;
                Hue = 271;
                Saturation = 76;
                Lightness = 53;
                AlphaByte = 255;
                AlphaFloat = 1;
                Color = Color.BlueViolet;
                return;
            case "brown":
                Red = 165;
                Green = 42;
                Blue = 42;
                Hue = 0;
                Saturation = 59;
                Lightness = 41;
                AlphaByte = 255;
                AlphaFloat = 1;
                Color = Color.Brown;
                return;
            case "burlywood":
                Red = 222;
                Green = 184;
                Blue = 135;
                Hue = 34;
                Saturation = 57;
                Lightness = 70;
                AlphaByte = 255;
                AlphaFloat = 1;
                Color = Color.BurlyWood;
                return;
            case "cadetblue":
                Red = 95;
                Green = 158;
                Blue = 160;
                Hue = 182;
                Saturation = 25;
                Lightness = 50;
                AlphaByte = 255;
                AlphaFloat = 1;
                Color = Color.CadetBlue;
                return;
            case "chartreuse":
                Red = 127;
                Green = 255;
                Blue = 0;
                Hue = 90;
                Saturation = 100;
                Lightness = 50;
                AlphaByte = 255;
                AlphaFloat = 1;
                Color = Color.Chartreuse;
                return;
            case "chocolate":
                Red = 210;
                Green = 105;
                Blue = 30;
                Hue = 25;
                Saturation = 75;
                Lightness = 47;
                AlphaByte = 255;
                AlphaFloat = 1;
                Color = Color.Chocolate;
                return;
            case "coral":
                Red = 255;
                Green = 127;
                Blue = 80;
                Hue = 16;
                Saturation = 100;
                Lightness = 66;
                AlphaByte = 255;
                AlphaFloat = 1;
                Color = Color.Coral;
                return;
            case "cornflowerblue":
                Red = 100;
                Green = 149;
                Blue = 237;
                Hue = 219;
                Saturation = 79;
                Lightness = 66;
                AlphaByte = 255;
                AlphaFloat = 1;
                Color = Color.CornflowerBlue;
                return;
            case "cornsilk":
                Red = 255;
                Green = 248;
                Blue = 220;
                Hue = 48;
                Saturation = 100;
                Lightness = 93;
                AlphaByte = 255;
                AlphaFloat = 1;
                Color = Color.Cornsilk;
                return;
            case "crimson":
                Red = 220;
                Green = 20;
                Blue = 60;
                Hue = 348;
                Saturation = 83;
                Lightness = 47;
                AlphaByte = 255;
                AlphaFloat = 1;
                Color = Color.Crimson;
                return;
            case "darkblue":
                Red = 0;
                Green = 0;
                Blue = 139;
                Hue = 240;
                Saturation = 100;
                Lightness = 27;
                AlphaByte = 255;
                AlphaFloat = 1;
                Color = Color.DarkBlue;
                return;
            case "darkcyan":
                Red = 0;
                Green = 139;
                Blue = 139;
                Hue = 180;
                Saturation = 100;
                Lightness = 27;
                AlphaByte = 255;
                AlphaFloat = 1;
                Color = Color.DarkCyan;
                return;
            case "darkgoldenrod":
                Red = 184;
                Green = 134;
                Blue = 11;
                Hue = 43;
                Saturation = 89;
                Lightness = 38;
                AlphaByte = 255;
                AlphaFloat = 1;
                Color = Color.DarkGoldenrod;
                return;
            case "darkgray" or "darkgrey":
                Red = 169;
                Green = 169;
                Blue = 169;
                Hue = 0;
                Saturation = 0;
                Lightness = 66;
                AlphaByte = 255;
                AlphaFloat = 1;
                Color = Color.DarkGray;
                return;
            case "darkgreen":
                Red = 0;
                Green = 100;
                Blue = 0;
                Hue = 120;
                Saturation = 100;
                Lightness = 20;
                AlphaByte = 255;
                AlphaFloat = 1;
                Color = Color.DarkGreen;
                return;
            case "darkkhaki":
                Red = 189;
                Green = 183;
                Blue = 107;
                Hue = 56;
                Saturation = 38;
                Lightness = 58;
                AlphaByte = 255;
                AlphaFloat = 1;
                Color = Color.DarkKhaki;
                return;
            case "darkmagenta":
                Red = 139;
                Green = 0;
                Blue = 139;
                Hue = 300;
                Saturation = 100;
                Lightness = 27;
                AlphaByte = 255;
                AlphaFloat = 1;
                Color = Color.DarkMagenta;
                return;
            case "darkolivegreen":
                Red = 85;
                Green = 107;
                Blue = 47;
                Hue = 82;
                Saturation = 39;
                Lightness = 30;
                AlphaByte = 255;
                AlphaFloat = 1;
                Color = Color.DarkOliveGreen;
                return;
            case "darkorange":
                Red = 255;
                Green = 140;
                Blue = 0;
                Hue = 33;
                Saturation = 100;
                Lightness = 50;
                AlphaByte = 255;
                AlphaFloat = 1;
                Color = Color.DarkOrange;
                return;
            case "darkorchid":
                Red = 153;
                Green = 50;
                Blue = 204;
                Hue = 280;
                Saturation = 61;
                Lightness = 50;
                AlphaByte = 255;
                AlphaFloat = 1;
                Color = Color.DarkOrchid;
                return;
            case "darkred":
                Red = 139;
                Green = 0;
                Blue = 0;
                Hue = 0;
                Saturation = 100;
                Lightness = 27;
                AlphaByte = 255;
                AlphaFloat = 1;
                Color = Color.DarkRed;
                return;
            case "darksalmon":
                Red = 233;
                Green = 150;
                Blue = 122;
                Hue = 15;
                Saturation = 72;
                Lightness = 70;
                AlphaByte = 255;
                AlphaFloat = 1;
                Color = Color.DarkSalmon;
                return;
            case "darkseagreen":
                Red = 143;
                Green = 188;
                Blue = 143;
                Hue = 120;
                Saturation = 25;
                Lightness = 65;
                AlphaByte = 255;
                AlphaFloat = 1;
                Color = Color.DarkSeaGreen;
                return;
            case "darkslateblue":
                Red = 72;
                Green = 61;
                Blue = 139;
                Hue = 248;
                Saturation = 39;
                Lightness = 39;
                AlphaByte = 255;
                AlphaFloat = 1;
                Color = Color.DarkSlateBlue;
                return;
            case "darkslategray" or "darkslategrey":
                Red = 47;
                Green = 79;
                Blue = 79;
                Hue = 180;
                Saturation = 25;
                Lightness = 25;
                AlphaByte = 255;
                AlphaFloat = 1;
                Color = Color.DarkSlateGray;
                return;
            case "darkturquoise":
                Red = 0;
                Green = 206;
                Blue = 209;
                Hue = 181;
                Saturation = 100;
                Lightness = 41;
                AlphaByte = 255;
                AlphaFloat = 1;
                Color = Color.DarkTurquoise;
                return;
            case "darkviolet":
                Red = 148;
                Green = 0;
                Blue = 211;
                Hue = 282;
                Saturation = 100;
                Lightness = 41;
                AlphaByte = 255;
                AlphaFloat = 1;
                Color = Color.DarkViolet;
                return;
            case "deeppink":
                Red = 255;
                Green = 20;
                Blue = 147;
                Hue = 328;
                Saturation = 100;
                Lightness = 54;
                AlphaByte = 255;
                AlphaFloat = 1;
                Color = Color.DeepPink;
                return;
            case "deepskyblue":
                Red = 0;
                Green = 191;
                Blue = 255;
                Hue = 195;
                Saturation = 100;
                Lightness = 50;
                AlphaByte = 255;
                AlphaFloat = 1;
                Color = Color.DeepSkyBlue;
                return;
            case "dimgray" or "dimgrey":
                Red = 105;
                Green = 105;
                Blue = 105;
                Hue = 0;
                Saturation = 0;
                Lightness = 41;
                AlphaByte = 255;
                AlphaFloat = 1;
                Color = Color.DimGray;
                return;
            case "dodgerblue":
                Red = 30;
                Green = 144;
                Blue = 255;
                Hue = 210;
                Saturation = 100;
                Lightness = 56;
                AlphaByte = 255;
                AlphaFloat = 1;
                Color = Color.DodgerBlue;
                return;
            case "firebrick":
                Red = 178;
                Green = 34;
                Blue = 34;
                Hue = 0;
                Saturation = 68;
                Lightness = 42;
                AlphaByte = 255;
                AlphaFloat = 1;
                Color = Color.Firebrick;
                return;
            case "floralwhite":
                Red = 255;
                Green = 250;
                Blue = 240;
                Hue = 40;
                Saturation = 100;
                Lightness = 97;
                AlphaByte = 255;
                AlphaFloat = 1;
                Color = Color.FloralWhite;
                return;
            case "forestgreen":
                Red = 34;
                Green = 139;
                Blue = 34;
                Hue = 120;
                Saturation = 61;
                Lightness = 34;
                AlphaByte = 255;
                AlphaFloat = 1;
                Color = Color.ForestGreen;
                return;
            case "gainsboro":
                Red = 220;
                Green = 220;
                Blue = 220;
                Hue = 0;
                Saturation = 0;
                Lightness = 86;
                AlphaByte = 255;
                AlphaFloat = 1;
                Color = Color.Gainsboro;
                return;
            case "ghostwhite":
                Red = 248;
                Green = 248;
                Blue = 255;
                Hue = 240;
                Saturation = 100;
                Lightness = 99;
                AlphaByte = 255;
                AlphaFloat = 1;
                Color = Color.GhostWhite;
                return;
            case "gold":
                Red = 255;
                Green = 215;
                Blue = 0;
                Hue = 51;
                Saturation = 100;
                Lightness = 50;
                AlphaByte = 255;
                AlphaFloat = 1;
                Color = Color.Gold;
                return;
            case "goldenrod":
                Red = 218;
                Green = 165;
                Blue = 32;
                Hue = 43;
                Saturation = 74;
                Lightness = 49;
                AlphaByte = 255;
                AlphaFloat = 1;
                Color = Color.Goldenrod;
                return;
            case "greenyellow":
                Red = 173;
                Green = 255;
                Blue = 47;
                Hue = 84;
                Saturation = 100;
                Lightness = 59;
                AlphaByte = 255;
                AlphaFloat = 1;
                Color = Color.GreenYellow;
                return;
            case "honeydew":
                Red = 240;
                Green = 255;
                Blue = 240;
                Hue = 120;
                Saturation = 100;
                Lightness = 97;
                AlphaByte = 255;
                AlphaFloat = 1;
                Color = Color.Honeydew;
                return;
            case "hotpink":
                Red = 255;
                Green = 105;
                Blue = 180;
                Hue = 330;
                Saturation = 100;
                Lightness = 70;
                AlphaByte = 255;
                AlphaFloat = 1;
                Color = Color.HotPink;
                return;
            case "indianred":
                Red = 205;
                Green = 92;
                Blue = 92;
                Hue = 0;
                Saturation = 53;
                Lightness = 58;
                AlphaByte = 255;
                AlphaFloat = 1;
                Color = Color.IndianRed;
                return;
            case "indigo":
                Red = 75;
                Green = 0;
                Blue = 130;
                Hue = 275;
                Saturation = 100;
                Lightness = 25;
                AlphaByte = 255;
                AlphaFloat = 1;
                Color = Color.Indigo;
                return;
            case "ivory":
                Red = 255;
                Green = 255;
                Blue = 240;
                Hue = 60;
                Saturation = 100;
                Lightness = 97;
                AlphaByte = 255;
                AlphaFloat = 1;
                Color = Color.Ivory;
                return;
            case "khaki":
                Red = 240;
                Green = 230;
                Blue = 140;
                Hue = 54;
                Saturation = 77;
                Lightness = 75;
                AlphaByte = 255;
                AlphaFloat = 1;
                Color = Color.Khaki;
                return;
            case "lavender":
                Red = 230;
                Green = 230;
                Blue = 250;
                Hue = 240;
                Saturation = 67;
                Lightness = 94;
                AlphaByte = 255;
                AlphaFloat = 1;
                Color = Color.Lavender;
                return;
            case "lavenderblush":
                Red = 255;
                Green = 240;
                Blue = 245;
                Hue = 340;
                Saturation = 100;
                Lightness = 97;
                AlphaByte = 255;
                AlphaFloat = 1;
                Color = Color.LavenderBlush;
                return;
            case "lawngreen":
                Red = 124;
                Green = 252;
                Blue = 0;
                Hue = 90;
                Saturation = 100;
                Lightness = 49;
                AlphaByte = 255;
                AlphaFloat = 1;
                Color = Color.LawnGreen;
                return;
            case "lemonchiffon":
                Red = 255;
                Green = 250;
                Blue = 205;
                Hue = 54;
                Saturation = 100;
                Lightness = 90;
                AlphaByte = 255;
                AlphaFloat = 1;
                Color = Color.LemonChiffon;
                return;
            case "lightblue":
                Red = 173;
                Green = 216;
                Blue = 230;
                Hue = 195;
                Saturation = 53;
                Lightness = 79;
                AlphaByte = 255;
                AlphaFloat = 1;
                Color = Color.LightBlue;
                return;
            case "lightcoral":
                Red = 240;
                Green = 128;
                Blue = 128;
                Hue = 0;
                Saturation = 79;
                Lightness = 72;
                AlphaByte = 255;
                AlphaFloat = 1;
                Color = Color.LightCoral;
                return;
            case "lightcyan":
                Red = 224;
                Green = 255;
                Blue = 255;
                Hue = 180;
                Saturation = 100;
                Lightness = 94;
                AlphaByte = 255;
                AlphaFloat = 1;
                Color = Color.LightCyan;
                return;
            case "lightgoldenrodyellow":
                Red = 250;
                Green = 250;
                Blue = 210;
                Hue = 60;
                Saturation = 80;
                Lightness = 90;
                AlphaByte = 255;
                AlphaFloat = 1;
                Color = Color.LightGoldenrodYellow;
                return;
            case "lightgray" or "lightgrey":
                Red = 211;
                Green = 211;
                Blue = 211;
                Hue = 0;
                Saturation = 0;
                Lightness = 83;
                AlphaByte = 255;
                AlphaFloat = 1;
                Color = Color.LightGray;
                return;
            case "lightgreen":
                Red = 144;
                Green = 238;
                Blue = 144;
                Hue = 120;
                Saturation = 73;
                Lightness = 75;
                AlphaByte = 255;
                AlphaFloat = 1;
                Color = Color.LightGreen;
                return;
            case "lightpink":
                Red = 255;
                Green = 182;
                Blue = 193;
                Hue = 351;
                Saturation = 100;
                Lightness = 86;
                AlphaByte = 255;
                AlphaFloat = 1;
                Color = Color.LightPink;
                return;
            case "lightsalmon":
                Red = 255;
                Green = 160;
                Blue = 122;
                Hue = 17;
                Saturation = 100;
                Lightness = 74;
                AlphaByte = 255;
                AlphaFloat = 1;
                Color = Color.LightSalmon;
                return;
            case "lightseagreen":
                Red = 32;
                Green = 178;
                Blue = 170;
                Hue = 177;
                Saturation = 70;
                Lightness = 41;
                AlphaByte = 255;
                AlphaFloat = 1;
                Color = Color.LightSeaGreen;
                return;
            case "lightskyblue":
                Red = 135;
                Green = 206;
                Blue = 250;
                Hue = 203;
                Saturation = 92;
                Lightness = 75;
                AlphaByte = 255;
                AlphaFloat = 1;
                Color = Color.LightSkyBlue;
                return;
            case "lightslategray" or "lightslategrey":
                Red = 119;
                Green = 136;
                Blue = 153;
                Hue = 210;
                Saturation = 14;
                Lightness = 53;
                AlphaByte = 255;
                AlphaFloat = 1;
                Color = Color.LightSlateGray;
                return;
            case "lightsteelblue":
                Red = 176;
                Green = 196;
                Blue = 222;
                Hue = 214;
                Saturation = 41;
                Lightness = 78;
                AlphaByte = 255;
                AlphaFloat = 1;
                Color = Color.LightSteelBlue;
                return;
            case "lightyellow":
                Red = 255;
                Green = 255;
                Blue = 224;
                Hue = 60;
                Saturation = 100;
                Lightness = 92;
                AlphaByte = 255;
                AlphaFloat = 1;
                Color = Color.LightYellow;
                return;
            case "limegreen":
                Red = 50;
                Green = 205;
                Blue = 50;
                Hue = 120;
                Saturation = 61;
                Lightness = 50;
                AlphaByte = 255;
                AlphaFloat = 1;
                Color = Color.LimeGreen;
                return;
            case "linen":
                Red = 250;
                Green = 240;
                Blue = 230;
                Hue = 30;
                Saturation = 67;
                Lightness = 94;
                AlphaByte = 255;
                AlphaFloat = 1;
                Color = Color.Linen;
                return;
            case "mediumaquamarine":
                Red = 102;
                Green = 205;
                Blue = 170;
                Hue = 160;
                Saturation = 51;
                Lightness = 60;
                AlphaByte = 255;
                AlphaFloat = 1;
                Color = Color.MediumAquamarine;
                return;
            case "mediumblue":
                Red = 0;
                Green = 0;
                Blue = 205;
                Hue = 240;
                Saturation = 100;
                Lightness = 40;
                AlphaByte = 255;
                AlphaFloat = 1;
                Color = Color.MediumBlue;
                return;
            case "mediumorchid":
                Red = 186;
                Green = 85;
                Blue = 211;
                Hue = 288;
                Saturation = 59;
                Lightness = 58;
                AlphaByte = 255;
                AlphaFloat = 1;
                Color = Color.MediumOrchid;
                return;
            case "mediumpurple":
                Red = 147;
                Green = 112;
                Blue = 219;
                Hue = 260;
                Saturation = 60;
                Lightness = 65;
                AlphaByte = 255;
                AlphaFloat = 1;
                Color = Color.MediumPurple;
                return;
            case "mediumseagreen":
                Red = 60;
                Green = 179;
                Blue = 113;
                Hue = 147;
                Saturation = 50;
                Lightness = 47;
                AlphaByte = 255;
                AlphaFloat = 1;
                Color = Color.MediumSeaGreen;
                return;
            case "mediumslateblue":
                Red = 123;
                Green = 104;
                Blue = 238;
                Hue = 249;
                Saturation = 80;
                Lightness = 67;
                AlphaByte = 255;
                AlphaFloat = 1;
                Color = Color.MediumSlateBlue;
                return;
            case "mediumspringgreen":
                Red = 0;
                Green = 250;
                Blue = 154;
                Hue = 157;
                Saturation = 100;
                Lightness = 49;
                AlphaByte = 255;
                AlphaFloat = 1;
                Color = Color.MediumSpringGreen;
                return;
            case "mediumturquoise":
                Red = 72;
                Green = 209;
                Blue = 204;
                Hue = 178;
                Saturation = 60;
                Lightness = 55;
                AlphaByte = 255;
                AlphaFloat = 1;
                Color = Color.MediumTurquoise;
                return;
            case "mediumvioletred":
                Red = 199;
                Green = 21;
                Blue = 133;
                Hue = 322;
                Saturation = 81;
                Lightness = 43;
                AlphaByte = 255;
                AlphaFloat = 1;
                Color = Color.MediumVioletRed;
                return;
            case "midnightblue":
                Red = 25;
                Green = 25;
                Blue = 112;
                Hue = 240;
                Saturation = 64;
                Lightness = 27;
                AlphaByte = 255;
                AlphaFloat = 1;
                Color = Color.MidnightBlue;
                return;
            case "mintcream":
                Red = 245;
                Green = 255;
                Blue = 250;
                Hue = 150;
                Saturation = 100;
                Lightness = 98;
                AlphaByte = 255;
                AlphaFloat = 1;
                Color = Color.MintCream;
                return;
            case "mistyrose":
                Red = 255;
                Green = 228;
                Blue = 225;
                Hue = 6;
                Saturation = 100;
                Lightness = 94;
                AlphaByte = 255;
                AlphaFloat = 1;
                Color = Color.MistyRose;
                return;
            case "moccasin":
                Red = 255;
                Green = 228;
                Blue = 181;
                Hue = 38;
                Saturation = 100;
                Lightness = 85;
                AlphaByte = 255;
                AlphaFloat = 1;
                Color = Color.Moccasin;
                return;
            case "navajowhite":
                Red = 255;
                Green = 222;
                Blue = 173;
                Hue = 36;
                Saturation = 100;
                Lightness = 84;
                AlphaByte = 255;
                AlphaFloat = 1;
                Color = Color.NavajoWhite;
                return;
            case "oldlace":
                Red = 253;
                Green = 245;
                Blue = 230;
                Hue = 39;
                Saturation = 85;
                Lightness = 95;
                AlphaByte = 255;
                AlphaFloat = 1;
                Color = Color.OldLace;
                return;
            case "olivedrab":
                Red = 107;
                Green = 142;
                Blue = 35;
                Hue = 80;
                Saturation = 60;
                Lightness = 35;
                AlphaByte = 255;
                AlphaFloat = 1;
                Color = Color.OliveDrab;
                return;
            case "orangered":
                Red = 255;
                Green = 69;
                Blue = 0;
                Hue = 16;
                Saturation = 100;
                Lightness = 50;
                AlphaByte = 255;
                AlphaFloat = 1;
                Color = Color.OrangeRed;
                return;
            case "orchid":
                Red = 218;
                Green = 112;
                Blue = 214;
                Hue = 302;
                Saturation = 59;
                Lightness = 65;
                AlphaByte = 255;
                AlphaFloat = 1;
                Color = Color.Orchid;
                return;
            case "palegoldenrod":
                Red = 238;
                Green = 232;
                Blue = 170;
                Hue = 55;
                Saturation = 67;
                Lightness = 80;
                AlphaByte = 255;
                AlphaFloat = 1;
                Color = Color.PaleGoldenrod;
                return;
            case "palegreen":
                Red = 152;
                Green = 251;
                Blue = 152;
                Hue = 120;
                Saturation = 93;
                Lightness = 79;
                AlphaByte = 255;
                AlphaFloat = 1;
                Color = Color.PaleGreen;
                return;
            case "paleturquoise":
                Red = 175;
                Green = 238;
                Blue = 238;
                Hue = 180;
                Saturation = 65;
                Lightness = 81;
                AlphaByte = 255;
                AlphaFloat = 1;
                Color = Color.PaleTurquoise;
                return;
            case "palevioletred":
                Red = 219;
                Green = 112;
                Blue = 147;
                Hue = 340;
                Saturation = 60;
                Lightness = 65;
                AlphaByte = 255;
                AlphaFloat = 1;
                Color = Color.PaleVioletRed;
                return;
            case "papayawhip":
                Red = 255;
                Green = 239;
                Blue = 213;
                Hue = 37;
                Saturation = 100;
                Lightness = 92;
                AlphaByte = 255;
                AlphaFloat = 1;
                Color = Color.PapayaWhip;
                return;
            case "peachpuff":
                Red = 255;
                Green = 218;
                Blue = 185;
                Hue = 28;
                Saturation = 100;
                Lightness = 86;
                AlphaByte = 255;
                AlphaFloat = 1;
                Color = Color.PeachPuff;
                return;
            case "peru":
                Red = 205;
                Green = 133;
                Blue = 63;
                Hue = 30;
                Saturation = 59;
                Lightness = 53;
                AlphaByte = 255;
                AlphaFloat = 1;
                Color = Color.Peru;
                return;
            case "pink":
                Red = 255;
                Green = 192;
                Blue = 203;
                Hue = 350;
                Saturation = 100;
                Lightness = 88;
                AlphaByte = 255;
                AlphaFloat = 1;
                Color = Color.Pink;
                return;
            case "plum":
                Red = 221;
                Green = 160;
                Blue = 221;
                Hue = 300;
                Saturation = 47;
                Lightness = 75;
                AlphaByte = 255;
                AlphaFloat = 1;
                Color = Color.Plum;
                return;
            case "powderblue":
                Red = 176;
                Green = 224;
                Blue = 230;
                Hue = 187;
                Saturation = 52;
                Lightness = 80;
                AlphaByte = 255;
                AlphaFloat = 1;
                Color = Color.PowderBlue;
                return;
            case "rosybrown":
                Red = 188;
                Green = 143;
                Blue = 143;
                Hue = 0;
                Saturation = 25;
                Lightness = 65;
                AlphaByte = 255;
                AlphaFloat = 1;
                Color = Color.RosyBrown;
                return;
            case "royalblue":
                Red = 65;
                Green = 105;
                Blue = 225;
                Hue = 225;
                Saturation = 73;
                Lightness = 57;
                AlphaByte = 255;
                AlphaFloat = 1;
                Color = Color.RoyalBlue;
                return;
            case "saddlebrown":
                Red = 139;
                Green = 69;
                Blue = 19;
                Hue = 25;
                Saturation = 76;
                Lightness = 31;
                AlphaByte = 255;
                AlphaFloat = 1;
                Color = Color.SaddleBrown;
                return;
            case "salmon":
                Red = 250;
                Green = 128;
                Blue = 114;
                Hue = 6;
                Saturation = 93;
                Lightness = 71;
                AlphaByte = 255;
                AlphaFloat = 1;
                Color = Color.Salmon;
                return;
            case "sandybrown":
                Red = 244;
                Green = 164;
                Blue = 96;
                Hue = 28;
                Saturation = 87;
                Lightness = 67;
                AlphaByte = 255;
                AlphaFloat = 1;
                Color = Color.SandyBrown;
                return;
            case "seagreen":
                Red = 46;
                Green = 139;
                Blue = 87;
                Hue = 146;
                Saturation = 50;
                Lightness = 36;
                AlphaByte = 255;
                AlphaFloat = 1;
                Color = Color.SeaGreen;
                return;
            case "seashell":
                Red = 255;
                Green = 245;
                Blue = 238;
                Hue = 25;
                Saturation = 100;
                Lightness = 97;
                AlphaByte = 255;
                AlphaFloat = 1;
                Color = Color.SeaShell;
                return;
            case "sienna":
                Red = 160;
                Green = 82;
                Blue = 45;
                Hue = 19;
                Saturation = 56;
                Lightness = 40;
                AlphaByte = 255;
                AlphaFloat = 1;
                Color = Color.Sienna;
                return;
            case "skyblue":
                Red = 135;
                Green = 206;
                Blue = 235;
                Hue = 197;
                Saturation = 71;
                Lightness = 73;
                AlphaByte = 255;
                AlphaFloat = 1;
                Color = Color.SkyBlue;
                return;
            case "slateblue":
                Red = 106;
                Green = 90;
                Blue = 205;
                Hue = 248;
                Saturation = 53;
                Lightness = 58;
                AlphaByte = 255;
                AlphaFloat = 1;
                Color = Color.SlateBlue;
                return;
            case "slategray" or "slategrey":
                Red = 112;
                Green = 128;
                Blue = 144;
                Hue = 210;
                Saturation = 13;
                Lightness = 50;
                AlphaByte = 255;
                AlphaFloat = 1;
                Color = Color.SlateGray;
                return;
            case "snow":
                Red = 255;
                Green = 250;
                Blue = 250;
                Hue = 0;
                Saturation = 100;
                Lightness = 99;
                AlphaByte = 255;
                AlphaFloat = 1;
                Color = Color.Snow;
                return;
            case "springgreen":
                Red = 0;
                Green = 255;
                Blue = 127;
                Hue = 150;
                Saturation = 100;
                Lightness = 50;
                AlphaByte = 255;
                AlphaFloat = 1;
                Color = Color.SpringGreen;
                return;
            case "steelblue":
                Red = 70;
                Green = 130;
                Blue = 180;
                Hue = 207;
                Saturation = 44;
                Lightness = 49;
                AlphaByte = 255;
                AlphaFloat = 1;
                Color = Color.SteelBlue;
                return;
            case "tan":
                Red = 210;
                Green = 180;
                Blue = 140;
                Hue = 34;
                Saturation = 44;
                Lightness = 69;
                AlphaByte = 255;
                AlphaFloat = 1;
                Color = Color.Tan;
                return;
            case "thistle":
                Red = 216;
                Green = 191;
                Blue = 216;
                Hue = 300;
                Saturation = 24;
                Lightness = 80;
                AlphaByte = 255;
                AlphaFloat = 1;
                Color = Color.Thistle;
                return;
            case "tomato":
                Red = 255;
                Green = 99;
                Blue = 71;
                Hue = 9;
                Saturation = 100;
                Lightness = 64;
                AlphaByte = 255;
                AlphaFloat = 1;
                Color = Color.Tomato;
                return;
            case "turquoise":
                Red = 64;
                Green = 224;
                Blue = 208;
                Hue = 174;
                Saturation = 72;
                Lightness = 56;
                AlphaByte = 255;
                AlphaFloat = 1;
                Color = Color.Turquoise;
                return;
            case "violet":
                Red = 238;
                Green = 130;
                Blue = 238;
                Hue = 300;
                Saturation = 76;
                Lightness = 72;
                AlphaByte = 255;
                AlphaFloat = 1;
                Color = Color.Violet;
                return;
            case "wheat":
                Red = 245;
                Green = 222;
                Blue = 179;
                Hue = 39;
                Saturation = 77;
                Lightness = 83;
                AlphaByte = 255;
                AlphaFloat = 1;
                Color = Color.Wheat;
                return;
            case "whitesmoke":
                Red = 245;
                Green = 245;
                Blue = 245;
                Hue = 0;
                Saturation = 0;
                Lightness = 96;
                AlphaByte = 255;
                AlphaFloat = 1;
                Color = Color.WhiteSmoke;
                return;
            case "yellowgreen":
                Red = 154;
                Green = 205;
                Blue = 50;
                Hue = 80;
                Saturation = 61;
                Lightness = 50;
                AlphaByte = 255;
                AlphaFloat = 1;
                Color = Color.YellowGreen;
                return;
            case "rebeccapurple":
                Red = 102;
                Green = 51;
                Blue = 153;
                Hue = 270;
                Saturation = 50;
                Lightness = 40;
                AlphaByte = 255;
                AlphaFloat = 1;
                Color = Color.RebeccaPurple;
                return;
            case "transparent":
                Red = 0;
                Green = 0;
                Blue = 0;
                Hue = 0;
                Saturation = 0;
                Lightness = 0;
                AlphaByte = 0;
                AlphaFloat = 0;
                Color = Color.Transparent;
                return;
        }

        var span = css.AsSpan();
        ReadOnlySpan<char> rSpan, gSpan, bSpan, aSpan;
        var hasAlpha = false;

        if (span[0] == '#')
        {
            span = span[1..];
        }

        if (span.Length == 3)
        {
            rSpan = new ReadOnlySpan<char>([span[0], span[0]]);
            gSpan = new ReadOnlySpan<char>([span[1], span[1]]);
            bSpan = new ReadOnlySpan<char>([span[2], span[2]]);
            aSpan = [];
        }
        else if (span.Length == 6)
        {
            rSpan = span[..2];
            gSpan = span[2..4];
            bSpan = span[4..];
            aSpan = [];
        }
        else if (span.Length == 8)
        {
            rSpan = span[..2];
            gSpan = span[2..4];
            bSpan = span[4..6];
            aSpan = span[6..];
            hasAlpha = true;
        }
        else
        {
            throw new ArgumentNullException(nameof(css), $"{nameof(css)} must be a valid CSS-style color string");
        }

        if (!byte.TryParse(rSpan, NumberStyles.HexNumber, CultureInfo.InvariantCulture, out var red))
        {
            throw new ArgumentNullException(nameof(css), $"{nameof(css)} must be a valid CSS-style color string");
        }
        else
        {
            Red = red;
        }

        if (!byte.TryParse(gSpan, NumberStyles.HexNumber, CultureInfo.InvariantCulture, out var green))
        {
            throw new ArgumentNullException(nameof(css), $"{nameof(css)} must be a valid CSS-style color string");
        }
        else
        {
            Green = green;
        }

        if (!byte.TryParse(bSpan, NumberStyles.HexNumber, CultureInfo.InvariantCulture, out var blue))
        {
            throw new ArgumentNullException(nameof(css), $"{nameof(css)} must be a valid CSS-style color string");
        }
        else
        {
            Blue = blue;
        }

        if (hasAlpha)
        {
            if (!byte.TryParse(aSpan, NumberStyles.HexNumber, CultureInfo.InvariantCulture, out var alpha))
            {
                throw new ArgumentNullException(nameof(css), $"{nameof(css)} must be a valid CSS-style color string");
            }
            else
            {
                AlphaByte = alpha;
                AlphaFloat = Math.Clamp(alpha / 255f, 0, 1);
            }
        }
        else
        {
            AlphaByte = 255;
            AlphaFloat = 1;
        }

        var hsl = RGBToHSL(red, green, blue);
        Hue = hsl[0];
        Saturation = (byte)hsl[1];
        Lightness = (byte)hsl[2];

        Color = Color.FromArgb(AlphaByte, Red, Green, Blue);
    }

    /// <summary>
    /// Constructs a new instance of <see cref="ColorFormatConverter"/> with the given values.
    /// </summary>
    /// <param name="color">
    /// The <see cref="System.Drawing.Color"/> equivalent of this color.
    /// </param>
    public ColorFormatConverter(Color color)
    {
        Color = color;
        Red = color.R;
        Green = color.G;
        Blue = color.B;
        AlphaByte = color.A;
        AlphaFloat = Math.Clamp(color.A / 255f, 0, 1);
        Hue = (ushort)(Math.Clamp((int)Math.Round(color.GetHue()), 0, 360) % 360);
        Saturation = (byte)Math.Clamp((int)Math.Round(color.GetSaturation() * 100), 0, 100);
        Lightness = (byte)Math.Clamp((int)Math.Round(color.GetBrightness() * 100), 0, 100);
    }

    private ColorFormatConverter(
        byte red,
        byte green,
        byte blue,
        ushort hue,
        byte saturation,
        byte lightness,
        byte alphaByte,
        float alphaFloat)
    {
        Red = red;
        Green = green;
        Blue = blue;
        Hue = hue;
        Saturation = saturation;
        Lightness = lightness;
        AlphaByte = alphaByte;
        AlphaFloat = alphaFloat;

        Color = Color.FromArgb(AlphaByte, Red, Green, Blue);
    }

    /// <summary>
    /// Gets a new instance of <see cref="ColorFormatConverter"/> with the given values.
    /// </summary>
    /// <param name="hue">
    /// <para>
    /// The hue of this color, as an integral degree.
    /// </para>
    /// <para>
    /// Degrees outside the valid range will be rotated to the valid range.
    /// </para>
    /// </param>
    /// <param name="saturation">
    /// The saturation of this color, as an integral percentage in the range [0-100].
    /// </param>
    /// <param name="lightness">
    /// The saturation of this color, as an integral percentage in the range [0-100].
    /// </param>
    /// <param name="alpha">
    /// The alpha component of this color, as an integral value in the range [0-255].
    /// </param>
    public static ColorFormatConverter FromHSLA(int hue, int saturation, int lightness, byte alpha = 255)
    {
        var h = (ushort)Math.Clamp(hue % 360, 0, 359);
        var s = (byte)Math.Clamp(saturation, 0, 100);
        var l = (byte)Math.Clamp(lightness, 0, 100);
        var rgb = HSLToRGB(h, s, l);
        return new ColorFormatConverter(
            rgb[0],
            rgb[1],
            rgb[2],
            h,
            s,
            l,
            alpha,
            Math.Clamp(alpha / 255f, 0, 1));
    }

    /// <summary>
    /// Gets a new instance of <see cref="ColorFormatConverter"/> with the given values.
    /// </summary>
    /// <param name="hue">
    /// <para>
    /// The hue of this color, as an integral degree.
    /// </para>
    /// <para>
    /// Degrees outside the valid range will be rotated to the valid range.
    /// </para>
    /// </param>
    /// <param name="saturation">
    /// The saturation of this color, as a floating-point value in the range [0-1].
    /// </param>
    /// <param name="lightness">
    /// The saturation of this color, as a floating-point value in the range [0-1].
    /// </param>
    /// <param name="alpha">
    /// The alpha component of this color, as a floating-point value in the range [0-1].
    /// </param>
    public static ColorFormatConverter FromHSLA(int hue, int saturation, int lightness, float alpha)
    {
        var h = (ushort)Math.Clamp(hue % 360, 0, 359);
        var s = (byte)Math.Clamp(saturation, 0, 100);
        var l = (byte)Math.Clamp(lightness, 0, 100);
        var rgb = HSLToRGB(h, s, l);
        return new ColorFormatConverter(
            rgb[0],
            rgb[1],
            rgb[2],
            h,
            s,
            l,
            (byte)Math.Clamp((int)Math.Round(alpha * 255), 0, 255),
            alpha);
    }

    private static byte[] HSLToRGB(ushort hue, byte saturation, byte lightness)
    {
        var rgb = new byte[3];
        if (Math.Abs(saturation) < Epsilon)
        {
            rgb[0] = (byte)Math.Clamp((int)Math.Ceiling(lightness * 2.55), 0, 255);
            rgb[1] = rgb[0];
            rgb[2] = rgb[0];
            return rgb;
        }

        var q = lightness < 50
            ? lightness / 100.0 * (1 + (saturation / 100.0))
            : ((lightness + saturation) / 100.0) - (lightness / 100.0 * (saturation / 100.0));
        var p = (lightness / 50.0) - q;

        var T = new double[3];
        T[1] = hue / 360.0; // Tb
        T[0] = T[1] + (1.0 / 3.0); // Tr
        T[2] = T[1] - (1.0 / 3.0); // Tg

        for (var i = 0; i < 3; i++)
        {
            if (T[i] < 0)
            {
                T[i]++;
            }

            if (T[i] > 1)
            {
                T[i]--;
            }

            if ((T[i] * 6) < 1)
            {
                T[i] = p + ((q - p) * 6 * T[i]);
            }
            else if ((T[i] * 2) < 1)
            {
                T[i] = q;
            }
            else if ((T[i] * 3) < 2)
            {
                T[i] = p + ((q - p) * ((2.0 / 3.0) - T[i]) * 6);
            }
            else
            {
                T[i] = p;
            }
        }

        rgb[0] = (byte)Math.Clamp((int)Math.Round(T[0] * 255), 0, 255);
        rgb[1] = (byte)Math.Clamp((int)Math.Round(T[1] * 255), 0, 255);
        rgb[2] = (byte)Math.Clamp((int)Math.Round(T[2] * 255), 0, 255);
        return rgb;
    }

    private static ushort[] RGBToHSL(byte red, byte green, byte blue)
    {
        var r = red / 255.0;
        var g = green / 255.0;
        var b = blue / 255.0;

        var max = Math.Max(r, Math.Max(g, b));
        var min = Math.Min(r, Math.Min(g, b));

        double hue;
        if (Math.Abs(max - min) < Epsilon)
        {
            hue = 0;
        }
        else if (Math.Abs(max - r) < Epsilon)
        {
            hue = 60 * (g - b) / (max - min);
            if (g < b)
            {
                hue += 360;
            }
        }
        else if (Math.Abs(max - g) < Epsilon)
        {
            hue = (60 * (b - r) / (max - min)) + 120;
        }
        else if (Math.Abs(max - b) < Epsilon)
        {
            hue = (60 * (r - g) / (max - min)) + 240;
        }
        else
        {
            hue = 0;
        }

        var lightness = (max + min) / 2;

        double saturation;
        if (Math.Abs(lightness) < Epsilon
            || Math.Abs(max - min) < Epsilon)
        {
            saturation = 0;
        }
        else if (lightness is > 0 and <= 0.5)
        {
            saturation = (max - min) / (max + min);
        }
        else if (lightness > 0.5)
        {
            saturation = (max - min) / (2 - (max + min));
        }
        else
        {
            saturation = 0;
        }

        var hsl = new ushort[3];
        hsl[0] = (ushort)(Math.Clamp((int)Math.Round(hue), 0, 360) % 360);
        hsl[1] = (ushort)Math.Clamp((int)Math.Round(saturation * 100), 0, 100);
        hsl[2] = (ushort)Math.Clamp((int)Math.Round(lightness * 100), 0, 100);
        return hsl;
    }
}
