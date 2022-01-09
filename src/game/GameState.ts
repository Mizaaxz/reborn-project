import Vec2 from "vec2";
import Player from "../moomoo/Player";
import Game from "./Game";
import Client from "../moomoo/Client";
import Tribe from "../moomoo/Tribes";
import { Packet } from "../packet/Packet";
import { PacketFactory } from "../packet/PacketFactory";
import GameObject from "../gameobjects/GameObject";
import { PacketType } from "../packet/PacketType";
import Projectile from "../projectiles/Projectile";
import {
  getProjectileSpeed,
  getProjectileRange,
} from "../projectiles/projectiles";
import config from "../config";
import Animal from "../moomoo/Animal";

export default class GameState {
  public game: Game;
  public gameObjects: GameObject[] = [];
  public players: Player[] = [];
  public tribes: Tribe[] = [];
  public projectiles: Projectile[] = [];
  public animals: Animal[] = [];

  constructor(game: Game) {
    this.game = game;
  }

  addProjectile(
    type: number,
    location: Vec2,
    player?: Player,
    angle = player?.angle,
    layer = player?.layer
  ) {
    let packetFactory = PacketFactory.getInstance();
    let newProjectile = new Projectile(
      this.projectiles.length > 0
        ? Math.max(...this.projectiles.map((projectile) => projectile.id)) + 1
        : 0,
      location,
      type,
      getProjectileSpeed(type) || 1,
      angle || 0,
      layer || 0,
      player?.id || -1
    );

    this.projectiles.push(newProjectile);

    this.getPlayersNearProjectile(newProjectile).forEach((player) => {
      player.client?.socket.send(
        packetFactory.serializePacket(
          new Packet(PacketType.ADD_PROJECTILE, [
            location.x,
            location.y,
            angle,
            getProjectileRange(type),
            getProjectileSpeed(type),
            type,
            layer,
            newProjectile.id,
          ])
        )
      );

      player.client?.seenProjectiles.push(newProjectile.id);
    });

    return newProjectile;
  }

  removeProjectile(projectile: Projectile) {
    let packetFactory = PacketFactory.getInstance();
    this.getPlayersNearProjectile(projectile).forEach((player) => {
      player.client?.socket.send(
        packetFactory.serializePacket(
          new Packet(PacketType.UPDATE_PROJECTILES, [projectile.id])
        )
      );
    });
    this.projectiles.splice(this.projectiles.indexOf(projectile), 1);
  }

  getPlayersNearProjectile(projectile: Projectile) {
    const RADIUS = config.playerNearbyRadius || 1250;
    return this.players.filter(
      (player) =>
        !player.dead && player.location.distance(projectile.location) < RADIUS
    );
  }

  removeGameObject(gameObject: GameObject) {
    let packetFactory = PacketFactory.getInstance();
    this.gameObjects.splice(this.gameObjects.indexOf(gameObject), 1);

    for (let player of this.players) {
      if (
        player.client &&
        player.client.seenGameObjects.includes(gameObject.id)
      ) {
        player.client.seenGameObjects.splice(
          player.client.seenGameObjects.indexOf(gameObject.id),
          1
        );
        player.client.socket.send(
          packetFactory.serializePacket(
            new Packet(PacketType.REMOVE_GAME_OBJ, [gameObject.id])
          )
        );
      }
    }
  }

  updateClanPlayers(tribe: Tribe) {
    let packetFactory = PacketFactory.getInstance();
    let data: (string | number)[] = [];

    tribe.allMembers.forEach((m) => data.push(m.id, m.name));
    tribe.allMembers.forEach((m) =>
      m.client?.socket.send(
        packetFactory.serializePacket(
          new Packet(PacketType.SET_CLAN_PLAYERS, [data])
        )
      )
    );
  }

  addPlayer(sid: number, ownerID: string, client: Client, game: Game) {
    return this.players[
      this.players.push(
        new Player(sid, ownerID, new Vec2(0, 0), game, client)
      ) - 1
    ];
  }
  addAnimal(sid: number, location: Vec2, type: number, name: string) {
    return this.animals[
      this.animals.push(new Animal(sid, location, type, name)) - 1
    ];
  }

  addTribe(name: string, ownerSID: number) {
    let packetFactory = PacketFactory.getInstance();
    let owner = this.players.find((p) => p.id == ownerSID);

    if (!owner) {
      for (let client of this.game.clients) {
        client.socket?.send(
          packetFactory.serializePacket(
            new Packet(PacketType.CLAN_ADD, [{ sid: name }])
          )
        );
      }

      return this.tribes[
        this.tribes.push(new Tribe(this.game, null, name, owner)) - 1
      ];
    }

    if (
      this.tribes.find(
        (tribe) =>
          tribe.name.toLowerCase() == name.toLowerCase() ||
          tribe.owner?.id == ownerSID
      )
    )
      return false;

    for (let client of this.game.clients) {
      client.socket?.send(
        packetFactory.serializePacket(
          new Packet(PacketType.CLAN_ADD, [{ sid: name }])
        )
      );
    }

    return this.tribes[this.tribes.push(new Tribe(this.game, owner, name)) - 1];
  }
}
