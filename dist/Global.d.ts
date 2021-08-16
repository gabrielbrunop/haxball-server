export declare const serverPort = 9500;
export declare const serverRoomFirstPort = 9501;
export declare const clientPort = 9600;
export declare const expressPort = 9601;
export declare const wsPort = 9602;
export declare const clientRoomFirstPort = 9603;
declare type BotList = {
    [key: string]: string;
} | {
    name: string;
    path: string;
    displayName?: string;
}[];
export interface PainelConfig {
    discordToken: string;
    discordPrefix: string;
    bots: BotList;
    mastersDiscordId: string[];
}
export interface ServerConfig {
    proxyEnabled?: boolean;
    proxyServers?: string[];
    disableCache?: boolean;
    disableRemote?: boolean;
    userDataDir?: string;
    execPath: string;
}
export interface HaxballServerConfig {
    server: ServerConfig;
    painel: PainelConfig;
}
export {};
