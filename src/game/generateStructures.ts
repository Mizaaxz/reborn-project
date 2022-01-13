import config from "../config";
import GameObject from "../gameobjects/GameObject";
import { gameObjectSizes, GameObjectType } from "../gameobjects/gameobjects";
import { collideGameObjects } from "../moomoo/Physics";
import { Biomes, randomPos, testBiome } from "../moomoo/util";
import Game from "./Game";
import generateBossArena from "./generateBossArena";

let gameObjectTypes: { [key: number]: GameObjectType[] } = {};
gameObjectTypes[Biomes.main] = gameObjectTypes[Biomes.snow] = [
  GameObjectType.Tree,
  GameObjectType.Bush,
  GameObjectType.Mine,
  GameObjectType.GoldMine,
];
gameObjectTypes[Biomes.desert] = [
  GameObjectType.Bush,
  GameObjectType.Mine,
  GameObjectType.GoldMine,
];
gameObjectTypes[Biomes.river] = [GameObjectType.Mine];
gameObjectTypes[Biomes.forest] = [GameObjectType.Tree];

export default function generateStructures(game: Game) {
  outerLoop: for (let i = 0; i < 400; i++) {
    let location = randomPos(14400, 14400);
    let allowedTypes =
      gameObjectTypes[testBiome(location)] || gameObjectTypes[Biomes.main];
    let gameObjectType =
      allowedTypes[Math.floor(Math.random() * allowedTypes.length)];
    let sizes = gameObjectSizes[gameObjectType];

    if (gameObjectType == GameObjectType.GoldMine && Math.random() < 0.6) {
      i--;
      continue outerLoop;
    }

    if (sizes) {
      let size = sizes[Math.floor(Math.random() * sizes.length)];

      let newGameObject = new GameObject(
        game.getNextGameObjectID(),
        location,
        0,
        size,
        gameObjectType,
        gameObjectType == GameObjectType.Tree ||
        gameObjectType == GameObjectType.Bush
          ? size * 0.6
          : size,
        {},
        -1,
        -1,
        gameObjectType == GameObjectType.Bush &&
        testBiome(location) == Biomes.desert
          ? 35
          : 0
      );

      for (let gameObject of game.state.gameObjects) {
        if (collideGameObjects(gameObject, newGameObject)) {
          i--;
          continue outerLoop;
        }
      }
      game.state.gameObjects.push(newGameObject);
    }
  }

  generateBossArena(game);
}
