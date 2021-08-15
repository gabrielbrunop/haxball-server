"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isPortTaken = void 0;
const net_1 = __importDefault(require("net"));
function isPortTaken(port) {
    return new Promise((resolve, reject) => {
        const tester = net_1.default.createServer();
        tester.once('error', (err) => {
            //if (err.code != 'EADDRINUSE') reject(err);
            resolve(true);
        });
        tester.once('listening', () => {
            tester.once('close', () => resolve(false));
            tester.close();
        });
        tester.listen(port);
    });
}
exports.isPortTaken = isPortTaken;
//# sourceMappingURL=isPortTaken.js.map