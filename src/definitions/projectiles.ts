const projectiles = [
  {
    indx: 0,
    layer: 0,
    src: "arrow_1",
    dmg: 25,
    speed: 1.6,
    scale: 103,
    range: 1000,
    woodCost: 4,
  }, // bow
  {
    indx: 1,
    layer: 1,
    dmg: 25,
    scale: 20,
  }, // turret
  {
    indx: 0,
    layer: 0,
    src: "arrow_1",
    dmg: 35,
    speed: 2.5,
    scale: 103,
    range: 1200,
    woodCost: 5,
  }, // crossbow
  {
    indx: 0,
    layer: 0,
    src: "arrow_1",
    dmg: 30,
    speed: 2,
    scale: 103,
    range: 1200,
    woodCost: 10,
  }, // repeater
  {
    indx: 0,
    layer: 0,
    src: "bullet_1",
    dmg: 16,
    speed: 3,
    scale: 120,
    range: 500,
    stoneCost: 15,
  }, // shotgun
  {
    indx: 0,
    layer: 0,
    src: "bullet_1",
    dmg: 50,
    speed: 3.6,
    scale: 160,
    range: 1400,
    stoneCost: 10,
  }, // musket
];
export default projectiles;
