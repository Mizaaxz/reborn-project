import arrayBufferToHex from "array-buffer-to-hex";
import { TextEncoder } from "util";
import SHA256 from "fast-sha256";
import Vec2 from "vec2";
import { Packet } from "../packet/Packet";
import { PacketFactory } from "../packet/PacketFactory";
import { PacketType } from "../packet/PacketType";
import Client from "./Client";
import { getGame } from "../game/Game";
import config from "../config";
import Player from "./Player";

enum SkinColor {
  Light1 = 2,
  Light2 = 0,
  Light3 = 1,
  Pink = 3,
  White,
  Red,
  Black,
  Purple,
  Blue,
  Green,
}

export enum Animals {
  cow,
  pig,
  bull,
  bully,
  wolf,
  quack,
  moostafa,
  treasure,
  moofie,
  moofieball,
  crateWood,
  crateStone,
  crateFood,
  crateGold,
  sheep,
}
export enum Biomes {
  main,
  snow,
  river,
  desert,
  forest,
}

function eucDistance(a: number[], b: number[]) {
  return Math.hypot(...a.map((val, i) => val - b[i]));
}

function randomPos(width: number, height: number, min: number = 0) {
  return new Vec2(
    Math.floor(Math.random() * (width - min + 1)) + min,
    Math.floor(Math.random() * (height - min + 1)) + min
  );
}

function chunk<T>(arr: T[], len: number) {
  var chunks = [],
    i = 0,
    n = arr.length;

  while (i < n) {
    chunks.push(arr.slice(i, (i += len)));
  }

  return chunks;
}

interface Comparator<T> {
  (a: T, b: T): number;
}

interface Array<T> {
  stableSort(cmp?: Comparator<T>): Array<T>;
}

let defaultCmp: Comparator<any> = (a, b) => {
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
};

function stableSort<T>(array: T[], cmp: Comparator<T> = defaultCmp): T[] {
  let stabilized = array.map((el, index) => <[T, number]>[el, index]);
  let stableCmp: Comparator<[T, number]> = (a, b) => {
    let order = cmp(a[0], b[0]);
    if (order != 0) return order;
    return a[1] - b[1];
  };

  stabilized.sort(stableCmp);
  for (let i = 0; i < array.length; i++) {
    array[i] = stabilized[i][0];
  }

  return array;
}

function deg2rad(val: number) {
  return val * (Math.PI / 180);
}
function rad2deg(val: number) {
  return (val * 180) / Math.PI;
}

function Broadcast(text: string, to: Client | undefined) {
  let game = getGame();
  let packetFactory = PacketFactory.getInstance();
  if (game) {
    if (!to) {
      for (let client of game.clients) {
        client.socket.send(
          packetFactory.serializePacket(
            new Packet(PacketType.BROADCAST, [text])
          )
        );
      }
    } else {
      let client = to;
      client.socket.send(
        packetFactory.serializePacket(new Packet(PacketType.BROADCAST, [text]))
      );
    }
  }
}

function GetSessions() {
  let game = getGame();

  if (game) {
    let clients: {
      clientIPHash: string;
      playerName: string;
      playerID: number;
    }[] = [];

    for (let client of game.clients) {
      clients.push({
        clientIPHash: arrayBufferToHex(
          SHA256(new TextEncoder().encode(client.ip))
        ),
        playerName: client.player?.name || "unknown",
        playerID: client.player?.id || -1,
      });
    }
    return clients;
  } else return false;
}

function filter(text: string) {
  let allowed = config.alphabet.split("");
  let newtext = "";
  text.split("").forEach((char) => {});
}

export function testBiome(pos: Vec2): Biomes {
  if (pos.y <= config.biomeSize && pos.x <= config.biomeSize)
    return Biomes.snow;
  if (
    pos.y < config.mapScale / 2 + config.biomeSize / 8 &&
    pos.y > config.mapScale / 2 - config.biomeSize / 8
  )
    return Biomes.river;
  if (pos.y >= config.mapScale - config.biomeSize && pos.x <= config.biomeSize)
    return Biomes.desert;
  if (pos.x >= config.mapScale - config.biomeSize && pos.y <= config.biomeSize)
    return Biomes.forest;

  return Biomes.main;
}

export function peerName(player: Player, peer: Player) {
  if (player.client?.account?.adminLevel)
    return `\u3010${peer.id}\u3011 ${peer.name} (${
      peer.client?.account?.username || "Guest"
    })`;
  return player.client?.admin
    ? `\u3010${peer.id}\u3011 ${peer.name}`
    : peer.name;
}

export {
  SkinColor,
  eucDistance,
  randomPos,
  chunk,
  stableSort,
  deg2rad,
  rad2deg,
  Broadcast,
  GetSessions,
};
