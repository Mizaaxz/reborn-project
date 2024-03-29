import { getGame } from "../game/Game";
import { PacketHandler } from "../packet/PacketHandler";
import { PacketType } from "../packet/PacketType";
import bcrypt from "bcrypt";
import { Account, getAccount, setAccount } from "../sanctuary/Account";
import db from "enhanced.db";
import config from "../config";

getGame()?.addPacketHandler(
  new PacketHandler(PacketType.AUTH),
  (game, packetFactory, client, packet) => {
    /*
      im not kicking because this is to stop brute force and lagging the server
      and if they knew that it would just ignore all but the first auth attempt
      it would make bruteforce and lagging the server easier
    */
    if (client.triedAuth || !packet.data[0]) return;
    if (typeof packet.data[0].name !== "string" || typeof packet.data[0].password !== "string")
      return game.kickClient(client, "disconnected");
    client.triedAuth = true;
    let account = getAccount(packet.data[0].name);
    if (!account) return;
    bcrypt.compare(packet.data[0].password, account.password || "", (_: any, match: any) => {
      if (match === true && account) {
        if (
          game.clients.filter((c) => c.loggedIn && c.accountName == account?.username).length >=
          config.maxSessions
        )
          return game.kickClient(client, "Only 2 sessions per account!");

        client.accountName = account.username || "";
        client.account = account;
        client.loggedIn = true;
        if (typeof account.admin == "boolean") {
          account.adminLevel = 0;
          delete account.admin;
          setAccount(packet.data[0].name, account);
          return game.kickClient(client, "Migrated to new admin system. Please reload.");
        }
        if (account.balance === undefined) {
          account.balance = 0;
          setAccount(packet.data[0].name, account);
        }
        if (account.createdAt === undefined) {
          account.createdAt = Date.now();
          setAccount(packet.data[0].name, account);
        }
        if (account.deaths === undefined) {
          account.deaths = 0;
          setAccount(packet.data[0].name, account);
        }
        if (account.kills === undefined) {
          account.kills = 0;
          setAccount(packet.data[0].name, account);
        }
        if (account.playTime === undefined) {
          account.playTime = 0;
          setAccount(packet.data[0].name, account);
        }

        if (account.adminLevel) client.admin = account.adminLevel;
      }
    });
  }
);
