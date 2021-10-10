import config from "../config";
import { GameModes } from "../game/GameMode";
import { getGroupID, WeaponModes } from "../items/items";
import { ItemType } from "../items/UpgradeItems";
import { getGame } from "../game/Game";
import { PlayerMode } from "../moomoo/PlayerMode";
import { Broadcast, randomPos, SkinColor } from "../moomoo/util";
import { Packet } from "../packet/Packet";
import { PacketHandler } from "../packet/PacketHandler";
import { PacketType } from "../packet/PacketType";
import db from "enhanced.db";
import { AdminLevel } from "../moomoo/Admin";

getGame()?.addPacketHandler(
  new PacketHandler(PacketType.SPAWN),
  (game, packetFactory, client, packet) => {
    if (client.player && !client.player.dead) game.kickClient(client, "disconnected");

    if (
      "name" in packet.data[0] &&
      "moofoll" in packet.data[0] &&
      "skin" in packet.data[0] &&
      "pwd" in packet.data[0]
    ) {
      let player = game.state.players.find((plr) => plr.ownerID === client.id);

      if (!player || (player && player.dead)) {
        let newPlayer = (client.player =
          player || game.state.addPlayer(game.genSID(), client.id, client, game));

        if (newPlayer.client && newPlayer.lastDeath && Date.now() - newPlayer.lastDeath < 4000)
          return game.kickClient(newPlayer.client, "Trying to evade the ad.");

        if (
          packet.data[0].pwd !== game.locked &&
          newPlayer.client &&
          (newPlayer.client.account?.adminLevel || 0) < AdminLevel.Admin
        )
          return game.kickClient(newPlayer.client, "Incorrect password.");

        if (typeof client.spawnPos == "boolean") {
          newPlayer.location = randomPos(game.spawnBounds, game.spawnBounds, game.spikeAdvance);
        } else {
          newPlayer.location = client.spawnPos;
          client.spawnPos = false;

          let placed = game.state.gameObjects.filter(
            (gameObj) => gameObj.data === 20 && gameObj.ownerSID == newPlayer.id
          );
          client.socket.send(
            packetFactory.serializePacket(
              new Packet(PacketType.UPDATE_PLACE_LIMIT, [getGroupID(20), placed.length - 1])
            )
          );

          for (let pad of placed) {
            game.state.removeGameObject(pad);
          }
          game.sendGameObjects(newPlayer);

          for (let otherPlayer of game.clients.map((c) => c.player)) {
            if (otherPlayer) game.sendGameObjects(otherPlayer);
          }
        }

        let filteredName: any[] = [];
        [...packet.data[0].name].forEach((char) => {
          if (config.allowedMax.split("").includes(char)) filteredName.push(char);
        });
        newPlayer.name = newPlayer.client?.account
          ? newPlayer.client.account.username || "unknown"
          : "Guest";
        newPlayer.skinColor = Number(packet.data[0].skin) || SkinColor.Light2;
        newPlayer.dead = false;
        newPlayer.health = 100;

        let bannedNames = (db.get("BANNED_NAMES") as string[]) || [];
        if (bannedNames.includes(newPlayer.name.toLowerCase()) && newPlayer.client)
          return game.banClient(newPlayer.client, "disconnected");

        let amt = packet.data[0].moofoll ? 50 : 0;
        if (newPlayer.client?.account) amt += 50;
        newPlayer.food = amt;
        newPlayer.points = amt;
        newPlayer.stone = amt;
        newPlayer.wood = amt;
        if (game.mode.includes(GameModes.random)) newPlayer.upgradeAge = 100;
        if (game.mode.includes(GameModes.royale)) {
          newPlayer.buildItem = ItemType.Cookie;
          newPlayer.weaponMode = WeaponModes.NoSelect;
          newPlayer.spdMult = 14;
          newPlayer.invincible = true;
          newPlayer.name += " (Spectator)";
          newPlayer.hatID = -1;
          newPlayer.accID = -1;
          newPlayer.mode = PlayerMode.spectator;
          newPlayer.hideLeaderboard = true;
          setInterval(function () {
            Broadcast("Game already started. In spectator mode.", newPlayer.client);
          }, 5000);
        }

        if (
          newPlayer.name.toLowerCase().includes("cum") &&
          newPlayer.name.toLowerCase().includes("alex") &&
          newPlayer.client
        )
          return game.kickClient(newPlayer.client, "disconnected");

        client.socket.send(
          packetFactory.serializePacket(new Packet(PacketType.PLAYER_START, [newPlayer.id]))
        );

        game.sendLeaderboardUpdates();

        client.socket.send(
          packetFactory.serializePacket(
            new Packet(PacketType.PLAYER_ADD, [
              [
                client.id,
                newPlayer.id,
                newPlayer.client && newPlayer.client.admin
                  ? `\u3010${newPlayer.id}\u3011 ${newPlayer.name}`
                  : newPlayer.name,
                newPlayer.location.x,
                newPlayer.location.y,
                0,
                100,
                100,
                35,
                newPlayer.skinColor,
              ],
              true,
            ])
          )
        );

        game.sendPlayerUpdates();
        game.sendGameObjects(newPlayer);
        newPlayer.updateResources();

        for (let client of game.clients) {
          let seenIndex = client.seenPlayers.indexOf(newPlayer.id);

          if (seenIndex > -1) client.seenPlayers.splice(seenIndex, 1);
        }
      }
    } else {
      game.kickClient(client, "disconnected");
    }
  }
);