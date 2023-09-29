interface HeadingInfo {
    id: string;
    level: number;
    title: string;
}

export function getHeadings(id: string) {
    const contents = document.getElementById(id);
    if (!contents) {
        return [];
    }
    const parent = contents.parentNode || document;

    return Array
        .from(parent.querySelectorAll('h1,h2,h3,h4,h5,h6,.tav-heading'))
        .filter(x => x.closest('.editor') == null)
        .sort(documentPositionComparator)
        .map((v, i) => {
            return {
                id: v.id,
                level: Number.parseInt(v.tagName.startsWith('H')
                    ? v.tagName.substring(1)
                    : (v.getAttribute('data-heading-level') || '0')),
                title: v.getAttribute('data-heading-title')
                    || v.textContent,
            } as HeadingInfo;
        });
}

function documentPositionComparator(a: Node, b: Node) {
    if (a === b) {
        return 0;
    }

    var position = a.compareDocumentPosition(b);

    if (position & Node.DOCUMENT_POSITION_FOLLOWING || position & Node.DOCUMENT_POSITION_CONTAINED_BY) {
        return -1;
    } else if (position & Node.DOCUMENT_POSITION_PRECEDING || position & Node.DOCUMENT_POSITION_CONTAINS) {
        return 1;
    } else {
        return 0;
    }
}