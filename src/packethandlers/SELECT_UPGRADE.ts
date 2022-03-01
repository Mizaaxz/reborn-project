import weapons from "../definitions/weapons";
import { getGame } from "../game/Game";
import {
  getGroupID,
  getPrerequisiteItem,
  getPrerequisiteWeapon,
  PrimaryWeapons,
} from "../items/items";
import { getUpgrades, getWeaponUpgrades } from "../sanctuary/Upgrades";
import { Broadcast } from "../sanctuary/util";
import { Packet } from "../packet/Packet";
import { PacketHandler } from "../packet/PacketHandler";
import { PacketType } from "../packet/PacketType";

getGame()?.addPacketHandler(
  new PacketHandler(PacketType.SELECT_UPGRADE),
  (game, packetFactory, client, packet) => {
    if (!client.player || client.player.dead) Broadcast("Error: SELECT_WHILE_DEAD", client);

    if (client.player) {
      let item = packet.data[0] as number;
      let upgrades = getUpgrades(client.player.upgradeAge);
      let weaponUpgrades = getWeaponUpgrades(client.player.upgradeAge);

      if (item <= 17) {
        if (weaponUpgrades.includes(item)) {
          let preItem = getPrerequisiteWeapon(item);

          if (preItem) {
            if (!(client.player.weapon == preItem || client.player.secondaryWeapon == preItem))
              Broadcast("Error: NOT_EARNED_YET", client);
          }

          if (Object.values(PrimaryWeapons).includes(item)) {
            if (client.player.selectedWeapon == client.player.weapon)
              client.player.selectedWeapon = item;
            client.player.weapon = item;
          } else {
            if (client.player.selectedWeapon == client.player.secondaryWeapon)
              client.player.selectedWeapon = item;
            client.player.secondaryWeapon = item;
          }
        } else {
          Broadcast("Error: NOT_EARNED_FROM_TIERS", client);
        }
      } else {
        item -= weapons.length;
        if (upgrades.includes(item)) {
          let preItem = getPrerequisiteItem(item);

          if (preItem && !client.player.items.includes(preItem)) return;

          client.player.items[getGroupID(item)] = item;
        } else {
          Broadcast("Error: INVALID_ITEM", client);
        }
      }

      client.player.upgradeAge++;

      client.socket.send(
        packetFactory.serializePacket(new Packet(PacketType.UPDATE_ITEMS, [client.player.items, 0]))
      );

      let newWeapons: number[] = [client.player.weapon];

      if (client.player.secondaryWeapon != -1) newWeapons.push(client.player.secondaryWeapon);

      client.socket.send(
        packetFactory.serializePacket(new Packet(PacketType.UPDATE_ITEMS, [newWeapons, 1]))
      );

      if (client.player.age - client.player.upgradeAge + 1) {
        client.socket.send(
          packetFactory.serializePacket(
            new Packet(PacketType.UPGRADES, [
              client.player.age - client.player.upgradeAge + 1,
              client.player.upgradeAge,
            ])
          )
        );
      } else {
        client.socket.send(packetFactory.serializePacket(new Packet(PacketType.UPGRADES, [0, 0])));
      }
    } else {
      Broadcast("Error: SELECT_WHILE_DEAD", client);
    }
  }
);
