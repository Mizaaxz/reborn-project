import { readFileSync } from "fs";

let PORT = 80;

try {
  PORT = Number(String(readFileSync(__dirname + "/../PORT")));
} catch (e) {}

const config = {
  version: "1.15.0b",
  allowedMax:
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890 !@#$%^&*()_+-=[]|:;\\\"',<.>/?`~{}",
  allowedPassword:
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890!@#$%^&*()-_=+`~,<.>;?/|[]{}' ",
  allowedUsername:
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890-_ ",
  alphabet:
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890!@#$%^&*()_-+={}[]|\\\"':;,<.>/?`~",
  badWords: ["fag", "faggot", "nigger", "nigga"],
  featuredYT: [
    {
      name: "Meow",
      link: "https://www.youtube.com/channel/UCWANi1TTqUP1ar4VTlOrqDA",
    },
    {
      name: "123SMG",
      link: "https://www.youtube.com/channel/UCt96Ef3O4OhzWk2LLYb7ShA",
    },
    {
      name: "Dashre",
      link: "https://www.youtube.com/channel/UCgr3LL4BM_xWGMEWSizf1VQ",
    },
  ],
  gameObjectNearbyRadius: 1250,
  gameObjectNearbyRadiusShort: 300,
  maxCPS: "25",
  moderatorPassword: "",
  passwordLength: { min: 8, max: 30 },
  playerNearbyRadius: 1250,
  animalNearbyRadius: 1250,
  port: PORT,
  prefix: "!",
  usernameLength: { min: 4, max: 16 },
  gTribeTagLength: { min: 2, max: 7 },
  gTribeNameLength: { min: 4, max: 20 },
  defaultSpeed: 1.5,
  maxAge: 100,
  mapScale: 20000,
  biomeSize: 0,
  prefixes: [],
  maxSessions: 2,
  maxScore: 10000000,
  gameObjectCount: 750,
};
config.biomeSize = config.mapScale / 3;
export default config;
