import { getGame } from "../game/Game";
import { Broadcast } from "../moomoo/util";
import { Packet } from "../packet/Packet";
import { PacketHandler } from "../packet/PacketHandler";
import { PacketType } from "../packet/PacketType";

getGame()?.addPacketHandler(
  new PacketHandler(PacketType.CLAN_REQ_JOIN),
  (game, packetFactory, client, packet) => {
    if (!client.player || client.player.dead) Broadcast("Error: JOIN_TRIBE_WHILE_DEAD", client);

    if (client.player && client.player.clanName === null) {
      let tribe = game.state.tribes.find((tribe) => tribe.name === packet.data[0]);
      let ownerClient = game.state.players.find((player) => player.id === tribe?.ownerSID)?.client;

      if (tribe && !ownerClient?.tribeJoinQueue.includes(client.player)) {
        ownerClient?.tribeJoinQueue.push(client.player);
        ownerClient?.socket.send(
          packetFactory.serializePacket(
            new Packet(PacketType.JOIN_REQUEST, [client.player.id, client.player.name])
          )
        );
      }
    } else {
      Broadcast("Error: ALREADY_IN_TRIBE", client);
    }
  }
);
