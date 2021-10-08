import { getGame } from "../game/Game";
import { PacketHandler } from "../packet/PacketHandler";
import { PacketType } from "../packet/PacketType";

getGame()?.addPacketHandler(
  new PacketHandler(PacketType.SPAWN),
  (game, packetFactory, client, packet) => {}
);
