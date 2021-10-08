import { getGame } from "../game/Game";
import { Packet } from "../packet/Packet";
import { PacketHandler } from "../packet/PacketHandler";
import { PacketType } from "../packet/PacketType";

getGame()?.addPacketHandler(
  new PacketHandler(PacketType.CLAN_NOTIFY_SERVER),
  (game, packetFactory, client, packet) => {
    if (client.player && client.player.clanName) {
      if (Date.now() - client.player.lastPing > 2200) {
        let tribe = game.state.tribes.find((tribe) => tribe.name === client.player?.clanName);

        if (tribe) {
          for (let memberSID of tribe.membersSIDs) {
            game.state.players
              .find((player) => player.id == memberSID)
              ?.client?.socket.send(
                packetFactory.serializePacket(
                  new Packet(PacketType.CLAN_NOTIFY_CLIENT, [
                    client.player.location.x,
                    client.player.location.y,
                  ])
                )
              );
          }

          client.player.lastPing = Date.now();
        }
      }
    }
  }
);
