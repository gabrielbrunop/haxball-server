import net from "net";

export enum RoomDebuggingMessageType {
    UpdateRooms,
    AddRoom,
    RemoveRoom
}

export class DebuggingServer {
    server: net.Server;
    sockets: net.Socket[] = [];

    roomServers: number[] = [];

    constructor() {
        this.server = net.createServer();
    }

    private message(socket: net.Socket, type: RoomDebuggingMessageType, message: any) {
        const msg = JSON.stringify({ type, message });

        socket.write(msg);
    }

    private broadcast(type: RoomDebuggingMessageType, message: any) {
        this.sockets.forEach(s => {
            this.message(s, type, message);
        });
    }

    listen(port: number) {
        this.server.on("listening", () => {
            console.log(`Listening to remote connections on port ${port}`);
        })

        this.server.on("connection", (socket) => {
            socket.setEncoding('utf8');
            
            this.sockets.push(socket);

            this.message(socket, RoomDebuggingMessageType.UpdateRooms, this.roomServers);
        });

        this.server.on("error", (err) => {
            if (err.message.includes("EADDRINUSE")) {
                console.error(`Remote debugging port ${port} is already in use. Make sure you are not running another instance of Haxball Server in the background.`);
                process.exit();
            } else {
                throw err;
            }
        });

        this.server.listen(port, "localhost");
    }

    setRooms(rooms: number[]) {
        this.roomServers = rooms;
        this.broadcast(RoomDebuggingMessageType.UpdateRooms, rooms);

        console.log(`[SET] ${rooms}`);
    }
    
    addRoom(room: number) {
        this.roomServers.push(room);
        this.broadcast(RoomDebuggingMessageType.AddRoom, room);

        console.log(`[ADD] :${room}`);
    }

    removeRoom(room: number) {
        if (!this.roomServers.includes(room)) return;

        this.roomServers = this.roomServers.filter(r => r !== room);
        this.broadcast(RoomDebuggingMessageType.RemoveRoom, room);

        console.log(`[DEL] :${room}`);
    }
}