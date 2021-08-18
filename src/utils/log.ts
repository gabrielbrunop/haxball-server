import { maxLengthLog } from "../Global";

export function log(prefix: string, message: string) {
    const timestamp = new Date().toLocaleTimeString("pt-BR");

    if (message.length > maxLengthLog) {
        message = message.slice(0, maxLengthLog) + "...";
    }

    console.log(`[${timestamp}] [${prefix}] ${message}`);
}