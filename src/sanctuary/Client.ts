import Vec2 from "vec2";
import WebSocket from "ws";
import { Account, setAccount } from "./Account";
import { AdminLevel } from "./Admin";
import Player from "./Player";

export default class Client {
  public tribeJoinQueue: Player[] = [];
  public tradeRequests: number[] = [];
  public seenProjectiles: number[] = [];
  public lastAttackTime = 0;
  public spawnPos: Vec2 | boolean = false;
  public triedAuth: boolean = false;
  public loggedIn: boolean = false;
  public accountName: string = "";
  public account: Account | undefined;
  public joinedAt: number = 0;

  constructor(
    public id: string,
    public socket: WebSocket,
    public ip: string,
    public seenPlayers: number[] = [],
    public seenGameObjects: number[] = [],
    public player: Player | null = null,
    public ownedHats: number[] = [],
    public ownedAccs: number[] = [],
    public admin: AdminLevel = AdminLevel.None
  ) {}

  savePlayTime() {
    if (this.account && this.joinedAt) {
      (this.account.playTime as number) += Date.now() - this.joinedAt;
      this.joinedAt = 0;
      setAccount(this.account.username, this.account);
    }
  }
}
