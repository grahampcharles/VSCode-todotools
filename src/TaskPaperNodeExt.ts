import { ParsedTask } from "./ParsedTask";
import { TagWithValue } from "./TagWithValue";
import { TaskPaperIndex, TaskPaperNode } from "./types";

export class TaskPaperNodeExt {
    type: string;
    value?: string;
    children?: TaskPaperNodeExt[];
    tags?: string[];
    tagsParsed?: TagWithValue[];
    depth: number;
    index?: TaskPaperIndex;

    constructor(v: TaskPaperNode) {
        this.type = v.type;
        this.value = v.value;
        this.tags = v.tags;
        this.depth = v.depth;
        this.index = v.index;
        this.children = v.children?.map((child) => {
            return new TaskPaperNodeExt(child);
        });

        // parse tags into tag, value pairs
        this.tagsParsed = this.tags?.map((tag) => {
            return new TagWithValue(tag);
        });
    }
}
