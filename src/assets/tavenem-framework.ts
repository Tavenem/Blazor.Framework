interface IFramework {
    _manualColorTheme: boolean;
    _theme: number;
}

interface ITavenem {
    framework: IFramework
}

declare global {
    interface Window { tavenem: ITavenem; }
}

window.tavenem = window.tavenem || {};
window.tavenem.framework = window.tavenem.framework || {};

export function getPreferredColorScheme(): number {
    if (window.tavenem.framework._manualColorTheme
        && window.tavenem.framework._theme) {
        return window.tavenem.framework._theme;
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

export function scrollToId(elementId: string) {
    const element = document.getElementById(elementId);
    if (element instanceof HTMLElement) {
        element.scrollIntoView({
            behavior: "smooth",
            block: "start",
            inline: "nearest"
        });
    }
}

export function setColorScheme(theme: number, manual?: boolean) {
    if (manual) {
        window.tavenem.framework._manualColorTheme = (theme !== 0);
    } else {
        localStorage.removeItem('tavenem-theme');
        if (window.tavenem.framework._manualColorTheme) {
            return;
        }
    }
    window.tavenem.framework._theme = theme;

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
