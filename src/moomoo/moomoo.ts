import { Server as WSServer, default as WebSocket } from "ws";
import Game from "../game/Game";
import { IncomingMessage } from "http";
import db from "enhanced.db";
import msgpack from "msgpack-lite";
import { existsSync } from "fs";

/**
 * Gets a unique (if game is passed) id for a MooMoo.io client
 * @param game A game containing client IDs to skip
 */
function getID(game: Game | null = null) {
  const alphabet = "abcdefghijklmnopqrstuvwxyz1234567890=-+_$%?/";

  function randString() {
    return new Array(10)
      .fill(0)
      .reduce((acc, _item) => acc + alphabet[Math.floor(Math.random() * alphabet.length)], "");
  }

  let id = randString();

  if (game) {
    while (game.clients.some((client) => client.id == id)) {
      id = randString();
    }
  }

  return id;
}

/**
 * Starts a MooMoo.io/Sanctuary server on an existing ws.Server
 * @param server the ws.Server to use
 */
export function startServer(server: WSServer) {
  let game = new Game();

  server.addListener("connection", (socket: WebSocket, req: IncomingMessage) => {
    let ip = "";

    if (existsSync(__dirname + "/../../PROXIED") && req.headers["x-forwarded-for"]) {
      // not sure
      ip = (req.headers["x-forwarded-for"] as string).split(/\s*,\s*/)[0];
      console.log("proxying connection");
    } else if (req.socket.remoteAddress) {
      ip = req.socket.remoteAddress;
    }
    console.log(ip);

    let bannedIPs = (db.get("bannedIPs") as any[]) || [];
    if (bannedIPs.includes(ip)) {
      socket.send(msgpack.encode(["d", ["Banned."]]));
      socket.terminate();
      return;
    }

    game.addClient(getID(game), socket, ip);
  });
}
