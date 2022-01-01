import { getGame } from "../game/Game";
import { PacketHandler } from "../packet/PacketHandler";
import { PacketType } from "../packet/PacketType";
import db from "enhanced.db";
import { Packet } from "../packet/Packet";
import {
  getGTribe,
  getGTribeByOwner,
  GTribe,
  setGTribe,
} from "../moomoo/GTribe";
import config from "../config";
import { setAccount } from "../moomoo/Account";

getGame()?.addPacketHandler(
  new PacketHandler(PacketType.GTRIBE_CREATE),
  (game, packetFactory, client, packet) => {
    if (!client.account || !client.loggedIn) return;

    let clanTag = ((packet.data[0] as string) || "").toUpperCase().trim();
    let clanName = ((packet.data[1] as string) || "").trim();

    function fail(msg: string) {
      client.socket.send(
        packetFactory.serializePacket(new Packet(PacketType.GTRIBE_FAIL, [msg]))
      );
    }

    let gTribe = getGTribe(clanTag);
    if (gTribe) return fail("That clan already exists! Try a different tag.");

    let alreadyOwned = getGTribeByOwner(client.account.username);
    if (alreadyOwned) return fail("You already own a clan!");

    if (clanTag.length < config.gTribeTagLength.min)
      return fail("Clan tag too short.");
    if (clanTag.length > config.gTribeTagLength.max)
      return fail("Clan tag too long.");
    if (clanName.length < config.gTribeNameLength.min)
      return fail("Clan name too short.");
    if (clanName.length > config.gTribeNameLength.max)
      return fail("Clan name too long.");

    let newGTribe: GTribe = {
      id: clanTag,
      name: clanName,
      leader: client.account.username,
      members: [],
      description: "",
      discord: "",
    };
    setGTribe(clanTag, newGTribe);

    client.account.gTribe = clanTag;
    setAccount(client.account.username, client.account);

    fail("$SUCCESSClan created!");
  }
);
