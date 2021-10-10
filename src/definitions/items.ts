import { GameObjectType } from "../gameobjects/gameobjects";
import { ItemType } from "../items/UpgradeItems";
import { Layer, ProjectileType } from "../projectiles/projectiles";

type ItemsMap = {
  id: ItemType;
  age: number;
  pre?: ItemType;
  name: string;
  desc: string;
  req: (string | number)[];
  scale: number;
  holdOffset: number;
  placeOffset?: number;
  health?: number;
  dmg?: number;
  pDmg?: number;
  spritePadding?: number;
  turnSpeed?: number;
  pps?: number;
  iconLineMult?: number;
  type?: GameObjectType;
  colDiv?: number;
  trap?: boolean;
  ignoreCollision?: boolean;
  hideFromEnemy?: boolean;
  boostSpeed?: number;
  doUpdate?: boolean;
  projectile?: ProjectileType.Turret;
  shootRange?: number;
  shootRate?: number;
  zIndex?: number;
  healCol?: number;
  spawnPoint?: boolean;
  blocker?: number;
  teleport?: boolean;
  bossImmune?: boolean;
};
type ItemMap = { group: number; place: boolean; limit?: number; layer: Layer; items: ItemsMap[] };
const items: ItemMap[] = [
  {
    group: 0,
    place: false,
    layer: Layer.Player,
    items: [
      {
        id: ItemType.Apple,
        age: 1,
        name: "apple",
        desc: "restores 20 health when consumed",
        req: ["food", 10],
        scale: 22,
        holdOffset: 15,
      },
      {
        id: ItemType.Cookie,
        age: 3,
        pre: ItemType.Apple,
        name: "cookie",
        desc: "restores 40 health when consumed",
        req: ["food", 15],
        scale: 27,
        holdOffset: 15,
      },
      {
        id: ItemType.Cheese,
        age: 7,
        pre: ItemType.Cookie,
        name: "cheese",
        desc: "restores 30 health and another 50 over 5 seconds",
        req: ["food", 25],
        scale: 27,
        holdOffset: 15,
      },
    ],
  },
  {
    group: 1,
    place: true,
    limit: 30,
    layer: Layer.Player,
    items: [
      {
        id: ItemType.WoodWall,
        age: 1,
        name: "wood wall",
        desc: "provides protection for your village",
        req: ["wood", 10],
        //projDmg: true,
        health: 380,
        scale: 50,
        holdOffset: 20,
        placeOffset: -5,
      },
      {
        id: ItemType.StoneWall,
        age: 3,
        pre: ItemType.WoodWall,
        name: "stone wall",
        desc: "provides improved protection for your village",
        req: ["stone", 25],
        health: 900,
        scale: 50,
        holdOffset: 20,
        placeOffset: -5,
      },
      {
        id: ItemType.CastleWall,
        age: 7,
        pre: ItemType.StoneWall,
        name: "castle wall",
        desc: "provides powerful protection for your village",
        req: ["stone", 35],
        health: 1500,
        scale: 52,
        holdOffset: 20,
        placeOffset: -5,
      },
    ],
  },
  {
    group: 2,
    place: true,
    limit: 15,
    layer: Layer.Player,
    items: [
      {
        id: ItemType.Spikes,
        age: 1,
        name: "spikes",
        desc: "damages enemies when they touch them",
        req: ["wood", 20, "stone", 5],
        health: 400,
        dmg: 20,
        scale: 49,
        spritePadding: -23,
        holdOffset: 8,
        placeOffset: -5,
      },
      {
        id: ItemType.GreaterSpikes,
        age: 5,
        pre: ItemType.Spikes,
        name: "greater spikes",
        desc: "damages enemies when they touch them",
        req: ["wood", 30, "stone", 10],
        health: 500,
        dmg: 35,
        scale: 52,
        spritePadding: -23,
        holdOffset: 8,
        placeOffset: -5,
      },
      {
        id: ItemType.PoisonSpikes,
        age: 9,
        pre: ItemType.GreaterSpikes,
        name: "poison spikes",
        desc: "poisons enemies when they touch them",
        req: ["wood", 35, "stone", 15],
        health: 600,
        dmg: 30,
        pDmg: 5,
        scale: 52,
        spritePadding: -23,
        holdOffset: 8,
        placeOffset: -5,
      },
      {
        id: ItemType.SpinningSpikes,
        age: 9,
        pre: ItemType.GreaterSpikes,
        name: "spinning spikes",
        desc: "damages enemies when they touch them",
        req: ["wood", 30, "stone", 20],
        health: 500,
        dmg: 45,
        turnSpeed: 0.003,
        scale: 52,
        spritePadding: -23,
        holdOffset: 8,
        placeOffset: -5,
      },
    ],
  },
  {
    group: 3,
    place: true,
    limit: 7,
    layer: Layer.Platform,
    items: [
      {
        id: ItemType.Windmill,
        age: 1,
        name: "windmill",
        desc: "generates gold over time",
        req: ["wood", 50, "stone", 10],
        health: 400,
        pps: 1,
        turnSpeed: 0.0016,
        spritePadding: 25,
        iconLineMult: 12,
        scale: 45,
        holdOffset: 20,
        placeOffset: 5,
      },
      {
        id: ItemType.FasterWindmill,
        age: 5,
        pre: ItemType.Windmill,
        name: "faster windmill",
        desc: "generates more gold over time",
        req: ["wood", 60, "stone", 20],
        health: 500,
        pps: 1.5,
        turnSpeed: 0.0025,
        spritePadding: 25,
        iconLineMult: 12,
        scale: 47,
        holdOffset: 20,
        placeOffset: 5,
      },
      {
        id: ItemType.PowerMill,
        age: 8,
        pre: ItemType.FasterWindmill,
        name: "power mill",
        desc: "generates more gold over time",
        req: ["wood", 100, "stone", 50],
        health: 800,
        pps: 2,
        turnSpeed: 0.005,
        spritePadding: 25,
        iconLineMult: 12,
        scale: 47,
        holdOffset: 20,
        placeOffset: 5,
      },
    ],
  },
  {
    group: 4,
    place: true,
    limit: 1,
    layer: Layer.Player,
    items: [
      {
        id: ItemType.Mine,
        age: 5,
        type: GameObjectType.Mine,
        name: "mine",
        desc: "allows you to mine stone",
        req: ["wood", 20, "stone", 100],
        iconLineMult: 12,
        scale: 65,
        holdOffset: 20,
        placeOffset: 0,
      },
    ],
  },
  {
    group: 11,
    place: true,
    limit: 2,
    layer: Layer.Player,
    items: [
      {
        id: ItemType.Sapling,
        age: 5,
        type: GameObjectType.Tree,
        name: "sapling",
        desc: "allows you to farm wood",
        req: ["wood", 150],
        iconLineMult: 12,
        colDiv: 0.5,
        scale: 110,
        holdOffset: 50,
        placeOffset: -15,
      },
    ],
  },
  {
    group: 5,
    place: true,
    limit: 6,
    layer: Layer.Pad,
    items: [
      {
        id: ItemType.PitTrap,
        age: 4,
        name: "pit trap",
        desc: "pit that traps enemies if they walk over it",
        req: ["wood", 30, "stone", 30],
        trap: true,
        ignoreCollision: true,
        hideFromEnemy: true,
        health: 500,
        colDiv: 0.2,
        scale: 50,
        holdOffset: 20,
        placeOffset: -5,
      },
    ],
  },
  {
    group: 6,
    place: true,
    limit: 12,
    layer: Layer.Pad,
    items: [
      {
        id: ItemType.BoostPad,
        age: 4,
        name: "boost pad",
        desc: "provides boost when stepped on",
        req: ["stone", 20, "wood", 5],
        ignoreCollision: true,
        boostSpeed: 1.5,
        health: 150,
        colDiv: 0.7,
        scale: 45,
        holdOffset: 20,
        placeOffset: -5,
        bossImmune: true,
      },
    ],
  },
  {
    group: 7,
    place: true,
    limit: 2,
    layer: Layer.Platform,
    items: [
      {
        id: ItemType.Turret,
        age: 7,
        doUpdate: true,
        name: "turret",
        desc: "defensive structure that shoots at enemies",
        req: ["wood", 200, "stone", 150],
        health: 800,
        projectile: ProjectileType.Turret,
        shootRange: 700,
        shootRate: 2200,
        scale: 43,
        holdOffset: 20,
        placeOffset: -5,
      },
    ],
  },
  {
    group: 8,
    place: true,
    limit: 12,
    layer: Layer.Platform,
    items: [
      {
        id: ItemType.Platform,
        age: 7,
        name: "platform",
        desc: "platform to shoot over walls and cross over water",
        req: ["wood", 20],
        ignoreCollision: true,
        zIndex: 1,
        health: 300,
        scale: 43,
        holdOffset: 20,
        placeOffset: -5,
      },
    ],
  },
  {
    group: 9,
    place: true,
    limit: 4,
    layer: Layer.Pad,
    items: [
      {
        id: ItemType.HealingPad,
        age: 7,
        name: "healing pad",
        desc: "standing on it will slowly heal you",
        req: ["wood", 30, "food", 10],
        ignoreCollision: true,
        healCol: 15,
        health: 400,
        colDiv: 0.7,
        scale: 45,
        holdOffset: 20,
        placeOffset: -5,
      },
    ],
  },
  {
    group: 10,
    place: true,
    limit: 1,
    layer: Layer.Pad,
    items: [
      {
        id: ItemType.SpawnPad,
        age: 9,
        name: "spawn pad",
        desc: "you will spawn here when you die but it will dissapear",
        req: ["wood", 100, "stone", 100],
        health: 400,
        ignoreCollision: true,
        spawnPoint: true,
        scale: 45,
        holdOffset: 20,
        placeOffset: -5,
      },
    ],
  },
  {
    group: 12,
    place: true,
    limit: 3,
    layer: Layer.Pad,
    items: [
      {
        id: ItemType.Blocker,
        age: 7,
        name: "blocker",
        desc: "blocks building in radius",
        req: ["wood", 30, "stone", 25],
        ignoreCollision: true,
        blocker: 300,
        health: 400,
        colDiv: 0.7,
        scale: 45,
        holdOffset: 20,
        placeOffset: -5,
      },
    ],
  },
  {
    group: 13,
    place: true,
    limit: 2,
    layer: Layer.Pad,
    items: [
      {
        id: ItemType.Teleporter,
        age: 7,
        name: "teleporter",
        desc: "teleports you to a random point on the map",
        req: ["wood", 60, "stone", 60],
        ignoreCollision: true,
        teleport: true,
        health: 200,
        colDiv: 0.7,
        scale: 45,
        holdOffset: 20,
        placeOffset: -5,
        bossImmune: true,
      },
    ],
  },
];
export default items;
