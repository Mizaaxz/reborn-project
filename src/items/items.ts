import weapons from "../definitions/weapons";
import items from "../definitions/items";
import { ItemType } from "./UpgradeItems";
import { WeaponVariant } from "../moomoo/Weapons";
import { getGame } from "../moomoo/Game";
import { GameModes } from "../moomoo/GameMode";

enum PrimaryWeapons {
  ToolHammer = 0,
  Axe = 1,
  Sword = 3,
  Polearm = 5,
  Bat = 6,
  Daggers = 7,
  Stick = 8,
  Katana = 4,
  GreatAxe = 2,
}

enum SecondaryWeapons {
  GreatHammer = 10,
  Shield,
  Crossbow = 12,
  RepeaterCrossbow = 13,
  McGrabby = 14,
  Musket = 15,
  Bow = 9,
}

interface AttackDetails {
  kbMultiplier: number;
  attackRange: number;
}

const Weapons = {
  ...PrimaryWeapons,
  ...SecondaryWeapons,
};

type Weapons = PrimaryWeapons | SecondaryWeapons;

function getHitTime(weapon: Weapons) {
  let speed = weapons[weapon].speed || -1;
  if (speed != -1) speed += 150;
  return speed;
}

function isRangedWeapon(weapon: Weapons) {
  return Object.keys(weapons[weapon]).includes("projectile");
}

function getProjectileType(weapon: Weapons) {
  let projType = weapons[weapon].projectile;
  if (typeof projType == "undefined") return -1;

  return projType;
}

function getRecoil(weapon: Weapons) {
  return weapons[weapon].rec || 0;
}

function getWeaponAttackDetails(item: Weapons): AttackDetails {
  let weapon = weapons.find((weapon) => weapon.id == item);
  return { kbMultiplier: weapon?.knock || 1, attackRange: weapon?.range || 10 };
}

function getWeaponDamage(item: Weapons, weaponVariant: WeaponVariant) {
  let weapon = weapons.find((weapon) => weapon.id == item);
  let baseDamage = weapon?.dmg || 0;

  switch (weaponVariant) {
    case WeaponVariant.Normal:
      return baseDamage;
    case WeaponVariant.Gold:
      return baseDamage * 1.1;
    case WeaponVariant.Diamond:
    case WeaponVariant.Ruby:
      return baseDamage * 1.18;
    case WeaponVariant.Emerald:
      return baseDamage * 1.3;
  }
}

function getWeaponGatherAmount(item: Weapons, weaponVariant: WeaponVariant) {
  let weapon = weapons.find((weapon) => weapon.id == item);
  let defaultGather = weapon?.gather || 0;
  switch (weaponVariant) {
    case WeaponVariant.Normal:
    case WeaponVariant.Gold:
    case WeaponVariant.Diamond:
    case WeaponVariant.Ruby:
      return defaultGather;
    case WeaponVariant.Emerald:
      return defaultGather * 2;
  }
}

function getItemCost(item: ItemType) {
  let game = getGame();
  if (game?.mode == GameModes.sandbox) return [];
  else return items[item].req;
}

function getPlaceable(item: ItemType) {
  return !!items[item].group.place;
}

function getGroupID(item: ItemType) {
  return items[item].group.id;
}

function getPrerequisiteItem(item: ItemType) {
  return items[item].pre;
}

function getPrerequisiteWeapon(weapon: Weapons) {
  return weapons[weapon].pre;
}

function getPlaceOffset(item: ItemType) {
  return items[item].placeOffset;
}

function getScale(item: ItemType) {
  return items[item].scale;
}

function hasCollision(item: ItemType) {
  return !items[item].ignoreCollision;
}

function getPPS(item: ItemType) {
  return items[item].pps || 0;
}

function getWeaponSpeedMultiplier(weapon: Weapons) {
  return weapons[weapon].spdMult || 1;
}

function getStructureDamage(weapon: Weapons, weaponVariant: WeaponVariant) {
  let weaponData = weapons[weapon];

  switch (weaponVariant) {
    case WeaponVariant.Normal:
    case WeaponVariant.Gold:
    case WeaponVariant.Diamond:
    case WeaponVariant.Ruby:
      if (weaponData.dmg) {
        if (weaponData.sDmg) return weaponData.dmg * weaponData.sDmg;

        return weaponData.dmg;
      }
    case WeaponVariant.Emerald:
      if (weaponData.dmg) {
        if (weaponData.sDmg) return weaponData.dmg * weaponData.sDmg * 2;

        return weaponData.dmg * 2;
      }
  }

  return 0;
}

function getGameObjHealth(item: ItemType) {
  return items[item].health || -1;
}

function getGameObjDamage(item: ItemType) {
  return items[item].dmg || 0;
}

function getGameObjPlaceLimit(item: ItemType) {
  let game = getGame();
  if (game?.mode == GameModes.sandbox) return Infinity;
  else return items[item].group.limit || Infinity;
}

function shouldHideFromEnemy(item: ItemType) {
  return !!items[item].hideFromEnemy;
}

function getWeaponLength(weapon: Weapons) {
  return weapons[weapon].length;
}

export {
  PrimaryWeapons,
  SecondaryWeapons,
  getHitTime,
  Weapons,
  getWeaponAttackDetails,
  getWeaponDamage,
  getItemCost,
  getPlaceable,
  getPlaceOffset,
  getScale,
  getWeaponGatherAmount,
  getPrerequisiteItem,
  getGroupID,
  getPrerequisiteWeapon,
  getWeaponSpeedMultiplier,
  hasCollision,
  getStructureDamage,
  getGameObjHealth,
  getGameObjDamage,
  getGameObjPlaceLimit,
  shouldHideFromEnemy,
  getPPS,
  isRangedWeapon,
  getProjectileType,
  getWeaponLength,
  getRecoil,
};
