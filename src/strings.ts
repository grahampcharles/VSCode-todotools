export function stringToLines(input: string): string[] {
    return input.match(/[^\r\n]+/g) || [];
}

export function stripTrailingWhitespace(input: string): string {
    return input.replace(/([^ \t\r\n])[ \t]+$/gm, "$1");
}
