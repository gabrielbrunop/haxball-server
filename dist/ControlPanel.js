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
exports.ControlPanel = void 0;
const node_os_utils_1 = __importDefault(require("node-os-utils"));
const fs_1 = __importDefault(require("fs"));
const pidusage_1 = __importDefault(require("pidusage"));
const process_1 = __importDefault(require("process"));
const Discord = __importStar(require("discord.js"));
const loadConfig_1 = require("./utils/loadConfig");
const log_1 = require("./utils/log");
class Bot {
    constructor(name, path, displayName) {
        this.name = name;
        this.path = path;
        this.displayName = displayName;
    }
    read() {
        return new Promise((resolve, reject) => {
            fs_1.default.readFile(this.path, { encoding: 'utf-8' }, async (err, data) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(data);
                }
            });
        });
    }
    run(server, data, tokens, settings) {
        return new Promise((resolve, reject) => {
            server.open(data, tokens, this.displayName, settings)
                .then(e => resolve(e))
                .catch(err => reject(err));
        });
    }
}
class ControlPanel {
    constructor(server, config, fileName) {
        this.server = server;
        this.fileName = fileName;
        this.client = new Discord.Client();
        this.cpu = node_os_utils_1.default.cpu;
        this.mem = node_os_utils_1.default.mem;
        this.bots = [];
        this.prefix = config.discordPrefix;
        this.token = config.discordToken;
        this.mastersDiscordId = config.mastersDiscordId;
        if (config.customSettings)
            this.loadCustomSettings(config.customSettings);
        this.loadBots(config.bots);
        this.client.on('ready', () => {
            var _a;
            log_1.log("DISCORD", `Logged in as ${(_a = this.client.user) === null || _a === void 0 ? void 0 : _a.tag}!`);
        });
        this.client.on('message', async (msg) => {
            try {
                this.command(msg);
            }
            catch (e) {
                this.logError(e, msg.channel);
            }
        });
        this.client.login(this.token);
    }
    transformSetting(setting, list) {
        if (setting.extends) {
            const extensions = typeof setting.extends === "string" ? [setting.extends] : setting.extends;
            let newSetting = {};
            for (const e of extensions) {
                let ext = list[e];
                if (ext) {
                    if (ext.extends)
                        ext = this.transformSetting(ext, list);
                    newSetting = Object.assign(Object.assign({}, newSetting), ext);
                }
            }
            newSetting = Object.assign(Object.assign({}, newSetting), setting);
            delete newSetting.extends;
            return newSetting;
        }
        return setting;
    }
    loadCustomSettings(customSettings) {
        this.customSettings = undefined;
        for (const entry of Object.entries(customSettings)) {
            const key = entry[0];
            const value = entry[1];
            customSettings[key] = this.transformSetting(value, customSettings);
        }
        this.customSettings = customSettings;
    }
    loadBots(bots) {
        this.bots = [];
        if (!Array.isArray(bots)) {
            for (const entry of Object.entries(bots)) {
                const name = entry[0];
                const path = entry[1];
                this.bots.push(new Bot(name, path));
            }
        }
        else {
            for (const bot of bots) {
                this.bots.push(new Bot(bot.name, bot.path, bot.displayName));
            }
        }
    }
    async logError(e, channel) {
        const embed = new Discord.MessageEmbed()
            .setColor('#0099ff')
            .setTitle("Log Error")
            .setTimestamp(Date.now())
            .setDescription(e);
        await channel.send(embed);
    }
    async getRoomNameList() {
        var _a;
        let rooms = [];
        for (const browser of this.server.browsers) {
            const page = (await browser.pages())[0];
            const proxyServer = browser["proxyServer"];
            const remotePort = browser["remotePort"];
            let pageTitle = await page.title();
            pageTitle = pageTitle != null && pageTitle != "" ? pageTitle : "Unnamed tab";
            const nameStr = `${pageTitle} (${(_a = page.browser().process()) === null || _a === void 0 ? void 0 : _a.pid})${remotePort != null ? ` (localhost:${remotePort})` : ""}`;
            rooms.push({ name: nameStr, proxy: proxyServer });
        }
        if (rooms.length === 0)
            return "There are no open rooms!";
        if (rooms.every(r => r.proxy == null))
            return rooms.map(r => r.name).join("\n");
        let proxyRooms = [];
        for (const room of rooms) {
            let pRoom = proxyRooms.find(r => r.proxy === room.proxy);
            if (pRoom) {
                pRoom.text += room.name + "\n";
            }
            else {
                proxyRooms.push({ text: room.name + "\n", proxy: room.proxy });
            }
        }
        return proxyRooms.map(r => `• ${r.proxy}\n${r.text}`).join("\n");
    }
    async getRoomUsageList() {
        var _a;
        const roomsUsage = [];
        for (const browser of this.server.browsers) {
            const page = (await browser.pages())[0];
            roomsUsage.push({ process: await pidusage_1.default((_a = browser === null || browser === void 0 ? void 0 : browser.process()) === null || _a === void 0 ? void 0 : _a.pid), title: await page.title() });
        }
        return roomsUsage;
    }
    async command(msg) {
        var _a, _b;
        if (!msg.content.startsWith(this.prefix))
            return;
        const args = msg.content.slice(this.prefix.length).trim().split(' ');
        const text = msg.content.slice(this.prefix.length).trim().replace(args[0] + " ", "");
        const command = (_a = args.shift()) === null || _a === void 0 ? void 0 : _a.toLowerCase();
        const embed = new Discord.MessageEmbed().setColor('#0099ff');
        if (this.mastersDiscordId.includes(msg.author.id)) {
            if (command === "help") {
                embed
                    .setTitle("Help")
                    .setDescription("Haxball Server is a small server utility for Haxball rooms.")
                    .addField("help", "Command list.", true)
                    .addField("info", "Server info.", true)
                    .addField("meminfo", "CPU and memory info.", true)
                    .addField("open", "Open a room.", true)
                    .addField("close", "Close a room.", true)
                    .addField("reload", "Reload the bot configuration.", true)
                    .addField("exit", "Close the server.", true)
                    .addField("eval", "Execute Javascript.", true)
                    .addField("tokenlink", "Haxball Headless Token page.", true);
                msg.channel.send(embed);
            }
            if (command === "tokenlink") {
                embed
                    .setTitle("Headless Token")
                    .setDescription(`[Click here.](https://www.haxball.com/headlesstoken)`);
                msg.channel.send(embed);
            }
            if (command === "open") {
                embed.setTitle("Open room");
                const bot = this.bots.find(b => b.name === args[0]);
                if (!bot) {
                    embed.setDescription(`This bot does not exist. Type ${this.prefix}info to see the list of available bots.`);
                    return msg.channel.send(embed);
                }
                let token = text.replace(args[0], "").trim().replace(/\"/g, "").replace("Token obtained: ", "");
                if (!token || token === "") {
                    embed.setDescription(`You have to define a [headless token](https://www.haxball.com/headlesstoken) as second argument: ${this.prefix}open <bot> <token>`);
                    return msg.channel.send(embed);
                }
                let settings;
                let settingsMsg = "No setting has been loaded (not specified or not found).";
                if (this.customSettings != null) {
                    const settingArg = args[args.length - 1];
                    settings = this.customSettings[settingArg];
                    if (settings) {
                        settingsMsg = `\`${settingArg}\` settings have been loaded.`;
                        token = token.replace(settingArg, "").trim();
                    }
                    else if (this.customSettings["default"]) {
                        settingsMsg = `Default settings have been loaded.`;
                        settings = this.customSettings["default"];
                    }
                }
                bot.read().then(script => {
                    bot.run(this.server, script, [token, token.substring(0, token.lastIndexOf(" "))], settings).then(e => {
                        msg.channel.send(embed.setDescription(`Room running! [Click here to join.](${e === null || e === void 0 ? void 0 : e.link})\nBrowser process: ${e === null || e === void 0 ? void 0 : e.pid}${(e === null || e === void 0 ? void 0 : e.remotePort) ? `\nRemote debugging: localhost:${e.remotePort}` : ""}\n${settingsMsg}`));
                    })
                        .catch(err => {
                        msg.channel.send(embed.setDescription(`Unable to open the room!\n ${err}`));
                    });
                })
                    .catch(err => {
                    embed.setDescription("Error: " + err);
                });
            }
            if (command === "info") {
                const roomList = await this.getRoomNameList();
                embed
                    .setTitle("Information")
                    .addField("Open rooms", roomList)
                    .addField("Bot list", this.bots.map(b => b.name).join("\n"))
                    .addField("Custom settings list", this.customSettings ? Object.keys(this.customSettings).join("\n") : "No custom settings have been specified.");
                msg.channel.send(embed);
            }
            if (command === "meminfo") {
                const embedLoading = new Discord.MessageEmbed()
                    .setColor('#0099ff')
                    .setTitle("Information")
                    .setDescription("Loading...");
                const message = await msg.channel.send(embedLoading);
                const roomsUsage = await this.getRoomUsageList();
                const memInfo = await this.mem.info();
                const cpuUsage = await this.cpu.usage();
                embed
                    .setTitle("Information")
                    .addField("CPUs", this.cpu.count(), true)
                    .addField("CPU usage", cpuUsage + "%", true)
                    .addField("Free CPU", 100 - cpuUsage + "%", true)
                    .addField("Memory", `${(memInfo.usedMemMb / 1000).toFixed(2)}/${(memInfo.totalMemMb / 1000).toFixed(2)} GB (${memInfo.freeMemPercentage}% livre)`, true)
                    .addField("OS", await node_os_utils_1.default.os.oos(), true)
                    .addField("Machine Uptime", new Date(node_os_utils_1.default.os.uptime() * 1000).toISOString().substr(11, 8), true);
                const serverPIDUsage = await pidusage_1.default(process_1.default.pid);
                const serverCPUUsage = `CPU server usage: ${(serverPIDUsage.cpu).toFixed(2)}%\nMemory server usage: ${(serverPIDUsage.memory * 1e-6).toFixed(2)} MB\n`;
                const roomCPUMessage = this.server.browsers.length > 0 ? "\n" + roomsUsage.map((room) => `**${room.title} (${room.process.pid})**:\n${(room.process.cpu).toFixed(2)}% CPU\n${(room.process.memory * 1e-6).toFixed(2)} MB memory\n`).join("\n") : "";
                embed.setDescription(serverCPUUsage + roomCPUMessage + "\n");
                message.edit(embed);
            }
            if (command === "close") {
                embed
                    .setTitle("Close room")
                    .setDescription("Unable to find room");
                if (args[0] === "all") {
                    let forcedClosedRooms = 0;
                    let closedRooms = 0;
                    for (const room of this.server.browsers) {
                        const pid = (_b = room === null || room === void 0 ? void 0 : room.process()) === null || _b === void 0 ? void 0 : _b.pid;
                        if (pid) {
                            await this.server.close(pid);
                        }
                        else {
                            await room.close();
                            forcedClosedRooms++;
                        }
                        closedRooms++;
                    }
                    if (forcedClosedRooms === 0) {
                        embed.setDescription(`${closedRooms} rooms have been closed.`);
                    }
                    else {
                        embed.setDescription(`${closedRooms} rooms have been closed.\n${forcedClosedRooms} rooms have been forced to close.`);
                    }
                    return msg.channel.send(embed);
                }
                const res = await this.server.close(text);
                if (res)
                    embed.setDescription("Room closed!");
                msg.channel.send(embed);
            }
            if (command === "exit") {
                embed
                    .setTitle("Closing")
                    .setDescription("Closing server...");
                await msg.channel.send(embed);
                this.server.browsers.forEach(async (browser) => {
                    await browser.close();
                });
                process_1.default.exit();
            }
            if (command === "eval") {
                try {
                    const code = args.join(" ");
                    let evaled = eval(code);
                    if (typeof evaled !== "string")
                        evaled = require("util").inspect(evaled);
                    msg.channel.send(evaled, { code: "javascript", split: true });
                }
                catch (err) {
                    msg.channel.send(`\`ERROR\` \`\`\`xl\n${err}\n\`\`\``);
                }
            }
            if (command === "reload") {
                embed.setTitle("Reload bots and custom settings").setColor(0xFF0000);
                loadConfig_1.loadConfig(this.fileName).then((config) => {
                    if (!config.panel.bots) {
                        embed.setDescription("Could not find bots in config file.");
                    }
                    else {
                        this.loadBots(config.panel.bots);
                        if (config.panel.customSettings)
                            this.loadCustomSettings(config.panel.customSettings);
                        embed.setColor(0x0099FF).setDescription("Bot list and custom settings reloaded!");
                    }
                    msg.channel.send(embed);
                }).catch(err => {
                    embed.setDescription(`*${err.message}*\n\nSee logs for details.`);
                    console.error(err);
                    msg.channel.send(embed);
                });
            }
        }
    }
}
exports.ControlPanel = ControlPanel;
//# sourceMappingURL=ControlPanel.js.map