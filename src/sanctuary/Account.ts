import { AdminLevel } from "./Admin";
import db from "enhanced.db";

type Account = {
  username: string;
  displayName: string;
  password: string;
  level?: number;
  admin?: boolean; // depreciated
  adminLevel?: AdminLevel;
  balance?: number;
  mootuber?: string;
  scores?: number[];
  createdAt?: number;
  kills?: number;
  deaths?: number;
  playTime?: number;
  gTribe?: string;
};

let AccountCache: Account[] = [];

export function getAccount(
  username: string,
  temp: boolean = false
): Account | null {
  let found = AccountCache.find((a) => a.username == username);
  if (found) return temp ? JSON.parse(JSON.stringify(found)) : found;
  let acc = db.get(`account_${username.replace(/ /g, "+")}`) as Account;
  if (acc) {
    // @ts-ignore
    if (acc.mootuber === true) delete acc.mootuber;
    AccountCache.push(acc);
    return getAccount(acc.username);
  } else return null;
}
export function setAccount(username: string, acc: Account) {
  return db.set(`account_${username.replace(/ /g, "+")}`, acc);
}

export { Account };
