import { GameModes } from "../game/GameMode";
import { getGame } from "../game/Game";
import { Broadcast } from "../sanctuary/util";
import { Packet } from "../packet/Packet";
import { PacketHandler } from "../packet/PacketHandler";
import { PacketType } from "../packet/PacketType";
import { getGTribe } from "../sanctuary/GTribe";

getGame()?.addPacketHandler(
  new PacketHandler(PacketType.CLAN_CREATE),
  (game, packetFactory, client, packet) => {
    if (!client.player || client.player.dead) return;
    if (game.mode.includes(GameModes.royale)) return;

    if (client.player) {
      let tribeName = [...packet.data[0]].slice(0, 10).join("").trim();
      if (!tribeName) return;

      if (client.player.nextTribeCreate > Date.now()) return;
      client.player.nextTribeCreate = Date.now() + 3000;

      if (
        game.state.tribes.find(
          (t) => t.name.toLowerCase() == tribeName.toLowerCase()
        ) ||
        getGTribe(tribeName.toUpperCase())
      )
        return;

      let tribe = game.state.addTribe(tribeName, client.player.id);

      if (tribe) {
        client.player.tribe = tribe;
        client.socket?.send(
          packetFactory.serializePacket(
            new Packet(PacketType.PLAYER_SET_CLAN, [tribe.name, true])
          )
        );

        game.state.updateClanPlayers(tribe);
      }
    }
  }
);
