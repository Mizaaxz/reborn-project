import url from "url";
import http from "http";
import express from "express";
import nunjucks from "nunjucks";
import SHA256 from "fast-sha256";
import arrayBufferToHex from "array-buffer-to-hex";
import bodyParser from "body-parser";

import * as config from "./config.json";
import * as console from "./console";
import { Server as WSServer } from "ws";
import UptimeWSServer from "./uptimeWS";
import { startServer } from "./moomoo/moomoo";
import { getGame } from "./moomoo/Game";
import { TextEncoder } from "util";
import errCodes from "./definitions/errorCodes";
import db from "./database";

let accessories = require("./definitions/accessories.json");
import hats from "./definitions/hats";
let items = require("./definitions/items.json");
let projectiles = require("./definitions/projectiles.json");
let weapons = require("./definitions/weapons");
accessories = Object.values(accessories);
const hats2 = Object.values(hats);
items = Object.values(items);
projectiles = Object.values(projectiles);
weapons = Object.values(weapons);

const app = express();
const server = http.createServer(app);
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

nunjucks.configure("views", {
  autoescape: true,
  express: app,
});

const VERSION = "1.8.4a";

function format(timestamp: number) {
  var hours = Math.floor(timestamp / (60 * 60));
  var minutes = Math.floor((timestamp % (60 * 60)) / 60);
  var seconds = Math.floor(timestamp % 60);

  return (
    hours.toString().padStart(2, "0") +
    ":" +
    minutes.toString().padStart(2, "0") +
    ":" +
    seconds.toString().padStart(2, "0")
  );
}

app.use((req, res, next) => {
  if (req.headers.origin) res.setHeader("Access-Control-Allow-Origin", req.headers.origin);
  next();
});

app.get("/sanctuary", (req, res) => {
  if (req.accepts("html")) {
    res.render("version.html", {
      version: VERSION,
      nodeVersion: process.version,
      uptime: format(process.uptime()),
    });
    return;
  }

  res.send("Sanctuary v${VERSION}");
});

app.get("/status", (req, res) => {
  res.json({ uptime: format(process.uptime()), ver: VERSION, node: process.version });
});

app.get("/", (req, res) => {
  res.redirect(`${req.protocol}://moomoo.io`);
});

app.get("/api/v1/def", (req, res) => {
  res.json({ accessories, hats: hats2, items, projectiles, weapons });
});

app.post("/api/v1/login", (req, res) => {
  let username = req.body.username;
  if (!username) return res.json({ error: "NO_USERNAME", text: errCodes.login.NO_USERNAME });
  let password = req.body.password;
  if (!password) return res.json({ error: "NO_PASSWORD", text: errCodes.login.NO_PASSWORD });

  let account = db.get(`account_${username}`);
  if (!account)
    return res.json({ error: "INVALID_USERNAME", text: errCodes.login.INVALID_USERNAME });

  res.json(account);
});
app.post("/api/v1/create", (req, res) => {
  let username = req.body.username;
  if (!username) return res.json({ error: "NO_USERNAME", text: errCodes.create.NO_USERNAME });
  let password = req.body.password;
  if (!password) return res.json({ error: "NO_PASSWORD", text: errCodes.create.NO_PASSWORD });

  let exists = db.get(`account_${username}`);
  if (exists) return res.json({ error: "USERNAME_FOUND", text: errCodes.create.USERNAME_FOUND });

  let notAllowed: any[] = [];
  username.split("").forEach((a: any) => {
    if (!config.allowedUsername.includes(a)) notAllowed.push(a);
  });
  if (notAllowed.length)
    return res.json({
      error: "INVALID_USERNAME",
      text: errCodes.create.INVALID_USERNAME,
      notAllowed,
    });

  if (username.length > config.usernameLength.max)
    return res.json({ error: "USERNAME_TOO_LONG", text: errCodes.create.USERNAME_TOO_LONG });
  if (username.length < config.usernameLength.min)
    return res.json({ error: "USERNAME_TOO_SHORT", text: errCodes.create.USERNAME_TOO_SHORT });

  if (password.length > config.passwordLength.max)
    return res.json({ error: "PASSWORD_TOO_LONG", text: errCodes.create.PASSWORD_TOO_LONG });
  if (password.length < config.passwordLength.min)
    return res.json({ error: "PASSWORD_TOO_SHORT", text: errCodes.create.PASSWORD_TOO_SHORT });

  res.json({ error: "", text: "Account created!" });
});

app.get("/api/v1/playerCount", (req, res) => {
  let game = getGame();

  if (!game) {
    res.send(JSON.stringify({ type: "error", message: "No game active." }));
  } else {
    res.send(JSON.stringify({ type: "success", playerCount: game.clients.length }));
  }
});

app.get("/api/v1/players", (req, res) => {
  let game = getGame();

  if (!game) {
    res.send(JSON.stringify({ type: "error", message: "No game active." }));
  } else {
    let clients: { clientIPHash: string; playerName: string; playerID: number }[] = [];

    for (let client of game.clients) {
      clients.push({
        clientIPHash: arrayBufferToHex(SHA256(new TextEncoder().encode(client.ip))),
        playerName: client.player?.name || "unknown",
        playerID: client.player?.id || -1,
      });
    }

    res.send(JSON.stringify({ type: "success", clients: clients }));
  }
});

let wss = new WSServer({ noServer: true });
startServer(wss);

let uptimeServer = new WSServer({ noServer: true });

new UptimeWSServer(uptimeServer);

server.on("upgrade", function upgrade(request, socket, head) {
  const pathname = url.parse(request.url).pathname?.replace(/\/$/, "");

  if (pathname === "/uptimeWS") {
    uptimeServer.handleUpgrade(request, socket, head, function done(ws) {
      uptimeServer.emit("connection", ws, request);
    });
  } else if (pathname === "/moomoo") {
    wss.handleUpgrade(request, socket, head, function done(ws) {
      wss.emit("connection", ws, request);
    });
  } else {
    socket.destroy();
  }
});

console.startConsole();

server.listen(config.port, () =>
  console.log(`Sanctuary listening at https://localhost:${config.port}`)
);
