import { getGame } from "../game/Game";
import { Broadcast } from "../sanctuary/util";
import { Packet } from "../packet/Packet";
import { PacketHandler } from "../packet/PacketHandler";
import { PacketType } from "../packet/PacketType";

getGame()?.addPacketHandler(
  new PacketHandler(PacketType.TRADE_REQ),
  (game, packetFactory, client, packet) => {
    if (!client.player || client.player.dead) Broadcast("Error: TRADE_WHILE_DEAD", client);

    if (client.player) {
      let toUser = game.state.players.find((p) => p.id == packet.data[0]);
      if (toUser) {
        if (toUser.client?.tradeRequests.includes(client.player.id)) return;
        toUser.client?.tradeRequests.push(client.player.id);
        toUser.client?.socket.send(
          packetFactory.serializePacket(
            new Packet(PacketType.SEND_TRADE_REQ, [client.player.id, client.player.name, 0])
          )
        );
      }
    }
  }
);
