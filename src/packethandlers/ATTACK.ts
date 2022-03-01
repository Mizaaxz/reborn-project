import { getGame } from "../game/Game";
import { Broadcast } from "../sanctuary/util";
import { PacketHandler } from "../packet/PacketHandler";
import { PacketType } from "../packet/PacketType";

getGame()?.addPacketHandler(
  new PacketHandler(PacketType.ATTACK),
  (game, packetFactory, client, packet) => {
    if (client.player) {
      if (packet.data[0]) {
        if (Date.now() - client.lastAttackTime < 1000 / game.MAX_CPS) {
          client.lastAttackTime = Date.now();
          return;
        }

        client.lastAttackTime = Date.now();

        game.normalAttack(client.player, packet.data[1]);
      } else {
        client.player.isAttacking = false;
      }
    } else {
      Broadcast("Error: ATTACKING_WHILE_DEAD", client);
    }
  }
);
