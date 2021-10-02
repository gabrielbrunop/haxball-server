"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Server = void 0;
const puppeteer_core_1 = __importDefault(require("puppeteer-core"));
const DebuggingServer_1 = require("./debugging/DebuggingServer");
const getAvailablePort_1 = require("./utils/getAvailablePort");
const escapeString_1 = require("./utils/escapeString");
const log_1 = require("./utils/log");
const Global = __importStar(require("./Global"));
const Global_1 = require("./Global");
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
class Server {
    constructor(config) {
        var _a, _b, _c, _d, _e;
        this.browsers = [];
        this.unnamedCount = 1;
        this.proxyEnabled = (_a = config === null || config === void 0 ? void 0 : config.proxyEnabled) !== null && _a !== void 0 ? _a : false;
        this.proxyServers = (_b = config === null || config === void 0 ? void 0 : config.proxyServers) !== null && _b !== void 0 ? _b : [];
        this.execPath = config.execPath;
        this.disableCache = (_c = config.disableCache) !== null && _c !== void 0 ? _c : false;
        this.userDataDir = config.userDataDir;
        this.remoteChromePort = Global.serverRoomFirstPort;
        this.disableRemote = (_d = config.disableRemote) !== null && _d !== void 0 ? _d : false;
        this.disableAnonymizeLocalIps = (_e = config.disableAnonymizeLocalIps) !== null && _e !== void 0 ? _e : false;
        if (!this.disableRemote) {
            this.debuggingServer = new DebuggingServer_1.DebuggingServer();
            this.debuggingServer.listen(Global.serverPort);
        }
    }
    async createNewBrowser() {
        var _a;
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
        const remotePort = await getAvailablePort_1.getAvailablePort(this.remoteChromePort);
        if (!this.disableRemote)
            args.push(`--remote-debugging-port=${remotePort}`);
        if (this.disableCache)
            args.push("--incognito");
        if (this.disableAnonymizeLocalIps)
            args.push(`--disable-features=WebRtcHideLocalIpsWithMdns`);
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
            }
            else {
                proxyServer = availableProxies[0];
            }
            args.push("--proxy-server=" + proxyServer);
        }
        const puppeteerArgs = {
            headless: true,
            args: args,
            executablePath: this.execPath
        };
        if (this.userDataDir && this.disableCache !== true)
            puppeteerArgs["userDataDir"] = this.userDataDir;
        const browser = await puppeteer_core_1.default.launch(puppeteerArgs);
        if (!this.disableRemote)
            browser["remotePort"] = remotePort;
        if (proxyServer != "")
            browser["proxyServer"] = proxyServer;
        this.browsers.push(browser);
        browser.on("disconnected", () => {
            this.browsers = this.browsers.filter(b => {
                var _a;
                const isConnected = b.isConnected();
                if (!isConnected)
                    b.close();
                if (!this.disableRemote)
                    (_a = this.debuggingServer) === null || _a === void 0 ? void 0 : _a.removeRoom(remotePort);
                return isConnected;
            });
        });
        if (!this.disableRemote)
            (_a = this.debuggingServer) === null || _a === void 0 ? void 0 : _a.addRoom(remotePort);
        return browser;
    }
    async checkTokenWorks(page, token) {
        return await page.evaluate(async (token) => {
            return await new Promise((resolve) => {
                const server = new WebSocket(`wss://p2p2.haxball.com/host?token=${token}`);
                server.onopen = function () {
                    resolve(true);
                };
                server.onerror = function () {
                    resolve(false);
                };
            });
        }, token);
    }
    async openRoom(page, script, tokens, name, settings) {
        page.on("pageerror", ({ message }) => log_1.log("PAGE ERROR", message))
            .on("response", response => log_1.log("PAGE RESPONSE", `${response.status()} : ${response.url()}`))
            .on("requestfailed", request => { var _a; return log_1.log("REQUEST FAILED", `${(_a = request.failure()) === null || _a === void 0 ? void 0 : _a.errorText} : ${request.url()}`); })
            .on("error", (err) => log_1.log("PAGE CRASHED", `${err}`))
            .on("pageerror", (err) => log_1.log("ERROR IN PAGE", `${err}`));
        if (this.disableCache)
            await page.setCacheEnabled(false);
        const client = await page.target().createCDPSession();
        name = `(args[0]["roomName"] ?? "Unnamed room ${this.unnamedCount++}")` + (name ? ` + " (${escapeString_1.escapeString(name)})"` : "");
        let reservedHBInitCustomSettingsScript = "";
        let customSettingsScript = {};
        if (settings) {
            for (const setting of Object.entries(settings)) {
                const key = setting[0];
                const value = setting[1];
                if (Global_1.roomCustomConfigsList.map(config => "reserved.haxball." + config).includes(key)) {
                    reservedHBInitCustomSettingsScript += `args[0]["${escapeString_1.escapeString(key.replace("reserved.haxball.", ""))}"] = ${JSON.stringify(value)};`;
                }
                else {
                    customSettingsScript[key] = value;
                }
            }
        }
        await client.send('Network.setBlockedURLs', { urls: blockedRes });
        await page.goto('https://www.haxball.com/headless', { waitUntil: 'networkidle2' });
        let token;
        for (const t of tokens) {
            if (t != "" && await this.checkTokenWorks(page, t))
                token = t;
        }
        const tokenListStr = tokens.filter(t => t && t != "").map(t => "`" + t + "`").join(", ");
        if (token == null)
            throw new Error(`Invalid token (tried ${tokenListStr}).`);
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
        const frame = await elementHandle.contentFrame();
        await frame.waitForSelector(selectorRoomLink);
        const roomLinkElement = await frame.$(selectorRoomLink);
        const link = await frame.evaluate(el => el.textContent, roomLinkElement);
        return link;
    }
    async open(script, tokens, name, settings) {
        var _a;
        const browser = await this.createNewBrowser();
        const pid = (_a = browser === null || browser === void 0 ? void 0 : browser.process()) === null || _a === void 0 ? void 0 : _a.pid;
        const [page] = await browser.pages();
        tokens = typeof tokens === "string" ? [tokens] : tokens;
        try {
            const link = await this.openRoom(page, script, tokens, name, settings);
            return { link, pid, remotePort: browser["remotePort"] };
        }
        catch (e) {
            this.close(pid);
            throw e;
        }
    }
    async close(pidOrTitle) {
        var _a;
        let success = false;
        let pOT = pidOrTitle;
        for (const browser of this.browsers) {
            const title = await (await browser.pages())[0].title();
            if (title == pOT)
                pOT = (_a = browser === null || browser === void 0 ? void 0 : browser.process()) === null || _a === void 0 ? void 0 : _a.pid;
        }
        this.browsers = this.browsers.filter(b => {
            var _a;
            const pid = (_a = b === null || b === void 0 ? void 0 : b.process()) === null || _a === void 0 ? void 0 : _a.pid;
            if (pid == pOT) {
                b.close().then(() => {
                    var _a;
                    if (!this.disableRemote)
                        (_a = this.debuggingServer) === null || _a === void 0 ? void 0 : _a.removeRoom(b["remotePort"]);
                });
                success = true;
            }
            return pid != pOT;
        });
        return success;
    }
}
exports.Server = Server;
//# sourceMappingURL=Server.js.map