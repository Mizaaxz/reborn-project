import weapons from "../definitions/weapons";
import items from "../definitions/items";
import { ItemType } from "../items/UpgradeItems";

function getUpgrades(age: number): number[] {
  let upgr: ItemType[] = [];
  items.forEach((i) => {
    i.items.forEach((it) => {
      if (it.age == age) upgr.push(it.id);
    });
  });
  return upgr;
}

function getWeaponUpgrades(age: number) {
  return weapons.map((_item, index) => index).filter((item) => weapons[item].age === age);
}

export { getUpgrades, getWeaponUpgrades };
