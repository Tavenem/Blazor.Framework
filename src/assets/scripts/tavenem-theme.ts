const _listeners: DotNet.DotNetObject[] = [];
let _manualColorTheme: boolean = false;
let _saved_theme: number;

export function cancelListener(dotNetRef: DotNet.DotNetObject) {
    const index = _listeners.indexOf(dotNetRef);
    if (index >= 0) {
        _listeners.splice(index, 1);
    }
}

export function getPreferredColorScheme(): number {
    if (_manualColorTheme && _saved_theme) {
        return _saved_theme;
    }

    const local = localStorage.getItem('tavenem-theme');
    if (local) {
        const theme = parseInt(local);
        if (theme === 1 || theme === 2) {
            return theme;
        }
    }

    if (window.matchMedia) {
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return 2;
        } else {
            return 1;
        }
    }

    return 1;
}

export function listenForThemeChange(dotNetRef: DotNet.DotNetObject) {
    _listeners.push(dotNetRef);
}

export function setColorScheme(theme: number, manual?: boolean) {
    if (manual) {
        _manualColorTheme = (theme !== 0);
    } else {
        localStorage.removeItem('tavenem-theme');
        if (_manualColorTheme) {
            return;
        }
    }
    _saved_theme = theme;

    if (theme === 0) {
        theme = getPreferredColorScheme();
    }

    if (theme === 2) { // dark
        document.documentElement.setAttribute('data-theme', 'dark');
    } else { // light
        document.documentElement.setAttribute('data-theme', 'light');
    }

    if (manual) {
        localStorage.setItem('tavenem-theme', theme.toString());
    }

    if (_listeners.length) {
        for (let listener of _listeners) {
            listener.invokeMethodAsync('NotifyThemeChanged', theme);
        }
    }
}

function setPreferredColorScheme() {
    setColorScheme(getPreferredColorScheme());
}

if (window.matchMedia) {
    const colorSchemeQuery = window.matchMedia('(prefers-color-scheme: dark)');
    colorSchemeQuery.addEventListener('change', setPreferredColorScheme);
}
const currentScheme = getPreferredColorScheme();
if (currentScheme === 2) {
    setColorScheme(currentScheme);
}
