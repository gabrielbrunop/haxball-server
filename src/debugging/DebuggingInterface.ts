import express from "express";
import http from "http";
import * as WebSocket from "ws";

import { DebuggingClient } from "./DebuggingClient";

import * as Global from "../Global";

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

export class ConnectInterface {
	listen(expressPort: number, wsPort: number, debuggingClient: DebuggingClient) {
		this.openWSServer(wsPort, debuggingClient);

		const url = this.openExpressServer(expressPort);

		return url;
	}

	private openExpressServer(port: number) {
		const app = express();

		const url = `http://localhost:${port}`;

		app.get('/', (req, res) => {
			res.send(html);
		});

		app.listen(port, "localhost", () => {
			console.log(`Listening at ${url}`)
		});

		return url;
	}

	private openWSServer(port: number, client: DebuggingClient) {
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

	private addRoomToList(room: number, ws: any, iteration: number = 0) {
		const url = `http://localhost:${room}`;

		if (iteration >= 3) return;

		http.get(`${url}/json`, (res) => {
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

	private removeRoomFromList(room: number, ws: any) {
		try {
			ws.send(JSON.stringify({
				type: "remove",
				message: {
					port: room
				}
			}));
		} catch (err) {
			console.error(err);
		}
	}
}