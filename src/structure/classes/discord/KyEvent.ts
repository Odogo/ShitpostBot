import { ClientEvents } from "discord.js";
import { KyClient } from "./KyClient";

export class KyEvent<Key extends keyof ClientEvents> {
    constructor(public event: Key, public run: (...args: ClientEvents[Key]) => any) {}
}