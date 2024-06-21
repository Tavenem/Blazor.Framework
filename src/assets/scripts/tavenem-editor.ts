export function focusEditor(elementId: string) {
    const editor = document.getElementById(elementId) as any;
    if (editor
        && typeof editor.focusInnerEditor === 'function') {
        editor.focusInnerEditor();
    }
}

export function getSelectedText(elementId: string): string | undefined {
    const editor = document.getElementById(elementId) as any;
    if (editor
        && typeof editor.getSelectedText === 'function') {
        return editor.getSelectedText();
    }
}

export function updateSelectedText(elementId: string, value?: string | null) {
    const editor = document.getElementById(elementId) as any;
    if (editor
        && typeof editor.updateSelectedText === 'function') {
        editor.updateSelectedText(value);
    }
}