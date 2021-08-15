import fs from "fs";
import path from "path";

import { Server } from "../Server";
import { ServerPainel } from "../Painel";

export function openServer(file?: string) {
    const filePath = file == null || file == "" ? path.resolve(path.resolve('.'), "config.json") : file;

    let data, config;
    
    try {
        data = fs.readFileSync(filePath, { encoding: 'utf8', flag: 'r' });
    } catch (err) {
        console.error(`Error while loading config file, ${err}`);
        process.exit();
    }
    
    try {
        config = JSON.parse(data);
    } catch (err) {
        console.error(`Error while parsing config file, ${err}`);
        process.exit();
    }
    
    const server = new Server(config.server);
    
    new ServerPainel(server, config.painel);
}