"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.escapeString = void 0;
function escapeString(str) {
    if (typeof str !== "string")
        return str;
    return str.replace(/"/g, '\\"');
}
exports.escapeString = escapeString;
//# sourceMappingURL=escapeString.js.map