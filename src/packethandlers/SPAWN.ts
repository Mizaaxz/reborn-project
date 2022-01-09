import config from "../config";
import { GameModes } from "../game/GameMode";
import { getGroupID, WeaponModes } from "../items/items";
import { ItemType } from "../items/UpgradeItems";
import { getGame } from "../game/Game";
import { PlayerMode } from "../moomoo/PlayerMode";
import { Broadcast, peerName, randomPos, SkinColor } from "../moomoo/util";
import { Packet } from "../packet/Packet";
import { PacketHandler } from "../packet/PacketHandler";
import { PacketType } from "../packet/PacketType";
import db from "enhanced.db";
import { AdminLevel } from "../moomoo/Admin";
import { Account, getAccount, setAccount } from "../moomoo/Account";

getGame()?.addPacketHandler(
  new PacketHandler(PacketType.SPAWN),
  (game, packetFactory, client, packet) => {
    if (client.player && !client.player.dead)
      game.kickClient(client, "disconnected");

    if (
      "name" in packet.data[0] &&
      "moofoll" in packet.data[0] &&
      "skin" in packet.data[0] &&
      "pwd" in packet.data[0]
    ) {
      let player = game.state.players.find((plr) => plr.ownerID === client.id);

      if (!player || (player && player.dead)) {
        let newPlayer = (client.player =
          player ||
          game.state.addPlayer(game.genSID(), client.id, client, game));

        if (
          newPlayer.client &&
          newPlayer.lastDeath &&
          Date.now() - newPlayer.lastDeath < 4000
        )
          return game.kickClient(newPlayer.client, "Trying to evade the ad.");

        if (
          packet.data[0].pwd !== game.locked &&
          newPlayer.client &&
          (newPlayer.client.account?.adminLevel || 0) < AdminLevel.Admin
        )
          return game.kickClient(newPlayer.client, "Incorrect password.");

        if (typeof client.spawnPos == "boolean") {
          newPlayer.location = randomPos(
            game.spawnBounds,
            game.spawnBounds,
            game.spikeAdvance
          );
        } else {
          newPlayer.location = client.spawnPos;
          client.spawnPos = false;

          let placed = game.state.gameObjects.filter(
            (gameObj) => gameObj.data === 20 && gameObj.ownerSID == newPlayer.id
          );
          client.socket.send(
            packetFactory.serializePacket(
              new Packet(PacketType.UPDATE_PLACE_LIMIT, [
                getGroupID(20),
                placed.length - 1,
              ])
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

        let filteredName: any = [];
        [...packet.data[0].name].forEach((char) => {
          if (config.allowedMax.split("").includes(char))
            filteredName.push(char);
        });
        filteredName = filteredName
          .join("")
          .trim()
          .slice(0, config.usernameLength.max);
        if (newPlayer.client?.account) {
          newPlayer.client.joinedAt = Date.now();

          if (filteredName.toLowerCase() == "guest")
            filteredName = newPlayer.client?.account?.username;

          let plraccount = getAccount(
            newPlayer.client.account.username
          ) as Account;
          plraccount.displayName =
            filteredName || newPlayer.client.account.username;
          newPlayer.client.account = plraccount;
          setAccount(newPlayer.client.account.username, plraccount);

          newPlayer.name =
            newPlayer.client.account.displayName ||
            newPlayer.client.account.username ||
            "unknown";
        } else newPlayer.name = "Guest";
        newPlayer.skinColor = Number(packet.data[0].skin) || SkinColor.Light2;
        newPlayer.dead = false;
        newPlayer.health = 100;

        let bannedNames = ((db.get("BANNED_NAMES") as string[]) || []).map(
          (n) => n.toLowerCase()
        );
        if (
          bannedNames.includes(
            newPlayer.client?.account?.username?.toLowerCase() || "bdafx3"
          ) &&
          newPlayer.client
        )
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
            Broadcast(
              "Game already started. In spectator mode.",
              newPlayer.client
            );
          }, 5000);
        }

        if (
          newPlayer.name.toLowerCase().includes("cum") &&
          newPlayer.name.toLowerCase().includes("alex") &&
          newPlayer.client
        )
          return game.kickClient(newPlayer.client, "disconnected");

        client.socket.send(
          packetFactory.serializePacket(
            new Packet(PacketType.PLAYER_START, [newPlayer.id])
          )
        );

        game.sendLeaderboardUpdates();

        client.socket.send(
          packetFactory.serializePacket(
            new Packet(PacketType.PLAYER_ADD, [
              [
                client.id,
                newPlayer.id,
                peerName(newPlayer, newPlayer),
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

        let trname = newPlayer.client?.account?.gTribe || "";
        if (!newPlayer.lastDeath && !newPlayer.tribe && trname) {
          let tribe =
            game.state.tribes.find(
              (t) => t.name.toLowerCase() == trname.toLowerCase()
            ) || game.state.addTribe(trname, client.player.id);

          if (tribe) {
            if (tribe.owner?.id == newPlayer.id) {
              client.player.tribe = tribe;
              client.socket?.send(
                packetFactory.serializePacket(
                  new Packet(PacketType.PLAYER_SET_CLAN, [tribe.name, true])
                )
              );
              game.state.updateClanPlayers(tribe);
            } else {
              newPlayer.tribe = tribe;
              tribe.addPlayer(newPlayer);
              game.sendGameObjects(newPlayer);
            }
          }
        }
      }
    } else {
      game.kickClient(client, "disconnected");
    }
  }
);
