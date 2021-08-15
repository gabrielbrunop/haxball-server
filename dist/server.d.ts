import puppeteer from 'puppeteer-core';
interface ServerConfig {
    proxyEnabled?: boolean;
    proxyServers?: string[];
    disableCache?: boolean;
    disableRemote?: boolean;
    userDataDir?: string;
    execPath: string;
}
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
    private openRoom;
    open(script: string, token: string, name?: string): Promise<{
        link: string;
        pid: number | undefined;
        remotePort: any;
    }>;
    close(pidOrTitle: string | number): Promise<boolean>;
}
export {};
