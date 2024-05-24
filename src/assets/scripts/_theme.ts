export enum ThemePreference {
    Light = 1,
    Dark = 2,
}

export function getNativePreferredColorScheme(): ThemePreference {
    if (window.matchMedia) {
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return ThemePreference.Dark;
        } else {
            return ThemePreference.Light;
        }
    }

    return ThemePreference.Light;
}

export function getPreferredTavenemColorScheme(): ThemePreference {
    const local = localStorage.getItem('tavenem-theme');
    if (local) {
        const theme = parseInt(local);
        if (theme == ThemePreference.Light
            || theme == ThemePreference.Dark) {
            return theme;
        }
    }

    return getNativePreferredColorScheme();
}