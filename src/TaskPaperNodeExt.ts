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
    index: TaskPaperIndex;

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

    toString(removetags?: string[]): string {
        const tags =
            this.tagsParsed
                ?.filter(
                    (tag) =>
                        !removetags?.some((removetag) => tag.tag === removetag)
                )
                .map((tag) => tag.toString())
                .join(" ") || "";
        const prefix = `\t`.repeat(this.depth - 1);

        return `${prefix}- ${this.value} ${tags}`.trimRight();
    }

    tagValue(tagName: string): string | undefined {
        if (this.hasTag(tagName)) {
            return (
                this.tagsParsed?.filter((tag) => tag.tag === tagName)[0]
                    .value || undefined
            );
        }
        return undefined;
    }

    hasTag(tagName: string): boolean {
        return this.tagsParsed?.some((tag) => tag.tag === tagName) ?? false;
    }

    setTag(tagName: string, tagValue: string): void {
        if (this.tagsParsed === undefined) {
            this.tagsParsed = [new TagWithValue(tagName, tagValue)];
            return;
        }
        const index = this.tagsParsed.findIndex((tag) => tag.tag === tagName);
        if (index === -1) {
            // this doesn't push a TagWithValue
            this.tagsParsed.push(new TagWithValue(tagName, tagValue));
            return;
        }
        this.tagsParsed[index].value = tagValue;
    }

    removeTag(tagName: string | string[]): void {
        if (Array.isArray(tagName)) {
            tagName.forEach((tag) => {
                this.removeTag(tag);
            });
            return;
        }

        this.tagsParsed = this.tagsParsed?.filter((tag) => tag.tag !== tagName);
        this.updateTags;
    }

    private updateTags() {
        this.tags = this.tagsParsed?.map((tag) => {
            if (tag.value === undefined) {
                return tag.tag;
            }
            return `${tag.tag}(${tag.value})`;
        });
    }
}
