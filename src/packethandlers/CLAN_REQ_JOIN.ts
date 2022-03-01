import { getGame } from "../game/Game";
import { Broadcast } from "../sanctuary/util";
import { Packet } from "../packet/Packet";
import { PacketHandler } from "../packet/PacketHandler";
import { PacketType } from "../packet/PacketType";

getGame()?.addPacketHandler(
  new PacketHandler(PacketType.CLAN_REQ_JOIN),
  (game, packetFactory, client, packet) => {
    if (!client.player || client.player.dead) return;

    if (client.player && !client.player.tribe) {
      let tribe = game.state.tribes.find(
        (tribe) => tribe.name === packet.data[0]
      );

      if (
        tribe &&
        !tribe.owner?.client?.tribeJoinQueue.includes(client.player)
      ) {
        tribe.owner?.client?.tribeJoinQueue.push(client.player);
        tribe.owner?.client?.socket.send(
          packetFactory.serializePacket(
            new Packet(PacketType.JOIN_REQUEST, [
              client.player.id,
              client.player.name,
            ])
          )
        );
      }
    }
  }
);
