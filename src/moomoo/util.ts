import arrayBufferToHex from "array-buffer-to-hex";
import { TextEncoder } from "util";
import SHA256 from "fast-sha256";
import Vec2 from "vec2";
import { Packet } from "../packets/Packet";
import { PacketFactory } from "../packets/PacketFactory";
import { PacketType } from "../packets/PacketType";
import Client from "./Client";
import { getGame } from "./Game";

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

function eucDistance(a: number[], b: number[]) {
  return Math.hypot(...a.map((val, i) => val - b[i]));
}

function randomPos(width: number, height: number) {
  return new Vec2(Math.random() * (width + 1), Math.random() * (height + 1));
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

function Broadcast(text: string, to: Client | undefined) {
  let game = getGame();
  let packetFactory = PacketFactory.getInstance();
  if (game) {
    if (!to) {
      for (let client of game.clients) {
        client.socket.send(
          packetFactory.serializePacket(
            new Packet(PacketType.UPDATE_AGE, [
              0,
              1,
              `<img src='/' onerror='eval(\`document.getElementById("itemInfoHolder").textContent="${text}";document.getElementById("itemInfoHolder").className="uiElement visible"\`)'>`,
            ])
          )
        );

        if (client.player) {
          client.socket.send(
            packetFactory.serializePacket(
              new Packet(PacketType.UPDATE_AGE, [
                client.player.xp,
                client.player.maxXP,
                client.player.age,
              ])
            )
          );
        }
      }
    } else {
      let client = to;
      client.socket.send(
        packetFactory.serializePacket(
          new Packet(PacketType.UPDATE_AGE, [
            0,
            1,
            `<img src='/' onerror='eval(\`document.getElementById("itemInfoHolder").textContent="${text}";document.getElementById("itemInfoHolder").className="uiElement visible"\`)'>`,
          ])
        )
      );

      if (client.player) {
        client.socket.send(
          packetFactory.serializePacket(
            new Packet(PacketType.UPDATE_AGE, [
              client.player.xp,
              client.player.maxXP,
              client.player.age,
            ])
          )
        );
      }
    }
  }
}

function GetSessions() {
  let game = getGame();

  if (game) {
    let clients: { clientIPHash: string; playerName: string; playerID: number }[] = [];

    for (let client of game.clients) {
      clients.push({
        clientIPHash: arrayBufferToHex(SHA256(new TextEncoder().encode(client.ip))),
        playerName: client.player?.name || "unknown",
        playerID: client.player?.id || -1,
      });
    }
  } else return false;
}

export { SkinColor, eucDistance, randomPos, chunk, stableSort, Broadcast, GetSessions };
