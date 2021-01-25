import { WeaponVariant } from "./moomoo/Weapons";
const setWeaponVariant = function (player: any, variant: any) {
  switch (variant) {
    case "emerald":
    case "em":
    case "e":
      player.selectedWeapon === player.weapon
        ? (player.primaryWeaponVariant = WeaponVariant.Emerald)
        : (player.secondaryWeaponVariant = WeaponVariant.Emerald);
      break;

    case "ruby":
    case "r":
      player.selectedWeapon === player.weapon
        ? (player.primaryWeaponVariant = WeaponVariant.Ruby)
        : (player.secondaryWeaponVariant = WeaponVariant.Ruby);
      break;

    case "diamond":
    case "dia":
    case "d":
      player.selectedWeapon === player.weapon
        ? (player.primaryWeaponVariant = WeaponVariant.Diamond)
        : (player.secondaryWeaponVariant = WeaponVariant.Diamond);
      break;

    case "gold":
    case "g":
      player.selectedWeapon === player.weapon
        ? (player.primaryWeaponVariant = WeaponVariant.Gold)
        : (player.secondaryWeaponVariant = WeaponVariant.Gold);
      break;

    case "normal":
    case "norm":
    case "default":
    case "reset":
      player.selectedWeapon === player.weapon
        ? (player.primaryWeaponVariant = WeaponVariant.Normal)
        : (player.secondaryWeaponVariant = WeaponVariant.Normal);
      break;

    default:
      return 1;
  }
  return 0;
};
export { setWeaponVariant };
