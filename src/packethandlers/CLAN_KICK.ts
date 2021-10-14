import { getGame } from "../game/Game";
import { Broadcast } from "../moomoo/util";
import { PacketHandler } from "../packet/PacketHandler";
import { PacketType } from "../packet/PacketType";

getGame()?.addPacketHandler(
  new PacketHandler(PacketType.CLAN_KICK),
  (game, packetFactory, client, packet) => {
    if (!client.player || client.player.dead) Broadcast("Error: KICK_WHILE_DEAD", client);

    if (client.player) {
      let tribeIndex = game.state.tribes.findIndex((tribe) => tribe.ownerSID == client.player?.id);
      let tribe = game.state.tribes[tribeIndex];

      if (tribeIndex < 0) Broadcast("Error: NOT_TRIBE_OWNER", client);
      if (!tribe?.membersSIDs.includes(packet.data[0])) Broadcast("Error: NOT_IN_TRIBE", client);

      let player = game.state.players.find((player) => player.id == packet.data[0]);
      if (!player) Broadcast("Error: INVALID_PLAYER", client);

      if (player) game.state.leaveClan(player, tribeIndex);
    }
  }
);
