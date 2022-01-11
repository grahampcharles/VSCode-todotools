export class TagWithValue {
    tag: string;
    value: string | undefined;

    constructor(tag: string) {
        // TODO: improve this with a regex
        const paren = tag.indexOf("(");

        if (paren === -1) {
            this.tag = tag;
        } else {
            (this.tag = tag.substring(0, paren)),
                (this.value = tag.substring(paren + 1, tag.length - 1));
        }
    }
}
