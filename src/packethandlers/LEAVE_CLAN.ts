import { GameModes } from "../game/GameMode";
import { getGame } from "../game/Game";
import { Broadcast } from "../moomoo/util";
import { PacketHandler } from "../packet/PacketHandler";
import { PacketType } from "../packet/PacketType";

getGame()?.addPacketHandler(
  new PacketHandler(PacketType.LEAVE_CLAN),
  (game, packetFactory, client, packet) => {
    if (!client.player || client.player.dead)
      Broadcast("Error: TRIBE_LEAVE_WHILE_DEAD", client);

    if (client.player && !game.mode.includes(GameModes.moofieball)) {
      if (
        client.player.tribe &&
        client.player.tribe.owner.id == client.player.id
      ) {
        client.player.tribe.delete();
        client.tribeJoinQueue = [];
      } else {
        client.player.tribe?.removePlayer(client.player)
      }
    }
  }
);
