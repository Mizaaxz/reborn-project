import { getItemCost, WeaponModes } from "../items/items";
import { getGame } from "../game/Game";
import { Broadcast, chunk } from "../sanctuary/util";
import { PacketHandler } from "../packet/PacketHandler";
import { PacketType } from "../packet/PacketType";
import { getHat } from "../sanctuary/Hats";

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
        if (
          packet.data[0] == undefined ||
          !client.player.items.includes(packet.data[0])
        )
          return;
        let item = packet.data[0];
        let itemCost = getItemCost(item);
        let costMult = getHat(client.player.hatID)?.buildMult || 1;
        let costs = chunk(itemCost, 2) as [string, number][];

        for (let cost of costs) {
          switch (cost[0]) {
            case "food":
              if (client.player.food < cost[1] * costMult) return;
              break;
            case "wood":
              if (client.player.wood < cost[1] * costMult) return;
              break;
            case "stone":
              if (client.player.stone < cost[1] * costMult) return;
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
