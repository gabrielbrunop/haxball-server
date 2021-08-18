"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.log = void 0;
const Global_1 = require("../Global");
function log(prefix, message) {
    const timestamp = new Date().toLocaleTimeString("pt-BR");
    if (message.length > Global_1.maxLengthLog) {
        message = message.slice(0, Global_1.maxLengthLog) + "...";
    }
    console.log(`[${timestamp}] [${prefix}] ${message}`);
}
exports.log = log;
//# sourceMappingURL=log.js.map