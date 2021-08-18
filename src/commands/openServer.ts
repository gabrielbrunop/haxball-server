import { Server } from "../Server";
import { ControlPanel } from "../ControlPanel";

import { loadConfig } from "../utils/loadConfig";

export function openServer(file?: string) {
    loadConfig(file).then(config => {
        const server = new Server(config.server);
        new ControlPanel(server, config.panel, file);
    }).catch(err => {
        console.error(err.error ? err.message + ", " + err.error : err.message);
        process.exit();
    });
}