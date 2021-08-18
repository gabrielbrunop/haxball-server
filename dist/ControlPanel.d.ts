import { Server } from "./Server";
import { PanelConfig } from "./Global";
export declare class ControlPanel {
    private server;
    private fileName?;
    private client;
    private cpu;
    private mem;
    private prefix;
    private token;
    private mastersDiscordId;
    private bots;
    private customSettings?;
    constructor(server: Server, config: PanelConfig, fileName?: string | undefined);
    private loadCustomSettings;
    private loadBots;
    private logError;
    private getRoomNameList;
    private getRoomUsageList;
    private command;
}
