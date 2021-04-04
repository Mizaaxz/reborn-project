import Vec2 from "vec2";
import animals from "../definitions/animals";
import Entity from "./Entity";
import { getGame } from "./Game";

export default class Animal extends Entity {
  public name: string = "Steph";
  public type: number = 0;
  public health: number;

  public lastDot = 0;
  public bleedDmg = 5;
  public bleedAmt = 0;
  public maxBleedAmt = -1;

  constructor(sid: number, location: Vec2, type: number, name: string) {
    super(sid, location, 0, new Vec2(0, 0));

    this.name = name;
    this.type = type;
    this.health = animals.find((a) => a.id == this.type)?.health || 100;
  }

  die() {
    let game = getGame();
    if (game) {
      game.state.animals.splice(game.state.animals.indexOf(this), 1);
    }
  }

  public damageOverTime() {
    if (this.bleedAmt < this.maxBleedAmt) {
      this.health -= this.bleedDmg;
      this.bleedAmt++;
    } else {
      this.maxBleedAmt = -1;
    }
  }
}
