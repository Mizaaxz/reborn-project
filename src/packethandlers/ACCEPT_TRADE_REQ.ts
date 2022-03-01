import { getGame } from "../game/Game";
import { Broadcast } from "../sanctuary/util";
import { Packet } from "../packet/Packet";
import { PacketHandler } from "../packet/PacketHandler";
import { PacketType } from "../packet/PacketType";

getGame()?.addPacketHandler(
  new PacketHandler(PacketType.ACCEPT_TRADE_REQ),
  (game, packetFactory, client, packet) => {
    if (!client.player || client.player.dead) Broadcast("Error: TRADE_WHILE_DEAD", client);

    if (client.player) {
      let fromUser = game.state.players.find((p) => p.id == packet.data[0]);
      if (fromUser) {
        if (!client.tradeRequests.includes(fromUser.id))
          return Broadcast("Error: NOT_REQUESTED", client);
        client.tradeRequests.splice(client.tradeRequests.indexOf(fromUser.id), 1);
        client.socket.send(
          packetFactory.serializePacket(
            new Packet(PacketType.SEND_TRADE_REQ, [client.player.id, client.player.name, 1])
          )
        );
      }
    }
  }
);
