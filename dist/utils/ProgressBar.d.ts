export declare class ProgressBar {
    total: number;
    current: number;
    barLength: number;
    constructor();
    init(total: number): void;
    update(current: number): void;
    draw(currentProgress: number): void;
    getBar(length: any, char: any, color?: (a: any) => any): any;
}
