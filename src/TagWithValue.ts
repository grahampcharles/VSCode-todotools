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
        const patternMatch = (
            tag.match(/^(.*?)(?:\((.*)\))?$/) || [undefined, tag, undefined]
        ).slice(1, 2);
        this.tag = patternMatch[0] || tag;
        this.value = patternMatch[1] || undefined;
    }

    toString(): string {
        if (this.value === undefined) {
            return `@${this.tag}`;
        }
        return `@${this.tag}(${this.value})`;
    }
}
