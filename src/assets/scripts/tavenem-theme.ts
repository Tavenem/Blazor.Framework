enum ThemePreference {
    Auto = 0,
    Light = 1,
    Dark = 2,
}

const _listeners: DotNet.DotNetObject[] = [];
let _manualColorTheme: boolean = false;
let _saved_theme: ThemePreference;

export function cancelListener(dotNetRef: DotNet.DotNetObject) {
    const index = _listeners.indexOf(dotNetRef);
    if (index >= 0) {
        _listeners.splice(index, 1);
    }
}

export function getPreferredColorScheme(): ThemePreference {
    if (_manualColorTheme && _saved_theme) {
        return _saved_theme;
    }

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

export function listenForThemeChange(dotNetRef: DotNet.DotNetObject) {
    _listeners.push(dotNetRef);
}

export function setColorScheme(theme: ThemePreference, manual?: boolean) {
    if (manual) {
        _manualColorTheme = (theme != ThemePreference.Auto);
    } else if (_manualColorTheme) {
        return;
    } else {
        const local = localStorage.getItem('tavenem-theme');
        if (local) {
            return;
        }
    }
    _saved_theme = theme;

    const preferred = getNativePreferredColorScheme();
    if (theme == ThemePreference.Auto) {
        theme = preferred;
    }

    if (theme == ThemePreference.Dark) {
        document.documentElement.setAttribute('data-theme', 'dark');
    } else {
        document.documentElement.setAttribute('data-theme', 'light');
    }

    if (theme == preferred) {
        localStorage.removeItem('tavenem-theme');
    } else if (manual) {
        localStorage.setItem('tavenem-theme', theme.toString());
    }

    if (_listeners.length) {
        for (let listener of _listeners) {
            listener.invokeMethodAsync('NotifyThemeChanged', theme);
        }
    }
}

function getNativePreferredColorScheme(): ThemePreference {
    if (window.matchMedia) {
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return ThemePreference.Dark;
        } else {
            return ThemePreference.Light;
        }
    }

    return ThemePreference.Light;
}

function setPreferredColorScheme() {
    setColorScheme(getPreferredColorScheme());
}

if (window.matchMedia) {
    const colorSchemeQuery = window.matchMedia('(prefers-color-scheme: dark)');
    colorSchemeQuery.addEventListener('change', setPreferredColorScheme);
}
const currentScheme = getPreferredColorScheme();
if (currentScheme == ThemePreference.Dark) {
    setColorScheme(currentScheme);
}
