import puppeteer, { Page } from 'puppeteer-core';

import { DebuggingServer } from "./debugging/DebuggingServer";
import { getAvailablePort } from "./utils/getAvailablePort";
import { escapeString } from "./utils/escapeString";
import { log } from "./utils/log";

import * as Global from "./Global";
import { CustomSettings, roomCustomConfigsList, ServerConfig } from "./Global";

const selectorFrame = 'body > iframe';
const selectorRoomLink = '#roomlink > p > a';

const blockedRes = [
	'*/favicon.ico',
	'.css',
	'.jpg',
	'.jpeg',
	'.png',
	'.svg',
	'.woff',
  
	'*.optimizely.com',
	'everesttech.net',
	'userzoom.com',
	'doubleclick.net',
	'googleadservices.com',
	'adservice.google.com/*',
	'connect.facebook.com',
	'connect.facebook.net',
	'sp.analytics.yahoo.com'
];

export class Server {
    browsers: puppeteer.Browser[] = [];

    private unnamedCount = 1;
    private remoteChromePort: number;

    private proxyEnabled: boolean;
    private proxyServers: string[];
    private execPath: string;
    private disableCache: boolean;
    private userDataDir?: string;
    private disableRemote: boolean;

    private debuggingServer?: DebuggingServer;

    constructor(config: ServerConfig) {
        this.proxyEnabled = config?.proxyEnabled ?? false;
        this.proxyServers = config?.proxyServers ?? [];
        this.execPath = config.execPath;
        this.disableCache = config.disableCache ?? false;
        this.userDataDir = config.userDataDir;
        this.remoteChromePort = Global.serverRoomFirstPort;
        this.disableRemote = config.disableRemote ?? false;

        if (!this.disableRemote) {
            this.debuggingServer = new DebuggingServer();
            this.debuggingServer.listen(Global.serverPort);
        }
    }

    private async createNewBrowser() {
        const args = [
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-dev-shm-usage",
            "--disable-accelerated-2d-canvas",
            "--no-first-run",
            "--no-zygote",
            "--single-process",
            "--disable-gpu",
        ];

        const remotePort = await getAvailablePort(this.remoteChromePort);

        if (!this.disableRemote) args.push(`--remote-debugging-port=${remotePort}`);
        if (this.disableCache) args.push("--incognito");
        
        let proxyServer = "";

        if (this.proxyEnabled) {
            let availableProxies = this.proxyServers.filter(s => {
                let a = 0;

                for (const browser of this.browsers) {
                    if (browser["proxyServer"] === s) {
                        a++;
                    }
                }

                return a < 2; 
            });

            if (availableProxies.length === 0) {
                proxyServer = this.proxyServers[this.proxyServers.length - 1];
            } else {
                proxyServer = availableProxies[0];
            }
            
            args.push("--proxy-server=" + proxyServer);
        }

        const puppeteerArgs = {
            headless: true,
            args: args,
            executablePath: this.execPath
        };

        if (this.userDataDir && this.disableCache !== true) puppeteerArgs["userDataDir"] = this.userDataDir;

        const browser = await puppeteer.launch(puppeteerArgs);

        if (!this.disableRemote) browser["remotePort"] = remotePort;
        if (proxyServer != "") browser["proxyServer"] = proxyServer;

        this.browsers.push(browser);

        browser.on("disconnected", () => {
            this.browsers = this.browsers.filter(b => {
                const isConnected = b.isConnected();

                if (!isConnected) b.close();

                if (!this.disableRemote) this.debuggingServer?.removeRoom(remotePort);

                return isConnected;
            });
        });

        if (!this.disableRemote) this.debuggingServer?.addRoom(remotePort);

        return browser;
    }
    
    private async checkTokenWorks(page: Page, token: string) {
        return await page.evaluate(async (token) => {
            return await new Promise((resolve) => {
                const server = new WebSocket(`wss://p2p2.haxball.com/host?token=${token}`);

                server.onopen = function() {
                    resolve(true);
                };
                
                server.onerror = function() {
                    resolve(false);
                };
            });
        }, token);
    }

    private async openRoom(page: puppeteer.Page, script: string, tokens: string[], name?: string, settings?: CustomSettings): Promise<string> {
        page.on("pageerror", ({ message }) => log("PAGE ERROR", message))
		.on("response", response => log("PAGE RESPONSE", `${response.status()} : ${response.url()}`))
		.on("requestfailed", request => log("REQUEST FAILED", `${request.failure()?.errorText} : ${request.url()}`))
        .on("error", (err) => log("PAGE CRASHED", `${err}`))
        .on("pageerror", (err) => log("ERROR IN PAGE", `${err}`));

        if (this.disableCache) await page.setCacheEnabled(false);

        const client = await page.target().createCDPSession();

        if (name) {
            name = `"${escapeString(name)}"`;
        } else {
            name = `args[0]["roomName"] ?? "Unnamed room ${this.unnamedCount++}"`;
        }

        let reservedHBInitCustomSettingsScript = "";
        let customSettingsScript = {};

        if (settings) {
            for (const setting of Object.entries(settings)) {
                const key = setting[0];
                const value = setting[1];

                if (roomCustomConfigsList.map(config => "reserved.haxball." + config).includes(key)) {
                    reservedHBInitCustomSettingsScript += `args[0]["${escapeString(key.replace("reserved.haxball.", ""))}"] = ${JSON.stringify(value)};`;
                } else {
                    customSettingsScript[key] = value;
                }
            }
        }

        await client.send('Network.setBlockedURLs', { urls: blockedRes });
        await page.goto('https://www.haxball.com/headless', { waitUntil: 'networkidle2' });

        let token;

        for (const t of tokens) {
            if (t != "" && await this.checkTokenWorks(page, t)) token = t;
        }

        const tokenListStr = tokens.filter(t => t && t != "").map(t => "`" + t + "`").join(", ");

        if (token == null) throw new Error(`Invalid token (tried ${tokenListStr}).`);

        const scripts = `
        window.HBInit = new Proxy(window.HBInit, {
            apply: (target, thisArg, args) => {
                args[0]["token"] = "${token}";

                ${reservedHBInitCustomSettingsScript}

                document.title = ${name};
        
                return target(...args);
            }
        });
        
        window["CustomSettings"] = ${JSON.stringify(customSettingsScript)};
        `;

        await page.addScriptTag({ content: scripts });
        await page.addScriptTag({ content: script });

        await page.waitForSelector("iframe");

        const elementHandle = await page.$(selectorFrame);
        const frame = await elementHandle!.contentFrame();

        await frame!.waitForSelector(selectorRoomLink);

        const roomLinkElement = await frame!.$(selectorRoomLink);
        const link = await frame!.evaluate(el => el.textContent, roomLinkElement)

        return link;
    }

    async open(script: string, tokens: string | string[], name?: string, settings?: CustomSettings) {
        const browser = await this.createNewBrowser();
        const pid = browser?.process()?.pid;
        const [ page ] = await browser.pages();

        tokens = typeof tokens === "string" ? [tokens] : tokens;

        try {
            const link = await this.openRoom(page, script, tokens, name, settings);

            return { link, pid, remotePort: browser["remotePort"] };
        } catch (e) {
            this.close(pid as number);

            throw e;
        }
    }

    async close(pidOrTitle: string | number) {
        let success = false;
        let pOT: number | string | undefined = pidOrTitle;

        for (const browser of this.browsers) {
            const title = await (await browser.pages())[0].title();

            if (title == pOT) pOT = browser?.process()?.pid;
        }

        this.browsers = this.browsers.filter(b => {
            const pid = b?.process()?.pid;

            if (pid == pOT) {
                b.close().then(() => {
                    if (!this.disableRemote) this.debuggingServer?.removeRoom(b["remotePort"]);
                });
                
                success = true;
            }

            return pid != pOT;
        });

        return success;
    }
}