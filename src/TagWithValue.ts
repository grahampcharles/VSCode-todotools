export class TagWithValue {
    tag: string;
    value: string | undefined;

    constructor(tag: string, value?: string) {
        // TODO: improve this with a regex

        if (value !== undefined) {
            this.tag = tag;
            this.value = value;
            return;
        }

        const paren = tag.indexOf("(");

        if (paren === -1) {
            this.tag = tag;
        } else {
            (this.tag = tag.substring(0, paren)),
                (this.value = tag.substring(paren + 1, tag.length - 1));
        }
    }

    toString(): string {
        if (this.value === undefined) {
            return `@${this.tag}`;
        }
        return `@${this.tag}(${this.value})`;
    }
}
