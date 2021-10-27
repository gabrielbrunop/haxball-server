export declare const serverPort = 9500;
export declare const serverRoomFirstPort = 9501;
export declare const clientPort = 9600;
export declare const expressPort = 9601;
export declare const wsPort = 9602;
export declare const clientRoomFirstPort = 9603;
export declare const maxLengthLog = 300;
export declare const roomCustomConfigsList: string[];
declare type BotList = {
    [key: string]: string;
} | {
    name: string;
    path: string;
    displayName?: string;
}[];
export interface PanelConfig {
    discordToken: string;
    discordPrefix: string;
    bots: BotList;
    mastersDiscordId: string[];
    customSettings?: CustomSettingsList;
    maxRooms?: number;
}
export interface ServerConfig {
    proxyEnabled?: boolean;
    proxyServers?: string[];
    disableCache?: boolean;
    disableRemote?: boolean;
    userDataDir?: string;
    disableAnonymizeLocalIps?: boolean;
    execPath: string;
}
export interface HaxballServerConfig {
    server: ServerConfig;
    panel: PanelConfig;
}
export interface CustomSettings {
    extends?: string | string[];
    [key: string]: any;
}
export declare type ReservedCustomSettings = "reserved.haxball.roomName" | "reserved.haxball.playerName" | "reserved.haxball.password" | "reserved.haxball.maxPlayers" | "reserved.haxball.public" | "reserved.haxball.geo" | "reserved.haxball.noPlayer";
export declare type CustomSettingsList = {
    [key: string]: CustomSettings;
};
export {};
