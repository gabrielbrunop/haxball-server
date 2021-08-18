import puppeteer from 'puppeteer-core';
import { CustomSettings, ServerConfig } from "./Global";
export declare class Server {
    browsers: puppeteer.Browser[];
    private unnamedCount;
    private remoteChromePort;
    private proxyEnabled;
    private proxyServers;
    private execPath;
    private disableCache;
    private userDataDir?;
    private disableRemote;
    private debuggingServer?;
    constructor(config: ServerConfig);
    private createNewBrowser;
    private checkTokenWorks;
    private openRoom;
    open(script: string, tokens: string | string[], name?: string, settings?: CustomSettings): Promise<{
        link: string;
        pid: number | undefined;
        remotePort: any;
    }>;
    close(pidOrTitle: string | number): Promise<boolean>;
}
