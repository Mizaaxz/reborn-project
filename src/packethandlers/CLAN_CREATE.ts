import { GameModes } from "../game/GameMode";
import { getGame } from "../game/Game";
import { Broadcast } from "../moomoo/util";
import { Packet } from "../packet/Packet";
import { PacketHandler } from "../packet/PacketHandler";
import { PacketType } from "../packet/PacketType";

getGame()?.addPacketHandler(
  new PacketHandler(PacketType.CLAN_CREATE),
  (game, packetFactory, client, packet) => {
    if (!client.player || client.player.dead) Broadcast("Error: CREATING_TRIBE_WHEN_DEAD", client);
    if (game.mode.includes(GameModes.royale)) return;

    if (client.player) {
      let tribeName = [...packet.data[0]].slice(0, 10).join("").trim();
      if (!tribeName) return;
      if (tribeName.toLowerCase().includes("cum") && tribeName.toLowerCase().includes("alex"))
        return game.kickClient(client, "disconnected");

      if (client.player.nextTribeCreate > Date.now())
        return game.kickClient(client, "disconnected");
      client.player.nextTribeCreate = Date.now() + 3000;
      let tribe = game.state.addTribe(tribeName, client.player.id);

      if (tribe) {
        client.player.clanName = tribe.name;
        client.player.isClanLeader = true;
        client.socket?.send(
          packetFactory.serializePacket(new Packet(PacketType.PLAYER_SET_CLAN, [tribe.name, true]))
        );

        game.state.updateClanPlayers(tribe);
      }
    }
  }
);
