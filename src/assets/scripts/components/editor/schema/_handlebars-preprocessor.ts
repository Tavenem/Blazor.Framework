export function preprocessHandlebars(node: Node): Node {
    const newNode = node.cloneNode();
    for (let dom = node.firstChild; dom != null; dom = dom!.nextSibling) {
        if (dom.nodeType == 3) {
            newNode.appendChild(processTextNode(dom as Text));
        } else {
            newNode.appendChild(preprocessHandlebars(dom));
        }
    }
    return newNode;
}

function processTextNode(node: Text): Node {
    if (!node.nodeValue
        || node.nodeValue.length < 5) {
        return node.cloneNode();
    }

    const startIndex = node.nodeValue.indexOf('{{');
    if (startIndex < 0) {
        return node.cloneNode();
    }
    const escaped = node.nodeValue[startIndex + 3] === '{';
    const startOffset = escaped
        ? startIndex + 3
        : startIndex + 2;
    let closeIndex = node.nodeValue.indexOf(escaped ? '}}}' : '}}', startOffset);
    if (closeIndex <= 0) {
        return node.cloneNode();
    }
    let closeOffset = escaped
        ? closeIndex + 3
        : closeIndex + 2;

    const omitPrefixWhitespace = node.nodeValue[startOffset] === '~';
    const omitPostfixWhitespace = node.nodeValue[closeIndex - 1] === '~';

    let tag: HTMLElement | undefined;

    //if (!escaped
    //    && (node.nodeValue[startOffset] === '#'
    //        || (node.nodeValue[startOffset] === '~'
    //        && node.nodeValue[startOffset + 1] === '#'))) {
    //    const commandOffset = node.nodeValue[startOffset] === '~'
    //        ? startOffset + 2
    //        : startOffset + 1;
    //    let command: string | undefined;
    //    const spaceIndex = node.nodeValue.indexOf(' ', commandOffset);
    //    command = spaceIndex > 0 && spaceIndex < closeIndex
    //        ? node.nodeValue.substring(commandOffset, spaceIndex)
    //        : node.nodeValue.substring(commandOffset, closeIndex);
    //    if (command && command.length) {
    //        let closeTagIndex = node.nodeValue.indexOf(`{{/${command}`, closeOffset);
    //        if (closeTagIndex < 0) {
    //            closeTagIndex = node.nodeValue.indexOf(`{{~/${command}`, closeOffset);
    //        }
    //        let closeTagOffset = node.nodeValue[closeTagIndex + 2] === '~'
    //            ? closeTagIndex + command.length + 3
    //            : closeTagIndex + command.length + 4;
    //        if (closeTagIndex >= 0
    //            && node.nodeValue.length > closeTagOffset + 1
    //            && node.nodeValue[closeTagOffset] === '}'
    //            && node.nodeValue[closeTagOffset + 1] === '}}') {
    //            tag = document.createElement('handlebars-block');

    //            tag.dataset.command = command;

    //            const content = node.nodeValue.substring(
    //                commandOffset + command.length,
    //                closeIndex);
    //            if (content.length) {
    //                tag.dataset.content = content;
    //            }

    //            if (closeTagIndex > closeOffset) {
    //                tag.appendChild(processTextNode(new Text(node.nodeValue.substring(closeOffset, closeTagIndex))));
    //            }

    //            closeIndex = closeTagOffset;
    //            closeOffset = closeTagOffset + 2;
    //        }
    //    }
    //}

    if (!tag) {
        tag = document.createElement('handlebars');
        tag.textContent = node.nodeValue.substring(startOffset, closeIndex);
    }

    if (startIndex === 0 && closeOffset === node.nodeValue.length) {
        return tag;
    }

    const fragment = new DocumentFragment();
    if (startIndex > 0) {
        const prefix = node.nodeValue.substring(0, startIndex);
        if (/^[ \t\r\n\u000c]*$/.test(prefix)) {
            if (!omitPrefixWhitespace) {
                if (/[\r\n\u000c]/.test(prefix)) {
                    tag.dataset.prefixBr = '';
                } else {
                    fragment.appendChild(new Text(prefix));
                }
            }
        } else {
            fragment.appendChild(new Text(prefix));
        }
    }

    fragment.appendChild(tag);

    if (closeOffset < node.nodeValue.length) {
        const postfix = node.nodeValue.substring(closeOffset);
        const postfixWhitespace = /^[ \t\r\n\u000c]*/.exec(postfix);
        if (postfixWhitespace
            && !omitPostfixWhitespace
            && /[\r\n\u000c]/.test(postfixWhitespace[0])) {
            tag.dataset.postfixBr = '';
            if (postfix.length > postfixWhitespace.length) {
                fragment.appendChild(processTextNode(new Text(postfix.substring(postfixWhitespace[0].length))));
            }
        } else {
            fragment.appendChild(processTextNode(new Text(postfix)));
        }
    }

    return fragment;
}