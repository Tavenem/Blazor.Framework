export interface HSLA {
    alpha?: number;
    hue: number;
    lightness: number;
    saturation: number;
}

export interface RGBA {
    alpha?: number;
    blue: number;
    green: number;
    red: number;
}

export function colorNameToRgba(value?: string | null): RGBA | null {
    if (!value || !value.length) {
        return null;
    }

    switch (value.toLowerCase()) {
        case "transparent": return { red: 0, green: 0, blue: 0, alpha: 0, };
        case "black": return { red: 0, green: 0, blue: 0, alpha: 1 };
        case "white": return { red: 255, green: 255, blue: 255, alpha: 1 };
        case "red": return { red: 255, green: 0, blue: 0, alpha: 1 };
        case "lime": return { red: 0, green: 255, blue: 0, alpha: 1 };
        case "blue": return { red: 0, green: 0, blue: 255, alpha: 1 };
        case "fuschia": return { red: 255, green: 0, blue: 255, alpha: 1 };
        case "yellow": return { red: 255, green: 255, blue: 0, alpha: 1 };
        case "aqua": return { red: 0, green: 255, blue: 255, alpha: 1 };
        case "silver": return { red: 192, green: 192, blue: 192, alpha: 1 };
        case "gray": return { red: 128, green: 128, blue: 128, alpha: 1 };
        case "maroon": return { red: 128, green: 0, blue: 0, alpha: 1 };
        case "purple": return { red: 128, green: 0, blue: 128, alpha: 1 };
        case "green": return { red: 0, green: 128, blue: 0, alpha: 1 };
        case "olive": return { red: 128, green: 128, blue: 0, alpha: 1 };
        case "navy": return { red: 0, green: 0, blue: 128, alpha: 1 };
        case "teal": return { red: 0, green: 128, blue: 128, alpha: 1 };
        case "orange": return { red: 255, green: 165, blue: 0, alpha: 1 };
        case "aliceblue": return { red: 240, green: 248, blue: 255, alpha: 1 };
        case "antiquewhite": return { red: 250, green: 235, blue: 215, alpha: 1 };
        case "aquamarine": return { red: 127, green: 255, blue: 212, alpha: 1 };
        case "azure": return { red: 240, green: 255, blue: 255, alpha: 1 };
        case "beige": return { red: 245, green: 245, blue: 220, alpha: 1 };
        case "bisque": return { red: 255, green: 228, blue: 196, alpha: 1 };
        case "blanchedalmond": return { red: 255, green: 235, blue: 205, alpha: 1 };
        case "blueviolet": return { red: 138, green: 43, blue: 226, alpha: 1 };
        case "brown": return { red: 165, green: 42, blue: 42, alpha: 1 };
        case "burlywood": return { red: 222, green: 184, blue: 135, alpha: 1 };
        case "cadetblue": return { red: 95, green: 158, blue: 160, alpha: 1 };
        case "chartreuse": return { red: 127, green: 255, blue: 0, alpha: 1 };
        case "chocolate": return { red: 210, green: 105, blue: 30, alpha: 1 };
        case "coral": return { red: 255, green: 127, blue: 80, alpha: 1 };
        case "cornflowerblue": return { red: 100, green: 149, blue: 237, alpha: 1 };
        case "cornsilk": return { red: 255, green: 248, blue: 220, alpha: 1 };
        case "crimson": return { red: 220, green: 20, blue: 60, alpha: 1 };
        case "darkblue": return { red: 0, green: 0, blue: 139, alpha: 1 };
        case "darkcyan": return { red: 0, green: 139, blue: 139, alpha: 1 };
        case "darkgoldenrod": return { red: 184, green: 134, blue: 11, alpha: 1 };
        case "darkgray": return { red: 169, green: 169, blue: 169, alpha: 1 };
        case "darkgreen": return { red: 0, green: 100, blue: 0, alpha: 1 };
        case "darkkhaki": return { red: 189, green: 183, blue: 107, alpha: 1 };
        case "darkmagenta": return { red: 139, green: 0, blue: 139, alpha: 1 };
        case "darkolivegreen": return { red: 85, green: 107, blue: 47, alpha: 1 };
        case "darkorange": return { red: 255, green: 140, blue: 0, alpha: 1 };
        case "darkorchid": return { red: 153, green: 50, blue: 204, alpha: 1 };
        case "darkred": return { red: 139, green: 0, blue: 0, alpha: 1 };
        case "darksalmon": return { red: 233, green: 150, blue: 122, alpha: 1 };
        case "darkseagreen": return { red: 143, green: 188, blue: 143, alpha: 1 };
        case "darkslateblue": return { red: 72, green: 61, blue: 139, alpha: 1 };
        case "darkslategray": return { red: 47, green: 79, blue: 79, alpha: 1 };
        case "darkturquoise": return { red: 0, green: 206, blue: 209, alpha: 1 };
        case "darkviolet": return { red: 148, green: 0, blue: 211, alpha: 1 };
        case "deeppink": return { red: 255, green: 20, blue: 147, alpha: 1 };
        case "deepskyblue": return { red: 0, green: 191, blue: 255, alpha: 1 };
        case "dimgray": return { red: 105, green: 105, blue: 105, alpha: 1 };
        case "dodgerblue": return { red: 30, green: 144, blue: 255, alpha: 1 };
        case "firebrick": return { red: 178, green: 34, blue: 34, alpha: 1 };
        case "floralwhite": return { red: 255, green: 250, blue: 240, alpha: 1 };
        case "forestgreen": return { red: 34, green: 139, blue: 34, alpha: 1 };
        case "gainsboro": return { red: 220, green: 220, blue: 220, alpha: 1 };
        case "ghostwhite": return { red: 248, green: 248, blue: 255, alpha: 1 };
        case "gold": return { red: 255, green: 215, blue: 0, alpha: 1 };
        case "goldenrod": return { red: 218, green: 165, blue: 32, alpha: 1 };
        case "greenyellow": return { red: 173, green: 255, blue: 47, alpha: 1 };
        case "honeydew": return { red: 240, green: 255, blue: 240, alpha: 1 };
        case "hotpink": return { red: 255, green: 105, blue: 180, alpha: 1 };
        case "indianred": return { red: 205, green: 92, blue: 92, alpha: 1 };
        case "indigo": return { red: 75, green: 0, blue: 130, alpha: 1 };
        case "ivory": return { red: 255, green: 255, blue: 240, alpha: 1 };
        case "khaki": return { red: 240, green: 230, blue: 140, alpha: 1 };
        case "lavender": return { red: 230, green: 230, blue: 250, alpha: 1 };
        case "lavenderblush": return { red: 255, green: 240, blue: 245, alpha: 1 };
        case "lawngreen": return { red: 124, green: 252, blue: 0, alpha: 1 };
        case "lemonchiffon": return { red: 255, green: 250, blue: 205, alpha: 1 };
        case "lightblue": return { red: 173, green: 216, blue: 230, alpha: 1 };
        case "lightcoral": return { red: 240, green: 128, blue: 128, alpha: 1 };
        case "lightcyan": return { red: 224, green: 255, blue: 255, alpha: 1 };
        case "lightgoldenrodyellow": return { red: 250, green: 250, blue: 210, alpha: 1 };
        case "lightgray": return { red: 211, green: 211, blue: 211, alpha: 1 };
        case "lightgreen": return { red: 144, green: 238, blue: 144, alpha: 1 };
        case "lightpink": return { red: 255, green: 182, blue: 193, alpha: 1 };
        case "lightsalmon": return { red: 255, green: 160, blue: 122, alpha: 1 };
        case "lightseagreen": return { red: 32, green: 178, blue: 170, alpha: 1 };
        case "lightskyblue": return { red: 135, green: 206, blue: 250, alpha: 1 };
        case "lightslategray": return { red: 119, green: 136, blue: 153, alpha: 1 };
        case "lightsteelblue": return { red: 176, green: 196, blue: 222, alpha: 1 };
        case "lightyellow": return { red: 255, green: 255, blue: 224, alpha: 1 };
        case "limegreen": return { red: 50, green: 205, blue: 50, alpha: 1 };
        case "linen": return { red: 250, green: 240, blue: 230, alpha: 1 };
        case "mediumaquamarine": return { red: 102, green: 205, blue: 170, alpha: 1 };
        case "mediumblue": return { red: 0, green: 0, blue: 205, alpha: 1 };
        case "mediumorchid": return { red: 186, green: 85, blue: 211, alpha: 1 };
        case "mediumpurple": return { red: 147, green: 112, blue: 219, alpha: 1 };
        case "mediumseagreen": return { red: 60, green: 179, blue: 113, alpha: 1 };
        case "mediumslateblue": return { red: 123, green: 104, blue: 238, alpha: 1 };
        case "mediumspringgreen": return { red: 0, green: 250, blue: 154, alpha: 1 };
        case "mediumturquoise": return { red: 72, green: 209, blue: 204, alpha: 1 };
        case "mediumvioletred": return { red: 199, green: 21, blue: 133, alpha: 1 };
        case "midnightblue": return { red: 25, green: 25, blue: 112, alpha: 1 };
        case "mintcream": return { red: 245, green: 255, blue: 250, alpha: 1 };
        case "mistyrose": return { red: 255, green: 228, blue: 225, alpha: 1 };
        case "moccasin": return { red: 255, green: 228, blue: 181, alpha: 1 };
        case "navajowhite": return { red: 255, green: 222, blue: 173, alpha: 1 };
        case "oldlace": return { red: 253, green: 245, blue: 230, alpha: 1 };
        case "olivedrab": return { red: 107, green: 142, blue: 35, alpha: 1 };
        case "orangered": return { red: 255, green: 69, blue: 0, alpha: 1 };
        case "orchid": return { red: 218, green: 112, blue: 214, alpha: 1 };
        case "palegoldenrod": return { red: 238, green: 232, blue: 170, alpha: 1 };
        case "palegreen": return { red: 152, green: 251, blue: 152, alpha: 1 };
        case "paleturquoise": return { red: 175, green: 238, blue: 238, alpha: 1 };
        case "palevioletred": return { red: 219, green: 112, blue: 147, alpha: 1 };
        case "papayawhip": return { red: 255, green: 239, blue: 213, alpha: 1 };
        case "peachpuff": return { red: 255, green: 218, blue: 185, alpha: 1 };
        case "peru": return { red: 205, green: 133, blue: 63, alpha: 1 };
        case "pink": return { red: 255, green: 192, blue: 203, alpha: 1 };
        case "plum": return { red: 221, green: 160, blue: 221, alpha: 1 };
        case "powderblue": return { red: 176, green: 224, blue: 230, alpha: 1 };
        case "rosybrown": return { red: 188, green: 143, blue: 143, alpha: 1 };
        case "royalblue": return { red: 65, green: 105, blue: 225, alpha: 1 };
        case "saddlebrown": return { red: 139, green: 69, blue: 19, alpha: 1 };
        case "salmon": return { red: 250, green: 128, blue: 114, alpha: 1 };
        case "sandybrown": return { red: 244, green: 164, blue: 96, alpha: 1 };
        case "seagreen": return { red: 46, green: 139, blue: 87, alpha: 1 };
        case "seashell": return { red: 255, green: 245, blue: 238, alpha: 1 };
        case "sienna": return { red: 160, green: 82, blue: 45, alpha: 1 };
        case "skyblue": return { red: 135, green: 206, blue: 235, alpha: 1 };
        case "slateblue": return { red: 106, green: 90, blue: 205, alpha: 1 };
        case "slategray": return { red: 112, green: 128, blue: 144, alpha: 1 };
        case "snow": return { red: 255, green: 250, blue: 250, alpha: 1 };
        case "springgreen": return { red: 0, green: 255, blue: 127, alpha: 1 };
        case "steelblue": return { red: 70, green: 130, blue: 180, alpha: 1 };
        case "tan": return { red: 210, green: 180, blue: 140, alpha: 1 };
        case "thistle": return { red: 216, green: 191, blue: 216, alpha: 1 };
        case "tomato": return { red: 255, green: 99, blue: 71, alpha: 1 };
        case "turquoise": return { red: 64, green: 224, blue: 208, alpha: 1 };
        case "violet": return { red: 238, green: 130, blue: 238, alpha: 1 };
        case "wheat": return { red: 245, green: 222, blue: 179, alpha: 1 };
        case "whitesmoke": return { red: 245, green: 245, blue: 245, alpha: 1 };
        case "yellowgreen": return { red: 154, green: 205, blue: 50, alpha: 1 };
        case "rebeccapurple": return { red: 102, green: 51, blue: 153, alpha: 1 };
        default: return null;
    }
}

export function hexToHsla(value ?: string | null): ({ hsla: HSLA, rgba: RGBA }) | null {
    if (!value || !value.length) {
        return null;
    }

    const rgba = hexToRgba(value);
    if (!rgba) {
        return null;
    }

    const hsla = rgbaToHsla(rgba);
    if (!hsla) {
        return null;
    }

    return {
        hsla: hsla,
        rgba: rgba,
    };
}

export function hexToRgba(value ?: string | null): RGBA | null {
    if (!value || !value.length) {
        return null;
    }

    const valid = /^#?([A-Fa-f0-9]{3,4}){1,2}$/.test(value);
    if (!valid) {
        return colorNameToRgba(value);
    }

    const hash = value.startsWith('#');
    const size = Math.floor((hash ? value.length - 1 : value.length) / 3);
    const values = (hash ? value.slice(1) : value).match(new RegExp(`.{${size}}`, "g"));
    if (!values || values.length < 3) {
        return null;
    }

    const r = parseInt(values[0].repeat(2 / values[0].length), 16);
    const g = parseInt(values[1].repeat(2 / values[1].length), 16);
    const b = parseInt(values[2].repeat(2 / values[2].length), 16);
    const a = values.length > 3
        ? parseInt(values[3].repeat(2 / values[3].length), 16) / 255
        : 1;
    if (Number.isNaN(r)
        || Number.isNaN(g)
        || Number.isNaN(b)
        || (a != null && Number.isNaN(a))) {
        return null;
    }

    return {
        red: Math.round(r),
        green: Math.round(g),
        blue: Math.round(b),
        alpha: a,
    };
}

export function hslaToHex(value ?: HSLA | null, alpha ?: boolean): string | null {
    if (!value) {
        return null;
    }

    let s = value.saturation / 100;
    let l = value.lightness / 100;

    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs((value.hue / 60) % 2 - 1));
    const m = l - c / 2;
    let r = 0,
        g = 0,
        b = 0;

    if (0 <= value.hue && value.hue < 60) {
        r = c; g = x; b = 0;
    } else if (60 <= value.hue && value.hue < 120) {
        r = x; g = c; b = 0;
    } else if (120 <= value.hue && value.hue < 180) {
        r = 0; g = c; b = x;
    } else if (180 <= value.hue && value.hue < 240) {
        r = 0; g = x; b = c;
    } else if (240 <= value.hue && value.hue < 300) {
        r = x; g = 0; b = c;
    } else if (300 <= value.hue && value.hue < 360) {
        r = c; g = 0; b = x;
    }

    // Having obtained RGB, convert channels to hex
    let rr = Math.round((r + m) * 255).toString(16);
    let gg = Math.round((g + m) * 255).toString(16);
    let bb = Math.round((b + m) * 255).toString(16);

    let aa = alpha && value.alpha != null
        ? Math.round(value.alpha * 255).toString(16)
        : null;

    // Prepend 0s, if necessary
    if (rr.length == 1) {
        rr = "0" + rr;
    }
    if (gg.length == 1) {
        gg = "0" + gg;
    }
    if (bb.length == 1) {
        bb = "0" + bb;
    }
    if (aa && aa.length == 1) {
        aa = "0" + aa;
    }

    if (!aa
        && (rr[0] == rr[1]
            && gg[0] == gg[1]
            && bb[0] == bb[1])) {
        rr = rr[0];
        gg = gg[0];
        bb = bb[0];
    }

    return aa
        ? "#" + rr + gg + bb + aa
        : "#" + rr + gg + bb;
}

export function rgbaToColorName(rgba ?: RGBA | null) {
    if (!rgba) {
        return null;
    }

    if (rgba.alpha === 0) {
        return "transparent";
    }

    if (rgba.alpha && rgba.alpha < 1) {
        return null;
    }

    if (rgba.red == 0
        && rgba.green == 0
        && rgba.blue == 0) {
        return "black";
    }
    if (rgba.red == 255
        && rgba.green == 255
        && rgba.blue == 255) {
        return "white";
    }
    if (rgba.red == 255
        && rgba.green == 0
        && rgba.blue == 0) {
        return "red";
    }
    if (rgba.red == 0
        && rgba.green == 255
        && rgba.blue == 0) {
        return "lime";
    }
    if (rgba.red == 0
        && rgba.green == 0
        && rgba.blue == 255) {
        return "blue";
    }
    if (rgba.red == 255
        && rgba.green == 0
        && rgba.blue == 255) {
        return "fuschia";
    }
    if (rgba.red == 255
        && rgba.green == 255
        && rgba.blue == 0) {
        return "yellow";
    }
    if (rgba.red == 0
        && rgba.green == 255
        && rgba.blue == 255) {
        return "aqua";
    }
    if (rgba.red == 192
        && rgba.green == 192
        && rgba.blue == 192) {
        return "silver";
    }
    if (rgba.red == 128
        && rgba.green == 128
        && rgba.blue == 128) {
        return "gray";
    }
    if (rgba.red == 128
        && rgba.green == 0
        && rgba.blue == 0) {
        return "maroon";
    }
    if (rgba.red == 128
        && rgba.green == 0
        && rgba.blue == 128) {
        return "purple";
    }
    if (rgba.red == 0
        && rgba.green == 128
        && rgba.blue == 0) {
        return "green";
    }
    if (rgba.red == 128
        && rgba.green == 128
        && rgba.blue == 0) {
        return "olive";
    }
    if (rgba.red == 0
        && rgba.green == 0
        && rgba.blue == 128) {
        return "navy";
    }
    if (rgba.red == 0
        && rgba.green == 128
        && rgba.blue == 128) {
        return "teal";
    }
    if (rgba.red == 255
        && rgba.green == 165
        && rgba.blue == 0) {
        return "orange";
    }
    if (rgba.red == 240
        && rgba.green == 248
        && rgba.blue == 255) {
        return "aliceblue";
    }
    if (rgba.red == 250
        && rgba.green == 235
        && rgba.blue == 215) {
        return "antiquewhite";
    }
    if (rgba.red == 127
        && rgba.green == 255
        && rgba.blue == 212) {
        return "aquamarine";
    }
    if (rgba.red == 240
        && rgba.green == 255
        && rgba.blue == 255) {
        return "azure";
    }
    if (rgba.red == 245
        && rgba.green == 245
        && rgba.blue == 220) {
        return "beige";
    }
    if (rgba.red == 255
        && rgba.green == 228
        && rgba.blue == 196) {
        return "bisque";
    }
    if (rgba.red == 255
        && rgba.green == 235
        && rgba.blue == 205) {
        return "blanchedalmond";
    }
    if (rgba.red == 138
        && rgba.green == 43
        && rgba.blue == 226) {
        return "blueviolet";
    }
    if (rgba.red == 165
        && rgba.green == 42
        && rgba.blue == 42) {
        return "brown";
    }
    if (rgba.red == 222
        && rgba.green == 184
        && rgba.blue == 135) {
        return "burlywood";
    }
    if (rgba.red == 95
        && rgba.green == 158
        && rgba.blue == 160) {
        return "cadetblue";
    }
    if (rgba.red == 127
        && rgba.green == 255
        && rgba.blue == 0) {
        return "chartreuse";
    }
    if (rgba.red == 210
        && rgba.green == 105
        && rgba.blue == 30) {
        return "chocolate";
    }
    if (rgba.red == 255
        && rgba.green == 127
        && rgba.blue == 80) {
        return "coral";
    }
    if (rgba.red == 100
        && rgba.green == 149
        && rgba.blue == 237) {
        return "cornflowerblue";
    }
    if (rgba.red == 255
        && rgba.green == 248
        && rgba.blue == 220) {
        return "cornsilk";
    }
    if (rgba.red == 220
        && rgba.green == 20
        && rgba.blue == 60) {
        return "crimson";
    }
    if (rgba.red == 0
        && rgba.green == 0
        && rgba.blue == 139) {
        return "darkblue";
    }
    if (rgba.red == 0
        && rgba.green == 139
        && rgba.blue == 139) {
        return "darkcyan";
    }
    if (rgba.red == 184
        && rgba.green == 134
        && rgba.blue == 11) {
        return "darkgoldenrod";
    }
    if (rgba.red == 169
        && rgba.green == 169
        && rgba.blue == 169) {
        return "darkgray";
    }
    if (rgba.red == 0
        && rgba.green == 100
        && rgba.blue == 0) {
        return "darkgreen";
    }
    if (rgba.red == 189
        && rgba.green == 183
        && rgba.blue == 107) {
        return "darkkhaki";
    }
    if (rgba.red == 139
        && rgba.green == 0
        && rgba.blue == 139) {
        return "darkmagenta";
    }
    if (rgba.red == 85
        && rgba.green == 107
        && rgba.blue == 47) {
        return "darkolivegreen";
    }
    if (rgba.red == 255
        && rgba.green == 140
        && rgba.blue == 0) {
        return "darkorange";
    }
    if (rgba.red == 153
        && rgba.green == 50
        && rgba.blue == 204) {
        return "darkorchid";
    }
    if (rgba.red == 139
        && rgba.green == 0
        && rgba.blue == 0) {
        return "darkred";
    }
    if (rgba.red == 233
        && rgba.green == 150
        && rgba.blue == 122) {
        return "darksalmon";
    }
    if (rgba.red == 143
        && rgba.green == 188
        && rgba.blue == 143) {
        return "darkseagreen";
    }
    if (rgba.red == 72
        && rgba.green == 61
        && rgba.blue == 139) {
        return "darkslateblue";
    }
    if (rgba.red == 47
        && rgba.green == 79
        && rgba.blue == 79) {
        return "darkslategray";
    }
    if (rgba.red == 0
        && rgba.green == 206
        && rgba.blue == 209) {
        return "darkturquoise";
    }
    if (rgba.red == 148
        && rgba.green == 0
        && rgba.blue == 211) {
        return "darkviolet";
    }
    if (rgba.red == 255
        && rgba.green == 20
        && rgba.blue == 147) {
        return "deeppink";
    }
    if (rgba.red == 0
        && rgba.green == 191
        && rgba.blue == 255) {
        return "deepskyblue";
    }
    if (rgba.red == 105
        && rgba.green == 105
        && rgba.blue == 105) {
        return "dimgray";
    }
    if (rgba.red == 30
        && rgba.green == 144
        && rgba.blue == 255) {
        return "dodgerblue";
    }
    if (rgba.red == 178
        && rgba.green == 34
        && rgba.blue == 34) {
        return "firebrick";
    }
    if (rgba.red == 255
        && rgba.green == 250
        && rgba.blue == 240) {
        return "floralwhite";
    }
    if (rgba.red == 34
        && rgba.green == 139
        && rgba.blue == 34) {
        return "forestgreen";
    }
    if (rgba.red == 220
        && rgba.green == 220
        && rgba.blue == 220) {
        return "gainsboro";
    }
    if (rgba.red == 248
        && rgba.green == 248
        && rgba.blue == 255) {
        return "ghostwhite";
    }
    if (rgba.red == 255
        && rgba.green == 215
        && rgba.blue == 0) {
        return "gold";
    }
    if (rgba.red == 218
        && rgba.green == 165
        && rgba.blue == 32) {
        return "goldenrod";
    }
    if (rgba.red == 173
        && rgba.green == 255
        && rgba.blue == 47) {
        return "greenyellow";
    }
    if (rgba.red == 240
        && rgba.green == 255
        && rgba.blue == 240) {
        return "honeydew";
    }
    if (rgba.red == 255
        && rgba.green == 105
        && rgba.blue == 180) {
        return "hotpink";
    }
    if (rgba.red == 205
        && rgba.green == 92
        && rgba.blue == 92) {
        return "indianred";
    }
    if (rgba.red == 75
        && rgba.green == 0
        && rgba.blue == 130) {
        return "indigo";
    }
    if (rgba.red == 255
        && rgba.green == 255
        && rgba.blue == 240) {
        return "ivory";
    }
    if (rgba.red == 240
        && rgba.green == 230
        && rgba.blue == 140) {
        return "khaki";
    }
    if (rgba.red == 230
        && rgba.green == 230
        && rgba.blue == 250) {
        return "lavender";
    }
    if (rgba.red == 255
        && rgba.green == 240
        && rgba.blue == 245) {
        return "lavenderblush";
    }
    if (rgba.red == 124
        && rgba.green == 252
        && rgba.blue == 0) {
        return "lawngreen";
    }
    if (rgba.red == 255
        && rgba.green == 250
        && rgba.blue == 205) {
        return "lemonchiffon";
    }
    if (rgba.red == 173
        && rgba.green == 216
        && rgba.blue == 230) {
        return "lightblue";
    }
    if (rgba.red == 240
        && rgba.green == 128
        && rgba.blue == 128) {
        return "lightcoral";
    }
    if (rgba.red == 224
        && rgba.green == 255
        && rgba.blue == 255) {
        return "lightcyan";
    }
    if (rgba.red == 250
        && rgba.green == 250
        && rgba.blue == 210) {
        return "lightgoldenrodyellow";
    }
    if (rgba.red == 211
        && rgba.green == 211
        && rgba.blue == 211) {
        return "lightgray";
    }
    if (rgba.red == 144
        && rgba.green == 238
        && rgba.blue == 144) {
        return "lightgreen";
    }
    if (rgba.red == 255
        && rgba.green == 182
        && rgba.blue == 193) {
        return "lightpink";
    }
    if (rgba.red == 255
        && rgba.green == 160
        && rgba.blue == 122) {
        return "lightsalmon";
    }
    if (rgba.red == 32
        && rgba.green == 178
        && rgba.blue == 170) {
        return "lightseagreen";
    }
    if (rgba.red == 135
        && rgba.green == 206
        && rgba.blue == 250) {
        return "lightskyblue";
    }
    if (rgba.red == 119
        && rgba.green == 136
        && rgba.blue == 153) {
        return "lightslategray";
    }
    if (rgba.red == 176
        && rgba.green == 196
        && rgba.blue == 222) {
        return "lightsteelblue";
    }
    if (rgba.red == 255
        && rgba.green == 255
        && rgba.blue == 224) {
        return "lightyellow";
    }
    if (rgba.red == 50
        && rgba.green == 205
        && rgba.blue == 50) {
        return "limegreen";
    }
    if (rgba.red == 250
        && rgba.green == 240
        && rgba.blue == 230) {
        return "linen";
    }
    if (rgba.red == 102
        && rgba.green == 205
        && rgba.blue == 170) {
        return "mediumaquamarine";
    }
    if (rgba.red == 0
        && rgba.green == 0
        && rgba.blue == 205) {
        return "mediumblue";
    }
    if (rgba.red == 186
        && rgba.green == 85
        && rgba.blue == 211) {
        return "mediumorchid";
    }
    if (rgba.red == 147
        && rgba.green == 112
        && rgba.blue == 219) {
        return "mediumpurple";
    }
    if (rgba.red == 60
        && rgba.green == 179
        && rgba.blue == 113) {
        return "mediumseagreen";
    }
    if (rgba.red == 123
        && rgba.green == 104
        && rgba.blue == 238) {
        return "mediumslateblue";
    }
    if (rgba.red == 0
        && rgba.green == 250
        && rgba.blue == 154) {
        return "mediumspringgreen";
    }
    if (rgba.red == 72
        && rgba.green == 209
        && rgba.blue == 204) {
        return "mediumturquoise";
    }
    if (rgba.red == 199
        && rgba.green == 21
        && rgba.blue == 133) {
        return "mediumvioletred";
    }
    if (rgba.red == 25
        && rgba.green == 25
        && rgba.blue == 112) {
        return "midnightblue";
    }
    if (rgba.red == 245
        && rgba.green == 255
        && rgba.blue == 250) {
        return "mintcream";
    }
    if (rgba.red == 255
        && rgba.green == 228
        && rgba.blue == 225) {
        return "mistyrose";
    }
    if (rgba.red == 255
        && rgba.green == 228
        && rgba.blue == 181) {
        return "moccasin";
    }
    if (rgba.red == 255
        && rgba.green == 222
        && rgba.blue == 173) {
        return "navajowhite";
    }
    if (rgba.red == 253
        && rgba.green == 245
        && rgba.blue == 230) {
        return "oldlace";
    }
    if (rgba.red == 107
        && rgba.green == 142
        && rgba.blue == 35) {
        return "olivedrab";
    }
    if (rgba.red == 255
        && rgba.green == 69
        && rgba.blue == 0) {
        return "orangered";
    }
    if (rgba.red == 218
        && rgba.green == 112
        && rgba.blue == 214) {
        return "orchid";
    }
    if (rgba.red == 238
        && rgba.green == 232
        && rgba.blue == 170) {
        return "palegoldenrod";
    }
    if (rgba.red == 152
        && rgba.green == 251
        && rgba.blue == 152) {
        return "palegreen";
    }
    if (rgba.red == 175
        && rgba.green == 238
        && rgba.blue == 238) {
        return "paleturquoise";
    }
    if (rgba.red == 219
        && rgba.green == 112
        && rgba.blue == 147) {
        return "palevioletred";
    }
    if (rgba.red == 255
        && rgba.green == 239
        && rgba.blue == 213) {
        return "papayawhip";
    }
    if (rgba.red == 255
        && rgba.green == 218
        && rgba.blue == 185) {
        return "peachpuff";
    }
    if (rgba.red == 205
        && rgba.green == 133
        && rgba.blue == 63) {
        return "peru";
    }
    if (rgba.red == 255
        && rgba.green == 192
        && rgba.blue == 203) {
        return "pink";
    }
    if (rgba.red == 221
        && rgba.green == 160
        && rgba.blue == 221) {
        return "plum";
    }
    if (rgba.red == 176
        && rgba.green == 224
        && rgba.blue == 230) {
        return "powderblue";
    }
    if (rgba.red == 188
        && rgba.green == 143
        && rgba.blue == 143) {
        return "rosybrown";
    }
    if (rgba.red == 65
        && rgba.green == 105
        && rgba.blue == 225) {
        return "royalblue";
    }
    if (rgba.red == 139
        && rgba.green == 69
        && rgba.blue == 19) {
        return "saddlebrown";
    }
    if (rgba.red == 250
        && rgba.green == 128
        && rgba.blue == 114) {
        return "salmon";
    }
    if (rgba.red == 244
        && rgba.green == 164
        && rgba.blue == 96) {
        return "sandybrown";
    }
    if (rgba.red == 46
        && rgba.green == 139
        && rgba.blue == 87) {
        return "seagreen";
    }
    if (rgba.red == 255
        && rgba.green == 245
        && rgba.blue == 238) {
        return "seashell";
    }
    if (rgba.red == 160
        && rgba.green == 82
        && rgba.blue == 45) {
        return "sienna";
    }
    if (rgba.red == 135
        && rgba.green == 206
        && rgba.blue == 235) {
        return "skyblue";
    }
    if (rgba.red == 106
        && rgba.green == 90
        && rgba.blue == 205) {
        return "slateblue";
    }
    if (rgba.red == 112
        && rgba.green == 128
        && rgba.blue == 144) {
        return "slategray";
    }
    if (rgba.red == 255
        && rgba.green == 250
        && rgba.blue == 250) {
        return "snow";
    }
    if (rgba.red == 0
        && rgba.green == 255
        && rgba.blue == 127) {
        return "springgreen";
    }
    if (rgba.red == 70
        && rgba.green == 130
        && rgba.blue == 180) {
        return "steelblue";
    }
    if (rgba.red == 210
        && rgba.green == 180
        && rgba.blue == 140) {
        return "tan";
    }
    if (rgba.red == 216
        && rgba.green == 191
        && rgba.blue == 216) {
        return "thistle";
    }
    if (rgba.red == 255
        && rgba.green == 99
        && rgba.blue == 71) {
        return "tomato";
    }
    if (rgba.red == 64
        && rgba.green == 224
        && rgba.blue == 208) {
        return "turquoise";
    }
    if (rgba.red == 238
        && rgba.green == 130
        && rgba.blue == 238) {
        return "violet";
    }
    if (rgba.red == 245
        && rgba.green == 222
        && rgba.blue == 179) {
        return "wheat";
    }
    if (rgba.red == 245
        && rgba.green == 245
        && rgba.blue == 245) {
        return "whitesmoke";
    }
    if (rgba.red == 154
        && rgba.green == 205
        && rgba.blue == 50) {
        return "yellowgreen";
    }
    if (rgba.red == 102
        && rgba.green == 51
        && rgba.blue == 153) {
        return "rebeccapurple";
    }
    return null;
}

export function rgbaToHsla(value ?: RGBA | null): HSLA | null {
    if (!value) {
        return null;
    }

    const r = value.red / 255;
    const g = value.green / 255;
    const b = value.blue / 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max == min) {
        h = s = 0; // achromatic
    } else {
        const d = max - min;
        s = l > 0.5
            ? d / (2 - max - min)
            : d / (max + min);
        switch (max) {
            case r:
                h = (g - b) / d + (g < b ? 6 : 0);
                break;
            case g:
                h = (b - r) / d + 2;
                break;
            default:
                h = (r - g) / d + 4;
                break;
        }
        h /= 6;
    }

    return {
        hue: Math.round(h * 360),
        lightness: Math.round(l * 100),
        saturation: Math.round(s * 100),
        alpha: value.alpha,
    };
}