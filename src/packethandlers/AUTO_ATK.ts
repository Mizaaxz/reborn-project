import { getGame } from "../moomoo/Game";
import { PacketHandler } from "../packet/PacketHandler";
import { PacketType } from "../packet/PacketType";

getGame()?.addPacketHandler(
  new PacketHandler(PacketType.AUTO_ATK),
  (game, packetFactory, client, packet) => {
    if (client.player && packet.data[0] == 1)
      client.player.autoAttackOn = !client.player.autoAttackOn;
  }
);
