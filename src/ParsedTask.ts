export type ParsedTaskInput = {
    type: string;
    value: string;
    tags: string[];
};

export interface TagWithValue {
    tag: string;
    value: string | undefined;
}

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
        this.value = parsedtask.value;
        this.tags = parsedtask.tags;
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
