import Vec2 from "vec2";
import { GameObjectType } from "./gameobjects";
import Player from "../moomoo/Player";
import Tribe from "../moomoo/Tribes";

export default class GameObject {
  public lastShoot: number = Date.now() + 1000;
  public hitByBoss: number = 0;

  constructor(
    public id: number = 0,
    public location: Vec2 = new Vec2(0, 0),
    public angle: number = 0,
    public scale: number = 1,
    public type: GameObjectType = GameObjectType.Tree,
    public realScale: number = scale,
    public data: any = null,
    public ownerSID: number = -1,
    public health: number = -1,
    public dmg: number = 0,
    public protect: boolean = false
  ) {}

  getData() {
    return [
      this.id,
      this.location.x,
      this.location.y,
      this.angle,
      this.scale,
      this.type,
      this.data,
      this.ownerSID,
    ];
  }

  isPlayerGameObject() {
    //@ts-ignore
    return this.type === -1 && typeof this.data === "number";
  }

  isEnemy(player: Player, tribes: Tribe[]) {
    if (this.ownerSID === player.id) return false;

    for (let tribe of tribes) {
      if (
        tribe.allMemberIDs.includes(player.id) &&
        tribe.allMemberIDs.includes(this.ownerSID)
      )
        return false;
    }

    return true;
  }
}
