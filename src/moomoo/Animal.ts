import Vec2 from "vec2";
import animals from "../definitions/animals";
import Entity from "./Entity";
import { getGame } from "../game/Game";
import GameState from "../game/GameState";
import { Animals, eucDistance } from "./util";
import config from "../config";

export default class Animal extends Entity {
  public name: string = "Steph";
  public type: Animals = 0;
  public moving: boolean = false;
  public data: { [key: string]: any };
  public runTimer: NodeJS.Timeout | undefined;
  private _health: number;
  public get health(): number {
    return this._health;
  }

  public set health(newHealth: number) {
    this._health = newHealth;

    if (this._health <= 0) {
      getGame()?.killAnimal(this);
    }
  }

  public lastDot = 0;
  public bleedDmg = 5;
  public bleedAmt = 0;
  public maxBleedAmt = -1;
  public padHeal = 0;
  public spikeHit = 0;
  public layer = 0;
  public size = 30;
  public inTrap = false;

  constructor(sid: number, location: Vec2, type: number, name: string) {
    super(sid, location, 0, new Vec2(0, 0));

    this.name = name;
    this.type = type;
    this._health = animals.find((a) => a.id == this.type)?.health || 100;
    this.data = animals.find((a) => a.id == this.type) || {};
    this.size = Math.floor((this.data.scale || 0) / 1.5) || 30;

    let a = this;
    this.moveRandomly = setInterval(function () {
      if (a.moving) return;
      a.runFrom(a.location.add(Math.random() - 0.5, Math.random() - 0.5, true));
    }, 6000);
  }

  private _attack: boolean = false;

  public lastHitTime: number = 0;
  public gatherAnim: (() => any) | undefined;

  public get isAttacking(): boolean {
    return this._attack;
  }

  public set isAttacking(val: boolean) {
    this._attack = val;
  }

  public moveRandomly: NodeJS.Timeout;
  die() {
    let game = getGame();
    if (game) {
      game.state.animals.splice(game.state.animals.indexOf(this), 1);
    }
    clearInterval(this.moveRandomly);
  }

  public damageOverTime() {
    if (this.bleedAmt < this.maxBleedAmt) {
      this.health -= this.bleedDmg;
      this.bleedAmt++;
    } else {
      this.maxBleedAmt = -1;
    }
  }

  getNearbyPlayers(state: GameState, range?: number) {
    const RADIUS = range || config.playerNearbyRadius || 1250;

    let players = [];

    for (let player of state.players) {
      if (!player.dead) {
        if (
          eucDistance([this.location.x, this.location.y], [player.location.x, player.location.y]) <
          RADIUS
        ) {
          players.push(player);
        }
      }
    }

    return players;
  }
  getNearbyAnimals(state: GameState) {
    const RADIUS = config.animalNearbyRadius || 1250;

    let animals = [];

    for (let animal of state.animals) {
      if (animal !== this) {
        if (
          eucDistance([this.location.x, this.location.y], [animal.location.x, animal.location.y]) <
          RADIUS
        ) {
          animals.push(animal);
        }
      }
    }

    return animals;
  }

  public getNearbyGameObjects(state: GameState) {
    const RADIUS = config.gameObjectNearbyRadius || 1250;

    let gameObjects = [];

    for (let gameObject of state.gameObjects) {
      if (
        eucDistance(
          [this.location.x, this.location.y],
          [gameObject.location.x, gameObject.location.y]
        ) < RADIUS
      ) {
        gameObjects.push(gameObject);
      }
    }

    return gameObjects;
  }

  runFrom(point: Vec2) {
    if (this.data.static) return;
    if (this.runTimer) clearTimeout(this.runTimer);

    this.angle = Math.atan2(this.location.y - point.y, this.location.x - point.x);
    this.moving = true;

    let anim = this;
    this.runTimer = setTimeout(function () {
      anim.moving = false;
    }, 2000);
  }
  runTo(point: Vec2) {
    if (this.data.static) return;
    if (this.runTimer) clearTimeout(this.runTimer);

    this.angle = Math.atan2(point.y - this.location.y, point.x - this.location.x);
    this.moving = true;

    let anim = this;
    this.runTimer = setTimeout(function () {
      anim.moving = false;
    }, 1000);
  }
  stopRunning() {
    if (this.runTimer) clearTimeout(this.runTimer);
    this.moving = false;
  }
}
