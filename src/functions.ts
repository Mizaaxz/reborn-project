import Player from "./moomoo/Player";
import { WeaponVariant, WeaponVariants } from "./moomoo/Weapons";
const setWeaponVariant = function (player: Player, variant: any) {
  let wv = WeaponVariant.Normal;
  switch (variant) {
    case "amethyst":
    case "am":
    case "a":
      wv = WeaponVariant.Amethyst;
      break;
    case "emerald":
    case "em":
    case "e":
      wv = WeaponVariant.Emerald;
      break;
    case "ruby":
    case "r":
      wv = WeaponVariant.Ruby;
      break;
    case "diamond":
    case "dia":
    case "d":
      wv = WeaponVariant.Diamond;
      break;
    case "gold":
    case "g":
      wv = WeaponVariant.Gold;
      break;
  }
  player.selectedWeapon === player.weapon
    ? (player.primaryWeaponExp = WeaponVariants[wv].xp)
    : (player.secondaryWeaponExp = WeaponVariants[wv].xp);
};
export { setWeaponVariant };

const labels = [
  {
    abbrev: "y",
    value: 31536000000,
  },
  {
    abbrev: "mo",
    value: 2592000000,
  },
  {
    abbrev: "w",
    value: 604800000,
  },
  {
    abbrev: "d",
    value: 86400000,
  },
  {
    abbrev: "h",
    value: 3600000,
  },
  {
    abbrev: "m",
    value: 60000,
  },
  {
    abbrev: "s",
    value: 1000,
  },
  {
    abbrev: "ms",
    value: 1,
  },
];

export function timeFormat(ms: number): string {
  const units = [];
  let tLeft = ms;
  for (const label of labels) {
    const newUnit = { num: Math.floor(tLeft / label.value), unit: label };
    if (newUnit.num != 0 || (units.length == 0 && label.value == 1)) {
      units.push(newUnit);
      tLeft = tLeft % label.value;
    }
  }
  return units
    .slice(0, 3)
    .map((u) => u.num + u.unit.abbrev)
    .join("");
}
