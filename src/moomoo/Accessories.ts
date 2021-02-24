import accessories from "../definitions/accessories";

function getAccessory(id: number) {
  return accessories.find((acc) => acc.id == id);
}

export { getAccessory };
