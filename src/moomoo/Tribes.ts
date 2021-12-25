import Game from "../game/Game";
import { Packet } from "../packet/Packet";
import { PacketFactory } from "../packet/PacketFactory";
import { PacketType } from "../packet/PacketType";
import Player from "./Player";

let tribeID = 0;
export default class Tribe {
  public id: number;
  public members: Player[] = [];

  constructor(public game: Game, public owner: Player, public name: string) {
    this.id = tribeID += 1;
    this.name = name;
    this.owner = owner;
  }

  get allMembers() {
    return [this.owner, ...this.members];
  }
  get allMemberIDs() {
    return this.allMembers.map((m) => m.id);
  }

  addPlayer(player: Player) {
    if (!this.members.includes(player)) this.members.push(player);
    player.tribe = this;
    this.game.state.updateClanPlayers(this);
  }
  removePlayer(player: Player) {
    let packetFactory = PacketFactory.getInstance();
    if (this.members.includes(player))
      this.members.splice(this.members.indexOf(player), 1);
    player.tribe = null;
    player.client?.socket.send(
      packetFactory.serializePacket(
        new Packet(PacketType.PLAYER_SET_CLAN, [null, 0])
      )
    );
    if (this.owner.id == player.id && this.owner.client) {
      this.owner.client.tribeJoinQueue = [];
      if (this.members.length) this.owner = this.members.shift() as Player;
      else this.delete();
    }
    this.game.state.updateClanPlayers(this);
  }

  delete() {
    let packetFactory = PacketFactory.getInstance();

    for (let client of this.game.clients) {
      client.socket?.send(
        packetFactory.serializePacket(
          new Packet(PacketType.CLAN_DEL, [this.name])
        )
      );
    }

    this.allMembers.forEach((m) => {
      m.tribe = null;
      m.client?.socket.send(
        packetFactory.serializePacket(
          new Packet(PacketType.PLAYER_SET_CLAN, [null, 0])
        )
      );
    });

    this.game.state.tribes.splice(this.game.state.tribes.indexOf(this), 1);
  }
}
