import hats from "../definitions/hats";

function getHat(id: number) {
  return hats.find((hat) => hat.id == id);
}

export { getHat };
