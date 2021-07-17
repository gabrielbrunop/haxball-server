#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const server_1 = require("./server");
const painel_1 = require("./painel");
const yargs_1 = __importDefault(require("yargs"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const argv = yargs_1.default(process.argv.slice(2))
    .usage('Open a Haxball server.\nUsage: $0')
    .string("f")
    .alias('f', 'file')
    .describe('f', 'Load the config.json file.')
    .argv;
const filePath = argv.file == null || argv.file == "" ? path_1.default.resolve(path_1.default.resolve('.'), "config.json") : argv.file;
let data, config;
try {
    data = fs_1.default.readFileSync(filePath, { encoding: 'utf8', flag: 'r' });
}
catch (err) {
    throw `Error while loading file, ${err}`;
}
try {
    config = JSON.parse(data);
}
catch (err) {
    throw `Error while parsing file, ${err}`;
}
const server = new server_1.Server(config.server);
new painel_1.ServerPainel(server, config.painel);
//# sourceMappingURL=main.js.map