import lowdb from "lowdb";
import WebSocket from "ws";
import Client from "./Client";
import Player from "./Player";
import * as lowDb from "lowdb";
import NanoTimer from "nanotimer";
import bcrypt from "bcrypt";
import db from "enhanced.db";
import { randomPos, chunk, stableSort, Broadcast, deg2rad, rad2deg } from "./util";
import msgpack from "msgpack-lite";
import GameState from "./GameState";
import * as Physics from "./Physics";
import * as consoleTS from "../console";
import { Packet, Side } from "../packets/Packet";
import GameObject from "../gameobjects/GameObject";
import { PacketType } from "../packets/PacketType";
import FileAsync from "lowdb/adapters/FileAsync";
import { PacketFactory } from "../packets/PacketFactory";
import {
  getWeaponDamage,
  getWeaponAttackDetails,
  getItemCost,
  getPlaceable,
  PrimaryWeapons,
  getWeaponGatherAmount,
  getPrerequisiteItem,
  getGroupID,
  Weapons,
  getPrerequisiteWeapon,
  getWeaponSpeedMultiplier,
  getStructureDamage,
  getPPS,
  isRangedWeapon,
  getProjectileType,
  getRecoil,
  WeaponModes,
  getItem,
  getRandomItem,
  getRandomWeapon,
  getScale,
  getGameObjHealth,
  getGameObjDamage,
} from "../items/items";
import { gameObjectSizes, GameObjectType } from "../gameobjects/gameobjects";
import { getUpgrades, getWeaponUpgrades } from "./Upgrades";
import { getAccessory } from "./Accessories";
import { getHat } from "./Hats";
import { WeaponVariant, WeaponVariants } from "./Weapons";
import { ItemType } from "../items/UpgradeItems";
import {
  getProjectileRange,
  getProjectileSpeed,
  Layer,
  ProjectileType,
} from "../projectiles/projectiles";
import config from "../config";
import Vec2 from "vec2";
import { GameModes } from "./GameMode";
import { readdirSync } from "fs";
import * as logger from "../log";
import Animal from "./Animal";
import animals from "../definitions/animals";
import items from "../definitions/items";
import { Account } from "./Account";
import ms from "ms";
import { AdminLevel } from "./Admin";
import weapons from "../definitions/weapons";
import hats from "../definitions/hats";
import accessories from "../definitions/accessories";

let currentGame: Game | null = null;
let badWords = config.badWords;

const DEFAULT_MAX_CPS = 25;

let MAX_CPS = (config.maxCPS && parseInt(config.maxCPS, 10)) || DEFAULT_MAX_CPS;
if (isNaN(MAX_CPS)) MAX_CPS = DEFAULT_MAX_CPS;

export default class Game {
  public state: GameState;
  public clients: Client[] = [];
  public lastTick: number = 0;
  public started: boolean = false;
  public mode: GameModes = GameModes.normal;
  lastUpdate: number = 0;
  physTimer: NanoTimer | undefined;

  constructor() {
    let defaultMode = (
      readdirSync("data").filter((f) => f.startsWith("DEFAULT_GAMEMODE="))[0] || ""
    ).split("=")[1] as GameModes;
    if (defaultMode && GameModes[defaultMode]) this.mode = defaultMode;

    this.state = new GameState(this);
    this.update = this.update.bind(this);

    if (!currentGame) currentGame = this;
  }

  /**
   * Starts the server loop
   */
  start() {
    this.started = true;
    this.lastUpdate = Date.now();
    this.physTimer = new NanoTimer();
    this.physTimer.setInterval(this.physUpdate.bind(this), "", "33m");
    this.generateStructures();

    setInterval(this.updateWindmills.bind(this), 1000);

    process.nextTick(this.update);
  }
  public closing: NodeJS.Timeout = setInterval(() => {}, 5000);
  close(reason: string = "Server Closed", doneMax: number = 10) {
    let g = this;
    let doneTimer = 0;
    clearInterval(this.closing);
    this.closing = setInterval(function () {
      if (doneTimer > doneMax) {
        g.clients.forEach((c) => {
          g.kickClient(c, reason);
        });
        if (!g.clients.length) process.exit();
      } else {
        g.clients.forEach((c) => {
          Broadcast(`Server closing in ${ms((doneMax - doneTimer) * 1000, { long: true })}...`, c);
        });
        doneTimer++;
      }
    }, 1000);
  }
  cancelClose() {
    clearInterval(this.closing);
    this.closing = setInterval(() => {}, 5000);
  }

  exec(code: string, source: Player | undefined) {
    let game = this;
    let $db = db;
    let self = source;
    let $players = new (class {
      constructor() {}
      each(doEach: Function) {
        game.state.players.forEach((p) => {
          doEach(
            new (class {
              constructor() {}
              kill() {
                p.die();
              }
            })()
          );
        });
      }
    })();
    try {
      return [true, eval(code.replace(/\(\$\./g, "($=>$."))];
    } catch (e) {
      return [false, e];
    }
  }

  getNextGameObjectID() {
    return this.state.gameObjects.length > 0
      ? Math.max(...this.state.gameObjects.map((gameObj) => gameObj.id)) + 1
      : 0;
  }

  generateStructures() {
    const gameObjectTypes = [
      GameObjectType.Tree,
      GameObjectType.Bush,
      GameObjectType.Mine,
      GameObjectType.GoldMine,
    ];
    const desertGameObjectTypes = [
      GameObjectType.Bush,
      GameObjectType.Mine,
      GameObjectType.GoldMine,
    ];
    const riverGameObjectTypes = [GameObjectType.Mine];

    outerLoop: for (let i = 0; i < 400; i++) {
      let location = randomPos(14400, 14400);
      let gameObjectType =
        location.y >= 12e3
          ? desertGameObjectTypes[Math.floor(Math.random() * desertGameObjectTypes.length)]
          : location.y < 7550 && location.y > 6850
          ? riverGameObjectTypes[Math.floor(Math.random() * riverGameObjectTypes.length)]
          : gameObjectTypes[Math.floor(Math.random() * gameObjectTypes.length)];
      let sizes = gameObjectSizes[gameObjectType];

      if (sizes) {
        let size = sizes[Math.floor(Math.random() * sizes.length)];

        let newGameObject = new GameObject(
          this.getNextGameObjectID(),
          location,
          0,
          size,
          gameObjectType,
          gameObjectType == GameObjectType.Tree || gameObjectType == GameObjectType.Bush
            ? size * 0.6
            : size,
          {},
          -1,
          -1,
          gameObjectType == GameObjectType.Bush && location.y >= 12e3 ? 35 : 0
        );

        for (let gameObject of this.state.gameObjects) {
          if (Physics.collideGameObjects(gameObject, newGameObject)) {
            i--;
            continue outerLoop;
          }
        }
        this.state.gameObjects.push(newGameObject);
      }
    }
  }

  generateStructure(objType: string, x: number, y: number, objSize?: number | undefined) {
    let obj = objType.split(":")[0];
    let params = objType.split(":")[1];

    let type = GameObjectType.Mine;
    switch (obj) {
      case "tree":
      case "wood":
      case "w":
        type = GameObjectType.Tree;
        break;
      case "bush":
      case "food":
      case "f":
        type = GameObjectType.Bush;
        break;
      case "mine":
      case "stone":
      case "rock":
      case "s":
        type = GameObjectType.Mine;
        break;
      case "goldmine":
      case "gold":
      case "g":
        type = GameObjectType.GoldMine;
        break;
    }

    let sizes = gameObjectSizes[type];
    let location = new Vec2(x, y);

    let damage = type == GameObjectType.Bush && location.y >= 12e3 ? 35 : 0;
    if (params == "dmg") damage = 35;

    if (sizes) {
      let size = objSize || sizes[Math.floor(Math.random() * sizes.length)];

      let newGameObject = new GameObject(
        this.getNextGameObjectID(),
        location,
        0,
        size,
        type,
        type == GameObjectType.Tree || type == GameObjectType.Bush ? size * 0.6 : size,
        {},
        -1,
        -1,
        damage
      );

      this.state.gameObjects.push(newGameObject);

      for (let plr of this.clients) {
        if (plr.player) this.sendGameObjects(plr.player);
      }
    }
  }

  async addClient(id: string, socket: WebSocket, ip: string) {
    // Only start on first connection to save resources
    if (!this.started) this.start();

    let packetFactory = PacketFactory.getInstance();

    if (this.clients.some((client) => client.id === id))
      throw `There is already a client with ID ${id} in this Game!`;

    let client = this.clients[this.clients.push(new Client(id, socket, ip)) - 1];

    if (this.clients.filter((client) => client.ip === ip).length > 2) {
      this.kickClient(client, "Only 2 connections allowed!");
      setTimeout(function () {
        socket.terminate();
      }, 100);
    }

    let bannedIPs = (db.get("bannedIPs") as any[]) || [];
    if (bannedIPs.includes(ip)) {
      this.kickClient(client, "You are banned.");
      setTimeout(function () {
        socket.terminate();
      }, 100);
      return;
    }

    socket.addListener("close", () => {
      if (client.player) {
        const index = this.state.players.indexOf(client.player);

        if (index > -1) {
          this.state.players.splice(index, 1);
        }

        this.state.gameObjects
          .filter((gameObj) => gameObj.ownerSID === client.player?.id)
          .forEach((gameObj) => this.state.removeGameObject(gameObj));

        let tribeIndex = this.state.tribes.findIndex(
          (tribe) => tribe.ownerSID == client.player?.id
        );

        if (tribeIndex > -1) this.state.removeTribe(tribeIndex);
      }

      let clientIndex = this.clients.indexOf(client);
      if (clientIndex > -1) this.clients.splice(clientIndex, 1);

      this.sendLeaderboardUpdates();
    });

    socket.addListener("message", (msg) => {
      let infractionsIP = db.get(`infractions_ip_${client.ip}`);
      try {
        if (msg instanceof ArrayBuffer) {
          this.onMsg(client, packetFactory.deserializePacket(msg, Side.Server));
        } else if (msg instanceof Buffer) {
          this.onMsg(
            client,
            packetFactory.deserializePacket(
              msg.buffer.slice(msg.byteOffset, msg.byteOffset + msg.byteLength),
              Side.Server
            )
          );
        } else {
          console.log("MessagePacket issue. Not a buffer.");
          this.kickClient(client, "disconnected");
          socket.terminate();
        }
      } catch (e) {
        console.log("MessagePacket issue.", e);
        this.kickClient(client, "disconnected");
        socket.terminate();
      }
    });

    socket.send(packetFactory.serializePacket(new Packet(PacketType.IO_INIT, [id])));
    socket.send(
      packetFactory.serializePacket(
        new Packet(PacketType.CLAN_LIST, [
          {
            teams: this.state.tribes.map((tribe) => ({
              sid: tribe.name,
              owner: tribe.ownerSID,
            })),
          },
        ])
      )
    );

    socket.on("error", (err) => {
      console.error(err);
    });

    console.log(`Added player ${id} with ip ${ip}.`);
  }

  kickClient(client: Client, reason: string = "Kicked from game.") {
    this.clients.splice(this.clients.indexOf(client), 1);
    console.log(`Kicked ${client.id}: ${reason}`);

    client.socket.send(msgpack.encode(["d", [reason]]));

    setTimeout(() => {
      try {
        client.socket.close();
        setTimeout(() => {
          client.socket.terminate();
        }, 120);
      } catch (e) {
        client.socket.terminate();
      }
    }, 1);
  }

  async banClient(client: Client, reason: string = "Banned by a moderator.") {
    if (!((db.get("bannedIPs") as any[]) || []).includes(client.ip)) {
      let bannedIPs = (db.get("bannedIPs") as any[]) || [];
      bannedIPs.push(client.ip);
      db.set("bannedIPs", bannedIPs);
    }

    this.kickClient(client, reason);
  }
  async banIP(ip: String) {
    if (!((db.get("bannedIPs") as any[]) || []).includes(ip)) {
      let bannedIPs = (db.get("bannedIPs") as any[]) || [];
      bannedIPs.push(ip);
      db.set("bannedIPs", bannedIPs);
    }
  }
  banName(name: string) {
    let bannedNames = (db.get("BANNED_NAMES") as string[]) || [];
    bannedNames.push(name);
    db.set("BANNED_NAMES", bannedNames);
  }
  async unbanIP(ip: string) {
    let bannedIPs = (db.get("bannedIPs") as any[]) || [];
    if (bannedIPs.includes(ip)) {
      bannedIPs.splice(bannedIPs.indexOf(ip), 1);
      db.set("bannedIPs", bannedIPs);
    }
  }

  killPlayer(player: Player) {
    let packetFactory = PacketFactory.getInstance();

    player.die();

    for (let nearbyPlayer of player.getNearbyPlayers(this.state)) {
      nearbyPlayer.client?.socket?.send(
        packetFactory.serializePacket(
          new Packet(PacketType.PLAYER_UPDATE, [
            this.makePlayerUpdateForClient(nearbyPlayer.client),
          ])
        )
      );
    }

    this.sendLeaderboardUpdates();
  }

  killAnimal(animal: Animal) {
    animal.die();

    this.sendAnimalUpdates();
  }

  makePlayerUpdateForClient(client: Client) {
    let playerUpdate: (number | string | null)[] = [];

    if (client.player) {
      if (!client.player.dead) playerUpdate = client.player.getUpdateData(this.state, true);

      for (let player of client.player.getNearbyPlayers(this.state)) {
        if (!player.invisible) {
          playerUpdate = playerUpdate.concat(player.getUpdateData(this.state));
        }
      }
    }

    return playerUpdate;
  }

  sendPlayerUpdates() {
    let packetFactory = PacketFactory.getInstance();

    for (let client of Object.values(this.clients)) {
      for (let peer of this.clients) {
        if (
          peer.player &&
          client.player &&
          client.player != peer.player &&
          client.player.getNearbyPlayers(this.state).includes(peer.player) &&
          !client.seenPlayers.includes(peer.player.id) &&
          !peer.player.dead
        ) {
          client.socket.send(
            packetFactory.serializePacket(
              new Packet(PacketType.PLAYER_ADD, [
                [
                  peer.id,
                  peer.player.id,
                  client.admin
                    ? `\u3010${peer.player.id}\u3011 ${peer.player.name}`
                    : peer.player.name,
                  peer.player.location.x,
                  peer.player.location.y,
                  0,
                  100,
                  100,
                  35,
                  peer.player.skinColor,
                ],
                false,
              ])
            )
          );
          client.seenPlayers.push(peer.player.id);
        }
      }

      client.socket.send(
        packetFactory.serializePacket(
          new Packet(PacketType.PLAYER_UPDATE, [this.makePlayerUpdateForClient(client)])
        )
      );
    }
  }
  sendAnimalUpdates() {
    let packetFactory = PacketFactory.getInstance();

    let animalData = this.state.animals.reduce<number[]>((acc, animal) => {
      if (!animal) return acc;

      return acc.concat([
        animal.id, // sid
        animal.type, // animal index id
        animal.location.x, // locx
        animal.location.y, // locy
        animal.angle, // angle (dir?)
        animal.health, // health
        1, // cow name index
      ]);
    }, []);

    this.state.players.forEach((plr: Player) => {
      plr.client?.socket.send(
        packetFactory.serializePacket(new Packet(PacketType.UPDATE_ANIMALS, [animalData]))
      );
    });
  }

  sendLeaderboardUpdates() {
    let packetFactory = PacketFactory.getInstance();
    let leaderboardUpdate: (string | number)[] = [];

    for (let player of stableSort(
      this.state.players.filter((player) => !player.dead && !player.hideLeaderboard),
      (a, b) => {
        if (a.points < b.points) return -1;
        if (a.points > b.points) return 1;
        return 0;
      }
    )
      .reverse()
      .slice(0, 10)) {
      leaderboardUpdate = leaderboardUpdate.concat([player.id, player.name, player.points]);
    }

    for (let client of this.clients) {
      client.socket.send(
        packetFactory.serializePacket(
          new Packet(PacketType.LEADERBOARD_UPDATE, [leaderboardUpdate])
        )
      );
    }
  }

  /**
   * Called every once in a while to send new data
   */
  tick() {
    this.sendPlayerUpdates();
    this.sendAnimalUpdates();
  }

  /**
   * Sends GameObject updates to players
   */
  sendGameObjects(player: Player) {
    let packetFactory = PacketFactory.getInstance();

    let newGameObjects = player
      .getNearbyGameObjects(this.state)
      .filter((gameObject) => !player.client?.seenGameObjects.includes(gameObject.id));

    if (newGameObjects) {
      let gameObjectArray: (number | boolean | object)[] = [];

      for (let gameObject of newGameObjects) {
        gameObjectArray = gameObjectArray.concat(gameObject.getData());
        player.client?.seenGameObjects.push(gameObject.id);
      }

      player.client?.socket.send(
        packetFactory.serializePacket(new Packet(PacketType.LOAD_GAME_OBJ, [gameObjectArray]))
      );
    }
  }

  updateProjectiles(deltaTime: number) {
    let packetFactory = PacketFactory.getInstance();

    this.state.projectiles.forEach((projectile) => {
      projectile.location.add(
        projectile.speed * Math.cos(projectile.angle) * deltaTime,
        projectile.speed * Math.sin(projectile.angle) * deltaTime
      );
      projectile.distance += projectile.speed * deltaTime;

      this.state.getPlayersNearProjectile(projectile).forEach((player) => {
        player.client?.socket.send(
          packetFactory.serializePacket(
            new Packet(PacketType.UPDATE_PROJECTILES, [projectile.id, projectile.distance])
          )
        );
      });

      let owner = this.state.players.find((player) => player.id == projectile.ownerSID);

      this.state.getPlayersNearProjectile(projectile).forEach((player) => {
        if (player.client && !player.client.seenProjectiles.includes(projectile.id)) {
          player.client?.socket.send(
            packetFactory.serializePacket(
              new Packet(PacketType.ADD_PROJECTILE, [
                projectile.location.x,
                projectile.location.y,
                projectile.angle,
                (getProjectileRange(projectile.type) || 100) - projectile.distance,
                getProjectileSpeed(projectile.type),
                projectile.type,
                projectile.layer,
                projectile.id,
              ])
            )
          );
          player.client.seenProjectiles.push(projectile.id);
        }
        if (
          Physics.collideProjectilePlayer(projectile, player) &&
          player.id != projectile.ownerSID
        ) {
          if (owner) this.damageFrom(player, owner, projectile.damage, false);

          player.velocity.add(
            0.3 * Math.cos(projectile.angle) * deltaTime,
            0.3 * Math.sin(projectile.angle) * deltaTime
          );
          if (player.health <= 0) this.killPlayer(player);

          if (owner && !player.hideLeaderboard) {
            owner.client?.socket.send(
              packetFactory.serializePacket(
                new Packet(PacketType.HEALTH_CHANGE, [
                  player.location.x,
                  player.location.y,
                  projectile.damage,
                  1,
                ])
              )
            );
          }
          this.state.projectiles.splice(this.state.projectiles.indexOf(projectile), 1);
        }
      });

      this.state.gameObjects.forEach((gameObj) => {
        if (Physics.collideProjectileGameObject(projectile, gameObj)) {
          this.state.projectiles.splice(this.state.projectiles.indexOf(projectile), 1);

          for (let nearbyPlayer of this.state.getPlayersNearProjectile(projectile)) {
            nearbyPlayer.client?.socket.send(
              packetFactory.serializePacket(
                new Packet(PacketType.WIGGLE, [projectile.angle, gameObj.id])
              )
            );
          }
        }
      });
    });
  }

  damageFrom(to: Player, from: Player, dmg: number, direct = true) {
    let packetFactory = PacketFactory.getInstance();

    let attackerHat = getHat(from.hatID);
    let recieverHat = getHat(to.hatID);

    let attackerAcc = getAccessory(from.accID);
    let recieverAcc = getAccessory(to.accID);

    let healAmount =
      ((attackerHat?.healD || 0) +
        (attackerAcc?.healD || 0) +
        ((from.selectedWeapon == from.weapon
          ? WeaponVariants[from.primaryWeaponVariant]
          : WeaponVariants[from.secondaryWeaponVariant]
        ).lifeSteal || 0)) *
      dmg;
    from.health = Math.min(from.health + healAmount, 100);

    if (healAmount) {
      from.client?.socket.send(
        packetFactory.serializePacket(
          new Packet(PacketType.HEALTH_CHANGE, [
            from.location.x,
            from.location.y,
            Math.round(-healAmount),
            1,
          ])
        )
      );
    }

    if (attackerHat && attackerHat.dmgMultO) dmg *= attackerHat.dmgMultO;

    if (to.selectedWeapon == Weapons.Shield) dmg *= 0.2;

    if (recieverHat) {
      dmg *= recieverHat.dmgMult || 1;

      if (recieverHat.dmg) {
        from.health -= recieverHat.dmg * dmg;
      }

      if (recieverHat.dmgK && direct) {
        let knockback = recieverHat.dmgK;
        from.velocity.add(
          knockback * Math.cos((from.angle - Math.PI) % (2 * Math.PI)),
          knockback * Math.sin((from.angle - Math.PI) % (2 * Math.PI))
        );
      }
    }

    if (recieverAcc) {
      if (recieverAcc.dmg) {
        from.health -= recieverAcc.dmg * dmg;
      }
    }

    if (to.health - dmg <= 0 && !to.invincible) {
      from.kills++;
      from.points += to.age * 100 * (attackerHat?.kScrM || 1);

      if (attackerHat?.goldSteal) {
        from.points += attackerHat.goldSteal * to.points;
      }
    }

    to.health -= dmg;
    return dmg;
  }
  damageFromAnimal(to: Animal, from: Player, dmg: number, direct = true) {
    let packetFactory = PacketFactory.getInstance();

    let attackerHat = getHat(from.hatID);
    let attackerAcc = getAccessory(from.accID);

    let healAmount = ((attackerHat?.healD || 0) + (attackerAcc?.healD || 0)) * dmg;
    from.health = Math.min(from.health + healAmount, 100);

    if (healAmount) {
      from.client?.socket.send(
        packetFactory.serializePacket(
          new Packet(PacketType.HEALTH_CHANGE, [
            from.location.x,
            from.location.y,
            Math.round(-healAmount),
            1,
          ])
        )
      );
    }

    if (attackerHat && attackerHat.dmgMultO) dmg *= attackerHat.dmgMultO;

    to.health -= dmg;
    return dmg;
  }
  /**
   * Called as often as possible for things like physics calculations
   */
  update() {
    const now = Date.now();
    const deltaTime = now - this.lastUpdate;

    let packetFactory = PacketFactory.getInstance();

    const TICK_INTERVAL = process.env.TICK_INTERVAL || 0; // not sure

    if (Date.now() - this.lastTick >= TICK_INTERVAL) {
      this.lastTick = Date.now();
      this.tick();
    }

    this.state.players.forEach((player) => {
      let tribe = this.state.tribes.find((t) => t.name == player.clanName);
      let tribeMembers = tribe
        ? tribe.membersSIDs
            .map((m) => this.state.players.find((p) => p.id === m))
            .filter((m) => m !== player)
            .reduce<number[]>((acc, otherMember) => {
              if (!otherMember || otherMember.dead) return acc;

              return acc.concat([otherMember?.location.x, otherMember?.location.y]);
            }, [])
        : [];

      let highKills = this.state.players
        .filter((p) => p.getUpdateData(this.state)[11] == 1 && p !== player)
        .reduce<number[]>((acc, otherMember) => {
          if (!otherMember || otherMember.dead) return acc;

          return acc.concat([otherMember?.location.x, otherMember?.location.y]);
        }, []);

      player?.client?.socket.send(
        packetFactory.serializePacket(new Packet(PacketType.MINIMAP, [tribeMembers, highKills]))
      );
    });

    this.state.gameObjects
      .filter((o) => o.data == ItemType.Turret)
      .forEach((turret) => {
        let Turret = getItem(ItemType.Turret);
        let nearbyPlayers = this.state.players.filter(
          (p) =>
            turret.ownerSID !== p.id &&
            !this.state.tribes.find(
              (t) => t.membersSIDs.includes(turret.ownerSID) && t.membersSIDs.includes(p.id)
            ) &&
            p.location.distance(turret.location) < (Turret?.shootRange || 0)
        );
        let nearestPlayer = nearbyPlayers.find(
          (p) => p.location == turret.location.nearest(nearbyPlayers.map((p) => p.location))
        );

        if (turret.lastShoot < Date.now() && nearestPlayer) {
          turret.lastShoot = Date.now() + (Turret?.shootRate || 0);
          let turretAngle = Math.atan2(
            nearestPlayer.location.y - turret.location.y,
            nearestPlayer.location.x - turret.location.x
          );
          this.state.players
            .filter((p) => p.getNearbyGameObjects(this.state).includes(turret))
            .forEach((player) => {
              if (nearestPlayer)
                player?.client?.socket.send(
                  packetFactory.serializePacket(
                    new Packet(PacketType.SHOOT_TURRET, [turret.id, turretAngle])
                  )
                );
            });

          /*this.state.addProjectile(
            ProjectileType.Turret,
            turret.location.add(0, 100, true),
            undefined,
            turretAngle,
            Layer.Player
          );*/
        }
      });

    this.state.animals.forEach((animal) => {
      if (Date.now() - animal.lastDot >= 1000) {
        animal.damageOverTime();
        animal.lastDot = now;
      }
    });

    this.state.players.forEach((player) => {
      if (player.dead) return;

      Physics.movePlayer(player, 33, this.state);

      if (Date.now() - player.lastDot >= 1000) {
        player.damageOverTime();
        player.lastDot = now;
      }

      if (getHat(player.hatID)?.invisTimer) {
        let invisTimer = getHat(player.hatID)?.invisTimer || 0;
        if (player.lastMove + invisTimer > Date.now()) player.invisible = false;
        else player.invisible = true;
        this.sendPlayerUpdates();
      }

      function sendOneTapped(x: number, y: number) {
        player.client?.socket.send(
          packetFactory.serializePacket(
            new Packet(PacketType.HEALTH_CHANGE, [x, y, "One Tapped!", 1])
          )
        );
      }

      if (player.isAttacking && player.selectedWeapon != Weapons.Shield && player.buildItem == -1) {
        if (now - player.lastHitTime >= player.getWeaponHitTime()) {
          player.lastHitTime = now;

          if (isRangedWeapon(player.selectedWeapon)) {
            let projectileDistance = 35 / 2;

            this.state.addProjectile(
              getProjectileType(player.selectedWeapon),
              player.location.add(
                projectileDistance * Math.cos(player.angle),
                projectileDistance * Math.sin(player.angle),
                true
              ),
              player
            );

            let recoilAngle = (player.angle + Math.PI) % (2 * Math.PI);
            player.velocity.add(
              getRecoil(player.selectedWeapon) * Math.cos(recoilAngle),
              getRecoil(player.selectedWeapon) * Math.sin(recoilAngle)
            );
          } else {
            let hat = getHat(player.hatID);

            let nearbyPlayers = player.getNearbyPlayers(this.state);
            let nearbyAnimals = player.getNearbyAnimals(this.state);

            let hitPlayers = Physics.checkAttack(player, nearbyPlayers);
            let hitAnimals = Physics.checkAnimalAttack(player, nearbyAnimals);
            let hitGameObjects = Physics.checkAttackGameObj(
              player,
              player.getNearbyGameObjects(this.state)
            );

            let weaponVariant =
              player.selectedWeapon == player.weapon
                ? player.primaryWeaponVariant
                : player.secondaryWeaponVariant;
            for (let hitPlayer of hitPlayers) {
              if (hitPlayer.clanName == player.clanName && hitPlayer.clanName != null) continue;

              let dmg = getWeaponDamage(player.selectedWeapon, weaponVariant);
              if (player.weaponMode == WeaponModes.OneTap) dmg = 8642;

              dmg = this.damageFrom(hitPlayer, player, dmg);

              let poison = WeaponVariants[weaponVariant].poison;
              if (poison) {
                hitPlayer.bleedDmg = 5;
                hitPlayer.bleedAmt = 0;
                hitPlayer.maxBleedAmt = poison;
              } else if (hat?.poisonDmg) {
                hitPlayer.bleedDmg = hat.poisonDmg;
                hitPlayer.bleedAmt = 0;
                hitPlayer.maxBleedAmt = hat.poisonTime;
              }

              if (hitPlayer.health <= 0 && hitPlayer.client && !hitPlayer.invincible) {
                this.killPlayer(hitPlayer);
                player.kills++;
              } else {
                let attackDetails = getWeaponAttackDetails(player.selectedWeapon);
                let knockback = attackDetails.kbMultiplier * 0.3;
                hitPlayer.velocity.add(
                  knockback * Math.cos(player.angle),
                  knockback * Math.sin(player.angle)
                );
              }

              switch (player.selectedWeapon) {
                case Weapons.McGrabby:
                  player.points += Math.min(250, hitPlayer.points);
                  hitPlayer.points -= Math.min(250, hitPlayer.points);
                  break;
              }

              if (player.weaponMode !== WeaponModes.OneTap && !player.hideLeaderboard)
                player.client?.socket.send(
                  packetFactory.serializePacket(
                    new Packet(PacketType.HEALTH_CHANGE, [
                      hitPlayer.location.x,
                      hitPlayer.location.y,
                      hitPlayer.invincible ? "Invincible!" : Math.round(dmg),
                      1,
                    ])
                  )
                );
              else sendOneTapped(hitPlayer.location.x, hitPlayer.location.y);
            }

            for (let hitAnimal of hitAnimals) {
              let dmg = getWeaponDamage(player.selectedWeapon, weaponVariant);
              if (player.weaponMode == WeaponModes.OneTap) dmg = 124650;

              dmg = this.damageFromAnimal(hitAnimal, player, dmg);

              let poison = WeaponVariants[weaponVariant].poison;
              if (poison) {
                hitAnimal.bleedDmg = 5;
                hitAnimal.bleedAmt = 0;
                hitAnimal.maxBleedAmt = poison;
              } else if (hat?.poisonDmg) {
                hitAnimal.bleedDmg = hat.poisonDmg;
                hitAnimal.bleedAmt = 0;
                hitAnimal.maxBleedAmt = hat.poisonTime;
              }

              if (hitAnimal.health <= 0) {
                let type = animals[hitAnimal.type];
                this.killAnimal(hitAnimal);

                if (type) {
                  player.food += type.drop || 0;
                  player.points += type.killScore || 0;
                }
              } else {
                let attackDetails = getWeaponAttackDetails(player.selectedWeapon);
                let knockback = attackDetails.kbMultiplier * 0.3;
                hitAnimal.velocity.add(
                  knockback * Math.cos(player.angle),
                  knockback * Math.sin(player.angle)
                );
              }

              if (player.weaponMode !== WeaponModes.OneTap)
                player.client?.socket.send(
                  packetFactory.serializePacket(
                    new Packet(PacketType.HEALTH_CHANGE, [
                      hitAnimal.location.x,
                      hitAnimal.location.y,
                      Math.round(dmg),
                      1,
                    ])
                  )
                );
              else sendOneTapped(hitAnimal.location.x, hitAnimal.location.y);
            }

            for (let hitGameObject of hitGameObjects) {
              if (player.weaponMode == WeaponModes.Inspect) {
                Broadcast(
                  JSON.stringify({
                    ownerSID: hitGameObject.ownerSID,
                    health: hitGameObject.health,
                    protected: hitGameObject.protect,
                  }),
                  player.client
                );
              }

              if (hitGameObject.health !== -1) {
                let hitGameObjectOwner = this.state.players.find(
                  (player: { id: any }) => player.id == hitGameObject.ownerSID
                );

                let dmgMult = 1;
                if (player.weaponMode == WeaponModes.OneTap) dmgMult = hitGameObject.health;

                if (hat && hat.bDmg) dmgMult *= hat.bDmg;

                if (!hitGameObject.protect)
                  hitGameObject.health -=
                    getStructureDamage(player.selectedWeapon, weaponVariant) * dmgMult;
                else if (hitGameObjectOwner == player)
                  hitGameObject.health -=
                    getStructureDamage(player.selectedWeapon, weaponVariant) * dmgMult;
                else if (player.weaponMode == WeaponModes.OneTap)
                  hitGameObject.health -=
                    getStructureDamage(player.selectedWeapon, weaponVariant) * dmgMult;

                if (hitGameObject.health <= 0) {
                  let itemCost = getItemCost(hitGameObject.data);
                  let costs = chunk(itemCost, 2);

                  for (let cost of costs) {
                    switch (cost[0]) {
                      case "food":
                        player.food += cost[1] as number;
                        break;
                      case "wood":
                        player.wood += cost[1] as number;
                        break;
                      case "stone":
                        player.stone += cost[1] as number;
                        break;
                    }

                    if (player.selectedWeapon == player.weapon)
                      player.primaryWeaponExp += cost[1] as number;
                    else player.secondaryWeaponExp += cost[1] as number;
                  }

                  if (hitGameObject.data == 20 && hitGameObjectOwner && hitGameObjectOwner.client) {
                    hitGameObjectOwner.client.spawnPos = false;
                  }

                  if (hitGameObjectOwner) {
                    let placedAmount = this.state.gameObjects.filter(
                      (gameObj) =>
                        gameObj.data === hitGameObject.data &&
                        gameObj.ownerSID == hitGameObject.ownerSID
                    ).length;
                    hitGameObjectOwner.client?.socket.send(
                      packetFactory.serializePacket(
                        new Packet(PacketType.UPDATE_PLACE_LIMIT, [
                          getGroupID(hitGameObject.data),
                          placedAmount - 1,
                        ])
                      )
                    );
                  }

                  this.state.removeGameObject(hitGameObject);
                  this.sendGameObjects(player);

                  for (let otherPlayer of player.getNearbyPlayers(this.state)) {
                    this.sendGameObjects(otherPlayer);
                  }
                }
              }

              for (let nearbyPlayer of nearbyPlayers) {
                nearbyPlayer.client?.socket.send(
                  packetFactory.serializePacket(
                    new Packet(PacketType.WIGGLE, [
                      Math.atan2(
                        hitGameObject.location.y - player.location.y,
                        hitGameObject.location.x - player.location.x
                      ),
                      hitGameObject.id,
                    ])
                  )
                );
              }

              let gather = getWeaponGatherAmount(player.selectedWeapon, weaponVariant);

              switch (hitGameObject.type) {
                case GameObjectType.Bush:
                  player.food += gather;
                  player.xp += 4 * gather;

                  if (player.selectedWeapon == player.weapon) player.primaryWeaponExp += gather;
                  else player.secondaryWeaponExp += gather;
                  break;
                case GameObjectType.Mine:
                  player.stone += gather;
                  player.xp += 4 * gather;

                  if (player.selectedWeapon == player.weapon) player.primaryWeaponExp += gather;
                  else player.secondaryWeaponExp += gather;
                  break;
                case GameObjectType.Tree:
                  player.wood += gather;
                  player.xp += 4 * gather;

                  if (player.selectedWeapon == player.weapon) player.primaryWeaponExp += gather;
                  else player.secondaryWeaponExp += gather;
                  break;
                case GameObjectType.GoldMine:
                  player.points +=
                    gather == 1 || player.selectedWeapon == Weapons.McGrabby ? 5 : gather;
                  player.xp += 4 * gather;

                  if (player.selectedWeapon == player.weapon)
                    player.primaryWeaponExp += gather == 1 ? 5 : gather;
                  else
                    player.secondaryWeaponExp +=
                      gather == 1 || player.selectedWeapon == Weapons.McGrabby ? 5 : gather;
                  break;
              }

              if (hitGameObject.isPlayerGameObject()) {
                switch (hitGameObject.data) {
                  case ItemType.Sapling:
                    player.wood += gather;
                    player.xp += 4 * gather;

                    if (player.selectedWeapon == player.weapon) player.primaryWeaponExp += gather;
                    else player.secondaryWeaponExp += gather;
                    break;
                  case ItemType.Mine:
                    player.stone += gather;
                    player.xp += 4 * gather;

                    if (player.selectedWeapon == player.weapon) player.primaryWeaponExp += gather;
                    else player.secondaryWeaponExp += gather;
                    break;
                }
              }

              if (hitGameObject.type !== GameObjectType.GoldMine && hitGameObject.health == -1)
                player.points +=
                  ((hat?.extraGold || 0) +
                    ((player.selectedWeapon == player.weapon
                      ? WeaponVariants[player.primaryWeaponVariant].extraGold
                      : WeaponVariants[player.secondaryWeaponVariant].extraGold) || 0)) *
                  gather;

              player.client?.socket.send(
                packetFactory.serializePacket(
                  new Packet(PacketType.WIGGLE, [
                    Math.atan2(
                      hitGameObject.location.y - player.location.y,
                      hitGameObject.location.x - player.location.x
                    ),
                    hitGameObject.id,
                  ])
                )
              );

              if (hitGameObject.health == -1 && player.weaponMode == WeaponModes.OneTap) {
                this.state.removeGameObject(hitGameObject);
              }

              if (player.weaponMode == WeaponModes.OneTap)
                sendOneTapped(hitGameObject.location.x, hitGameObject.location.y);
            }

            this.gatherAnim(player, hitGameObjects.length > 0);
          }
        }
      }

      if (player.moveDirection !== null && !player.dead) {
        let speedMult = player.location.y > 2400 ? player.spdMult : 0.8 * player.spdMult;

        if (player.hatID !== -1) {
          speedMult *= getHat(player.hatID)?.spdMult || 1;
        }
        if (player.accID !== -1) {
          speedMult *= getAccessory(player.hatID)?.spdMult || 1;
        }

        if (player.buildItem == -1) {
          speedMult *= getWeaponSpeedMultiplier(player.selectedWeapon);
        } else {
          speedMult *= 0.5;
        }

        Physics.moveTowards(player, player.moveDirection, speedMult, deltaTime, this.state);

        player.lastMove = Date.now();
        this.sendGameObjects(player);
      }
    });

    this.lastUpdate = Date.now();
  }

  physUpdate() {
    this.update();
    this.updateProjectiles(0.1);
  }

  /**
   * Generates a unique SID for a new player
   */
  public lastSID = 0;
  genSID() {
    return (this.lastSID += 1);
  }
  public lastAnimalSID = 0;
  genAnimalSID() {
    return (this.lastAnimalSID += 1);
  }

  /**
   * A manual attack
   * @param player the player doing the attacking
   */
  normalAttack(player: Player, angle: number | undefined) {
    player.angle = angle || player.angle;

    if (player.buildItem != -1) {
      let item = player.buildItem;

      if (player.useItem(item, this.state, this.getNextGameObjectID())) {
        if (getPlaceable(item)) {
          player
            .getNearbyPlayers(this.state)
            .forEach((nearbyPlayer) => this.sendGameObjects(nearbyPlayer));
          this.sendGameObjects(player);
        }

        let itemCost = getItemCost(item);
        let costs = chunk(itemCost, 2);

        for (let cost of costs) {
          switch (cost[0]) {
            case "food":
              player.food -= cost[1] as number;
              break;
            case "wood":
              player.wood -= cost[1] as number;
              break;
            case "stone":
              player.stone -= cost[1] as number;
              break;
          }
        }

        player.buildItem = -1;
      }
    } else {
      player.isAttacking = true;
    }
  }

  /**
   * An auto attack
   * @param player the player doing the attacking
   */
  autoAttack(player: Player) {
    player.isAttacking = true;
  }

  gatherAnim(player: Player, hit: boolean) {
    let packetFactory = PacketFactory.getInstance();

    for (let client of this.clients) {
      client.socket.send(
        packetFactory.serializePacket(
          new Packet(PacketType.GATHER_ANIM, [player.id, hit ? 1 : 0, player.selectedWeapon])
        )
      );
    }
  }

  public windmillTicks = 0;
  public spikeAdvance = 0;
  public spawnBounds = 14400;
  public spikeRemove: number[][] = [[], []];
  updateWindmills() {
    this.windmillTicks++;
    for (let windmill of this.state.gameObjects.filter(
      (gameObj) => gameObj.isPlayerGameObject() && getGroupID(gameObj.data) == 3
    )) {
      let player = this.state.players.find((player) => player.id == windmill.ownerSID);

      if (player && !player.dead) {
        let hat = getHat(player.hatID);

        player.points += getPPS(windmill.data) + (hat?.pps || 0);
        player.xp += getPPS(windmill.data) + (hat?.pps || 0);
      }
    }

    if (this.mode == GameModes.random && this.windmillTicks % 5 == 0) {
      let packetFactory = PacketFactory.getInstance();
      this.state.players.forEach((plr) => {
        let weaponsArray = [];
        plr.weapon = getRandomWeapon(0);
        plr.secondaryWeapon = -1;
        weaponsArray = [plr.weapon];
        let wvs = Object.values(WeaponVariants).map((v) => v.xp);
        plr.primaryWeaponExp = plr.secondaryWeaponExp = wvs[Math.floor(Math.random() * wvs.length)];

        let randomRes = [100, 200, 250, 300, 500];
        plr.wood = randomRes[Math.floor(Math.random() * randomRes.length)];
        plr.stone = randomRes[Math.floor(Math.random() * randomRes.length)];
        plr.food = randomRes[Math.floor(Math.random() * randomRes.length)];
        plr.points = plr.age = plr.xp = 0;

        let hatArr = hats.map((h) => h.id);
        let accArr = accessories.map((a) => a.id);
        plr.hatID = hatArr[Math.floor(Math.random() * hatArr.length)];
        plr.accID = accArr[Math.floor(Math.random() * accArr.length)];
        plr.invisible = false;

        let selected = plr.items.indexOf(plr.buildItem);
        let groups = items.map((i) => i.group).filter((g) => g != 0 && g != 13);
        plr.items = [
          getRandomItem(0),
          getRandomItem(groups[Math.floor(Math.random() * groups.length)]),
        ];
        plr.upgradeAge = 10;

        if (selected == -1) plr.selectedWeapon = plr.weapon;
        else plr.buildItem = plr.items[selected == 0 || selected == 1 ? selected : 1];

        plr.client?.socket.send(
          packetFactory.serializePacket(new Packet(PacketType.UPDATE_ITEMS, [plr.items, 0]))
        );
        plr.client?.socket.send(
          packetFactory.serializePacket(new Packet(PacketType.UPDATE_ITEMS, [weaponsArray, 1]))
        );
        plr.client?.socket.send(
          packetFactory.serializePacket(new Packet(PacketType.UPGRADES, [0, 0]))
        );
        plr.updateResources();
        this.sendLeaderboardUpdates();
        this.sendPlayerUpdates();
      });
    }

    if (this.mode == GameModes.royale && this.windmillTicks % 3 == 0) {
      let gens: [number, number][] = [];
      let i = ItemType.GreaterSpikes;
      let addAmt = getScale(i) * 1.8;

      if (this.spikeAdvance > 6800) {
        this.close(
          `Game Finished<br>Winners: ${this.state.players.map((p) => p.name).join(", ")}`,
          -1
        );
      }

      let currentPos = new Vec2(0 + this.spikeAdvance, 0 + this.spikeAdvance);
      while (currentPos.x < 14400 - this.spikeAdvance) {
        gens.push([currentPos.x, currentPos.y]);
        currentPos.add(addAmt, 0);
      }
      currentPos = new Vec2(0 + this.spikeAdvance, 14400 - this.spikeAdvance);
      while (currentPos.x < 14400 - this.spikeAdvance + addAmt) {
        gens.push([currentPos.x, currentPos.y]);
        currentPos.add(addAmt, 0);
      }
      currentPos = new Vec2(14400 - this.spikeAdvance, 0 + addAmt + this.spikeAdvance);
      while (currentPos.y < 14400 - this.spikeAdvance) {
        gens.push([currentPos.x, currentPos.y]);
        currentPos.add(0, addAmt);
      }
      currentPos = new Vec2(0 + this.spikeAdvance, 0 + addAmt + this.spikeAdvance);
      while (currentPos.y < 14400 - this.spikeAdvance) {
        gens.push([currentPos.x, currentPos.y]);
        currentPos.add(0, addAmt);
      }

      let newSpikeRemove: number[] = [];
      gens.forEach((g) => {
        let sid = this.getNextGameObjectID();
        this.state.gameObjects.push(
          new GameObject(
            sid,
            new Vec2(g[0], g[1]),
            0,
            getScale(i),
            -1,
            undefined,
            i,
            0,
            getGameObjHealth(i),
            getGameObjDamage(i),
            true
          )
        );
        newSpikeRemove.push(sid);
      });

      this.spikeRemove[1].forEach((g) => {
        let go = this.state.gameObjects.find((o) => o.id == g);
        if (go) this.state.removeGameObject(go);
      });
      this.spikeRemove[1] = this.spikeRemove[0].map((v) => v);
      this.spikeRemove[0] = newSpikeRemove.map((v) => v);

      this.state.players.forEach((p) => {
        this.sendGameObjects(p);
      });

      this.spikeAdvance += addAmt;
      this.spawnBounds -= addAmt;
    }
  }
  /**
   * Handles packets from the client
   * @param client the client sending the message
   * @param packet the packet sent
   */
  onMsg(client: Client, packet: Packet) {
    let packetFactory = PacketFactory.getInstance();

    switch (packet.type) {
      case PacketType.AUTH:
        /*
      im not kicking because this is to stop brute force and lagging the server
      and if they knew that it would just ignore all but the first auth attempt
      it would make bruteforce and lagging the server easier
    */
        if (client.triedAuth || !packet.data[0]) return;
        if (typeof packet.data[0].name !== "string" || typeof packet.data[0].password !== "string")
          return this.kickClient(client, "disconnected");
        client.triedAuth = true;
        let account = db.get(`account_${packet.data[0].name.replace(/ /g, "+")}`) as Account;
        if (!account) return;
        bcrypt.compare(packet.data[0].password, account.password || "", (_: any, match: any) => {
          if (match === true) {
            client.accountName = account.username || "";
            client.account = account;
            client.loggedIn = true;
            if (typeof account.admin == "boolean") {
              account.adminLevel = 0;
              delete account.admin;
              db.set(`account_${packet.data[0].name.replace(/ /g, "+")}`, account);
              return this.kickClient(client, "Migrated to new admin system. Please reload.");
            }
            if (account.balance == undefined) {
              account.balance = 0;
              db.set(`account_${packet.data[0].name.replace(/ /g, "+")}`, account);
              return this.kickClient(client, "disconnected");
            }
            if (account.adminLevel) client.admin = account.adminLevel;
          }
        });
        break;
      case PacketType.SPAWN:
        if (client.player && !client.player.dead) this.kickClient(client, "disconnected");

        if ("name" in packet.data[0] && "moofoll" in packet.data[0] && "skin" in packet.data[0]) {
          let player = this.state.players.find((plr) => plr.ownerID === client.id);

          if (!player || (player && player.dead)) {
            let newPlayer = (client.player =
              player || this.state.addPlayer(this.genSID(), client.id, client, this));

            if (typeof client.spawnPos == "boolean") {
              newPlayer.location = randomPos(this.spawnBounds, this.spawnBounds, this.spikeAdvance);
            } else {
              newPlayer.location = client.spawnPos;
              client.spawnPos = false;

              let placed = this.state.gameObjects.filter(
                (gameObj) => gameObj.data === 20 && gameObj.ownerSID == newPlayer.id
              );
              client.socket.send(
                packetFactory.serializePacket(
                  new Packet(PacketType.UPDATE_PLACE_LIMIT, [getGroupID(20), placed.length - 1])
                )
              );

              for (let pad of placed) {
                this.state.removeGameObject(pad);
              }
              this.sendGameObjects(newPlayer);

              for (let otherPlayer of this.clients.map((c) => c.player)) {
                if (otherPlayer) this.sendGameObjects(otherPlayer);
              }
            }

            let filteredName: any[] = [];
            [...packet.data[0].name].forEach((char) => {
              if (config.allowedMax.split("").includes(char)) filteredName.push(char);
            });
            newPlayer.name = newPlayer.client?.account
              ? newPlayer.client.account.username || "unknown"
              : "Guest";
            //: filteredName.slice(0, 16).join("").trim() || "unknown";
            newPlayer.skinColor = packet.data[0].skin;
            newPlayer.dead = false;
            newPlayer.health = 100;

            let bannedNames = (db.get("BANNED_NAMES") as string[]) || [];
            if (bannedNames.includes(newPlayer.name.toLowerCase()) && newPlayer.client)
              return this.banClient(newPlayer.client, "disconnected");

            let amt = packet.data[0].moofoll ? 50 : 0;
            if (newPlayer.client?.account) amt += 50;
            newPlayer.food = amt;
            newPlayer.points = amt;
            newPlayer.stone = amt;
            newPlayer.wood = amt;
            if (this.mode == GameModes.random) newPlayer.upgradeAge = 100;

            if (
              newPlayer.name.toLowerCase().includes("cum") &&
              newPlayer.name.toLowerCase().includes("alex") &&
              newPlayer.client
            )
              return this.kickClient(newPlayer.client, "disconnected");

            client.socket.send(
              packetFactory.serializePacket(new Packet(PacketType.PLAYER_START, [newPlayer.id]))
            );

            this.sendLeaderboardUpdates();

            client.socket.send(
              packetFactory.serializePacket(
                new Packet(PacketType.PLAYER_ADD, [
                  [
                    client.id,
                    newPlayer.id,
                    newPlayer.client && newPlayer.client.admin
                      ? `\u3010${newPlayer.id}\u3011 ${newPlayer.name}`
                      : newPlayer.name,
                    newPlayer.location.x,
                    newPlayer.location.y,
                    0,
                    100,
                    100,
                    35,
                    newPlayer.skinColor,
                  ],
                  true,
                ])
              )
            );

            this.sendPlayerUpdates();
            this.sendGameObjects(newPlayer);
            newPlayer.updateResources();

            for (let client of this.clients) {
              let seenIndex = client.seenPlayers.indexOf(newPlayer.id);

              if (seenIndex > -1) client.seenPlayers.splice(seenIndex, 1);
            }
          }
        } else {
          this.kickClient(client, "disconnected");
        }
        break;
      case PacketType.ATTACK:
        if (client.player) {
          if (packet.data[0]) {
            if (Date.now() - client.lastAttackTime < 1000 / MAX_CPS) {
              client.lastAttackTime = Date.now();
              return;
            }

            client.lastAttackTime = Date.now();

            this.normalAttack(client.player, packet.data[1]);
          } else {
            client.player.isAttacking = false;
          }
        } else {
          Broadcast("Error: ATTACKING_WHILE_DEAD", client);
        }
        break;
      case PacketType.PLAYER_MOVE:
        if (packet.data[0] === null) {
          if (client.player) client.player.stopMove();
        } else {
          if (client.player) client.player.move(packet.data[0]);
        }
        break;
      case PacketType.WINDOW_FOCUS:
        if (client.player) client.player.stopMove();
        break;
      case PacketType.SET_ANGLE:
        if (client.player) client.player.angle = packet.data[0];
        break;
      case PacketType.CHAT:
        if (!client.player || client.player.dead) Broadcast("Error: CHATTING_WHILE_DEAD", client);

        if (packet.data[0].startsWith("/") && client.admin)
          return consoleTS.runCommand(packet.data[0].substring(1), client.player || undefined);

        packet.data[0] = String([...packet.data[0]].slice(0, 50).join("").trim());
        if (!packet.data[0]) return;

        logger.log(
          `Chat message by "${client.player?.name}" (ID: ${client.player?.id}): ${packet.data[0]}`
        );

        if (
          ["!crash", "lcrash", "icrash", "crash", ".crash", "cr", "!cr", ".cr"].includes(
            packet.data[0].toLowerCase()
          )
        )
          return this.kickClient(client, 'crashed <span style="font-size:16px">xd</span>');

        if (packet.data[0].toLowerCase().includes("kill me")) return client.player?.die();

        for (let badWord of badWords) {
          if (packet.data[0].includes(badWord))
            packet.data[0] = packet.data[0].replace(
              new RegExp(`\\b${badWord.replace(/[.*+?^${}()|[\]\\]/gi, "\\$&")}\\b`, "g"),
              "M" + "o".repeat(badWord.length - 1)
            );
        }

        let chatPacket = packetFactory.serializePacket(
          new Packet(PacketType.CHAT, [client.player?.id, packet.data[0]])
        );

        client.socket?.send(chatPacket);

        if (client.player) {
          for (let player of client.player.getNearbyPlayers(this.state)) {
            player.client?.socket.send(chatPacket);
          }
        }

        break;
      case PacketType.CLAN_CREATE:
        if (!client.player || client.player.dead)
          Broadcast("Error: CREATING_TRIBE_WHEN_DEAD", client);

        if (client.player) {
          let tribeName = [...packet.data[0]].slice(0, 10).join("").trim();
          if (!tribeName) return;
          if (tribeName.toLowerCase().includes("cum") && tribeName.toLowerCase().includes("alex"))
            return this.kickClient(client, "disconnected");

          if (client.player.nextTribeCreate > Date.now())
            return this.kickClient(client, "disconnected");
          client.player.nextTribeCreate = Date.now() + 3000;
          let tribe = this.state.addTribe(tribeName, client.player.id);

          if (tribe) {
            client.player.clanName = tribe.name;
            client.player.isClanLeader = true;
            client.socket?.send(
              packetFactory.serializePacket(
                new Packet(PacketType.PLAYER_SET_CLAN, [tribe.name, true])
              )
            );

            this.state.updateClanPlayers(tribe);
          }
        }
        break;
      case PacketType.CLAN_REQ_JOIN:
        if (!client.player || client.player.dead) Broadcast("Error: JOIN_TRIBE_WHILE_DEAD", client);

        if (client.player && client.player.clanName === null) {
          let tribe = this.state.tribes.find((tribe) => tribe.name === packet.data[0]);
          let ownerClient = this.state.players.find((player) => player.id === tribe?.ownerSID)
            ?.client;

          if (tribe && !ownerClient?.tribeJoinQueue.includes(client.player)) {
            ownerClient?.tribeJoinQueue.push(client.player);
            ownerClient?.socket.send(
              packetFactory.serializePacket(
                new Packet(PacketType.JOIN_REQUEST, [client.player.id, client.player.name])
              )
            );
          }
        } else {
          Broadcast("Error: ALREADY_IN_TRIBE", client);
        }
        break;
      case PacketType.CLAN_ACC_JOIN:
        if (!client.player || client.player.dead) Broadcast("Error: ADD_MEMBER_WHILE_DEAD", client);

        if (client.tribeJoinQueue.length && client.player && packet.data[1]) {
          let tribe = this.state.tribes.find((tribe) => tribe.ownerSID === client.player?.id);
          let player = client.tribeJoinQueue[0];

          if (tribe && player.clanName === null) {
            player.clanName = tribe.name;

            this.state.joinClan(player, tribe);

            // for pit traps to appear
            this.sendGameObjects(player);
          }
        }

        client.tribeJoinQueue.splice(0, 1);
        break;
      case PacketType.AUTO_ATK:
        if (client.player)
          if (packet.data[0] == 1) client.player.autoAttackOn = !client.player.autoAttackOn;
        break;
      case PacketType.CLAN_NOTIFY_SERVER:
        if (client.player && client.player.clanName) {
          if (Date.now() - client.player.lastPing > 2200) {
            let tribe = this.state.tribes.find((tribe) => tribe.name === client.player?.clanName);

            if (tribe) {
              for (let memberSID of tribe.membersSIDs) {
                this.state.players
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
        break;
      case PacketType.SELECT_ITEM:
        if (client.player) {
          let isWeapon = packet.data[1];

          if (isWeapon) {
            client.player.buildItem = -1;
            client.player.weaponMode = WeaponModes.None;

            if (client.player.weapon == packet.data[0])
              client.player.selectedWeapon = client.player.weapon;
            else if (client.player.secondaryWeapon == packet.data[0])
              client.player.selectedWeapon = client.player.secondaryWeapon;
            else Broadcast("Error: INVALID_WEAPON", client);
          } else {
            let itemCost = getItemCost(packet.data[0]);
            let costs = chunk(itemCost, 2);

            for (let cost of costs) {
              switch (cost[0]) {
                case "food":
                  if (client.player.food < cost[1]) return;
                  break;
                case "wood":
                  if (client.player.wood < cost[1]) return;
                  break;
                case "stone":
                  if (client.player.stone < cost[1]) return;
                  break;
              }
            }

            if (client.player.buildItem == packet.data[0]) {
              client.player.buildItem = -1;
            } else {
              client.player.buildItem = packet.data[0];
            }
          }
        }
        break;
      case PacketType.LEAVE_CLAN:
        if (!client.player || client.player.dead)
          Broadcast("Error: TRIBE_LEAVE_WHILE_DEAD", client);

        if (client.player) {
          let tribeIndex = this.state.tribes.findIndex((tribe) =>
            tribe.membersSIDs.includes(client.player?.id as number)
          );
          let tribe = this.state.tribes[tribeIndex];

          if (tribe && tribe.ownerSID == client.player.id) {
            this.state.removeTribe(tribeIndex);
            client.tribeJoinQueue = [];
          } else {
            this.state.leaveClan(client.player, tribeIndex);
          }
        }
        break;
      case PacketType.BUY_AND_EQUIP:
        if (!client.player || client.player.dead) Broadcast("Error: EQUIP_WHEN_DEAD", client);

        let isAcc = packet.data[2];

        if (isAcc) {
          if (!getAccessory(packet.data[1]) && packet.data[1] !== 0) {
            this.kickClient(client, "disconnected");
            return;
          }

          if (client.player) {
            if (packet.data[0]) {
              if (client.ownedAccs.includes(packet.data[1])) {
                Broadcast("Error: ALREADY_BOUGHT", client);
              } else {
                if (client.player.points >= (getAccessory(packet.data[1])?.price || 0)) {
                  client.player.points -= getAccessory(packet.data[1])?.price || 0;
                  client.ownedAccs.push(packet.data[1]);
                  client.socket.send(
                    packetFactory.serializePacket(
                      new Packet(PacketType.UPDATE_STORE, [0, packet.data[1], isAcc])
                    )
                  );
                }
              }
            } else {
              if (
                client.ownedAccs.includes(packet.data[1]) ||
                getAccessory(packet.data[1])?.price === 0 ||
                packet.data[1] === 0
              ) {
                if (client.player.accID === packet.data[1]) {
                  client.player.accID = 0;

                  client.socket.send(
                    packetFactory.serializePacket(
                      new Packet(PacketType.UPDATE_STORE, [1, 0, isAcc])
                    )
                  );
                } else {
                  client.player.accID = packet.data[1];

                  client.socket.send(
                    packetFactory.serializePacket(
                      new Packet(PacketType.UPDATE_STORE, [1, packet.data[1], isAcc])
                    )
                  );
                }
              } else {
                this.kickClient(client, "disconnected");
              }
            }
          }
        } else {
          if (
            (!getHat(packet.data[1]) || getHat(packet.data[1])?.dontSell) &&
            packet.data[1] !== 0
          ) {
            this.kickClient(client, "disconnected");
            return;
          }

          if (client.player) {
            if (packet.data[0]) {
              if (client.ownedHats.includes(packet.data[1])) {
                Broadcast("Error: ALREADY_BOUGHT", client);
              } else {
                if (client.player.points >= (getHat(packet.data[1])?.price || 0)) {
                  client.player.points -= getHat(packet.data[1])?.price || 0;
                  client.ownedHats.push(packet.data[1]);
                  client.socket.send(
                    packetFactory.serializePacket(
                      new Packet(PacketType.UPDATE_STORE, [0, packet.data[1], isAcc])
                    )
                  );
                }
              }
            } else {
              if (
                client.ownedHats.includes(packet.data[1]) ||
                getHat(packet.data[1])?.price === 0 ||
                packet.data[1] === 0
              ) {
                if (getHat(client.player.hatID)?.keepOn) return;
                if (getHat(client.player.hatID)?.invisTimer) {
                  client.player.invisible = client.player.hideLeaderboard = false;
                  this.sendLeaderboardUpdates();
                }
                if (client.player.hatID === packet.data[1]) {
                  client.player.hatID = 0;

                  client.socket.send(
                    packetFactory.serializePacket(
                      new Packet(PacketType.UPDATE_STORE, [1, 0, isAcc])
                    )
                  );
                } else {
                  client.player.hatID = packet.data[1];

                  client.socket.send(
                    packetFactory.serializePacket(
                      new Packet(PacketType.UPDATE_STORE, [1, packet.data[1], isAcc])
                    )
                  );
                }
              } else {
                this.kickClient(client, "disconnected");
              }
            }
          }
        }

        break;
      case PacketType.CLAN_KICK:
        if (!client.player || client.player.dead) Broadcast("Error: KICK_WHILE_DEAD", client);

        if (client.player) {
          let tribeIndex = this.state.tribes.findIndex(
            (tribe) => tribe.ownerSID == client.player?.id
          );
          let tribe = this.state.tribes[tribeIndex];

          if (tribeIndex < 0) Broadcast("Error: NOT_TRIBE_OWNER", client);
          if (!tribe?.membersSIDs.includes(packet.data[0]))
            Broadcast("Error: NOT_IN_TRIBE", client);

          let player = this.state.players.find((player) => player.id == packet.data[0]);
          if (!player) Broadcast("Error: INVALID_PLAYER", client);

          if (player) this.state.leaveClan(player, tribeIndex);
        }
        break;
      case PacketType.SELECT_UPGRADE:
        if (!client.player || client.player.dead) Broadcast("Error: SELECT_WHILE_DEAD", client);

        if (client.player) {
          let item = packet.data[0] as number;
          let upgrades = getUpgrades(client.player.upgradeAge);
          let weaponUpgrades = getWeaponUpgrades(client.player.upgradeAge);

          if (item <= 16) {
            if (weaponUpgrades.includes(item)) {
              let preItem = getPrerequisiteWeapon(item);

              if (preItem) {
                if (!(client.player.weapon == preItem || client.player.secondaryWeapon == preItem))
                  Broadcast("Error: NOT_EARNED_YET", client);
              }

              if (Object.values(PrimaryWeapons).includes(item)) {
                if (client.player.selectedWeapon == client.player.weapon)
                  client.player.selectedWeapon = item;
                client.player.weapon = item;
              } else {
                if (client.player.selectedWeapon == client.player.secondaryWeapon)
                  client.player.selectedWeapon = item;
                client.player.secondaryWeapon = item;
              }
            } else {
              Broadcast("Error: NOT_EARNED_FROM_TIERS", client);
            }
          } else {
            item -= weapons.length;
            if (upgrades.includes(item)) {
              let preItem = getPrerequisiteItem(item);

              if (preItem && !client.player.items.includes(preItem)) return;

              client.player.items[getGroupID(item)] = item;
            } else {
              Broadcast("Error: INVALID_ITEM", client);
            }
          }

          client.player.upgradeAge++;

          client.socket.send(
            packetFactory.serializePacket(
              new Packet(PacketType.UPDATE_ITEMS, [client.player.items, 0])
            )
          );

          let newWeapons = [client.player.weapon];

          if (client.player.secondaryWeapon != -1) newWeapons.push(client.player.secondaryWeapon);

          client.socket.send(
            packetFactory.serializePacket(new Packet(PacketType.UPDATE_ITEMS, [newWeapons, 1]))
          );

          if (client.player.age - client.player.upgradeAge + 1) {
            client.socket.send(
              packetFactory.serializePacket(
                new Packet(PacketType.UPGRADES, [
                  client.player.age - client.player.upgradeAge + 1,
                  client.player.upgradeAge,
                ])
              )
            );
          } else {
            client.socket.send(
              packetFactory.serializePacket(new Packet(PacketType.UPGRADES, [0, 0]))
            );
          }
        } else {
          Broadcast("Error: SELECT_WHILE_DEAD", client);
        }
        break;
      case PacketType.TRADE_REQ:
        if (!client.player || client.player.dead) Broadcast("Error: TRADE_WHILE_DEAD", client);

        if (client.player) {
          let toUser = this.state.players.find((p) => p.id == packet.data[0]);
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
        break;
      case PacketType.ACCEPT_TRADE_REQ:
        if (!client.player || client.player.dead) Broadcast("Error: TRADE_WHILE_DEAD", client);

        if (client.player) {
          let fromUser = this.state.players.find((p) => p.id == packet.data[0]);
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
        break;
    }
  }
}

function getGame() {
  return currentGame;
}

export { getGame, Game };
