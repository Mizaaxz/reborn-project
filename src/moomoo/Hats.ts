import hats from "../../definitions/hats.json";

function getHat(id: number) {
  return hats.find((hat) => hat.id == id);
}

export { getHat };
