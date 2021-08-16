"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.openServer = void 0;
const Server_1 = require("../Server");
const Painel_1 = require("../Painel");
const loadConfig_1 = require("../utils/loadConfig");
function openServer(file) {
    loadConfig_1.loadConfig(file).then(config => {
        const server = new Server_1.Server(config.server);
        new Painel_1.ServerPainel(server, config.painel, file);
    }).catch(err => {
        console.error(err.error ? err.message + ", " + err.error : err.message);
        process.exit();
    });
}
exports.openServer = openServer;
//# sourceMappingURL=openServer.js.map