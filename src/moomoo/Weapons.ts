enum WeaponVariant {
  Normal = 0,
  Gold = 1,
  Diamond = 2,
  Ruby = 3,
  Emerald = 4,
  Amethyst = 5,
}

let WeaponVariants: {
  [key: string]: {
    xp: number;
    dmgMult: number;
    structDmgMult: number;
    gatherMult: number;
    poison?: number;
    lifeSteal?: number;
    extraGold?: number;
  };
} = {};
WeaponVariants[WeaponVariant.Normal] = {
  xp: 0,
  dmgMult: 1,
  structDmgMult: 1,
  gatherMult: 1,
};
WeaponVariants[WeaponVariant.Gold] = {
  xp: 3000,
  dmgMult: 1.1,
  structDmgMult: 1.25,
  gatherMult: 1,
};
WeaponVariants[WeaponVariant.Diamond] = {
  xp: 7000,
  dmgMult: 1.18,
  structDmgMult: 1.5,
  gatherMult: 2,
};
WeaponVariants[WeaponVariant.Ruby] = {
  xp: 12000,
  dmgMult: 1.2,
  structDmgMult: 2,
  gatherMult: 2.5,
  poison: 5,
};
WeaponVariants[WeaponVariant.Emerald] = {
  xp: 18000,
  dmgMult: 1.3,
  structDmgMult: 3,
  gatherMult: 3,
  poison: 10,
  lifeSteal: 0.2,
};
WeaponVariants[WeaponVariant.Amethyst] = {
  xp: 25000,
  dmgMult: 1.4,
  structDmgMult: 4,
  gatherMult: 4,
  poison: 13,
  lifeSteal: 0.5,
  extraGold: 1,
};

export { WeaponVariant, WeaponVariants };
