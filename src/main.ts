#!/usr/bin/env node

import yargs from "yargs";
import fs from "fs";

import { connect } from "./commands/connect";
import { openServer } from "./commands/openServer";

import { Config } from 'tunnel-ssh';

const args = yargs(process.argv.slice(2));

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
        openServer(argv.file as string);
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
    handler: async (argv: any) => {
        const params: Config = {
            username: argv.user,
            host: argv.host,
            keepAlive: true
        }

        if (argv.password != null) params["password"] = argv.password;
        if (argv.privateKey != null) {
            const key = fs.readFileSync(argv.privateKey, 'utf-8');
            params["privateKey"] = Buffer.from(key);
        } 

        await connect(params);
    }
});

args.demandCommand()
args.parse();