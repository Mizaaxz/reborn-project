import { getGame } from "../game/Game";
import { Broadcast } from "../moomoo/util";
import { PacketHandler } from "../packet/PacketHandler";
import { PacketType } from "../packet/PacketType";

getGame()?.addPacketHandler(
  new PacketHandler(PacketType.CLAN_KICK),
  (game, packetFactory, client, packet) => {
    if (!client.player || client.player.dead)
      Broadcast("Error: KICK_WHILE_DEAD", client);

    let tribe = client.player?.tribe;
    if (client.player && tribe) {
      if (tribe.owner.id !== client.player.id) return;

      let player = tribe.allMembers.find((m) => m.id == packet.data[0]);
      if (player) tribe.removePlayer(player);
    }
  }
);
