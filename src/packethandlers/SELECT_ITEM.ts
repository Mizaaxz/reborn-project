import { getItemCost, WeaponModes } from "../items/items";
import { getGame } from "../game/Game";
import { Broadcast, chunk } from "../moomoo/util";
import { PacketHandler } from "../packet/PacketHandler";
import { PacketType } from "../packet/PacketType";

getGame()?.addPacketHandler(
  new PacketHandler(PacketType.SELECT_ITEM),
  (game, packetFactory, client, packet) => {
    if (client.player && client.player.weaponMode !== WeaponModes.NoSelect) {
      let isWeapon = packet.data[1];

      if (isWeapon) {
        client.player.buildItem = -1;
        client.player.weaponMode = WeaponModes.None;

        if (client.player.weapon == packet.data[0])
          client.player.selectedWeapon = client.player.weapon;
        else if (client.player.secondaryWeapon == packet.data[0])
          client.player.selectedWeapon = client.player.secondaryWeapon;
        else Broadcast("Error: INVALID_WEAPON", client);
      } else {
        let item = client.player.items.filter((i) => i != undefined)[packet.data[0]];
        if (!item && item !== 0) return;
        let itemCost = getItemCost(item);
        let costs = chunk(itemCost, 2);

        for (let cost of costs) {
          switch (cost[0]) {
            case "food":
              if (client.player.food < cost[1]) return;
              break;
            case "wood":
              if (client.player.wood < cost[1]) return;
              break;
            case "stone":
              if (client.player.stone < cost[1]) return;
              break;
          }
        }

        if (client.player.buildItem == item) {
          client.player.buildItem = -1;
        } else {
          client.player.buildItem = item;
        }
      }
    }
  }
);
