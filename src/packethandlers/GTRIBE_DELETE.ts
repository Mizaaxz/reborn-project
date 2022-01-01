import { getGame } from "../game/Game";
import { PacketHandler } from "../packet/PacketHandler";
import { PacketType } from "../packet/PacketType";
import db from "enhanced.db";
import { Packet } from "../packet/Packet";
import {
  delGTribe,
  getGTribe,
  getGTribeByOwner,
  GTribe,
  setGTribe,
} from "../moomoo/GTribe";
import config from "../config";
import { setAccount } from "../moomoo/Account";

getGame()?.addPacketHandler(
  new PacketHandler(PacketType.GTRIBE_DELETE),
  (game, packetFactory, client, packet) => {
    if (!client.account || !client.loggedIn) return;

    let gtr = getGTribeByOwner(client.account.username);
    if (!gtr) return;

    delGTribe(gtr);

    client.socket.send(
      packetFactory.serializePacket(
        new Packet(PacketType.GTRIBE_FAIL, ["$SUCCESSClan Deleted."])
      )
    );
  }
);
