import { getGame } from "../game/Game";
import { PacketHandler } from "../packet/PacketHandler";
import { PacketType } from "../packet/PacketType";
import db from "enhanced.db";
import { Packet } from "../packet/Packet";
import {
  delGTribe,
  getGTribe,
  getGTribeByMember,
  getGTribeByOwner,
  GTribe,
  leaveGTribe,
  setGTribe,
} from "../moomoo/GTribe";
import config from "../config";
import { setAccount } from "../moomoo/Account";

getGame()?.addPacketHandler(
  new PacketHandler(PacketType.GTRIBE_DELETE),
  (game, packetFactory, client, packet) => {
    if (!client.account || !client.loggedIn || !packet.data[0]) return;

    let gtr = getGTribeByOwner(client.account.username);
    if (gtr) {
      delGTribe(gtr);
      client.socket.send(
        packetFactory.serializePacket(
          new Packet(PacketType.GTRIBE_FAIL, ["$SUCCESSClan Deleted."])
        )
      );
    } else {
      gtr = getGTribeByMember(client.account.username);
      if (gtr) {
        leaveGTribe(gtr, client.account);
        client.socket.send(
          packetFactory.serializePacket(
            new Packet(PacketType.GTRIBE_FAIL, ["$SUCCESSClan Left."])
          )
        );
      } else {
        gtr = getGTribe(String(packet.data[0]));
        if (gtr && !gtr.queue.includes(client.account.username)) {
          gtr.queue.push(client.account.username);
          setGTribe(gtr.id, gtr);
          client.socket.send(
            packetFactory.serializePacket(
              new Packet(PacketType.GTRIBE_FAIL, [
                "$SUCCESS-Successfully requested to join clan!",
              ])
            )
          );
        }
      }
    }
  }
);
