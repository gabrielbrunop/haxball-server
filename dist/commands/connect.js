"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connect = void 0;
const tunnel_ssh_1 = __importDefault(require("tunnel-ssh"));
const open_1 = __importDefault(require("open"));
const DebuggingInterface_1 = require("../debugging/DebuggingInterface");
const DebuggingClient_1 = require("../debugging/DebuggingClient");
const Global = __importStar(require("../Global"));
function openTunnel(config) {
    return tunnel_ssh_1.default(Object.assign(Object.assign({}, config), { readyTimeout: Global.maxTimeSSHConnection }));
}
async function connect(connectConfig) {
    let tunnels = [];
    console.log("Establishing remote connection...");
    openTunnel(Object.assign(Object.assign({}, connectConfig), { dstPort: Global.serverPort, localPort: Global.clientPort }))
        .on("error", (err) => {
        console.error("Error: " + err.message);
        console.error("A Haxball Server connection could not be opened.");
        process.exit();
    });
    const client = new DebuggingClient_1.DebuggingClient();
    client.on("set", async (rooms) => {
        for (const room of rooms) {
            const tunnelSrv = openTunnel(Object.assign(Object.assign({}, connectConfig), { dstPort: room.server, localPort: room.client }));
            tunnels.push({ port: room.client, server: tunnelSrv });
        }
        const url = new DebuggingInterface_1.ConnectInterface().listen(Global.expressPort, Global.wsPort, client);
        await open_1.default(url);
    });
    client.on("add", async (server, client) => {
        const tunnelSrv = openTunnel(Object.assign(Object.assign({}, connectConfig), { dstPort: server, localPort: client }))
            .on("error", (err) => {
            console.error("Error: " + err.message);
            console.error("Failed to connect to room.");
        });
        tunnels.push({ port: client, server: tunnelSrv });
    });
    client.on("remove", async (server, client) => {
        var _a;
        const tunnel = tunnels.find(t => t.port === client);
        if (tunnel) {
            (_a = tunnel.server) === null || _a === void 0 ? void 0 : _a.close();
            tunnels = tunnels.filter(t => t.port !== tunnel.port);
        }
    });
    client.listen(Global.clientPort);
}
exports.connect = connect;
//# sourceMappingURL=connect.js.map