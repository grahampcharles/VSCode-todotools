export type TaskPaperNode = {
    type: string;
    value?: string;
    children?: TaskPaperNode[];
    tags?: string[];
    depth: number;
    index: TaskPaperIndex;
};
export type TaskPaperIndex = {
    line: number;
    column: number;
    offset: number;
};
export type ParsedTaskInput = {
    value: string;
    tags: string[];
};
