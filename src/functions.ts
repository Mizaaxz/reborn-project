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
