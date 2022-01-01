import url from "url";
import http from "http";
import express from "express";
import bodyParser from "body-parser";
import bcrypt from "bcrypt";
import config from "./config";
import * as console from "./console";
import { Server as WSServer } from "ws";
import { startServer } from "./moomoo/moomoo";
import errCodes from "./definitions/errorCodes";
import db from "enhanced.db";
import b64 from "./base64";
import { GetSessions } from "./moomoo/util";

import accessories from "./definitions/accessories";
import hats from "./definitions/hats";
import items from "./definitions/items";
import projectiles from "./definitions/projectiles";
import weapons from "./definitions/weapons";
import weaponVariants from "./definitions/weaponVariants";
import { Account, getAccount, setAccount } from "./moomoo/Account";
import { initLogs, log } from "./log";
import { Socket } from "net";
import animals from "./definitions/animals";
import { timeFormat } from "./functions";
import { getGTribe } from "./moomoo/GTribe";
const accessories2 = Object.values(accessories);
const hats2 = Object.values(hats);
const items2 = Object.values(items);
const projectiles2 = Object.values(projectiles);
const weapons2 = Object.values(weapons);
const weaponVariants2 = Object.values(weaponVariants);

const app = express();
const server = http.createServer(app);
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  next();
});

app.get("/status", (req, res) => {
  res.json({
    uptime: process.uptime(),
    uptimeF: timeFormat(process.uptime()),
    ver: config.version,
    node: process.version,
  });
});

app.get("/", (req, res) => {
  res.redirect("https://moomooreborn.io");
});

app.get("/api/v1/def", (req, res) => {
  res.json({
    accessories: accessories2,
    animals: animals,
    hats: hats2,
    items: items2,
    projectiles: projectiles2,
    weapons: weapons2,
    weaponVariants: weaponVariants2,
    yt: config.featuredYT,
  });
});
app.get("/api/v1/leaderboard", (req, res) => {
  let allAccounts = db
    .all()
    .filter((e) => e.key.startsWith("account_"))
    .map((a) => a.value) as Account[];
  res.json(
    allAccounts
      .map((acc) => {
        return {
          name: acc.username,
          badges:
            [acc.adminLevel && "shield", acc.mootuber && "yt"].filter(
              (a) => a
            ) || [],
          score: acc.scores?.reduce((a, b) => a + b) || 0,
        };
      })
      .sort((a, b) => (a.score < b.score ? 1 : -1))
      .filter((a) => a.score)
      .slice(0, 10)
  );
});

app.post("/api/v1/login", (req, res) => {
  let username = req.body.username;
  if (!username)
    return res.json({ error: "NO_USERNAME", text: errCodes.login.NO_USERNAME });
  let password = req.body.password;
  if (!password)
    return res.json({ error: "NO_PASSWORD", text: errCodes.login.NO_PASSWORD });

  let account = getAccount(username);
  if (!account)
    return res.json({
      error: "INVALID_USERNAME",
      text: errCodes.login.INVALID_USERNAME,
    });

  bcrypt.compare(
    password,
    account.password || "",
    function (err: any, match: any) {
      if (err)
        return res.json({
          error: "COMPARE_ERROR",
          text: errCodes.login.COMPARE_ERROR,
        });
      if (match === true) {
        res.json({
          ...account,
          ...{ token: b64.btoa(`${username}:${password}`) },
        });
      } else {
        res.json({
          error: "INCORRECT_PASSWORD",
          text: errCodes.login.INCORRECT_PASSWORD,
        });
      }
    }
  );
});
app.post("/api/v1/create", (req, res) => {
  let username = req.body.username;
  if (!username)
    return res.json({
      error: "NO_USERNAME",
      text: errCodes.create.NO_USERNAME,
    });
  let password = req.body.password;
  if (!password)
    return res.json({
      error: "NO_PASSWORD",
      text: errCodes.create.NO_PASSWORD,
    });
  username = username.trim();

  let exists = getAccount(username);
  if (exists)
    return res.json({
      error: "USERNAME_FOUND",
      text: errCodes.create.USERNAME_FOUND,
    });

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
    return res.json({
      error: "USERNAME_TOO_LONG",
      text: errCodes.create.USERNAME_TOO_LONG,
    });
  if (username.length < config.usernameLength.min)
    return res.json({
      error: "USERNAME_TOO_SHORT",
      text: errCodes.create.USERNAME_TOO_SHORT,
    });

  notAllowed = [];
  password.split("").forEach((a: any) => {
    if (!config.allowedPassword.includes(a)) notAllowed.push(a);
  });
  if (notAllowed.length)
    return res.json({
      error: "INVALID_PASSWORD",
      text: errCodes.create.INVALID_PASSWORD,
      notAllowed,
    });

  if (password.length > config.passwordLength.max)
    return res.json({
      error: "PASSWORD_TOO_LONG",
      text: errCodes.create.PASSWORD_TOO_LONG,
    });
  if (password.length < config.passwordLength.min)
    return res.json({
      error: "PASSWORD_TOO_SHORT",
      text: errCodes.create.PASSWORD_TOO_SHORT,
    });

  bcrypt.hash(password, 5, (err: any, hash: any) => {
    if (err)
      return res.json({
        error: "HASH_ERROR",
        text: errCodes.create.HASH_ERROR,
        err,
      });

    setAccount(username, {
      username,
      displayName: username,
      password: hash,
      level: 1,
      adminLevel: 0,
      balance: 0,
      createdAt: Date.now(),
    });

    log(`Account created for '${username}' from ${req.ip}.`);
    res.json({ error: "", text: "Account created!" });
  });
});

app.get("/api/v1/playerCount", (req, res) => {
  let clients = GetSessions();

  if (clients) {
    clients = clients.filter((c) => c.playerID !== -1);
    res.send(JSON.stringify({ type: "success", playerCount: clients.length }));
  } else {
    res.send(JSON.stringify({ type: "error", message: "No game active." }));
  }
});

app.get("/api/v1/players", (req, res) => {
  let clients = GetSessions();

  if (clients) {
    res.send(JSON.stringify({ type: "success", clients: clients }));
  } else {
    res.send(JSON.stringify({ type: "error", message: "No game active." }));
  }
});

app.get("/api/v1/user/:name", (req, res) => {
  let account = getAccount(req.params.name || "");
  if (!account) return res.json({ err: 404 });
  res.json({
    username: account.username,
    displayName: account.displayName || account.username,
    yt: account.mootuber,
    highScore: account.scores?.sort((a, b) => (a < b ? 1 : -1))[0] || 0,
    totalScore: account.scores?.reduce((a, b) => a + b) || 0,
    avgScore: account.scores
      ? Math.floor(
          account.scores.reduce((a, b) => a + b) / account.scores.length
        )
      : 0,
    kills: account.kills || 0,
    deaths: account.deaths || 0,
    playTime: timeFormat(account.playTime || 0),
  });
});
app.get("/api/v1/gtribe/:tag", (req, res) => {
  let gtr = getGTribe(req.params.tag || "");
  if (!gtr) return res.json({ err: 404 });
  res.json({
    tag: gtr.id,
    name: gtr.name,
    desc: gtr.description,
    owner: gtr.leader,
    members: gtr.members,
    disc: gtr.discord,
  });
});

let wss = new WSServer({ noServer: true, maxPayload: 1024, backlog: 5 });
startServer(wss);

server.on("upgrade", function upgrade(request, socket, head) {
  if (!request.url) return;
  const pathname = url.parse(request.url).pathname?.replace(/\/$/, "");

  if (pathname === "/moomoo") {
    wss.handleUpgrade(request, socket as Socket, head, function done(ws) {
      wss.emit("connection", ws, request);
    });
  } else {
    socket.destroy();
  }
});

console.startConsole();
initLogs();

server.listen(config.port, () =>
  console.log(`Sanctuary is online at https://localhost:${config.port}`)
);
