# MooMoo Reborn (Server)

MooMoo Reborn is a reborn version of moomoo.io. It has most of the original features, and has some new ones.
The MooMoo Reborn server-side utilizes a modified version of [sanctuary](https://github.com/Picoseconds/sanctuary).

## Features

See [Issue #16](https://github.com/Picoseconds/sanctuary/issues/16) for a list of current features supported.

### Config Values

| Variable name            | Effect                                                                                                                    |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------- |
| PORT                     | The port that the server binds on, defaults to 3000.                                                                      |
| MAX_CPS                  | The CPS cap to use, defaults to 25.                                                                                       |
| PLAYER_NEARBY_RADIUS     | The radius that players can see other players in.                                                                         |
| GAMEOBJECT_NEARBY_RADIUS | The radius that players can see structures (this includes trees, bushes and all other naturally generated structures) in. |
| MODERATOR_PASSWORD       | See [Password Login System](#password-login-system)                                                                       |

## Moderation Commands

| Command                                                                      | Use                                                                                                                  |
| ---------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| set \<player id> \<health/food/wood/stone/kills/xp/gold> \<number>           | Sets the specified numerical attribute of a player to the specified number.                                          |
| tp \<1st player id> \<2nd player id>                                         | Teleports you to the first player specified. If second player specified, teleports the 1st player to teh 2nd player. |
| invisible [player id (defaults to yourself)]                                 | Toggles invisibility. You can see yourself, but others cannot see you.                                               |
| invincible [player id (defaults to yourself)]                                | Toggles invincibility.                                                                                               |
| promote \<player id>                                                         | Makes someone else a moderator.                                                                                      |
| ban \<player id>                                                             | Bans someone by IP address. Moderators cannot be banned.                                                             |
| kick \<player id>                                                            | Kicks a user.                                                                                                        |
| broadcast \<message>                                                         | Displays a message in the top left of everyone's screen (including yours).                                           |
| stop                                                                         | Stops the server.                                                                                                    |
| speed \<speed multiplier> [player id (defaults to yourself)]                 | Changes your speed.                                                                                                  |
| weaponVariant \<ruby/gold/diamond/normal> [player id (defaults to yourself)] | Changes the variant of the currently selected weapon of the player.                                                  |
| login \<password>                                                            | See [Password Login System](#password-login-system)                                                                  |

## REST API

Sanctuary implements a rudimentary REST API, with only two endpoints:

### `/api/v1/players`

Lists the currently connected clients. Output takes the following format (as a TypeScript type):

```ts
{
  'type': 'success' | 'error',
  'clients': { playerName: string = 'unknown', playerID: number = -1, clientIPHash: string }[] | undefined,
  'message': string | undefined
}
```

### `/api/v1/playerCount`

Reports the amount of currently connected clients. Output takes the following format (as a TypeScript type):

```ts
{
  'type': 'success' | 'error',
  'playerCount': number | undefined,
  'message': string | undefined
}
```
