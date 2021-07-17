
# Haxball Server

Haxball Server is a small server utility for Haxball.

## Installation

```bash
npm install haxball-server -g
```

## Usage
Create a configuration file:
```json
{
    "server": {
        "proxyEnabled": false,
        "execPath": "your/path/to/chrome.exe"
    },
    "painel": {
        "bots": {
            "test": "path/to/test.js",
            "test2": "path/to/test2.js"
        },
        "discordToken": "a discord bot token",
        "discordPrefix": "!",
        "mastersDiscordId": ["your discord id"]
    }
}
```
Open the server:
```bash
haxballserver -f config.json
```
Use `!help` (or the prefix you assigned) to see the server commands.

## Configuration
### server
#### proxyEnabled: boolean
Whether to use proxies or not. Haxball only allows 2 rooms per IP so if you want to open more than 2 rooms you'll have to create multiple IPs and assign them to a proxy server.
#### proxyServers?: string[]
The proxy IP addresses. This is required if you enable proxies. Example:
```js
"proxyServers": ["127.0.0.1:8000", "127.0.0.1:8001"]
```
#### execPath: string
The path to Chrome (or Chromium) executable file. If you are on Windows this will probably be `C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe`.

On Ubuntu you can install Chromium using:
```bash
sudo apt-get install chromium-browser
```
And `execPath` will be:
```js
"execPath": "/usr/bin/chromium-browser"
```
### painel
#### bots: { [name: string]: string }
The list of bots and the path to their JS file.
#### discordToken: string
The token of your Discord bot.
#### discordPrefix: string
The prefix for the bot commands.
#### mastersDiscordId: string[]
The players allowed to use the bot. Nobody but the users listed here will be able to run commands.
## Server and room data
Haxball Server sends the token to the room as a `window.ServerData.Token` property. You'll have to adapt your room code to read it.
```
const room = HBInit({
	roomName: "My room",
	maxPlayers: 16,
	noPlayer: true,
    token: window["ServerData"].Token
});
```
And if you want to give a name to your room:
```bash
window["RoomData"].name = "My awesome room";
```
## Using proxies
If you are hosting your Haxball server on AWS EC2, you can use the proxy feature (and therefore open more than 2 full functional rooms) by assigning an [Elastic IP](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/MultipleIP.html#StepThreeEIP) to a [secondary IPv4 private address](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/MultipleIP.html#assignIP-existing).

After assigning them, you can enable the new secondary IP using:
```bash
ip addr add xx.xx.xx.xx/20 dev ens5 label ens5:1
```
To add a proxy to the new secondary IP, install Squid:
```bash
sudo apt-get install squid
```
Open the `squid.conf` file:
```bash
sudo nano /etc/squid/squid.conf
```
Search for `http_access deny all` and change it to `http_access allow all`.

Then add these lines to the file:
```
http_port 127.0.0.1:8000 name=8000
http_port 127.0.0.1:8001 name=8001

acl prt8000 myportname 8000 src xx.xx.xx.xx/24
http_access allow prt8000
tcp_outgoing_address xx.xx.xx.xx prt8000

acl prt8001 myportname 8001 src yy.yy.yy.yy/24
http_access allow prt8001
tcp_outgoing_address yy.yy.yy.yy prt8001
```
Where xx.xx.xx.xx is your main private IP and yy.yy.yy.yy is the secondary one. If you want more than 2 proxies (more than 4 rooms), just add new configurations until you're done:
```
http_port 127.0.0.1:8002 name=8002

acl prt8002 myportname 8002 src zz.zz.zz.zz/24
http_access allow prt8002
tcp_outgoing_address zz.zz.zz.zz prt8002
```
And then restart the service:
```bash
sudo systemctl restart squid
```