import { WeaponVariant } from "./moomoo/Weapons";

const setWeaponVariant = function(thisPlayer, variant: any) {
  switch (variant) {
              case "emerald":
              case "em":
              case "e":
                thisPlayer.selectedWeapon === thisPlayer.weapon
                  ? (thisPlayer.primaryWeaponVariant = WeaponVariant.Emerald)
                  : (thisPlayer.secondaryWeaponVariant = WeaponVariant.Emerald);
                break;
                
              case "ruby":
              case "r":
                thisPlayer.selectedWeapon === thisPlayer.weapon
                  ? (thisPlayer.primaryWeaponVariant = WeaponVariant.Ruby)
                  : (thisPlayer.secondaryWeaponVariant = WeaponVariant.Ruby);
                break;

              case "diamond":
              case "dia":
              case "d":
                thisPlayer.selectedWeapon === thisPlayer.weapon
                  ? (thisPlayer.primaryWeaponVariant = WeaponVariant.Diamond)
                  : (thisPlayer.secondaryWeaponVariant = WeaponVariant.Diamond);
                break;

              case "gold":
              case "g":
                thisPlayer.selectedWeapon === thisPlayer.weapon
                  ? (thisPlayer.primaryWeaponVariant = WeaponVariant.Gold)
                  : (thisPlayer.secondaryWeaponVariant = WeaponVariant.Gold);
                break;

              case "normal":
              case "norm":
              case "default":
              case "reset":
                thisPlayer.selectedWeapon === thisPlayer.weapon
                  ? (thisPlayer.primaryWeaponVariant = WeaponVariant.Normal)
                  : (thisPlayer.secondaryWeaponVariant = WeaponVariant.Normal);
                break;

              default:
                return 1;
            }
}
export { setWeaponVariant };
