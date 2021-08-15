import { DebuggingClient } from "./DebuggingClient";
export declare class ConnectInterface {
    constructor(port: number, wsPort: number, debuggingClient: DebuggingClient);
    private openExpressServer;
    private openWSServer;
    private addRoomToList;
    private removeRoomFromList;
}
