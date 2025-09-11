declare module "linebreak" {
    class Break {
        public position: number;
        public required?: boolean;
        constructor(position: number, required?: boolean);
    }
    export default class LineBreaker {
        constructor(text: string);
        nextCodePoint(): number;
        nextCharClass(): number;
        getSimpleBreak(): false | null;
        getPairTableBreak(lastClass: number): boolean;
        nextBreak(): Break | null;
    }
}
