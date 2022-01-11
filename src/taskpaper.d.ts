declare module "taskpaper" {
    type TaskPaperNode = {
        type: string;
        value?: string;
        children?: TaskPaperNode[];
        tags?: string[];
        depth: number;
        index?: TaskPaperIndex;
    };
    type TaskPaperIndex = {
        line: number;
        column: number;
        offset: number;
    };

    function parse(inputString: string): TaskPaperNode;
    export = parse;
}
