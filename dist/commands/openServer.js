"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.openServer = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const Server_1 = require("../Server");
const Painel_1 = require("../Painel");
function openServer(file) {
    const filePath = file == null || file == "" ? path_1.default.resolve(path_1.default.resolve('.'), "config.json") : file;
    let data, config;
    try {
        data = fs_1.default.readFileSync(filePath, { encoding: 'utf8', flag: 'r' });
    }
    catch (err) {
        console.error(`Error while loading config file, ${err}`);
        process.exit();
    }
    try {
        config = JSON.parse(data);
    }
    catch (err) {
        console.error(`Error while parsing config file, ${err}`);
        process.exit();
    }
    const server = new Server_1.Server(config.server);
    new Painel_1.ServerPainel(server, config.painel);
}
exports.openServer = openServer;
//# sourceMappingURL=openServer.js.map