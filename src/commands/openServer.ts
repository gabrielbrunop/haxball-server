import { Server } from "../Server";
import { ServerPainel } from "../Painel";

import { loadConfig } from "../utils/loadConfig";

export function openServer(file?: string) {
    loadConfig(file).then(config => {
        const server = new Server(config.server);
        new ServerPainel(server, config.painel, file);
    }).catch(err => {
        console.error(err.error ? err.message + ", " + err.error : err.message);
        process.exit();
    });
}