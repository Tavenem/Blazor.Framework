export function closeDrawer(side: string) {
    if (document.documentElement.getAttribute(`data-drawer-${side}`) !== 'false') {
        document.documentElement.setAttribute(`data-drawer-${side}`, 'false');
    }
}

export function getState(side: string) {
    if (document.documentElement.getAttribute(`data-drawer-${side}`) === 'true') {
        return true;
    }
    if (document.documentElement.getAttribute(`data-drawer-${side}`) === 'false') {
        return false;
    }
    return null;
}

export function openDrawer(side: string) {
    if (document.documentElement.getAttribute(`data-drawer-${side}`) !== 'true') {
        document.documentElement.setAttribute(`data-drawer-${side}`, 'true');
    }
}

export function toggleDrawer(side: string) {
    document.documentElement.setAttribute(
        `data-drawer-${side}`,
        (document.documentElement.getAttribute(`data-drawer-${side}`) !== 'true').toString());
}