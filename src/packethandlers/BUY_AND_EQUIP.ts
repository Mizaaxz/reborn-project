import { getGame } from "../game/Game";
import { GameModes } from "../game/GameMode";
import { WeaponModes } from "../items/items";
import { getAccessory } from "../moomoo/Accessories";
import { getHat } from "../moomoo/Hats";
import { Broadcast } from "../moomoo/util";
import { Packet } from "../packet/Packet";
import { PacketHandler } from "../packet/PacketHandler";
import { PacketType } from "../packet/PacketType";

getGame()?.addPacketHandler(
  new PacketHandler(PacketType.BUY_AND_EQUIP),
  (game, packetFactory, client, packet) => {
    if (!client.player || client.player.dead)
      Broadcast("Error: EQUIP_WHEN_DEAD", client);
    if (
      client.player?.weaponMode == WeaponModes.NoSelect ||
      getGame()?.mode.includes(GameModes.random)
    )
      return;

    let isAcc = packet.data[2];

    if (isAcc) {
      if (!getAccessory(packet.data[1]) && packet.data[1] !== 0) {
        game.kickClient(client, "disconnected");
        return;
      }

      if (client.player) {
        if (packet.data[0]) {
          if (client.ownedAccs.includes(packet.data[1])) {
            Broadcast("Error: ALREADY_BOUGHT", client);
          } else {
            if (
              client.player.points >= (getAccessory(packet.data[1])?.price || 0)
            ) {
              client.player.points -= getAccessory(packet.data[1])?.price || 0;
              client.ownedAccs.push(packet.data[1]);
              client.socket.send(
                packetFactory.serializePacket(
                  new Packet(PacketType.UPDATE_STORE, [
                    0,
                    packet.data[1],
                    isAcc,
                  ])
                )
              );
            }
          }
        } else {
          if (
            client.ownedAccs.includes(packet.data[1]) ||
            getAccessory(packet.data[1])?.price === 0 ||
            packet.data[1] === 0
          ) {
            if (client.player.accID === packet.data[1]) {
              client.player.accID = 0;

              client.socket.send(
                packetFactory.serializePacket(
                  new Packet(PacketType.UPDATE_STORE, [1, 0, isAcc])
                )
              );
            } else {
              client.player.accID = packet.data[1];

              client.socket.send(
                packetFactory.serializePacket(
                  new Packet(PacketType.UPDATE_STORE, [
                    1,
                    packet.data[1],
                    isAcc,
                  ])
                )
              );
            }
          } else {
            game.kickClient(client, "disconnected");
          }
        }
      }
    } else {
      if (
        (!getHat(packet.data[1]) || getHat(packet.data[1])?.dontSell) &&
        packet.data[1] !== 0
      ) {
        game.kickClient(client, "disconnected");
        return;
      }

      if (client.player) {
        if (packet.data[0]) {
          if (client.ownedHats.includes(packet.data[1])) {
            Broadcast("Error: ALREADY_BOUGHT", client);
          } else {
            if (client.player.points >= (getHat(packet.data[1])?.price || 0)) {
              client.player.points -= getHat(packet.data[1])?.price || 0;
              client.ownedHats.push(packet.data[1]);
              client.socket.send(
                packetFactory.serializePacket(
                  new Packet(PacketType.UPDATE_STORE, [
                    0,
                    packet.data[1],
                    isAcc,
                  ])
                )
              );
            }
          }
        } else {
          if (
            client.ownedHats.includes(packet.data[1]) ||
            getHat(packet.data[1])?.price === 0 ||
            packet.data[1] === 0
          ) {
            if (getHat(client.player.hatID)?.keepOn) return;
            if (getHat(client.player.hatID)?.invisTimer) {
              client.player.invisible = client.player.hideLeaderboard = false;
              game.sendLeaderboardUpdates();
            }
            if (client.player.hatID === packet.data[1]) {
              client.player.hatID = 0;

              client.socket.send(
                packetFactory.serializePacket(
                  new Packet(PacketType.UPDATE_STORE, [1, 0, isAcc])
                )
              );
            } else {
              client.player.hatID = packet.data[1];

              client.socket.send(
                packetFactory.serializePacket(
                  new Packet(PacketType.UPDATE_STORE, [
                    1,
                    packet.data[1],
                    isAcc,
                  ])
                )
              );
            }
          } else {
            game.kickClient(client, "disconnected");
          }
        }
      }
    }
  }
);
