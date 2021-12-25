import { getGame } from "../game/Game";
import { Packet } from "../packet/Packet";
import { PacketHandler } from "../packet/PacketHandler";
import { PacketType } from "../packet/PacketType";

getGame()?.addPacketHandler(
  new PacketHandler(PacketType.CLAN_NOTIFY_SERVER),
  (game, packetFactory, client, packet) => {
    if (client.player && client.player.tribe) {
      if (Date.now() - client.player.lastPing > 2200) {
        client.player.tribe.allMembers.forEach((m) =>
          m.client?.socket.send(
            packetFactory.serializePacket(
              new Packet(PacketType.CLAN_NOTIFY_CLIENT, [
                client.player?.location.x || 0,
                client.player?.location.y || 0,
              ])
            )
          )
        );
        client.player.lastPing = Date.now();
      }
    }
  }
);
