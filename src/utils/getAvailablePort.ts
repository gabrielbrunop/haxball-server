import * as PortScanner from "portscanner";

export async function getAvailablePort(startingPort: number) {
    let port = startingPort;

    while(true) {
        const taken = await PortScanner.checkPortStatus(port);

        if (taken === "closed") break;

        port++;
    }

    return port;
}