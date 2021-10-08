import { getGame } from "../moomoo/Game";
import { PacketHandler } from "../packet/PacketHandler";
import { PacketType } from "../packet/PacketType";

getGame()?.addPacketHandler(
  new PacketHandler(PacketType.SPAWN),
  (game, packetFactory, client, packet) => {}
);
