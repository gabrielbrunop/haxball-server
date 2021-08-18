<h1 align="center">Haxball Server</h1>

<h3 align="center">Haxball Server is a feature-rich and stable headless server utility for Haxball.</h3>

<p align="center">
    <a href="https://github.com/gabrielbrop/haxball-server/stargazers"><img alt="GitHub stars" src="https://img.shields.io/github/stars/gabrielbrop/haxball-server"></a>
    <a href="https://github.com/gabrielbrop/haxball-server/network"><img alt="GitHub forks" src="https://img.shields.io/github/forks/gabrielbrop/haxball-server"></a>
    <a href="https://github.com/gabrielbrop/haxball-server/issues"><img alt="GitHub issues" src="https://img.shields.io/github/issues/gabrielbrop/haxball-server"></a>
    <img alt="GitHub code size in bytes" src="https://img.shields.io/github/languages/code-size/gabrielbrop/haxball-server">
    <img alt="npm" src="https://img.shields.io/npm/dw/haxball-server">
</p>

<br />

* Easily close and open rooms
* Manage your rooms using a Discord bot
* Open more than 2 rooms on the same machine using multiple IPs and a proxy server
* Remote access to Dev Tools
* Custom settings
* Resource usage reports
* Keep things simple while doing a lot
## 📀 Installation

```bash
npm install haxball-server -g
```

## 💻 Usage
Create a configuration file:
```json
{
    "server": {
        "execPath": "your/path/to/chrome.exe"
    },
    "panel": {
        "bots": [
            { "name": "example1", "displayName": "Example room 1", "path": "path/to/example1.js" },
            { "name": "example2", "displayName": "Example room 2", "path": "path/to/example2.js" }
        ],
        "discordToken": "a discord bot token",
        "discordPrefix": "!",
        "mastersDiscordId": ["your discord id"]
    }
}
```
Open the server with a simple command:
```bash
haxball-server open -f config.json
```
Using Linux? Lacking an UI?
Connect to the server remotely using (AWS example):
```bash
haxball-server connect --host "ec2-xx-xx-xx-xx.us-east-1.compute.amazonaws.com" --user "ubuntu" --privateKey "path/to/keys.pem"
```
You must open and close rooms directly on Discord using the bot whose token is being used in the config file.
Use `!help` (or the prefix you assigned) to see the server commands.
## 🏡 Remote debugging
Haxball Server allows you to remotely access Chrome Dev Tools for all of your rooms by means of a SSH tunnel. All you have to do is to run a single command.

Once the connection is established you'll be able to access the Dev Tools feature in [http://localhost:9601](http://localhost:9500).
### 🔐 Connect using a password
```bash
haxball-server connect --host "myhost.com" --user "myuser" --password "mypassword"
```
### 🔑 Connect using a private key
```bash
haxball-server connect --host "myhost.com" --user "myuser" --privateKey "path/to/keys.pem"
```
## ⚙️ Configuration
### 💾 server
#### proxyEnabled?: boolean
Whether to use proxies or not. Haxball only allows 2 rooms per IP so if you want to open more than 2 rooms you'll have to create multiple IPs and assign them to a proxy server.
#### proxyServers?: string[]
The proxy IP addresses. This is required if you enable proxies. Example:
```js
"proxyServers": ["127.0.0.1:8000", "127.0.0.1:8001"]
```
#### userDataDir?: string
[Chrome user data dir path](https://chromium.googlesource.com/chromium/src/+/refs/heads/main/docs/user_data_dir.md). Only works if cache is not disabled.
#### disableCache?: boolean
Disable all caching. Rooms will be started in incognito mode. This is highly recommended if you're not using localStorage or IndexedDB (and you shouldn't). 
#### disableRemote?: boolean
Disable remote debugging. The server won't listen for connections.
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
### 🖥️ panel
#### bots: { [name: string]: string } | { name: string, path: string, displayName?: string }[]
The list of bots and the path to their JS file.
##### Example (as an array - recommended):
```js
"bots": [
    { "name": "classic", "displayName": "Classic room", "path": "./bots/classic.js" },
    { "name": "futsal", "displayName": "Futsal room", "path": "./bots/futsal.js" }
]
```
##### Example (as an object, does not support `displayName`):
```js
"bots": {
    "classic": "./bots/classic.js",
    "futsal": "./bots/futsal.js"
}
```
#### discordToken: string
The token of your Discord bot.
#### discordPrefix: string
The prefix for the bot commands.
#### mastersDiscordId: string[]
The players allowed to use the bot. Nobody but the users listed here will be able to run commands.
#### customSettings: CustomSettingsList
See [custom settings](#-custom-settings).
## 🔧 Custom settings
Let's say you want to open 2 rooms. Both are futsal rooms, but one is 3v3 and the other is 4v4. Instead of creating two different bot files, 3v3.js and 4v4.js, you can use the `panel.customSettings` config to pass custom parameters to the bot script.

Not only you can pass custom parameters but you can also customize the `HBInit` options.

For example:
```json
"customSettings": {
    "3v3": {
        "reserved.haxball.roomName": "Futsal 3v3",
        "gameMode": 3
    },
    "4v4": {
        "reserved.haxball.roomName": "Futsal 4v4",
        "gameMode": 4
    }
}
```
Bots loaded with the `3v3` settings will be named `Futsal 3v3`. The same applies to `4v4`. The `gameMode` setting will be available in `window.CustomSettings.gameMode`.

Custom settings also support inheritance and multiple inheritance. Suppose you want to define your room geolocation using custom settings as well as create a private room for your league:
```json
"customSettings": {
    "new-york": {
        "reserved.haxball.geo": {
            "code": "us",
            "lat": 40.730,
            "lon": -73.935
        }
    },
    "competitive": {
    	"reserved.haxball.password": "12345"
    },
    "3v3": {
        "extends": "new-york",
        "reserved.haxball.roomName": "Futsal 3v3",
        "gameMode": 3
    },
    "4v4": {
        "extends": "new-york",
        "reserved.haxball.roomName": "Futsal 4v4",
        "gameMode": 4
    },
    "3v3-league": {
        "extends": ["competitive", "3v3"],
	"reserved.haxball.roomName": "Futsal 3v3 League"
    }
}
```
With this configuration you'd open your public rooms with the `3v3` and `4v4` settings, and when there's a match in your league, you'd open a room with the `3v3-league` setting. All using the same `futsal.js` bot!

For instance, on Discord you would open the `3v3` room like this: `!open futsal thr1.AAAAAGEdKD4xW3bEOZDBBA.ZCzb426KBF4 3v3`

## 🎮 Discord commands
### help
Shows the commands.
### info
Shows open rooms and available bots.
### meminfo
Information about CPU and memory usage.
### open
> Requires two parameters: bot name and token.
> 
> One optional parameter: custom settings.
> 
> Example 1: !open futsal thr1.AAAAAGEbIjtlEn43C3G3Pw.ylh4au9g0SM
> 
> Example 2: !open futsal thr1.AAAAAGEbIjtlEn43C3G3Pw.ylh4au9g0SM 3v3
> 
> Example 3: !open futsal Token obtained: "thr1.AAAAAGEdFfRipxH29kSsLQ.Om6FNTPlneE" 4v4

Opens a room with the given bot.
You can choose between the bots specified in the `panel.bots` config.

The token parameter is a [Haxball headless token](https://www.haxball.com/headlesstoken).

You can learn more about the custom settings parameter [here](#-custom-settings).

Once the room is open you'll be given the ID of the browser process. You may use it to close the room.
### close
> Requires one parameter: PID (process ID).
> 
> Example: !close 5478

Closes the room based on its process ID described above.

You can also close all rooms at once using `close all`.
### reload
Reloads the `panel.bots` and `panel.customSettings` configurations.
### exit
Closes all rooms and stops Haxball Server.
### eval
Executes Javascript code.
### tokenlink
Gets the URL to the [Haxball headless token website](https://www.haxball.com/headlesstoken).
## 📡 Using proxies
If you are hosting your Haxball server on AWS EC2, you can use the proxy feature (and therefore open more than 2 full functional rooms) by assigning an [Elastic IP](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/MultipleIP.html#StepThreeEIP) to a [secondary IPv4 private address](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/MultipleIP.html#assignIP-existing).

Enabling the new secondary IP depends on which service you're using. This will work for Ubuntu 20.04 running on the T4G family (`t4g-small` is the best one). [And according to the official documentation, Amazon Linux will automatically assign it for you](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/MultipleIP.html#StepTwoConfigOS). If you're not using Amazon Linux or Ubuntu 20.04 with the T4G family, you'll have to look it up yourself; however, the steps will likely be similar to the steps below.

After assigning them, you can enable the new secondary IP using (you'll have to repeat this step every time you restart the instance):
```bash
sudo ip addr add xx.xx.xx.xx/20 dev ens5 label ens5:1
```
Where xx.xx.xx.xx is the new secondary IP.

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
Now you'll be able to use the proxy feature by simply enabling the `server.proxyEnabled` config and adding your proxy IPs to `server.proxyServers`.

Example:
```json
"server": {
    "execPath": "/usr/bin/chromium-browser",
    "proxyEnabled": true,
    "proxyServers": ["127.0.0.1:8000", "127.0.0.1:8001"]
}
```
## ⚙️ Full configuration example
A full example in an Ubuntu machine with a `bots` folder with `futsal.js` and `classic.js` files and multiple settings for the futsal bot.

Discord IDs and token are fictional.
```json
{
    "server": {
        "execPath": "/usr/bin/chromium-browser",
        "userDataDir": "./userdatadir"
    },
    "panel": {
        "bots": [
            { "name": "futsal", "displayName": "Futsal room", "path": "./bots/futsal.js" },
            { "name": "classic", "displayName": "Classic room", "path": "./bots/classic.js" }
        ],
		
        "discordToken": "4cDNNDATgTTODgE2xON35IyO.MYCAr_a.UIrBFWioA6Po9HPyrJAyjgvR4AA",
        "discordPrefix": "!",
		
        "mastersDiscordId": ["6833789556844662784", "5748686793348656842"],
		
        "customSettings": {
            "myGeo": {
                "reserved.haxball.geo": {
                    "code": "fr",
                    "lat": 48.8032,
                    "lon": 2.3511
                }
            },
	    "testMode": {
            	"reserved.haxball.public": false
            },
            "3v3": {
                "extends": "myGeo",
                "reserved.haxball.roomName": "Futsal 3v3",
                "gameMode": 3
            },
            "4v4": {
                "extends": "myGeo",
                "reserved.haxball.roomName": "Futsal 4v4",
                "gameMode": 4
            },
            "testMode3v3": {
	    	"extends": ["3v3", "testMode"]
            },
	    "testMode4v4": {
	    	"extends": ["4v4", "testMode"]
            }
        }
    }
}
```