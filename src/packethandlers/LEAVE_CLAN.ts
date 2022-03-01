import { GameModes } from "../game/GameMode";
import { getGame } from "../game/Game";
import { Broadcast } from "../sanctuary/util";
import { PacketHandler } from "../packet/PacketHandler";
import { PacketType } from "../packet/PacketType";

getGame()?.addPacketHandler(
  new PacketHandler(PacketType.LEAVE_CLAN),
  (game, packetFactory, client, packet) => {
    if (!client.player || client.player.dead)
      Broadcast("Error: TRIBE_LEAVE_WHILE_DEAD", client);

    if (client.player && !game.mode.includes(GameModes.moofieball)) {
      client.player.tribe?.removePlayer(client.player);
    }
  }
);
