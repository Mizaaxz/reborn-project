import GameObject from "../gameobjects/GameObject";
import { gameObjectSizes, GameObjectType } from "../gameobjects/gameobjects";
import { collideGameObjects } from "../moomoo/Physics";
import { randomPos } from "../moomoo/util";
import Game from "./Game";
import generateBossArena from "./generateBossArena";

export default function generateStructures(game: Game) {
  const gameObjectTypes = [
    GameObjectType.Tree,
    GameObjectType.Bush,
    GameObjectType.Mine,
    GameObjectType.GoldMine,
  ];
  const desertGameObjectTypes = [GameObjectType.Bush, GameObjectType.Mine, GameObjectType.GoldMine];
  const riverGameObjectTypes = [GameObjectType.Mine];

  outerLoop: for (let i = 0; i < 400; i++) {
    let location = randomPos(14400, 14400);
    let gameObjectType =
      location.y >= 12e3
        ? desertGameObjectTypes[Math.floor(Math.random() * desertGameObjectTypes.length)]
        : location.y < 7550 && location.y > 6850
        ? riverGameObjectTypes[Math.floor(Math.random() * riverGameObjectTypes.length)]
        : gameObjectTypes[Math.floor(Math.random() * gameObjectTypes.length)];
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
        gameObjectType == GameObjectType.Tree || gameObjectType == GameObjectType.Bush
          ? size * 0.6
          : size,
        {},
        -1,
        -1,
        gameObjectType == GameObjectType.Bush && location.y >= 12e3 ? 35 : 0
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
