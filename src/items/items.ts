import weapons from "../definitions/weapons";
import items from "../definitions/items";
import { ItemType } from "./UpgradeItems";
import { WeaponVariant, WeaponVariants } from "../moomoo/Weapons";
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
  Pitchfork = 16,
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

enum WeaponModes {
  None,
  Inspect,
  OneTap,
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

  return baseDamage * WeaponVariants[weaponVariant].dmgMult;
}

function getWeaponGatherAmount(item: Weapons, weaponVariant: WeaponVariant) {
  let weapon = weapons.find((weapon) => weapon.id == item);
  let defaultGather = weapon?.gather || 0;
  return Math.floor(defaultGather * WeaponVariants[weaponVariant].gatherMult);
}

function getItem(id: ItemType) {
  return getItemGroup(id)?.items.find((i) => i.id == id);
}
function getItemGroup(id: ItemType) {
  return items.find((i) => i.items.map((it) => it.id).includes(id));
}

function getItemCost(item: ItemType) {
  let game = getGame();
  if (game?.mode == GameModes.sandbox) return [];
  else return getItem(item)?.req || [];
}

function getPlaceable(item: ItemType) {
  return !!(getItemGroup(item)?.place || false);
}

function getGroupID(item: ItemType) {
  return getItemGroup(item)?.group || 0;
}

function getPrerequisiteItem(item: ItemType) {
  return getItem(item)?.pre;
}

function getPrerequisiteWeapon(weapon: Weapons) {
  return weapons[weapon].pre;
}

function getPlaceOffset(item: ItemType) {
  return getItem(item)?.placeOffset;
}

function getScale(item: ItemType) {
  return getItem(item)?.scale || 0;
}

function hasCollision(item: ItemType) {
  return !getItem(item)?.ignoreCollision;
}

function getPPS(item: ItemType) {
  return getItem(item)?.pps || 0;
}

function getWeaponSpeedMultiplier(weapon: Weapons) {
  return weapons[weapon].spdMult || 1;
}

function getStructureDamage(weapon: Weapons, weaponVariant: WeaponVariant) {
  let weaponData = weapons[weapon];
  return weaponData.dmg
    ? weaponData.dmg * (weaponData.sDmg || 1) * WeaponVariants[weaponVariant].structDmgMult
    : 0;
}

function getGameObjHealth(item: ItemType) {
  return getItem(item)?.health || -1;
}

function getGameObjDamage(item: ItemType) {
  return getItem(item)?.dmg || 0;
}

function getGameObjPlaceLimit(item: ItemType) {
  let game = getGame();
  if (game?.mode == GameModes.sandbox) return Infinity;
  else return getItemGroup(item)?.limit || Infinity;
}

function shouldHideFromEnemy(item: ItemType) {
  return !!getItem(item)?.hideFromEnemy;
}

function getWeaponLength(weapon: Weapons) {
  return weapons[weapon].length;
}

export {
  PrimaryWeapons,
  SecondaryWeapons,
  WeaponModes,
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
  getItem,
  getItemGroup,
};
