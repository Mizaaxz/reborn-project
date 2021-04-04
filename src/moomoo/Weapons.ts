enum WeaponVariant {
  Normal = 0,
  Gold = 1,
  Diamond = 2,
  Ruby = 3,
  Emerald = 4,
}

let WeaponVariants: {
  [key: string]: {
    xp: number;
    dmgMult: number;
    structDmgMult: number;
    gatherMult: number;
    poison?: number;
    lifeSteal?: boolean;
  };
} = {};
WeaponVariants[WeaponVariant.Normal] = { xp: 0, dmgMult: 1, structDmgMult: 1, gatherMult: 1 };
WeaponVariants[WeaponVariant.Gold] = { xp: 3000, dmgMult: 1.1, structDmgMult: 1.25, gatherMult: 1 };
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
  lifeSteal: true,
};

export { WeaponVariant, WeaponVariants };
