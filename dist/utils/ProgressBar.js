"use strict";
// From https://medium.com/@bargord11/write-your-first-node-js-terminal-progress-bar-5bd5edb8a563
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProgressBar = void 0;
class ProgressBar {
    constructor() {
        this.total = 0;
        this.current = 0;
        this.barLength = process.stdout.columns - 30;
    }
    init(total) {
        this.total = total;
        this.current = 0;
        this.update(this.current);
    }
    update(current) {
        this.current = current;
        const currentProgress = this.current / this.total;
        this.draw(currentProgress);
    }
    draw(currentProgress) {
        const filledBarLength = (currentProgress * this.barLength).toFixed(0);
        // @ts-ignore
        const emptyBarLength = this.barLength - filledBarLength;
        const filledBar = this.getBar(filledBarLength, " ");
        const emptyBar = this.getBar(emptyBarLength, "-");
        const percentageProgress = (currentProgress * 100).toFixed(2);
        process.stdout.cursorTo(0);
        process.stdout.write(`Current progress: [${filledBar}${emptyBar}] | ${percentageProgress}%`);
        // @ts-ignore
        if (currentProgress === 1)
            process.stdout.clearLine();
    }
    getBar(length, char, color = (a) => a) {
        let str = "";
        for (let i = 0; i < length; i++) {
            str += char;
        }
        return color(str);
    }
}
exports.ProgressBar = ProgressBar;
//# sourceMappingURL=ProgressBar.js.map