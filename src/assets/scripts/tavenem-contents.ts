interface HeadingInfo {
    id: string;
    level: number;
    title: string;
}

export function getheadings(id: string) {
    const contents = document.getElementById(id);
    if (!contents) {
        return [];
    }

    return Array
        .from(contents.querySelectorAll('h1,h2,h3,h4,h5,h6,.tav-heading'))
        .sort(documentPositionComparator)
        .map(v => {
            return {
                id: v.id,
                level: Number.parseInt(v.tagName.startsWith('h')
                    ? v.tagName.substring(1)
                    : (v.getAttribute('data-heading-level') || '0')),
                title: v.getAttribute('data-heading-title')
                    || v.textContent
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