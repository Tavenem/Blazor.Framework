import {
    CalendarDate,
    CalendarDateTime,
    DateDuration,
    DateFields,
    DateFormatter,
    DateTimeDuration,
    DateValue,
    getLocalTimeZone,
    GregorianCalendar,
    now,
    Time,
    TimeDuration,
    TimeFields,
    toCalendar,
    toTime,
    toZoned,
    ZonedDateTime
} from '@internationalized/date'

interface ZoneOffsetOpts {
    /*
     * What style of offset to return
     */
    format?: 'long' | 'short';

    /*
     * The locale in which to return the offset name
     */
    locale?: string;
}

interface Zone {
    /**
     * The type of zone
     */
    get type(): string;

    /**
     * The name of this zone.
     */
    get name(): string;

    /*
     * The IANA name of this zone.
     */
    get ianaName(): string;

    /**
     * Returns whether the offset is known to be fixed for the whole year.
     */
    get isUniversal(): boolean;

    /**
     * Return whether this Zone is valid.
     */
    get isValid(): boolean;

    /**
     * Returns the offset's common name (such as EST) at the specified timestamp
     * @param ts - Epoch milliseconds for which to get the name
     * @param opts - Options to affect the format
     */
    offsetName(ts: number, opts: ZoneOffsetOpts): string | null;

    /**
     * Returns the offset's value as a string
     * @param ts - Epoch milliseconds for which to get the offset
     * @param format - What style of offset to return.
     *                 Accepts 'narrow', 'short', or 'techie'. Returns '+6', '+06:00', or '+0600' respectively
     */
    formatOffset(ts: number, format: 'narrow' | 'short' | 'techie'): string;

    /**
     * Return the offset in minutes for this zone at the specified timestamp.
     * @param ts - Epoch milliseconds for which to compute the offset
     */
    offset(ts: number): number;

    /**
     * Return whether this Zone is equal to another zone
     * @param otherZone - the zone to compare
     */
    equals(otherZone: Zone): boolean;
}

interface MonthObject {
    monthName?: string;
}

interface WeekObject {
    week?: number;
    weekday?: number;
    weekdayName?: string;
}

type DateTimeObject = DateFields & TimeFields & MonthObject & WeekObject;

type ExtractorResult = [
    DateTimeObject | null,
    (Zone | null)?,
    number?
];

type Extractor = (x: RegExpExecArray, cursor?: number) => ExtractorResult;

type Pattern = [RegExp, Extractor];

type PartsArray = [number?, number?, number?, string?, number?, number?, number?, number?, string?, string?, string?, string?, any?];


export const defaultCalendar = new GregorianCalendar();
let dtfCache: Record<string, Intl.DateTimeFormat> = {};
let fixedOffsetZoneSingleton: FixedOffsetZone | null = null;
let ianaZoneCache: Record<string, IANAZone> = {};

const nonLeapLadder = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334],
    leapLadder = [0, 31, 60, 91, 121, 152, 182, 213, 244, 274, 305, 335];

const ianaRegex = /[A-Za-z_+-]{1,256}(?::?\/[A-Za-z0-9_+-]{1,256}(?:\/[A-Za-z0-9_+-]{1,256})?)?/;
const isoDuration =
    /^-?P(?:(?:(-?\d{1,20}(?:\.\d{1,20})?)Y)?(?:(-?\d{1,20}(?:\.\d{1,20})?)M)?(?:(-?\d{1,20}(?:\.\d{1,20})?)W)?(?:(-?\d{1,20}(?:\.\d{1,20})?)D)?(?:T(?:(-?\d{1,20}(?:\.\d{1,20})?)H)?(?:(-?\d{1,20}(?:\.\d{1,20})?)M)?(?:(-?\d{1,20})(?:[.,](-?\d{1,20}))?S)?)?)$/;
const offsetRegex = /(?:(Z)|([+-]\d\d)(?::?(\d\d))?)/;
const isoExtendedZone = `(?:${offsetRegex.source}?(?:\\[(${ianaRegex.source})\\])?)?`;
const isoTimeBaseRegex = /(\d\d)(?::?(\d\d)(?::?(\d\d)(?:[.,](\d{1,30}))?)?)?/;
const isoTimeRegex = RegExp(`${isoTimeBaseRegex.source}${isoExtendedZone}`);
const isoTimeExtensionRegex = RegExp(`(?:T${isoTimeRegex.source})?`);
const isoTimeOnly = RegExp(`^T?${isoTimeBaseRegex.source}$`);
const isoYmdRegex = /([+-]\d{6}|\d{4})(?:-?(\d\d)(?:-?(\d\d))?)?/;
const isoWeekRegex = /(\d{4})-?W(\d\d)(?:-?(\d))?/;
const isoOrdinalRegex = /(\d{4})-?(\d{3})/;
const monthsShort = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const extractISOWeekData = simpleParse("weekYear", "weekNumber", "weekDay");
const extractISOOrdinalData = simpleParse("year", "ordinal");
const obsOffsets: Record<string, number> = {
    GMT: 0,
    EDT: -4 * 60,
    EST: -5 * 60,
    CDT: -5 * 60,
    CST: -6 * 60,
    MDT: -6 * 60,
    MST: -7 * 60,
    PDT: -7 * 60,
    PST: -8 * 60,
};
const rfc1123 =
    /^(Mon|Tue|Wed|Thu|Fri|Sat|Sun), (\d\d) (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) (\d{4}) (\d\d):(\d\d):(\d\d) GMT$/,
    rfc850 =
        /^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday), (\d\d)-(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)-(\d\d) (\d\d):(\d\d):(\d\d) GMT$/,
    ascii =
        /^(Mon|Tue|Wed|Thu|Fri|Sat|Sun) (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) ( \d|\d\d) (\d\d):(\d\d):(\d\d) (\d{4})$/;
const rfc2822 =
    /^(?:(Mon|Tue|Wed|Thu|Fri|Sat|Sun),\s)?(\d{1,2})\s(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s(\d{2,4})\s(\d\d):(\d\d)(?::(\d\d))?\s(?:(UT|GMT|[ECMP][SD]T)|([Zz])|(?:([+-]\d\d)(\d\d)))$/;
const sqlYmdRegex = /(\d{4})-(\d\d)-(\d\d)/; // dumbed-down version of the ISO one
const sqlTimeRegex = RegExp(
    `${isoTimeBaseRegex.source} ?(?:${offsetRegex.source}|(${ianaRegex.source}))?`
);
const sqlTimeExtensionRegex = RegExp(`(?: ${sqlTimeRegex.source})?`);
const twoDigitCutoffYear = 49;
const typeToPos: Intl.DateTimeFormatPartTypesRegistry = {
    year: 0,
    month: 1,
    day: 2,
    era: 3,
    hour: 4,
    minute: 5,
    second: 6,
    fractionalSecond: 7,
    dayPeriod: 8,
    literal: 9,
    timeZoneName: 10,
    weekday: 11,
    unknown: 12,
};
const weekdaysLong = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const weekdaysShort = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const mdyRegex = /(?:(\d{1,2}[-/ ]))?(?:(\d{1,2})[-/ ])?([+-]\d{6}|\d{4}|\d{2})/;
const timeExtensionRegex = RegExp(`(?:[,\s]*${isoTimeRegex.source})?`);

/**
 * A zone with a fixed offset (meaning no DST)
 */
class FixedOffsetZone implements Zone {
    private fixed: number;

    /**
     * Get a singleton instance of UTC
     */
    static get utcInstance() {
        if (fixedOffsetZoneSingleton === null) {
            fixedOffsetZoneSingleton = new FixedOffsetZone(0);
        }
        return fixedOffsetZoneSingleton;
    }

    /**
     * Get an instance with a specified offset
     * @param offset - The offset in minutes
     */
    static instance(offset: number) {
        return offset === 0 ? FixedOffsetZone.utcInstance : new FixedOffsetZone(offset);
    }

    /**
     * Get an instance of FixedOffsetZone from a UTC offset string, like "UTC+6"
     * @param s - The offset string to parse
     */
    static parseSpecifier(s: string) {
        if (s) {
            const r = s.match(/^utc(?:([+-]\d{1,2})(?::(\d{2}))?)?$/i);
            if (r) {
                return new FixedOffsetZone(signedOffset(r[1], r[2]));
            }
        }
        return null;
    }

    /**
     * The type of zone. `fixed` for all instances of `FixedOffsetZone`.
     */
    get type() { return "fixed"; }

    /**
     * The name of this zone.
     * All fixed zones' names always start with "UTC" (plus optional offset)
     */
    get name() {
        return this.fixed === 0 ? "UTC" : `UTC${formatOffset(this.fixed, "narrow")}`;
    }

    /**
     * The IANA name of this zone, i.e. `Etc/UTC` or `Etc/GMT+/-nn`
     */
    get ianaName() {
        if (this.fixed === 0) {
            return "Etc/UTC";
        } else {
            return `Etc/GMT${formatOffset(-this.fixed, "narrow")}`;
        }
    }

    constructor(offset: number) { this.fixed = offset; }

    /**
     * Returns the offset's common name at the specified timestamp.
     *
     * For fixed offset zones this equals to the zone name.
     */
    offsetName() { return this.name; }

    /**
     * Returns the offset's value as a string
     * @override
     * @param ts - Epoch milliseconds for which to get the offset
     * @param format - What style of offset to return.
     *                 Accepts 'narrow', 'short', or 'techie'. Returns '+6', '+06:00', or '+0600' respectively
     */
    formatOffset(ts: number, format: 'narrow' | 'short' | 'techie') {
        return formatOffset(this.fixed, format);
    }

    /**
     * Returns whether the offset is known to be fixed for the whole year:
     * Always returns true for all fixed offset zones.
     */
    get isUniversal() { return true; }

    /**
     * Return the offset in minutes for this zone at the specified timestamp.
     *
     * For fixed offset zones, this is constant and does not depend on a timestamp.
     */
    offset() { return this.fixed; }

    /**
     * Return whether this Zone is equal to another zone (i.e. also fixed and same offset)
     * @param otherZone - the zone to compare
     */
    equals(otherZone: Zone) {
        return otherZone.type === "fixed"
            && (otherZone as FixedOffsetZone).fixed === this.fixed;
    }

    /**
     * Return whether this Zone is valid:
     * All fixed offset zones are valid.
     */
    get isValid() { return true; }
}

/**
 * A zone identified by an IANA identifier, like America/New_York
 */
class IANAZone implements Zone {
    private valid: boolean;
    private zoneName: string;

    /**
     * @param name - Zone name
     */
    static create(name: string) {
        if (!ianaZoneCache[name]) {
            ianaZoneCache[name] = new IANAZone(name);
        }
        return ianaZoneCache[name];
    }

    /**
     * Reset local caches. Should only be necessary in testing scenarios.
     */
    static resetCache() {
        ianaZoneCache = {};
        dtfCache = {};
    }

    /**
     * Returns whether the provided string identifies a real zone
     */
    static isValidZone(zone: string) {
        if (!zone) {
            return false;
        }
        try {
            new Intl.DateTimeFormat("en-US", { timeZone: zone }).format();
            return true;
        } catch (e) {
            return false;
        }
    }

    /**
     * The type of zone. `iana` for all instances of `IANAZone`.
     */
    get type() { return "iana"; }

    /**
     * The name of this zone (i.e. the IANA zone name).
     */
    get name() { return this.zoneName; }

    /**
     * The IANA name of this zone.
     * Defaults to `name`.
     */
    get ianaName() { return this.zoneName; }

    /**
     * Returns whether the offset is known to be fixed for the whole year:
     * Always returns false for all IANA zones.
     */
    get isUniversal() { return false; }

    /**
     * Return whether this Zone is valid.
     */
    get isValid() { return this.valid; }

    constructor(name: string) {
        this.zoneName = name;
        this.valid = IANAZone.isValidZone(name);
    }

    /**
     * Returns the offset's common name (such as EST) at the specified timestamp
     * @param ts - Epoch milliseconds for which to get the name
     * @param opts - Options to affect the format
     */
    offsetName(ts: number, { format, locale }: ZoneOffsetOpts) {
        return parseZoneInfo(ts, format, locale, this.name);
    }

    /**
     * Returns the offset's value as a string
     * @param ts - Epoch milliseconds for which to get the offset
     * @param format - What style of offset to return.
     *                 Accepts 'narrow', 'short', or 'techie'. Returns '+6', '+06:00', or '+0600' respectively
     */
    formatOffset(ts: number, format: 'narrow' | 'short' | 'techie') {
        return formatOffset(this.offset(ts), format);
    }

    /**
     * Return the offset in minutes for this zone at the specified timestamp.
     * @param ts - Epoch milliseconds for which to compute the offset
     */
    offset(ts: number) {
        if (isNaN(ts)) {
            return NaN;
        }

        const date = new Date(ts);

        const dtf = makeDTF(this.name);
        let [year, month, day, era, hour, minute, second, fractionalSecond] = partsOffset(dtf, date);
        if (typeof year === "undefined") {
            return 0;
        }

        if (era === "BC") {
            year = -Math.abs(year) + 1;
        }

        // because we're using hour12 and https://bugs.chromium.org/p/chromium/issues/detail?id=1025564&can=2&q=%2224%3A00%22%20datetimeformat
        const adjustedHour = hour === 24 ? 0 : hour;

        const asUTC = objToLocalTS({
            year: year,
            month,
            day,
            hour: adjustedHour,
            minute,
            second,
            millisecond: fractionalSecond ? Math.floor(fractionalSecond * 1000) : 0,
        });

        let asTS = +date;
        const over = asTS % 1000;
        asTS -= over >= 0 ? over : 1000 + over;
        return (asUTC - asTS) / (60 * 1000);
    }

    /**
     * Return whether this Zone is equal to another zone
     * @param otherZone - the zone to compare
     */
    equals(otherZone: Zone) {
        return otherZone.type === "iana" && otherZone.name === this.name;
    }
}

function combineRegexes(...regexes: RegExp[]) {
    const full = regexes.reduce((f, r) => f + r.source, "");
    return RegExp(`^${full}$`);
}

function combineExtractors(...extractors: Extractor[]): Extractor {
    return (m: RegExpExecArray) =>
        extractors
            .reduce<ExtractorResult>(
                ([mergedVals, mergedZone, cursor], ex) => {
                    const [val, zone, next] = ex(m, cursor);
                    return [{ ...mergedVals, ...val }, zone || mergedZone, next];
                },
                [{}, null, 1]
            ).slice(0, 2) as ExtractorResult;
}

function extractISOYmd(match: RegExpMatchArray, cursor?: number): ExtractorResult {
    if (typeof cursor === "undefined") {
        cursor = 0;
    }
    const item: DateTimeObject = {
        year: int(match, cursor),
        month: int(match, cursor + 1, 1),
        day: int(match, cursor + 2, 1),
    };

    return [item, null, cursor + 3];
}

function extractISOTime(match: RegExpMatchArray, cursor?: number): ExtractorResult {
    if (typeof cursor === "undefined") {
        cursor = 0;
    }
    const item: DateTimeObject = {
        hour: int(match, cursor, 0),
        minute: int(match, cursor + 1, 0),
        second: int(match, cursor + 2, 0),
        millisecond: parseMillis(match[cursor + 3]),
    };

    return [item, null, cursor + 4];
}

function extractISOOffset(match: RegExpMatchArray, cursor?: number): ExtractorResult {
    if (typeof cursor === "undefined") {
        cursor = 0;
    }
    const local = !match[cursor] && !match[cursor + 1],
        fullOffset = signedOffset(match[cursor + 1], match[cursor + 2]),
        zone = local ? null : FixedOffsetZone.instance(fullOffset);
    return [{}, zone, cursor + 3];
}

function extractIANAZone(match: RegExpMatchArray, cursor?: number): ExtractorResult {
    if (typeof cursor === "undefined") {
        cursor = 0;
    }
    const zone = match[cursor] ? IANAZone.create(match[cursor]) : null;
    return [{}, zone, cursor + 1];
}

function extractISODuration(match: RegExpMatchArray): ExtractorResult {
    const [s, yearStr, monthStr, weekStr, dayStr, hourStr, minuteStr, secondStr, millisecondsStr] =
        match;

    const hasNegativePrefix = s[0] === "-";
    const negativeSeconds = !!secondStr && secondStr[0] === "-";

    const maybeNegate = (num?: number, force = false) =>
        num !== undefined && (force || (num && hasNegativePrefix)) ? -num : num;

    return [
        {
            year: maybeNegate(parseFloating(yearStr)),
            month: maybeNegate(parseFloating(monthStr)),
            week: maybeNegate(parseFloating(weekStr)),
            day: maybeNegate(parseFloating(dayStr)),
            hour: maybeNegate(parseFloating(hourStr)),
            minute: maybeNegate(parseFloating(minuteStr)),
            second: maybeNegate(parseFloating(secondStr), secondStr === "-0"),
            millisecond: maybeNegate(parseMillis(millisecondsStr), negativeSeconds),
        },
    ];
}

function fromStrings(
    weekdayStr: string,
    yearStr: string,
    monthStr: string,
    dayStr: string,
    hourStr: string,
    minuteStr: string,
    secondStr: string) {
    const result: DateTimeObject = {
        year: yearStr.length === 2 ? untruncateYear(parseInteger(yearStr)) : parseInteger(yearStr),
        month: monthsShort.indexOf(monthStr) + 1,
        day: parseInteger(dayStr),
        hour: parseInteger(hourStr),
        minute: parseInteger(minuteStr),
    };

    if (secondStr) {
        result.second = parseInteger(secondStr);
    }
    if (weekdayStr) {
        result.weekday = weekdayStr.length > 3
            ? weekdaysLong.indexOf(weekdayStr) + 1
            : weekdaysShort.indexOf(weekdayStr) + 1;
    }

    return result;
}

function int(match: RegExpMatchArray, pos: number, fallback?: number) {
    const m = match[pos];
    return typeof m === "undefined" ? fallback : parseInteger(m);
}

function parse(s?: string | null, ...patterns: Pattern[]): ExtractorResult {
    if (s == null) {
        return [null, null];
    }

    for (const [regex, extractor] of patterns) {
        const m = regex.exec(s);
        if (m && extractor) {
            return extractor(m);
        }
    }
    return [null, null];
}

function simpleParse(...keys: string[]): Extractor {
    return (match: RegExpExecArray, cursor?: number) => {
        if (typeof cursor === "undefined") {
            cursor = 0;
        }
        const ret: Record<string, number | undefined> = {};
        let i;

        for (i = 0; i < keys.length; i++) {
            ret[keys[i]] = parseInteger(match[cursor + i]);
        }
        return [ret, null, cursor + i];
    };
}

function extractRFC2822(match: RegExpMatchArray): ExtractorResult {
    const [
        ,
        weekdayStr,
        dayStr,
        monthStr,
        yearStr,
        hourStr,
        minuteStr,
        secondStr,
        obsOffset,
        milOffset,
        offHourStr,
        offMinuteStr,
    ] = match,
        result = fromStrings(weekdayStr, yearStr, monthStr, dayStr, hourStr, minuteStr, secondStr);

    let offset;
    if (obsOffset) {
        offset = obsOffsets[obsOffset];
    } else if (milOffset) {
        offset = 0;
    } else {
        offset = signedOffset(offHourStr, offMinuteStr);
    }

    return [result, new FixedOffsetZone(offset)];
}

function preprocessRFC2822(s?: string | null) {
    // Remove comments and folding whitespace and replace multiple-spaces with a single space
    return s
        ? s.replace(/\([^()]*\)|[\n\t]/g, " ")
            .replace(/(\s\s+)/g, " ")
            .trim()
        : s;
}

function extractRFC1123Or850(match: RegExpMatchArray): ExtractorResult {
    const [, weekdayStr, dayStr, monthStr, yearStr, hourStr, minuteStr, secondStr] = match,
        result = fromStrings(weekdayStr, yearStr, monthStr, dayStr, hourStr, minuteStr, secondStr);
    return [result, FixedOffsetZone.utcInstance];
}

function extractASCII(match: RegExpMatchArray): ExtractorResult {
    const [, weekdayStr, monthStr, dayStr, hourStr, minuteStr, secondStr, yearStr] = match,
        result = fromStrings(weekdayStr, yearStr, monthStr, dayStr, hourStr, minuteStr, secondStr);
    return [result, FixedOffsetZone.utcInstance];
}

function extractMdy(match: RegExpMatchArray, cursor?: number): ExtractorResult {
    if (typeof cursor === "undefined") {
        cursor = 0;
    }

    const c1 = int(match, cursor);
    const c2 = match.length > cursor + 1 ? int(match, cursor + 1) : undefined;
    const c3 = match.length > cursor + 2 ? int(match, cursor + 2) : undefined;

    let y: number | undefined;
    if (c2) {
        if (c3) {
            y = c3;
        } else {
            y = c2;
        }
    } else {
        y = c1;
    }
    if (y && y < 100) {
        if (y <= twoDigitCutoffYear) {
            y += 2000;
        } else {
            y += 1900;
        }
    }

    const item: DateTimeObject = {
        month: match.length > cursor + 1 ? c1 : 1,
        day: match.length > cursor + 2 ? c2 : 1,
        year: y,
    };

    return [item, null, cursor + 3];
}

function extractTextMdy(match: RegExpMatchArray, cursor?: number): ExtractorResult {
    if (typeof cursor === "undefined") {
        cursor = 0;
    }

    const c1 = int(match, cursor);
    const c2 = match.length > cursor + 1 ? match[cursor + 1] : undefined;
    const c3 = match.length > cursor + 2 ? int(match, cursor + 2) : undefined;
    const c4 = match.length > cursor + 3 ? int(match, cursor + 3) : undefined;

    let item: DateTimeObject = {
        monthName: c2,
        year: c4,
    };
    if (c1 != null) {
        item = {
            ...item,
            day: c1,
        };
    } else if (c3 != null) {
        item = {
            ...item,
            day: c3,
        };
    }

    if (item.year && item.year < 100) {
        if (item.year <= twoDigitCutoffYear) {
            item.year += 2000;
        } else {
            item.year += 1900;
        }
    }

    return [item, null, cursor + 4];
}

function extractWeekdayMdy(match: RegExpMatchArray, cursor?: number): ExtractorResult {
    if (typeof cursor === "undefined") {
        cursor = 0;
    }

    const c1 = match.length > cursor ? match[cursor] : undefined;
    const c2 = match.length > cursor + 1 ? int(match, cursor + 1) : undefined;
    const c3 = match.length > cursor + 2 ? int(match, cursor + 2) : undefined;
    const c4 = match.length > cursor + 3 ? int(match, cursor + 3) : undefined;

    let y: number | undefined;
    if (c3) {
        if (c4) {
            y = c4;
        } else {
            y = c3;
        }
    } else {
        y = c2;
    }
    if (y && y < 100) {
        if (y <= twoDigitCutoffYear) {
            y += 2000;
        } else {
            y += 1900;
        }
    }

    let item: DateTimeObject = {
        weekdayName: c1,
        month: match.length > cursor + 2 ? c2 : 1,
        day: match.length > cursor + 3 ? c3 : 1,
        year: y,
    };

    return [item, null, cursor + 4];
}

function extractWeekdayTextMdy(match: RegExpMatchArray, cursor?: number): ExtractorResult {
    if (typeof cursor === "undefined") {
        cursor = 0;
    }

    const c1 = match.length > cursor ? match[cursor] : undefined;
    const c2 = int(match, cursor + 1);
    const c3 = match.length > cursor + 2 ? match[cursor + 2] : undefined;
    const c4 = match.length > cursor + 3 ? int(match, cursor + 3) : undefined;
    const c5 = match.length > cursor + 4 ? int(match, cursor + 4) : undefined;

    let item: DateTimeObject = {
        weekdayName: c1,
        monthName: c3,
        year: c5,
    };
    if (c2 != null) {
        item = {
            ...item,
            day: c2,
        };
    } else if (c4 != null) {
        item = {
            ...item,
            day: c4,
        };
    }

    if (item.year && item.year < 100) {
        if (item.year <= twoDigitCutoffYear) {
            item.year += 2000;
        } else {
            item.year += 1900;
        }
    }

    return [item, null, cursor + 5];
}

const isoYmdWithTimeExtensionRegex = combineRegexes(isoYmdRegex, isoTimeExtensionRegex);
const isoWeekWithTimeExtensionRegex = combineRegexes(isoWeekRegex, isoTimeExtensionRegex);
const isoOrdinalWithTimeExtensionRegex = combineRegexes(isoOrdinalRegex, isoTimeExtensionRegex);
const isoTimeCombinedRegex = combineRegexes(isoTimeRegex);

const extractISOYmdTimeAndOffset = combineExtractors(
    extractISOYmd,
    extractISOTime,
    extractISOOffset,
    extractIANAZone
);
const extractISOWeekTimeAndOffset = combineExtractors(
    extractISOWeekData,
    extractISOTime,
    extractISOOffset,
    extractIANAZone
);
const extractISOOrdinalDateAndTime = combineExtractors(
    extractISOOrdinalData,
    extractISOTime,
    extractISOOffset,
    extractIANAZone
);
const extractISOTimeAndOffset = combineExtractors(
    extractISOTime,
    extractISOOffset,
    extractIANAZone
);

function parseISODate(s?: string | null) {
    return parse(
        s,
        [isoYmdWithTimeExtensionRegex, extractISOYmdTimeAndOffset],
        [isoWeekWithTimeExtensionRegex, extractISOWeekTimeAndOffset],
        [isoOrdinalWithTimeExtensionRegex, extractISOOrdinalDateAndTime],
        [isoTimeCombinedRegex, extractISOTimeAndOffset]
    );
}

function parseRFC2822Date(s?: string | null) {
    return parse(preprocessRFC2822(s), [rfc2822, extractRFC2822]);
}

function parseHTTPDate(s?: string | null) {
    return parse(
        s,
        [rfc1123, extractRFC1123Or850],
        [rfc850, extractRFC1123Or850],
        [ascii, extractASCII]
    );
}

function parseISODuration(s?: string | null) {
    return parse(s, [isoDuration, extractISODuration]);
}

const extractISOTimeOnly = combineExtractors(extractISOTime);

function parseISOTimeOnly(s?: string | null) {
    return parse(s, [isoTimeOnly, extractISOTimeOnly]);
}

const sqlYmdWithTimeExtensionRegex = combineRegexes(sqlYmdRegex, sqlTimeExtensionRegex);
const sqlTimeCombinedRegex = combineRegexes(sqlTimeRegex);

const extractISOTimeOffsetAndIANAZone = combineExtractors(
    extractISOTime,
    extractISOOffset,
    extractIANAZone
);

function parseSQL(s?: string | null) {
    return parse(
        s,
        [sqlYmdWithTimeExtensionRegex, extractISOYmdTimeAndOffset],
        [sqlTimeCombinedRegex, extractISOTimeOffsetAndIANAZone]
    );
}

const mdYWithTimeExtensionRegex = combineRegexes(mdyRegex, timeExtensionRegex);
const extractMdyTimeAndOffset = combineExtractors(
    extractMdy,
    extractISOTime,
    extractISOOffset,
    extractIANAZone
);
const extractTextMdyTimeAndOffset = combineExtractors(
    extractTextMdy,
    extractISOTime,
    extractISOOffset,
    extractIANAZone
);
const extractWeekdayMdyTimeAndOffset = combineExtractors(
    extractWeekdayMdy,
    extractISOTime,
    extractISOOffset,
    extractIANAZone
);
const extractWeekdayTextMdyTimeAndOffset = combineExtractors(
    extractWeekdayTextMdy,
    extractISOTime,
    extractISOOffset,
    extractIANAZone
);

function getTextMdyRegex(months: string[]) {
    return new RegExp(String.raw`(?:(\d{1,2})[-,/ ]*)?(${months.join('|')})[-,/ ]*(?:(\d{1,2})[-,/ ]+)?([+-]\d{6}|\d{4}|\d{2})`);
}

function getWeekdayExtensionRegex(weekdays: string[]) {
    return new RegExp(String.raw`(${weekdays.join('|')})[-,/ ]+`);
}

function getWeekdayMdyRegex(weekdays: string[]) {
    return combineRegexes(getWeekdayExtensionRegex(weekdays), mdYWithTimeExtensionRegex);
}

function getWeekdayTextMdyRegex(weekdays: string[], months: string[]) {
    return combineRegexes(getWeekdayExtensionRegex(weekdays), getTextMdyRegex(months));
}

function parseInformalDate(s?: string | null, locale?: string, options?: Intl.DateTimeFormatOptions) {
    let result = parse(
        s,
        [mdYWithTimeExtensionRegex, extractMdyTimeAndOffset],
        [isoTimeCombinedRegex, extractISOTimeAndOffset]
    );
    if (result[0]
        && result[0].month
        && result[0].day) {
        if (result[0].month > 13) {
            const d = result[0].day;
            result[0].day = result[0].month;
            result[0].month = d;
        } else {
            const formatter = new DateFormatter(locale || 'en-US', options);
            const formatted = formatter.formatToParts(new Date(2020, 1, 1));
            if (formatted.findIndex(x => x.type === 'day')
                < formatted.findIndex(x => x.type === 'month')) {
                const d = result[0].day;
                result[0].day = result[0].month;
                result[0].month = d;
            }
        }
    } else if (!result[0]) {
        const longMonthFormatter = new DateFormatter(locale || 'en-US', { ...options, month: 'long' });
        const longMonths = [...Array(12).keys()]
            .map(x => longMonthFormatter.format(new Date(2020, x)).toLowerCase());
        const shortMonthFormatter = new DateFormatter(locale || 'en-US', { ...options, month: 'short' });
        const shortMonths = [...Array(12).keys()]
            .map(x => shortMonthFormatter.format(new Date(2020, x)).toLowerCase());
        const longWeekdayFormatter = new DateFormatter(locale || 'en-US', { ...options, weekday: 'long' });
        const longWeekdays = [...Array(7).keys()]
            .map(x => longWeekdayFormatter.format(new Date(2020, 5, x + 1)).toLowerCase());
        const shortWeekdayFormatter = new DateFormatter(locale || 'en-US', { ...options, weekday: 'short' });
        const shortWeekdays = [...Array(7).keys()]
            .map(x => shortWeekdayFormatter.format(new Date(2020, 5, x + 1)).toLowerCase());
        result = parse(
            s?.toLowerCase(),
            [getWeekdayMdyRegex(longWeekdays), extractWeekdayMdyTimeAndOffset],
            [getWeekdayMdyRegex(shortWeekdays), extractWeekdayMdyTimeAndOffset],
            [getWeekdayTextMdyRegex(longWeekdays, longMonths), extractWeekdayTextMdyTimeAndOffset],
            [getWeekdayTextMdyRegex(longWeekdays, shortMonths), extractWeekdayTextMdyTimeAndOffset],
            [getWeekdayTextMdyRegex(shortWeekdays, longMonths), extractWeekdayTextMdyTimeAndOffset],
            [getWeekdayTextMdyRegex(shortWeekdays, shortMonths), extractWeekdayTextMdyTimeAndOffset],
            [getTextMdyRegex(shortMonths), extractTextMdyTimeAndOffset],
            [getTextMdyRegex(longMonths), extractTextMdyTimeAndOffset],
            [getTextMdyRegex(shortMonths), extractTextMdyTimeAndOffset],
            [isoTimeCombinedRegex, extractISOTimeAndOffset]
        );
        if (result[0]
            && result[0].monthName
            && result[0].monthName.length) {
            result[0].month = longMonths.indexOf(result[0].monthName) + 1;
            if (result[0].month <= 0) {
                result[0].month = shortMonths.indexOf(result[0].monthName) + 1;
            }
            if (result[0].month <= 0) {
                delete result[0].month;
            }
        }
        if (result[0]
            && result[0].weekdayName
            && result[0].weekdayName.length) {
            result[0].weekday = longWeekdays.indexOf(result[0].weekdayName) + 1;
            if (result[0].weekday <= 0) {
                result[0].weekday = shortWeekdays.indexOf(result[0].weekdayName) + 1;
            }
            if (result[0].weekday <= 0) {
                delete result[0].weekday;
            }
        }
    }
    return result;
}

function dayOfWeek(year: number, month: number, day: number) {
    const d = new Date(Date.UTC(year, month - 1, day));

    if (year < 100 && year >= 0) {
        d.setUTCFullYear(d.getUTCFullYear() - 1900);
    }

    const js = d.getUTCDay();

    return js === 0 ? 7 : js;
}

function daysInYear(year: number) {
    return isLeapYear(year) ? 366 : 365;
}


/**
 * Returns the offset's value as a string
 * @param offset - Epoch milliseconds for which to get the offset
 * @param format - What style of offset to return.
 *                 Accepts 'narrow', 'short', or 'techie'. Returns '+6', '+06:00', or '+0600' respectively
 */
function formatOffset(offset: number, format: 'narrow' | 'short' | 'techie') {
    const hours = Math.trunc(Math.abs(offset / 60)),
        minutes = Math.trunc(Math.abs(offset % 60)),
        sign = offset >= 0 ? "+" : "-";

    switch (format) {
        case "short":
            return `${sign}${padStart(hours, 2)}:${padStart(minutes, 2)}`;
        case "narrow":
            return `${sign}${hours}${minutes > 0 ? `:${minutes}` : ""}`;
        case "techie":
            return `${sign}${padStart(hours, 2)}${padStart(minutes, 2)}`;
        default:
            throw new RangeError(`Value format ${format} is out of range for property format`);
    }
}

function fromDurationResult(result: ExtractorResult): DateDuration | DateTimeDuration | TimeDuration | undefined {
    let [obj] = result;
    if (obj == null) {
        return undefined;
    }

    if (typeof obj.hour !== "undefined"
        || typeof obj.minute !== "undefined"
        || typeof obj.second !== "undefined"
        || typeof obj.millisecond !== "undefined") {
        if (typeof obj.year !== "undefined"
            || typeof obj.month !== "undefined"
            || typeof obj.day !== "undefined"
            || typeof obj.week !== "undefined") {
            return {
                years: obj.year,
                months: obj.month,
                weeks: obj.week,
                days: obj.day,
                hours: obj.hour,
                minutes: obj.minute,
                seconds: obj.second,
                milliseconds: obj.millisecond,
            } as DateTimeDuration;
        }
        return {
            hours: obj.hour,
            minutes: obj.minute,
            seconds: obj.second,
            milliseconds: obj.millisecond,
        } as TimeDuration;
    }
    return {
        years: obj.year,
        months: obj.month,
        weeks: obj.week,
        days: obj.day,
    } as DateDuration;
}

function fromResult(result: ExtractorResult): CalendarDate | CalendarDateTime | Time | ZonedDateTime | undefined {
    let [obj, zone] = result;
    if (obj == null) {
        return undefined;
    }
    const containsDate = typeof obj.year !== "undefined"
            || typeof obj.month !== "undefined"
            || typeof obj.day !== "undefined",
        containsTime = typeof obj.hour !== "undefined"
            || typeof obj.minute !== "undefined"
            || typeof obj.second !== "undefined"
            || typeof obj.millisecond !== "undefined",
        containsWeek = typeof obj.week !== "undefined",
        containsWeekday = typeof obj.weekday !== "undefined";

    const nowDateTime = now(getLocalTimeZone());
    if (containsWeek) {
        obj = { ...obj, ...weekToGregorian(obj.year || nowDateTime.year, obj.week!, obj.weekday || 1) };
    }
    let dateTime: CalendarDate | CalendarDateTime | Time | ZonedDateTime | undefined;
    if (containsTime) {
        if (containsDate) {
            dateTime = new CalendarDateTime(
                defaultCalendar,
                obj.year || nowDateTime.year,
                obj.month || nowDateTime.month,
                obj.day || nowDateTime.day,
                obj.hour,
                obj.minute,
                obj.second,
                obj.millisecond);
            if (zone) {
                dateTime = toZoned(dateTime, zone.ianaName);
            }
        } else {
            dateTime = new Time(
                obj.hour,
                obj.minute,
                obj.second,
                obj.millisecond);
        }
    } else {
        dateTime = new CalendarDate(
            defaultCalendar,
            obj.year || nowDateTime.year,
            obj.month || nowDateTime.month,
            obj.day || nowDateTime.day);
    }
    
    if (containsDate) {
        if (dateTime instanceof Time) {
            console.log(`DateTime parse error: string contained date information but resolved to a time-only value.`);
            return undefined;
        }
    }
    if (containsTime) {
        if (dateTime instanceof CalendarDate) {
            console.log(`DateTime parse error: string contained time information but resolved to a date-only value.`);
            return undefined;
        }
    }
    for (const p in obj) {
        if (p === "monthName"
            || p === "weekday"
            || p === "weekdayName") {
            continue;
        }
        const key = p as keyof (DateFields | TimeFields);
        const value = obj[key];
        if (typeof value !== 'undefined') {
            const newValue = dateTime[key];
            if (newValue != value) {
                console.log(`DateTime parse error: ${key} was ${value} in string but resolved to ${newValue} when assigned to a date.`);
                return undefined;
            }
        }
    }
    if (containsWeek) {
        if (dateTime instanceof Time) {
            console.log(`DateTime parse error: string contained week information but resolved to a time-only value.`);
            return undefined;
        }
        const { weekYear, weekNumber, weekday } = getWeek(dateTime);
        if (containsWeekday && weekNumber != obj.weekday) {
            console.log(`DateTime parse error: weekday was ${obj.weekday!.toString()} in string but resolved to ${weekday} when assigned to a date.`);
            return undefined;
        }
    }
    else if (containsWeekday) {
        if (dateTime instanceof Time) {
            console.log(`DateTime parse error: string contained week information but resolved to a time-only value.`);
            return undefined;
        }
        const weekday = getInvariantDayOfWeek(dateTime);
        if (weekday != obj.weekday) {
            console.log(`DateTime parse error: weekday was ${obj.weekday!.toString()} in string but resolved to ${weekday} when assigned to a date.`);
            return undefined;
        }
    }

    return dateTime;
}

function getFirstWeekOffset(year: number) {
    return 3 - getInvariantDayOfWeek(new CalendarDate(year, 1, 4));
}

function getInvariantDayOfWeek(date: DateValue): number {
    let julian = date.calendar.toJulianDay(date);

    // If julian is negative, then julian % 7 will be negative, so we adjust
    // accordingly.  Julian day 0 is Monday.
    let dayOfWeek = Math.ceil(julian + 1) % 7;
    if (dayOfWeek < 0) {
        dayOfWeek += 7;
    }

    return dayOfWeek;
}

function getOrdinal(year: number, month: number, day: number) {
    return day + (isLeapYear(year) ? leapLadder : nonLeapLadder)[month - 1];
}

function getWeeksInWeekYear(weekYear: number) {
    return ((isLeapYear(weekYear) ? 366 : 365)
        - getFirstWeekOffset(weekYear)
        + getFirstWeekOffset(weekYear + 1))
        / 7;
}

function isLeapYear(year: number) {
    return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}

function isoWeekdayToLocal(isoWeekday: number) {
    return ((isoWeekday + 6) % 7) + 1;
}

function makeDTF(zone: string) {
    if (!dtfCache[zone]) {
        dtfCache[zone] = new Intl.DateTimeFormat("en-US", {
            hour12: false,
            timeZone: zone,
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            era: "short",
        });
    }
    return dtfCache[zone];
}

function objToLocalTS(obj: DateTimeObject) {
    if (typeof obj.year === "undefined") {
        return 0;
    }

    const month = obj.month ? obj.month - 1 : obj.month;
    let d: Date | number = Date.UTC(
        obj.year,
        month,
        obj.day,
        obj.hour,
        obj.minute,
        obj.second,
        obj.millisecond
    );

    // for legacy reasons, years between 0 and 99 are interpreted as 19XX; revert that
    if (obj.year < 100 && obj.year >= 0) {
        d = new Date(d);
        // set the month and day again, this is necessary because year 2000 is a leap year, but year 100 is not
        // so if obj.year is in 99, but obj.day makes it roll over into year 100,
        // the calculations done by Date.UTC are using year 2000 - which is incorrect
        d.setUTCFullYear(obj.year, month, obj.day);
    }
    return +d;
}

function padStart(input: number, n = 2) {
    if (input < 0) {
        return "-" + ("" + -input).padStart(n, "0");
    } else {
        return ("" + input).padStart(n, "0");
    }
}

function partsOffset(dtf: Intl.DateTimeFormat, date?: number | Date) {
    const formatted = dtf.formatToParts(date);
    const filled: PartsArray = [];
    for (let i = 0; i < formatted.length; i++) {
        const { type, value } = formatted[i];
        const pos: number = typeToPos[type];

        if (type === "era") {
            filled[pos] = value;
        } else if (typeof pos !== "undefined") {
            filled[pos] = parseInt(value, 10);
        }
    }
    return filled;
}

function parseFloating(string: string) {
    if (typeof string === "undefined" || string === null || string === "") {
        return undefined;
    } else {
        return parseFloat(string);
    }
}

function parseInteger(string: string) {
    if (typeof string === "undefined" || string === null || string === "") {
        return undefined;
    } else {
        return parseInt(string, 10);
    }
}

function parseMillis(fraction: string) {
    // Return undefined (instead of 0) in these cases, where fraction is not set
    if (typeof fraction === "undefined" || fraction === null || fraction === "") {
        return undefined;
    } else {
        const f = parseFloat("0." + fraction) * 1000;
        return Math.floor(f);
    }
}

function parseZoneInfo(
    ts: number,
    offsetFormat: "short" | "long" | "shortOffset" | "longOffset" | "shortGeneric" | "longGeneric" | undefined,
    locale?: string,
    timeZone: string | null = null) {
    const date = new Date(ts),
        intlOpts: Intl.DateTimeFormatOptions = {
            hourCycle: "h23",
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
        };

    if (timeZone) {
        intlOpts.timeZone = timeZone;
    }

    const modified = { timeZoneName: offsetFormat, ...intlOpts };

    const parsed = new Intl.DateTimeFormat(locale, modified)
        .formatToParts(date)
        .find((m) => m.type.toLowerCase() === "timezonename");
    return parsed ? parsed.value : null;
}

function signedOffset(offHourStr: string, offMinuteStr: string) {
    let offHour = parseInt(offHourStr, 10);

    // don't || this because we want to preserve -0
    if (Number.isNaN(offHour)) {
        offHour = 0;
    }

    const offMin = parseInt(offMinuteStr, 10) || 0,
        offMinSigned = offHour < 0 || Object.is(offHour, -0) ? -offMin : offMin;
    return offHour * 60 + offMinSigned;
}

function uncomputeOrdinal(year: number, ordinal: number) {
    const table = isLeapYear(year) ? leapLadder : nonLeapLadder,
        month0 = table.findIndex((i) => i < ordinal),
        day = ordinal - table[month0];
    return { month: month0 + 1, day };
}

function untruncateYear(year?: number) {
    if (typeof year === "undefined") {
        return undefined;
    }
    if (year > 99) {
        return year;
    } else {
        return year > twoDigitCutoffYear
            ? 1900 + year
            : 2000 + year;
    }
}

function weekToGregorian(weekYear: number, weekNumber: number, weekday: number) {
    const weekdayOfJan4 = isoWeekdayToLocal(dayOfWeek(weekYear, 1, 4)),
        yearInDays = daysInYear(weekYear);

    let ordinal = weekNumber * 7 + weekday - weekdayOfJan4 - 3,
        year;

    if (ordinal < 1) {
        year = weekYear - 1;
        ordinal += daysInYear(year);
    } else if (ordinal > yearInDays) {
        year = weekYear + 1;
        ordinal -= daysInYear(weekYear);
    } else {
        year = weekYear;
    }

    const { month, day } = uncomputeOrdinal(year, ordinal);
    return { year, month, day };
}

export function getWeek(date: DateValue) {
    const gregorian = date.calendar.identifier === 'gregory'
        ? date
        : toCalendar(date, defaultCalendar);
    const ordinal = getOrdinal(gregorian.year, gregorian.month, gregorian.day);
    const weekday = getInvariantDayOfWeek(gregorian);

    let weekNumber = Math.floor((ordinal - weekday + 10) / 7),
        weekYear;

    if (weekNumber < 1) {
        weekYear = gregorian.year - 1;
        weekNumber = getWeeksInWeekYear(weekYear);
    } else if (weekNumber > getWeeksInWeekYear(gregorian.year)) {
        weekYear = gregorian.year + 1;
        weekNumber = 1;
    } else {
        weekYear = gregorian.year;
    }

    return { weekYear, weekNumber, weekday };
}

export function parseDateOrTime(s?: string | null, locale?: string, options?: Intl.DateTimeFormatOptions) {
    const dateTime = parseDateTime(s, locale, options);
    if (dateTime) {
        return dateTime;
    }
    const time = parseTime(s);
    if (time) {
        return time;
    }
}

export function parseDateTime(s?: string | null, locale?: string, options?: Intl.DateTimeFormatOptions) {
    let result = fromResult(parseISODate(s));
    if (result) {
        return result;
    }
    result = fromResult(parseRFC2822Date(s));
    if (result) {
        return result;
    }
    result = fromResult(parseHTTPDate(s));
    if (result) {
        return result;
    }
    result = fromResult(parseSQL(s));
    if (result) {
        return result;
    }
    result = fromResult(parseInformalDate(s, locale, options));
    if (result) {
        return result;
    }
}

export function parseDuration(s?: string | null) { return fromDurationResult(parseISODuration(s)); }

export function parseTime(s?: string | null) {
    let result = fromResult(parseISOTimeOnly(s));
    if (!(result instanceof CalendarDate)) {
        return result instanceof ZonedDateTime
            || result instanceof CalendarDateTime
            ? toTime(result)
            : result;
    }
    result = fromResult(parseISODate(s));
    if (!(result instanceof CalendarDate)) {
        return result instanceof ZonedDateTime
            || result instanceof CalendarDateTime
            ? toTime(result)
            : result;
    }
    result = fromResult(parseRFC2822Date(s));
    if (!(result instanceof CalendarDate)) {
        return result instanceof ZonedDateTime
            || result instanceof CalendarDateTime
            ? toTime(result)
            : result;
    }
    result = fromResult(parseHTTPDate(s));
    if (!(result instanceof CalendarDate)) {
        return result instanceof ZonedDateTime
            || result instanceof CalendarDateTime
            ? toTime(result)
            : result;
    }
    result = fromResult(parseSQL(s));
    if (!(result instanceof CalendarDate)) {
        return result instanceof ZonedDateTime
            || result instanceof CalendarDateTime
            ? toTime(result)
            : result;
    }
}

export function parseAny(s?: string | null, locale?: string, options?: Intl.DateTimeFormatOptions) {
    const dateTime = parseDateOrTime(s, locale, options);
    if (dateTime) {
        return dateTime;
    }
    return parseDuration(s);
}