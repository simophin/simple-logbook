export function* parseLines(text: string) {
    const lines = text.trim().split('\n');
    for (const line of lines) {
        const trimmedLine = line.trim();
        if (trimmedLine.length === 0) {
            continue;
        }

        const sepIndex = trimmedLine.indexOf(':');
        if (sepIndex <= 0 || sepIndex === trimmedLine.length - 1) {
            throw new Error(`Invalid line "${line}"`);
        }

        const name = trimmedLine.substr(0, sepIndex).trim();
        const value = trimmedLine.substr(sepIndex + 1).trim();
        if (name.length === 0 || value.length === 0) {
            throw new Error(`Invalid line "${line}"`);
        }

        yield {name, value};
    }
}

export function joinLines(v: {name: string, value: string}[]) {
    return v.map(({name, value}) => `${name}: ${value}`)
        .join('\n');
}