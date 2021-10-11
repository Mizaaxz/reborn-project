import config from "../config";
import { getGame } from "../game/Game";
import { Broadcast } from "../moomoo/util";
import { Packet } from "../packet/Packet";
import { PacketHandler } from "../packet/PacketHandler";
import { PacketType } from "../packet/PacketType";
import * as logger from "../log";
import * as consoleTS from "../console";

getGame()?.addPacketHandler(
  new PacketHandler(PacketType.CHAT),
  (game, packetFactory, client, packet) => {
    if (!client.player || client.player.dead) Broadcast("Error: CHATTING_WHILE_DEAD", client);

    if (packet.data[0].startsWith("/") && client.admin)
      return consoleTS.runCommand(packet.data[0].substring(1), client.player || undefined);

    packet.data[0] = String([...packet.data[0]].slice(0, 50).join("").trim());
    if (!packet.data[0]) return;

    logger.log(
      `Chat message by "${client.player?.name}" (ID: ${client.player?.id}): ${packet.data[0]}`
    );

    if (
      ["!crash", "lcrash", "icrash", ".crash", "!cr", ".cr"].includes(packet.data[0].toLowerCase())
    )
      return game.kickClient(client, 'crashed <span style="font-size: 16px;">xd</span>');

    if (packet.data[0].toLowerCase() == "kill me") return client.player?.die();

    for (let badWord of config.badWords) {
      if (packet.data[0].includes(badWord))
        packet.data[0] = packet.data[0].replace(
          new RegExp(`\\b${badWord.replace(/[.*+?^${}()|[\]\\]/gi, "\\$&")}\\b`, "g"),
          "M" + "o".repeat(badWord.length - 1)
        );
    }

    let chatPacket = packetFactory.serializePacket(
      new Packet(PacketType.CHAT, [client.player?.id, packet.data[0]])
    );

    client.socket?.send(chatPacket);

    if (client.player) {
      for (let player of client.player.getNearbyPlayers(game.state)) {
        player.client?.socket.send(chatPacket);
      }
    }
  }
);
