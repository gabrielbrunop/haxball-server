import puppeteer from 'puppeteer-core';
interface ServerConfig {
    proxyEnabled?: boolean;
    proxyServers?: string[];
    execPath: string;
}
export declare class Server {
    browsers: puppeteer.Browser[];
    private _unnamedCount;
    private _proxyEnabled;
    private _proxyServers;
    private _execPath;
    constructor(config: ServerConfig);
    private _createNewBrowser;
    private _openRoom;
    open(script: string, token: string): Promise<{
        link: string;
        pid: number | undefined;
    }>;
    close(pidOrTitle: string | number): Promise<boolean>;
}
export {};
