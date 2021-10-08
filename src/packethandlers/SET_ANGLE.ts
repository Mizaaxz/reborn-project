import { getGame } from "../game/Game";
import { PacketHandler } from "../packet/PacketHandler";
import { PacketType } from "../packet/PacketType";

getGame()?.addPacketHandler(
  new PacketHandler(PacketType.SET_ANGLE),
  (game, packetFactory, client, packet) => {
    if (client.player) client.player.angle = packet.data[0];
  }
);
