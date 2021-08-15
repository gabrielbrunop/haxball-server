"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DebuggingServer = exports.RoomDebuggingMessageType = void 0;
const net_1 = __importDefault(require("net"));
var RoomDebuggingMessageType;
(function (RoomDebuggingMessageType) {
    RoomDebuggingMessageType[RoomDebuggingMessageType["UpdateRooms"] = 0] = "UpdateRooms";
    RoomDebuggingMessageType[RoomDebuggingMessageType["AddRoom"] = 1] = "AddRoom";
    RoomDebuggingMessageType[RoomDebuggingMessageType["RemoveRoom"] = 2] = "RemoveRoom";
})(RoomDebuggingMessageType = exports.RoomDebuggingMessageType || (exports.RoomDebuggingMessageType = {}));
class DebuggingServer {
    constructor() {
        this.sockets = [];
        this.roomServers = [];
        this.server = net_1.default.createServer();
    }
    message(socket, type, message) {
        const msg = JSON.stringify({ type, message });
        socket.write(msg);
    }
    broadcast(type, message) {
        this.sockets.forEach(s => {
            this.message(s, type, message);
        });
    }
    listen(port) {
        this.server.on("listening", () => {
            console.log(`Listening to remote connections on port ${port}`);
        });
        this.server.on("connection", (socket) => {
            socket.setEncoding('utf8');
            this.sockets.push(socket);
            this.message(socket, RoomDebuggingMessageType.UpdateRooms, this.roomServers);
        });
        this.server.on("error", (err) => {
            if (err.message.includes("EADDRINUSE")) {
                console.error(`Remote debugging port ${port} is already in use. Make sure you are not running another instance of Haxball Server in the background.`);
                process.exit();
            }
            else {
                throw err;
            }
        });
        this.server.listen(port, "localhost");
    }
    setRooms(rooms) {
        this.roomServers = rooms;
        this.broadcast(RoomDebuggingMessageType.UpdateRooms, rooms);
        console.log(`[SET] ${rooms}`);
    }
    addRoom(room) {
        this.roomServers.push(room);
        this.broadcast(RoomDebuggingMessageType.AddRoom, room);
        console.log(`[ADD] :${room}`);
    }
    removeRoom(room) {
        if (!this.roomServers.includes(room))
            return;
        this.roomServers = this.roomServers.filter(r => r !== room);
        this.broadcast(RoomDebuggingMessageType.RemoveRoom, room);
        console.log(`[DEL] :${room}`);
    }
}
exports.DebuggingServer = DebuggingServer;
//# sourceMappingURL=DebuggingServer.js.map