export const serverPort = 9500;
export const serverRoomFirstPort = 9501;

export const clientPort = 9600;
export const expressPort = 9601;
export const wsPort = 9602;
export const clientRoomFirstPort = 9603;

export const maxLengthLog = 300;

export const maxTimeSSHConnection = 2 * 60 * 1000;

export const roomCustomConfigsList = [
    "roomName",
    "playerName",
    "password",
    "maxPlayers",
    "public",
    "geo",
    "noPlayer"
];

type BotList = { [key: string]: string } | { name: string, path: string, displayName?: string }[];

export interface PanelConfig {
    discordToken: string;
    discordPrefix: string;
    bots: BotList;
    mastersDiscordId: string[];
    customSettings?: CustomSettingsList;
    maxRooms?: number;
}

export interface ServerConfig {
    proxyEnabled?: boolean,
    proxyServers?: string[],
    disableCache?: boolean,
    disableRemote?: boolean,
    userDataDir?: string,
    disableAnonymizeLocalIps?: boolean,
    execPath: string,
    maxMemoryUsage: number
}

export interface HaxballServerConfig {
    server: ServerConfig,
    panel: PanelConfig
}

export interface CustomSettings {
    extends?: string | string[];
    [key: string]: any;
}

export type ReservedCustomSettings =
    "reserved.haxball.roomName" |
    "reserved.haxball.playerName" |
    "reserved.haxball.password" |
    "reserved.haxball.maxPlayers" |
    "reserved.haxball.public" |
    "reserved.haxball.geo" |
    "reserved.haxball.noPlayer";

export type CustomSettingsList = {
    [key: string]: CustomSettings
};