import { getGame } from "../game/Game";
import { Broadcast } from "../moomoo/util";
import { PacketHandler } from "../packet/PacketHandler";
import { PacketType } from "../packet/PacketType";

getGame()?.addPacketHandler(
  new PacketHandler(PacketType.CLAN_ACC_JOIN),
  (game, packetFactory, client, packet) => {
    if (!client.player || client.player.dead)
      Broadcast("Error: ADD_MEMBER_WHILE_DEAD", client);

    if (client.tribeJoinQueue.length && client.player && packet.data[1]) {
      let tribe = client.player.tribe;
      let player = client.tribeJoinQueue[0];

      if (tribe && !player.tribe) {
        player.tribe = tribe;
        tribe.addPlayer(player);
        // for pit traps to appear
        game.sendGameObjects(player);
      }
    }

    client.tribeJoinQueue.splice(0, 1);
  }
);
