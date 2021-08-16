export const serverPort = 9500;
export const serverRoomFirstPort = 9501;

export const clientPort = 9600;
export const expressPort = 9601;
export const wsPort = 9602;
export const clientRoomFirstPort = 9603;

type BotList = { [key: string]: string } | { name: string, path: string, displayName?: string }[];

export interface PainelConfig {
    discordToken: string;
    discordPrefix: string;
    bots: BotList;
    mastersDiscordId: string[];
}

export interface ServerConfig {
    proxyEnabled?: boolean,
    proxyServers?: string[],
    disableCache?: boolean,
    disableRemote?: boolean,
    userDataDir?: string,
    execPath: string
}

export interface HaxballServerConfig {
    server: ServerConfig,
    painel: PainelConfig
}