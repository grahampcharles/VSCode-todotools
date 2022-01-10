import { TreeItem } from "vscode";



export type ParsedTaskInput = {
    type: string,
    value?: string,
    tags: string[]
};

export interface TagWithValue {
    tag: string,
    value: string | undefined
};



export class ParsedTask {

    private _tags: TagWithValue[] | undefined;
    public get tags(): TagWithValue[] | undefined {
        return this._tags;
    }
    public set tags(v: TagWithValue[] | undefined | string[]) {
        this._tags = parseTagValues(v);
    }

    constructor(parsedtask: ParsedTaskInput) {


    }

}

export function parseTagValues(v: TagWithValue[] | undefined | string[]): TagWithValue[] | undefined {

    if (v === undefined) { return undefined; };

    return v.map((item) => {
        if (typeof item === 'string') { return parseTagValue(item); };
        return item;
    });
}
export function parseTagValue(v: string): TagWithValue {

    // TODO: improve this with a regex
    const paren = v.indexOf("(");

    if (paren === -1) {
        return { tag: v } as TagWithValue;
    }

    return { tag: v.substring(0, paren), value: v.substring(paren + 1, v.length - 1) };
}