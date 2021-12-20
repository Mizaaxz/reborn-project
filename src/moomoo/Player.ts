import Entity from "./Entity";
import { SkinColor, eucDistance } from "./util";
import Vec2 from "vec2";
import GameState from "../game/GameState";
import Game from "../game/Game";
import { WeaponVariant, WeaponVariants } from "./Weapons";
import Client from "./Client";
import { PacketFactory } from "../packet/PacketFactory";
import { Packet } from "../packet/Packet";
import { PacketType } from "../packet/PacketType";
import {
  PrimaryWeapons,
  SecondaryWeapons,
  Weapons,
  getHitTime,
  getPlaceable,
  getScale,
  getPlaceOffset,
  getGameObjHealth,
  getGameObjPlaceLimit,
  getGroupID,
  shouldHideFromEnemy,
  getGameObjDamage,
  WeaponModes,
} from "../items/items";
import { ItemType } from "../items/UpgradeItems";
import GameObject from "../gameobjects/GameObject";
import { collideGameObjects } from "./Physics";
import { getHat } from "./Hats";
import config from "../config";
import { getAccessory } from "./Accessories";
import { PlayerMode } from "./PlayerMode";
import { setAccount } from "./Account";

export default class Player extends Entity {
  public name: string;
  public skinColor: SkinColor;
  private _health: number = 100;
  public game: Game;

  public lastPing: number = 0;
  public lastDot = 0;

  public hatID: number = 0;
  public accID: number = 0;
  public lastMove = Date.now();

  public ownerID: string;
  public spdMult: number = config.defaultSpeed || 1;

  public upgradeAge = 2;
  public invincible = false;

  public layer = 0;
  public mode: PlayerMode = PlayerMode.normal;

  public foodHealOverTime = 0;
  public foodHealOverTimeAmt = 0;
  public maxFoodHealOverTime = -1;
  public padHeal = 0;

  public bleedDmg = 5;
  public bleedAmt = 0;
  public maxBleedAmt = -1;

  public spikeHit = 0;

  public weapon: PrimaryWeapons = 0;
  public secondaryWeapon: SecondaryWeapons | -1 = -1;
  public selectedWeapon: Weapons = 0;
  public weaponMode: WeaponModes = 0;

  private _primaryWeaponExp = 0;
  private _secondaryWeaponExp = 0;

  public get primaryWeaponExp() {
    return this._primaryWeaponExp;
  }

  public get secondaryWeaponExp() {
    return this._secondaryWeaponExp;
  }

  public set primaryWeaponExp(value) {
    (Object.keys(WeaponVariants) as unknown[] as WeaponVariant[]).forEach(
      (v) => {
        let va = WeaponVariants[v];
        if (value >= va.xp) this.primaryWeaponVariant = v;
      }
    );

    this._primaryWeaponExp = value;
  }

  public set secondaryWeaponExp(value) {
    (Object.keys(WeaponVariants) as unknown[] as WeaponVariant[]).forEach(
      (v) => {
        let va = WeaponVariants[v];
        if (value >= va.xp) this.secondaryWeaponVariant = v;
      }
    );

    this._secondaryWeaponExp = value;
  }

  public primaryWeaponVariant = WeaponVariant.Normal;
  public secondaryWeaponVariant = WeaponVariant.Normal;

  public buildItem = -1;
  public items: ItemType[] = [
    ItemType.Apple,
    ItemType.WoodWall,
    ItemType.Spikes,
    ItemType.Windmill,
  ];

  public clanName: string | null = null;
  public isClanLeader = false;
  public nextTribeCreate = Date.now();

  private _kills: number = 0;

  public invisible = false;
  public hideLeaderboard = false;

  public get kills(): number {
    return this._kills;
  }

  public set kills(newKills: number) {
    let packetFactory = PacketFactory.getInstance();
    this.client?.socket.send(
      packetFactory.serializePacket(
        new Packet(PacketType.UPDATE_STATS, ["kills", newKills, 1])
      )
    );
    this._kills = newKills;
  }

  public damageOverTime() {
    let packetFactory = PacketFactory.getInstance();
    let hat = getHat(this.hatID);
    let acc = getAccessory(this.accID);

    if (hat) {
      let healthRegen = hat.healthRegen || 0;

      if (healthRegen > 0 && this.health < 100) {
        this.client?.socket.send(
          packetFactory.serializePacket(
            new Packet(PacketType.HEALTH_CHANGE, [
              this.location.x,
              this.location.y,
              -Math.min(100 - this.health, healthRegen),
              1,
            ])
          )
        );
      }

      this.health = Math.min(this.health + healthRegen, 100);
    }
    if (acc) {
      let healthRegen = acc.healthRegen || 0;

      if (healthRegen > 0 && this.health < 100) {
        this.client?.socket.send(
          packetFactory.serializePacket(
            new Packet(PacketType.HEALTH_CHANGE, [
              this.location.x,
              this.location.y,
              -Math.min(100 - this.health, healthRegen),
              1,
            ])
          )
        );
      }

      this.health = Math.min(this.health + healthRegen, 100);
    }

    if (this.foodHealOverTimeAmt < this.maxFoodHealOverTime) {
      if (100 - this.health > 0) {
        this.client?.socket.send(
          packetFactory.serializePacket(
            new Packet(PacketType.HEALTH_CHANGE, [
              this.location.x,
              this.location.y,
              -Math.min(100 - this.health, this.foodHealOverTime),
              1,
            ])
          )
        );
        this.health = Math.min(this.health + this.foodHealOverTime, 100);
      }

      this.foodHealOverTimeAmt++;
    } else {
      this.foodHealOverTime = -1;
    }

    if (this.padHeal) {
      if (this.health < 100) {
        let healedAmount = Math.min(100 - this.health, this.padHeal);

        this.client?.socket.send(
          packetFactory.serializePacket(
            new Packet(PacketType.HEALTH_CHANGE, [
              this.location.x,
              this.location.y,
              -healedAmount,
              1,
            ])
          )
        );

        this.health = Math.min(this.health + this.padHeal, 100);
      }
    }

    if (this.bleedAmt < this.maxBleedAmt) {
      if (!hat?.poisonRes) this.health -= this.bleedDmg;
      this.bleedAmt++;
    } else {
      this.maxBleedAmt = -1;
    }
  }

  public maxXP = 300;
  public age = 1;

  private _xp: number = 0;

  public get xp(): number {
    return this._xp;
  }

  public set xp(newXP: number) {
    let packetFactory = PacketFactory.getInstance();
    if (this.age >= config.maxAge) return;

    if (newXP >= this.maxXP) {
      this.age++;
      this.maxXP *= 1.2;
      newXP = 0;

      this.client?.socket.send(
        packetFactory.serializePacket(
          new Packet(PacketType.UPGRADES, [
            this.age - this.upgradeAge + 1,
            this.upgradeAge,
          ])
        )
      );
    }

    this.client?.socket.send(
      packetFactory.serializePacket(
        new Packet(PacketType.UPDATE_AGE, [newXP, this.maxXP, this.age])
      )
    );
    this._xp = newXP;
  }

  public dead = false;

  public inTrap = false;

  public autoAttackOn: boolean = false;
  public disableRotation: boolean = false;

  public moveDirection: number | null = null;

  public client: Client | undefined;

  private _attack: boolean = false;
  public lastShoot: number = Date.now() + 1000;

  public lastHitTime: number = 0;
  public gatherAnim: (() => any) | undefined;

  public get isAttacking(): boolean {
    return this._attack || this.autoAttackOn;
  }

  public set isAttacking(val: boolean) {
    this._attack = val;
  }

  updateResources() {
    this.food = this.food;
    this.stone = this.stone;
    this.wood = this.wood;
    this.points = this.points;
    this.health = this.health;
    this.kills = this.kills;
  }

  private _food: number = 0;

  public get food(): number {
    return this._food;
  }

  public set food(newFood: number) {
    let packetFactory = PacketFactory.getInstance();
    this.client?.socket.send(
      packetFactory.serializePacket(
        new Packet(PacketType.UPDATE_STATS, ["food", newFood, 1])
      )
    );
    this._food = newFood;
  }

  private _stone: number = 0;

  public get stone(): number {
    return this._stone;
  }

  public set stone(newStone: number) {
    let packetFactory = PacketFactory.getInstance();
    this.client?.socket.send(
      packetFactory.serializePacket(
        new Packet(PacketType.UPDATE_STATS, ["stone", newStone, 1])
      )
    );
    this._stone = newStone;
  }

  private _points: number = 0;
  public get points(): number {
    return this._points;
  }
  public set points(newPoints: number) {
    let packetFactory = PacketFactory.getInstance();
    this.client?.socket.send(
      packetFactory.serializePacket(
        new Packet(PacketType.UPDATE_STATS, ["points", newPoints, 1])
      )
    );
    this._points = newPoints;
  }

  private scoreSession: number = -1;
  private _score: number = 0;
  public get score(): number {
    return this._score;
  }
  public set score(newScore: number) {
    this._score = newScore;
    if (newScore && this.client?.account) {
      if (this.scoreSession == -1)
        this.scoreSession = this.client.account.scores?.length || 0;
      if (!this.client.account.scores) this.client.account.scores = [];
      this.client.account.scores[this.scoreSession] = newScore;
      setAccount(this.client.account.username, this.client.account);
    }
    this.game.sendLeaderboardUpdates();
  }

  private _wood: number = 0;

  public get wood(): number {
    return this._wood;
  }

  public set wood(newWood: number) {
    let packetFactory = PacketFactory.getInstance();
    this.client?.socket.send(
      packetFactory.serializePacket(
        new Packet(PacketType.UPDATE_STATS, ["wood", newWood, 1])
      )
    );
    this._wood = newWood;
  }

  public get health(): number {
    return this._health;
  }

  public set health(newHealth: number) {
    if (!this.invincible) {
      let packetFactory = PacketFactory.getInstance();

      for (let client of this.game.clients) {
        client?.socket.send(
          packetFactory.serializePacket(
            new Packet(PacketType.HEALTH_UPDATE, [this.id, newHealth])
          )
        );
      }

      this._health = newHealth;

      if (this._health <= 0 && !this.dead) {
        this.game.killPlayer(this);
      }
    }
  }

  constructor(
    sid: number,
    ownerID: string,
    location: Vec2,
    game: Game,
    client: Client | undefined = undefined,
    angle: number = 0,
    name: string = "unknown",
    skinColor: SkinColor = SkinColor.Light2,
    hatID: number = -1,
    accID: number = -1
  ) {
    super(sid, location, angle, new Vec2(0, 0));

    this.name = name;
    this.skinColor = skinColor;

    this.client = client;

    this.ownerID = ownerID;

    this.hatID = hatID;
    this.accID = accID;
    this.game = game;

    console.log(`Added player ${ownerID} with name ${name} and ID ${sid}.`);
  }

  public getWeaponHitTime() {
    let base = getHitTime(this.selectedWeapon);
    let hat = getHat(this.hatID);
    return base * (hat?.atkSpd || 1);
  }

  public useItem(item: ItemType, gameState?: GameState, gameObjectID?: number) {
    let packetFactory = PacketFactory.getInstance();

    if (getPlaceable(item) && gameState && gameObjectID) {
      let placeLimit = getGameObjPlaceLimit(item);
      let placedAmount = gameState.gameObjects.filter(
        (gameObj) =>
          gameObj.isPlayerGameObject() &&
          getGroupID(gameObj.data) === getGroupID(item) &&
          gameObj.ownerSID == this.id
      ).length;
      if (placedAmount >= placeLimit) return;

      let offset = 35 + getScale(item) + (getPlaceOffset(item) || 0);
      let location = this.location.add(
        offset * Math.cos(this.angle),
        offset * Math.sin(this.angle),
        true
      );

      if (
        gameState.gameObjects.filter(
          (o) =>
            o.data == ItemType.Blocker && o.location.distance(location) <= 300
        ).length
      )
        return;
      if (location.y > 6850 && location.y < 7550 && item !== ItemType.Platform)
        return;

      let newGameObject = new GameObject(
        gameObjectID,
        location,
        this.angle,
        getScale(item),
        -1,
        undefined,
        item,
        this.id,
        getGameObjHealth(item),
        getGameObjDamage(item)
      );

      for (let gameObject of gameState.gameObjects) {
        if (collideGameObjects(gameObject, newGameObject)) return false;
      }

      gameState?.gameObjects.push(newGameObject);
      this.client?.socket.send(
        packetFactory.serializePacket(
          new Packet(PacketType.UPDATE_PLACE_LIMIT, [
            getGroupID(item),
            placedAmount + 1,
          ])
        )
      );

      if (this.client && item == ItemType.SpawnPad)
        this.client.spawnPos = location;

      return true;
    }
    if (getHat(this.hatID)?.noEat) return;

    let healedAmount: number;
    switch (item) {
      case ItemType.Cookie:
        if (this.health >= 100) return false;

        healedAmount = Math.min(100 - this.health, 40);

        this.client?.socket.send(
          packetFactory.serializePacket(
            new Packet(PacketType.HEALTH_CHANGE, [
              this.location.x,
              this.location.y,
              -healedAmount,
              1,
            ])
          )
        );

        this.health = Math.min(this.health + 40, 100);
        return true;

      case ItemType.Cheese:
        if (this.health >= 100) return false;

        healedAmount = Math.min(100 - this.health, 30);

        this.client?.socket.send(
          packetFactory.serializePacket(
            new Packet(PacketType.HEALTH_CHANGE, [
              this.location.x,
              this.location.y,
              -healedAmount,
              1,
            ])
          )
        );

        this.foodHealOverTime = 10;
        this.foodHealOverTimeAmt = 0;
        this.maxFoodHealOverTime = 5;

        this.health = Math.min(this.health + 30, 100);
        return true;

      case ItemType.Apple:
        if (this.health >= 100) return false;

        healedAmount = Math.min(100 - this.health, 20);

        this.client?.socket.send(
          packetFactory.serializePacket(
            new Packet(PacketType.HEALTH_CHANGE, [
              this.location.x,
              this.location.y,
              -healedAmount,
              1,
            ])
          )
        );

        this.health = Math.min(this.health + 20, 100);
        return true;
    }
  }

  public getNearbyGameObjects(state: GameState, includeHidden = false) {
    const RADIUS = config.gameObjectNearbyRadius || 1250;

    let gameObjects = [];

    for (let gameObject of state.gameObjects) {
      if (
        eucDistance(
          [this.location.x, this.location.y],
          [gameObject.location.x, gameObject.location.y]
        ) < RADIUS
      ) {
        if (
          !(
            gameObject.isPlayerGameObject() &&
            shouldHideFromEnemy(gameObject.data) &&
            gameObject.isEnemy(this, state.tribes) &&
            !this.client?.seenGameObjects.includes(gameObject.id)
          ) ||
          includeHidden
        ) {
          gameObjects.push(gameObject);
        }
      }
    }

    return gameObjects;
  }

  public lastDeath: number = 0;
  die() {
    let packetFactory = PacketFactory.getInstance();

    this.dead = true;
    this.lastDeath = Date.now();
    this.kills = 0;
    this.weapon = 0;
    this.secondaryWeapon = -1;
    this.selectedWeapon = 0;
    this.primaryWeaponVariant = WeaponVariant.Normal;
    this.primaryWeaponExp = 0;
    this.secondaryWeaponVariant = WeaponVariant.Normal;
    this.secondaryWeaponExp = 0;
    this.age = 1;
    this.xp = 0;
    this.inTrap = false;
    this.buildItem = -1;
    this.autoAttackOn = false;
    this.disableRotation = false;
    this.moveDirection = null;
    this.items = [
      ItemType.Apple,
      ItemType.WoodWall,
      ItemType.Spikes,
      ItemType.Windmill,
    ];

    this.upgradeAge = 2;
    this.maxXP = 300;
    this.kills = 0;
    this.points = 0;
    this.scoreSession = -1;
    this.score = 0;
    this.food = 0;
    this.wood = 0;
    this.stone = 0;

    this.bleedAmt = 0;
    this.maxBleedAmt = -1;

    this.client?.socket.send(
      packetFactory.serializePacket(new Packet(PacketType.DEATH, []))
    );
  }

  move(direction: number) {
    this.moveDirection = direction;
  }

  stopMove() {
    this.moveDirection = null;
  }

  getUpdateData(gameState: GameState, exposeInvis: boolean = false) {
    let leadKills = 0;

    for (let player of gameState.players) {
      if (player.kills > leadKills) {
        leadKills = player.kills;
      }
    }

    return [
      this.id,
      this.location.x,
      this.location.y,
      this.angle,
      this.buildItem,
      this.selectedWeapon,
      this.selectedWeapon == this.weapon
        ? this.primaryWeaponVariant
        : this.secondaryWeaponVariant,
      this.clanName,
      this.isClanLeader ? 1 : 0,
      this.hatID,
      this.accID,
      this.kills === leadKills && this.kills > 0 ? 1 : 0,
      this.layer,
      this.invincible ? 1 : 0,
      this.invisible && exposeInvis ? 0 : 1,
    ];
  }

  getNearbyPlayers(state: GameState) {
    const RADIUS = config.playerNearbyRadius || 1250;

    let players = [];

    for (let player of state.players) {
      if (player !== this && !player.dead) {
        if (
          eucDistance(
            [this.location.x, this.location.y],
            [player.location.x, player.location.y]
          ) < RADIUS
        ) {
          players.push(player);
        }
      }
    }

    return players;
  }
  getNearbyAnimals(state: GameState) {
    const RADIUS = config.playerNearbyRadius || 1250;

    let animals = [];

    for (let animal of state.animals) {
      if (
        eucDistance(
          [this.location.x, this.location.y],
          [animal.location.x, animal.location.y]
        ) < RADIUS
      ) {
        animals.push(animal);
      }
    }

    return animals;
  }
}
