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
const Global = __importStar(require("./Global"));
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
        var _a, _b, _c, _d;
        this.browsers = [];
        this.unnamedCount = 1;
        this.proxyEnabled = (_a = config === null || config === void 0 ? void 0 : config.proxyEnabled) !== null && _a !== void 0 ? _a : false;
        this.proxyServers = (_b = config === null || config === void 0 ? void 0 : config.proxyServers) !== null && _b !== void 0 ? _b : [];
        this.execPath = config.execPath;
        this.disableCache = (_c = config.disableCache) !== null && _c !== void 0 ? _c : false;
        this.userDataDir = config.userDataDir;
        this.remoteChromePort = Global.serverRoomFirstPort;
        this.disableRemote = (_d = config.disableRemote) !== null && _d !== void 0 ? _d : false;
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
        let proxyServer = "";
        if (this.proxyEnabled) {
            let availableProxies = this.proxyServers.filter(s => {
                let a = 0;
                for (const browser of this.browsers) {
                    console.log(browser["proxyServer"], s);
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
    async openRoom(page, script, token) {
        page
            .on('pageerror', ({ message }) => console.log(message))
            .on('response', response => console.log(`${response.status()} : ${response.url()}`))
            .on('requestfailed', request => { var _a; return console.log(`${(_a = request.failure()) === null || _a === void 0 ? void 0 : _a.errorText} : ${request.url()}`); });
        if (this.disableCache)
            await page.setCacheEnabled(false);
        const client = await page.target().createCDPSession();
        const scripts = `
            window["ServerData"] = {
                Token: "${token}"
            }`;
        await client.send('Network.setBlockedURLs', { urls: blockedRes });
        await page.goto('https://www.haxball.com/headless', { waitUntil: 'networkidle2' });
        const isTokenOk = await page.evaluate(async (token) => {
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
        if (!isTokenOk)
            throw new Error("Invalid token.");
        await page.addScriptTag({ content: scripts });
        await page.addScriptTag({ content: script });
        await page.addScriptTag({ content: `document.title = window["RoomData"]?.name ?? "Unnamed room ${this.unnamedCount++}";` });
        await page.waitForSelector("iframe");
        const elementHandle = await page.$(selectorFrame);
        const frame = await elementHandle.contentFrame();
        await frame.waitForSelector(selectorRoomLink);
        const roomLinkElement = await frame.$(selectorRoomLink);
        const link = await frame.evaluate(el => el.textContent, roomLinkElement);
        return link;
    }
    async open(script, token) {
        var _a;
        const browser = await this.createNewBrowser();
        const pid = (_a = browser === null || browser === void 0 ? void 0 : browser.process()) === null || _a === void 0 ? void 0 : _a.pid;
        const [page] = await browser.pages();
        try {
            const link = await this.openRoom(page, script, token);
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