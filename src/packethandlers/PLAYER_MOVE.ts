import { getGame } from "../moomoo/Game";
import { PacketHandler } from "../packet/PacketHandler";
import { PacketType } from "../packet/PacketType";

getGame()?.addPacketHandler(
  new PacketHandler(PacketType.PLAYER_MOVE),
  (game, packetFactory, client, packet) => {
    if (packet.data[0] === null) {
      if (client.player) client.player.stopMove();
    } else {
      if (client.player) client.player.move(packet.data[0]);
    }
  }
);
