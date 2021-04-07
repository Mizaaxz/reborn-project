const hats = [
  {
    id: 59,
    name: "Meow :3",
    price: 0,
    scale: 120,
    desc: "For the developer Meow.",
    dontSell: true,
  },
  {
    id: 60,
    name: "Wumpussy",
    price: 0,
    scale: 120,
    desc: "For the artist Thwampus.",
    dontSell: true,
  },
  {
    id: 45,
    name: "Shame!",
    dontSell: true,
    keepOn: true,
    price: 0,
    scale: 120,
    desc: "Hacks are for losers...",
    noEat: true,
  },
  { id: 51, name: "Moo Cap", price: 0, scale: 120, desc: "coolest mooer around" },
  { id: 50, name: "Apple Cap", price: 0, scale: 120, desc: "apple farms remembers" },
  { id: 28, name: "Moo Head", price: 0, scale: 120, desc: "no effect" },
  { id: 29, name: "Pig Head", price: 0, scale: 120, desc: "no effect" },
  { id: 30, name: "Fluff Head", price: 0, scale: 120, desc: "no effect" },
  { id: 36, name: "Pandou Head", price: 0, scale: 120, desc: "no effect" },
  { id: 37, name: "Bear Head", price: 0, scale: 120, desc: "no effect" },
  { id: 38, name: "Monkey Head", price: 0, scale: 120, desc: "no effect" },
  { id: 44, name: "Polar Head", price: 0, scale: 120, desc: "no effect" },
  { id: 35, name: "Fez Hat", price: 0, scale: 120, desc: "no effect" },
  { id: 42, name: "Enigma Hat", price: 0, scale: 120, desc: "join the enigma army" },
  { id: 43, name: "Blitz Hat", price: 0, scale: 120, desc: "hey everybody i'm blitz" },
  { id: 49, name: "Bob XIII Hat", price: 0, scale: 120, desc: "like and subscribe" },
  { id: 57, name: "Pumpkin", price: 50, scale: 120, desc: "Spooooky" },
  { id: 8, name: "Bummle Hat", price: 100, scale: 120, desc: "no effect" },
  { id: 2, name: "Straw Hat", price: 500, scale: 120, desc: "no effect" },
  {
    id: 15,
    name: "Winter Cap",
    price: 600,
    scale: 120,
    desc: "Allows you to move at normal speed in snow.",
    coldM: 1,
  },
  { id: 5, name: "Cowboy Hat", price: 1000, scale: 120, desc: "no effect" },
  { id: 4, name: "Ranger Hat", price: 2000, scale: 120, desc: "no effect" },
  { id: 18, name: "Explorer Hat", price: 2000, scale: 120, desc: "no effect" },
  {
    id: 31,
    name: "Flipper Hat",
    price: 2500,
    scale: 120,
    desc: "Have more control while in water.",
    watrImm: true,
  },
  {
    id: 1,
    name: "Marksman Cap",
    price: 3000,
    scale: 120,
    desc: "Increases arrow speed and range.",
    aMlt: 1.3,
  },
  {
    id: 10,
    name: "Bush Gear",
    price: 3000,
    scale: 160,
    desc: "Allows you to disguise yourself as a bush.",
  },
  {
    id: 48,
    name: "Halo",
    price: 3000,
    scale: 120,
    desc: "Slowly regenerates 1 health every so often.",
    healthRegen: 1,
  },
  {
    id: 6,
    name: "Soldier Helmet",
    price: 4000,
    scale: 120,
    desc: "Reduces damage taken but slows movement.",
    spdMult: 0.94,
    dmgMult: 0.75,
  },
  {
    id: 23,
    name: "Anti Venom Gear",
    price: 4000,
    scale: 120,
    desc: "Makes you immune to poison.",
    poisonRes: 1,
  },
  {
    id: 13,
    name: "Medic Gear",
    price: 5000,
    scale: 110,
    desc: "Slowly regenerates 3 health every so often.",
    healthRegen: 3,
  },
  {
    id: 9,
    name: "Miners Helmet",
    price: 5000,
    scale: 120,
    desc: "Earn 1 extra gold per resource.",
    extraGold: 1,
  },
  {
    id: 32,
    name: "Musketeer Hat",
    price: 5000,
    scale: 120,
    desc: "Reduces cost of projectiles.",
    projCost: 0.5,
  },
  {
    id: 7,
    name: "Bull Helmet",
    price: 6000,
    scale: 120,
    desc: "Increases damage done but drains health.",
    healthRegen: -5,
    dmgMultO: 1.5,
    spdMult: 0.96,
  },
  {
    id: 22,
    name: "Emp Helmet",
    price: 6000,
    scale: 120,
    desc: "Turrets won't attack but you move slower.",
    antiTurret: 1,
    spdMult: 0.7,
  },
  {
    id: 12,
    name: "Booster Hat",
    price: 6000,
    scale: 120,
    desc: "Increases your movement speed.",
    spdMult: 1.16,
  },
  {
    id: 26,
    name: "Barbarian Armor",
    price: 8000,
    scale: 120,
    desc: "Knocks back enemies that attack you.",
    dmgK: 0.6,
  },
  {
    id: 21,
    name: "Plague Mask",
    price: 10000,
    scale: 120,
    desc: "Melee attacks deal poison damage.",
    poisonDmg: 5,
    poisonTime: 6,
  },
  {
    id: 46,
    name: "Bull Mask",
    price: 10000,
    scale: 120,
    desc: "Bulls won't target you unless you attack them.",
    bullRepel: 1,
  },
  {
    id: 14,
    name: "Windmill Hat",
    topSprite: true,
    price: 10000,
    scale: 120,
    desc: "Generates gold while worn.",
    pps: 1.5,
  },
  {
    id: 11,
    name: "Spike Gear",
    topSprite: true,
    price: 10000,
    scale: 120,
    desc: "Deal damage to players that damage you.",
    dmg: 0.45,
  },
  {
    id: 53,
    name: "Turret Gear",
    topSprite: true,
    price: 10000,
    scale: 120,
    desc: "You become a walking turret.",
    turret: { proj: 1, range: 700, rate: 2500 },
    spdMult: 0.7,
  },
  {
    id: 20,
    name: "Samurai Armor",
    price: 12000,
    scale: 120,
    desc: "Increased attack speed and fire rate.",
    atkSpd: 0.78,
  },
  {
    id: 58,
    name: "Dark Knight",
    price: 12000,
    scale: 120,
    desc: "Restores health when you deal damage.",
    healD: 0.4,
  },
  {
    id: 27,
    name: "Scavenger Gear",
    price: 15000,
    scale: 120,
    desc: "Earn double points for each kill.",
    kScrM: 2,
  },
  {
    id: 40,
    name: "Tank Gear",
    price: 15000,
    scale: 120,
    desc: "Increased damage to buildings but slower movement.",
    spdMult: 0.3,
    bDmg: 3.3,
  },
  {
    id: 52,
    name: "Thief Gear",
    price: 15000,
    scale: 120,
    desc: "Steal half of a players gold when you kill them.",
    goldSteal: 0.5,
  },
  {
    id: 55,
    name: "Bloodthirster",
    price: 20000,
    scale: 120,
    desc: "Restore Health when dealing damage, and increased damage.",
    healD: 0.25,
    dmgMultO: 1.2,
  },
  {
    id: 56,
    name: "Assassin Gear",
    price: 20000,
    scale: 120,
    desc: "Go invisible when not moving, can't eat, increased speed.",
    noEat: true,
    spdMult: 1.1,
    invisTimer: 1000,
  },
];
export default hats;
