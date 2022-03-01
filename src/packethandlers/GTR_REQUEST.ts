import { getGame } from "../game/Game";
import { PacketHandler } from "../packet/PacketHandler";
import { PacketType } from "../packet/PacketType";
import { getGTribeByOwner, joinGTribe, setGTribe } from "../sanctuary/GTribe";
import { getAccount } from "../sanctuary/Account";
import { Packet } from "../packet/Packet";

getGame()?.addPacketHandler(
  new PacketHandler(PacketType.GTR_REQUEST),
  (game, packetFactory, client, packet) => {
    if (!client.account || !client.loggedIn) return;

    let gtr = getGTribeByOwner(client.account.username);
    if (gtr) {
      let member = String(packet.data[0] || "");
      let memberAccount = getAccount(member);
      if (
        !memberAccount ||
        !gtr.queue.includes(memberAccount.username) ||
        memberAccount.gTribe
      )
        return;
      let accepted = !!packet.data[1];

      if (accepted) joinGTribe(gtr, memberAccount);
      else {
        gtr.queue.splice(gtr.queue.indexOf(memberAccount.username), 1);
        setGTribe(gtr.id, gtr);
      }

      client.socket.send(
        packetFactory.serializePacket(
          new Packet(PacketType.GTRIBE_FAIL, [
            `$SUCCESS-+${gtr.id}::Clan application ${
              accepted ? "accepted" : "denied"
            }.`,
          ])
        )
      );
    }
  }
);
