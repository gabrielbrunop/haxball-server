import { Server } from "./server";
declare type BotList = {
    [key: string]: string;
};
interface PainelConfig {
    discordToken: string;
    discordPrefix: string;
    bots: BotList;
    mastersDiscordId: string[];
}
export declare class ServerPainel {
    private _server;
    private _client;
    private _cpu;
    private _mem;
    private _prefix;
    private _token;
    private _mastersDiscordId;
    private _bots;
    constructor(_server: Server, config: PainelConfig);
    private _logError;
    private _getRoomNameList;
    private _getRoomUsageList;
    private _command;
}
export {};
