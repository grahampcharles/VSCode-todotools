import { TagWithValue } from "./TagWithValue";
import { ParsedTaskInput } from "./types";

// TODO: deprecate
export class ParsedTask {
    private _value: string = "";
    public get value(): string {
        return this._value;
    }
    public set value(v: string) {
        this._value = v;
    }

    private _tags: TagWithValue[] | undefined;
    public get tags(): TagWithValue[] | undefined {
        return this._tags;
    }
    public set tags(v: TagWithValue[] | undefined | string[]) {
        this._tags = parseTagValues(v);
    }

    constructor(parsedtask: ParsedTaskInput) {
        if (typeof ParsedTask === "string") {
            return;
        }

        this.value = parsedtask.value;
        this.tags = parsedtask.tags;
    }

    public removeTag(tagName: string) {
        if (this._tags !== undefined) {
            this._tags = this._tags.filter((tag) => {
                return tag.value !== tagName;
            });
            if (this._tags.length === 0) {
                this._tags = undefined;
            }
        }
    }

    public setTag(tagName: string, tagValue: string | undefined) {
        this.removeTag(tagName);
        if (this._tags === undefined) {
            this._tags = new Array<TagWithValue>();
        }
        this._tags?.push({ tag: tagName, value: tagValue } as TagWithValue);
    }
}

export function parseTagValues(
    v: TagWithValue[] | undefined | string[]
): TagWithValue[] | undefined {
    if (v === undefined) {
        return undefined;
    }

    return v.map((item) => {
        if (typeof item === "string") {
            return parseTagValue(item);
        }
        return item;
    });
}
export function parseTagValue(v: string): TagWithValue {
    // TODO: improve this with a regex
    const paren = v.indexOf("(");

    if (paren === -1) {
        return { tag: v } as TagWithValue;
    }

    return {
        tag: v.substring(0, paren),
        value: v.substring(paren + 1, v.length - 1),
    };
}
