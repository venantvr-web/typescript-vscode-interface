export function unescapeString(str: string): string {
    if (typeof str !== 'string') {
        return str;
    }
    if (str.startsWith('"') && str.endsWith('"')) {
        str = str.slice(1, -1);
    }
    return str.replace(/\\n/g, '\n').replace(/\\t/g, '\t').replace(/\\"/g, '"').replace(/\\\\/g, '\\');
}