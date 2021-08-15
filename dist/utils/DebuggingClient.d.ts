/// <reference types="node" />
import net from "net";
import EventEmitter from "events";
export declare class DebuggingClient extends EventEmitter {
    private roomsConn;
    client?: net.Socket;
    get rooms(): number[];
    get size(): number;
    constructor();
    listen(port: number): void;
}
