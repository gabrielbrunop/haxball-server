import os from "node-os-utils";
import fs from "fs";
import pidusage from "pidusage";
import process from "process";
import * as Discord from 'discord.js';

import { Server } from "./Server";
import { CustomSettings, CustomSettingsList, PainelConfig } from "./Global";

import { loadConfig } from "./utils/loadConfig";
import { log } from "./utils/log";

class Bot {
    constructor(
        public name: string,
        public path: string,
        public displayName?: string
    ) {}

    read(): Promise<string> {
        return new Promise((resolve, reject) => {
            fs.readFile(this.path, { encoding: 'utf-8' }, async (err, data) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(data);
                }
            });
        });
    }

    run(server: Server, data: string, tokens: string | string[], settings?: CustomSettings): ReturnType<Server["open"]> {
        return new Promise((resolve, reject) => {
            server.open(data, tokens, this.displayName, settings)
            .then(e => resolve(e))
            .catch(err => reject(err));
        });
    }
}

export class ServerPainel {
    private client = new Discord.Client();

    private cpu = os.cpu;
    private mem = os.mem;

    private prefix: string;
    private token: string;

    private mastersDiscordId: string[];

    private bots: Bot[] = [];

    private customSettings?: CustomSettingsList;

    constructor(private server: Server, config: PainelConfig, private fileName?: string) {
        this.prefix = config.discordPrefix;
        this.token = config.discordToken;
        this.mastersDiscordId = config.mastersDiscordId;

        if (config.customSettings) this.loadCustomSettings(config.customSettings);
        this.loadBots(config.bots);

        this.client.on('ready', () => {
            log("DISCORD", `Logged in as ${this.client.user?.tag}!`);        
        });

        this.client.on('message', async msg => {
            try {
                this.command(msg);
            } catch (e) {
                this.logError(e, msg.channel as Discord.TextChannel);
            }
        });

        this.client.login(this.token);
    }

    private loadCustomSettings(customSettings: CustomSettingsList) {
        this.customSettings = undefined;

        for (const entry of Object.entries(customSettings)) {
            const key = entry[0];
            const value = entry[1];

            if (value.extends && customSettings[value.extends]) {
                customSettings[key] = { ...customSettings[value.extends], ...customSettings[key] };
            }
        }

        this.customSettings = customSettings;
    }

    private loadBots(bots: PainelConfig["bots"]) {
        this.bots = [];

        if (!Array.isArray(bots)) {
            for (const entry of Object.entries(bots)) {
                const name = entry[0];
                const path = entry[1];

                this.bots.push(new Bot(name, path));
            }
        } else {
            for (const bot of bots) {
                this.bots.push(new Bot(bot.name, bot.path, bot.displayName));
            }
        }
    }

    private async logError(e: any, channel: Discord.TextChannel) {    
        const embed = new Discord.MessageEmbed()
            .setColor('#0099ff')
            .setTitle("Log Error")
            .setTimestamp(Date.now())
            .setDescription(e);
    
        await channel.send(embed);
    }

    private async getRoomNameList() {
        let rooms = [];

        for (const browser of this.server.browsers) {
            const page = (await browser.pages())[0];
            const proxyServer = browser["proxyServer"];
            const remotePort = browser["remotePort"];

            let pageTitle = await page.title();
            pageTitle = pageTitle != null && pageTitle != "" ? pageTitle : "Unnamed tab";

            const nameStr = `${pageTitle} (${page.browser().process()?.pid})${remotePort != null ? ` (localhost:${remotePort})` : ""}`;
    
            rooms.push({ name: nameStr, proxy: proxyServer });
        }

        if (rooms.length === 0) return "There are no open rooms!";
        if (rooms.every(r => r.proxy == null)) return rooms.map(r => r.name).join("\n");

        let proxyRooms: { text: string, proxy: string }[] = [];

        for (const room of rooms) {
            let pRoom = proxyRooms.find(r => r.proxy === room.proxy);

            if (pRoom) {
                pRoom.text += room.name + "\n";
            } else {
                proxyRooms.push({ text: room.name + "\n", proxy: room.proxy });
            }
        }
        
        return proxyRooms.map(r => `• ${r.proxy}\n${r.text}`).join("\n");
    }

    private async getRoomUsageList() {
        const roomsUsage: { process: pidusage.Status, title: string }[] = [];
    
        for (const browser of this.server.browsers) {
            const page = (await browser.pages())[0];
            
            roomsUsage.push({ process: await pidusage(browser?.process()?.pid as number), title: await page.title() });
        }
    
        return roomsUsage;
    }

    private async command(msg: Discord.Message) {
        if (!msg.content.startsWith(this.prefix)) return;

        const args = msg.content.slice(this.prefix.length).trim().split(' ');
        const text = msg.content.slice(this.prefix.length).trim().replace(args[0] + " ", "");
        const command = args.shift()?.toLowerCase();

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

                let settings: CustomSettings;
                let settingsMsg = "No setting has been loaded (not specified or not found).";
                
                if (this.customSettings != null) {
                    const settingArg = args[args.length - 1];

                    settings = this.customSettings[settingArg];

                    if (settings) {
                        settingsMsg = `\`${settingArg}\` settings have been loaded.`;                        
                        token = token.replace(settingArg, "").trim();
                    }
                }

                bot.read().then(script => {
                    bot.run(this.server, script, [token, token.substring(0, token.lastIndexOf(" "))], settings).then(e => {
                        msg.channel.send(embed.setDescription(`Room running! [Click here to join.](${e?.link})\nBrowser process: ${e?.pid}${e?.remotePort ? `\nRemote debugging: localhost:${e.remotePort}`: ""}\n${settingsMsg}`));
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
                    .addField("OS", await os.os.oos(), true)
                    .addField("Machine Uptime", new Date(os.os.uptime() * 1000).toISOString().substr(11, 8), true)
                
                const serverPIDUsage = await pidusage(process.pid);
    
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
                        const pid = room?.process()?.pid;

                        if (pid) {
                            await this.server.close(pid);
                        } else {
                            await room.close();

                            forcedClosedRooms++;
                        }

                        closedRooms++;
                    }

                    if (forcedClosedRooms === 0) {
                        embed.setDescription(`${closedRooms} rooms have been closed.`)
                    } else {
                        embed.setDescription(`${closedRooms} rooms have been closed.\n${forcedClosedRooms} rooms have been forced to close.`)
                    }

                    return msg.channel.send(embed);
                }
    
                const res = await this.server.close(text);
    
                if (res) embed.setDescription("Room closed!");
    
                msg.channel.send(embed);
            }
    
            if (command === "exit") {
                embed
                    .setTitle("Closing")
                    .setDescription("Closing server...");
    
                await msg.channel.send(embed);
    
                this.server.browsers.forEach(async browser => {
                    await browser.close();
                });
    
                process.exit();
            }

            if (command === "eval") {
                try {
                    const code = args.join(" ");
                    let evaled = eval(code);
               
                    if (typeof evaled !== "string") evaled = require("util").inspect(evaled);
               
                    msg.channel.send(evaled, { code: "javascript", split: true });
                } catch (err) {
                    msg.channel.send(`\`ERROR\` \`\`\`xl\n${err}\n\`\`\``);
                }
            }

            if (command === "reload") {
                embed.setTitle("Reload bots and custom settings").setColor(0xFF0000);

                loadConfig(this.fileName).then((config) => {
                    if (!config.painel.bots) {
                        embed.setDescription("Could not find bots in config file.");
                    } else {
                        this.loadBots(config.painel.bots);
                        if (config.painel.customSettings) this.loadCustomSettings(config.painel.customSettings);

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