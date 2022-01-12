export class TagWithValue {
    tag: string;
    value: string | undefined;

    constructor(tag: string, value?: string) {
        if (value !== undefined) {
            this.tag = tag;
            this.value = value;
            return;
        }

        // match tag(value) or tag or tag()
        const patternMatch = new RegExp(/^(.*?)(?:\((.*)\))?$/gm).exec(tag) || [
            undefined,
            tag, // default to the whole tag if the regexp chokes
            undefined,
        ];
        this.tag = patternMatch[1] || tag;
        this.value = patternMatch[2] || undefined;
    }

    toString(): string {
        if (this.value === undefined) {
            return `@${this.tag}`;
        }
        return `@${this.tag}(${this.value})`;
    }
}
