import { GameModes } from "../game/GameMode";
import { getGame } from "../moomoo/Game";
import { Broadcast } from "../moomoo/util";
import { PacketHandler } from "../packet/PacketHandler";
import { PacketType } from "../packet/PacketType";

getGame()?.addPacketHandler(
  new PacketHandler(PacketType.LEAVE_CLAN),
  (game, packetFactory, client, packet) => {
    if (!client.player || client.player.dead) Broadcast("Error: TRIBE_LEAVE_WHILE_DEAD", client);

    if (client.player && !game.mode.includes(GameModes.moofieball)) {
      let tribeIndex = game.state.tribes.findIndex((tribe) =>
        tribe.membersSIDs.includes(client.player?.id as number)
      );
      let tribe = game.state.tribes[tribeIndex];

      if (tribe && tribe.ownerSID == client.player.id) {
        game.state.removeTribe(tribeIndex);
        client.tribeJoinQueue = [];
      } else {
        game.state.leaveClan(client.player, tribeIndex);
      }
    }
  }
);
