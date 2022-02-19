import fs from "fs";
let db = {
  fetch: (key: string) => {
    return require(__dirname + "\\..\\data.json")[key];
  },
  add: (key: string, value: any) => {
    let data = require(__dirname + "\\..\\data.json");
    data[key] = data[key] || 0;
    data[key] += value;
    fs.writeFile(
      __dirname + "\\..\\data.json",
      JSON.stringify(data),
      function () {}
    );
    return data;
  },
  subtract: (key: string, value: any) => {
    let data = require(__dirname + "\\..\\data.json");
    data[key] = data[key] || 0;
    data[key] -= value;
    fs.writeFile(
      __dirname + "\\..\\data.json",
      JSON.stringify(data),
      function () {}
    );
    return data;
  },
  set: (key: string, value: any) => {
    let data = require(__dirname + "\\..\\data.json");
    data[key] = value;
    fs.writeFile(
      __dirname + "\\..\\data.json",
      JSON.stringify(data),
      function () {}
    );
    return data;
  },
  delete: (key: string) => {
    let data = require(__dirname + "\\..\\data.json");
    delete data[key];
    fs.writeFile(
      __dirname + "\\..\\data.json",
      JSON.stringify(data),
      function () {}
    );
    return data;
  },
  all: () => {
    let data = require(__dirname + "\\..\\data.json");
    return data;
  },
  get: Function(),
  sub: Function(),
};
db.get = db.fetch;
db.sub = db.subtract;
export default db;
