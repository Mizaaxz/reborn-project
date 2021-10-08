import { PacketType } from "./PacketType";
import Client from "../moomoo/Client";
import { Packet } from "./Packet";
import { PacketFactory } from "./PacketFactory";
import Game, { getGame } from "../moomoo/Game";

class PacketHandler {
  constructor(public type: PacketType) {}

  fire(client: Client, packet: Packet, callback: PacketHandlerCallback) {
    let g = getGame();
    if (g) callback(g, PacketFactory.getInstance(), client, packet);
  }
}

type PacketHandlerCallback = (
  game: Game,
  packetFactory: PacketFactory,
  client: Client,
  packet: Packet
) => void;

export { PacketHandler, PacketHandlerCallback };
