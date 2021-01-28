import fs from "fs";
let db = {
  fetch: (key: string) => {
    return require("../db.json")[key];
  },
  add: (key: string, value: any) => {
    let data = require("../db.json");
    data[key] = data[key] || 0;
    data[key] += value;
    fs.writeFileSync("../db.json", JSON.stringify(data));
    return data;
  },
  subtract: (key: string, value: any) => {
    let data = require("../db.json");
    data[key] = data[key] || 0;
    data[key] -= value;
    fs.writeFileSync("../db.json", JSON.stringify(data));
    return data;
  },
  set: (key: string, value: any) => {
    let data = require("../db.json");
    data[key] = value;
    fs.writeFileSync("../db.json", JSON.stringify(data));
    return data;
  },
  delete: (key: string) => {
    let data = require("../db.json");
    delete data[key];
    fs.writeFileSync("../db.json", JSON.stringify(data));
    return data;
  },
  all: () => {
    let data = require("../db.json");
    return data;
  },
  get: Function(),
  sub: Function(),
};
db.get = db.set;
db.sub = db.subtract;
export default db;
