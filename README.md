# The Reborn Project

MooMoo Reborn was a reborn version of moomoo.io. It was shut down in January 2022 due to copyright issues.

This is the server-side code for MMRB. I am not going to release the clientside as it uses moomoo assets and design.

The Reborn Project utilizes a heavily modified version of [sanctuary](https://github.com/Picoseconds/sanctuary).

This (as well as sanctuary) is licensed under WTFPL, go crazy.

### How do I Use It?

You can't really play this currently, as there's no client. You'll need to make a client or adapt it to use the same packets and data as moomoo.

# Commands

Commands are documented in src/console.ts

### Player Selectors

- `*` - selects all players
- `**` - selects all players except yourself
- `[TribeName]` - selects all players in TribeName
- `ID,ID,etc` - selects all players matching the IDs

Use `+` as a replacement for spaces in player names.

# Packets & Data

The websocket URL is `/game`.
