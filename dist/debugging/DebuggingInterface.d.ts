import { DebuggingClient } from "./DebuggingClient";
export declare class ConnectInterface {
    listen(expressPort: number, wsPort: number, debuggingClient: DebuggingClient): string;
    private openExpressServer;
    private openWSServer;
    private addRoomToList;
    private removeRoomFromList;
}
