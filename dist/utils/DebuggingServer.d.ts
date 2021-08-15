/// <reference types="node" />
import net from "net";
export declare enum RoomDebuggingMessageType {
    UpdateRooms = 0,
    AddRoom = 1,
    RemoveRoom = 2
}
export declare class DebuggingServer {
    server: net.Server;
    sockets: net.Socket[];
    roomServers: number[];
    constructor();
    private message;
    private broadcast;
    listen(port: number): void;
    setRooms(rooms: number[]): void;
    addRoom(room: number): void;
    removeRoom(room: number): void;
}
