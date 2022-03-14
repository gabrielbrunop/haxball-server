#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const yargs_1 = __importDefault(require("yargs"));
const fs_1 = __importDefault(require("fs"));
const connect_1 = require("./commands/connect");
const openServer_1 = require("./commands/openServer");
const args = (0, yargs_1.default)(process.argv.slice(2));
args.command({
    command: "open",
    aliases: ["o", "r", "run", "server"],
    describe: "Opens a Haxball server.",
    builder: {
        file: {
            describe: "The config.json file.",
            demandOption: false,
            type: "string",
        }
    },
    handler: (argv) => {
        (0, openServer_1.openServer)(argv.file);
    }
});
args.command({
    command: "connect",
    aliases: ["c"],
    describe: "Forwards a remote debugging SSH tunnel.",
    builder: {
        host: {
            describe: "The host name or IP address.",
            demandOption: true,
            type: "string"
        },
        user: {
            describe: "The user name.",
            demandOption: true,
            type: "string"
        },
        password: {
            describe: "Password for password-based authentication.",
            demandOption: false,
            type: "string",
            conflicts: "privateKey"
        },
        privateKey: {
            describe: "Private key for key-based authentication.",
            demandOption: false,
            type: "string",
            conflicts: "password"
        }
    },
    handler: async (argv) => {
        const params = {
            username: argv.user,
            host: argv.host,
            keepAlive: true
        };
        if (argv.password != null)
            await (0, connect_1.connect)(Object.assign(Object.assign({}, params), { password: argv.password }));
        if (argv.privateKey != null) {
            fs_1.default.readFile(argv.privateKey, { encoding: "utf-8" }, async (err, data) => {
                if (err)
                    return console.error(`${err.message}\nError while loading private key file`);
                await (0, connect_1.connect)(Object.assign(Object.assign({}, params), { privateKey: Buffer.from(data) }));
            });
        }
    }
});
args.demandCommand();
args.parse();
//# sourceMappingURL=main.js.map