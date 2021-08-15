import { Server } from "./Server";
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
    private server;
    private client;
    private cpu;
    private mem;
    private prefix;
    private token;
    private mastersDiscordId;
    private bots;
    constructor(server: Server, config: PainelConfig);
    private logError;
    private getRoomNameList;
    private getRoomUsageList;
    private command;
}
export {};
