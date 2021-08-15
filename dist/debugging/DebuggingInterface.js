"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConnectInterface = void 0;
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const WebSocket = __importStar(require("ws"));
const Global = __importStar(require("../Global"));
const html = `
<!doctype html>

<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
</head>

<body>
	<p>Room list</p>
    <script>
		const socket = new WebSocket('ws://localhost:${Global.wsPort}');

		socket.addEventListener('message', (event) => {
			console.log(event.data);

			const e = JSON.parse(event.data);
			const data = e.message;

			if (e.type === "add") {
				const p = document.createElement('p');
				p.className = data.port;
				p.innerHTML = \`<a href="\${data.source}\${data.url}" title="\${data.title}"><div>\${data.title}</div></a>\`;
			
				document.body.appendChild(p);
			}

			if (e.type === "remove") {
				document.getElementsByClassName(data.port)[0].remove();
			}
		});
	</script>
</body>
</html>
`;
class ConnectInterface {
    listen(expressPort, wsPort, debuggingClient) {
        this.openWSServer(wsPort, debuggingClient);
        const url = this.openExpressServer(expressPort);
        return url;
    }
    openExpressServer(port) {
        const app = express_1.default();
        const url = `http://localhost:${port}`;
        app.get('/', (req, res) => {
            res.send(html);
        });
        app.listen(port, "localhost", () => {
            console.log(`Listening web server at ${url}`);
        });
        return url;
    }
    openWSServer(port, client) {
        const wss = new WebSocket.Server({ port });
        wss.on('connection', (ws) => {
            client.on("add", async (server, client) => {
                setTimeout(() => this.addRoomToList(client, ws), 2000);
            });
            client.on("remove", async (server, client) => {
                this.removeRoomFromList(client, ws);
            });
            for (const room of client.rooms) {
                this.addRoomToList(room, ws);
            }
        });
    }
    addRoomToList(room, ws, iteration = 0) {
        const url = `http://localhost:${room}`;
        if (iteration >= 3)
            return;
        http_1.default.get(`${url}/json`, (res) => {
            let body = "";
            res.on("data", (chunk) => body += chunk);
            res.on("end", () => {
                const data = JSON.parse(body)[0];
                ws.send(JSON.stringify({
                    type: "add",
                    message: {
                        port: room,
                        source: url,
                        url: data.devtoolsFrontendUrl,
                        title: data.title
                    }
                }));
            });
        }).on("error", (error) => {
            console.error(error);
            setTimeout(() => this.addRoomToList(room, ws, iteration + 1), 2000);
        });
    }
    removeRoomFromList(room, ws) {
        try {
            ws.send(JSON.stringify({
                type: "remove",
                message: {
                    port: room
                }
            }));
        }
        catch (err) {
            console.error(err);
        }
    }
}
exports.ConnectInterface = ConnectInterface;
//# sourceMappingURL=DebuggingInterface.js.map