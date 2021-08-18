import fs from "fs";
import path from "path";

import { HaxballServerConfig } from "../Global";

function validate(object: any): object is HaxballServerConfig {
    if (!(object as HaxballServerConfig).server) return false;
    if (!(object as HaxballServerConfig).panel) return false;

    return true;
}

export function loadConfig(file?: string): Promise<HaxballServerConfig> {
    return new Promise((resolve, reject) => {
        const filePath = file == null || file == "" ? path.resolve(path.resolve('.'), "config.json") : file;

        fs.readFile(filePath, { encoding: "utf-8", flag: "r" }, (err, data) => {
            if (err) reject({
                message: `Error while loading config file`,
                error: err
            });

            try {
                const json = JSON.parse(data);

                if (!validate(json)) reject({
                    message: `Invalid configuration`,
                    error: null
                });

                resolve(JSON.parse(data));
            } catch (err) {
                reject({
                    message: `Error while parsing config file`,
                    error: err
                });
            }
        });
    });
}