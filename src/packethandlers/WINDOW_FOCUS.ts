import { getGame } from "../moomoo/Game";
import { PacketHandler } from "../packet/PacketHandler";
import { PacketType } from "../packet/PacketType";

getGame()?.addPacketHandler(
  new PacketHandler(PacketType.WINDOW_FOCUS),
  (game, packetFactory, client, packet) => {
    if (client.player) client.player.stopMove();
  }
);
