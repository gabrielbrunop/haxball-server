"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadConfig = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
function validate(object) {
    if (!object.server)
        return false;
    if (!object.painel)
        return false;
    return true;
}
function loadConfig(file) {
    return new Promise((resolve, reject) => {
        const filePath = file == null || file == "" ? path_1.default.resolve(path_1.default.resolve('.'), "config.json") : file;
        fs_1.default.readFile(filePath, { encoding: "utf-8", flag: "r" }, (err, data) => {
            if (err)
                reject({
                    message: `Error while loading config file`,
                    error: err
                });
            try {
                const json = JSON.parse(data);
                if (!validate(json))
                    reject({
                        message: `Invalid configuration`,
                        error: null
                    });
                resolve(JSON.parse(data));
            }
            catch (err) {
                reject({
                    message: `Error while parsing config file`,
                    error: err
                });
            }
        });
    });
}
exports.loadConfig = loadConfig;
//# sourceMappingURL=loadConfig.js.map