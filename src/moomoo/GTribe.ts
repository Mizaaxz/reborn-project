import db from "enhanced.db";
import { Account, getAccount, setAccount } from "./Account";

export interface GTribe {
  id: string;
  name: string;
  leader: string;
  members: string[];
  description: string;
  discord: string;
  queue: string[];
}

export function getGTribe(id: string, includeQueue: boolean = true) {
  let tribe = db.get(`gtribe_${id.toLowerCase()}`) as GTribe;
  if (tribe) {
    if (!tribe.queue) tribe.queue = [];
    return includeQueue ? tribe : ((tribe.queue = []), tribe);
  } else return null;
}
export function setGTribe(id: string, tribe: GTribe) {
  db.set(`gtribe_${id.toLowerCase()}`, tribe);
}
export function delGTribe(tribe: GTribe) {
  db.delete(`gtribe_${tribe.id.toLowerCase()}`);
  let accounts = [
    getAccount(tribe.leader),
    ...tribe.members.map((m) => getAccount(m)),
  ];
  accounts.forEach((acc) => {
    if (!acc) return;
    acc.gTribe = "";
    setAccount(acc.username, acc);
  });
}

export function getGTribeByOwner(owner: string) {
  let gotten = db
    .all()
    .filter((i) => i.key.startsWith("gtribe_"))
    .find((t) => (t.value as GTribe).leader == owner);
  return gotten ? (gotten.value as GTribe) : null;
}
export function getGTribeByMember(mem: string) {
  let gotten = db
    .all()
    .filter((i) => i.key.startsWith("gtribe_"))
    .find((t) => (t.value as GTribe).members.includes(mem));
  return gotten ? (gotten.value as GTribe) : null;
}

export function requestGTRibe(tribe: GTribe, account: Account) {}
export function joinGTribe(tribe: GTribe, account: Account) {
  tribe.members.push(account.username);
  setGTribe(tribe.id, tribe);
  account.gTribe = tribe.id;
  setAccount(account.username, account);
}

export function leaveGTribe(tribe: GTribe, account: Account) {
  tribe.members.splice(tribe.members.indexOf(account.username), 1);
  setGTribe(tribe.id, tribe);
  account.gTribe = undefined;
  setAccount(account.username, account);
}
