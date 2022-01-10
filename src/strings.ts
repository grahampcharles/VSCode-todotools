export function stringToLines(input: string): string[] {
    return input.match(/[^\r\n]+/g) || [];
}