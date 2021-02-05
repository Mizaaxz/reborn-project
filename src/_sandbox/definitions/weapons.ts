const weapons = [
  {
    id: 0,
    type: 0,
    name: "Tool Hammer",
    desc: "The tool for gathering all resources.",
    src: "hammer_1",
    length: 140,
    width: 140,
    xOff: -3,
    yOff: 18,
    dmg: 25,
    range: 65,
    gather: 1,
    speed: 300,
  },
  {
    id: 1,
    type: 0,
    age: 2,
    name: "Hand Axe",
    desc: "Gathers 2 resources instead of 1.",
    src: "axe_1",
    length: 140,
    width: 140,
    xOff: 3,
    yOff: 24,
    dmg: 30,
    spdMult: 1,
    range: 70,
    gather: 2,
    speed: 400,
  },
  {
    id: 2,
    type: 0,
    age: 8,
    pre: 1,
    name: "Great Axe",
    desc: "Deals more damage and gathers 4 resources.",
    src: "great_axe_1",
    length: 140,
    width: 140,
    xOff: -8,
    yOff: 25,
    dmg: 35,
    spdMult: 1,
    range: 75,
    gather: 4,
    speed: 400,
  },
  {
    id: 3,
    type: 0,
    age: 2,
    name: "Short Sword",
    desc: "Increased attack power, but slower move speed.",
    src: "sword_1",
    iPad: 1.3,
    length: 130,
    width: 210,
    xOff: -8,
    yOff: 46,
    dmg: 35,
    spdMult: 0.85,
    range: 110,
    gather: 1,
    speed: 300,
  },
  {
    id: 4,
    type: 0,
    age: 8,
    pre: 3,
    name: "Katana",
    desc: "Greater range and damage.",
    src: "samurai_1",
    iPad: 1.3,
    length: 130,
    width: 210,
    xOff: -8,
    yOff: 59,
    dmg: 40,
    spdMult: 0.8,
    range: 118,
    gather: 1,
    speed: 300,
  },
  {
    id: 5,
    type: 0,
    age: 2,
    name: "Polearm",
    desc: "Long range melee weapon.",
    src: "spear_1",
    iPad: 1.3,
    length: 130,
    width: 210,
    xOff: -8,
    yOff: 53,
    dmg: 45,
    knock: 0.2,
    spdMult: 0.82,
    range: 142,
    gather: 1,
    speed: 700,
  },
  {
    id: 6,
    type: 0,
    age: 2,
    name: "Bat",
    desc: "Faster, long range melee weapon.",
    src: "bat_1",
    iPad: 1.3,
    length: 110,
    width: 180,
    xOff: -8,
    yOff: 53,
    dmg: 20,
    knock: 0.7,
    range: 110,
    gather: 1,
    speed: 300,
  },
  {
    id: 7,
    type: 0,
    age: 2,
    name: "Daggers",
    desc: "Super fast short ranged weapon.",
    src: "dagger_1",
    iPad: 0.8,
    length: 110,
    width: 110,
    xOff: 18,
    yOff: 0,
    dmg: 20,
    knock: 0.1,
    range: 65,
    gather: 1,
    hitSlow: 0.1,
    spdMult: 1.13,
    speed: 100,
  },
  {
    id: 8,
    type: 0,
    age: 2,
    name: "Stick",
    desc: "Great for gathering, but very weak.",
    src: "stick_1",
    length: 140,
    width: 140,
    xOff: 3,
    yOff: 24,
    dmg: 1,
    spdMult: 1,
    range: 70,
    gather: 7,
    speed: 400,
  },
  {
    id: 9,
    type: 1,
    age: 6,
    name: "Hunting Bow",
    desc: "A bow used for ranged combat and hunting.",
    src: "bow_1",
    req: ["wood", 4],
    length: 120,
    width: 120,
    xOff: -6,
    yOff: 0,
    projectile: 0,
    spdMult: 0.75,
    speed: 600,
  },
  {
    id: 10,
    type: 1,
    age: 6,
    name: "Great Hammer",
    desc: "A hammer used for destroying structures quickly.",
    src: "great_hammer_1",
    length: 140,
    width: 140,
    xOff: -9,
    yOff: 25,
    dmg: 10,
    spdMult: 0.88,
    range: 75,
    sDmg: 7.5,
    gather: 1,
    speed: 400,
  },
  {
    id: 11,
    type: 1,
    age: 6,
    name: "Wooden Shield",
    desc: "Blocks projectiles and reduces melee damage. (currently broken)",
    src: "shield_1",
    length: 120,
    width: 120,
    shield: 0.2,
    xOff: 6,
    yOff: 0,
    spdMult: 0.7,
  },
  {
    id: 12,
    type: 1,
    age: 8,
    pre: 9,
    name: "Crossbow",
    desc: "Deals more damage and has a greater range.",
    src: "crossbow_1",
    req: ["wood", 5],
    aboveHand: true,
    armS: 0.75,
    length: 120,
    width: 120,
    xOff: -4,
    yOff: 0,
    projectile: 2,
    spdMult: 0.7,
    speed: 700,
  },
  {
    id: 13,
    type: 1,
    age: 9,
    pre: 12,
    name: "Repeater Crossbow",
    desc: "Higher firerate, but reduced damage.",
    src: "crossbow_2",
    req: ["wood", 10],
    aboveHand: true,
    armS: 0.75,
    length: 120,
    width: 120,
    xOff: -4,
    yOff: 0,
    projectile: 3,
    spdMult: 0.7,
    speed: 230,
  },
  {
    id: 14,
    type: 1,
    age: 6,
    name: "McGrabby",
    desc: "Steals gold from enemies.",
    src: "grab_1",
    length: 130,
    width: 210,
    xOff: -8,
    yOff: 53,
    dmg: 0,
    steal: 250,
    knock: 0.2,
    spdMult: 1.05,
    range: 125,
    gather: 0,
    speed: 700,
  },
  {
    id: 15,
    type: 1,
    age: 9,
    pre: 12,
    name: "Musket",
    desc: "Slower firerate, but higher damage and range.",
    src: "musket_1",
    req: ["stone", 10],
    aboveHand: true,
    rec: 0.35,
    armS: 0.6,
    hndS: 0.3,
    hndD: 1.6,
    length: 205,
    width: 205,
    xOff: 25,
    yOff: 0,
    projectile: 5,
    hideProjectile: true,
    spdMult: 0.6,
    speed: 1500,
  },
];
export default weapons;
