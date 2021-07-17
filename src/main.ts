#!/usr/bin/env node

import { Server } from "./server";
import { ServerPainel } from "./painel";
import yargs from "yargs";
import fs from "fs";
import path from "path";

const argv = yargs(process.argv.slice(2))
    .usage('Open a Haxball server.\nUsage: $0')
    .string("f")
    .alias('f', 'file')
    .describe('f', 'Load the config.json file.')
    .argv as any;

const filePath = argv.file == null || argv.file == "" ? path.resolve(path.resolve('.'), "config.json") : argv.file;

let data, config;

try {
    data = fs.readFileSync(filePath, { encoding: 'utf8', flag: 'r' });
} catch (err) {
    throw `Error while loading file, ${err}`;
}

try {
    config = JSON.parse(data);
} catch (err) {
    throw `Error while parsing file, ${err}`;
}

const server = new Server(config.server);

new ServerPainel(server, config.painel);