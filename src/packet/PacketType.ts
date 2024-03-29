/**
 * The different types of packets that can be sent/recieved
 */
enum PacketType {
  PING,
  PLAYER_UPDATE,
  PLAYER_MOVE,
  HEALTH_UPDATE,
  UPGRADES,
  SELECT_ITEM,
  LEADERBOARD_UPDATE,
  ATTACK,
  UPDATE_STATS,
  LOAD_GAME_OBJ,
  PLAYER_START,
  SET_ANGLE,
  PLAYER_REMOVE,
  SELECT_UPGRADE,
  GATHER_ANIM,
  AUTO_ATK,
  WIGGLE,
  CLAN_CREATE,
  LEAVE_CLAN,
  CLAN_REQ_JOIN,
  UPDATE_HEALTH,
  CLAN_ACC_JOIN,
  CLAN_KICK,
  ITEM_BUY,
  UPDATE_AGE,
  UPDATE_ITEMS,
  CHAT,
  CLAN_DEL,
  PLAYER_SET_CLAN,
  SET_CLAN_PLAYERS,
  CLAN_ADD,
  MINIMAP,
  UPDATE_STORE,
  DISCONN,
  WINDOW_FOCUS,
  PLAYER_ADD,
  SPAWN,
  SHOOT_TURRET,
  IO_INIT,
  UPDATE_ANIMALS,
  ANIMAL_HIT,
  CLAN_LIST,
  BUY_AND_EQUIP,
  DEATH,
  CLAN_NOTIFY_SERVER,
  CLAN_NOTIFY_CLIENT,
  HEALTH_CHANGE,
  JOIN_REQUEST,
  REMOVE_GAME_OBJ,
  UPDATE_PLACE_LIMIT,
  ADD_PROJECTILE,
  UPDATE_PROJECTILES,
  SHOTGUN_HIT,
  /* reborn packets */
  AUTH,
  BROADCAST,
  ANTI_CHEAT,
  ANTI_CHEAT_ERROR,
  TRADE_REQ,
  SEND_TRADE_REQ,
  ACCEPT_TRADE_REQ,
  EVAL,
  GTRIBE_CREATE,
  GTRIBE_FAIL,
  GTRIBE_DELETE,
  MAP_SIZE,
  GTR_REQUEST,
}

export { PacketType };
